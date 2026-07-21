import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  analyzeCommunicationDraft,
  createCommunicationCoachSample,
} from "../lib/communication-studio.mjs";
import { createDemoCase } from "../lib/context.mjs";

function analyze(overrides = {}) {
  const caseData = overrides.caseData || createDemoCase();
  return analyzeCommunicationDraft({
    caseData,
    senderId: caseData.incoming.senderPersonId,
    receivedMessage: caseData.incoming.text,
    draftReply: "Thanks for letting me know.",
    selectedSituationIds: caseData.selectedSituationIds,
    goal: caseData.currentGoal,
    desiredTone: caseData.desiredTone,
    mode: "review",
    ...overrides,
  });
}

test("medical example catches the omission and abrupt pivot without inventing a reaction", () => {
  const sample = createCommunicationCoachSample();
  const result = analyze({
    receivedMessage: sample.receivedMessage,
    draftReply: sample.draftReply,
    goal: "welcome_connection",
  });
  const ids = result.checks.map((check) => check.id);

  assert.ok(ids.includes("unacknowledged-medical-disclosure"));
  assert.ok(ids.includes("abrupt-topic-change"));
  assert.ok(ids.includes("goal-mismatch"));
  assert.match(result.observation, /medical disclosure/i);
  assert.match(result.possibleInterpretation.text, /could read/i);
  assert.match(result.alternativeInterpretation.text, /may instead/i);
  assert.match(result.confidence.label, /predicted reaction.*low/i);
  assert.doesNotMatch(
    `${result.possibleInterpretation.text} ${result.alternativeInterpretation.text}`,
    /\b(?:will feel|definitely thinks|we know)\b/i,
  );
});

test("medical example revision preserves the user's news while acknowledging the disclosure", () => {
  const sample = createCommunicationCoachSample();
  const result = analyze({
    receivedMessage: sample.receivedMessage,
    draftReply: sample.draftReply,
  });

  assert.match(result.revisedMessage, /sorry to hear/i);
  assert.match(result.revisedMessage, /tests give you some answers/i);
  assert.match(result.revisedMessage, /Lexisynap and GeoSynap/i);
  assert.match(result.revisedMessage, /OpenAI’s Build competition/i);
  assert.doesNotMatch(result.revisedMessage, /I don’t have scoliosis/i);
});

test("only textually relevant selected timeline items are cited", () => {
  const sample = createCommunicationCoachSample();
  const result = analyze({
    receivedMessage: sample.receivedMessage,
    draftReply: sample.draftReply,
  });

  assert.equal(
    result.relevantContext.some((item) => item.kind === "timeline"),
    false,
  );
  assert.ok(
    result.relevantContext.some(
      (item) => item.source === "Maya Chen relationship profile",
    ),
  );
  assert.ok(
    result.relevantContext.some((item) => item.source === "Current coaching goal"),
  );
});

test("Reply mode creates a supportive answer without requiring a prewritten draft", () => {
  const sample = createCommunicationCoachSample();
  const result = analyze({
    receivedMessage: sample.receivedMessage,
    draftReply: "",
    mode: "reply",
  });

  assert.match(result.revisedMessage, /sorry to hear/i);
  assert.match(result.revisedMessage, /clearer answers/i);
  assert.match(result.revisedMessage, /doing well, thanks for asking/i);
  assert.equal(result.meta.mode, "reply");
});

test("Draft mode turns a communication brief into an editable first message", () => {
  const result = analyze({
    receivedMessage: "I want to ask Maya whether we can move Tuesday’s meeting.",
    draftReply: "Thursday afternoon also works for me",
    mode: "draft",
  });

  assert.match(result.revisedMessage, /^Hi Maya,/i);
  assert.match(result.revisedMessage, /Thursday afternoon/i);
  assert.equal(result.meta.mode, "draft");
  assert.match(result.observation, /composition brief/i);
});

test("Compare mode returns warmer, direct, and concise alternatives", () => {
  const result = analyze({
    receivedMessage: "Can we move the meeting?",
    draftReply:
      "Hi Maya, Thursday afternoon works for me. Please let me know if that suits you.",
    mode: "compare",
  });

  assert.deepEqual(
    result.alternatives.map((item) => item.id),
    ["warmer", "direct", "concise"],
  );
  assert.ok(result.alternatives.every((item) => item.text.length > 0));
});

test("Rewrite corrects mechanics, explains each change, and preserves authorship", () => {
  const original = "I am prepareed and ready tp take on the responsibility.";
  const result = analyze({
    receivedMessage: "",
    draftReply: original,
    mode: "rewrite",
  });

  assert.equal(
    result.revisedMessage,
    "I am prepared and ready to take on the responsibility.",
  );
  assert.ok(result.checks.some((check) => check.id === "writing-mechanics"));
  assert.ok(result.checks.some((check) => check.id === "clarity-opportunity"));
  assert.match(result.suggestedAdjustment, /“prepareed” to “prepared”/i);
  assert.match(result.suggestedAdjustment, /“tp” to “to”/i);
  assert.match(result.observation, /2 likely writing corrections/i);
  assert.equal(result.writingMechanics.originalText, original);
});

test("Studio flags unanswered questions, missing boundaries, and motive certainty", () => {
  const unanswered = analyze({
    receivedMessage: "Can you send the report tomorrow?",
    draftReply: "Thanks for the update.",
  });
  assert.ok(unanswered.checks.some((check) => check.id === "unanswered-question"));

  const boundary = analyze({
    receivedMessage: "Can we continue the work chat after 20:00 tonight?",
    draftReply: "Sure, no problem.",
  });
  assert.ok(boundary.checks.some((check) => check.id === "missing-boundary"));

  const motive = analyze({
    receivedMessage: "I cannot make Friday.",
    draftReply: "You are just trying to avoid me.",
  });
  assert.ok(motive.checks.some((check) => check.id === "motive-certainty"));
});

test("Communication Studio UI exposes every tool and explicit agency controls", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  for (const mode of ["draft", "reply", "review", "rewrite", "predict", "compare"]) {
    assert.match(html, new RegExp(`data-studio-mode="${mode}"`));
  }
  assert.match(html, /id="useCoachRevisionButton"/);
  assert.match(html, /id="copyCoachRevisionButton"/);
  assert.match(html, /id="ignoreCoachSuggestionButton"/);
  assert.match(html, /Your draft stays unchanged/i);
});
