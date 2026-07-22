# Second Mind: post-competition roadmap

The Build Week submission is frozen at the `buildweek-submission` tag (commit
`22ad5a4`). `main` stays untouched until judging ends on 5 August 2026. All new
work happens on `post-buildweek` and other branches.

## Where this roadmap came from

The strongest input was observed behaviour, not invention: while building and
using AI tools day to day, the founder's natural workflow was to share
screenshots of messages to get help interpreting them and drafting replies.
That behaviour is the product pattern. Second Mind's job is to make that same
gesture produce durable, inspectable structure instead of ephemeral chat.

Target loop:

> Screenshot or paste → identify people → propose an evidence-linked event →
> user reviews and approves → timeline and relationship map update → help with
> understanding and drafting, grounded in the accumulated context.

## What already exists (shipped in the submission)

The prototype already covers most of what an outside observer would call
"phase 1 and 2":

- Screenshot capture with local, in-browser OCR
- An extraction review step where the user confirms or edits before saving
  (unknown dates stay unknown; nothing is silently asserted)
- Evidence-linked people, events, and timelines with visible provenance
- The five invariant reasoning lenses and Communication Studio
- Zero-cost deterministic judge path; paid API calls gated server-side
- 68/68 automated tests, 28/28 full-pipeline evals

## Phase A: LLM chat-archive import (the distinctive one)

Let a new user import their existing AI conversation history (ChatGPT export,
Claude export) and start with a proposed relationship map instead of an empty
app.

- Parse exported archives locally; distinguish user messages from assistant
  messages
- Detect people, projects, locations, dates, commitments, events; flag
  duplicate names and possible aliases
- Propose profiles, events, and timelines as **provisional**, with an
  approve / merge / rename / exclude / delete review flow
- Preserve provenance on every extracted claim. Assistant speculation must
  never silently become fact. Each item carries labels such as:
  - `User-stated` / `AI-inferred` / `Imported source text`
  - confidence, alternative readings, verification status
  - evidence link back to the source conversation and date
- Onboarding shape: import → private scan → "found N people, N events,
  N ongoing situations" → review → provisional map → later shares keep
  updating it

This phase fits the product thesis exactly (context before composition,
judgment stays human) and no mainstream tool does it well.

## Phase B: relationship graph depth

- Connections between people, not only person-to-user timelines
- Recurring patterns surfaced with confidence levels and evidence links
  ("this signal rests on three events; here they are")
- Questions over accumulated context, answered from the timeline rather than
  from the latest screenshot alone

## Phase C: share-first capture

- Design the capture flow around the mobile share sheet: any app → Share →
  Second Mind → "add this to X's timeline?" → optional help understanding or
  drafting
- Explicitly avoid direct integrations with private messaging platforms for
  now. User-directed sharing and imports only; no continuous surveillance of
  anyone's conversations.

## Standing constraints

- Local-first stays. Imports parse on-device or through the existing secure
  processing path; no new cloud storage of personal data.
- Paid API calls stay disabled by default and gated server-side.
- Demo and seed data stay **fictional**. Real names and real conversations
  from anyone's life never go into the repository, the demo data, or the
  screenshots.
- Every phase ships as a polished vertical slice with tests, states for
  empty / loading / error / uncertain, and README updates.
