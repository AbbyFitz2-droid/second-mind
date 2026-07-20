import test from "node:test";
import assert from "node:assert/strict";
import { parseClaims } from "../lib/reasoning.mjs";

const fixtures = [
  ["event", "My manager said we can revisit this later."],
  ["event", "She cancelled the meeting yesterday."],
  ["event", "I received a message this morning."],
  ["event", "We agreed to meet on Friday."],
  ["event", "They did not answer my question."],
  ["event", "Alex asked me to wait."],
  ["event", "He interrupted me twice."],
  ["event", "No launch decision was stated."],

  ["feeling", "I feel angry about the change."],
  ["feeling", "I felt hurt after the conversation."],
  ["feeling", "I am feeling anxious today."],
  ["feeling", "I'm feeling overwhelmed by the deadline."],
  ["feeling", "That made me feel unimportant."],
  ["feeling", "I am sad that the project ended."],
  ["feeling", "I feel excited about the possibility."],
  ["feeling", "I am embarrassed by my response."],

  ["interpretation", "I think they are dismissing me."],
  ["interpretation", "I believe the delay was avoidable."],
  ["interpretation", "I assume they disagree."],
  ["interpretation", "I suspect the answer is no."],
  ["interpretation", "It seems like they are distracted."],
  ["interpretation", "This means they do not value the work."],
  ["interpretation", "They looked annoyed."],
  ["interpretation", "It felt like a rejection."],
  ["interpretation", "They are probably avoiding the question."],
  ["interpretation", "They are definitely a narcissist."],

  ["goal", "I want more notice next time."],
  ["goal", "I do not want to assign blame."],
  ["goal", "I need a clear answer."],
  ["goal", "I hope we can preserve the relationship."],
  ["goal", "My goal is to explain the impact."],
  ["goal", "I would like to respond calmly."],
  ["goal", "I'd like to ask one direct question."],
  ["goal", "Please help me express this clearly."],

  ["question", "Should I accept the offer?"],
  ["question", "I am wondering whether I should leave."],
  ["question", "I need to decide between speed and trust."],
  ["question", "I am trying to decide whether to reply."],
  ["question", "I am choosing between two jobs."],
  ["question", "Do I wait or ask again?"],
  ["question", "Which option is reversible?"],
  ["question", "Can I test this before committing?"],

  ["interpretation", "I do not think they understood me."],
  ["interpretation", "They are not a psychopath."],
  ["feeling", "I never felt safe in that situation."],
  ["statement", "Maybe they forgot."],
  ["statement", "The available context is incomplete."],
  ["goal", "I don't want to react immediately."],
];

test("48 epistemic fixtures retain their expected claim type", () => {
  assert.equal(fixtures.length, 48);
  for (const [expected, input] of fixtures) {
    const claims = parseClaims(input);
    assert.equal(claims.length > 0, true, `no claim: ${input}`);
    assert.equal(claims[0].type, expected, input);
  }
});

test("negation and uncertainty are retained as metadata", () => {
  const negated = parseClaims("No launch decision was stated.")[0];
  const uncertain = parseClaims("Maybe they forgot.")[0];
  assert.equal(negated.negated, true);
  assert.equal(uncertain.uncertain, true);
});
