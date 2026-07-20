# Second Mind data and evaluation pipeline

Owner: Team Abby  
Contract version: 1.0.0

## Practical data flow

```text
Synthetic profile library        Natural user capture
          │                       ├─ screenshot
          │                       ├─ local OCR text
          │                       └─ user review
          ├────── same canonical records ────┤
          ▼                                  ▼
Versioned user-context input
  ├─ provenance and consent metadata
  ├─ current interaction
  ├─ exact sender ID
  ├─ selected situation IDs
  ├─ user-to-person relationship profiles
  ├─ explicit person-to-person connections, claims, and situations
  ├─ commitments and unresolved issues
  └─ capture metadata linked to local evidence
          │
          ▼
Exact-person context retrieval
          │
          ▼
Structured reasoning result
  ├─ literal observations
  ├─ AI interpretations
  ├─ alternatives and uncertainty
  ├─ personalized response options
  └─ exact context basis
          │
          ▼
Evaluation checks
  ├─ input and output contract validity
  ├─ expected intent
  ├─ epistemic separation
  ├─ cross-relationship isolation
  ├─ response diversity
  ├─ traceability
  └─ zero-cost compliance
          │
          ▼
JSON + JSONL + CSV + Markdown + browser report
```

The product interface is a consumer of the input and result contracts. Synthetic
evaluation data exercises the same shape that future user input will use, without
placing real personal information into the development repository.

## Screenshot capture adapter

Screenshot capture is an ingestion adapter, not a parallel product database.
After local OCR and user review, it writes the same canonical people, claims,
situations, issues, and commitment objects used by manual entry and reasoning.

The adapter follows these rules:

1. The original screenshot is evidence, not an interpretation.
2. OCR text remains editable before filing.
3. Speaker attribution and extracted findings carry confidence.
4. Tone is displayed as an AI interpretation and never written as a fact.
5. Calendar dates are parsed only when explicitly visible or supplied by the
   user. Upload time is recorded as `capturedAt`, never substituted for
   `occurredAt`.
6. Relative language such as “tomorrow at 10” remains a `dueExpression` when
   no calendar anchor exists.
7. Filing is explicit. Unreviewed extraction never becomes relationship memory.
8. The structured record retains a capture ID, source reference, and whether
   the image is still stored locally.
9. Removing an import removes the objects created from it and its local source
   blob without touching unrelated relationship records.

In the prototype, Tesseract.js runs in the browser. Structured records persist
in localStorage; optional source images persist separately in IndexedDB. No
image is sent to an AI API, and paid API access remains disabled.

## Source datasets

- `data/synthetic/relationship-profiles.v1.json` contains reusable fictional
  people and situations.
- `data/synthetic/evaluation-cases.v1.json` contains interactions, metadata,
  expected intent categories, and expected response-option coverage.
- Each case references a profile rather than copying an entire relationship
  history. This keeps source fixtures maintainable as the dataset grows.
- The runner adds an unrelated decoy relationship to every case. The evaluation
  fails if context from that relationship leaks into the result.

All source records are marked:

- `data_class: synthetic_evaluation`
- `synthetic: true`
- `consent_scope: synthetic_only`
- `pii_status: none`
- `created_by: Team Abby`

## Contracts

- `schemas/user-context-input.schema.json` is the ingestion boundary.
- `schemas/reasoning-result.schema.json` defines the output consumed by the UI
  and evaluation layer.
- `schemas/evaluation-case.schema.json` defines development fixtures and
  expected outcomes.

Schema versions are explicit. Breaking changes should produce a new version
rather than silently changing existing records.

`relationshipConnections` stores relationships between people other than the
user as separate versioned records. Each connection has two person IDs, a
user-authored relationship label, dynamic, strength, confidence, provenance,
and update timestamp. Confidence describes certainty in the mapping; it is not
trust and must not be presented as a diagnosis or hidden fact.

## Run and outputs

```bash
npm run eval
```

The runner writes:

- `reports/materialized-user-inputs.jsonl` — the exact normalized inputs sent
  through the pipeline.
- `reports/materialized-reasoning-results.jsonl` — complete structured results.
- `reports/team-abby-evaluation-report.json` — aggregate and row-level metrics.
- `reports/team-abby-evaluation-report.csv` — analysis-ready table.
- `reports/team-abby-evaluation-report.md` — compact human review.
- `public/evaluation-data.json` and a CSV copy — data for the standalone report
  at `/evaluation.html`.

JSONL is used for materialized records so the same flow can later stream or
batch large datasets without loading every record into one JSON array.

## Current evaluation gates

Each case must pass:

1. User-input contract validity.
2. Reasoning-result contract validity.
3. Expected intent classification.
4. Expected explicit-intent status.
5. Minimum response-option count.
6. Required response-direction coverage.
7. Unique response text.
8. Exactly one recommended response.
9. Fact/inference separation.
10. Exact-relationship isolation.
11. Context-basis traceability.
12. Zero paid API use.

Latency is measured and reported but is not yet a pass/fail gate because this
prototype runs locally and dataset size is still small.

## Merlin pattern reasoning

Merlin uses the same people, connection, situation, and claim objects rather
than creating a separate hidden memory store.

Two pattern paths are supported:

1. A fictional or evaluated scenario may declare versioned hypotheses, priors,
   event likelihood multipliers, caveats, and response directions.
2. A personal workspace can invoke conservative local pattern rules after the
   user explicitly maps a connection and records at least two selected events
   involving the same people.

The personal path uses broad hypotheses—affiliation, friction, and ordinary
coordination. It does not introduce romance, diagnosis, deception, or character
claims. Every contributing event remains visible. Users can use it as recorded,
downweight it, exclude it from the calculation, or remove it from context
without deleting the event.

The displayed probabilities are illustrative normalized belief weights. They
are not calibrated outcome probabilities. Automated tests cover:

- reuse of a declared model under an unseen case ID;
- conservative inference from a user-shaped multi-person case;
- recalculation after removing an event;
- recalculation after excluding evidence without deleting it; and
- preservation of competing explanations and non-conclusive language.

## Transition to real user inputs

Synthetic and real records should never share an unlabeled store. A production
ingestion service should:

1. Assign a pseudonymous user and workspace ID.
2. record consent scope and data provenance before accepting content;
3. validate the versioned input contract;
4. encrypt user data in transit and at rest;
5. keep raw audio separate from derived transcripts and delete it by default;
6. keep raw images separate from derived records, with explicit retention and
   per-import deletion;
7. retrieve context only from the selected user, person, and situation IDs;
8. write audit metadata without copying sensitive message content into logs;
9. support export, correction, retention limits, and deletion;
10. exclude user data from evaluation or training unless the user separately
   opts in; and
11. run new model or rule versions against synthetic and approved evaluation
    datasets before release.

The current local browser workspace is useful for prototyping, but it is not a
production data store and should not be treated as one.

## Expanding the dataset

Add a reusable profile when a genuinely different relationship context is
needed. Add evaluation cases for language variation, locale, ambiguity,
negation, adversarial wording, and difficult failure modes. Every production
correction should eventually become:

- a minimal synthetic regression case;
- an expected structured outcome;
- a named evaluation check where possible; and
- a release-blocking test if the failure could materially reduce trust.

## External conversational outcome benchmark

The ConvoKit Conversations Gone Awry corpus enters through a separate,
versioned adapter. It is not forced into the personal relationship-memory
contract because it contains public Wikipedia conversations, not user-authored
closeness, trust, boundary, or relationship-goal data.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-outcome.txt
npm run download:convokit
npm run eval:convokit
```

The download is stored under the ignored `data/external/` directory. The
evaluation writes:

- `reports/convokit-cga/outcome-report.json` — complete metrics and limitations;
- `reports/convokit-cga/outcome-metrics.csv` — all model/view measurements;
- `reports/convokit-cga/test-predictions.csv` — pseudonymous held-out outputs;
- `reports/convokit-cga/adapter-samples.jsonl` — balanced canonical examples;
- `reports/convokit-cga/schema-reconciliation.md` — field-by-field mapping; and
- `public/convokit-outcome-data.json` — the browser report data shown at
  `/convokit-outcomes.html`.

Three prediction cutoffs make the context trade-off explicit: the first
substantive turn, the first two substantive turns, and all available context
before the first labeled attack. On non-awry conversations, the final turn is
held out for the last view. Target annotations, derived toxicity, page
metadata, split labels, and future turns never enter model features.

Official train, validation, and test splits are preserved. Hyperparameters and
model family are selected on validation ROC-AUC; the untouched test split is
used only for the final reported metrics. The report includes accuracy and
confidence intervals, ROC-AUC and bootstrap intervals, matched-pair accuracy,
calibration error, confusion matrices, coefficients, and high-confidence
mistakes.

The target is narrow: a later crowdsourced personal-attack label in a Wikipedia
talk-page conversation. This benchmark must not be presented as a predictor of
danger, manipulation, intent, character, trustworthiness, or the outcome of
private spoken relationships.
