/**
 * Live reasoning bridge for the Communication Studio.
 *
 * Division of labour, by design:
 * - Evidence retrieval, writing mechanics, and deterministic checks stay
 *   local. Evidence selection must never be hallucinated.
 * - The judgment layer (observation, interpretations, confidence, the
 *   suggested adjustment and revision, alternatives) can be produced by the
 *   live model, under a strict schema, from the supplied context only.
 * - Any live failure falls back to the deterministic result unchanged.
 */

const CONFIDENCE_LEVELS = ["low", "moderate", "high"];

export const STUDIO_LIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "observation",
    "possible_interpretation",
    "alternative_interpretation",
    "confidence_label",
    "confidence_rationale",
    "suggested_adjustment",
    "revised_message",
    "alternatives",
  ],
  properties: {
    observation: {
      type: "string",
      description:
        "What the received message or brief literally contains, without interpretation.",
    },
    possible_interpretation: {
      type: "object",
      additionalProperties: false,
      required: ["text", "confidence"],
      properties: {
        text: { type: "string" },
        confidence: { type: "string", enum: CONFIDENCE_LEVELS },
      },
    },
    alternative_interpretation: {
      type: "object",
      additionalProperties: false,
      required: ["text", "confidence"],
      properties: {
        text: { type: "string" },
        confidence: { type: "string", enum: CONFIDENCE_LEVELS },
      },
    },
    confidence_label: {
      type: "string",
      description:
        "Honest scope of confidence, e.g. wording inspectable, reactions not observable.",
    },
    confidence_rationale: { type: "string" },
    suggested_adjustment: {
      type: "string",
      description:
        "One concrete, specific improvement to the draft, or why it already works.",
    },
    revised_message: {
      type: "string",
      description:
        "The improved message in the user's own voice. Adjust, do not replace.",
    },
    alternatives: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "text", "note"],
        properties: {
          label: { type: "string" },
          text: { type: "string" },
          note: { type: "string" },
        },
      },
    },
  },
};

const GOAL_DESCRIPTIONS = {
  warm_boundary:
    "Remain warm while clearly keeping the user's stated boundary intact.",
  clarify_intent:
    "Find out what the other person actually meant before committing to a reading.",
  keep_distance:
    "Reply briefly and politely while creating more distance.",
  welcome_connection:
    "Welcome the connection and leave room for it to grow.",
  coordinate_practical:
    "Coordinate a concrete practical outcome with clear next steps.",
  create_record:
    "Create a clear, dated, factual record of what was said and promised.",
};

const MODE_TASKS = {
  draft:
    "The user has described what they want to communicate. Write the message for them, in their voice, from that brief.",
  reply:
    "The user received the message shown. Propose a reply that serves their goal.",
  review:
    "The user wrote the draft shown. Review it against the context, then suggest one concrete adjustment and a revised version.",
  rewrite:
    "Rewrite the user's draft for clarity while preserving their meaning, tone, and voice.",
  predict:
    "Explore how the recipient might realistically read the user's draft. Offer genuinely different readings with honest confidence.",
  compare:
    "Produce up to three alternative versions of the draft in different registers, each with a short note on the trade-off.",
};

export function buildStudioLiveInstructions({ mode, goal, desiredTone }) {
  const goalLine =
    GOAL_DESCRIPTIONS[goal] || GOAL_DESCRIPTIONS.warm_boundary;
  const taskLine = MODE_TASKS[mode] || MODE_TASKS.review;
  return [
    "You are Merlin, the Communication Studio inside Second Mind, a tool that helps people communicate with context while the judgment stays theirs.",
    "Principles you must follow:",
    "- Separate what was observed from what is interpreted. Interpretations are labelled possibilities, never facts.",
    "- Use only the supplied person profile, context records, and messages. Never invent history, events, or facts.",
    "- Always provide an alternative interpretation that is genuinely different, not a restatement.",
    "- Confidence must be honest and scoped: wording can be inspected; other people's private reactions cannot be observed.",
    "- Stated boundaries are absolute constraints on anything you suggest.",
    "- Preserve the user's own voice. Adjust their words; do not replace their personality.",
    `- Desired tone: ${desiredTone || "warm"}.`,
    `- The user's goal: ${goalLine} Let this goal visibly shape the revised message; different goals must produce different replies.`,
    `Task: ${taskLine}`,
  ].join("\n");
}

export function buildStudioLiveInput({
  person,
  relevantContext,
  receivedMessage,
  draftReply,
  mode,
}) {
  const sections = [];
  if (person) {
    const lines = [
      `Name: ${person.displayName}`,
      `Relationship: ${person.relationshipType || "not specified"}`,
      `Closeness ${person.closeness ?? "?"}/5 · Trust ${person.trust ?? "?"}/5`,
      `Current state: ${person.currentState || "not recorded"}`,
    ];
    if (person.boundaries?.filter(Boolean).length) {
      lines.push(`Boundaries: ${person.boundaries.filter(Boolean).join(" | ")}`);
    }
    if (person.communicationNotes?.filter(Boolean).length) {
      lines.push(
        `Communication notes: ${person.communicationNotes.filter(Boolean).join(" | ")}`,
      );
    }
    if (person.relationshipGoals?.filter(Boolean).length) {
      lines.push(
        `Relationship goals: ${person.relationshipGoals.filter(Boolean).join(" | ")}`,
      );
    }
    sections.push(`PERSON\n${lines.join("\n")}`);
  }
  if (relevantContext?.length) {
    sections.push(
      `SELECTED CONTEXT RECORDS\n${relevantContext
        .slice(0, 8)
        .map((item) => `- [${item.kind || "record"}] ${item.text} (${item.source || "no source"})`)
        .join("\n")}`,
    );
  }
  sections.push(
    mode === "draft"
      ? `WHAT THE USER WANTS TO COMMUNICATE\n${receivedMessage || "(not provided)"}`
      : `RECEIVED MESSAGE\n${receivedMessage || "(not provided)"}`,
  );
  if (draftReply) {
    sections.push(`THE USER'S DRAFT\n${draftReply}`);
  }
  return sections.join("\n\n");
}

export function mergeStudioLiveResult(deterministic, live, model) {
  const alternatives = Array.isArray(live.alternatives) && live.alternatives.length
    ? live.alternatives.map((alternative, index) => ({
        id: `live-alternative-${index + 1}`,
        label: alternative.label,
        text: alternative.text,
        note: alternative.note,
      }))
    : deterministic.alternatives;
  return {
    ...deterministic,
    observation: live.observation,
    possibleInterpretation: {
      text: live.possible_interpretation.text,
      confidence: live.possible_interpretation.confidence,
    },
    alternativeInterpretation: {
      text: live.alternative_interpretation.text,
      confidence: live.alternative_interpretation.confidence,
    },
    confidence: {
      label: live.confidence_label,
      rationale: live.confidence_rationale,
    },
    suggestedAdjustment: live.suggested_adjustment,
    revisedMessage: live.revised_message,
    alternatives,
    meta: {
      ...deterministic.meta,
      source: "live",
      paidApiUsed: true,
      model,
    },
  };
}
