# Second Mind — OpenAI Build Week submission

**Company:** Cognisyn  
**Category:** Apps for your life  
**Tagline:** Context before composition. Think clearly. Stay yours.

## 30-second pitch

An ambiguous message never arrives in isolation, but most AI assistants treat
it as if it does. Second Mind is a user-controlled cognitive companion that
turns naturally shared conversation screenshots into an evidence-linked,
revisable relationship timeline. It separates observation from interpretation,
shows its uncertainty, and compares an isolated reply with one based on the
context the user selected. It does not decide what another person intended or
tell the user what to do. It helps people think with better context while
keeping judgment and agency human.

## 2-minute demo script

### 0:00–0:15 — The problem

> “Real conversations have history. General assistants usually see one
> screenshot or one prompt, then produce a fluent answer from incomplete
> context. Second Mind is designed around a different question: can AI improve
> the user’s reasoning without becoming the decision-maker?”

On the welcome screen, choose **Share a screenshot**, then **Try a fictional
screenshot**.

### 0:15–0:45 — Capture naturally

> “People will not maintain a relationship database by hand. Second Mind does
> the filing.”

Show that the screenshot is processed locally and becomes:

- Fran and three attributed messages;
- a scheduled technician visit;
- an unresolved tap issue;
- an explicit request to confirm; and
- a practical tone clearly labelled as an interpretation.

Point to the empty calendar date.

> “There are times in the screenshot, but no calendar date, so the date stays
> unknown. Second Mind never silently substitutes the upload date.”

### 0:45–1:10 — Structure invisibly

Answer the one relationship clarification and file the capture.

> “The capture now feeds the same underlying architecture: Fran becomes a
> person, the exchange becomes a sourced situation, and promises become
> editable commitments. The original screenshot remains linked as evidence.”

Open **View source**, then show the relationship map and timeline.

### 1:10–1:35 — Reason with agency

Open **Action** and show the isolated response beside the contextual response.

> “The contextual answer can mention the actual outstanding work, but it cannot
> claim deception or motive. Every piece of context it used is visible. The
> user can change the goal, remove an event, correct a commitment, or ignore the
> suggestion entirely.”

Change one commitment status and show the response update.

### 1:35–1:50 — Codex and GPT-5.6

> “I used Codex with GPT-5.6 to build and test the capture pipeline, structured
> context architecture, epistemic result contract, and evaluation suite. The
> optional live reasoning path uses GPT-5.6 Terra through the Responses API.
> For reproducible judging, this demo defaults to a zero-cost deterministic
> path and needs no private key.”

### 1:50–2:00 — Close

> “Second Mind does not replace thought. It preserves the evidence, exposes the
> inference, and returns the decision to the person. Think clearly. Stay yours.”

## Innovation summary

Second Mind’s innovation is not a more personable chat interface. It is a
reasoning architecture with four connected layers:

1. **Natural capture** converts existing conversation artifacts into structured
   records with provenance and uncertainty.
2. **Explicit context** represents people, relationships, situations,
   commitments, boundaries, and goals as separate, editable objects.
3. **Epistemic discipline** prevents generated interpretation from becoming
   trusted memory automatically.
4. **Agency-preserving composition** shows the effect of context without
   deciding intent, character, diagnosis, or action for the user.

Closeness and trust remain separate. Missing information remains missing.
Context retrieval uses exact person and situation IDs to prevent histories from
bleeding across relationships. Merlin can compare hypotheses and show
event-linked illustrative Bayesian updates, but the user can challenge or
exclude every evidence item.

## Why this matters

People already use general AI systems to interpret messages, draft difficult
replies, and make sense of relationships. The risk is not only hallucinated
facts; it is persuasive social certainty built on partial context. Second Mind
tests whether a product can offer the usefulness people seek while making
evidence, uncertainty, alternatives, and user control part of the interface
rather than hidden prompt instructions.

The first practical audience is people managing recurring, evidence-heavy
relationships—landlords, service providers, collaborators, and personal
contacts—where remembering promises and communicating clearly matters more than
guessing personality.

## What differentiates Second Mind from ChatGPT

| General ChatGPT interaction | Second Mind |
| --- | --- |
| Starts from the current prompt | Starts from explicit, user-selected context |
| Conversation is the primary object | People, situations, evidence, and commitments are separate objects |
| Memory may be implicit | Every recalled item is inspectable and revisable |
| A screenshot is input for one answer | A screenshot becomes a sourced timeline record |
| Fluent interpretation may dominate | Observation, interpretation, alternatives, and confidence are separated |
| One generated response | Isolated and context-aware responses are compared |
| User must repeat relevant history | Local capture structures repeated history |
| Assistant is conversational by default | Companion remains quiet until asked |

Second Mind is therefore not “ChatGPT for relationships.” It is a
privacy-conscious context and reasoning layer intended to make any later model
interaction more grounded, legible, and subordinate to human judgment.

## Technical summary

```text
Screenshot
  → browser-local Tesseract.js OCR
  → editable capture review
  → canonical people / situation / commitment records
  → exact-ID context retrieval
  → deterministic or optional GPT-5.6 Terra reasoning
  → evidence-linked comparison
  → user correction or action
```

- Node.js server and responsive vanilla web client
- Browser localStorage plus IndexedDB source evidence
- Versioned JSON schemas and synthetic fixtures
- 54 automated tests
- 28/28 full-pipeline synthetic evaluations passing
- Paid API and transcription disabled by default

## Privacy summary

OCR, structured records, and the judge demonstration run locally. There is no
cloud database. Source images remain in local IndexedDB, records can be
removed, and API keys never enter browser code. The prototype plainly warns
that local storage is not encrypted and is not ready for sensitive production
data.
