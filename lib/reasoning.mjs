export const MODES = {
  think: {
    label: "Think through",
    job: "Help the user examine a situation or decision without choosing for them.",
  },
  pause: {
    label: "Pause & parse",
    job: "Help the user regain cognitive distance when emotion or pressure is making thought difficult.",
  },
  clarity: {
    label: "Clarity",
    job: "Help the user identify and articulate their own intended meaning without replacing their voice.",
  },
  reflect: {
    label: "Reflect",
    job: "Help the user examine an event after it happened, separating recollection from interpretation.",
  },
  challenge: {
    label: "Challenge",
    job: "Stress-test the user's current frame with contrary evidence and alternative explanations without arguing for a conclusion.",
  },
};

export const REASONING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    understood_goal: { type: "string" },
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["text", "evidence"],
      },
    },
    inferences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          confidence: {
            type: "string",
            enum: ["low", "moderate", "high"],
          },
          basis: { type: "string" },
        },
        required: ["text", "confidence", "basis"],
      },
    },
    alternatives: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          would_fit_if: { type: "string" },
        },
        required: ["text", "would_fit_if"],
      },
    },
    unknowns: {
      type: "array",
      items: { type: "string" },
    },
    reflection_question: { type: "string" },
    possible_wording: { type: "string" },
    agency_note: { type: "string" },
  },
  required: [
    "title",
    "understood_goal",
    "observations",
    "inferences",
    "alternatives",
    "unknowns",
    "reflection_question",
    "possible_wording",
    "agency_note",
  ],
};

export function buildInstructions(mode) {
  const selected = MODES[mode] ?? MODES.think;

  return `You power Second Mind, a cognitive instrument that augments the user's reasoning without replacing it.

CURRENT JOB
${selected.job}

EPISTEMIC CONTRACT
- Separate what the user directly reported from what you infer.
- An observation must cite a short exact phrase or plainly identify the supplied fact that supports it.
- Never convert self-report into identity: "I felt hesitant" does not mean "you are hesitant."
- Never infer personality, diagnosis, deception, attraction, dangerousness, manipulation, or moral character.
- Use confidence to describe evidential support, not rhetorical certainty.
- Give genuinely different alternative interpretations when evidence permits.
- If context is missing, name the unknown instead of filling it in.
- Questions should return authorship to the user. Do not use leading therapeutic questions.
- Any possible wording must preserve the user's stated intention and remain optional.
- Do not flatter, praise, reassure by default, or imply that warmth increases certainty.
- Be concise enough to use during everyday life.
- If the input is unrelated or too thin, keep arrays empty where appropriate and ask one useful question.

OUTPUT MEANING
Observations: only facts explicitly supplied by the user.
Inferences: possible meanings, never disguised as facts.
Alternatives: competing explanations or frames.
Unknowns: missing evidence that would materially change the analysis.
Possible wording: one brief first-person sentence the user could edit; use an empty string if not useful.
Agency note: one brief reminder that the interpretation and choice remain the user's.`;
}

export function extractResponseText(payload) {
  for (const item of payload?.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "refusal") {
        return { refusal: part.refusal };
      }
      if (part.type === "output_text") {
        return { text: part.text };
      }
    }
  }
  return {};
}

export function parseClaims(input = "") {
  const text = normalizeInput(input);
  if (!text) return [];

  return splitSentences(text)
    .flatMap(splitClaimUnits)
    .map((claim) => classifyClaim(claim))
    .filter((claim) => claim.text.length > 2);
}

export function demoResponse(mode = "think", input = "") {
  const text = normalizeInput(input);
  const claims = parseClaims(text);
  const signals = deriveSignals(text, claims);
  const observations = buildObservations(claims, signals);
  const inferences = buildInferences(claims, signals);
  const alternatives = buildAlternatives(mode, claims, signals);
  const unknowns = buildUnknowns(mode, claims, signals);

  return {
    title: localTitle(mode, signals),
    understood_goal: localGoal(mode, claims, signals),
    observations,
    inferences,
    alternatives,
    unknowns,
    reflection_question: localQuestion(mode, claims, signals),
    possible_wording: mode === "clarity" ? clarityDraft(text, claims) : "",
    agency_note:
      "This map was generated locally from language patterns, not a verdict. Correct, edit, or reject anything that does not fit.",
  };
}

function classifyClaim(rawText) {
  const text = quoteClause(rawText, 500);
  const classificationText = text
    .replace(
      /^(?:(?:um+|uh+|you know|well|so|okay|ok|i guess)[,\s]+)+/i,
      "",
    )
    .trim();
  const uncertain =
    /\b(maybe|perhaps|possibly|might|could|not sure|uncertain|wonder|guess|may be|reading into)\b/i.test(
      text,
    );
  const negated =
    /\b(no|not|never|without|cannot|can't|did not|didn't|was not|wasn't|is not|isn't)\b/i.test(
      text,
    );
  const diagnosticLabel =
    /\b(narcissist|psychopath|sociopath|manipulative|toxic|liar|dangerous|abusive)\b/i.test(
      text,
    );
  const feeling =
    /\b(i feel|i felt|i never felt|i am feeling|i'm feeling|made me feel|felt safe|angry|frustrated|hurt|sad|anxious|afraid|overwhelmed|upset|excited|embarrassed|uncertain)\b/i.test(
      classificationText,
    );
  const question =
    /\?$/.test(rawText.trim()) ||
    /\b(should i|whether i should|whether to|need to decide|trying to decide|wondering whether|choosing between|choose between)\b/i.test(
      text,
    );
  const interpretation =
    diagnosticLabel ||
    /\b(i think|i do not think|i don't think|i believe|i assume|i suspect|it seems|seems like|appears|must mean|this means|looked annoyed|looked angry|felt like|probably)\b/i.test(
      classificationText,
    );
  const goal =
    /^(i want|i don't want|i do not want|i need|i hope|my goal|i would like|i'd like|i am trying to|i'm trying to|please)\b/i.test(
      classificationText,
    );
  const event =
    /\b(said|told|asked|wrote|sent|received|replied|answered|changed|cancelled|canceled|agreed|promised|interrupted|left|arrived|happened|was stated|was not stated|did not answer|didn't answer)\b/i.test(
      classificationText,
    );

  let type = "statement";
  if (question) type = "question";
  else if (interpretation) type = "interpretation";
  else if (feeling) type = "feeling";
  else if (goal) type = "goal";
  else if (event) type = "event";

  return {
    text,
    type,
    uncertain,
    negated,
    diagnosticLabel,
  };
}

function deriveSignals(text, claims) {
  const contrast = findContrast(text);
  return {
    thin: text.length < 24 || claims.length === 0,
    contrast,
    decision: claims.some((claim) => claim.type === "question"),
    emotion: claims.some((claim) => claim.type === "feeling"),
    interpretation: claims.some((claim) => claim.type === "interpretation"),
    diagnosticLabel: claims.some((claim) => claim.diagnosticLabel),
    uncertainty: claims.some((claim) => claim.uncertain),
    urgency:
      /\b(now|today|urgent|immediately|quickly|deadline|soon|this week)\b/i.test(
        text,
      ),
    interpersonal:
      /\b(they|them|person|friend|partner|manager|colleague|he|she|alex|we|us|you)\b/i.test(
        text,
      ),
    absolute: /\b(always|never|everyone|nobody|completely|definitely)\b/i.test(text),
    change: /\b(change|changed|again|cancel|delay|different|unexpected)\w*/i.test(text),
  };
}

function buildObservations(claims, signals) {
  if (signals.thin) return [];
  const observations = [];

  for (const claim of claims.filter((item) => item.type === "event").slice(0, 2)) {
    observations.push({
      text: `You report the event: “${quoteClause(claim.text, 150)}”.`,
      evidence: "This event is present in your account; it has not been independently verified.",
    });
  }

  const feeling = claims.find((claim) => claim.type === "feeling");
  if (feeling) {
    observations.push({
      text: `You report an emotional response: “${quoteClause(feeling.text, 150)}”.`,
      evidence: "The feeling is directly self-reported; it does not establish its cause.",
    });
  }

  const goal = claims.find((claim) => claim.type === "goal");
  if (goal && observations.length < 3) {
    observations.push({
      text: `Your stated aim is: “${quoteClause(goal.text, 150)}”.`,
      evidence: "This intention is directly stated in your account.",
    });
  }

  if (observations.length === 0) {
    for (const claim of claims
      .filter((item) => item.type === "statement")
      .slice(0, 2)) {
      observations.push({
        text: `You state the consideration: “${quoteClause(claim.text, 150)}”.`,
        evidence: "This consideration is directly present in your account.",
      });
    }
  }

  if (observations.length === 0 && signals.interpretation) {
    const interpretation = claims.find((claim) => claim.type === "interpretation");
    observations.push({
      text: "You supplied an interpretation, but not yet a concrete event that supports it.",
      evidence: `The interpretive wording is: “${quoteClause(interpretation?.text, 150)}”.`,
    });
  }

  return observations.slice(0, 3);
}

function buildInferences(claims, signals) {
  if (signals.thin) return [];
  const inferences = [];

  for (const claim of claims
    .filter((item) => item.type === "interpretation")
    .slice(0, 2)) {
    inferences.push({
      text: `You are considering the interpretation: “${quoteClause(claim.text, 150)}”.`,
      confidence: claim.uncertain ? "low" : "moderate",
      basis: claim.diagnosticLabel
        ? "This is a label or character judgment, not an observed behaviour or diagnosis."
        : "This meaning appears in your account, but the available events do not establish it as fact.",
    });
  }

  if (signals.contrast && inferences.length < 3) {
    inferences.push({
      text: "The account holds two considerations in tension.",
      confidence: "moderate",
      basis: `Your account contrasts “${quoteClause(signals.contrast.before, 70)}” with “${quoteClause(signals.contrast.after, 70)}”.`,
    });
  }

  if (signals.absolute && inferences.length < 3) {
    inferences.push({
      text: "Broad wording may be compressing several events or possible exceptions.",
      confidence: "moderate",
      basis: "The account uses an absolute term; the frequency and counterexamples are not supplied.",
    });
  }

  if (inferences.length === 0 && signals.emotion) {
    inferences.push({
      text: "The feeling may be signalling that an expectation, value, or boundary matters.",
      confidence: "low",
      basis: "The emotional response is explicit, but its meaning and cause remain open.",
    });
  }

  return inferences.slice(0, 3);
}

function buildAlternatives(mode, claims, signals) {
  if (signals.thin) return [];

  if (signals.diagnosticLabel) {
    return [
      {
        text: "The label may be standing in for one or more specific behaviours.",
        would_fit_if: "Describing what was said or done makes the concern clearer without requiring a diagnosis.",
      },
      {
        text: "The concerning impact may be real even if the label is inaccurate.",
        would_fit_if: "You would still want to address the behaviour after setting the character judgment aside.",
      },
    ];
  }

  if (mode === "pause") {
    return [
      {
        text: "The emotion may be signalling a violated expectation or boundary.",
        would_fit_if: "You can name a specific commitment, limit, or need connected to the reaction.",
      },
      {
        text: "The intensity may partly reflect accumulated pressure rather than this event alone.",
        would_fit_if: "Fatigue, time pressure, or earlier events are amplifying the immediate response.",
      },
    ];
  }

  if (mode === "clarity") {
    return [
      {
        text: "Lead with the concrete event, then its impact and your request.",
        would_fit_if: "You want wording that is specific without assigning motive.",
      },
      {
        text: "Lead with the desired outcome.",
        would_fit_if: "The listener already knows the background and mainly needs to understand what you need.",
      },
    ];
  }

  if (mode === "reflect") {
    return [
      {
        text: "A behaviour you noticed may have had more than one cause.",
        would_fit_if: "The same visible behaviour could reflect pressure, distraction, uncertainty, or emotion.",
      },
      {
        text: "A non-answer may reflect avoidance, or simply that no answer was available.",
        would_fit_if: "The person did not answer directly and their reason is unknown.",
      },
    ];
  }

  if (mode === "challenge") {
    return [
      {
        text: "The strongest competing explanation may account for the same events without the current conclusion.",
        would_fit_if: "You can describe a plausible cause that does not require the motive or pattern you currently suspect.",
      },
      {
        text: "A missing counterexample may matter as much as the supporting examples.",
        would_fit_if: "There are occasions when the person, process, or outcome behaved differently.",
      },
    ];
  }

  if (signals.decision) {
    return [
      {
        text: "Treat the next step as a reversible test rather than a final commitment.",
        would_fit_if: "A small experiment can reveal useful evidence at acceptable cost.",
      },
      {
        text: "Resolve one decision-changing unknown before choosing.",
        would_fit_if: "A specific missing fact could realistically reverse your preference.",
      },
    ];
  }

  if (signals.interpersonal) {
    return [
      {
        text: "The impact may be real even if the other person's intention was different.",
        would_fit_if: "More context changes your view of motive but not what occurred.",
      },
      {
        text: "This may be an isolated mismatch rather than a stable pattern.",
        would_fit_if: "Comparable situations are rare or usually handled differently.",
      },
    ];
  }

  return [
    {
      text: "The key issue may be the expectation revealed by the event.",
      would_fit_if: "Making the expectation explicit changes what feels actionable.",
    },
    {
      text: "The account may contain separate facts, predictions, and preferences.",
      would_fit_if: "Sorting those elements changes the apparent problem.",
    },
  ];
}

function buildUnknowns(mode, claims, signals) {
  if (signals.thin) return ["What happened, what you felt, and what you are trying to decide"];
  const unknowns = [];
  if (signals.diagnosticLabel) {
    unknowns.push("The concrete behaviours behind the label");
    unknowns.push("How often those behaviours occurred and in what context");
  }
  if (signals.interpersonal) unknowns.push("The other person's account or intention");
  if (signals.decision) unknowns.push("Which option is reversible and what each option costs");
  if (signals.urgency) unknowns.push("Whether the deadline is externally fixed");
  if (mode === "clarity") unknowns.push("The single outcome you want from the communication");
  if (mode === "reflect") unknowns.push("What was observed at the time versus interpreted afterward");
  if (mode === "challenge") unknowns.push("The strongest evidence against the current interpretation");
  if (claims.every((claim) => claim.type !== "event")) {
    unknowns.push("The observable event supporting the current interpretation");
  }
  unknowns.push("What evidence would materially change your current view");
  return [...new Set(unknowns)].slice(0, 3);
}

function localTitle(mode, signals) {
  if (mode === "pause") return "Separate the signal from the conclusion";
  if (mode === "clarity") return "Find the sentence underneath";
  if (mode === "reflect") return "Review without rewriting the event";
  if (mode === "challenge") return "Challenge the current frame";
  if (signals.decision) return "Map the choice";
  if (signals.change) return "Examine what changed";
  return "Map what is known";
}

function localGoal(mode, claims, signals) {
  const goal = claims.filter((claim) => claim.type === "goal").at(-1);
  const question = claims.find((claim) => claim.type === "question");
  const event = claims.find((claim) => claim.type === "event");
  const anchor = quoteClause(
    goal?.text || question?.text || event?.text || claims[0]?.text || "this situation",
    130,
  );

  if (signals.thin) return "Get enough context to build a useful reasoning map.";
  if (mode === "pause") {
    return `Create distance around “${anchor}” before deciding what it means or how to respond.`;
  }
  if (mode === "clarity") {
    return `Express the intended meaning around “${anchor}” without replacing your voice.`;
  }
  if (mode === "reflect") {
    return `Review “${anchor}” while separating recollection, feeling, and interpretation.`;
  }
  if (mode === "challenge") {
    return `Stress-test the current frame around “${anchor}” without replacing it with another verdict.`;
  }
  return signals.decision
    ? `Examine the choice around “${anchor}” without choosing on your behalf.`
    : `Examine “${anchor}” and identify what would make the situation clearer.`;
}

function localQuestion(mode, claims, signals) {
  if (signals.thin) {
    return "What happened immediately before this, and what are you trying to understand now?";
  }
  if (signals.diagnosticLabel) {
    return "Which specific behaviour concerns you most if you set the label aside?";
  }
  if (mode === "pause") {
    return signals.urgency
      ? "What actually requires a response now, and what only feels urgent?"
      : "Which part is the event, which part is the feeling, and which part is the conclusion?";
  }
  if (mode === "clarity") {
    const goal = claims.filter((claim) => claim.type === "goal").at(-1);
    return goal
      ? "Does the draft preserve this request without assigning an unverified motive?"
      : "If the listener remembered only one sentence, what should it be?";
  }
  if (mode === "reflect") {
    return "What do you know happened, and what meaning did you add afterward?";
  }
  if (mode === "challenge") {
    return "What evidence would make the strongest competing explanation more plausible?";
  }
  if (signals.decision) {
    return "What small test or missing fact would reduce uncertainty without making the choice for you?";
  }
  return "What evidence would most change how you currently understand this?";
}

function clarityDraft(text, claims) {
  if (!claims.some((claim) => claim.type === "goal")) return "";
  const cleaned = text
    .replace(/\b(um+|uh+|you know|sort of|kind of)\b[,\s]*/gi, "")
    .replace(/\blike\b[,\s]+(?=(I|we|it|they|he|she|this|that)\b)/gi, "")
    .replace(/\bI guess\b[,\s]*/gi, "")
    .replace(/\bwhat I mean is that\b[,\s]*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/,\s*([.!?])/g, "$1")
    .trim();

  const sentences = splitSentences(cleaned)
    .map(capitalizeSentence)
    .filter(Boolean);
  if (sentences.length === 0) return "";
  return compactClause(sentences.join(" "), 420);
}

function splitClaimUnits(sentence) {
  return sentence
    .split(
      /\s*(?:;|\bbut\b|\bhowever\b|\balthough\b|\byet\b|\bwhile\b|,\s+and\s+(?=I\b))\s*/i,
    )
    .map((part) => part.trim())
    .filter((part) => part.length > 2);
}

function findContrast(text) {
  const match = text.match(/\b(but|however|although|yet|while)\b/i);
  if (!match || match.index == null) return null;
  const before = text.slice(0, match.index).trim().replace(/[,\s]+$/, "");
  const after = text.slice(match.index + match[0].length).trim();
  if (before.length < 4 || after.length < 4) return null;
  return { before, after, marker: match[0].toLowerCase() };
}

function normalizeInput(input) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]?/g) || [];
  return matches.map((part) => part.trim()).filter((part) => part.length > 2);
}

function compactClause(text, limit) {
  const clean = String(text || "")
    .replace(/^[-–—,;:\s]+|[-–—,;:\s]+$/g, "")
    .trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).trimEnd()}…`;
}

function quoteClause(text, limit) {
  return compactClause(text, limit).replace(/[.!?]+$/, "");
}

function capitalizeSentence(text) {
  const clean = text.trim();
  if (!clean) return "";
  const capitalized = clean[0].toUpperCase() + clean.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}
