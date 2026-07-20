# Second Mind: Two-Day MVP Assessment and Plan

**Status:** Planning only  
**Constraint:** Produce a polished Build Week demonstration within two days without continuous listening, production persistence, or unnecessary rewrites.

## 1. Repository assessment

### What already works

The current repository is a coherent, dependency-free web prototype:

- A responsive, polished single-page interface in `public/`.
- A small Node HTTP server with no external runtime dependencies.
- Zero-cost local demo reasoning and optional server-side OpenAI integration.
- A claim parser that separates observations, feelings, interpretations, goals, questions, and uncertainty.
- A strict Reasoning Card schema for live model output.
- Epistemic cards for observations, inferences, alternatives, and unknowns.
- Progressive disclosure and card-level user corrections.
- Clarity, Challenge, Reflection, and Pause reasoning jobs.
- An ephemeral default with paid API calls disabled.
- Automated epistemic fixtures and behavioral tests.

These are valuable reusable foundations. The existing Reasoning Card should become the **Interpretation** area of the new prototype rather than being removed.

### What the current prototype proves

It proves that Second Mind can:

- structure a single user account;
- avoid turning interpretation into fact;
- preserve uncertainty;
- return authorship to the user;
- provide optional articulation help.

### What it does not yet prove

It does not demonstrate the new product’s central differentiator:

> Structured relationship and situation context produces a more accurate, useful response than treating an interaction in isolation.

The repository currently has:

- no person or relationship entities;
- no separation of closeness from trust;
- no situation timeline;
- no links between people, situations, and claims;
- no context retrieval;
- no user confirmation gate before memory updates;
- no generic-versus-contextual comparison;
- no persistent or in-session relationship state.

### Critical assessment

The new brief is not a small feature addition. It changes the prototype from a **single-turn reasoning instrument** into a **structured context system**.

Attempting full relationship CRUD, automated identity resolution, arbitrary message understanding, memory, retrieval, and live AI in two days would produce breadth without a convincing proof. The correct submission is a deliberately staged but functionally honest vertical slice built around one fictional ambiguous message.

## 2. Proposed MVP scope

Build one single-page **Context Case Workspace** around a fictional relationship scenario.

The demonstrable loop:

1. Load a fictional case containing people and distinct prior situations.
2. Paste or select one ambiguous incoming message.
3. Select the sender and the user’s current goal.
4. Review the smallest context set retrieved by the system.
5. Inspect fact, feeling, interpretation, and uncertainty.
6. Compare an isolated response with a context-aware response.
7. Edit, reject, or confirm extracted items.
8. Save only confirmed changes to the in-memory session.
9. Change one relationship value, goal, or included event and show the response update.

This is enough to prove:

- relationships are structured rather than flattened into a prompt;
- closeness and trust are independent;
- separate events remain separate;
- context selection is inspectable;
- interpretation does not automatically become memory;
- context changes the resulting response.

### Recommended fictional demo case

Incoming message:

> “No worries — I’ll leave you to it.”

Person:

- **Maya Chen**
- Relationship: new collaborator and emerging friend
- Closeness: low–moderate
- Trust: moderate
- Communication note: concise, often literal
- User boundary: no non-urgent work conversation after 8 p.m.
- User goal: remain warm while maintaining the boundary

Relevant prior situations:

1. The user told Maya earlier that day they would be offline that evening.
2. A project deadline changed, but no response was required that night.
3. Maya previously used “I’ll leave you to it” neutrally when ending a work exchange.

Uncertain interpretation:

- The new message could be neutral acknowledgment.
- It could also contain disappointment.
- The text alone does not decide between them.

Illustrative isolated response:

> “They may be disappointed or passive-aggressive. You could ask if everything is okay.”

Context-aware response:

> “Thanks for understanding — I’m offline tonight, but I’ll pick this up tomorrow morning.”

The contextual response preserves warmth and the user’s boundary without diagnosing Maya’s intent or soliciting unnecessary reassurance.

The comparison must be labelled honestly. In local demo mode, both outputs are illustrative deterministic outputs. If live API mode is enabled, both should use the same model and settings; the only changed variable should be the supplied context.

## 3. Simplest data schema

Use plain JavaScript objects held in session memory. Do not add a database, graph database, embeddings, or authentication.

```js
Person {
  id,
  displayName,
  relationshipType,
  closeness,          // 0–4
  trust,              // 0–4, independent from closeness
  metThrough,
  communicationNotes[],
  boundaries[],
  relationshipGoals[],
  currentState,
  createdAt,
  updatedAt
}

Situation {
  id,
  title,
  occurredAt,
  location,
  personIds[],
  sourceRefs[],
  eventClaimIds[],
  actionTaken,
  unresolvedQuestions[],
  relatedSituationIds[]
}

Claim {
  id,
  situationId,
  personIds[],
  type:
    "confirmed_fact" |
    "direct_observation" |
    "user_feeling" |
    "user_interpretation" |
    "ai_inference" |
    "alternative" |
    "uncertainty",
  text,
  source: {
    kind: "user_entry" | "message" | "demo_seed" | "ai",
    reference
  },
  confidence: "low" | "moderate" | "high" | null,
  status:
    "current" |
    "outdated" |
    "contradicted" |
    "corrected" |
    "rejected",
  userConfirmation:
    "unreviewed" |
    "confirmed" |
    "corrected" |
    "rejected",
  createdAt
}

Case {
  id,
  incomingText,
  senderPersonId,
  linkedSituationIds[],
  selectedContextIds[],
  currentGoal,
  desiredTone,
  draftClaims[],
  responseComparison: {
    isolated,
    contextual,
    contextualBasisIds[]
  }
}
```

### Important schema rule

An AI inference remains a `Claim` with `source.kind = "ai"` and `userConfirmation = "unreviewed"`. Confirmation may approve it as a useful interpretation, but it must never silently convert into a confirmed fact.

## 4. Necessary screen flow

Do not build four separate application routes. Use the existing single-page shell with four sequential areas and a compact case navigator.

### A. Case input

- Ambiguous incoming message
- Explicit sender selector
- Goal chips
- “Analyse with context” action

For the prototype, identity resolution is user-selected rather than automatic.

### B. Situation

- A chronological list of distinct event cards
- Person chips on each event
- Source and confirmation status
- Checkboxes for which events are relevant to the current reasoning job
- Add-situation control that genuinely creates a session event

### C. People

- Relevant profile cards only
- Relationship type
- Separate closeness and trust controls
- Boundaries and relationship goal
- Inline editing in session memory

### D. Interpretation

Reuse the existing Reasoning Cards:

- confirmed/directly observed;
- reported feeling;
- user interpretation;
- AI inference;
- alternatives;
- uncertainty.

Keep the existing card-level correction mechanism and add an explicit:

> Confirm selected context for this session

Nothing is saved before that action.

### E. Action

- Side-by-side or stacked isolated versus context-aware responses
- A visible list of the exact context items used
- Editable contextual draft
- Copy action
- “Change goal” and “Change included context” controls

On mobile, present the two responses sequentially rather than in columns.

## 5. Reusable existing components

Reuse:

- the top bar, brand, privacy dialog, typography, palette, and responsive shell;
- the existing text capture and character-count controls;
- the Reasoning Card grid as the Interpretation section;
- correction selects and progressive disclosure;
- Clarity and Challenge logic;
- local `/api/reason` endpoint and optional live API boundary;
- `parseClaims()` for initial epistemic classification;
- the zero-cost mode and security headers;
- existing fixtures and test structure.

Modify rather than replace:

- the two-mode rail becomes a compact case/context navigator;
- “What I understood” becomes the current goal and sender summary;
- the result lens bar becomes context/goal controls;
- the current local demo response receives selected structured context.

## 6. What must genuinely work

- People, situations, and claims exist as separate linked objects.
- Closeness and trust can be changed independently.
- Timeline events remain separate and ordered.
- The user can include or exclude specific context.
- The contextual response visibly cites the exact context it used.
- Changing the goal or context changes the contextual output.
- Users can correct or reject extracted claims.
- No context is committed until the user confirms it.
- Clear session deletes all session-created state.
- The complete demonstration works without an API key or paid call.
- Mobile layout and keyboard navigation remain usable.

## 7. What should be mocked

- Automatic person identification and entity resolution.
- Screenshot OCR and media ingestion.
- Voice transcription in zero-cost mode.
- Semantic/vector retrieval.
- Longitudinal persistence.
- Cloud synchronization.
- Multi-device support.
- Authentication and account recovery.
- Production encryption/key management.
- Automated cultural interpretation.
- Personalised model training.

Mocked behavior must be labelled. Do not imply that a seeded or deterministic local response came from live AI.

## 8. Technical risks

### The comparison could be a straw man

If the generic response is intentionally poor, the demonstration is not credible.

Mitigation: keep it reasonable and uncertainty-aware. In live mode, run the same model and instructions twice, changing only the presence of selected context.

### The demo could look hard-coded

A single seeded scenario may appear to be a slideshow.

Mitigation: make three variables genuinely interactive—goal, included events, and trust/closeness—and visibly update the response and its cited basis.

### Rule-based language understanding will remain brittle

The existing local parser is useful for demonstration but cannot reliably resolve arbitrary people and events.

Mitigation: require explicit sender selection and make extracted context editable. Do not claim automatic understanding.

### State complexity could destabilize the current app

Adding CRUD, routing, persistence, and retrieval simultaneously would increase failure risk.

Mitigation: use one in-memory store, seeded data, one route, and small pure selector functions covered by tests.

### Context can overwhelm the user

Relationship profiles and timelines can become another data-management job.

Mitigation: show only the two or three items retrieved for the current case. Put the full history behind disclosure.

## 9. Privacy risks

- Relationship data describes third parties who did not provide it.
- A context leak between people could cause direct interpersonal harm.
- Screenshots and messages may contain highly sensitive information.
- Persistent interpretations can become a grievance archive.
- A mistaken identity link can contaminate multiple situations.
- Deletion becomes harder once claims are duplicated or embedded.

Prototype mitigation:

- use fictional data only;
- keep all relationship and timeline state in memory;
- use explicit person selection;
- perform exact-ID retrieval rather than broad semantic retrieval;
- show every context item supplied to generation;
- require confirmation before session updates;
- support complete session deletion;
- prohibit diagnostic, deceptive, dangerousness, attraction, and character inferences.

## 10. Implementation sequence

### Day 1: Build the context proof

1. Freeze the existing reasoning behavior with current tests.
2. Add pure data-model and retrieval modules.
3. Add the fictional person, situation, and case seed.
4. Add tests proving:
   - closeness and trust remain independent;
   - situations are not merged;
   - retrieval cannot cross person IDs;
   - unreviewed AI inference cannot become confirmed fact.
5. Reshape the existing page into Situation, People, Interpretation, and Action sections.
6. Implement timeline context selection and profile editing in session memory.

### Day 2: Prove response improvement

1. Add explicit goal and desired-tone selection.
2. Add isolated and contextual response generation.
3. Show the exact context basis for the contextual response.
4. Connect the existing epistemic cards and correction flow.
5. Add the user confirmation gate and clear-session deletion.
6. Test mobile layout, accessibility, empty states, and state reset.
7. Rehearse and record the 90-second demonstration.

### Stop condition

If arbitrary profile creation threatens polish, keep “Add person” as a simple inline form and prioritise editable seeded data, event creation, context selection, and response comparison. Those operations test the central hypothesis more directly.

## 11. Explicit exclusions

- Continuous or ambient listening
- Smart glasses or custom hardware
- Automatic bystander recording
- Automatic person recognition
- Speaker diarization
- Emotion, deception, intent, or personality detection
- Diagnosis or character assessment
- Production database
- Vector database or embeddings
- Full relationship graph visualization
- Calendar, contacts, messaging, or social-media integrations
- Screenshot OCR
- Background notifications
- Autonomous actions or message sending
- Cross-device synchronization
- Real user data in the demonstration
- Clinical, legal, employment, or safety claims

## 12. Ninety-second demo script

### 0:00–0:10 — Problem

> “An ambiguous message does not arrive in isolation, but most AI treats it as if it does. Second Mind keeps relationship context structured, revisable, and under the user’s control.”

Show:

> “No worries — I’ll leave you to it.”

### 0:10–0:25 — Isolated response

Show the isolated interpretation and response.

> “Without context, several meanings are plausible. A generic assistant may invite reassurance or overread disappointment.”

### 0:25–0:45 — Inspect relevant context

Open **People**:

- Maya is a new collaborator and emerging friend.
- Closeness and trust are visibly separate.
- The user’s after-hours boundary is explicit.

Open **Situation**:

- Show the earlier notice.
- Show that tonight’s deadline is not urgent.
- Show Maya’s previous neutral use of the phrase.

> “These are separate events. Second Mind retrieves only the three items relevant to this message.”

### 0:45–1:02 — Epistemic separation

Open **Interpretation**:

- Fact: the message text and earlier notice.
- Interpretation: Maya may be disappointed.
- Alternative: it may be a literal acknowledgment.
- Unknown: tone and intent.

Reject the confident interpretation or mark it “needs context.”

> “An AI interpretation is visible, revisable, and never becomes trusted memory automatically.”

### 1:02–1:20 — Context-aware action

Open **Action** and show:

> “Thanks for understanding — I’m offline tonight, but I’ll pick this up tomorrow morning.”

Point to the context basis: boundary, prior notice, no urgent requirement, desired warm tone.

Change the goal from **remain warm while maintaining the boundary** to **clarify intent** and show the suggested response update.

### 1:20–1:30 — Agency and privacy

> “The user chooses the context, corrects the interpretation, and approves what changes. This fictional demo is ephemeral and makes no paid API calls.”

Close:

> “Second Mind by Cognisyn. Context before composition. Think clearly. Stay yours.”

## Final recommendation

Proceed with this constrained prototype.

Do not expand the existing app into a general relationship manager. The submission should prove one sharp claim:

> A user-controlled relationship map and situation timeline can produce a more appropriate response while preserving ambiguity and human agency.

If that contrast is not immediately visible in the first minute, additional features will not rescue the demonstration.
