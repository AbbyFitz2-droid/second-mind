# Second Mind Product Brief

## Product definition

Second Mind pairs a user-owned private relationship model with an
evidence-linked AI reasoning companion. It helps users understand and respond
to ambiguous real-world interactions without treating every message or
encounter as isolated.

It is not merely ChatGPT in an earbud or one long chat per person. Its
distinguishing feature is a user-controlled, structured model of people,
relationships, situations, commitments, evidence, interpretations, and goals.
The AI helps the user inspect and reason over that model; it does not own the
record or decide what the relationship means.

## Core problem

General AI assistants often produce socially plausible but contextually inaccurate responses because they lack relevant relationship history. They may merge separate events, confuse people, treat inferences as facts, or overlook the user’s boundaries and intentions.

Second Mind should reduce these mistakes by maintaining two connected systems.

## 1. Relationship map

Each person has an evolving, editable, user-controlled profile containing:

- Name and identity
- Relationship category
- Degree of closeness
- Degree of trust
- How the user met them
- Mutual connections
- Shared history
- Communication style
- Relevant language or cultural context
- User boundaries
- Current relationship state
- User goals for the relationship
- Confirmed observations
- Uncertain interpretations
- Meaningful interaction history
- Commitments and follow-through
- Outstanding and resolved issues

Closeness and trust must be represented separately. Relationships must not be treated as fixed.

## 2. Situation timeline

The system records separate events rather than merging them into one narrative.

Each situation may include:

- Date and time
- Location
- People present
- What happened
- Source of the information
- Relevant messages or media
- The user’s emotional response
- Interpretations
- Actions taken
- Unresolved questions
- Links to prior or later situations
- Commitments created or changed by the event
- Issue and appointment status changes

Commitments must distinguish `promised`, `scheduled`, `confirmed`, `delayed`,
`cancelled`, `missed`, `completed`, and `disputed`. A promise must never be
treated as a completed action.

Example:

- Sophy attended an exhibition.
- Abby did not attend the exhibition.
- Abby separately had dinner with Finn and Destiny.
- After the exhibition, Sophy and Marcus visited Abby’s apartment.
- Sophy made a sketch of Abby at the apartment.
- Marcus saw the apartment there and later asked how Abby had found it.

These must remain distinct but connected events.

## Epistemic separation

Second Mind must visibly distinguish:

- Confirmed fact
- Direct observation
- User-reported feeling
- User interpretation
- AI inference
- Alternative interpretation
- Uncertainty
- Outdated or contradicted information

An AI-generated interpretation must never automatically become trusted memory.

Each stored item should have:

- Source
- Timestamp
- Confidence
- Status
- People involved
- Situation involved
- User confirmation state

## Main user flow

The user provides a screenshot, message, voice description, or live-conversation excerpt.

Second Mind then:

1. Identifies the people involved.
2. Retrieves the smallest relevant portion of the relationship map.
3. Identifies or creates the relevant situation.
4. Separates fact, feeling, interpretation, and uncertainty.
5. Asks for the user’s current goal when needed.
6. Suggests an interpretation, action, or response.
7. Lets the user correct the context before anything is saved.
8. Updates the relationship map, commitment state, and situation timeline only
   with user approval.
9. Records later outcomes so the user can see whether a commitment was
   completed and whether a communication approach helped.

## Suggested interface

Create four main areas:

### Situation

A clear factual timeline of what occurred, together with outstanding issues,
commitments, appointments, and their current status.

### People

Relevant relationship profiles and connections.

### Interpretation

Known facts, possible meanings, emotional responses, alternative explanations, and uncertainty.

### Action

Goals and suggested next actions, including message drafting.

Possible goals include:

- Understand what happened
- Clarify intent
- Remain warm but cautious
- Build a friendship
- Create distance
- Set a boundary
- Avoid escalation
- Prepare for a conversation
- Reflect after an interaction

## Important failure modes

Design specifically against:

- Merging separate events
- Confusing people
- Relationship inflation
- Turning inference into fact
- Allowing one recent event to outweigh the full history
- Saving inaccurate AI summaries as memory
- Treating a promise, proposed appointment, or scheduled action as completed
- Losing the source of a commitment or status change
- Deciding that a contradiction proves deception
- Exposing information from one relationship in another
- Over-intervening
- Giving confident advice with insufficient context
- Interpreting cultural or language differences too confidently
- Reinforcing the user’s fears or assumptions without evidence

## MVP for the submission

Build a narrow prototype around ambiguous social conversations.

The MVP should allow the user to:

- Create people profiles
- Assign relationship type, closeness, and trust
- Add situations to a timeline
- Connect people to situations
- Paste a message or description
- Classify information into fact, feeling, interpretation, and uncertainty
- Choose a conversational goal
- Generate a context-aware response
- Edit or reject extracted context
- Compare a generic AI response with a Second Mind response
- Track at least one promise from statement through status changes
- Show an outstanding-items view with evidence provenance

Use fictionalised demonstration data rather than exposing private real-world information.

## Demo concept

Show one ambiguous incoming message.

First show the response produced without relational or situational context.

Then show the response produced after Second Mind retrieves:

- Who the person is
- How they know the user
- Prior interactions
- The event that explains the current message
- The user’s boundaries
- The user’s desired tone
- Uncertain interpretations

The contrast should make the product’s value immediately visible.

## Product principles

- Context before composition
- Augment rather than replace human reasoning
- User remains in control
- Privacy by design
- Minimal interruption
- Transparent inference
- Revisable memory
- Preserve ambiguity
- Retrieve only relevant context
- Relationships accumulate context, but interpretations remain revisable
- Promises and completed actions are different object types
- Every durable claim retains its source

## Future vision

A later version may operate through a phone and Bluetooth earbuds during user-initiated sessions.

It could support:

- Push to think
- Silent suggestions
- Clarity mode
- Reflection mode
- User-defined intervention rules
- Assistance during difficult conversations
- Post-conversation reflection
- Warnings when known personal boundaries or goals become relevant

The MVP must not attempt continuous listening. First prove the relationship map, situation timeline, and epistemic separation system.

## Current Codex task

Be critical rather than merely agreeable.

First inspect the existing repository and identify what already exists. Then propose the smallest architecture and implementation plan that can produce a convincing submission within two days.

Prioritise a working, polished demonstration over breadth. Do not implement continuous audio monitoring. Do not overwrite existing working code unnecessarily.

Identify:

- The simplest data model
- Necessary screens
- Reusable existing components
- Technical risks
- Privacy risks
- What should be mocked
- What must genuinely work
- A realistic sequence of implementation steps

Before coding, return:

1. Repository assessment
2. Proposed MVP scope
3. Proposed data schema
4. Screen flow
5. Implementation sequence
6. Explicit exclusions
7. Demo script
