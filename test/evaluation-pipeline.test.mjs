import test from "node:test";
import assert from "node:assert/strict";
import {
  runEvaluation,
  validateResultContract,
  validateUserInputContract,
} from "../scripts/run-context-evals.mjs";

test("Team Abby synthetic evaluation materializes complete user-shaped inputs", () => {
  const { report, materializedInputs } = runEvaluation({ writeReports: false });

  assert.equal(report.summary.total_cases, 28);
  assert.equal(materializedInputs.length, 28);
  for (const input of materializedInputs) {
    assert.deepEqual(validateUserInputContract(input), []);
    assert.equal(input.metadata.synthetic, true);
    assert.equal(input.metadata.data_class, "synthetic_evaluation");
    assert.equal(input.metadata.consent_scope, "synthetic_only");
    assert.equal(input.metadata.pii_status, "none");
    assert.deepEqual(input.case_data.relationshipConnections, []);
    assert.ok(input.case_data.people.some((person) => person.id === "person-decoy"));
  }
});

test("every synthetic result satisfies the output contract and evaluation suite", () => {
  const { report, materializedResults } = runEvaluation({
    writeReports: false,
  });

  assert.equal(report.summary.passed_cases, 28);
  assert.equal(report.summary.failed_cases, 0);
  assert.equal(report.summary.intent_accuracy, 100);
  assert.equal(report.summary.epistemic_integrity, 100);
  assert.equal(report.summary.relationship_isolation, 100);
  assert.equal(report.summary.zero_cost_compliance, 100);
  for (const item of materializedResults) {
    assert.deepEqual(validateResultContract(item.result), []);
  }
});

test("the report covers every supported intent family with two contexts", () => {
  const { report } = runEvaluation({ writeReports: false });
  const coverage = Object.values(report.intent_coverage);

  assert.equal(coverage.length, 14);
  assert.ok(coverage.every((entry) => entry.cases === 2));
  assert.ok(coverage.every((entry) => entry.pass_rate === 100));
});
