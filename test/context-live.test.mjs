import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDemoCase } from "../lib/context.mjs";
import { buildContextResult } from "../lib/context.mjs";
import {
  buildContextLiveInput,
  buildContextLiveInstructions,
  mergeContextLiveResult,
  CONTEXT_LIVE_SCHEMA,
} from "../lib/context-live.mjs";

function deterministicResult(overrides = {}) {
  const caseData = createDemoCase();
  return buildContextResult({
    caseData,
    message: "No worries, I will leave you to it.",
    senderId: "person-maya",
    selectedSituationIds: caseData.selectedSituationIds || [],
    goal: "warm_boundary",
    desiredTone: "warm",
    ...overrides,
  });
}

function liveSample(overrides = {}) {
  return {
    contextual_interpretation: "Maya may be giving you space rather than withdrawing.",
    contextual_confidence_label: "wording inspectable; her intent is not observable",
    contextual_explanation: "The phrase follows a stated evening boundary, so it likely respects it.",
    response_options: [
      { label: "Warm close", text: "Thanks, talk tomorrow.", why: "Matches the boundary.", recommended: true },
      { label: "Clarify", text: "All good, did you mean to stop for tonight?", why: "Checks the reading.", recommended: false },
    ],
    interpretations: [
      { text: "She is respecting the stated boundary.", confidence: "moderate" },
    ],
    alternatives: [
      "She is simply ending the conversation for the night.",
      "She may be mildly annoyed and disengaging.",
    ],
    uncertainties: ["Whether she plans to continue tomorrow is not stated."],
    ...overrides,
  };
}

describe("context live schema", () => {
  it("is strict and required matches properties", () => {
    assert.equal(CONTEXT_LIVE_SCHEMA.additionalProperties, false);
    assert.deepEqual(
      [...CONTEXT_LIVE_SCHEMA.required].sort(),
      Object.keys(CONTEXT_LIVE_SCHEMA.properties).sort(),
    );
  });

  it("response option items require a recommended flag", () => {
    const optionSchema = CONTEXT_LIVE_SCHEMA.properties.response_options.items;
    assert.ok(optionSchema.required.includes("recommended"));
  });
});

describe("context live instructions", () => {
  it("changes with the goal", () => {
    const boundary = buildContextLiveInstructions({ goal: "warm_boundary", desiredTone: "warm" });
    const record = buildContextLiveInstructions({ goal: "create_record", desiredTone: "direct" });
    assert.notEqual(boundary, record);
    assert.match(record, /factual record/);
  });

  it("requires genuinely different response options and one recommendation", () => {
    const instructions = buildContextLiveInstructions({ goal: "warm_boundary", desiredTone: "warm" });
    assert.match(instructions, /real differences in approach/);
    assert.match(instructions, /exactly one response option as recommended/);
  });
});

describe("context live input", () => {
  it("includes only locally retrieved facts, never inventing evidence", () => {
    const deterministic = deterministicResult();
    const input = buildContextLiveInput({
      person: deterministic.retrievedContext.person,
      facts: deterministic.epistemic.facts,
      boundary: "No non-urgent work conversation after 20:00.",
      message: "No worries, I will leave you to it.",
    });
    assert.match(input, /KNOWN FACTS, ALREADY RETRIEVED LOCALLY/);
    assert.match(input, /INCOMING MESSAGE/);
    assert.match(input, /Boundary: No non-urgent work conversation/);
    for (const fact of deterministic.epistemic.facts) {
      assert.ok(input.includes(fact.text));
    }
  });
});

describe("merge of live context result", () => {
  it("overrides the judgment layer and preserves local evidence untouched", () => {
    const deterministic = deterministicResult();
    const merged = mergeContextLiveResult(deterministic, liveSample(), "gpt-5.6-terra");
    assert.equal(merged.contextual.interpretation, liveSample().contextual_interpretation);
    assert.equal(merged.contextual.explanation, liveSample().contextual_explanation);
    assert.deepEqual(merged.contextual.basis, deterministic.contextual.basis);
    assert.deepEqual(merged.epistemic.facts, deterministic.epistemic.facts);
    assert.deepEqual(merged.retrievedContext, deterministic.retrievedContext);
    assert.equal(merged.meta.source, "live");
    assert.equal(merged.meta.paidApiUsed, true);
    assert.equal(merged.meta.model, "gpt-5.6-terra");
  });

  it("picks the draft from whichever option is recommended", () => {
    const deterministic = deterministicResult();
    const merged = mergeContextLiveResult(deterministic, liveSample(), "m");
    assert.equal(merged.contextual.draft, "Thanks, talk tomorrow.");
    assert.equal(merged.contextual.responseOptions[0].recommended, true);
    assert.equal(merged.contextual.responseOptions[1].recommended, false);
  });

  it("falls back to marking the first option recommended if the model marks zero or several", () => {
    const deterministic = deterministicResult();
    const noneRecommended = liveSample({
      response_options: [
        { label: "A", text: "Text A", why: "why A", recommended: false },
        { label: "B", text: "Text B", why: "why B", recommended: false },
      ],
    });
    const merged = mergeContextLiveResult(deterministic, noneRecommended, "m");
    assert.equal(merged.contextual.responseOptions[0].recommended, true);
    assert.equal(merged.contextual.draft, "Text A");
  });

  it("maps interpretations into the epistemic review shape the UI expects", () => {
    const deterministic = deterministicResult();
    const merged = mergeContextLiveResult(deterministic, liveSample(), "m");
    const interpretation = merged.epistemic.interpretations[0];
    assert.equal(interpretation.type, "ai_inference");
    assert.equal(interpretation.source, "Live reasoning");
    assert.equal(interpretation.userConfirmation, "unreviewed");
    assert.equal(interpretation.confidence, "moderate");
  });

  it("keeps deterministic alternatives and uncertainties when the model returns none", () => {
    const deterministic = deterministicResult();
    const merged = mergeContextLiveResult(
      deterministic,
      liveSample({ alternatives: [], uncertainties: [] }),
      "m",
    );
    assert.deepEqual(merged.epistemic.alternatives, deterministic.epistemic.alternatives);
    assert.deepEqual(merged.epistemic.uncertainties, deterministic.epistemic.uncertainties);
  });
});
