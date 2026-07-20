# Landlord case: product insights

## Why this case matters

This imported conversation tests whether Second Mind is meaningfully better
than keeping one long ChatGPT chat for each person.

The case involves an ongoing practical relationship in which messages,
appointments, promises, repairs, evidence, boundaries, and unresolved work
accumulate over time. The user does not merely need a well-written reply. They
need an accurate account of what was promised, what happened, what remains
unresolved, and which interpretation is supported by the record.

The durable product insight is:

> People do not only need help writing the next message. They need help
> understanding what the next message means in the context of the relationship,
> while preserving an inspectable record of the events that produced that
> understanding.

This supports a sharper definition of Second Mind:

> Second Mind pairs a user-owned private relationship model with an
> evidence-linked AI reasoning companion.

The AI is not the database of record and does not own the narrative. It helps
the user inspect, interpret, update, and act on their own structured context.

## Why a dedicated product can outperform a long chat

A long general-purpose chat can be helpful, but its history is mostly
unstructured. Facts, corrected facts, promises, completed actions, and
interpretations can become buried or accidentally merged.

Second Mind should provide explicit, revisable objects:

- **People** — the parties involved and the user's relationship to each.
- **Events** — what happened, when, where, and who was involved.
- **Issues** — concrete unresolved matters that can have independent status.
- **Commitments** — what someone said they would do, with source and due date.
- **Appointments** — proposed, confirmed, rescheduled, cancelled, missed, or
  completed.
- **Evidence** — messages, screenshots, photographs, recordings, receipts, and
  user accounts, each with provenance.
- **Claims** — direct observations, reported statements, interpretations, and
  AI inferences as different types.
- **Boundaries** — conditions the user wants respected.
- **Goals** — the outcome the user is trying to achieve now.
- **Outcomes** — what followed a response and whether the situation changed.

The key state distinction is:

```text
mentioned → promised → scheduled → confirmed → completed
                 ├─ delayed
                 ├─ cancelled
                 ├─ missed
                 └─ disputed
```

The product must never treat “promised” as “completed.”

## Proposed reasoning flow

1. The user pastes a message, adds an event, uploads evidence, or records a
   user-initiated voice note.
2. Second Mind extracts draft people, events, issues, commitments, and dates.
3. The user confirms or corrects those objects before they become memory.
4. The system updates the relevant timeline and outstanding-items view.
5. Merlin retrieves only the smallest relevant evidence set.
6. It separates observation, interpretation, confidence, alternatives, and
   unknowns.
7. The user selects a goal such as:
   - coordinate a practical outcome;
   - preserve warmth;
   - set or restate a boundary;
   - create a factual written record;
   - de-escalate;
   - prepare an evidence bundle for the user's own review;
   - prepare material for professional advice.
8. Second Mind drafts optional responses that cite the context used.
9. The user edits or ignores the response.
10. Later events update the commitment status and provide feedback on whether
    the approach worked.

## Example output structure

### Observation

An appointment time was proposed before the user's availability was confirmed.

### Evidence

The timestamped proposal, the user's response, and the alternative times the
user supplied.

### Interpretation

The coordination process appears unreliable.

### Confidence

Moderate. The record supports a coordination problem but does not establish
the other person's motive.

### Alternatives

The other person may depend on a third-party contractor with limited
availability.

### Boundary

The user is willing to cooperate but does not want to cancel other commitments
for unconfirmed appointments.

### Goal

Resolve the outstanding practical issues with a clear written record and
minimum unnecessary negotiation.

## Product requirements created by this case

1. **Commitment tracking**
   Every commitment needs a speaker, source, timestamp, expected completion,
   current status, and links to later evidence.

2. **Correction propagation**
   Correcting a date, completion state, or identity must recompute every
   dependent summary and insight.

3. **Contradiction surfacing**
   The system may show that two claims conflict. It must not silently decide
   that a person lied.

4. **Outstanding-items view**
   Users should be able to see unresolved, scheduled, delayed, disputed, and
   completed items without reconstructing them from a message history.

5. **Evidence provenance**
   Every conclusion and generated report should link back to its source.

6. **Goal-specific communication**
   A response intended to preserve warmth should differ from one intended to
   set a boundary or create a formal record.

7. **Verified end products**
   The system should eventually generate an editable timeline, outstanding-item
   report, evidence index, meeting brief, or material for professional review.

8. **Cross-relationship learning with compartmentalisation**
   User-confirmed communication patterns may be compared across relationships,
   but private facts from one relationship must never leak into another.

## Strategic recommendation

This is a stronger long-term wedge than speculative social interpretation.
Practical ongoing relationships contain observable states, commitments, dates,
and outcomes that can be evaluated. They demonstrate clear value while reducing
the pressure to infer attraction, personality, deception, or hidden intent.

The existing Gertrude–Benedict demo remains useful for showing competing
hypotheses and uncertainty. A commitment-tracking case should become the next
vertical slice because it can prove that Second Mind reconstructs a timeline
more accurately and with less effort than an ordinary chat.

## Safety and privacy boundaries

- Do not present the system as legal advice.
- Do not decide whether another person is dishonest, malicious, negligent, or
  legally at fault.
- Keep original evidence distinct from user summaries and AI-derived claims.
- Require user review before generating a formal-looking report.
- Default to local or encrypted storage with explicit retention controls.
- Do not reuse sensitive relationship data for training or evaluation without
  separate, informed opt-in.
- Use fictional or thoroughly de-identified cases in demonstrations.

## Product test

> If Second Mind cannot reconstruct an ongoing relationship timeline more
> accurately, transparently, and with less user effort than a long general
> chat, it is not differentiated enough.
