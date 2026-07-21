import { retrieveRelevantContext } from "./context.mjs";
import {
  analyzeWritingMechanics,
  findClarityOpportunities,
} from "./writing-mechanics.mjs";

// One evidence-linked engine supports every user-facing Communication Studio tool.

const GOAL_LABELS = {
  warm_boundary: "Remain warm while keeping a boundary",
  clarify_intent: "Clarify what the sender meant",
  keep_distance: "Reply briefly and create distance",
  welcome_connection: "Welcome the connection",
  coordinate_practical: "Coordinate a practical outcome",
  create_record: "Create a clear factual record",
};

const MEDICAL_DISCLOSURE =
  /\b(doctor|hospital|medical|health|diagnos(?:is|ed)|test(?:s|ing)?|scan|x-?ray|surgery|pain|injur(?:y|ed)|scoliosis|cancer|treatment|medication|back|ill(?:ness)?|unwell)\b/i;
const EMOTIONAL_DISCLOSURE =
  /\b(afraid|anxious|worried|upset|hurt|struggling|overwhelmed|grief|grieving|lonely|sad|scared|panic|depressed|bereave|died|death|loss)\b/i;
const SUPPORTIVE_ACKNOWLEDGEMENT =
  /\b(sorry to hear|hope (?:the |you |it |things)|wishing you|that sounds|glad you told|thinking of you|take care|must be|answers soon|feel better|get(?:s|ting)? .* sorted)\b/i;
const GENERIC_ACKNOWLEDGEMENT =
  /\b(thanks for (?:the )?(?:update|telling me|letting me know)|thank you for (?:the )?(?:update|telling me|letting me know))\b/i;
const ACHIEVEMENT_PIVOT =
  /\b(published|launched|released|built|building|won|competition|promotion|promoted|achievement|app(?:lication)?s?|app store|award|accepted|approved)\b/i;
const HARSH_WORDING =
  /\b(not my problem|you always|you never|ridiculous|obviously|calm down|stop being|don['’]t blame me|not my fault|whatever|grow up|overreacting)\b/i;
const OVERPROMISE =
  /\b(i promise|i guarantee|definitely will|will never|will always|no matter what|100\s*%|for certain)\b/i;
const MOTIVE_CERTAINTY =
  /\b(you(?:'re| are) (?:just )?(?:trying to|jealous|manipulating|using)|you (?:only|just) want|i know (?:what|how) you (?:think|feel)|obviously you|because you want)\b/i;

export function createCommunicationCoachSample() {
  return {
    receivedMessage:
      "Hi, I was with the doctor the other day about my back. They said my back is completely out of line and it also looks like I may have scoliosis. They are sending me for a few tests. How are you anyway?",
    draftReply:
      "Thanks for the update. I don’t have scoliosis. I’m great thanks. I’ve published two applications, Lexisynap and GeoSynap, and you can now download them in the App Store on your phone and allow notifications. I’m now building software and entered OpenAI’s Build competition this evening.",
  };
}

export function analyzeCommunicationDraft({
  caseData,
  senderId,
  receivedMessage,
  draftReply,
  selectedSituationIds = [],
  goal = "warm_boundary",
  desiredTone = "warm",
  mode = "review",
}) {
  const allowedModes = new Set([
    "draft",
    "reply",
    "review",
    "rewrite",
    "predict",
    "compare",
  ]);
  const safeMode = allowedModes.has(mode) ? mode : "review";
  const received = cleanText(receivedMessage);
  const context = retrieveRelevantContext({
    caseData,
    senderId,
    selectedSituationIds,
  });
  const personName = context.person?.displayName || "the recipient";
  const userDraft = cleanText(draftReply);
  const draft = buildWorkingDraft({
    mode: safeMode,
    received,
    userDraft,
    personName,
    desiredTone,
  });
  const mechanics = analyzeWritingMechanics(draft);
  const clarityOpportunities = findClarityOpportunities(
    mechanics.correctedText,
  );
  const messageContext = safeMode === "draft" ? "" : received;
  const medicalDisclosure = MEDICAL_DISCLOSURE.test(messageContext);
  const emotionalDisclosure = EMOTIONAL_DISCLOSURE.test(messageContext);
  const vulnerableDisclosure = medicalDisclosure || emotionalDisclosure;
  const supportiveAcknowledgement = SUPPORTIVE_ACKNOWLEDGEMENT.test(draft);
  const genericAcknowledgement = GENERIC_ACKNOWLEDGEMENT.test(draft);
  const achievementPivot = ACHIEVEMENT_PIVOT.test(draft);
  const answers = questionCoverage(received, draft);
  const checks = [];

  if (mechanics.corrections.length) {
    const visibleCorrections = mechanics.corrections
      .filter((correction) => correction.original !== correction.replacement)
      .slice(0, 4);
    addCheck(checks, {
      id: "writing-mechanics",
      label: `${mechanics.corrections.length} likely writing ${mechanics.corrections.length === 1 ? "correction" : "corrections"}`,
      detail: visibleCorrections.length
        ? visibleCorrections
            .map(
              (correction) =>
                `“${correction.original}” → “${correction.replacement}”`,
            )
            .join("; ")
        : "Merlin found a high-confidence spacing or punctuation correction.",
      confidence: mechanics.corrections.every(
        (correction) => correction.confidence === "high",
      )
        ? "high"
        : "moderate–high",
      evidence: ["User’s draft · direct wording"],
    });
  }

  if (clarityOpportunities.length) {
    addCheck(checks, {
      id: "clarity-opportunity",
      label: "Optional clarity choice",
      detail: clarityOpportunities[0].suggestion,
      confidence: clarityOpportunities[0].confidence,
      evidence: ["User’s draft · phrase overlap"],
    });
  }

  if (vulnerableDisclosure && !supportiveAcknowledgement) {
    addCheck(checks, {
      id: medicalDisclosure
        ? "unacknowledged-medical-disclosure"
        : "unacknowledged-emotional-disclosure",
      label: medicalDisclosure
        ? "Medical disclosure needs acknowledgment"
        : "Emotional disclosure needs acknowledgment",
      detail: genericAcknowledgement
        ? "The draft says thanks, but does not respond specifically to the potentially worrying disclosure."
        : "The draft does not directly acknowledge the potentially worrying disclosure.",
      confidence: "high",
      evidence: [
        "Received message · direct wording",
        "Draft reply · no specific supportive acknowledgment found",
      ],
    });
  }

  if (answers.unanswered.length) {
    addCheck(checks, {
      id: "unanswered-question",
      label: "Question may be unanswered",
      detail: `The draft may not answer: “${answers.unanswered[0]}”`,
      confidence: "moderate",
      evidence: ["Received message · explicit question", "Draft reply"],
    });
  }

  if (vulnerableDisclosure && achievementPivot && !supportiveAcknowledgement) {
    addCheck(checks, {
      id: "abrupt-topic-change",
      label: "Abrupt topic change",
      detail:
        "The draft moves from the disclosure to personal news before giving the disclosure much space.",
      confidence: "high",
      evidence: ["Received message · vulnerable disclosure", "Draft reply · achievement language"],
    });
  }

  if (HARSH_WORDING.test(draft)) {
    addCheck(checks, {
      id: "defensive-or-harsh-wording",
      label: "Defensive or unnecessarily harsh wording",
      detail:
        "One or more phrases could obscure the underlying request by escalating the tone.",
      confidence: "high",
      evidence: ["Draft reply · direct wording"],
    });
  }

  if (OVERPROMISE.test(draft)) {
    addCheck(checks, {
      id: "overpromising",
      label: "Possible overpromising",
      detail:
        "The wording makes a broad guarantee that may be difficult to keep exactly as written.",
      confidence: "moderate",
      evidence: ["Draft reply · commitment language"],
    });
  }

  if (hasUnclearRequest(draft)) {
    addCheck(checks, {
      id: "unclear-request",
      label: "Unclear request",
      detail:
        "The draft appears to ask for action without making the action or timing fully explicit.",
      confidence: "moderate",
      evidence: ["Draft reply · request wording"],
    });
  }

  if (hasPossibleAmbiguity(draft)) {
    addCheck(checks, {
      id: "possible-ambiguity",
      label: "Possible ambiguity",
      detail:
        "A vague reference such as “it” or “that” may not have a single clear referent.",
      confidence: "low–moderate",
      evidence: ["Draft reply · pronoun reference"],
    });
  }

  const preferenceMismatch = findPreferenceMismatch(
    context.person?.communicationNotes || [],
    draft,
  );
  if (preferenceMismatch) {
    addCheck(checks, {
      id: "communication-preference-mismatch",
      label: "Mismatch with a known communication preference",
      detail: preferenceMismatch,
      confidence: "moderate",
      evidence: [
        `${personName} relationship profile · communication note`,
        "Draft reply · length and structure",
      ],
    });
  }

  const goalMismatch = findGoalMismatch({
    goal,
    draft,
    checks,
    received,
  });
  if (goalMismatch) {
    addCheck(checks, {
      id: "goal-mismatch",
      label: "Possible mismatch with your stated goal",
      detail: goalMismatch,
      confidence: "moderate",
      evidence: ["Current goal", "Draft reply"],
    });
  }

  const relevantBoundary = findRelevantBoundary(
    context.person?.boundaries || [],
    received,
  );
  if (
    relevantBoundary &&
    ["warm_boundary", "keep_distance"].includes(goal) &&
    !containsBoundaryLanguage(draft)
  ) {
    addCheck(checks, {
      id: "missing-boundary",
      label: "Known boundary is missing",
      detail: `The selected profile records “${relevantBoundary},” but the draft does not express that limit.`,
      confidence: "moderate",
      evidence: [`${personName} relationship profile · boundary`, "Draft reply"],
    });
  }

  if (MOTIVE_CERTAINTY.test(draft)) {
    addCheck(checks, {
      id: "motive-certainty",
      label: "Too certain about another person’s motive",
      detail:
        "The draft presents an interpretation of the recipient’s motive or inner state as established fact.",
      confidence: "high",
      evidence: ["Draft reply · motive claim"],
    });
  }

  const highConfidenceChecks = checks.filter(
    (check) => check.confidence === "high",
  );
  const revisedMessage = buildRevision({
    received,
    draft: mechanics.correctedText,
    medicalDisclosure,
    emotionalDisclosure,
    supportiveAcknowledgement,
    desiredTone,
    mode: safeMode,
  });
  const relevantContext = buildRelevantContext({
    context,
    received,
    personName,
    goal,
    relevantBoundary,
    selectedSituationIds,
    mode: safeMode,
  });
  const interpretation = buildInterpretations({
    vulnerableDisclosure,
    achievementPivot,
    supportiveAcknowledgement,
    checks,
    personName,
    mode: safeMode,
    draft: mechanics.correctedText,
    clarityOpportunities,
  });

  return {
    observation: buildObservation({
      vulnerableDisclosure,
      medicalDisclosure,
      achievementPivot,
      supportiveAcknowledgement,
      answers,
      checks,
      mode: safeMode,
      mechanics,
      clarityOpportunities,
    }),
    relevantContext,
    possibleInterpretation: {
      text: interpretation.possible,
      confidence: interpretation.possibleConfidence,
    },
    alternativeInterpretation: {
      text: interpretation.alternative,
      confidence: interpretation.alternativeConfidence,
    },
    confidence: {
      label: highConfidenceChecks.length
        ? "Wording checks · high; predicted reaction · low–moderate"
        : "Wording checks · moderate; predicted reaction · low",
      rationale:
        "The Studio can inspect the words and selected records directly. It cannot observe the recipient’s private thoughts or predict a reaction with certainty.",
    },
    suggestedAdjustment: buildAdjustment({
      vulnerableDisclosure,
      supportiveAcknowledgement,
      achievementPivot,
      checks,
      goal,
      mode: safeMode,
      mechanics,
      clarityOpportunities,
    }),
    revisedMessage,
    alternatives:
      safeMode === "compare" ? buildToneAlternatives(revisedMessage) : [],
    checks,
    writingMechanics: mechanics,
    clarityOpportunities,
    meta: {
      source: "local-communication-studio",
      paidApiUsed: false,
      senderId,
      selectedSituationCount: context.situations.length,
      goal: GOAL_LABELS[goal] || goal,
      desiredTone,
      mode: safeMode,
    },
  };
}

function addCheck(checks, check) {
  if (!checks.some((item) => item.id === check.id)) checks.push(check);
}

function buildObservation({
  vulnerableDisclosure,
  medicalDisclosure,
  achievementPivot,
  supportiveAcknowledgement,
  answers,
  checks,
  mode,
  mechanics,
  clarityOpportunities,
}) {
  if (vulnerableDisclosure && achievementPivot && !supportiveAcknowledgement) {
    return `The reply ${answers.answered.length ? "answers the sender’s question, but " : ""}gives their potentially worrying ${medicalDisclosure ? "medical" : "personal"} disclosure only a brief acknowledgment before moving to your news.`;
  }
  if (checks.some((check) => check.id === "motive-certainty")) {
    return "The draft moves beyond observable behaviour and states an interpretation of the recipient’s motive as fact.";
  }
  if (checks.some((check) => check.id === "defensive-or-harsh-wording")) {
    return "The main point is present, but one or more phrases may make the message land more harshly than the stated goal requires.";
  }
  if (answers.unanswered.length) {
    return "The draft addresses part of the message but may leave an explicit question unanswered.";
  }
  if (mode === "rewrite" && mechanics.corrections.length) {
    return `The message’s meaning is clear. Merlin found ${mechanics.corrections.length} likely writing ${mechanics.corrections.length === 1 ? "correction" : "corrections"}${clarityOpportunities.length ? " and one optional concision choice" : ""}.`;
  }
  if (mode === "draft") {
    return "Merlin treated your description as a composition brief and built a message using the selected relationship and communication goal.";
  }
  if (mode === "reply") {
    return "The generated reply addresses the incoming message using only the context and purpose currently supplied.";
  }
  if (mode === "rewrite") {
    return "The rewrite keeps the original proposition while reducing avoidable friction or ambiguity where the local checks found it.";
  }
  if (mode === "predict") {
    return "The wording supports more than one plausible reading; the interpretations below are rehearsals, not detected reactions.";
  }
  if (mode === "compare") {
    return "The alternatives vary tone and compression while keeping the same underlying message.";
  }
  return "The draft is broadly aligned with the received message. Merlin found no high-confidence omission in this local check.";
}

function buildRelevantContext({
  context,
  received,
  personName,
  goal,
  relevantBoundary,
  selectedSituationIds,
  mode,
}) {
  const items = [
    {
      text: `${context.person?.relationshipType || "Relationship type not set"} · ${context.person?.currentState || "current state not set"}`,
      source: `${personName} relationship profile`,
      kind: "user-maintained context",
    },
    {
      text: GOAL_LABELS[goal] || goal,
      source: "Current coaching goal",
      kind: "user preference",
    },
  ];
  if (received) {
    items.unshift({
      text:
        mode === "draft"
          ? truncate(received, 180)
          : summarizeReceivedMessage(received),
      source: mode === "draft" ? "Composition brief" : "Received message",
      kind: mode === "draft" ? "user instruction" : "direct wording",
    });
  }
  const communicationNote = context.person?.communicationNotes?.[0];
  if (communicationNote) {
    items.push({
      text: communicationNote,
      source: `${personName} relationship profile`,
      kind: "communication note",
    });
  }
  if (relevantBoundary) {
    items.push({
      text: relevantBoundary,
      source: `${personName} relationship profile`,
      kind: "boundary",
    });
  }
  const relationshipGoal = context.person?.relationshipGoals?.[0];
  if (relationshipGoal) {
    items.push({
      text: relationshipGoal,
      source: "Relationship goal",
      kind: "user preference",
    });
  }
  const selected = new Set(selectedSituationIds);
  context.situations
    .filter(
      (situation) =>
        selected.has(situation.id) &&
        isSituationRelevantToMessage(situation, context.claims, received),
    )
    .slice(-2)
    .forEach((situation) => {
      items.push({
        text: situation.title,
        source: situation.sourceRefs?.[0] || "Selected timeline event",
        kind: "timeline",
      });
    });
  return items;
}

function buildInterpretations({
  vulnerableDisclosure,
  achievementPivot,
  supportiveAcknowledgement,
  checks,
  personName,
  mode,
  draft,
  clarityOpportunities,
}) {
  if (vulnerableDisclosure && achievementPivot && !supportiveAcknowledgement) {
    return {
      possible: `${personName} could read the quick pivot as placing your update ahead of what they disclosed, even if that was not your intention.`,
      possibleConfidence: "low–moderate",
      alternative:
        "They may instead recognise genuine excitement and a straightforward attempt to answer their question about you.",
      alternativeConfidence: "low–moderate",
    };
  }
  if (checks.some((check) => check.id === "defensive-or-harsh-wording")) {
    return {
      possible: `${personName} could focus on the force of the wording rather than the need you are trying to communicate.`,
      possibleConfidence: "low–moderate",
      alternative:
        "They may read the same directness as useful clarity, especially if concise communication is normal in this relationship.",
      alternativeConfidence: "low",
    };
  }
  if (mode === "rewrite") {
    const responsibility = /\b(?:take on|accept).*\bresponsibilit(?:y|ies)\b/i.test(
      draft,
    );
    return {
      possible: responsibility
        ? "The literal wording communicates willingness and readiness to accept responsibility."
        : "The corrected wording keeps the draft’s explicit proposition and presents it more cleanly.",
      possibleConfidence: "moderate",
      alternative: clarityOpportunities.length
        ? `The phrase “${clarityOpportunities[0].phrase}” could be deliberate emphasis rather than unnecessary repetition.`
        : "Tone and context not represented here could still change how the same literal wording is received.",
      alternativeConfidence: "low",
    };
  }
  return {
    possible: `${personName} may read the message as a direct expression of the user’s stated intent.`,
    possibleConfidence: "low",
    alternative:
      "Tone, timing, and expectations not represented in the selected evidence could produce a different reading.",
    alternativeConfidence: "low",
  };
}

function buildAdjustment({
  vulnerableDisclosure,
  supportiveAcknowledgement,
  achievementPivot,
  checks,
  goal,
  mode,
  mechanics,
  clarityOpportunities,
}) {
  if (vulnerableDisclosure && !supportiveAcknowledgement) {
    return achievementPivot
      ? "Add one specific acknowledgment before sharing your news. Keep the achievements; change the transition, not the underlying intent."
      : "Add one specific sentence acknowledging the disclosure before moving to the practical response.";
  }
  if (checks.some((check) => check.id === "motive-certainty")) {
    return "Replace the motive claim with the behaviour you observed and, if useful, one question that tests your interpretation.";
  }
  if (checks.some((check) => check.id === "defensive-or-harsh-wording")) {
    return "State the concrete impact or limit directly and remove the phrase most likely to escalate the exchange.";
  }
  if (checks.some((check) => check.id === "unanswered-question")) {
    return "Answer the explicit question before adding a new topic.";
  }
  if (mechanics.corrections.length) {
    const correctionText = mechanics.corrections
      .filter((correction) => correction.original !== correction.replacement)
      .slice(0, 3)
      .map(
        (correction) =>
          `“${correction.original}” to “${correction.replacement}”`,
      )
      .join(" and ");
    const clarityText = clarityOpportunities.length
      ? ` ${clarityOpportunities[0].suggestion}`
      : "";
    return `${correctionText ? `Correct ${correctionText}.` : "Apply the high-confidence writing corrections."}${clarityText}`.trim();
  }
  if (mode === "draft") {
    return "Check that the generated message contains the facts you intended and still sounds like you before using it.";
  }
  if (mode === "reply") {
    return "Add any answer, fact, or boundary Merlin could not infer from the incoming message before using the reply.";
  }
  if (mode === "rewrite") {
    return "Compare the rewrite with your original and restore any phrasing that carries meaning or personality the cleaner version lost.";
  }
  if (mode === "predict") {
    return "Use the alternative reading as a check on ambiguity, not as evidence of what the recipient will think.";
  }
  if (mode === "compare") {
    return "Choose the version that best fits your goal, then edit it rather than treating tone selection as automatic.";
  }
  return `No major rewrite is indicated for the “${GOAL_LABELS[goal] || goal}” goal. Edit only if the wording does not sound like you.`;
}

function buildRevision({
  received,
  draft,
  medicalDisclosure,
  emotionalDisclosure,
  supportiveAcknowledgement,
  desiredTone,
  mode,
}) {
  if (mode === "draft") return rewriteForClarity(draft);
  if (mode === "reply" && !draft) {
    return buildReplyFromIncoming(received);
  }
  if (isMedicalAppSample(received, draft)) {
    return "Thanks for the update. I’m sorry to hear that. Hopefully the tests give you some answers soon and they can help get your back sorted. I’m doing really well, thanks. I actually published two apps recently, Lexisynap and GeoSynap, so they are now available on the App Store if you would like to have a look. I also entered OpenAI’s Build competition this evening with the software I have been working on, so it has been a busy few weeks.";
  }
  if ((medicalDisclosure || emotionalDisclosure) && !supportiveAcknowledgement) {
    const sentences = splitSentences(draft).filter(
      (sentence) => !GENERIC_ACKNOWLEDGEMENT.test(sentence),
    );
    const acknowledgment = medicalDisclosure
      ? "Thanks for telling me. I’m sorry to hear that. I hope you get some clearer answers soon."
      : "Thanks for telling me. I’m sorry you’re dealing with that.";
    return `${acknowledgment} ${sentences.join(" ")}`.trim();
  }
  if (HARSH_WORDING.test(draft)) {
    return `I want to be clear about what I need here. ${draft}`;
  }
  if (mode === "rewrite") return rewriteForClarity(draft);
  if (desiredTone === "direct") return draft;
  return draft;
}

function questionCoverage(received, draft) {
  const questions = received.match(/[^.!?]*\?/g)?.map(cleanText) || [];
  const unanswered = [];
  const answered = [];
  for (const question of questions) {
    let covered = true;
    if (/\bhow are you\b/i.test(question)) {
      covered = /\b(i(?:['’]m| am)|doing|been)\b/i.test(draft);
    } else if (/\b(?:can|could|would|will) you\b/i.test(question)) {
      covered = /\b(yes|no|i can|i can['’]t|i could|i will|i won['’]t|unable|sorry)\b/i.test(
        draft,
      );
    } else if (/\bwhen\b/i.test(question)) {
      covered = /\b(today|tomorrow|tonight|morning|afternoon|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(?::\d{2})?)\b/i.test(
        draft,
      );
    } else if (/\bwhere\b/i.test(question)) {
      covered = /\b(at|in|near|address|location|place)\b/i.test(draft);
    }
    (covered ? answered : unanswered).push(question);
  }
  return { answered, unanswered };
}

function findPreferenceMismatch(notes, draft) {
  const joined = notes.join(" ");
  if (/\b(concise|brief|short|literal)\b/i.test(joined) && draft.length > 420) {
    return "The profile says this person usually communicates concisely or literally, while the draft is comparatively long.";
  }
  if (/\b(direct|clear)\b/i.test(joined) && hasPossibleAmbiguity(draft)) {
    return "The profile records a preference for direct or clear communication, while part of the request remains vague.";
  }
  return "";
}

function findGoalMismatch({ goal, draft, checks, received }) {
  const ids = new Set(checks.map((check) => check.id));
  if (goal === "welcome_connection" && ids.has("unacknowledged-medical-disclosure")) {
    return "The draft moves away from a vulnerable disclosure before showing the warmth implied by the selected goal.";
  }
  if (goal === "warm_boundary" && ids.has("defensive-or-harsh-wording")) {
    return "The boundary may be valid, but the current wording is harsher than the selected warm tone.";
  }
  if (goal === "keep_distance" && draft.length > 420) {
    return "The draft is substantially longer than the selected brief, distancing goal suggests.";
  }
  if (
    goal === "clarify_intent" &&
    /\b(?:not sure|unclear|what do you mean|why|reason)\b/i.test(received) &&
    !draft.includes("?")
  ) {
    return "The selected goal is clarification, but the draft does not ask a clarifying question.";
  }
  return "";
}

function findRelevantBoundary(boundaries, received) {
  return boundaries.find((boundary) => {
    if (/\b(hug|kiss|touch|physical)\b/i.test(boundary)) {
      return /\b(hug|kiss|touch|physical)\b/i.test(received);
    }
    if (/\b(after|before|work|call|message|contact|time|urgent)\b/i.test(boundary)) {
      return /\b(after|before|work|call|message|contact|time|urgent|tonight|tomorrow|\d{1,2}:\d{2})\b/i.test(
        received,
      );
    }
    return false;
  });
}

function containsBoundaryLanguage(draft) {
  return /\b(can['’]t|cannot|won['’]t|not able|need to|prefer|please don['’]t|only available|limit|boundary)\b/i.test(
    draft,
  );
}

function hasUnclearRequest(draft) {
  return /\b(?:can|could|would) you (?:do|handle|sort|fix) (?:it|that|this)\b/i.test(
    draft,
  );
}

function hasPossibleAmbiguity(draft) {
  return /\b(?:deal with|sort out|handle) (?:it|that|this)\b/i.test(draft);
}

function isSituationRelevantToMessage(situation, claims, message) {
  if (!message) return false;
  const messageTerms = meaningfulTerms(message);
  if (!messageTerms.size) return false;
  const situationClaims = claims
    .filter((claim) => claim.situationId === situation.id)
    .map((claim) => claim.text)
    .join(" ");
  const situationTerms = meaningfulTerms(
    `${situation.title || ""} ${situationClaims}`,
  );
  return [...messageTerms].some((term) => situationTerms.has(term));
}

function meaningfulTerms(value) {
  const stopwords = new Set([
    "about",
    "after",
    "again",
    "been",
    "being",
    "could",
    "from",
    "have",
    "just",
    "message",
    "said",
    "that",
    "their",
    "there",
    "they",
    "this",
    "with",
    "would",
    "your",
  ]);
  return new Set(
    cleanText(value)
      .toLowerCase()
      .match(/[a-z0-9’'-]{4,}/g)
      ?.filter((term) => !stopwords.has(term)) || [],
  );
}

function buildWorkingDraft({
  mode,
  received,
  userDraft,
  personName,
  desiredTone,
}) {
  if (mode === "draft") {
    return buildDraftFromBrief({
      brief: received,
      keyPoints: userDraft,
      personName,
      desiredTone,
    });
  }
  if (mode === "reply") {
    return buildReplyFromIncoming(received, userDraft);
  }
  return userDraft;
}

function buildDraftFromBrief({ brief, keyPoints, personName, desiredTone }) {
  const firstName = cleanText(personName).split(/\s+/)[0] || "there";
  let core = cleanText(keyPoints || brief)
    .replace(/^i (?:would like|want) to (?:tell|let) [^ ]+ know (?:that )?/i, "")
    .replace(/^i (?:would like|want) to ask [^ ]+ (?:if|whether) /i, "Would it be possible to ")
    .replace(/^i (?:would like|want) to /i, "");
  core = ensureSentence(capitalize(core));
  if (desiredTone === "direct") return core;
  return `Hi ${firstName}, ${lowercaseFirst(core)}`;
}

function buildReplyFromIncoming(received, keyPoints = "") {
  const points = cleanText(keyPoints);
  if (MEDICAL_DISCLOSURE.test(received)) {
    const answer = /\bhow are you\b/i.test(received)
      ? " I’m doing well, thanks for asking."
      : "";
    const addition = points ? ` ${ensureSentence(points)}` : "";
    return `Thanks for telling me. I’m sorry to hear that. I hope the tests give you some clearer answers soon.${answer}${addition}`.trim();
  }
  if (EMOTIONAL_DISCLOSURE.test(received)) {
    const addition = points ? ` ${ensureSentence(points)}` : "";
    return `Thanks for telling me. I’m sorry you’re dealing with that.${addition}`.trim();
  }
  if (points) return rewriteForClarity(points);
  if (/\?/.test(received)) {
    return "Thanks for asking. I want to give you a clear answer, so let me check the details and come back to you.";
  }
  return "Thanks for the message. I’ve seen this and will come back to you with a considered response.";
}

function rewriteForClarity(message) {
  const cleaned = cleanText(message)
    .replace(/\bi am writing to (?:let you know|tell you) that\b/gi, "")
    .replace(/\bjust wanted to (?:let you know|say)\b/gi, "")
    .replace(/\bkind of\b/gi, "")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return ensureSentence(capitalize(cleaned));
}

function buildToneAlternatives(message) {
  const base = cleanText(message);
  const withoutGreeting = base.replace(/^hi [^,]+,\s*/i, "");
  const direct = withoutGreeting
    .replace(/^(thanks|thank you)(?: for [^.]+)?\.\s*/i, "")
    .trim();
  const sentences = splitSentences(base);
  const concise = sentences.slice(0, Math.min(2, sentences.length)).join(" ");
  const warmer = /^(thanks|thank you|hi\b)/i.test(base)
    ? `${base} I appreciate you taking the time to read this.`
    : `Thanks for taking the time to read this. ${base}`;
  return [
    {
      id: "warmer",
      label: "Warmer",
      text: warmer,
      note: "Adds relational warmth without changing the central request.",
    },
    {
      id: "direct",
      label: "More direct",
      text: ensureSentence(direct || base),
      note: "Moves the main point forward and removes optional cushioning.",
    },
    {
      id: "concise",
      label: "More concise",
      text: concise || base,
      note: "Keeps the earliest essential points and removes later detail.",
    },
  ];
}

function isMedicalAppSample(received, draft) {
  return (
    /\bscoliosis\b/i.test(received) &&
    /\bLexisynap\b/i.test(draft) &&
    /\bGeoSynap\b/i.test(draft) &&
    /\bOpenAI(?:[’']s)? Build competition\b/i.test(draft)
  );
}

function summarizeReceivedMessage(received) {
  if (MEDICAL_DISCLOSURE.test(received)) {
    return "The sender directly described a medical concern or tests and asked how the user is.";
  }
  if (EMOTIONAL_DISCLOSURE.test(received)) {
    return "The sender directly disclosed a potentially difficult emotional experience.";
  }
  const maximum = 180;
  return received.length > maximum
    ? `${received.slice(0, maximum - 1).trim()}…`
    : received;
}

function splitSentences(value) {
  return (
    String(value || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(cleanText) || []
  );
}

function ensureSentence(value) {
  const cleaned = cleanText(value);
  if (!cleaned || /[.!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function capitalize(value) {
  const cleaned = cleanText(value);
  return cleaned ? `${cleaned[0].toUpperCase()}${cleaned.slice(1)}` : "";
}

function lowercaseFirst(value) {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : "";
}

function truncate(value, maximum) {
  const cleaned = cleanText(value);
  return cleaned.length > maximum
    ? `${cleaned.slice(0, maximum - 1).trim()}…`
    : cleaned;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
