import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeWritingMechanics,
  findClarityOpportunities,
} from "../lib/writing-mechanics.mjs";

test("writing mechanics corrects the reported Rewrite failure", () => {
  const result = analyzeWritingMechanics(
    "I am prepareed and ready tp take on the responsibility.",
  );

  assert.equal(
    result.correctedText,
    "I am prepared and ready to take on the responsibility.",
  );
  assert.deepEqual(
    result.corrections.map((item) => [item.original, item.replacement]),
    [
      ["prepareed", "prepared"],
      ["tp", "to"],
    ],
  );
  assert.ok(result.corrections.every((item) => item.confidence === "high"));
});

test("writing mechanics catches common typos, repetition, spacing, and punctuation", () => {
  const result = analyzeWritingMechanics(
    "i definately definitely want  to recieve the report tomorrow",
  );

  assert.equal(
    result.correctedText,
    "I definitely want to receive the report tomorrow.",
  );
  assert.ok(result.corrections.some((item) => item.type === "repeated_word"));
  assert.ok(result.corrections.some((item) => item.type === "spacing"));
  assert.ok(result.corrections.some((item) => item.type === "punctuation"));
});

test("correct wording is preserved without compulsory stylistic rewriting", () => {
  const message = "I am ready to take on the responsibility.";
  const result = analyzeWritingMechanics(message);

  assert.equal(result.correctedText, message);
  assert.deepEqual(result.corrections, []);
});

test("clarity opportunities are optional rather than automatic deletions", () => {
  const opportunities = findClarityOpportunities(
    "I am prepared and ready to take on the responsibility.",
  );

  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].phrase, "prepared and ready");
  assert.equal(opportunities[0].optional, true);
});
