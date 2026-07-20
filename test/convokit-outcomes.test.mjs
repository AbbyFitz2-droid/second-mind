import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const reportPath = new URL(
  "../reports/convokit-cga/outcome-report.json",
  import.meta.url,
);
const samplesPath = new URL(
  "../reports/convokit-cga/adapter-samples.jsonl",
  import.meta.url,
);

async function loadReport() {
  return JSON.parse(await readFile(reportPath, "utf8"));
}

test("ConvoKit benchmark uses an untouched official test split at zero API cost", async () => {
  const report = await loadReport();

  assert.equal(report.execution.paid_api_used, false);
  assert.equal(report.execution.mode, "local_zero_cost");
  assert.equal(report.execution.official_split_used, true);
  assert.equal(report.execution.validation_for_hyperparameters, true);
  assert.equal(report.execution.test_cases, 840);
  assert.deepEqual(report.corpus_profile.split_labels, {
    "test:awry": 420,
    "test:not_awry": 420,
    "train:awry": 1254,
    "train:not_awry": 1254,
    "val:awry": 420,
    "val:not_awry": 420,
  });
});

test("schema reconciliation validates every conversation without relationship invention", async () => {
  const report = await loadReport();

  assert.equal(report.corpus_profile.conversations, 4188);
  assert.equal(
    report.corpus_profile.source_utterances_including_section_headers,
    30021,
  );
  assert.equal(
    report.corpus_profile.source_speakers_including_section_headers,
    8069,
  );
  assert.equal(report.corpus_profile.participants, 8056);
  assert.equal(report.schema_reconciliation.canonical_records, 4188);
  assert.equal(report.schema_reconciliation.validation_errors, 0);
  assert.equal(report.corpus_profile.pair_split_mismatches, 0);
  assert.equal(report.corpus_profile.pages_in_multiple_splits, 0);
  assert.equal(report.schema_reconciliation.relationship_fields_invented, false);
  assert.equal(
    report.corpus_profile.awry_conversations_with_attack_before_final_turn,
    6,
  );
});

test("reported model family is selected by validation AUC, never test AUC", async () => {
  const report = await loadReport();

  assert.equal(report.metrics.length, 9);
  for (const view of [
    "first_turn",
    "opening_exchange",
    "pre_outcome",
  ]) {
    const candidates = report.metrics.filter((row) => row.view === view);
    const expected = candidates.reduce((best, row) =>
      row.selection_validation_auc > best.selection_validation_auc ? row : best,
    );
    assert.equal(report.selected_by_view[view].model, expected.model);
    assert.deepEqual(
      report.selected_by_view[view].accuracy_95_ci.length,
      2,
    );
    assert.deepEqual(
      report.selected_by_view[view].roc_auc_95_ci.length,
      2,
    );
  }
});

test("adapter samples are balanced across split and label and exclude attack turns from views", async () => {
  const records = (await readFile(samplesPath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  assert.equal(records.length, 12);
  const coverage = new Map();
  for (const record of records) {
    const key = `${record.source.official_split}:${record.outcome.label}`;
    coverage.set(key, (coverage.get(key) || 0) + 1);
    for (const participant of record.participants) {
      assert.equal(participant.source_id_hash.length, 16);
    }
    const attackTurnIds = new Set(
      record.turns
        .filter(
          (turn) => turn.outcome_annotation.contains_personal_attack,
        )
        .map((turn) => turn.id),
    );
    for (const view of Object.values(record.prediction_views)) {
      assert.equal(view.excludes_attack_turn, true);
      assert.equal(
        view.turn_ids.some((turnId) => attackTurnIds.has(turnId)),
        false,
      );
    }
  }
  assert.deepEqual(
    Object.fromEntries([...coverage.entries()].sort()),
    {
      "test:awry": 2,
      "test:not_awry": 2,
      "train:awry": 2,
      "train:not_awry": 2,
      "val:awry": 2,
      "val:not_awry": 2,
    },
  );
});
