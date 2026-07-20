const elements = {
  runStatus: document.querySelector("#runStatus"),
  generatedAt: document.querySelector("#generatedAt"),
  metrics: document.querySelector("#metricGrid"),
  coverage: document.querySelector("#coverageGrid"),
  coverageNote: document.querySelector("#coverageNote"),
  search: document.querySelector("#caseSearch"),
  intent: document.querySelector("#intentFilter"),
  status: document.querySelector("#statusFilter"),
  body: document.querySelector("#resultsBody"),
  visibleCount: document.querySelector("#visibleCount"),
};

let report = null;

initialize();

async function initialize() {
  try {
    const response = await fetch("/evaluation-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Evaluation data has not been generated.");
    report = await response.json();
    renderReport();
    elements.search.addEventListener("input", renderRows);
    elements.intent.addEventListener("change", renderRows);
    elements.status.addEventListener("change", renderRows);
  } catch (error) {
    elements.runStatus.textContent =
      error.message || "The evaluation report could not be loaded.";
    elements.runStatus.dataset.status = "fail";
  }
}

function renderReport() {
  const { summary } = report;
  const passed = summary.failed_cases === 0;
  elements.runStatus.textContent = passed
    ? `${summary.passed_cases}/${summary.total_cases} cases passed`
    : `${summary.failed_cases} of ${summary.total_cases} cases need review`;
  elements.runStatus.dataset.status = passed ? "pass" : "fail";
  elements.generatedAt.textContent =
    `Generated ${new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(report.generated_at))}`;

  const metrics = [
    ["Overall pass rate", summary.overall_pass_rate, "%"],
    ["Intent accuracy", summary.intent_accuracy, "%"],
    ["Input contract", summary.input_contract_validity, "%"],
    ["Result contract", summary.result_contract_validity, "%"],
    ["Epistemic integrity", summary.epistemic_integrity, "%"],
    ["Relationship isolation", summary.relationship_isolation, "%"],
    ["Response diversity", summary.response_diversity, "%"],
    ["P95 local latency", summary.p95_latency_ms, " ms"],
  ];
  elements.metrics.innerHTML = metrics
    .map(
      ([label, value, suffix]) => `<article>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}${escapeHtml(suffix)}</strong>
      </article>`,
    )
    .join("");

  const intents = Object.entries(report.intent_coverage).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  elements.coverageNote.textContent =
    `${intents.length} supported intent families in this dataset`;
  elements.coverage.innerHTML = intents
    .map(
      ([intent, value]) => `<div class="coverage-item">
        <div>
          <strong>${escapeHtml(formatIntent(intent))}</strong>
          <span>${value.passed}/${value.cases} passed</span>
        </div>
        <div class="coverage-bar" aria-label="${value.pass_rate}% pass rate">
          <span style="width:${Math.min(100, value.pass_rate)}%"></span>
        </div>
      </div>`,
    )
    .join("");
  elements.intent.innerHTML += intents
    .map(
      ([intent]) =>
        `<option value="${escapeHtml(intent)}">${escapeHtml(formatIntent(intent))}</option>`,
    )
    .join("");
  renderRows();
}

function renderRows() {
  const query = elements.search.value.trim().toLowerCase();
  const intent = elements.intent.value;
  const status = elements.status.value;
  const rows = report.rows.filter((row) => {
    const searchable = [
      row.test_case_id,
      row.profile_id,
      row.message,
      row.expected_intent,
      ...row.tags,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (!intent || row.expected_intent === intent) &&
      (!status || row.status === status)
    );
  });
  elements.visibleCount.textContent =
    `${rows.length} of ${report.rows.length} cases shown`;
  elements.body.innerHTML = rows.length
    ? rows.map(renderRow).join("")
    : `<tr><td colspan="6" class="empty-row">No cases match these filters.</td></tr>`;
}

function renderRow(row) {
  const passedChecks = Object.values(row.checks).filter(Boolean).length;
  const totalChecks = Object.keys(row.checks).length;
  return `<tr>
    <td>
      <span class="status-pill ${escapeHtml(row.status)}">${escapeHtml(row.status)}</span>
      <small>${escapeHtml(row.latency_ms)} ms</small>
    </td>
    <td class="message-cell">
      <strong>${escapeHtml(row.test_case_id)}</strong>
      <p>“${escapeHtml(row.message)}”</p>
      <small>${escapeHtml(row.channel)} · ${escapeHtml(row.locale)} · ${escapeHtml(row.risk_level)} risk</small>
    </td>
    <td>
      <strong>${escapeHtml(formatIntent(row.profile_id))}</strong>
      <small>${escapeHtml(row.tags.join(" · "))}</small>
    </td>
    <td>
      <span>${escapeHtml(formatIntent(row.expected_intent))}</span>
      <small>Actual: ${escapeHtml(formatIntent(row.actual_intent))}</small>
    </td>
    <td>
      <strong>${escapeHtml(row.recommended_option)}</strong>
      <small>${row.response_options} options · ${row.contextual_basis_items} basis items</small>
      <p class="response-preview">${escapeHtml(row.result_preview.recommended_response)}</p>
    </td>
    <td>
      <strong>${passedChecks}/${totalChecks}</strong>
      <small>${row.failed_checks.length ? escapeHtml(row.failed_checks.join(", ")) : "All checks passed"}</small>
    </td>
  </tr>`;
}

function formatIntent(value) {
  return String(value)
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
