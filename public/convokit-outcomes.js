const elements = {
  runState: document.querySelector("#runState"),
  statGrid: document.querySelector("#statGrid"),
  metricSwitch: document.querySelector("#metricSwitch"),
  metricDefinition: document.querySelector("#metricDefinition"),
  contextChart: document.querySelector("#contextChart"),
  splitVisual: document.querySelector("#splitVisual"),
  integrityTitle: document.querySelector("#integrityTitle"),
  integrityList: document.querySelector("#integrityList"),
  modelRows: document.querySelector("#modelRows"),
  confusionView: document.querySelector("#confusionView"),
  confusionGrid: document.querySelector("#confusionGrid"),
  confusionReading: document.querySelector("#confusionReading"),
  errorSwitch: document.querySelector("#errorSwitch"),
  errorCards: document.querySelector("#errorCards"),
  limitations: document.querySelector("#limitations"),
  generatedAt: document.querySelector("#generatedAt"),
};

const metricDefinitions = {
  accuracy:
    "The share of held-out conversations classified correctly at a 50% threshold. Because this research set is exactly balanced, chance accuracy is 50%.",
  roc_auc:
    "How often the model ranks an awry conversation above a non-awry one across all thresholds. 50% is random ranking; 100% is perfect.",
  pairwise_accuracy:
    "Within each carefully matched pair, how often the model assigns the higher derailment risk to the conversation that actually goes awry.",
};

const viewOrder = ["first_turn", "opening_exchange", "pre_outcome"];
let report = null;
let activeMetric = "roc_auc";
let activeErrors = "highest_confidence_false_positives";

initialize();

async function initialize() {
  try {
    const response = await fetch("/convokit-outcome-data.json", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Run the ConvoKit evaluation to generate this report.");
    }
    report = await response.json();
    bindEvents();
    render();
  } catch (error) {
    elements.runState.textContent =
      error.message || "The outcome report could not be loaded.";
    elements.runState.classList.add("error");
  }
}

function bindEvents() {
  elements.metricSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-metric]");
    if (!button) return;
    activeMetric = button.dataset.metric;
    elements.metricSwitch
      .querySelectorAll("button")
      .forEach((item) => item.classList.toggle("active", item === button));
    renderContextChart();
  });
  elements.errorSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-errors]");
    if (!button) return;
    activeErrors = button.dataset.errors;
    elements.errorSwitch
      .querySelectorAll("button")
      .forEach((item) => item.classList.toggle("active", item === button));
    renderErrors();
  });
  elements.confusionView.addEventListener("change", renderConfusion);
}

function render() {
  const profile = report.corpus_profile;
  elements.runState.textContent = `${formatNumber(
    report.execution.test_cases,
  )} held-out cases · local zero-cost run`;
  elements.statGrid.innerHTML = [
    [
      "Conversations",
      formatNumber(profile.conversations),
      "2,094 awry · 2,094 not awry",
    ],
    [
      "Substantive turns",
      formatNumber(profile.turns),
      `${formatNumber(
        profile.source_utterances_including_section_headers,
      )} source utterances · section headers excluded`,
    ],
    [
      "Held-out test",
      formatNumber(report.execution.test_cases),
      "Never used to fit or select a model",
    ],
    ["Paid API calls", "0", "TF-IDF + logistic regression, run locally"],
  ]
    .map(
      ([label, value, note]) => `<article>
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </article>`,
    )
    .join("");

  renderContextChart();
  renderSplits();
  renderIntegrity();
  renderModelTable();
  renderConfusionOptions();
  renderConfusion();
  renderErrors();
  elements.limitations.innerHTML = report.limitations
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  elements.generatedAt.textContent = `Generated ${new Intl.DateTimeFormat(
    undefined,
    { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(report.generated_at))} · ${escapeHtml(report.generated_by)}`;
}

function renderContextChart() {
  if (!report) return;
  elements.metricDefinition.textContent = metricDefinitions[activeMetric];
  elements.contextChart.innerHTML = viewOrder
    .map((view, index) => {
      const result = report.selected_by_view[view];
      const score = result[activeMetric];
      const interval =
        activeMetric === "accuracy"
          ? result.accuracy_95_ci
          : activeMetric === "roc_auc"
            ? result.roc_auc_95_ci
            : null;
      const note = interval
        ? `95% interval ${asPercent(interval[0])}–${asPercent(interval[1])}`
        : `${formatNumber(result.pair_count)} matched test pairs`;
      const width = Math.max(0, Math.min(100, score * 100));
      return `<article class="stage-card">
        <span class="step">0${index + 1} · ${escapeHtml(
          formatModel(result.model),
        )} model</span>
        <h3>${escapeHtml(result.view_label)}</h3>
        <div class="stage-score">
          <strong>${asPercent(score)}</strong>
          <span>${escapeHtml(metricLabel(activeMetric))}</span>
        </div>
        <div class="score-track" aria-label="${asPercent(score)}">
          <i style="width:${width}%"></i>
        </div>
        <footer>${escapeHtml(note)}<br />Selected at validation AUC ${asDecimal(
          result.selection_validation_auc,
        )}</footer>
      </article>`;
    })
    .join("");
}

function renderSplits() {
  const splits = report.corpus_profile.splits;
  const total = report.corpus_profile.conversations;
  elements.splitVisual.innerHTML = ["train", "val", "test"]
    .map(
      (split) => `<div style="width:${(splits[split] / total) * 100}%">
        <strong>${escapeHtml(split === "val" ? "Validation" : titleCase(split))}</strong>
        ${formatNumber(splits[split])}
      </div>`,
    )
    .join("");
}

function renderIntegrity() {
  const profile = report.corpus_profile;
  const reconciliation = report.schema_reconciliation;
  const passed =
    profile.pair_split_mismatches === 0 &&
    profile.pages_in_multiple_splits === 0 &&
    profile.canonical_validation_errors === 0;
  elements.integrityTitle.textContent = passed
    ? "All leakage and schema gates passed."
    : "One or more checks need review.";
  const rows = [
    ["Canonical records validated", reconciliation.canonical_records],
    ["Schema validation errors", profile.canonical_validation_errors],
    ["Matched-pair split conflicts", profile.pair_split_mismatches],
    ["Pages appearing across splits", profile.pages_in_multiple_splits],
    [
      "Early-attack edge cases handled",
      profile.awry_conversations_with_attack_before_final_turn,
    ],
  ];
  elements.integrityList.innerHTML = rows
    .map(
      ([label, value]) => `<div>
        <span>${escapeHtml(label)}</span>
        <b>${escapeHtml(formatNumber(value))}</b>
      </div>`,
    )
    .join("");
}

function renderModelTable() {
  elements.modelRows.innerHTML = report.metrics
    .map((row) => {
      const selected = report.selected_by_view[row.view].model === row.model;
      return `<tr class="${selected ? "selected" : ""}">
        <td>${escapeHtml(shortView(row.view))}</td>
        <td>${escapeHtml(formatModel(row.model))}${
          selected ? '<span class="selected-pill">selected</span>' : ""
        }</td>
        <td>${asDecimal(row.selection_validation_auc)}</td>
        <td>${asPercent(row.accuracy)}</td>
        <td>${asDecimal(row.roc_auc)}</td>
        <td>${asPercent(row.pairwise_accuracy)}</td>
        <td>${asPercent(row.f1)}</td>
      </tr>`;
    })
    .join("");
}

function renderConfusionOptions() {
  elements.confusionView.innerHTML = viewOrder
    .map(
      (view) =>
        `<option value="${view}">${escapeHtml(shortView(view))}</option>`,
    )
    .join("");
  elements.confusionView.value = "opening_exchange";
}

function renderConfusion() {
  if (!report) return;
  const result = report.selected_by_view[elements.confusionView.value];
  const cells = [
    ["True negative", result.true_negative, "Not awry, forecast not awry", true],
    ["False alarm", result.false_positive, "Not awry, forecast awry", false],
    ["Missed derailment", result.false_negative, "Awry, forecast not awry", false],
    ["True positive", result.true_positive, "Awry, forecast awry", true],
  ];
  elements.confusionGrid.innerHTML = cells
    .map(
      ([label, value, note, correct]) => `<div class="${
        correct ? "correct" : "wrong"
      }">
        <span>${escapeHtml(label)}</span>
        <strong>${formatNumber(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </div>`,
    )
    .join("");
  const errors = result.false_positive + result.false_negative;
  elements.confusionReading.textContent = `${formatNumber(
    errors,
  )} of ${formatNumber(result.test_cases)} held-out conversations were wrong at the 50% threshold. This is a useful population-level signal, not dependable case-level judgment.`;
}

function renderErrors() {
  if (!report) return;
  const errors = report.opening_exchange_error_analysis[activeErrors].slice(0, 4);
  elements.errorCards.innerHTML = errors
    .map(
      (item) => `<article class="error-card">
        <div>
          <span>${escapeHtml(item.record_id)}</span>
          <span class="probability">${asPercent(
            item.predicted_probability_awry,
          )} forecast awry</span>
        </div>
        ${item.opening_exchange
          .map(
            (turn) => `<div class="utterance">
              <span>${escapeHtml(turn.speaker)}</span>
              <p>${escapeHtml(turn.text)}</p>
            </div>`,
          )
          .join("")}
      </article>`,
    )
    .join("");
}

function shortView(view) {
  return {
    first_turn: "First turn",
    opening_exchange: "Opening exchange",
    pre_outcome: "Before outcome",
  }[view];
}

function metricLabel(metric) {
  return {
    accuracy: "accuracy",
    roc_auc: "ROC-AUC",
    pairwise_accuracy: "pairwise",
  }[metric];
}

function formatModel(model) {
  return {
    structural: "Structural",
    lexical: "Lexical",
    combined: "Combined",
  }[model];
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asPercent(value) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function asDecimal(value) {
  return Number(value).toFixed(3);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
