import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInstructions,
  demoResponse,
  extractResponseText,
  parseClaims,
  REASONING_SCHEMA,
} from "../lib/reasoning.mjs";

test("schema requires every visible epistemic layer", () => {
  const required = new Set(REASONING_SCHEMA.required);
  for (const field of [
    "observations",
    "inferences",
    "alternatives",
    "unknowns",
    "reflection_question",
    "agency_note",
  ]) {
    assert.equal(required.has(field), true);
  }
  assert.equal(REASONING_SCHEMA.additionalProperties, false);
});

test("instructions prohibit identity and sensitive inferences", () => {
  const prompt = buildInstructions("reflect");
  assert.match(prompt, /Never convert self-report into identity/);
  assert.match(prompt, /Never infer personality/);
  assert.match(prompt, /Do not flatter/);
});

test("demo response remains a complete structured reasoning card", () => {
  const result = demoResponse(
    "clarity",
    "I want to discuss a deadline without sounding hostile.",
  );
  for (const key of REASONING_SCHEMA.required) {
    assert.equal(Object.hasOwn(result, key), true, `missing ${key}`);
  }
  assert.ok(result.observations.length > 0);
  assert.ok(result.alternatives.length > 0);
});

test("local demo responds to the user's actual language", () => {
  const decision = demoResponse(
    "think",
    "I want to launch quickly, but I need to protect user trust.",
  );
  const friendship = demoResponse(
    "think",
    "My friend cancelled our plan again and I am not sure what it means.",
  );

  const decisionText = JSON.stringify(decision);
  assert.match(decisionText, /launch quickly/i);
  assert.match(decisionText, /protect user trust/i);
  assert.match(friendship.observations[0].text, /friend cancelled/i);
  assert.notDeepEqual(decision.inferences, friendship.inferences);
});

test("five lenses hold evidence constant while changing the cognitive operation", () => {
  const input =
    "My manager said we can revisit this later. I think they are dismissing me, and I am wondering whether I should raise it again.";
  const results = ["think", "pause", "clarity", "reflect", "challenge"].map(
    (mode) => demoResponse(mode, input),
  );

  for (const result of results.slice(1)) {
    assert.deepEqual(result.observations, results[0].observations);
  }

  assert.equal(new Set(results.map((result) => result.title)).size, 5);
  assert.equal(new Set(results.map((result) => result.understood_goal)).size, 5);
  assert.equal(
    new Set(results.map((result) => JSON.stringify(result.alternatives))).size,
    5,
  );
  assert.equal(
    new Set(results.map((result) => result.reflection_question)).size,
    5,
  );
});

test("claim parser separates event, interpretation, and decision", () => {
  const claims = parseClaims(
    "My manager said we can revisit this later. I think they are dismissing me, and I am wondering whether I should quit.",
  );

  assert.deepEqual(
    claims.map((claim) => claim.type),
    ["event", "interpretation", "question"],
  );
});

test("negated decision language is not treated as a decision request", () => {
  const claims = parseClaims("No launch decision was stated.");
  assert.equal(claims[0].type, "event");
  assert.equal(claims[0].negated, true);
  assert.equal(demoResponse("reflect", "No launch decision was stated.").title, "Review without rewriting the event");
});

test("diagnostic labels remain interpretations rather than observations", () => {
  const result = demoResponse("think", "They are definitely a narcissist.");
  assert.match(result.observations[0].text, /interpretation/i);
  assert.match(result.inferences[0].basis, /not an observed behaviour or diagnosis/i);
  assert.match(result.reflection_question, /specific behaviour/i);
});

test("clarity mode removes speech fillers without inventing a new position", () => {
  const result = demoResponse(
    "clarity",
    "Um, I guess I want to explain that I need more notice, you know.",
  );

  assert.equal(result.possible_wording, "I want to explain that I need more notice.");
  assert.match(result.agency_note, /generated locally/i);
});

test("response extraction distinguishes text and refusals", () => {
  assert.deepEqual(
    extractResponseText({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "{\"ok\":true}" }],
        },
      ],
    }),
    { text: "{\"ok\":true}" },
  );

  assert.deepEqual(
    extractResponseText({
      output: [
        {
          type: "message",
          content: [{ type: "refusal", refusal: "Cannot help." }],
        },
      ],
    }),
    { refusal: "Cannot help." },
  );
});
