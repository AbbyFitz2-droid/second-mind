/**
 * Live reasoning bridge for the core context engine (/api/context-reason).
 *
 * Same division of labour as the Communication Studio bridge:
 * - Evidence retrieval stays local. `epistemic.facts` and `contextual.basis`
 *   are never touched here; they come from lib/context.mjs, which reads only
 *   what the user actually recorded.
 * - The judgment layer (the contextual reading, its explanation, response
 *   options, AI interpretations, alternative readings, uncertainties) can be
 *   produced live, under a strict schema, from the supplied facts only.
 * - Any live failure falls back to the deterministic result unchanged.
 */

const CONFIDENCE_LEVELS = ["low", "moderate", "high"];

export const CONTEXT_LIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "contextual_interpretation",
    "contextual_confidence_label",
    "contextual_explanation",
    "response_options",
    "interpretations",
    "alternatives",
    "uncertainties",
  ],
  properties: {
    contextual_interpretation: {
      type: "string",
      description:
        "The most likely reading of the incoming message, given the supplied facts. A possibility, not a verdict.",
    },
    contextual_confidence_label: {
      type: "string",
      description:
        "Honest scope, e.g. wording inspectable; the sender's private intent is not observable.",
    },
    contextual_explanation: {
      type: "string",
      description:
        "Plain-language explanation of why this reading follows from the supplied facts.",
    },
    response_options: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "text", "why", "recommended"],
        properties: {
          label: { type: "string" },
          text: { type: "string" },
          why: { type: "string" },
          recommended: { type: "boolean" },
        },
      },
    },
    interpretations: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "confidence"],
        properties: {
          text: { type: "string" },
          confidence: { type: "string", enum: CONFIDENCE_LEVELS },
        },
      },
    },
    alternatives: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
    },
    uncertainties: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
    },
  },
};

const GOAL_DESCRIPTIONS = {
  warm_boundary: "Remain warm while clearly keeping the user's stated boundary intact.",
  clarify_intent: "Find out what the other person actually meant before committing to a reading.",
  keep_distance: "Reply briefly and politely while creating more distance.",
  welcome_connection: "Welcome the connection and leave room for it to grow.",
  coordinate_practical: "Coordinate a concrete practical outcome with clear next steps.",
  create_record: "Create a clear, dated, factual record of what was said and promised.",
};

export function buildContextLiveInstructions({ goal, desiredTone }) {
  const goalLine = GOAL_DESCRIPTIONS[goal] || GOAL_DESCRIPTIONS.warm_boundary;
  return [
    "You are the core reasoning engine inside Second Mind, a tool that separates evidence from interpretation before helping someone respond to a message. The judgment stays theirs.",
    "Principles you must follow:",
    "- Use only the facts supplied below. Never invent a person, event, date, or claim that was not given to you.",
    "- Separate what was observed from what is interpreted. State interpretations as possibilities with honest confidence, never as settled fact.",
    "- Provide alternative readings that are genuinely different from each other, not restatements.",
    "- Confidence must be scoped honestly: the sender's wording can be inspected; their private intent cannot be observed.",
    "- Any stated boundary is an absolute constraint on every response option you propose.",
    "- Produce response options with real differences in approach (for example: warmer, more direct, more distant), not the same sentence reworded three times.",
    "- Mark exactly one response option as recommended, and justify why it fits the user's goal better than the others.",
    `- Desired tone: ${desiredTone || "warm"}.`,
    `- The user's goal: ${goalLine} Let this goal visibly shape which option is recommended; different goals must produce different recommendations.`,
  ].join("\n");
}

export function buildContextLiveInput({ person, facts, boundary, message }) {
  const sections = [];
  if (person) {
    const lines = [
      `Name: ${person.displayName}`,
      `Relationship: ${person.relationshipType || "not specified"}`,
      `Closeness ${person.closeness ?? "?"}/4 · Trust ${person.trust ?? "?"}/4`,
      `Current state: ${person.currentState || "not recorded"}`,
    ];
    if (boundary) lines.push(`Boundary: ${boundary}`);
    sections.push(`PERSON\n${lines.join("\n")}`);
  }
  if (facts?.length) {
    sections.push(
      `KNOWN FACTS, ALREADY RETRIEVED LOCALLY\n${facts
        .slice(0, 10)
        .map((fact) => `- [${fact.type}] ${fact.text} (${fact.source}, ${fact.confidence} confidence)`)
        .join("\n")}`,
    );
  }
  sections.push(`INCOMING MESSAGE\n${message || "(not provided)"}`);
  return sections.join("\n\n");
}

export function mergeContextLiveResult(deterministic, live, model) {
  const rawOptions = Array.isArray(live.response_options) ? live.response_options : [];
  const recommendedCount = rawOptions.filter((option) => option.recommended).length;
  const responseOptions = rawOptions.map((option, index) => ({
    id: `live-option-${index + 1}`,
    label: option.label,
    text: option.text,
    why: option.why,
    recommended:
      recommendedCount === 1 ? Boolean(option.recommended) : index === 0,
  }));
  const draft =
    responseOptions.find((option) => option.recommended)?.text ||
    responseOptions[0]?.text ||
    deterministic.contextual.draft;

  const interpretations = (live.interpretations || []).map((item, index) => ({
    id: `live-interpretation-${index + 1}`,
    type: "ai_inference",
    text: item.text,
    source: "Live reasoning",
    confidence: item.confidence,
    userConfirmation: "unreviewed",
  }));

  return {
    ...deterministic,
    contextual: {
      ...deterministic.contextual,
      interpretation: live.contextual_interpretation,
      confidenceLabel: live.contextual_confidence_label,
      explanation: live.contextual_explanation,
      responseOptions: responseOptions.length
        ? responseOptions
        : deterministic.contextual.responseOptions,
      draft,
    },
    epistemic: {
      ...deterministic.epistemic,
      interpretations: interpretations.length
        ? interpretations
        : deterministic.epistemic.interpretations,
      alternatives: live.alternatives?.length
        ? live.alternatives
        : deterministic.epistemic.alternatives,
      uncertainties: live.uncertainties?.length
        ? live.uncertainties
        : deterministic.epistemic.uncertainties,
    },
    meta: {
      ...deterministic.meta,
      source: "live",
      paidApiUsed: true,
      model,
    },
  };
}
