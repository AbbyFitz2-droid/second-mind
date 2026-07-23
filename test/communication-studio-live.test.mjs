import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDemoCase } from "../lib/context.mjs";
import { analyzeCommunicationDraft } from "../lib/communication-studio.mjs";
import {
  buildStudioLiveInput,
  buildStudioLiveInstructions,
  mergeStudioLiveResult,
  STUDIO_LIVE_SCHEMA,
} from "../lib/communication-studio-live.mjs";

function deterministicResult(overrides = {}) {
  return analyzeCommunicationDraft({
    caseData: createDemoCase(),
    senderId: "person-maya",
    receivedMessage: "No worries, I will leave you to it.",
    draftReply: "Sorry, I did not mean it like that.",
    selectedSituationIds: [],
    goal: "warm_boundary",
    desiredTone: "warm",
    mode: "review",
    ...overrides,
  });
}

function liveSample() {
  return {
    observation: "The message closes the conversation without stating a reason.",
    possible_interpretation: { text: "She is giving you space.", confidence: "moderate" },
    alternative_interpretation: { text: "She felt brushed off.", confidence: "low" },
    confidence_label: "Wording inspectable; her reaction is not observable",
    confidence_rationale: "Only the words and selected records are available.",
    suggested_adjustment: "Name the boundary explicitly instead of apologising.",
    revised_message: "I did mean tonight, just not for work talk. Coffee tomorrow?",
    alternatives: [],
  };
}

describe("studio live schema", () => {
  it("is a strict schema whose required list matches its properties", () => {
    assert.equal(STUDIO_LIVE_SCHEMA.additionalProperties, false);
    assert.deepEqual(
      [...STUDIO_LIVE_SCHEMA.required].sort(),
      Object.keys(STUDIO_LIVE_SCHEMA.properties).sort(),
    );
  });
});

describe("studio live instructions", () => {
  it("changes with the goal so goals visibly shape replies", () => {
    const boundary = buildStudioLiveInstructions({
      mode: "review", goal: "warm_boundary", desiredTone: "warm",
    });
    const record = buildStudioLiveInstructions({
      mode: "review", goal: "create_record", desiredTone: "warm",
    });
    assert.notEqual(boundary, record);
    assert.match(record, /factual record/);
    assert.match(boundary, /boundary/);
  });

  it("changes with the mode", () => {
    const predict = buildStudioLiveInstructions({
      mode: "predict", goal: "warm_boundary", desiredTone: "warm",
    });
    assert.match(predict, /recipient might realistically read/);
  });
});

describe("studio live input", () => {
  it("includes boundaries and context records, and labels a draft brief", () => {
    const caseData = createDemoCase();
    const person = caseData.people.find((item) => item.id === "person-maya");
    const deterministic = deterministicResult();
    const input = buildStudioLiveInput({
      person,
      relevantContext: deterministic.relevantContext,
      receivedMessage: "Plan a kind check-in",
      draftReply: "",
      mode: "draft",
    });
    assert.match(input, /Boundaries:/);
    assert.match(input, /SELECTED CONTEXT RECORDS/);
    assert.match(input, /WHAT THE USER WANTS TO COMMUNICATE/);
  });
});

describe("merge of live result", () => {
  it("overrides judgment fields and preserves local evidence and mechanics", () => {
    const deterministic = deterministicResult();
    const merged = mergeStudioLiveResult(deterministic, liveSample(), "gpt-5.6-terra");
    assert.equal(merged.observation, liveSample().observation);
    assert.equal(merged.revisedMessage, liveSample().revised_message);
    assert.deepEqual(merged.relevantContext, deterministic.relevantContext);
    assert.deepEqual(merged.writingMechanics, deterministic.writingMechanics);
    assert.equal(merged.meta.source, "live");
    assert.equal(merged.meta.paidApiUsed, true);
    assert.equal(merged.meta.model, "gpt-5.6-terra");
  });

  it("keeps deterministic alternatives when the live model offers none", () => {
    const deterministic = deterministicResult({ mode: "compare" });
    assert.ok(deterministic.alternatives.length > 0);
    const merged = mergeStudioLiveResult(deterministic, liveSample(), "m");
    assert.deepEqual(merged.alternatives, deterministic.alternatives);
  });

  it("maps live alternatives into the interface shape", () => {
    const deterministic = deterministicResult();
    const live = {
      ...liveSample(),
      alternatives: [{ label: "Softer", text: "Maybe tomorrow?", note: "Less direct." }],
    };
    const merged = mergeStudioLiveResult(deterministic, live, "m");
    assert.equal(merged.alternatives.length, 1);
    assert.equal(merged.alternatives[0].label, "Softer");
    assert.ok(merged.alternatives[0].id);
  });
});
