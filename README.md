# Second Mind by Cognisyn

> **Context before composition. Think clearly. Stay yours.**

Second Mind is a Build Week prototype of a private, user-controlled cognitive
companion. It turns naturally captured conversations into an evidence-linked
relationship record, then helps the user interpret and respond without turning
AI inference into fact or replacing human judgment.

**Category:** Apps for your life

## Elevator pitch

Share a conversation screenshot. Second Mind locally extracts the people,
messages, promises, unresolved issues, and available dates, files them into a
revisable relationship timeline, and shows how that context changes a possible
response. The user can inspect the evidence, correct the interpretation, and
decide what to say.

## Problem

Real messages arrive inside relationships and histories, but general assistants
usually receive one isolated prompt. They can overlook prior commitments, blend
separate people or events, mistake warmth for trust, and express uncertain
social interpretations with unjustified confidence. Asking users to manually
maintain a relationship database would solve the context problem by creating a
new usability problem.

## Solution

The primary product loop is:

> **Capture naturally. Structure invisibly. Ask only when the answer matters.**

Screenshot text recognition runs in the browser without a paid AI request.
Extracted facts remain linked to their source; tone remains an interpretation;
and a calendar date stays explicitly unknown when it is not visible or supplied
by the user.

## Key features

- **Natural capture:** browser-local OCR turns a screenshot into editable
  people, messages, situations, commitments, and issues.
- **Evidence-linked memory:** every extracted record retains its source and can
  be corrected or removed.
- **Unknown stays unknown:** a missing calendar date is never replaced with the
  upload date.
- **Relationship map:** people and multi-person dynamics are visible while
  closeness and trust remain independent dimensions.
- **Epistemic separation:** observations, interpretations, alternatives,
  confidence, and possible actions are distinct.
- **Context comparison:** an isolated response appears beside a response using
  the exact relationship and situation context selected by the user.
- **Merlin pattern view:** competing explanations, event-linked illustrative
  Bayesian updates, and editable evidence weighting remain visible and
  challengeable.
- **Commitment tracking:** promises, confirmations, delays, and completed
  outcomes remain separate states.
- **Zero-cost judge path:** the complete fictional demonstration works without
  an API key or paid request.

The prototype also includes **Merlin**, an evidence-linked pattern view. Merlin
compares multiple explanations for a recurring multi-person dynamic, shows how
each selected event changes an illustrative Bayesian update, and lets the user
use, downweight, or exclude evidence without deleting the original event.

Users can share a screenshot, review only consequential uncertainty, or use the
advanced controls to create people, build a multi-person relationship map, and
add distinct situations manually. Personal structured data is stored in the
current browser. Source screenshots may be retained separately in local
IndexedDB and can be removed with their import or from the privacy panel.

The core interface has four connected areas:

- **Situation:** a screenshot inbox, evidence-linked event timeline, and
  commitment workspace. Promises, confirmations, delays, and completed outcomes
  remain different states.
- **People:** a relationship map where closeness and trust remain independent.
- **Interpretation:** an epistemic review that keeps fact, uncertainty, and AI
  inference visibly distinct. When repeated multi-person context is available,
  Merlin adds competing hypotheses, an event-linked probability trail, and
  editable evidence weight.
- **Action:** an honest comparison between an isolated response and one based
  on the selected context.

This is intentionally not a general-purpose chatbot, personality profiler,
emotion detector, relationship judge, or decision-making agent.

The commitment and outcome vertical slice supports ongoing practical
relationships. It distinguishes promises from completed actions, retains source
provenance, surfaces follow-through concerns without declaring motive or
deception, and produces editable outstanding-item and evidence reports. Try it
from **Explore commitments demo** on the welcome screen, then change a status,
add a commitment, or choose **Create a clear factual record** to see the
contextual response update. See
[`research/LANDLORD_CASE_PRODUCT_INSIGHTS.md`](./research/LANDLORD_CASE_PRODUCT_INSIGHTS.md).

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000).

If you prefer pnpm, `pnpm install && pnpm start` uses the included lockfile.

The app defaults to zero-cost interactive demo mode. Even if an API key is
present, the server will not make paid requests unless paid access is explicitly
enabled in `.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-terra
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
PAID_API_ENABLED=false
DEMO_MODE=true
```

Leave `PAID_API_ENABLED=false` to guarantee that the prototype makes no OpenAI
API calls. Change it to `true` only when you deliberately want live reasoning
and transcription. The browser never receives the API key; paid requests, when
enabled, are made by the local server.

## Test

```bash
npm test
```

## Team Abby evaluation pipeline

Run the complete synthetic input → context retrieval → structured reasoning →
evaluation flow:

```bash
npm run eval
```

Then open
[http://localhost:3000/evaluation.html](http://localhost:3000/evaluation.html)
for the standalone table report. The report does not change or add clutter to
the user-facing product flow.

The repository includes versioned input, output, and evaluation schemas,
normalized fictional relationship profiles, 28 synthetic cases across 14
intent families, materialized JSONL records, and JSON/CSV/Markdown results.
See [DATA_PIPELINE.md](./DATA_PIPELINE.md) for the practical flow and the
requirements for transitioning from synthetic fixtures to real user-owned data.

## Prototype architecture

```text
Browser
  ├─ local screenshot OCR and review
  ├─ fictional or personal relationship map
  ├─ editable situation timeline
  ├─ source-linked commitments and issues
  ├─ explicit multi-person events
  ├─ explicit context and goal selection
  └─ POST /api/context-reason
        ↓
Local Node server
  ├─ exact person/situation ID retrieval
  ├─ cross-relationship isolation
  ├─ reusable declared or conservative inferred pattern model
  ├─ transparent evidence weighting
  ├─ deterministic zero-cost comparison
  └─ epistemically separated result
```

The fictional examples remain session-only. Personal structured records use
browser local storage for prototype continuity. Retained screenshot blobs use a
separate IndexedDB evidence store. Neither store is encrypted or sent to a cloud
database. Users should not enter highly sensitive information. Imported records
are reversible, and the two-step privacy deletion clears both local stores.

This is a prototype privacy posture, not a claim of end-to-end encryption or
production regulatory compliance.

## Models and AI components

- **GPT-5.6 Terra:** the optional paid reasoning path uses the OpenAI Responses
  API and returns a structured reasoning card. The model is configurable through
  `OPENAI_MODEL`.
- **gpt-4o-mini-transcribe:** the optional paid microphone transcription path,
  configurable through `OPENAI_TRANSCRIBE_MODEL`.
- **Tesseract.js 7:** local screenshot OCR used by the complete judge demo.
- **Local deterministic reasoning:** produces the inspectable isolated-versus-
  contextual comparison when paid access is disabled.
- **TF-IDF and logistic regression:** a separate research evaluation estimates
  conversational derailment risk on ConvoKit data; it is not used to judge
  personal relationships or infer intent.

The default demo deliberately keeps `PAID_API_ENABLED=false`. This is both a
cost safeguard and a reproducible baseline: judges can inspect exactly how
selected context changes the output without depending on a private key.

## How Codex and GPT-5.6 were used

Codex with GPT-5.6 was used throughout Build Week to turn the product thesis
into a working system: inspect the evolving repository, implement the
capture-to-context pipeline, reconcile schemas, build the epistemic result
contract, generate synthetic evaluation cases, test relationship isolation,
and repeatedly repair failures found in the browser.

The product also includes an optional GPT-5.6 Terra runtime path for structured
reasoning. The submitted judge path remains fully usable without paid API
access, while the environment flag makes the model-backed path explicit and
testable for reviewers who provide a key.

## Recommended demonstration

1. Select **Share a screenshot**, then **Try a fictional screenshot**.
2. Show local OCR extracting Fran, three messages, scheduled work, an open tap
   issue, and an explicit confirmation request.
3. Point out that the calendar date remains blank because no date is visible.
4. Answer the single useful relationship clarification, then file the record.
5. Show the existing architecture update: Fran appears as a person, the
   screenshot becomes a sourced situation, and two commitments remain open.
6. Open **View source**, then change a commitment status to show the evidence
   trail remains intact.
7. If time permits, open Merlin’s pattern demo to show that the same situation
   objects can also support competing explanations and evidence weighting.

## Optional OpenAI implementation

The earlier structured Reasoning Card endpoint remains available for
experimentation, but the relationship-context demonstration is deliberately
deterministic and makes no API calls. This keeps the proof testable without
cost and makes the effect of each selected context item inspectable.

See the current official documentation:

- [GPT-5.6 model guide](https://developers.openai.com/api/docs/guides/latest-model)
- [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)

## Privacy approach

- Personal structured records stay in browser local storage.
- Retained screenshot blobs stay in a separate local IndexedDB evidence store.
- Screenshot OCR runs locally.
- No cloud database is used.
- The API key, when supplied, remains on the local server.
- Paid model and transcription calls are opt-in and disabled by default.
- Imports and their retained sources can be removed.
- The UI warns that prototype storage is not encrypted and should not hold
  highly sensitive information.

## Future roadmap

1. Validate the capture-and-correction loop with consented testers.
2. Add encrypted, user-controlled export and backup before any production
   persistence.
3. Introduce optional GPT-5.6 reasoning behind explicit consent, structured
   outputs, citations, and evaluation gates.
4. Improve screenshot parsing across messaging platforms while preserving
   provenance and missing-data rules.
5. Only after trust and usefulness are demonstrated, explore user-triggered
   audio capture and wearable interfaces. Continuous listening is not an MVP
   requirement.

## Submission materials

- [SUBMISSION.md](./SUBMISSION.md) — final pitch, demo script, and
  differentiation.
- [CHECKLIST.md](./CHECKLIST.md) — completed and manual submission steps.
- [DATA_PIPELINE.md](./DATA_PIPELINE.md) — schemas, fixtures, evaluations, and
  transition to real user-owned data.
- [BUILD_WEEK_SUBMISSION.md](./BUILD_WEEK_SUBMISSION.md) — longer working
  submission narrative.
