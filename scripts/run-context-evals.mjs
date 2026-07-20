import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildContextResult } from "../lib/context.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PROFILES_PATH = join(
  ROOT,
  "data/synthetic/relationship-profiles.v1.json",
);
const CASES_PATH = join(ROOT, "data/synthetic/evaluation-cases.v1.json");
const REPORTS_DIR = join(ROOT, "reports");
const PUBLIC_REPORT_PATH = join(ROOT, "public/evaluation-data.json");

export function runEvaluation({ writeReports = true } = {}) {
  const profilesDataset = readJson(PROFILES_PATH);
  const casesDataset = readJson(CASES_PATH);
  const profileMap = new Map(
    profilesDataset.profiles.map((profile) => [profile.profile_id, profile]),
  );
  const datasetErrors = validateDataset(profilesDataset, casesDataset);
  if (datasetErrors.length) {
    throw new Error(`Synthetic dataset is invalid:\n- ${datasetErrors.join("\n- ")}`);
  }

  const materializedInputs = [];
  const materializedResults = [];
  const rows = [];

  for (const evaluationCase of casesDataset.cases) {
    const input = materializeInput(evaluationCase, profileMap, profilesDataset);
    const inputErrors = validateUserInputContract(input);
    const startedAt = performance.now();
    const result = buildContextResult({
      caseData: input.case_data,
      message: input.interaction.message,
      senderId: input.interaction.sender_id,
      selectedSituationIds: input.interaction.selected_situation_ids,
      goal: input.interaction.goal,
      desiredTone: input.interaction.desired_tone,
    });
    const latencyMs = performance.now() - startedAt;
    const resultErrors = validateResultContract(result);
    const optionLabels = result.contextual.responseOptions.map(
      (option) => option.label,
    );
    const requiredLabels = evaluationCase.expected.required_option_labels || [];
    const recommended = result.contextual.responseOptions.filter(
      (option) => option.recommended,
    );
    const retrievedPersonIds = new Set(
      result.retrievedContext.claims.flatMap((claim) => claim.personIds),
    );
    const allResponseText = result.contextual.responseOptions
      .map((option) => option.text)
      .join(" ");
    const actionConsistency =
      !/\bkiss\b/i.test(input.interaction.message) ||
      !/\bhug\b/i.test(allResponseText);

    const checks = {
      input_schema: inputErrors.length === 0,
      result_schema: resultErrors.length === 0,
      intent_match:
        result.meta.intentCategory === evaluationCase.expected.intent_category,
      explicit_intent_match:
        result.meta.explicitIntentDetected ===
        evaluationCase.expected.explicit_intent,
      response_option_count:
        result.contextual.responseOptions.length >=
        evaluationCase.expected.minimum_response_options,
      required_options: requiredLabels.every((label) =>
        optionLabels.includes(label),
      ),
      response_diversity:
        new Set(
          result.contextual.responseOptions.map((option) => option.text),
        ).size === result.contextual.responseOptions.length,
      exactly_one_recommendation: recommended.length === 1,
      epistemic_separation:
        result.epistemic.facts.every((claim) => claim.type !== "ai_inference") &&
        result.epistemic.interpretations.every(
          (claim) =>
            claim.type === "ai_inference" &&
            claim.userConfirmation === "unreviewed",
        ),
      relationship_isolation:
        result.retrievedContext.person?.id === input.interaction.sender_id &&
        !retrievedPersonIds.has("person-decoy"),
      contextual_traceability: result.contextual.basis.length > 0,
      action_consistency: actionConsistency,
      zero_cost: result.meta.paidApiUsed === false,
    };
    const failedChecks = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    const status = failedChecks.length ? "fail" : "pass";

    rows.push({
      test_case_id: evaluationCase.test_case_id,
      profile_id: evaluationCase.profile_id,
      message: input.interaction.message,
      locale: input.metadata.locale,
      channel: input.metadata.channel,
      risk_level: evaluationCase.metadata.risk_level,
      tags: evaluationCase.metadata.tags,
      expected_intent: evaluationCase.expected.intent_category,
      actual_intent: result.meta.intentCategory,
      explicit_intent: result.meta.explicitIntentDetected,
      response_options: result.contextual.responseOptions.length,
      recommended_option: recommended[0]?.label || "",
      contextual_basis_items: result.contextual.basis.length,
      latency_ms: round(latencyMs, 3),
      status,
      failed_checks: failedChecks,
      checks,
      input_errors: inputErrors,
      result_errors: resultErrors,
      result_preview: {
        interpretation: result.contextual.interpretation,
        recommended_response: result.contextual.draft,
        uncertainties: result.epistemic.uncertainties,
      },
    });
    materializedInputs.push(input);
    materializedResults.push({
      test_case_id: evaluationCase.test_case_id,
      input_id: input.input_id,
      result,
    });
  }

  const report = buildReport({
    profilesDataset,
    casesDataset,
    rows,
  });

  if (writeReports) {
    mkdirSync(REPORTS_DIR, { recursive: true });
    writeFileSync(
      join(REPORTS_DIR, "team-abby-evaluation-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    writeFileSync(
      join(REPORTS_DIR, "team-abby-evaluation-report.csv"),
      toCsv(rows),
    );
    writeFileSync(
      join(REPORTS_DIR, "team-abby-evaluation-report.md"),
      toMarkdown(report),
    );
    writeFileSync(
      join(REPORTS_DIR, "materialized-user-inputs.jsonl"),
      toJsonLines(materializedInputs),
    );
    writeFileSync(
      join(REPORTS_DIR, "materialized-reasoning-results.jsonl"),
      toJsonLines(materializedResults),
    );
    writeFileSync(PUBLIC_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(
      join(ROOT, "public/team-abby-evaluation-report.csv"),
      toCsv(rows),
    );
  }

  return { report, materializedInputs, materializedResults };
}

export function materializeInput(
  evaluationCase,
  profileMap,
  profilesDataset,
) {
  const profile = profileMap.get(evaluationCase.profile_id);
  if (!profile) {
    throw new Error(`Unknown profile: ${evaluationCase.profile_id}`);
  }
  const decoy =
    profilesDataset.profiles.find(
      (candidate) => candidate.profile_id !== profile.profile_id,
    ) || profile;
  const targetClaims = profile.situations.map((situation) =>
    materializeClaim(situation, profile.person.id),
  );
  const targetSituations = profile.situations.map((situation) =>
    materializeSituation(situation, profile.person.id),
  );
  const decoySource = decoy.situations[0];
  const decoySituation = {
    ...materializeSituation(decoySource, "person-decoy"),
    id: "situation-decoy",
    eventClaimIds: ["claim-decoy"],
  };
  const decoyClaim = {
    ...materializeClaim(decoySource, "person-decoy"),
    id: "claim-decoy",
    situationId: "situation-decoy",
  };
  const selectedSituationIds =
    evaluationCase.interaction.selected_situation_ids ||
    targetSituations.map((situation) => situation.id);
  const now = "2026-07-19T12:00:00.000Z";

  return {
    schema_version: "1.0.0",
    input_id: `input-${evaluationCase.test_case_id}`,
    metadata: {
      created_at: now,
      created_by: "Team Abby synthetic pipeline",
      data_class: "synthetic_evaluation",
      synthetic: true,
      locale: evaluationCase.metadata.locale,
      channel: evaluationCase.metadata.channel,
      consent_scope: "synthetic_only",
      pii_status: "none",
      tags: evaluationCase.metadata.tags,
    },
    interaction: {
      message: evaluationCase.interaction.message,
      sender_id: profile.person.id,
      selected_situation_ids: selectedSituationIds,
      goal: evaluationCase.interaction.goal,
      desired_tone: evaluationCase.interaction.desired_tone,
    },
    case_data: {
      id: `case-${evaluationCase.test_case_id}`,
      title: "Synthetic evaluation case",
      incoming: {
        id: `incoming-${evaluationCase.test_case_id}`,
        senderPersonId: profile.person.id,
        text: evaluationCase.interaction.message,
        receivedAt: now,
        source: "Synthetic fixture",
      },
      currentGoal: evaluationCase.interaction.goal,
      desiredTone: evaluationCase.interaction.desired_tone,
      people: [
        {
          id: "person-you",
          displayName: "You",
          relationshipType: "Self",
          closeness: 4,
          trust: 4,
          metThrough: "",
          communicationNotes: [],
          boundaries: [],
          relationshipGoals: [],
          currentState: "Active",
        },
        structuredClone(profile.person),
        {
          ...structuredClone(decoy.person),
          id: "person-decoy",
          displayName: "Unrelated synthetic person",
        },
      ],
      relationshipConnections: [],
      claims: [...targetClaims, decoyClaim],
      situations: [...targetSituations, decoySituation],
      selectedSituationIds,
    },
  };
}

export function validateUserInputContract(input) {
  const errors = [];
  if (input?.schema_version !== "1.0.0") errors.push("schema_version");
  if (!input?.input_id) errors.push("input_id");
  if (!input?.metadata?.created_by) errors.push("metadata.created_by");
  if (Number.isNaN(Date.parse(input?.metadata?.created_at))) {
    errors.push("metadata.created_at");
  }
  if (
    !["synthetic_evaluation", "user_provided", "research_opt_in"].includes(
      input?.metadata?.data_class,
    )
  ) {
    errors.push("metadata.data_class");
  }
  if (typeof input?.metadata?.synthetic !== "boolean") {
    errors.push("metadata.synthetic");
  }
  if (
    !["synthetic_only", "local_session", "local_persistent", "research_opt_in"].includes(
      input?.metadata?.consent_scope,
    )
  ) {
    errors.push("metadata.consent_scope");
  }
  if (
    !["none", "pseudonymised", "user_controlled", "requires_review"].includes(
      input?.metadata?.pii_status,
    )
  ) {
    errors.push("metadata.pii_status");
  }
  if (!input?.metadata?.locale) errors.push("metadata.locale");
  if (!Array.isArray(input?.metadata?.tags)) errors.push("metadata.tags");
  if (!input?.interaction?.message?.trim()) errors.push("interaction.message");
  if (!input?.interaction?.sender_id) errors.push("interaction.sender_id");
  if (
    ![
      "warm_boundary",
      "clarify_intent",
      "keep_distance",
      "welcome_connection",
    ].includes(input?.interaction?.goal)
  ) {
    errors.push("interaction.goal");
  }
  if (!["warm", "neutral", "direct"].includes(input?.interaction?.desired_tone)) {
    errors.push("interaction.desired_tone");
  }
  if (!Array.isArray(input?.interaction?.selected_situation_ids)) {
    errors.push("interaction.selected_situation_ids");
  }
  const people = input?.case_data?.people || [];
  const relationshipConnections = input?.case_data?.relationshipConnections;
  const situations = input?.case_data?.situations || [];
  const claims = input?.case_data?.claims || [];
  const personIds = new Set(people.map((person) => person.id));
  const situationIds = new Set(situations.map((situation) => situation.id));
  const claimIds = new Set(claims.map((claim) => claim.id));
  if (!personIds.has("person-you")) errors.push("case_data.person_you");
  if (!personIds.has(input?.interaction?.sender_id)) {
    errors.push("case_data.sender");
  }
  if (!Array.isArray(relationshipConnections)) {
    errors.push("case_data.relationshipConnections");
  }
  for (const person of people) {
    if (
      !Number.isInteger(person.closeness) ||
      person.closeness < 0 ||
      person.closeness > 4
    ) {
      errors.push(`person.${person.id}.closeness`);
    }
    if (
      !Number.isInteger(person.trust) ||
      person.trust < 0 ||
      person.trust > 4
    ) {
      errors.push(`person.${person.id}.trust`);
    }
    if (!Array.isArray(person.boundaries)) {
      errors.push(`person.${person.id}.boundaries`);
    }
    if (!Array.isArray(person.relationshipGoals)) {
      errors.push(`person.${person.id}.relationshipGoals`);
    }
  }
  for (const situation of situations) {
    if (Number.isNaN(Date.parse(situation.occurredAt))) {
      errors.push(`situation.${situation.id}.occurredAt`);
    }
    if (!situation.personIds?.every((id) => personIds.has(id))) {
      errors.push(`situation.${situation.id}.personIds`);
    }
    if (!situation.eventClaimIds?.every((id) => claimIds.has(id))) {
      errors.push(`situation.${situation.id}.eventClaimIds`);
    }
  }
  for (const connection of relationshipConnections || []) {
    if (
      !personIds.has(connection.fromPersonId) ||
      !personIds.has(connection.toPersonId) ||
      connection.fromPersonId === connection.toPersonId
    ) {
      errors.push(`relationshipConnection.${connection.id}.personIds`);
    }
    if (
      !Number.isInteger(connection.strength) ||
      connection.strength < 0 ||
      connection.strength > 4
    ) {
      errors.push(`relationshipConnection.${connection.id}.strength`);
    }
    if (
      !Number.isInteger(connection.confidence) ||
      connection.confidence < 0 ||
      connection.confidence > 4
    ) {
      errors.push(`relationshipConnection.${connection.id}.confidence`);
    }
    if (
      ![
        "supportive",
        "close",
        "developing",
        "neutral",
        "strained",
        "distant",
        "unknown",
      ].includes(connection.dynamic)
    ) {
      errors.push(`relationshipConnection.${connection.id}.dynamic`);
    }
  }
  for (const claim of claims) {
    if (!situationIds.has(claim.situationId)) {
      errors.push(`claim.${claim.id}.situationId`);
    }
    if (!claim.personIds?.every((id) => personIds.has(id))) {
      errors.push(`claim.${claim.id}.personIds`);
    }
  }
  for (const selectedId of input?.interaction?.selected_situation_ids || []) {
    if (!situationIds.has(selectedId)) {
      errors.push(`interaction.selected_situation_ids.${selectedId}`);
    }
  }
  return errors;
}

export function validateResultContract(result) {
  const errors = [];
  for (const key of [
    "generic",
    "contextual",
    "retrievedContext",
    "epistemic",
    "meta",
  ]) {
    if (!result?.[key]) errors.push(key);
  }
  if (!result?.contextual?.draft) errors.push("contextual.draft");
  const options = result?.contextual?.responseOptions;
  if (!Array.isArray(options) || options.length < 3) {
    errors.push("contextual.responseOptions");
  } else {
    for (const option of options) {
      if (
        !option.id ||
        !option.label ||
        !option.text ||
        !option.why ||
        typeof option.recommended !== "boolean"
      ) {
        errors.push(`contextual.responseOptions.${option.id || "unknown"}`);
      }
    }
  }
  if (!Array.isArray(result?.contextual?.basis)) {
    errors.push("contextual.basis");
  }
  for (const key of [
    "facts",
    "interpretations",
    "alternatives",
    "uncertainties",
  ]) {
    if (!Array.isArray(result?.epistemic?.[key])) {
      errors.push(`epistemic.${key}`);
    }
  }
  if (typeof result?.meta?.paidApiUsed !== "boolean") {
    errors.push("meta.paidApiUsed");
  }
  if (!result?.meta?.intentCategory) errors.push("meta.intentCategory");
  if (typeof result?.meta?.explicitIntentDetected !== "boolean") {
    errors.push("meta.explicitIntentDetected");
  }
  if (
    result?.epistemic?.interpretations?.some(
      (claim) =>
        claim.type !== "ai_inference" ||
        claim.userConfirmation !== "unreviewed",
    )
  ) {
    errors.push("epistemic.interpretation_contract");
  }
  return errors;
}

function validateDataset(profilesDataset, casesDataset) {
  const errors = [];
  if (profilesDataset.schema_version !== "1.0.0") {
    errors.push("profile schema version");
  }
  if (casesDataset.schema_version !== "1.0.0") {
    errors.push("case schema version");
  }
  const profileIds = new Set(
    profilesDataset.profiles.map((profile) => profile.profile_id),
  );
  const caseIds = new Set();
  for (const evaluationCase of casesDataset.cases) {
    if (caseIds.has(evaluationCase.test_case_id)) {
      errors.push(`duplicate case ${evaluationCase.test_case_id}`);
    }
    caseIds.add(evaluationCase.test_case_id);
    if (!profileIds.has(evaluationCase.profile_id)) {
      errors.push(
        `${evaluationCase.test_case_id} references ${evaluationCase.profile_id}`,
      );
    }
    if (!evaluationCase.metadata?.tags?.length) {
      errors.push(`${evaluationCase.test_case_id} has no tags`);
    }
    if (!evaluationCase.interaction?.message?.trim()) {
      errors.push(`${evaluationCase.test_case_id} has no message`);
    }
    if (!evaluationCase.expected?.intent_category) {
      errors.push(`${evaluationCase.test_case_id} has no expected intent`);
    }
    if (evaluationCase.expected?.minimum_response_options < 3) {
      errors.push(`${evaluationCase.test_case_id} has insufficient option coverage`);
    }
  }
  return errors;
}

function materializeClaim(situation, personId) {
  return {
    id: `claim-${situation.id}`,
    situationId: situation.id,
    personIds: ["person-you", personId],
    type: "confirmed_fact",
    text: situation.claim,
    source: {
      kind: "synthetic_fixture",
      reference: situation.title,
    },
    confidence: "high",
    status: "current",
    userConfirmation: "confirmed",
    createdAt: situation.occurredAt,
  };
}

function materializeSituation(situation, personId) {
  return {
    id: situation.id,
    title: situation.title,
    occurredAt: situation.occurredAt,
    location: situation.location,
    personIds: ["person-you", personId],
    sourceRefs: ["Team Abby synthetic dataset"],
    eventClaimIds: [`claim-${situation.id}`],
    actionTaken: "",
    unresolvedQuestions: [],
    relatedSituationIds: [],
  };
}

function buildReport({ profilesDataset, casesDataset, rows }) {
  const latencies = rows.map((row) => row.latency_ms).sort((a, b) => a - b);
  const passing = rows.filter((row) => row.status === "pass").length;
  const aggregateCheck = (name) =>
    percent(rows.filter((row) => row.checks[name]).length, rows.length);
  const intentCoverage = {};
  for (const row of rows) {
    const entry = (intentCoverage[row.expected_intent] ||= {
      cases: 0,
      passed: 0,
    });
    entry.cases += 1;
    if (row.status === "pass") entry.passed += 1;
  }
  for (const entry of Object.values(intentCoverage)) {
    entry.pass_rate = percent(entry.passed, entry.cases);
  }

  return {
    report_id: "team-abby-context-evaluation-report-v1",
    schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    generated_by: "Team Abby",
    execution: {
      mode: "local_deterministic",
      paid_api_used: false,
      source_dataset: casesDataset.dataset_id,
      profile_dataset: profilesDataset.dataset_id,
    },
    summary: {
      total_cases: rows.length,
      passed_cases: passing,
      failed_cases: rows.length - passing,
      overall_pass_rate: percent(passing, rows.length),
      intent_accuracy: aggregateCheck("intent_match"),
      input_contract_validity: aggregateCheck("input_schema"),
      result_contract_validity: aggregateCheck("result_schema"),
      epistemic_integrity: aggregateCheck("epistemic_separation"),
      relationship_isolation: aggregateCheck("relationship_isolation"),
      response_diversity: aggregateCheck("response_diversity"),
      zero_cost_compliance: aggregateCheck("zero_cost"),
      median_latency_ms: percentile(latencies, 0.5),
      p95_latency_ms: percentile(latencies, 0.95),
    },
    intent_coverage: intentCoverage,
    rows,
  };
}

function toCsv(rows) {
  const headers = [
    "test_case_id",
    "profile_id",
    "message",
    "risk_level",
    "expected_intent",
    "actual_intent",
    "response_options",
    "recommended_option",
    "contextual_basis_items",
    "latency_ms",
    "status",
    "failed_checks",
  ];
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) =>
          csvCell(
            header === "failed_checks"
              ? row.failed_checks.join(";")
              : row[header],
          ),
        )
        .join(","),
    ),
  ].join("\n").concat("\n");
}

function toMarkdown(report) {
  const summary = report.summary;
  const coverageRows = Object.entries(report.intent_coverage)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([intent, value]) =>
        `| ${intent} | ${value.cases} | ${value.passed} | ${value.pass_rate}% |`,
    )
    .join("\n");
  const caseRows = report.rows
    .map(
      (row) =>
        `| ${row.test_case_id} | ${row.expected_intent} | ${row.actual_intent} | ${row.response_options} | ${row.status.toUpperCase()} | ${row.failed_checks.join(", ") || "—"} |`,
    )
    .join("\n");

  return `# Team Abby — Second Mind evaluation report

Generated: ${report.generated_at}

## Summary

| Metric | Result |
| --- | ---: |
| Cases | ${summary.total_cases} |
| Overall pass rate | ${summary.overall_pass_rate}% |
| Intent accuracy | ${summary.intent_accuracy}% |
| Input contract validity | ${summary.input_contract_validity}% |
| Result contract validity | ${summary.result_contract_validity}% |
| Epistemic integrity | ${summary.epistemic_integrity}% |
| Relationship isolation | ${summary.relationship_isolation}% |
| Response diversity | ${summary.response_diversity}% |
| Zero-cost compliance | ${summary.zero_cost_compliance}% |
| Median latency | ${summary.median_latency_ms} ms |
| P95 latency | ${summary.p95_latency_ms} ms |

## Intent coverage

| Intent | Cases | Passed | Pass rate |
| --- | ---: | ---: | ---: |
${coverageRows}

## Case results

| Case | Expected | Actual | Options | Status | Failed checks |
| --- | --- | --- | ---: | --- | --- |
${caseRows}
`;
}

function toJsonLines(values) {
  return values.map((value) => JSON.stringify(value)).join("\n").concat("\n");
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function percent(numerator, denominator) {
  return denominator ? round((numerator / denominator) * 100, 1) : 0;
}

function percentile(sortedValues, fraction) {
  if (!sortedValues.length) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * fraction) - 1),
  );
  return round(sortedValues[index], 3);
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const isMain =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const { report } = runEvaluation();
  const { summary } = report;
  console.log(
    `Team Abby evaluation: ${summary.passed_cases}/${summary.total_cases} passed (${summary.overall_pass_rate}%)`,
  );
  console.log(
    `Intent accuracy ${summary.intent_accuracy}% · schema ${summary.result_contract_validity}% · isolation ${summary.relationship_isolation}%`,
  );
  console.log("Reports written to ./reports and ./public/evaluation-data.json");
  if (summary.failed_cases) process.exitCode = 1;
}
