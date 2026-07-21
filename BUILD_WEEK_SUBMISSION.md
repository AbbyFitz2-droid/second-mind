# OpenAI Build Week submission draft

## Second Mind by Cognisyn

**Tagline:** Context before composition. Think clearly. Stay yours.

### One-sentence description

Second Mind turns naturally captured conversations into a user-controlled,
evidence-linked relationship record, then helps people interpret and respond
without turning AI inference into fact or replacing human judgment.

## The problem

An ambiguous message never arrives in isolation, but general AI assistants often
treat it as if it does. They may overlook relationship history, confuse separate
events, merge closeness with trust, miss the user’s boundaries, or produce a
socially fluent response based on an unsupported interpretation.

Second Mind tests a different architecture:

- screenshots become structured records through local, reviewable extraction;
- people are explicit entities;
- relationships have separate closeness and trust;
- situations remain separate, timestamped events;
- context is selected and inspectable;
- fact, interpretation, alternative, and uncertainty are different object types;
- AI interpretations remain unreviewed until the user responds;
- the user’s goal shapes composition without allowing the model to decide intent.

## The working prototype

The primary experience starts with a screenshot. In the fictional capture demo,
Fran writes:

> “I’ve arranged the technician for tomorrow at 10. Please confirm.”

Second Mind reads the screenshot locally, extracts Fran, separates three
messages, identifies a scheduled action and an unresolved tap issue, and asks
only one useful relationship question. Because the screenshot contains times
but no calendar date, the event date remains visibly blank.

After review, the capture feeds the existing architecture: Fran becomes a
person, the conversation becomes a sourced situation, and promises become
editable commitments whose later outcomes remain distinct.

Users may also explore an ambiguous-message demonstration or launch Merlin’s
fictional multi-person pattern case:

> Gertrude asks whether Vargus has heard from Benedict and deletes the message.
> Two days later, Benedict asks Vargus not to invite Gertrude out.

Merlin does not conclude that the dynamic is romantic. It compares romantic
interest or tension, non-romantic friction, and ordinary social preference,
links every update to an event, and presents the result as a question to
clarify rather than a social verdict.

The interface has four connected areas:

1. **Situation** — a timeline of distinct prior events. The user chooses which
   events are relevant and can add a separate session event. A capture inbox
   converts screenshots into these same objects.
2. **People** — a relationship map with independently editable closeness, trust,
   boundaries, relationship type, and relationship goal.
3. **Interpretation** — direct facts, AI interpretations, alternative readings,
   and unresolved uncertainty. Merlin can also expose competing hypotheses,
   an event-by-event probability trail, and evidence controls. The user can
   accept, qualify, reject, downweight, or exclude model inputs.
4. **Action** — an isolated response beside a context-aware response, with the
   exact relationship and situation context used to produce the difference.

Changing the sender, goal, tone, trust, closeness, boundary, or selected timeline
events updates the comparison in place. The application never scrolls the user
away to another answer surface.

## Why it is different

Second Mind is not ChatGPT with a more empathic personality. Its differentiator
is a structured, revisable context architecture.

The product’s central rule is:

> An AI-generated interpretation must never automatically become trusted memory.

Its reasoning-lens rule is:

> Changing the cognitive operation must not silently change the reported facts.

Its capture principle is:

> Capture naturally. Structure invisibly. Ask only when the answer matters.

Exact person and situation IDs scope retrieval, preventing one relationship’s
history from entering another. The contextual response cites every context item
it used. Closeness affects warmth and trust affects how explicit a boundary may
need to be; neither is presented as evidence of another person’s intent.

Merlin’s engine is reusable rather than keyed to the fictional case ID. A
declared scenario can supply transparent priors and likelihoods; personal
workspaces use a conservative local rule set only after the user maps a
connection and records at least two multi-person events. The generic path never
introduces a romantic hypothesis without an explicit scenario model.

The Live Reasoning panel makes this architecture directly testable. Across
Think through, Pause & parse, Clarity, Reflect, and Challenge, the observation
layer stays fixed while the lens goal, competing readings, unknowns, and next
question change. Communication Studio then applies the selected context to six
authorship-preserving tools: Draft, Reply, Review, Rewrite, Predict, and Compare.

## Privacy and cost

- The demonstration uses fictional people and events.
- Personal maps and situations persist in browser local storage and can be
  deleted with a two-step control.
- Screenshot OCR runs locally in the browser using Tesseract.js.
- Retained source images are kept separately in local IndexedDB and can be
  removed per import.
- Missing dates remain unknown; upload time is never silently used as event time.
- The prototype storage is not encrypted, so the interface warns users not to
  add highly sensitive information.
- No cloud database is used.
- Paid API calls and transcription are disabled.
- The relationship-context comparison is deterministic and local.
- Resetting the case deletes all session-created state.

## Technical implementation

```text
Natural capture
  ├─ Screenshot
  ├─ Local OCR
  ├─ Confidence and provenance
  └─ Minimal user review
          ↓
Canonical relationship case
  ├─ People
  ├─ Relationships
  ├─ Situations
  ├─ Multi-person events
  └─ Epistemic claims
          ↓
Exact-ID context retrieval
          ↓
Reusable Merlin pattern engine
  ├─ competing hypotheses
  ├─ transparent likelihoods
  └─ user evidence adjustments
          ↓
Isolated vs contextual comparison
          ↓
User review and editable response
```

The prototype uses a small Node.js server, local Tesseract.js OCR, and a
responsive HTML, CSS, and JavaScript client. Automated tests cover capture
parsing, missing-date preservation, relationship dimensions, event separation,
cross-relationship isolation, inference status, context provenance, and
response changes caused by user goals.

## Ninety-second demo script

### 0:00–0:12 — Premise

> “People should not have to maintain an AI relationship database. Share the
> screenshot. Second Mind does the filing.”

Choose the fictional Fran screenshot.

### 0:12–0:38 — Natural capture

Show local OCR identify:

- Fran and three attributed messages;
- a scheduled technician;
- a still-open tap issue;
- the explicit request to confirm; and
- a practical tone labelled as interpretation.

> “The screenshot has times but no calendar date, so Second Mind leaves the
> date unknown. It never substitutes the upload date.”

### 0:38–0:58 — Existing architecture

Confirm the relationship and file the screenshot. Show Fran added to the
existing person model, the source-linked timeline event, and the two open
commitments.

Open **View source**.

> “Every structured claim keeps its evidence. The source can be removed, and
> every extracted record remains editable.”

### 0:58–1:18 — Reasoning and agency

Open **Action** and show the contextual response using the outstanding work,
without alleging dishonesty or motive. Change one commitment status.

> “Second Mind can organise the evidence and notice the pattern. The user still
> decides what happened, what matters, and what to say.”

### 1:18–1:30 — Close

> “The user selects the context, corrects the interpretation, and owns the
> response. Second Mind by Cognisyn. Think clearly. Stay yours.”

## Explicit exclusions

- Continuous listening
- Biometric face or voice recognition
- Emotion, deception, intent, or personality detection
- Production relationship storage
- Autonomous messaging
- Real personal data in the demonstration
- Custom hardware
