import test from "node:test";
import assert from "node:assert/strict";
import {
  buildContextResult,
  createBlankCase,
  createCommitmentDemoCase,
  createDemoCase,
  createPatternDemoCase,
  retrieveRelevantContext,
} from "../lib/context.mjs";

test("blank personal workspace starts without fictional relationships", () => {
  const blank = createBlankCase();

  assert.deepEqual(
    blank.people.map((person) => person.id),
    ["person-you"],
  );
  assert.deepEqual(blank.situations, []);
  assert.deepEqual(blank.claims, []);
  assert.deepEqual(blank.relationshipConnections, []);
  assert.deepEqual(blank.issues, []);
  assert.deepEqual(blank.commitments, []);
  assert.deepEqual(blank.captures, []);
  assert.equal(blank.incoming.senderPersonId, "");
});

test("commitment demo keeps promises, status changes, and completed outcomes distinct", () => {
  const demo = createCommitmentDemoCase();
  const dishwasher = demo.commitments.find(
    (item) => item.id === "commitment-dishwasher",
  );
  const electricity = demo.commitments.find(
    (item) => item.id === "commitment-electricity",
  );

  assert.equal(demo.issues.length, 3);
  assert.equal(demo.commitments.length, 3);
  assert.equal(dishwasher.status, "delayed");
  assert.deepEqual(
    dishwasher.statusHistory.map((item) => item.status),
    ["promised", "scheduled", "delayed"],
  );
  assert.equal(electricity.status, "completed");
  assert.equal(
    demo.issues.find((item) => item.id === electricity.issueId).status,
    "resolved",
  );
});

test("commitment reasoning cites open work and does not infer motive or fault", () => {
  const demo = createCommitmentDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });

  assert.equal(result.commitmentInsight.openCount, 2);
  assert.equal(result.commitmentInsight.completedCount, 1);
  assert.equal(result.commitmentInsight.exceptionCount, 1);
  assert.equal(result.meta.intentCategory, "request");
  assert.match(result.commitmentInsight.title, /2 commitments.*Tomas Vega/i);
  assert.match(result.contextual.draft, /confirm the appointment/i);
  assert.match(result.contextual.draft, /dishwasher repair/i);
  assert.match(result.contextual.interpretation, /does not establish why/i);
  assert.ok(
    result.contextual.basis.some(
      (item) =>
        item.kind === "commitment" &&
        /dishwasher repair.*delayed/i.test(item.text),
    ),
  );
  assert.doesNotMatch(
    `${result.contextual.interpretation} ${result.contextual.draft}`,
    /\b(?:lying|dishonest|negligent|malicious)\b/i,
  );
});

test("commitment retrieval stays isolated to the selected person", () => {
  const demo = createCommitmentDemoCase();
  demo.people.push({
    id: "person-decoy",
    displayName: "Unrelated person",
    relationshipType: "Colleague",
    closeness: 1,
    trust: 2,
    communicationNotes: [],
    boundaries: [],
    relationshipGoals: [],
    currentState: "Active",
  });
  demo.issues.push({
    id: "issue-decoy",
    title: "Unrelated promise",
    personIds: ["person-you", "person-decoy"],
    status: "open",
    createdAt: "2026-07-20T08:00:00Z",
    updatedAt: "2026-07-20T08:00:00Z",
  });
  demo.commitments.push({
    id: "commitment-decoy",
    issueId: "issue-decoy",
    committerPersonId: "person-decoy",
    description: "Send an unrelated document.",
    status: "promised",
    promisedAt: "2026-07-20T08:00:00Z",
    source: { kind: "user_entry", reference: "Unrelated note" },
    statusHistory: [],
    userConfirmation: "confirmed",
    updatedAt: "2026-07-20T08:00:00Z",
  });

  const context = retrieveRelevantContext({
    caseData: demo,
    senderId: "person-tomas",
    selectedSituationIds: demo.selectedSituationIds,
  });

  assert.equal(context.commitments.length, 3);
  assert.equal(
    context.commitments.some((item) => item.id === "commitment-decoy"),
    false,
  );
  assert.equal(context.issues.some((item) => item.id === "issue-decoy"), false);
});

test("record-building goal changes the commitment response direction", () => {
  const demo = createCommitmentDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: "create_record",
    desiredTone: "neutral",
  });

  assert.equal(
    result.contextual.responseOptions.find((item) => item.recommended)?.id,
    "create-record",
  );
  assert.match(result.contextual.draft, /current record shows/i);
  assert.match(result.commitmentInsight.outstandingReport, /Source:/i);
});

test("pattern demo preserves the fictional Vargus event sequence", () => {
  const demo = createPatternDemoCase();

  assert.equal(
    demo.people.find((person) => person.id === "person-you").displayName,
    "Vargus",
  );
  assert.deepEqual(
    demo.people
      .filter((person) => person.id !== "person-you")
      .map((person) => person.displayName),
    ["Benedict", "Gertrude"],
  );
  assert.equal(demo.situations.length, 5);
  assert.equal(demo.relationshipConnections.length, 1);
  assert.match(
    demo.relationshipConnections[0].relationshipType,
    /dynamic unclear/i,
  );
});

test("Vargus’s salty and bossy descriptions remain reports, not objective facts", () => {
  const demo = createPatternDemoCase();
  const broadDescriptions = demo.claims.filter((claim) =>
    ["claim-benedict-salty", "claim-gertrude-bossy"].includes(claim.id),
  );

  assert.equal(broadDescriptions.length, 2);
  assert.ok(broadDescriptions.every((claim) => claim.type === "user_report"));
  assert.ok(
    broadDescriptions.every((claim) =>
      /Vargus (?:remembers|reports)/i.test(claim.text),
    ),
  );
});

test("Merlin exposes competing Bayesian hypotheses without claiming romance", () => {
  const demo = createPatternDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });
  const total = result.merlinInsight.hypotheses.reduce(
    (sum, hypothesis) => sum + hypothesis.probability,
    0,
  );
  const romance = result.merlinInsight.hypotheses.find(
    (hypothesis) => hypothesis.id === "romantic",
  );
  const friction = result.merlinInsight.hypotheses.find(
    (hypothesis) => hypothesis.id === "friction",
  );

  assert.ok(Math.abs(total - 1) < 0.000001);
  assert.equal(
    result.merlinInsight.title,
    "There may be an unresolved dynamic between Gertrude and Benedict.",
  );
  assert.ok(romance.probability > 0.48 && romance.probability < 0.51);
  assert.ok(friction.probability > 0.41 && friction.probability < 0.45);
  assert.match(result.merlinInsight.summary, /plausible|hypothesis|leading/i);
  assert.match(result.merlinInsight.summary, /not a conclusion/i);
  assert.match(result.merlinInsight.calibration, /not probabilities learned/i);
  assert.equal(result.merlinInsight.evidence.length, 3);
  assert.equal(result.merlinInsight.excludedEvidence.length, 2);
});

test("removing the deleted message materially changes Merlin’s update", () => {
  const demo = createPatternDemoCase();
  const full = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });
  const withoutDeleted = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds.filter(
      (id) => id !== "situation-deleted-question",
    ),
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });
  const romanceProbability = (result) =>
    result.merlinInsight.hypotheses.find(
      (hypothesis) => hypothesis.id === "romantic",
    ).probability;

  assert.ok(romanceProbability(withoutDeleted) < romanceProbability(full));
  assert.equal(withoutDeleted.merlinInsight.evidence.length, 2);
});

test("Merlin’s declared pattern engine is reusable and not keyed to one case ID", () => {
  const demo = createPatternDemoCase();
  demo.id = "case-unseen-pattern-shape";
  demo.title = "A structurally similar unseen case";
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });

  assert.equal(result.merlinInsight.modelSource, "declared");
  assert.equal(result.merlinInsight.evidence.length, 3);
  assert.ok(
    result.merlinInsight.hypotheses.some(
      (hypothesis) => hypothesis.id === "romantic",
    ),
  );
});

test("personal multi-person events can trigger the conservative local pattern engine", () => {
  const personal = createBlankCase();
  personal.incoming = {
    id: "incoming-personal-pattern",
    senderPersonId: "person-alex",
    text: "Please leave Sam out of the next plan.",
    receivedAt: "2026-07-20T12:00:00Z",
    source: "User entry",
  };
  personal.people.push(
    {
      id: "person-alex",
      displayName: "Alex",
      relationshipType: "Friend",
      closeness: 3,
      trust: 3,
      communicationNotes: [],
      boundaries: [],
      relationshipGoals: [],
      currentState: "Developing",
    },
    {
      id: "person-sam",
      displayName: "Sam",
      relationshipType: "Friend",
      closeness: 2,
      trust: 3,
      communicationNotes: [],
      boundaries: [],
      relationshipGoals: [],
      currentState: "Developing",
    },
  );
  personal.relationshipConnections.push({
    id: "connection-alex-sam",
    schemaVersion: "1.0.0",
    fromPersonId: "person-alex",
    toPersonId: "person-sam",
    relationshipType: "Recently introduced",
    dynamic: "unknown",
    strength: 1,
    confidence: 1,
    source: "user_entry",
    userConfirmation: "confirmed",
    updatedAt: "2026-07-20T12:00:00Z",
  });
  personal.situations.push(
    {
      id: "situation-alex-sam-warm",
      title: "Warm introduction",
      occurredAt: "2026-07-18T12:00:00Z",
      personIds: ["person-you", "person-alex", "person-sam"],
      eventClaimIds: ["claim-alex-sam-warm"],
    },
    {
      id: "situation-alex-sam-exclusion",
      title: "Request to leave Sam out",
      occurredAt: "2026-07-20T12:00:00Z",
      personIds: ["person-you", "person-alex", "person-sam"],
      eventClaimIds: ["claim-alex-sam-exclusion"],
    },
  );
  personal.claims.push(
    {
      id: "claim-alex-sam-warm",
      situationId: "situation-alex-sam-warm",
      personIds: ["person-you", "person-alex", "person-sam"],
      type: "user_report",
      text: "Alex was warm and kind when Sam joined the group.",
      source: { kind: "user_entry", reference: "User entry" },
      confidence: "moderate",
      userConfirmation: "confirmed",
    },
    {
      id: "claim-alex-sam-exclusion",
      situationId: "situation-alex-sam-exclusion",
      personIds: ["person-you", "person-alex", "person-sam"],
      type: "direct_observation",
      text: "Alex asked me not to invite Sam to the next group plan.",
      source: { kind: "user_entry", reference: "User entry" },
      confidence: "high",
      userConfirmation: "confirmed",
    },
  );
  personal.selectedSituationIds = personal.situations.map(
    (situation) => situation.id,
  );

  const result = buildContextResult({
    caseData: personal,
    message: personal.incoming.text,
    senderId: "person-alex",
    selectedSituationIds: personal.selectedSituationIds,
    goal: "clarify_intent",
    desiredTone: "warm",
  });

  assert.equal(result.merlinInsight.modelSource, "local-pattern-rules");
  assert.match(result.merlinInsight.title, /Alex and Sam/i);
  assert.equal(result.merlinInsight.evidence.length, 2);
  assert.equal(
    result.merlinInsight.hypotheses.some((item) => /romantic/i.test(item.label)),
    false,
  );
  assert.match(result.merlinInsight.nextBestQuestion, /without supplying a motive/i);
});

test("a user can downweight or exclude evidence without deleting the event", () => {
  const demo = createPatternDemoCase();
  demo.patternEvidenceAdjustments = {
    "situation-deleted-question": "exclude",
  };
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });
  const deletedEvidence = result.merlinInsight.evidence.find(
    (item) => item.situationId === "situation-deleted-question",
  );
  const friction = result.merlinInsight.hypotheses.find(
    (hypothesis) => hypothesis.id === "friction",
  );

  assert.equal(result.merlinInsight.evidence.length, 3);
  assert.equal(deletedEvidence.adjustment, "exclude");
  assert.equal(deletedEvidence.effectiveWeight, 0);
  assert.ok(friction.probability > 0.5);
});

test("pattern demo response asks for context without asserting a motive", () => {
  const demo = createPatternDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: "clarify_intent",
    desiredTone: "warm",
  });

  assert.equal(result.meta.intentCategory, "boundary");
  assert.match(result.contextual.draft, /something unresolved/i);
  assert.doesNotMatch(result.contextual.draft, /romantic|jealous/i);
  assert.ok(
    result.contextual.responseOptions.some(
      (option) => option.id === "avoid-triangle",
    ),
  );
});

test("demo social graph keeps observed third-party relationships explicit", () => {
  const demo = createDemoCase();
  const personIds = new Set(demo.people.map((person) => person.id));

  assert.ok(demo.people.some((person) => person.id === "person-priya"));
  assert.ok(demo.relationshipConnections.length >= 1);
  for (const connection of demo.relationshipConnections) {
    assert.ok(personIds.has(connection.fromPersonId));
    assert.ok(personIds.has(connection.toPersonId));
    assert.notEqual(connection.fromPersonId, "person-you");
    assert.notEqual(connection.toPersonId, "person-you");
    assert.notEqual(connection.fromPersonId, connection.toPersonId);
    assert.ok(connection.strength >= 0 && connection.strength <= 4);
    assert.ok(connection.confidence >= 0 && connection.confidence <= 4);
    assert.equal(connection.userConfirmation, "confirmed");
  }
});

test("closeness and trust remain independent relationship dimensions", () => {
  const demo = createDemoCase();
  const maya = demo.people.find((person) => person.id === "person-maya");

  assert.equal(maya.closeness, 2);
  assert.equal(maya.trust, 3);
  maya.closeness = 4;
  assert.equal(maya.trust, 3);
});

test("timeline events remain separate linked objects", () => {
  const demo = createDemoCase();
  const ids = demo.situations.map((situation) => situation.id);

  assert.equal(new Set(ids).size, demo.situations.length);
  assert.equal(
    demo.situations.find((item) => item.id === "situation-availability")
      .eventClaimIds[0],
    "claim-availability",
  );
  assert.equal(
    demo.situations.find((item) => item.id === "situation-deadline")
      .eventClaimIds[0],
    "claim-deadline",
  );
});

test("a missing event date remains null and retrieval uses record order safely", () => {
  const blank = createBlankCase();
  blank.people.push({
    id: "person-fran",
    displayName: "Fran",
    relationshipType: "Relationship not yet specified",
    closeness: 1,
    trust: 1,
    communicationNotes: [],
    boundaries: [],
    relationshipGoals: [],
    currentState: "Developing record",
  });
  blank.situations.push({
    id: "situation-undated",
    title: "Screenshot conversation with Fran",
    occurredAt: null,
    datePrecision: "unknown",
    dateSource: "not_visible",
    capturedAt: "2026-07-20T12:00:00Z",
    recordSequence: 0,
    personIds: ["person-you", "person-fran"],
    eventClaimIds: ["claim-undated"],
  });
  blank.claims.push({
    id: "claim-undated",
    situationId: "situation-undated",
    personIds: ["person-you", "person-fran"],
    type: "direct_observation",
    text: "Fran: I arranged the technician for tomorrow.",
    source: { kind: "screenshot", reference: "fran.png" },
    confidence: "high",
    userConfirmation: "confirmed",
  });

  const context = retrieveRelevantContext({
    caseData: blank,
    senderId: "person-fran",
    selectedSituationIds: ["situation-undated"],
  });

  assert.equal(context.situations[0].occurredAt, null);
  assert.equal(context.situations[0].dateSource, "not_visible");
});

test("retrieval never leaks another person's situation", () => {
  const demo = createDemoCase();
  const context = retrieveRelevantContext({
    caseData: demo,
    senderId: "person-maya",
    selectedSituationIds: [
      "situation-availability",
      "situation-package",
    ],
  });

  assert.deepEqual(
    context.situations.map((item) => item.id),
    ["situation-availability"],
  );
  assert.equal(
    context.claims.some((claim) => claim.personIds.includes("person-leo")),
    false,
  );
});

test("AI interpretations remain unreviewed and never become facts", () => {
  const demo = createDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });

  for (const interpretation of result.epistemic.interpretations) {
    assert.equal(interpretation.type, "ai_inference");
    assert.equal(interpretation.userConfirmation, "unreviewed");
  }
});

test("selected context materially changes the response and cites its basis", () => {
  const demo = createDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    goal: "warm_boundary",
    desiredTone: "warm",
  });

  assert.notEqual(result.generic.draft, result.contextual.draft);
  assert.match(result.contextual.draft, /offline tonight/i);
  assert.ok(result.contextual.basis.length >= 4);
});

test("changing the user's goal changes the contextual response", () => {
  const demo = createDemoCase();
  const common = {
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: demo.selectedSituationIds,
    desiredTone: "warm",
  };
  const boundary = buildContextResult({
    ...common,
    goal: "warm_boundary",
  });
  const clarify = buildContextResult({
    ...common,
    goal: "clarify_intent",
  });

  assert.notEqual(boundary.contextual.draft, clarify.contextual.draft);
  assert.match(clarify.contextual.draft, /did you mean/i);
});

test("removing prior phrase context lowers interpretive support", () => {
  const demo = createDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: demo.incoming.text,
    senderId: demo.incoming.senderPersonId,
    selectedSituationIds: [
      "situation-availability",
      "situation-deadline",
    ],
    goal: demo.currentGoal,
    desiredTone: demo.desiredTone,
  });

  assert.equal(result.contextual.confidence, "low");
  assert.match(result.contextual.interpretation, /ambiguity remains/i);
});

test("explicit desire for a hug is treated as stated intent, not total ambiguity", () => {
  const demo = createDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: "I want to hug you",
    senderId: "person-maya",
    selectedSituationIds: demo.selectedSituationIds,
    goal: "warm_boundary",
    desiredTone: "warm",
  });

  assert.ok(
    result.epistemic.facts.some((fact) =>
      /explicitly states a desire for a hug/i.test(fact.text),
    ),
  );
  assert.match(result.contextual.interpretation, /explicitly states a desire for a hug/i);
  assert.match(result.contextual.interpretation, /not why they want it/i);
  assert.ok(
    result.epistemic.uncertainties.some((item) =>
      /motive behind (?:a |the )?hug/i.test(item),
    ),
  );
});

test("physical affection produces multiple relationship-aware response directions", () => {
  const demo = createDemoCase();
  const maya = demo.people.find((person) => person.id === "person-maya");
  maya.closeness = 4;
  maya.trust = 4;
  const result = buildContextResult({
    caseData: demo,
    message: "I want to hug you",
    senderId: "person-maya",
    selectedSituationIds: demo.selectedSituationIds,
    goal: "welcome_connection",
    desiredTone: "warm",
  });

  assert.ok(result.contextual.responseOptions.length >= 4);
  assert.ok(result.contextual.responseOptions.some((item) => item.id === "boundary"));
  assert.match(result.contextual.draft, /like that too/i);
  assert.match(result.contextual.explanation, /closeness \(4\/4\)/i);
});

test("a relevant physical boundary takes priority over a warm default", () => {
  const demo = createDemoCase();
  const maya = demo.people.find((person) => person.id === "person-maya");
  maya.boundaries = ["I am not comfortable with hugs."];
  const result = buildContextResult({
    caseData: demo,
    message: "I want to hug you",
    senderId: "person-maya",
    selectedSituationIds: demo.selectedSituationIds,
    goal: "warm_boundary",
    desiredTone: "warm",
  });

  assert.match(result.contextual.draft, /not comfortable with hugs/i);
  assert.equal(
    result.contextual.responseOptions.find((item) => item.recommended)?.id,
    "boundary",
  );
});

test("the local reasoning engine covers a broad range of message intents", () => {
  const fixtures = [
    ["Thank you for being there for me.", "gratitude"],
    ["How are you after yesterday?", "check_in"],
    ["I’m here for you if you need to talk.", "support_offer"],
    ["I’m overwhelmed and don’t know what to do.", "distress"],
    ["I felt dismissed when you changed the plan.", "conflict"],
    ["Please don’t call me after work.", "boundary"],
    ["Good news — I got approved!", "celebration"],
    ["I’ve decided to accept the new role.", "decision"],
    ["Just letting you know, the deadline has moved.", "update"],
    ["I’m sorry I broke your confidence.", "apology"],
    ["Could you send me the notes?", "request"],
    ["Would you like to get coffee?", "invitation"],
    ["I miss you.", "emotional_affection"],
    ["I want to hug you.", "physical_affection"],
  ];

  for (const [message, category] of fixtures) {
    const demo = createDemoCase();
    const result = buildContextResult({
      caseData: demo,
      message,
      senderId: "person-maya",
      selectedSituationIds: demo.selectedSituationIds,
      goal: "warm_boundary",
      desiredTone: "warm",
    });

    assert.equal(result.meta.intentCategory, category, message);
    assert.equal(result.meta.explicitIntentDetected, true, message);
    assert.ok(result.contextual.responseOptions.length >= 3, message);
    assert.equal(
      new Set(result.contextual.responseOptions.map((item) => item.text)).size,
      result.contextual.responseOptions.length,
      message,
    );
  }
});

test("changing relationship closeness changes a celebration response", () => {
  const demo = createDemoCase();
  const maya = demo.people.find((person) => person.id === "person-maya");
  const common = {
    caseData: demo,
    message: "Good news — I got approved!",
    senderId: "person-maya",
    selectedSituationIds: [],
    goal: "welcome_connection",
    desiredTone: "warm",
  };

  maya.closeness = 1;
  const developing = buildContextResult(common);
  maya.closeness = 4;
  const close = buildContextResult(common);

  assert.notEqual(developing.contextual.draft, close.contextual.draft);
  assert.match(close.contextual.draft, /tell me everything/i);
});

test("an edited strained relationship state tempers a high-closeness reply", () => {
  const demo = createDemoCase();
  const maya = demo.people.find((person) => person.id === "person-maya");
  maya.closeness = 4;
  maya.currentState = "Strained and uncertain";
  const result = buildContextResult({
    caseData: demo,
    message: "Good news — I got approved!",
    senderId: "person-maya",
    selectedSituationIds: [],
    goal: "welcome_connection",
    desiredTone: "warm",
  });

  assert.doesNotMatch(result.contextual.draft, /tell me everything/i);
  assert.match(result.contextual.explanation, /wording remains measured/i);
  assert.ok(
    result.contextual.basis.some((item) => /strained and uncertain/i.test(item.text)),
  );
});

test("intent detection avoids common literal-keyword false positives", () => {
  const fixtures = [
    ["I can’t wait to see you.", "boundary"],
    ["I need to hold you accountable.", "physical_affection"],
    ["The coffee was terrible.", "invitation"],
  ];

  for (const [message, incorrectCategory] of fixtures) {
    const demo = createDemoCase();
    const result = buildContextResult({
      caseData: demo,
      message,
      senderId: "person-maya",
      selectedSituationIds: [],
      goal: "warm_boundary",
      desiredTone: "warm",
    });
    assert.notEqual(result.meta.intentCategory, incorrectCategory, message);
  }
});

test("physical response language preserves the stated action", () => {
  const demo = createDemoCase();
  const result = buildContextResult({
    caseData: demo,
    message: "Can I kiss you?",
    senderId: "person-maya",
    selectedSituationIds: [],
    goal: "keep_distance",
    desiredTone: "direct",
  });
  const responseText = result.contextual.responseOptions
    .map((option) => option.text)
    .join(" ");

  assert.match(result.contextual.interpretation, /a kiss/i);
  assert.match(result.contextual.draft, /a kiss/i);
  assert.doesNotMatch(responseText, /\bhug\b/i);
});
