# ConvoKit CGA-WIKI → Cognisyn schema reconciliation

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
4,188 conversations. In
2,088 awry conversations,
the attack is the final substantive turn; in
6, it occurs
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
