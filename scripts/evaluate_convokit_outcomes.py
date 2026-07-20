"""Reconcile CGA-WIKI with Cognisyn and evaluate early outcome prediction.

The prediction target is conversation-level personal-attack derailment. Target
labels, per-turn attack annotations, source toxicity scores, section headers,
page metadata, and future turns are excluded from model inputs.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from convokit import Corpus
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import FeatureUnion
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = (
    ROOT
    / "data"
    / "external"
    / "convokit"
    / "conversations-gone-awry-corpus"
)
REPORT_DIR = ROOT / "reports" / "convokit-cga"
PUBLIC_REPORT = ROOT / "public" / "convokit-outcome-data.json"
PUBLIC_METRICS = ROOT / "public" / "convokit-outcome-metrics.csv"
SCHEMA_PATH = ROOT / "schemas" / "external-conversation-outcome.schema.json"

VIEWS = {
    "first_turn": "First substantive turn",
    "opening_exchange": "Opening two-turn exchange",
    "pre_outcome": "All substantive turns available before the outcome",
}
MODEL_CONFIGS = {
    "structural": {"text": False, "numeric": True},
    "lexical": {"text": True, "numeric": False},
    "combined": {"text": True, "numeric": True},
}
NUMERIC_FEATURES = [
    "turn_count",
    "speaker_count",
    "speaker_change_rate",
    "word_count",
    "mean_words_per_turn",
    "max_words_in_turn",
    "question_count",
    "exclamation_count",
    "second_person_count",
    "first_person_count",
    "negation_count",
    "politeness_count",
    "gratitude_count",
    "apology_count",
    "hedge_count",
    "all_caps_ratio",
    "mean_reply_delay_log_seconds",
]
TARGET_FIELDS = [
    "outcome.label",
    "outcome.attack_turn_index",
    "turns[].outcome_annotation",
    "utterance.meta.toxicity",
    "source.page_id",
    "source.page_title",
    "source.annotation_year",
    "source.official_split",
    "future_turns",
]


@dataclass
class FittedFeatures:
    text_vectorizer: FeatureUnion | None
    numeric_scaler: StandardScaler | None
    feature_names: list[str]


def stable_id(prefix: str, value: str, length: int = 16) -> str:
    digest = hashlib.sha256(f"cognisyn-cga-v1:{value}".encode()).hexdigest()
    return f"{prefix}{digest[:length]}"


def sorted_substantive_utterances(conversation: Any) -> list[Any]:
    utterances = [
        utterance
        for utterance in conversation.iter_utterances()
        if not bool(utterance.meta.get("is_section_header"))
    ]
    return sorted(
        utterances,
        key=lambda utterance: (
            float(utterance.timestamp)
            if utterance.timestamp is not None
            else float("inf"),
            str(utterance.id),
        ),
    )


def canonicalize_conversation(conversation: Any) -> dict[str, Any]:
    utterances = sorted_substantive_utterances(conversation)
    aliases: dict[str, str] = {}
    first_turn: dict[str, int] = {}
    source_to_alias: dict[str, str] = {}
    for index, utterance in enumerate(utterances, start=1):
        source_speaker = str(utterance.speaker.id)
        if source_speaker not in aliases:
            alias = f"speaker_{len(aliases) + 1:02d}"
            aliases[source_speaker] = alias
            first_turn[source_speaker] = index
        source_to_alias[str(utterance.id)] = aliases[source_speaker]

    turns = []
    attack_turn_index = None
    for index, utterance in enumerate(utterances, start=1):
        contains_attack = bool(
            utterance.meta.get("comment_has_personal_attack")
        )
        if contains_attack and attack_turn_index is None:
            attack_turn_index = index
        turns.append(
            {
                "id": str(utterance.id),
                "turn_index": index,
                "speaker_id": aliases[str(utterance.speaker.id)],
                "reply_to": (
                    str(utterance.reply_to)
                    if utterance.reply_to is not None
                    else None
                ),
                "timestamp": (
                    float(utterance.timestamp)
                    if utterance.timestamp is not None
                    else None
                ),
                "text": str(utterance.text or "").strip(),
                "outcome_annotation": {
                    "contains_personal_attack": contains_attack
                },
            }
        )

    reply_counts: Counter[tuple[str, str]] = Counter()
    for turn in turns:
        parent_speaker = source_to_alias.get(str(turn["reply_to"]))
        if parent_speaker and parent_speaker != turn["speaker_id"]:
            reply_counts[(turn["speaker_id"], parent_speaker)] += 1

    label_awry = bool(
        conversation.meta.get("conversation_has_personal_attack")
    )
    pre_outcome_end = (
        attack_turn_index - 1 if attack_turn_index is not None else len(turns) - 1
    )
    view_turns = {
        "first_turn": turns[:1],
        "opening_exchange": turns[:2],
        "pre_outcome": turns[:pre_outcome_end],
    }
    return {
        "schema_version": "1.0.0",
        "record_id": stable_id("cga-", str(conversation.id)),
        "metadata": {
            "data_class": "public_research_dataset",
            "synthetic": False,
            "provenance": "convokit_cga_wiki",
            "pii_status": "source_ids_pseudonymised",
            "language": "en",
            "prediction_eligible": len(turns) >= 3,
        },
        "source": {
            "dataset": "conversations-gone-awry-corpus",
            "conversation_id": str(conversation.id),
            "pair_id": str(conversation.meta.get("pair_id")),
            "page_id": conversation.meta.get("page_id"),
            "page_title": str(conversation.meta.get("page_title") or ""),
            "annotation_year": str(
                conversation.meta.get("annotation_year")
            ),
            "official_split": str(conversation.meta.get("split")),
        },
        "participants": [
            {
                "id": alias,
                "source_id_hash": stable_id(
                    "", source_speaker, length=16
                ),
                "first_turn_index": first_turn[source_speaker],
            }
            for source_speaker, alias in aliases.items()
        ],
        "turns": turns,
        "outcome": {
            "label": "awry" if label_awry else "not_awry",
            "verified": bool(conversation.meta.get("verified")),
            "pair_verified": bool(
                conversation.meta.get("pair_verified")
            ),
            "attack_turn_index": attack_turn_index,
        },
        "prediction_views": {
            view_name: {
                "turn_ids": [turn["id"] for turn in selected_turns],
                "excludes_attack_turn": not any(
                    turn["outcome_annotation"][
                        "contains_personal_attack"
                    ]
                    for turn in selected_turns
                ),
                "excluded_target_fields": TARGET_FIELDS,
            }
            for view_name, selected_turns in view_turns.items()
        },
        "cognisyn_bridge": {
            "people": [
                {
                    "id": participant["id"],
                    "display_name": participant["id"].replace("_", " ").title(),
                    "relationship_profile_available": False,
                }
                for participant in [
                    {
                        "id": alias,
                    }
                    for alias in aliases.values()
                ]
            ],
            "interaction_edges": [
                {
                    "from": source,
                    "to": target,
                    "reply_count": count,
                }
                for (source, target), count in sorted(reply_counts.items())
            ],
            "intentionally_unmapped": [
                "closeness",
                "trust",
                "boundaries",
                "relationship_goals",
                "persistent_memory",
                "real_life_identity",
            ],
        },
    }


def validate_canonical_record(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = {
        "schema_version",
        "record_id",
        "metadata",
        "source",
        "participants",
        "turns",
        "outcome",
        "prediction_views",
        "cognisyn_bridge",
    }
    if set(record) != required:
        errors.append("top_level_fields")
    if record.get("schema_version") != "1.0.0":
        errors.append("schema_version")
    turns = record.get("turns") or []
    if len(turns) < 3:
        errors.append("turn_count")
    turn_ids = {turn.get("id") for turn in turns}
    if len(turn_ids) != len(turns):
        errors.append("duplicate_turn_id")
    attack_indices = [
        turn["turn_index"]
        for turn in turns
        if turn["outcome_annotation"]["contains_personal_attack"]
    ]
    label_awry = record.get("outcome", {}).get("label") == "awry"
    if label_awry != bool(attack_indices):
        errors.append("outcome_consistency")
    expected_attack = attack_indices[0] if attack_indices else None
    if record.get("outcome", {}).get("attack_turn_index") != expected_attack:
        errors.append("attack_turn_index")
    for view_name, view in (record.get("prediction_views") or {}).items():
        if not set(view.get("turn_ids") or []).issubset(turn_ids):
            errors.append(f"{view_name}.turn_ids")
        selected = [
            turn for turn in turns if turn["id"] in view.get("turn_ids", [])
        ]
        if any(
            turn["outcome_annotation"]["contains_personal_attack"]
            for turn in selected
        ):
            errors.append(f"{view_name}.target_leakage")
        if view.get("excludes_attack_turn") is not True:
            errors.append(f"{view_name}.excludes_attack_turn")
    if any(
        len(participant.get("source_id_hash", "")) != 16
        for participant in record.get("participants") or []
    ):
        errors.append("participant_hash")
    return errors


def selected_turns(record: dict[str, Any], view_name: str) -> list[dict]:
    selected_ids = set(
        record["prediction_views"][view_name]["turn_ids"]
    )
    return [
        turn for turn in record["turns"] if turn["id"] in selected_ids
    ]


def feature_row(record: dict[str, Any], view_name: str) -> dict[str, Any]:
    turns = selected_turns(record, view_name)
    text = "\n".join(
        f"[{turn['speaker_id']}] {turn['text']}" for turn in turns
    )
    words_by_turn = [
        re.findall(r"\b[\w'-]+\b", turn["text"].lower())
        for turn in turns
    ]
    words = [word for turn_words in words_by_turn for word in turn_words]
    speakers = [turn["speaker_id"] for turn in turns]
    changes = sum(
        left != right for left, right in zip(speakers, speakers[1:])
    )
    delays = []
    for left, right in zip(turns, turns[1:]):
        if left["timestamp"] is None or right["timestamp"] is None:
            continue
        delays.append(max(0.0, right["timestamp"] - left["timestamp"]))
    caps_characters = sum(
        character.isupper() for turn in turns for character in turn["text"]
    )
    alpha_characters = sum(
        character.isalpha() for turn in turns for character in turn["text"]
    )
    word_counter = Counter(words)
    numeric = {
        "turn_count": len(turns),
        "speaker_count": len(set(speakers)),
        "speaker_change_rate": changes / max(1, len(speakers) - 1),
        "word_count": len(words),
        "mean_words_per_turn": len(words) / max(1, len(turns)),
        "max_words_in_turn": max(
            (len(turn_words) for turn_words in words_by_turn), default=0
        ),
        "question_count": text.count("?"),
        "exclamation_count": text.count("!"),
        "second_person_count": sum(
            word_counter[word]
            for word in ["you", "your", "yours", "yourself"]
        ),
        "first_person_count": sum(
            word_counter[word]
            for word in ["i", "me", "my", "mine", "we", "our", "ours"]
        ),
        "negation_count": sum(
            word_counter[word]
            for word in ["no", "not", "never", "nothing", "neither", "nor"]
        ),
        "politeness_count": sum(
            word_counter[word]
            for word in ["please", "kindly", "welcome", "appreciate"]
        ),
        "gratitude_count": sum(
            word_counter[word]
            for word in ["thanks", "thank", "grateful", "appreciated"]
        ),
        "apology_count": sum(
            word_counter[word]
            for word in ["sorry", "apologize", "apologies", "apologise"]
        ),
        "hedge_count": sum(
            word_counter[word]
            for word in [
                "maybe",
                "perhaps",
                "possibly",
                "seem",
                "seems",
                "think",
                "suppose",
            ]
        ),
        "all_caps_ratio": caps_characters / max(1, alpha_characters),
        "mean_reply_delay_log_seconds": (
            float(np.mean(np.log1p(delays))) if delays else 0.0
        ),
    }
    return {
        "record": record,
        "text": text,
        "numeric": [numeric[name] for name in NUMERIC_FEATURES],
        "label": int(record["outcome"]["label"] == "awry"),
    }


def text_vectorizer() -> FeatureUnion:
    return FeatureUnion(
        [
            (
                "word",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    ngram_range=(1, 2),
                    min_df=3,
                    max_df=0.98,
                    max_features=25_000,
                    sublinear_tf=True,
                ),
            ),
            (
                "char",
                TfidfVectorizer(
                    analyzer="char_wb",
                    lowercase=True,
                    ngram_range=(3, 5),
                    min_df=3,
                    max_features=20_000,
                    sublinear_tf=True,
                ),
            ),
        ]
    )


def fit_features(
    rows: list[dict[str, Any]],
    config: dict[str, bool],
) -> tuple[Any, FittedFeatures]:
    matrices = []
    names: list[str] = []
    vectorizer = None
    scaler = None
    if config["text"]:
        vectorizer = text_vectorizer()
        text_matrix = vectorizer.fit_transform(
            [row["text"] for row in rows]
        )
        matrices.append(text_matrix)
        names.extend(vectorizer.get_feature_names_out().tolist())
    if config["numeric"]:
        scaler = StandardScaler()
        numeric = scaler.fit_transform(
            np.asarray([row["numeric"] for row in rows], dtype=float)
        )
        matrices.append(csr_matrix(numeric))
        names.extend(f"numeric__{name}" for name in NUMERIC_FEATURES)
    matrix = matrices[0] if len(matrices) == 1 else hstack(matrices).tocsr()
    return matrix, FittedFeatures(vectorizer, scaler, names)


def transform_features(
    rows: list[dict[str, Any]],
    fitted: FittedFeatures,
) -> Any:
    matrices = []
    if fitted.text_vectorizer is not None:
        matrices.append(
            fitted.text_vectorizer.transform([row["text"] for row in rows])
        )
    if fitted.numeric_scaler is not None:
        numeric = fitted.numeric_scaler.transform(
            np.asarray([row["numeric"] for row in rows], dtype=float)
        )
        matrices.append(csr_matrix(numeric))
    return matrices[0] if len(matrices) == 1 else hstack(matrices).tocsr()


def labels(rows: list[dict[str, Any]]) -> np.ndarray:
    return np.asarray([row["label"] for row in rows], dtype=int)


def fit_model(
    train_rows: list[dict[str, Any]],
    validation_rows: list[dict[str, Any]],
    test_rows: list[dict[str, Any]],
    config: dict[str, bool],
) -> tuple[LogisticRegression, FittedFeatures, np.ndarray, float, float]:
    train_matrix, fitted_train = fit_features(train_rows, config)
    validation_matrix = transform_features(validation_rows, fitted_train)
    y_train = labels(train_rows)
    y_validation = labels(validation_rows)
    candidate_cs = [0.25, 1.0, 4.0]
    validation_scores = []
    for c_value in candidate_cs:
        candidate = LogisticRegression(
            C=c_value,
            max_iter=1_000,
            solver="liblinear",
            random_state=42,
        )
        candidate.fit(train_matrix, y_train)
        probability = candidate.predict_proba(validation_matrix)[:, 1]
        validation_scores.append(
            (roc_auc_score(y_validation, probability), c_value)
        )
    best_validation_auc, best_c = max(validation_scores)

    development_rows = train_rows + validation_rows
    development_matrix, fitted_final = fit_features(
        development_rows, config
    )
    test_matrix = transform_features(test_rows, fitted_final)
    model = LogisticRegression(
        C=best_c,
        max_iter=1_000,
        solver="liblinear",
        random_state=42,
    )
    model.fit(development_matrix, labels(development_rows))
    probabilities = model.predict_proba(test_matrix)[:, 1]
    return (
        model,
        fitted_final,
        probabilities,
        best_c,
        float(best_validation_auc),
    )


def wilson_interval(successes: int, total: int) -> list[float]:
    if total == 0:
        return [0.0, 0.0]
    z = 1.959963984540054
    proportion = successes / total
    denominator = 1 + z * z / total
    centre = (proportion + z * z / (2 * total)) / denominator
    spread = (
        z
        * math.sqrt(
            proportion * (1 - proportion) / total
            + z * z / (4 * total * total)
        )
        / denominator
    )
    return [round(centre - spread, 4), round(centre + spread, 4)]


def bootstrap_auc_interval(
    y_true: np.ndarray,
    probabilities: np.ndarray,
    samples: int = 500,
) -> list[float]:
    rng = np.random.default_rng(42)
    scores = []
    for _ in range(samples):
        indices = rng.integers(0, len(y_true), len(y_true))
        if len(np.unique(y_true[indices])) < 2:
            continue
        scores.append(roc_auc_score(y_true[indices], probabilities[indices]))
    return [
        round(float(np.percentile(scores, 2.5)), 4),
        round(float(np.percentile(scores, 97.5)), 4),
    ]


def pairwise_accuracy(
    rows: list[dict[str, Any]], probabilities: np.ndarray
) -> tuple[float, int]:
    probability_by_source_id = {
        row["record"]["source"]["conversation_id"]: float(probability)
        for row, probability in zip(rows, probabilities)
    }
    results = []
    for row, probability in zip(rows, probabilities):
        if row["label"] != 1:
            continue
        pair_id = row["record"]["source"]["pair_id"]
        paired_probability = probability_by_source_id.get(pair_id)
        if paired_probability is None:
            continue
        if probability > paired_probability:
            results.append(1.0)
        elif probability == paired_probability:
            results.append(0.5)
        else:
            results.append(0.0)
    return (float(np.mean(results)) if results else 0.0, len(results))


def metric_row(
    view_name: str,
    model_name: str,
    test_rows: list[dict[str, Any]],
    probabilities: np.ndarray,
    selected_c: float,
    selection_validation_auc: float,
) -> dict[str, Any]:
    y_true = labels(test_rows)
    predictions = (probabilities >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, predictions).ravel()
    pair_accuracy, pair_count = pairwise_accuracy(
        test_rows, probabilities
    )
    correct = int((predictions == y_true).sum())
    return {
        "view": view_name,
        "view_label": VIEWS[view_name],
        "model": model_name,
        "selected_c": selected_c,
        "selection_validation_auc": round(selection_validation_auc, 4),
        "test_cases": len(test_rows),
        "accuracy": round(accuracy_score(y_true, predictions), 4),
        "accuracy_95_ci": wilson_interval(correct, len(test_rows)),
        "balanced_accuracy": round(
            balanced_accuracy_score(y_true, predictions), 4
        ),
        "f1": round(f1_score(y_true, predictions), 4),
        "precision": round(precision_score(y_true, predictions), 4),
        "recall": round(recall_score(y_true, predictions), 4),
        "roc_auc": round(roc_auc_score(y_true, probabilities), 4),
        "roc_auc_95_ci": bootstrap_auc_interval(y_true, probabilities),
        "brier_score": round(brier_score_loss(y_true, probabilities), 4),
        "pairwise_accuracy": round(pair_accuracy, 4),
        "pair_count": pair_count,
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    }


def top_coefficients(
    model: LogisticRegression,
    fitted: FittedFeatures,
    count: int = 12,
) -> dict[str, list[dict[str, Any]]]:
    coefficients = model.coef_[0]
    positive_indices = np.argsort(coefficients)[-count:][::-1]
    negative_indices = np.argsort(coefficients)[:count]

    def format_indices(indices: Iterable[int]) -> list[dict[str, Any]]:
        return [
            {
                "feature": fitted.feature_names[int(index)],
                "coefficient": round(float(coefficients[int(index)]), 4),
            }
            for index in indices
        ]

    return {
        "associated_with_awry": format_indices(positive_indices),
        "associated_with_not_awry": format_indices(negative_indices),
    }


def outcome_profile(records: list[dict[str, Any]]) -> dict[str, Any]:
    split_counts = Counter(
        record["source"]["official_split"] for record in records
    )
    label_counts = Counter(record["outcome"]["label"] for record in records)
    split_labels = Counter(
        (
            record["source"]["official_split"],
            record["outcome"]["label"],
        )
        for record in records
    )
    lengths = [len(record["turns"]) for record in records]
    by_source_id = {
        record["source"]["conversation_id"]: record for record in records
    }
    pair_split_mismatches = sum(
        by_source_id[record["source"]["pair_id"]]["source"][
            "official_split"
        ]
        != record["source"]["official_split"]
        for record in records
    )
    page_splits: defaultdict[Any, set[str]] = defaultdict(set)
    for record in records:
        page_splits[record["source"]["page_id"]].add(
            record["source"]["official_split"]
        )
    return {
        "conversations": len(records),
        "turns": sum(lengths),
        "source_utterances_including_section_headers": None,
        "source_speakers_including_section_headers": None,
        "participants": len(
            {
                participant["source_id_hash"]
                for record in records
                for participant in record["participants"]
            }
        ),
        "participant_roles_across_conversations": sum(
            len(record["participants"]) for record in records
        ),
        "labels": dict(label_counts),
        "splits": dict(split_counts),
        "split_labels": {
            f"{split_name}:{label}": count
            for (split_name, label), count in sorted(split_labels.items())
        },
        "turn_length": {
            "minimum": min(lengths),
            "median": float(np.median(lengths)),
            "mean": round(float(np.mean(lengths)), 3),
            "maximum": max(lengths),
        },
        "verified_conversations": sum(
            record["outcome"]["verified"] for record in records
        ),
        "awry_conversations_with_attack_on_final_turn": sum(
            record["outcome"]["label"] == "awry"
            and record["outcome"]["attack_turn_index"]
            == len(record["turns"])
            for record in records
        ),
        "awry_conversations_with_attack_before_final_turn": sum(
            record["outcome"]["label"] == "awry"
            and record["outcome"]["attack_turn_index"]
            != len(record["turns"])
            for record in records
        ),
        "pair_split_mismatches": pair_split_mismatches,
        "pages_in_multiple_splits": sum(
            len(splits) > 1 for splits in page_splits.values()
        ),
        "canonical_validation_errors": 0,
        "source_fields_excluded_from_model": TARGET_FIELDS,
    }


def error_examples(
    rows: list[dict[str, Any]],
    probabilities: np.ndarray,
    count: int = 5,
) -> dict[str, list[dict[str, Any]]]:
    examples = []
    for row, probability in zip(rows, probabilities):
        predicted = int(probability >= 0.5)
        if predicted == row["label"]:
            continue
        examples.append(
            {
                "record_id": row["record"]["record_id"],
                "actual": "awry" if row["label"] else "not_awry",
                "predicted_probability_awry": round(float(probability), 4),
                "opening_exchange": [
                    {
                        "speaker": turn["speaker_id"],
                        "text": re.sub(r"\s+", " ", turn["text"])[:280],
                    }
                    for turn in selected_turns(
                        row["record"], "opening_exchange"
                    )
                ],
            }
        )
    false_positives = sorted(
        [example for example in examples if example["actual"] == "not_awry"],
        key=lambda example: example["predicted_probability_awry"],
        reverse=True,
    )[:count]
    false_negatives = sorted(
        [example for example in examples if example["actual"] == "awry"],
        key=lambda example: example["predicted_probability_awry"],
    )[:count]
    return {
        "highest_confidence_false_positives": false_positives,
        "highest_confidence_false_negatives": false_negatives,
    }


def write_metrics_csv(rows: list[dict[str, Any]], path: Path) -> None:
    flat_rows = []
    for row in rows:
        flat = {
            key: (
                "|".join(str(value) for value in item)
                if isinstance(item, list)
                else item
            )
            for key, item in row.items()
        }
        flat_rows.append(flat)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(flat_rows[0]))
        writer.writeheader()
        writer.writerows(flat_rows)


def write_predictions_csv(
    predictions_by_view: dict[str, dict[str, Any]],
    test_rows_by_view: dict[str, list[dict[str, Any]]],
    path: Path,
) -> None:
    view_names = list(VIEWS)
    base_rows = test_rows_by_view[view_names[0]]
    output = []
    for index, row in enumerate(base_rows):
        record = row["record"]
        item = {
            "record_id": record["record_id"],
            "pair_record_id": stable_id(
                "cga-", record["source"]["pair_id"]
            ),
            "actual_outcome": record["outcome"]["label"],
            "official_split": record["source"]["official_split"],
        }
        for view_name in view_names:
            best = predictions_by_view[view_name]
            item[f"{view_name}_best_model"] = best["model"]
            item[f"{view_name}_probability_awry"] = round(
                float(best["probabilities"][index]), 6
            )
        output.append(item)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output[0]))
        writer.writeheader()
        writer.writerows(output)


def reconciliation_markdown(profile: dict[str, Any]) -> str:
    return f"""# ConvoKit CGA-WIKI → Cognisyn schema reconciliation

## Outcome

The source corpus remains an external research dataset. It is adapted into
`external-conversation-outcome.v1`, not forced into the personal relationship
memory contract.

| ConvoKit field | Canonical field | Treatment |
| --- | --- | --- |
| conversation `id` | `source.conversation_id` | Retained for provenance; Cognisyn record ID is hashed |
| `pair_id` | `source.pair_id` | Retained for matched-pair evaluation |
| `split` | `source.official_split` | Retained; never used as a model feature |
| `page_id`, `page_title` | `source.*` | Retained for audit; excluded from prediction |
| attack outcome | `outcome.label` | Evaluation target only |
| `verified`, `pair_verified` | `outcome.*` | Retained for quality analysis |
| utterance speaker | `participants[].source_id_hash` + local alias | Source username is pseudonymised |
| utterance text | `turns[].text` | Retained as research content |
| reply structure | `turns[].reply_to` + `cognisyn_bridge.interaction_edges` | Retained as interaction structure |
| section header | excluded | Source explicitly says to ignore for NLP |
| parsed document | not materialized | Bulky derived field remains in source corpus |
| toxicity score | not materialized | Derived field excluded to prevent prediction leakage |
| closeness, trust, boundary, relationship goal | intentionally unmapped | Corpus has no evidence for these fields |

## Prediction views

- `first_turn`: one substantive turn.
- `opening_exchange`: the first two substantive turns, matching the early
  forecasting concept in the source research.
- `pre_outcome`: every substantive turn before the first labeled attack in an
  awry conversation; for a non-awry conversation, the final turn is held out.

All views exclude the attack turn and all target annotations. The dataset has
{profile['conversations']:,} conversations. In
{profile['awry_conversations_with_attack_on_final_turn']:,} awry conversations,
the attack is the final substantive turn; in
{profile['awry_conversations_with_attack_before_final_turn']:,}, it occurs
earlier. Cutting at the first labeled attack prevents those edge cases from
leaking the target.

## Leakage controls

- Official train, validation, and test splits are used.
- All matched pairs stay in the same split.
- No Wikipedia page occurs in more than one split.
- Page metadata, source split, annotation year, toxicity, attack annotations,
  and future turns are excluded from features.
- Hyperparameter selection uses validation data; final metrics use the untouched
  test split.

## Interpretation boundary

This benchmark predicts a dataset-defined outcome: whether a Wikipedia talk
page conversation later contains a crowdsourced personal-attack label. It does
not predict whether a real person is dangerous, manipulative, or untrustworthy.
It is evidence about early textual forecasting in one online domain, not a
general social judgment model.
"""


def main() -> None:
    if not CORPUS_PATH.exists():
        raise SystemExit(
            "Corpus not found. Run .venv/bin/python "
            "scripts/download_convokit_cga.py first."
        )

    print("Loading ConvoKit CGA-WIKI corpus…")
    corpus = Corpus(filename=str(CORPUS_PATH))
    records = [
        canonicalize_conversation(conversation)
        for conversation in corpus.iter_conversations()
    ]
    validation_errors = {
        record["record_id"]: errors
        for record in records
        if (errors := validate_canonical_record(record))
    }
    if validation_errors:
        first_items = list(validation_errors.items())[:5]
        raise ValueError(f"Canonical validation failed: {first_items}")

    profile = outcome_profile(records)
    profile["source_utterances_including_section_headers"] = sum(
        1 for _ in corpus.iter_utterances()
    )
    profile["source_speakers_including_section_headers"] = sum(
        1 for _ in corpus.iter_speakers()
    )
    profile["canonical_validation_errors"] = len(validation_errors)
    split_records = {
        split_name: [
            record
            for record in records
            if record["source"]["official_split"] == split_name
        ]
        for split_name in ["train", "val", "test"]
    }

    metrics = []
    fitted_models: dict[str, dict[str, dict[str, Any]]] = {}
    predictions_by_view: dict[str, dict[str, Any]] = {}
    test_rows_by_view: dict[str, list[dict[str, Any]]] = {}
    for view_name, view_label in VIEWS.items():
        print(f"Evaluating {view_label}…")
        rows_by_split = {
            split_name: [
                feature_row(record, view_name)
                for record in split_records[split_name]
            ]
            for split_name in split_records
        }
        test_rows_by_view[view_name] = rows_by_split["test"]
        fitted_models[view_name] = {}
        view_metrics = []
        for model_name, config in MODEL_CONFIGS.items():
            (
                model,
                fitted,
                probabilities,
                selected_c,
                selection_validation_auc,
            ) = fit_model(
                rows_by_split["train"],
                rows_by_split["val"],
                rows_by_split["test"],
                config,
            )
            row = metric_row(
                view_name,
                model_name,
                rows_by_split["test"],
                probabilities,
                selected_c,
                selection_validation_auc,
            )
            metrics.append(row)
            view_metrics.append(row)
            fitted_models[view_name][model_name] = {
                "model": model,
                "fitted": fitted,
                "probabilities": probabilities,
            }
            print(
                f"  {model_name}: accuracy={row['accuracy']:.3f} "
                f"AUC={row['roc_auc']:.3f} pair={row['pairwise_accuracy']:.3f}"
            )
        best_metric = max(
            view_metrics,
            key=lambda row: row["selection_validation_auc"],
        )
        best_fitted = fitted_models[view_name][best_metric["model"]]
        predictions_by_view[view_name] = {
            "model": best_metric["model"],
            "probabilities": best_fitted["probabilities"],
        }

    opening_best_metric = max(
        [
            row
            for row in metrics
            if row["view"] == "opening_exchange"
        ],
        key=lambda row: row["selection_validation_auc"],
    )
    opening_best_fitted = fitted_models["opening_exchange"][
        opening_best_metric["model"]
    ]
    report = {
        "report_id": "team-abby-convokit-cga-outcome-v1",
        "schema_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": "Team Abby",
        "execution": {
            "mode": "local_zero_cost",
            "paid_api_used": False,
            "dataset": "conversations-gone-awry-corpus",
            "dataset_source": "ConvoKit CGA-WIKI",
            "model_family": "TF-IDF + structural features + logistic regression",
            "official_split_used": True,
            "validation_for_hyperparameters": True,
            "test_cases": len(split_records["test"]),
        },
        "corpus_profile": profile,
        "schema_reconciliation": {
            "source_schema": "ConvoKit Corpus",
            "canonical_schema": SCHEMA_PATH.name,
            "canonical_records": len(records),
            "validation_errors": len(validation_errors),
            "relationship_fields_invented": False,
            "speaker_source_ids_pseudonymised": True,
        },
        "metrics": metrics,
        "selected_by_view": {
            view_name: max(
                [row for row in metrics if row["view"] == view_name],
                key=lambda row: row["selection_validation_auc"],
            )
            for view_name in VIEWS
        },
        "opening_exchange_explainability": {
            "model": opening_best_metric["model"],
            "warning":
                "Coefficients are dataset associations, not causal social rules.",
            "top_coefficients": top_coefficients(
                opening_best_fitted["model"],
                opening_best_fitted["fitted"],
            ),
        },
        "opening_exchange_error_analysis": error_examples(
            test_rows_by_view["opening_exchange"],
            opening_best_fitted["probabilities"],
        ),
        "limitations": [
            "The target is a crowdsourced personal-attack label on Wikipedia talk pages, not general conversational success.",
            "Public online discussions differ substantially from private, spoken, and real-life relationships.",
            "Matched and balanced data makes accuracy interpretable here but does not reflect real-world base rates.",
            "Lexical associations can encode topic, community, demographic, and annotation artifacts.",
            "The model estimates risk; it does not establish intent, character, diagnosis, or causality.",
            "No prediction should trigger an irreversible or high-stakes action without human review.",
        ],
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_REPORT.parent.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / "outcome-report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    PUBLIC_REPORT.write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    (REPORT_DIR / "corpus-profile.json").write_text(
        json.dumps(profile, indent=2) + "\n", encoding="utf-8"
    )
    write_metrics_csv(metrics, REPORT_DIR / "outcome-metrics.csv")
    write_metrics_csv(metrics, PUBLIC_METRICS)
    write_predictions_csv(
        predictions_by_view,
        test_rows_by_view,
        REPORT_DIR / "test-predictions.csv",
    )
    sample_records = []
    for split_name in ["train", "val", "test"]:
        for label in ["awry", "not_awry"]:
            sample_records.extend(
                [
                    record
                    for record in split_records[split_name]
                    if record["outcome"]["label"] == label
                ][:2]
            )
    (REPORT_DIR / "adapter-samples.jsonl").write_text(
        "".join(json.dumps(record) + "\n" for record in sample_records),
        encoding="utf-8",
    )
    (REPORT_DIR / "schema-reconciliation.md").write_text(
        reconciliation_markdown(profile), encoding="utf-8"
    )
    print(f"Reports written to {REPORT_DIR}")


if __name__ == "__main__":
    main()
