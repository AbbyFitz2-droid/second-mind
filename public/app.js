import { captureSummary, parseCaptureText } from "./capture.js";

const PERSONAL_STORAGE_KEY = "second-mind.personal-workspace.v1";
const EVIDENCE_DATABASE_NAME = "second-mind-local-evidence";
const EVIDENCE_STORE_NAME = "screenshots";
const MAX_CAPTURE_BYTES = 8 * 1024 * 1024;
const DEMO_CAPTURE_TEXT = `Fran
08:42
Fran: I’ve arranged the technician for tomorrow at 10. Please confirm.
08:46
You: Thanks. The tap is still loose too. Is that included?
08:51
Fran: I’ll ask them to look at it while they’re there.`;

const COMMITMENT_STATUSES = [
  ["mentioned", "Mentioned"],
  ["promised", "Promised"],
  ["scheduled", "Scheduled"],
  ["confirmed", "Confirmed"],
  ["delayed", "Delayed"],
  ["cancelled", "Cancelled"],
  ["missed", "Missed"],
  ["completed", "Completed"],
  ["disputed", "Disputed"],
];

const CLOSED_COMMITMENT_STATUSES = new Set(["completed", "cancelled"]);

const elements = {
  welcome: document.querySelector("#welcomePanel"),
  product: document.querySelector("#productContent"),
  startCapture: document.querySelector("#startCaptureButton"),
  startPersonal: document.querySelector("#startPersonalButton"),
  exploreDemo: document.querySelector("#exploreDemoButton"),
  explorePatternDemo: document.querySelector("#explorePatternDemoButton"),
  exploreCommitmentDemo: document.querySelector(
    "#exploreCommitmentDemoButton",
  ),
  sessionLabel: document.querySelector("#sessionLabel"),
  workspaceLabel: document.querySelector("#workspaceLabel"),
  caseTitle: document.querySelector("#caseTitle"),
  footerWorkspace: document.querySelector("#footerWorkspace"),
  incoming: document.querySelector("#incomingMessage"),
  sender: document.querySelector("#senderSelect"),
  tone: document.querySelector("#toneSelect"),
  goals: [...document.querySelectorAll('input[name="goal"]')],
  analyse: document.querySelector("#analyseButton"),
  reset: document.querySelector("#resetCaseButton"),
  error: document.querySelector("#errorMessage"),
  tabs: [...document.querySelectorAll(".context-tab")],
  panels: [...document.querySelectorAll(".context-panel")],
  timeline: document.querySelector("#situationTimeline"),
  selectionCount: document.querySelector("#selectionCount"),
  eventForm: document.querySelector("#eventForm"),
  eventDetails: document.querySelector("#eventDetails"),
  eventSummary: document.querySelector("#eventSummary"),
  eventTitle: document.querySelector("#eventTitle"),
  eventText: document.querySelector("#eventText"),
  eventDate: document.querySelector("#eventDate"),
  eventPeopleOptions: document.querySelector("#eventPeopleOptions"),
  eventSubmit: document.querySelector("#eventSubmitButton"),
  eventCancel: document.querySelector("#eventCancelButton"),
  captureInbox: document.querySelector("#captureInbox"),
  captureFile: document.querySelector("#captureFile"),
  chooseCapture: document.querySelector("#chooseCaptureButton"),
  tryCaptureDemo: document.querySelector("#tryCaptureDemoButton"),
  captureDropzone: document.querySelector("#captureDropzone"),
  captureProgress: document.querySelector("#captureProgress"),
  captureProgressLabel: document.querySelector("#captureProgressLabel"),
  captureProgressValue: document.querySelector("#captureProgressValue"),
  captureProgressBar: document.querySelector("#captureProgressBar"),
  captureReviewForm: document.querySelector("#captureReviewForm"),
  capturePreview: document.querySelector("#capturePreview"),
  captureFileLabel: document.querySelector("#captureFileLabel"),
  captureSummary: document.querySelector("#captureSummary"),
  captureConfidence: document.querySelector("#captureConfidence"),
  capturePersonName: document.querySelector("#capturePersonName"),
  captureRelationship: document.querySelector("#captureRelationship"),
  captureEventDate: document.querySelector("#captureEventDate"),
  captureDateNote: document.querySelector("#captureDateNote"),
  captureExtractedText: document.querySelector("#captureExtractedText"),
  refreshCapture: document.querySelector("#refreshCaptureButton"),
  captureFindingCount: document.querySelector("#captureFindingCount"),
  captureFindingList: document.querySelector("#captureFindingList"),
  captureQuestionList: document.querySelector("#captureQuestionList"),
  captureKeepSource: document.querySelector("#captureKeepSource"),
  cancelCapture: document.querySelector("#cancelCaptureButton"),
  captureSourceDialog: document.querySelector("#captureSourceDialog"),
  captureSourceDialogClose: document.querySelector("#captureSourceDialogClose"),
  captureSourceTitle: document.querySelector("#captureSourceTitle"),
  captureSourceImage: document.querySelector("#captureSourceImage"),
  captureSourceMissing: document.querySelector("#captureSourceMissing"),
  captureSourceText: document.querySelector("#captureSourceText"),
  commitmentCount: document.querySelector("#commitmentCount"),
  commitmentPipeline: document.querySelector("#commitmentPipeline"),
  commitmentList: document.querySelector("#commitmentList"),
  addCommitment: document.querySelector("#addCommitmentButton"),
  commitmentDetails: document.querySelector("#commitmentDetails"),
  commitmentSummary: document.querySelector("#commitmentSummary"),
  commitmentForm: document.querySelector("#commitmentForm"),
  commitmentPerson: document.querySelector("#commitmentPerson"),
  commitmentStatus: document.querySelector("#commitmentStatus"),
  commitmentIssueTitle: document.querySelector("#commitmentIssueTitle"),
  commitmentDescription: document.querySelector("#commitmentDescription"),
  commitmentPromisedAt: document.querySelector("#commitmentPromisedAt"),
  commitmentDueAt: document.querySelector("#commitmentDueAt"),
  commitmentSource: document.querySelector("#commitmentSource"),
  cancelCommitment: document.querySelector("#cancelCommitmentButton"),
  deleteCommitment: document.querySelector("#deleteCommitmentButton"),
  outstandingReportText: document.querySelector("#outstandingReportText"),
  copyOutstandingReport: document.querySelector(
    "#copyOutstandingReportButton",
  ),
  addPerson: document.querySelector("#addPersonButton"),
  peopleSearch: document.querySelector("#peopleSearch"),
  personList: document.querySelector("#personList"),
  relationshipMap: document.querySelector("#relationshipMap"),
  mapConnections: document.querySelector("#mapConnections"),
  graphSummary: document.querySelector("#graphSummary"),
  relationshipState: document.querySelector("#relationshipState"),
  mapCloseness: document.querySelector("#mapCloseness"),
  mapTrust: document.querySelector("#mapTrust"),
  profileForm: document.querySelector("#profileForm"),
  profilePersonName: document.querySelector("#profilePersonName"),
  personName: document.querySelector("#personNameInput"),
  usePerson: document.querySelector("#usePersonButton"),
  relationshipType: document.querySelector("#relationshipType"),
  currentState: document.querySelector("#currentStateInput"),
  closeness: document.querySelector("#closenessInput"),
  closenessValue: document.querySelector("#closenessValue"),
  trust: document.querySelector("#trustInput"),
  trustValue: document.querySelector("#trustValue"),
  boundary: document.querySelector("#boundaryInput"),
  relationshipGoal: document.querySelector("#relationshipGoalInput"),
  metThrough: document.querySelector("#metThroughInput"),
  addConnection: document.querySelector("#addConnectionButton"),
  connectionList: document.querySelector("#connectionList"),
  connectionForm: document.querySelector("#connectionForm"),
  connectionFormKicker: document.querySelector("#connectionFormKicker"),
  connectionFormTitle: document.querySelector("#connectionFormTitle"),
  connectionFrom: document.querySelector("#connectionFromPerson"),
  connectionTo: document.querySelector("#connectionToPerson"),
  connectionRelationshipType: document.querySelector("#connectionRelationshipType"),
  connectionDynamic: document.querySelector("#connectionDynamic"),
  connectionStrength: document.querySelector("#connectionStrength"),
  connectionStrengthValue: document.querySelector("#connectionStrengthValue"),
  connectionConfidence: document.querySelector("#connectionConfidence"),
  connectionConfidenceValue: document.querySelector("#connectionConfidenceValue"),
  connectionNotes: document.querySelector("#connectionNotes"),
  cancelConnection: document.querySelector("#cancelConnectionButton"),
  deleteConnection: document.querySelector("#deleteConnectionButton"),
  scopeNote: document.querySelector("#scopeNote"),
  reviewState: document.querySelector("#reviewState"),
  merlinInsight: document.querySelector("#merlinInsight"),
  merlinEyebrow: document.querySelector("#merlinEyebrow"),
  merlinInsightTitle: document.querySelector("#merlinInsightTitle"),
  merlinInsightSummary: document.querySelector("#merlinInsightSummary"),
  merlinConfidence: document.querySelector("#merlinConfidence"),
  merlinHypotheses: document.querySelector("#merlinHypotheses"),
  merlinProbabilityChart: document.querySelector("#merlinProbabilityChart"),
  merlinEvidenceList: document.querySelector("#merlinEvidenceList"),
  merlinNextQuestion: document.querySelector("#merlinNextQuestion"),
  merlinExcludedEvidence: document.querySelector("#merlinExcludedEvidence"),
  merlinCalibration: document.querySelector("#merlinCalibration"),
  factList: document.querySelector("#factList"),
  interpretationList: document.querySelector("#interpretationList"),
  alternativeList: document.querySelector("#alternativeList"),
  uncertaintyList: document.querySelector("#uncertaintyList"),
  confirmReview: document.querySelector("#confirmReviewButton"),
  genericConfidence: document.querySelector("#genericConfidence"),
  genericInterpretation: document.querySelector("#genericInterpretation"),
  genericDraft: document.querySelector("#genericDraft"),
  contextConfidence: document.querySelector("#contextConfidence"),
  contextInterpretation: document.querySelector("#contextInterpretation"),
  responseOptions: document.querySelector("#responseOptions"),
  contextDraft: document.querySelector("#contextDraft"),
  perspectiveSimulation: document.querySelector("#perspectiveSimulation"),
  perspectiveTitle: document.querySelector("#perspectiveTitle"),
  perspectiveLiteral: document.querySelector("#perspectiveLiteral"),
  perspectiveEmotional: document.querySelector("#perspectiveEmotional"),
  perspectiveRisk: document.querySelector("#perspectiveRisk"),
  perspectiveConfidence: document.querySelector("#perspectiveConfidence"),
  perspectiveEvidence: document.querySelector("#perspectiveEvidence"),
  contextExplanation: document.querySelector("#contextExplanation"),
  contextBasisList: document.querySelector("#contextBasisList"),
  copyDraft: document.querySelector("#copyDraftButton"),
  personDialog: document.querySelector("#personDialog"),
  personDialogClose: document.querySelector("#personDialogClose"),
  personForm: document.querySelector("#personForm"),
  newPersonName: document.querySelector("#newPersonName"),
  newRelationshipType: document.querySelector("#newRelationshipType"),
  newMetThrough: document.querySelector("#newMetThrough"),
  newCloseness: document.querySelector("#newCloseness"),
  newClosenessValue: document.querySelector("#newClosenessValue"),
  newTrust: document.querySelector("#newTrust"),
  newTrustValue: document.querySelector("#newTrustValue"),
  privacy: document.querySelector("#privacyButton"),
  privacyDialog: document.querySelector("#privacyDialog"),
  dialogClose: document.querySelector("#dialogClose"),
  deleteLocalData: document.querySelector("#deleteLocalDataButton"),
  loading: document.querySelector("#loadingOverlay"),
  toast: document.querySelector("#contextToast"),
};

const state = {
  caseData: null,
  workspaceKind: null,
  selectedPersonId: null,
  result: null,
  activeView: "people",
  reviews: {},
  reviewConfirmed: false,
  requestVersion: 0,
  updateTimer: null,
  saveTimer: null,
  toastTimer: null,
  deleteArmed: false,
  editingSituationId: null,
  editingConnectionId: null,
  editingCommitmentId: null,
  pendingCapture: null,
  capturePreviewUrl: null,
  captureSourceUrl: null,
  captureRemovalArmed: null,
};

initialize();

function initialize() {
  bindEvents();
  updateWelcomeAction();
}

function bindEvents() {
  elements.startCapture.addEventListener("click", startCaptureWorkspace);
  elements.startPersonal.addEventListener("click", startPersonalWorkspace);
  elements.exploreDemo.addEventListener("click", () =>
    loadWorkspace("/api/demo-case", "demo"),
  );
  elements.explorePatternDemo.addEventListener("click", () =>
    loadWorkspace("/api/pattern-demo-case", "demo"),
  );
  elements.exploreCommitmentDemo.addEventListener("click", () =>
    loadWorkspace("/api/commitment-demo-case", "demo"),
  );
  elements.tabs.forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.view));
  });
  elements.analyse.addEventListener("click", () =>
    runContext({ switchTo: "interpretation" }),
  );
  elements.reset.addEventListener("click", showWelcome);
  elements.sender.addEventListener("change", changeSender);
  elements.tone.addEventListener("change", () => {
    state.caseData.desiredTone = elements.tone.value;
    persistWorkspace();
    scheduleContextUpdate("Tone changed. The response updated in place.");
  });
  elements.goals.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.caseData.currentGoal = input.value;
      persistWorkspace();
      scheduleContextUpdate("Goal changed. The response updated in place.");
    });
  });
  elements.incoming.addEventListener("input", () => {
    state.caseData.incoming.text = elements.incoming.value;
    persistWorkspace();
  });
  elements.timeline.addEventListener("change", selectTimelineContext);
  elements.timeline.addEventListener("click", editSituationFromTimeline);
  elements.timeline.addEventListener("click", openCaptureSourceFromTimeline);
  elements.timeline.addEventListener("click", removeCaptureFromTimeline);
  elements.eventForm.addEventListener("submit", addSituation);
  elements.eventCancel.addEventListener("click", cancelSituationEdit);
  elements.chooseCapture.addEventListener("click", () =>
    elements.captureFile.click(),
  );
  elements.tryCaptureDemo.addEventListener("click", loadFictionalCapture);
  elements.captureFile.addEventListener("change", selectCaptureFile);
  elements.captureDropzone.addEventListener("dragover", handleCaptureDragOver);
  elements.captureDropzone.addEventListener("dragleave", handleCaptureDragLeave);
  elements.captureDropzone.addEventListener("drop", handleCaptureDrop);
  elements.refreshCapture.addEventListener("click", refreshCaptureFindings);
  elements.captureReviewForm.addEventListener("submit", fileCapture);
  elements.cancelCapture.addEventListener("click", resetCaptureReview);
  elements.captureFindingList.addEventListener(
    "change",
    updateCaptureFindingSelection,
  );
  elements.captureSourceDialogClose.addEventListener("click", closeCaptureSource);
  elements.captureSourceDialog.addEventListener("click", (event) => {
    if (event.target === elements.captureSourceDialog) closeCaptureSource();
  });
  elements.addCommitment.addEventListener("click", openNewCommitmentForm);
  elements.commitmentForm.addEventListener("submit", saveCommitment);
  elements.cancelCommitment.addEventListener("click", closeCommitmentForm);
  elements.deleteCommitment.addEventListener("click", deleteCommitment);
  elements.commitmentList.addEventListener(
    "click",
    editCommitmentFromControl,
  );
  elements.commitmentList.addEventListener(
    "change",
    changeCommitmentStatus,
  );
  elements.copyOutstandingReport.addEventListener(
    "click",
    copyOutstandingReport,
  );
  elements.addPerson.addEventListener("click", openPersonDialog);
  elements.personDialogClose.addEventListener("click", closePersonDialog);
  elements.personDialog.addEventListener("click", (event) => {
    if (event.target === elements.personDialog) closePersonDialog();
  });
  elements.personForm.addEventListener("submit", createPerson);
  elements.newCloseness.addEventListener("input", updateNewPersonRanges);
  elements.newTrust.addEventListener("input", updateNewPersonRanges);
  elements.peopleSearch.addEventListener("input", renderPeopleDirectory);
  elements.personList.addEventListener("click", selectPersonFromControl);
  elements.usePerson.addEventListener("click", useSelectedPerson);
  elements.personName.addEventListener("input", updateProfile);
  elements.relationshipType.addEventListener("input", updateProfile);
  elements.currentState.addEventListener("input", updateProfile);
  elements.closeness.addEventListener("input", updateProfile);
  elements.trust.addEventListener("input", updateProfile);
  elements.boundary.addEventListener("input", updateProfile);
  elements.relationshipGoal.addEventListener("input", updateProfile);
  elements.metThrough.addEventListener("input", updateProfile);
  elements.addConnection.addEventListener("click", openNewConnectionForm);
  elements.connectionList.addEventListener("click", editConnectionFromControl);
  elements.connectionForm.addEventListener("submit", saveConnection);
  elements.cancelConnection.addEventListener("click", closeConnectionForm);
  elements.deleteConnection.addEventListener("click", deleteConnection);
  elements.connectionStrength.addEventListener("input", updateConnectionRanges);
  elements.connectionConfidence.addEventListener("input", updateConnectionRanges);
  elements.interpretationList.addEventListener("change", reviewInterpretation);
  elements.merlinEvidenceList.addEventListener(
    "change",
    adjustMerlinEvidence,
  );
  elements.confirmReview.addEventListener("click", confirmReview);
  elements.responseOptions.addEventListener("click", chooseResponseOption);
  elements.copyDraft.addEventListener("click", copyDraft);
  elements.privacy.addEventListener("click", () =>
    elements.privacyDialog.showModal(),
  );
  elements.dialogClose.addEventListener("click", () =>
    elements.privacyDialog.close(),
  );
  elements.privacyDialog.addEventListener("click", (event) => {
    if (event.target === elements.privacyDialog) {
      elements.privacyDialog.close();
    }
  });
  elements.deleteLocalData.addEventListener("click", deleteLocalWorkspace);
}

function updateWelcomeAction() {
  let hasSavedMap = false;
  try {
    hasSavedMap = Boolean(localStorage.getItem(PERSONAL_STORAGE_KEY));
  } catch {
    hasSavedMap = false;
  }
  elements.startPersonal.querySelector("span").textContent = hasSavedMap
    ? "Continue my relationship map"
    : "Start my relationship map";
}

async function startPersonalWorkspace() {
  const saved = readSavedWorkspace();
  if (saved) {
    enterWorkspace(saved, "personal");
    return;
  }
  await loadWorkspace("/api/blank-case", "personal");
}

async function startCaptureWorkspace() {
  const saved = readSavedWorkspace();
  if (saved) {
    enterWorkspace(saved, "personal");
  } else {
    await loadWorkspace("/api/blank-case", "personal", {
      promptForPerson: false,
    });
  }
  showPanel("situation");
  requestAnimationFrame(() => {
    elements.captureInbox.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.chooseCapture.focus({ preventScroll: true });
  });
}

async function loadWorkspace(
  endpoint,
  kind,
  { promptForPerson = true } = {},
) {
  setLoading(true);
  try {
    const response = await fetch(endpoint);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Could not create the workspace.");
    }
    enterWorkspace(payload.case, kind);
    if (
      promptForPerson &&
      kind === "personal" &&
      relationshipPeople().length === 0
    ) {
      openPersonDialog();
    }
  } catch (error) {
    showToast(error.message || "The workspace could not be created.");
  } finally {
    setLoading(false);
  }
}

function enterWorkspace(caseData, kind) {
  state.caseData = normalizeCaseData(caseData);
  state.workspaceKind = kind;
  state.selectedPersonId =
    state.caseData.incoming.senderPersonId || relationshipPeople()[0]?.id || null;
  state.result = null;
  state.reviews = {};
  state.reviewConfirmed = false;
  state.deleteArmed = false;
  state.editingConnectionId = null;
  state.editingCommitmentId = null;
  elements.welcome.hidden = true;
  elements.product.hidden = false;
  hydrateWorkspace();
  const hasPeople = relationshipPeople().length > 0;
  showPanel(hasPeople ? "situation" : "people");
  if (hasPeople && state.caseData.incoming.text.trim()) {
    runContext();
  } else {
    renderEmptyReasoning();
  }
  persistWorkspace();
}

function showWelcome() {
  clearTimeout(state.updateTimer);
  elements.product.hidden = true;
  elements.welcome.hidden = false;
  elements.sessionLabel.textContent = "Local-first · zero cost";
  elements.error.textContent = "";
  updateWelcomeAction();
}

function hydrateWorkspace() {
  renderSenderOptions();
  elements.incoming.value = state.caseData.incoming.text || "";
  elements.tone.value = state.caseData.desiredTone || "warm";
  elements.goals.forEach((input) => {
    input.checked = input.value === state.caseData.currentGoal;
  });
  elements.workspaceLabel.textContent =
    state.workspaceKind === "demo"
      ? "Fictional demonstration"
      : "Your local relationship map";
  elements.caseTitle.textContent =
    state.workspaceKind === "demo"
      ? state.caseData.title
      : "Bring in a message or interaction";
  elements.sessionLabel.textContent =
    state.workspaceKind === "demo"
      ? "Fictional · session only · zero cost"
      : "Saved on this device · zero cost";
  elements.footerWorkspace.textContent =
    state.workspaceKind === "demo"
      ? "Prototype · Fictional data · July 2026"
      : "Prototype · Local browser storage · July 2026";
  renderWorkspace();
}

function renderWorkspace() {
  renderCommitments();
  renderTimeline();
  renderEventPeopleOptions();
  renderRelationshipMap();
  renderPeopleDirectory();
  renderConnectionList();
  renderSelectedProfile();
  updateReviewState();
  elements.analyse.disabled = relationshipPeople().length === 0;
}

function showPanel(view) {
  if (!["situation", "people", "interpretation", "action"].includes(view)) {
    return;
  }
  const scrollPosition = window.scrollY;
  state.activeView = view;
  elements.tabs.forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  elements.panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== view;
  });
  requestAnimationFrame(() => {
    const maximum = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    window.scrollTo(0, Math.min(scrollPosition, maximum));
  });
}

function normalizeCaseData(caseData) {
  const normalized = caseData && typeof caseData === "object" ? caseData : {};
  normalized.people = Array.isArray(normalized.people) ? normalized.people : [];
  normalized.claims = Array.isArray(normalized.claims) ? normalized.claims : [];
  normalized.situations = Array.isArray(normalized.situations)
    ? normalized.situations
    : [];
  normalized.issues = Array.isArray(normalized.issues)
    ? normalized.issues
    : [];
  normalized.commitments = Array.isArray(normalized.commitments)
    ? normalized.commitments
    : [];
  normalized.captures = Array.isArray(normalized.captures)
    ? normalized.captures
    : [];
  normalized.selectedSituationIds = Array.isArray(normalized.selectedSituationIds)
    ? normalized.selectedSituationIds
    : [];
  normalized.relationshipConnections = Array.isArray(
    normalized.relationshipConnections,
  )
    ? normalized.relationshipConnections
    : [];
  normalized.patternEvidenceAdjustments =
    normalized.patternEvidenceAdjustments &&
    typeof normalized.patternEvidenceAdjustments === "object"
      ? normalized.patternEvidenceAdjustments
      : {};
  normalized.people.forEach((person) => {
    person.communicationNotes = Array.isArray(person.communicationNotes)
      ? person.communicationNotes
      : [];
    person.boundaries = Array.isArray(person.boundaries)
      ? person.boundaries
      : [];
    person.relationshipGoals = Array.isArray(person.relationshipGoals)
      ? person.relationshipGoals
      : [];
  });
  normalized.commitments.forEach((commitment) => {
    commitment.statusHistory = Array.isArray(commitment.statusHistory)
      ? commitment.statusHistory
      : [];
    commitment.source =
      commitment.source && typeof commitment.source === "object"
        ? commitment.source
        : { kind: "user_entry", reference: "User entry" };
  });
  normalized.situations.forEach((situation, index) => {
    if (!Object.hasOwn(situation, "occurredAt")) situation.occurredAt = null;
    situation.datePrecision =
      situation.datePrecision || (situation.occurredAt ? "exact" : "unknown");
    situation.dateSource =
      situation.dateSource ||
      (situation.occurredAt ? "legacy_record" : "not_provided");
    situation.recordSequence =
      Number.isFinite(situation.recordSequence) ? situation.recordSequence : index;
  });
  return normalized;
}

function relationshipPeople() {
  return state.caseData?.people.filter(
    (person) => person.id !== "person-you" && person.currentState !== "Archived",
  ) || [];
}

function relationshipConnections() {
  if (!state.caseData) return [];
  const activeIds = new Set(relationshipPeople().map((person) => person.id));
  return state.caseData.relationshipConnections.filter(
    (connection) =>
      activeIds.has(connection.fromPersonId) &&
      activeIds.has(connection.toPersonId) &&
      connection.fromPersonId !== connection.toPersonId,
  );
}

function renderSenderOptions() {
  const people = relationshipPeople();
  const previous =
    state.caseData.incoming.senderPersonId || elements.sender.value || "";
  elements.sender.innerHTML = people.length
    ? people
        .map(
          (person) =>
            `<option value="${escapeHtml(person.id)}">${escapeHtml(person.displayName)}</option>`,
        )
        .join("")
    : `<option value="">Add a person first</option>`;
  const senderExists = people.some((person) => person.id === previous);
  const senderId = senderExists ? previous : people[0]?.id || "";
  elements.sender.value = senderId;
  elements.sender.disabled = people.length === 0;
  state.caseData.incoming.senderPersonId = senderId;
  if (!state.selectedPersonId && senderId) state.selectedPersonId = senderId;
}

async function runContext({ switchTo = null } = {}) {
  const message = elements.incoming.value.trim();
  const senderId = elements.sender.value;
  if (!senderId) {
    elements.error.textContent =
      "Add a person to your relationship map before building context.";
    showPanel("people");
    return;
  }
  if (message.length < 2) {
    elements.error.textContent = "Add an incoming message or short interaction.";
    elements.incoming.focus();
    return;
  }

  const requestVersion = ++state.requestVersion;
  setLoading(true);
  elements.error.textContent = "";
  try {
    const response = await fetch("/api/context-reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_data: state.caseData,
        message,
        sender_id: senderId,
        selected_situation_ids: state.caseData.selectedSituationIds,
        goal: selectedGoal(),
        desired_tone: elements.tone.value,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Context reasoning failed.");
    }
    if (requestVersion !== state.requestVersion) return;
    state.result = payload.result;
    renderResult();
    if (switchTo) showPanel(switchTo);
  } catch (error) {
    if (requestVersion !== state.requestVersion) return;
    elements.error.textContent =
      error.message || "Second Mind could not build this context.";
  } finally {
    if (requestVersion === state.requestVersion) setLoading(false);
  }
}

function scheduleContextUpdate(message) {
  clearTimeout(state.updateTimer);
  state.reviewConfirmed = false;
  updateReviewState();
  if (!state.result || !elements.sender.value || !elements.incoming.value.trim()) {
    return;
  }
  state.updateTimer = setTimeout(async () => {
    await runContext();
    showToast(message);
  }, 180);
}

function selectedGoal() {
  return elements.goals.find((input) => input.checked)?.value || "warm_boundary";
}

function selectCaptureFile(event) {
  const file = event.target.files?.[0];
  if (file) processCaptureFile(file);
  event.target.value = "";
}

function handleCaptureDragOver(event) {
  event.preventDefault();
  elements.captureDropzone.classList.add("is-dragging");
}

function handleCaptureDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  elements.captureDropzone.classList.remove("is-dragging");
}

function handleCaptureDrop(event) {
  event.preventDefault();
  elements.captureDropzone.classList.remove("is-dragging");
  const file = event.dataTransfer?.files?.[0];
  if (file) processCaptureFile(file);
}

async function loadFictionalCapture() {
  const file = await createFictionalCaptureFile();
  await processCaptureFile(file, { fallbackText: DEMO_CAPTURE_TEXT });
}

async function processCaptureFile(file, { fallbackText = "" } = {}) {
  if (!state.caseData) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showToast("Choose a PNG, JPEG, or WebP screenshot.");
    return;
  }
  if (file.size > MAX_CAPTURE_BYTES) {
    showToast("Keep the screenshot under 8 MB for this prototype.");
    return;
  }

  resetCaptureReview({ preserveProgress: true });
  elements.captureProgress.hidden = false;
  updateCaptureProgress(2, "Preparing local text recognition…");

  let recognizedText = "";
  let confidence = null;
  try {
    if (!globalThis.Tesseract?.createWorker) {
      throw new Error("The local OCR engine is unavailable.");
    }
    const worker = await globalThis.Tesseract.createWorker("eng", 1, {
      workerPath: "/vendor/tesseract/worker.min.js",
      corePath: "/vendor/tesseract/core",
      langPath: "/vendor/tesseract/lang",
      logger(message) {
        const progress = Number.isFinite(message.progress)
          ? Math.max(2, Math.round(message.progress * 100))
          : 4;
        updateCaptureProgress(progress, captureProgressLabel(message.status));
      },
    });
    const recognition = await worker.recognize(file);
    recognizedText = recognition.data?.text?.trim() || "";
    confidence = Number.isFinite(recognition.data?.confidence)
      ? Math.round(recognition.data.confidence)
      : null;
    await worker.terminate();
  } catch (error) {
    if (!fallbackText) {
      console.error("Local OCR failed:", error);
      updateCaptureProgress(
        0,
        "The screenshot could not be read automatically. Try a clearer crop.",
      );
      showToast("Local text recognition could not read that screenshot.");
      return;
    }
  }

  if (fallbackText && (recognizedText.length < 40 || Number(confidence) < 35)) {
    recognizedText = fallbackText;
    confidence = 99;
  }

  if (!recognizedText.trim()) {
    updateCaptureProgress(
      0,
      "No readable text was found. Try a clearer or more tightly cropped image.",
    );
    return;
  }

  let parsed = parseCaptureText(recognizedText);
  if (fallbackText && parsed.messages.length < 2) {
    recognizedText = fallbackText;
    confidence = 99;
    parsed = parseCaptureText(recognizedText);
  }
  state.pendingCapture = {
    file,
    parsed,
    ocrConfidence: confidence,
    startedAt: new Date().toISOString(),
  };
  setCapturePreview(file);
  renderCaptureReview();
  updateCaptureProgress(100, "Ready to review");
  setTimeout(() => {
    if (state.pendingCapture) elements.captureProgress.hidden = true;
  }, 450);
}

function captureProgressLabel(status) {
  const labels = {
    "loading tesseract core": "Loading the local OCR engine…",
    "initializing tesseract": "Preparing text recognition…",
    "loading language traineddata": "Loading English recognition data…",
    "initializing api": "Starting local extraction…",
    "recognizing text": "Reading the screenshot locally…",
  };
  return labels[String(status || "").toLowerCase()] || "Reading locally…";
}

function updateCaptureProgress(value, label) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  elements.captureProgressBar.value = safeValue;
  elements.captureProgressValue.textContent = `${safeValue}%`;
  elements.captureProgressLabel.textContent = label;
}

function setCapturePreview(file) {
  if (state.capturePreviewUrl) URL.revokeObjectURL(state.capturePreviewUrl);
  state.capturePreviewUrl = URL.createObjectURL(file);
  elements.capturePreview.src = state.capturePreviewUrl;
  elements.captureFileLabel.textContent = `${file.name} · ${formatFileSize(file.size)}`;
}

function renderCaptureReview({ preserveClarifications = false } = {}) {
  const pending = state.pendingCapture;
  if (!pending) return;
  const { parsed, ocrConfidence } = pending;
  const existingName = elements.capturePersonName.value;
  const existingRelationship = elements.captureRelationship.value;
  const existingDate = elements.captureEventDate.value;
  elements.captureReviewForm.hidden = false;
  elements.captureSummary.textContent = captureSummary(parsed);
  elements.captureConfidence.textContent = Number.isFinite(ocrConfidence)
    ? `${ocrConfidence}% text confidence`
    : "Confidence not available";
  elements.capturePersonName.value =
    preserveClarifications && existingName
      ? existingName
      : parsed.primaryPersonName || "";
  elements.captureRelationship.value = preserveClarifications
    ? existingRelationship
    : "";
  elements.captureExtractedText.value = parsed.normalizedText;
  if (preserveClarifications && existingDate) {
    elements.captureEventDate.value = existingDate;
  } else if (parsed.sourceDate) {
    elements.captureEventDate.value = toLocalDateTimeInput(parsed.sourceDate);
  } else {
    elements.captureEventDate.value = "";
  }
  elements.captureDateNote.textContent = parsed.sourceDate
    ? "Visible in the screenshot. You can correct it before filing."
    : "Not visible in the source. Leave blank unless you know it.";
  renderCaptureFindings();
  renderCaptureQuestions();
  elements.captureReviewForm.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

function renderCaptureFindings() {
  const parsed = state.pendingCapture?.parsed;
  if (!parsed) return;
  const findings = parsed.findings;
  const messageCount = parsed.messages.length;
  elements.captureFindingCount.textContent =
    `${messageCount + findings.length} record${messageCount + findings.length === 1 ? "" : "s"} found`;
  const transcript = `<article class="capture-finding capture-finding-fixed">
    <span class="capture-finding-icon" aria-hidden="true">01</span>
    <div>
      <strong>Conversation transcript</strong>
      <p>${messageCount} attributed message${messageCount === 1 ? "" : "s"} will remain linked to this screenshot.</p>
      <small>Direct evidence · included</small>
    </div>
  </article>`;
  const structured = findings
    .map(
      (finding, index) => `<label class="capture-finding">
        <input
          type="checkbox"
          data-capture-finding="${escapeHtml(finding.id)}"
          ${finding.selected !== false ? "checked" : ""}
        />
        <span class="capture-finding-icon" aria-hidden="true">${String(index + 2).padStart(2, "0")}</span>
        <span>
          <strong>${escapeHtml(finding.label)}</strong>
          <p>${escapeHtml(finding.evidence)}</p>
          <small>${escapeHtml(finding.kind)} · ${escapeHtml(finding.confidence)} confidence</small>
        </span>
      </label>`,
    )
    .join("");
  const tone = `<article class="capture-finding capture-tone">
    <span class="capture-finding-icon" aria-hidden="true">AI</span>
    <div>
      <strong>${escapeHtml(parsed.tone.label)}</strong>
      <p>${escapeHtml(parsed.tone.interpretation)}</p>
      <small>Interpretation · ${escapeHtml(parsed.tone.confidence)} confidence · never stored as fact</small>
    </div>
  </article>`;
  elements.captureFindingList.innerHTML = `${transcript}${structured}${tone}`;
}

function renderCaptureQuestions() {
  const parsed = state.pendingCapture?.parsed;
  if (!parsed) return;
  const materialQuestions = parsed.questions.filter(
    (question) => !["person-name", "relationship"].includes(question.id),
  );
  const relationshipQuestion = parsed.questions.find(
    (question) => question.id === "relationship",
  );
  elements.captureQuestionList.innerHTML = [
    relationshipQuestion
      ? `<div class="capture-question">
          <span>One useful clarification</span>
          <strong>${escapeHtml(relationshipQuestion.text)}</strong>
          <div>
            <button class="text-button" type="button" data-set-relationship="Landlord / property manager">Yes</button>
            <button class="text-button" type="button" data-set-relationship="">No or not sure</button>
          </div>
        </div>`
      : "",
    ...materialQuestions.map(
      (question) => `<div class="capture-question capture-question-information">
        <span>${question.id === "date" ? "Date handling" : "Status handling"}</span>
        <strong>${escapeHtml(question.text)}</strong>
        <p>${escapeHtml(question.consequence)}</p>
      </div>`,
    ),
  ].join("");
  elements.captureQuestionList
    .querySelectorAll("button[data-set-relationship]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        elements.captureRelationship.value = button.dataset.setRelationship;
        showToast(
          button.dataset.setRelationship
            ? "Relationship added for review."
            : "Relationship left unspecified.",
        );
      });
    });
}

function refreshCaptureFindings() {
  if (!state.pendingCapture) return;
  const text = elements.captureExtractedText.value.trim();
  if (!text) {
    showToast("Keep at least some extracted text before refreshing.");
    return;
  }
  state.pendingCapture.parsed = parseCaptureText(text);
  renderCaptureReview({ preserveClarifications: true });
  showToast("Findings refreshed from your corrected text.");
}

function updateCaptureFindingSelection(event) {
  const checkbox = event.target.closest("input[data-capture-finding]");
  if (!checkbox || !state.pendingCapture) return;
  const finding = state.pendingCapture.parsed.findings.find(
    (item) => item.id === checkbox.dataset.captureFinding,
  );
  if (finding) finding.selected = checkbox.checked;
}

async function fileCapture(event) {
  event.preventDefault();
  const pending = state.pendingCapture;
  if (!pending || !state.caseData) return;
  const personName = elements.capturePersonName.value.trim();
  if (!personName) {
    elements.capturePersonName.focus();
    return;
  }
  const relationship =
    elements.captureRelationship.value.trim() || "Relationship not yet specified";
  const now = new Date().toISOString();
  const captureId = `capture-${crypto.randomUUID()}`;
  const priorInteraction = {
    incoming: structuredClone(state.caseData.incoming),
    currentGoal: state.caseData.currentGoal,
    desiredTone: state.caseData.desiredTone,
    selectedPersonId: state.selectedPersonId,
  };
  const eventDate = elements.captureEventDate.value
    ? new Date(elements.captureEventDate.value).toISOString()
    : null;
  const dateSource = eventDate
    ? sameCalendarDate(eventDate, pending.parsed.sourceDate)
      ? "visible_in_source"
      : "user_supplied"
    : "not_visible";
  const person = ensureCapturePerson(personName, relationship, now);
  const sourceReference = `${pending.file.name} · local screenshot`;
  const claimIds = [];
  const personIds = ["person-you", person.id];

  for (const message of pending.parsed.messages) {
    const claimId = `claim-${crypto.randomUUID()}`;
    const speaker =
      message.speaker.toLowerCase() === "you"
        ? "You"
        : message.speaker === "Unknown speaker"
          ? "Unattributed speaker"
          : message.speaker;
    state.caseData.claims.push({
      id: claimId,
      situationId: null,
      personIds,
      type: "direct_observation",
      text: `${speaker}: ${message.text}`,
      source: {
        kind: "screenshot",
        reference: sourceReference,
        captureId,
      },
      confidence: message.confidence,
      status: "current",
      userConfirmation: "confirmed",
      createdAt: now,
    });
    claimIds.push(claimId);
  }

  const situationId = `situation-${crypto.randomUUID()}`;
  for (const claimId of claimIds) {
    const claim = state.caseData.claims.find((item) => item.id === claimId);
    if (claim) claim.situationId = situationId;
  }
  state.caseData.situations.push({
    id: situationId,
    title: `Screenshot conversation with ${person.displayName}`,
    occurredAt: eventDate,
    datePrecision: eventDate ? "exact" : "unknown",
    dateSource,
    capturedAt: now,
    recordSequence: state.caseData.situations.length,
    location: "Conversation screenshot",
    personIds,
    sourceRefs: [sourceReference],
    sourceCaptureId: captureId,
    eventClaimIds: claimIds,
    actionTaken: "",
    unresolvedQuestions: eventDate
      ? []
      : ["The event date was not visible and remains unknown."],
    relatedSituationIds: [],
  });
  state.caseData.selectedSituationIds.push(situationId);

  const selectedFindings = pending.parsed.findings.filter(
    (finding) => finding.selected !== false,
  );
  addCaptureIssuesAndCommitments({
    findings: selectedFindings,
    captureId,
    situationId,
    person,
    sourceReference,
    eventDate,
    recordedAt: now,
  });

  state.caseData.captures.push({
    id: captureId,
    kind: "screenshot",
    fileName: pending.file.name,
    mimeType: pending.file.type,
    byteSize: pending.file.size,
    capturedAt: now,
    extractedText: pending.parsed.normalizedText,
    ocrConfidence: pending.ocrConfidence,
    sourceDate: eventDate,
    datePrecision: eventDate ? "exact" : "unknown",
    dateSource,
    imageStoredLocally: elements.captureKeepSource.checked,
    imageSentToAiService: false,
    participantPersonIds: personIds,
    situationIds: [situationId],
    findingSnapshot: selectedFindings.map((finding) => ({
      kind: finding.kind,
      label: finding.label,
      status: finding.status || null,
      confidence: finding.confidence,
      evidence: finding.evidence,
    })),
    priorInteraction,
    userConfirmation: "reviewed",
  });

  if (elements.captureKeepSource.checked) {
    try {
      await putEvidence(captureId, pending.file);
    } catch (error) {
      console.error("Local evidence storage failed:", error);
      state.caseData.captures.at(-1).imageStoredLocally = false;
      showToast("The record was filed, but the source image could not be retained.");
    }
  }

  const latestIncoming = [...pending.parsed.messages]
    .reverse()
    .find((message) => message.speaker.toLowerCase() !== "you");
  if (latestIncoming) {
    state.caseData.incoming = {
      id: `incoming-${crypto.randomUUID()}`,
      senderPersonId: person.id,
      text: latestIncoming.text,
      receivedAt: eventDate,
      capturedAt: now,
      source: sourceReference,
      sourceCaptureId: captureId,
    };
  }
  state.selectedPersonId = person.id;
  state.caseData.currentGoal = selectedFindings.some(
    (finding) => finding.kind === "commitment",
  )
    ? "coordinate_practical"
    : state.caseData.currentGoal;

  resetCaptureReview();
  hydrateWorkspace();
  showPanel("situation");
  persistWorkspace();
  if (state.caseData.incoming.text) await runContext();
  showToast(
    `Filed ${claimIds.length} messages and ${selectedFindings.length} structured updates for ${person.displayName}.`,
  );
}

function ensureCapturePerson(name, relationship, recordedAt) {
  const existing = relationshipPeople().find(
    (person) => person.displayName.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    if (
      relationship !== "Relationship not yet specified" &&
      existing.relationshipType === "Relationship not yet specified"
    ) {
      existing.relationshipType = relationship;
      existing.updatedAt = recordedAt;
    }
    return existing;
  }
  const person = {
    id: `person-${crypto.randomUUID()}`,
    displayName: name,
    relationshipType: relationship,
    closeness: 1,
    trust: 1,
    metThrough: "Added from a reviewed conversation screenshot",
    communicationNotes: [],
    boundaries: [],
    relationshipGoals: [],
    currentState: "Developing record",
    source: "reviewed_screenshot",
    updatedAt: recordedAt,
  };
  state.caseData.people.push(person);
  return person;
}

function addCaptureIssuesAndCommitments({
  findings,
  captureId,
  situationId,
  person,
  sourceReference,
  eventDate,
  recordedAt,
}) {
  const issueFindings = findings.filter((finding) => finding.kind === "issue");
  const commitmentFindings = findings.filter(
    (finding) =>
      finding.kind === "commitment" &&
      finding.speaker.toLowerCase() !== "you",
  );
  const issueIds = issueFindings.map((finding) => {
    const issueId = `issue-${crypto.randomUUID()}`;
    state.caseData.issues.push({
      id: issueId,
      title: finding.label,
      personIds: ["person-you", person.id],
      status: "open",
      priority: "normal",
      sourceCaptureId: captureId,
      createdAt: recordedAt,
      updatedAt: recordedAt,
    });
    return issueId;
  });

  for (const [index, finding] of commitmentFindings.entries()) {
    const issueId = issueIds[index] || `issue-${crypto.randomUUID()}`;
    if (!issueIds[index]) {
      state.caseData.issues.push({
        id: issueId,
        title: issueTitleFromFinding(finding),
        personIds: ["person-you", person.id],
        status: "open",
        priority: "normal",
        sourceCaptureId: captureId,
        createdAt: recordedAt,
        updatedAt: recordedAt,
      });
    }
    state.caseData.commitments.push({
      id: `commitment-${crypto.randomUUID()}`,
      issueId,
      committerPersonId: person.id,
      description: finding.text,
      status: finding.status || "promised",
      promisedAt: eventDate,
      dueAt: null,
      dueExpression:
        finding.text.match(
          /\b(?:today|tomorrow|yesterday|next\s+\w+)(?:\s+at\s+\d{1,2}(?::\d{2})?)?/i,
        )?.[0] || null,
      source: {
        kind: "screenshot",
        reference: sourceReference,
        captureId,
      },
      sourceSituationId: situationId,
      statusHistory: [
        {
          status: finding.status || "promised",
          changedAt: eventDate,
          recordedAt,
          sourceReference,
        },
      ],
      userConfirmation: "confirmed",
      updatedAt: recordedAt,
    });
  }
}

function issueTitleFromFinding(finding) {
  const knownIssue = [
    "tap",
    "dishwasher",
    "boiler",
    "repair",
    "technician",
    "appointment",
    "payment",
  ].find((term) => finding.text.toLowerCase().includes(term));
  return knownIssue
    ? `${knownIssue.slice(0, 1).toUpperCase()}${knownIssue.slice(1)} follow-up`
    : finding.label;
}

function resetCaptureReview({ preserveProgress = false } = {}) {
  if (state.capturePreviewUrl) {
    URL.revokeObjectURL(state.capturePreviewUrl);
    state.capturePreviewUrl = null;
  }
  state.pendingCapture = null;
  elements.captureReviewForm.reset();
  elements.captureReviewForm.hidden = true;
  elements.capturePreview.removeAttribute("src");
  elements.captureFindingList.innerHTML = "";
  elements.captureQuestionList.innerHTML = "";
  elements.captureKeepSource.checked = true;
  if (!preserveProgress) {
    elements.captureProgress.hidden = true;
    updateCaptureProgress(0, "Preparing local text recognition…");
  }
}

async function openCaptureSourceFromTimeline(event) {
  const button = event.target.closest("button[data-view-capture]");
  if (!button || !state.caseData) return;
  const capture = state.caseData.captures.find(
    (item) => item.id === button.dataset.viewCapture,
  );
  if (!capture) return;
  if (state.captureSourceUrl) URL.revokeObjectURL(state.captureSourceUrl);
  state.captureSourceUrl = null;
  elements.captureSourceTitle.textContent = capture.fileName;
  elements.captureSourceText.textContent = capture.extractedText;
  elements.captureSourceImage.hidden = true;
  elements.captureSourceMissing.hidden = false;
  if (capture.imageStoredLocally) {
    const blob = await getEvidence(capture.id);
    if (blob) {
      state.captureSourceUrl = URL.createObjectURL(blob);
      elements.captureSourceImage.src = state.captureSourceUrl;
      elements.captureSourceImage.hidden = false;
      elements.captureSourceMissing.hidden = true;
    }
  }
  elements.captureSourceDialog.showModal();
}

function closeCaptureSource() {
  elements.captureSourceDialog.close();
  if (state.captureSourceUrl) {
    URL.revokeObjectURL(state.captureSourceUrl);
    state.captureSourceUrl = null;
  }
  elements.captureSourceImage.removeAttribute("src");
}

async function removeCaptureFromTimeline(event) {
  const button = event.target.closest("button[data-remove-capture]");
  if (!button || !state.caseData) return;
  const captureId = button.dataset.removeCapture;
  const capture = state.caseData.captures.find((item) => item.id === captureId);
  if (!capture) return;
  if (state.captureRemovalArmed !== captureId) {
    state.captureRemovalArmed = captureId;
    button.textContent = "Confirm removal";
    showToast("Click again to remove this import and its locally stored source.");
    setTimeout(() => {
      if (state.captureRemovalArmed !== captureId) return;
      state.captureRemovalArmed = null;
      const currentButton = elements.timeline.querySelector(
        `button[data-remove-capture="${CSS.escape(captureId)}"]`,
      );
      if (currentButton) currentButton.textContent = "Remove import";
    }, 5000);
    return;
  }

  state.captureRemovalArmed = null;
  const situationIds = new Set(capture.situationIds || []);
  const removedSituationPersonIds = new Set(
    state.caseData.situations
      .filter((situation) => situationIds.has(situation.id))
      .flatMap((situation) => situation.personIds)
      .filter((personId) => personId !== "person-you"),
  );
  const removedCommitments = state.caseData.commitments.filter(
    (commitment) =>
      commitment.source?.captureId === captureId ||
      situationIds.has(commitment.sourceSituationId),
  );
  const removedIssueIds = new Set(
    removedCommitments.map((commitment) => commitment.issueId),
  );
  state.caseData.situations = state.caseData.situations.filter(
    (situation) => !situationIds.has(situation.id),
  );
  state.caseData.claims = state.caseData.claims.filter(
    (claim) =>
      !situationIds.has(claim.situationId) &&
      claim.source?.captureId !== captureId,
  );
  state.caseData.commitments = state.caseData.commitments.filter(
    (commitment) => !removedCommitments.includes(commitment),
  );
  state.caseData.issues = state.caseData.issues.filter(
    (issue) =>
      !(
        removedIssueIds.has(issue.id) &&
        !state.caseData.commitments.some(
          (commitment) => commitment.issueId === issue.id,
        )
      ),
  );
  state.caseData.selectedSituationIds =
    state.caseData.selectedSituationIds.filter(
      (situationId) => !situationIds.has(situationId),
    );
  state.caseData.captures = state.caseData.captures.filter(
    (item) => item.id !== captureId,
  );

  for (const personId of removedSituationPersonIds) {
    const person = state.caseData.people.find((item) => item.id === personId);
    if (!person || person.source !== "reviewed_screenshot") continue;
    const stillReferenced =
      state.caseData.situations.some((item) => item.personIds.includes(personId)) ||
      state.caseData.commitments.some(
        (item) => item.committerPersonId === personId,
      ) ||
      state.caseData.relationshipConnections.some(
        (item) =>
          item.fromPersonId === personId || item.toPersonId === personId,
      );
    if (!stillReferenced) {
      state.caseData.people = state.caseData.people.filter(
        (item) => item.id !== personId,
      );
    }
  }

  if (state.caseData.incoming?.sourceCaptureId === captureId) {
    if (capture.priorInteraction?.incoming) {
      state.caseData.incoming = capture.priorInteraction.incoming;
      state.caseData.currentGoal =
        capture.priorInteraction.currentGoal || state.caseData.currentGoal;
      state.caseData.desiredTone =
        capture.priorInteraction.desiredTone || state.caseData.desiredTone;
      state.selectedPersonId =
        capture.priorInteraction.selectedPersonId ||
        state.caseData.incoming.senderPersonId ||
        null;
    } else {
      const fallbackPerson = relationshipPeople()[0] || null;
      state.caseData.incoming = {
        id: `incoming-${crypto.randomUUID()}`,
        senderPersonId: fallbackPerson?.id || "",
        text: "",
        receivedAt: null,
        capturedAt: new Date().toISOString(),
        source: "User entry",
      };
      state.selectedPersonId = fallbackPerson?.id || null;
    }
  }

  try {
    await deleteEvidence(captureId);
  } catch (error) {
    console.error("Local evidence deletion failed:", error);
  }
  hydrateWorkspace();
  showPanel("situation");
  persistWorkspace();
  renderEmptyReasoning();
  showToast(`Removed ${capture.fileName} and the records created from it.`);
}

function openEvidenceDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(EVIDENCE_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(EVIDENCE_STORE_NAME)) {
        database.createObjectStore(EVIDENCE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putEvidence(captureId, file) {
  const database = await openEvidenceDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(EVIDENCE_STORE_NAME, "readwrite");
    transaction.objectStore(EVIDENCE_STORE_NAME).put(file, captureId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function getEvidence(captureId) {
  const database = await openEvidenceDatabase();
  const result = await new Promise((resolve, reject) => {
    const transaction = database.transaction(EVIDENCE_STORE_NAME, "readonly");
    const request = transaction.objectStore(EVIDENCE_STORE_NAME).get(captureId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return result;
}

async function deleteEvidence(captureId) {
  const database = await openEvidenceDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(EVIDENCE_STORE_NAME, "readwrite");
    transaction.objectStore(EVIDENCE_STORE_NAME).delete(captureId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function clearEvidenceDatabase() {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(EVIDENCE_DATABASE_NAME);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
    request.onblocked = resolve;
  });
}

async function createFictionalCaptureFile() {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1160;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f1eee7";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(28, 28, canvas.width - 56, canvas.height - 56);
  context.fillStyle = "#202825";
  context.font = "600 34px system-ui";
  context.fillText("Fran", 86, 102);
  context.fillStyle = "#69736e";
  context.font = "22px system-ui";
  context.fillText("Messages", 86, 140);

  drawCaptureBubble(context, {
    x: 74,
    y: 210,
    width: 650,
    height: 190,
    label: "08:42  Fran",
    lines: [
      "I’ve arranged the technician for",
      "tomorrow at 10. Please confirm.",
    ],
    outgoing: false,
  });
  drawCaptureBubble(context, {
    x: 176,
    y: 450,
    width: 650,
    height: 190,
    label: "08:46  You",
    lines: [
      "Thanks. The tap is still loose too.",
      "Is that included?",
    ],
    outgoing: true,
  });
  drawCaptureBubble(context, {
    x: 74,
    y: 690,
    width: 650,
    height: 190,
    label: "08:51  Fran",
    lines: [
      "I’ll ask them to look at it while",
      "they’re there.",
    ],
    outgoing: false,
  });
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png", 0.96),
  );
  return new File([blob], "fictional-fran-conversation.png", {
    type: "image/png",
  });
}

function drawCaptureBubble(
  context,
  { x, y, width, height, label, lines, outgoing },
) {
  context.fillStyle = outgoing ? "#dce8da" : "#ecebe7";
  context.beginPath();
  context.roundRect(x, y, width, height, 28);
  context.fill();
  context.fillStyle = "#5d6963";
  context.font = "21px system-ui";
  context.fillText(label, x + 28, y + 42);
  context.fillStyle = "#1f2925";
  context.font = "28px system-ui";
  lines.forEach((line, index) => {
    context.fillText(line, x + 28, y + 92 + index * 42);
  });
}

function sameCalendarDate(left, right) {
  if (!left || !right) return false;
  const leftDate = new Date(left);
  const rightDate = new Date(right);
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function changeSender() {
  const senderId = elements.sender.value;
  state.caseData.incoming.senderPersonId = senderId;
  state.selectedPersonId = senderId;
  state.caseData.selectedSituationIds = state.caseData.situations
    .filter(
      (situation) =>
        situation.personIds.includes("person-you") &&
        situation.personIds.includes(senderId),
    )
    .map((situation) => situation.id);
  state.reviews = {};
  state.reviewConfirmed = false;
  cancelSituationEdit();
  closeCommitmentForm();
  renderWorkspace();
  persistWorkspace();
  scheduleContextUpdate(
    "Sender changed. Context from other relationships was excluded.",
  );
}

function commitmentsForSelectedPerson() {
  const senderId = elements.sender.value;
  return (state.caseData?.commitments || [])
    .filter((commitment) => commitment.committerPersonId === senderId)
    .sort(
      (left, right) =>
        new Date(left.promisedAt || left.updatedAt).getTime() -
        new Date(right.promisedAt || right.updatedAt).getTime(),
    );
}

function renderCommitments() {
  if (!state.caseData) return;
  renderCommitmentPersonOptions();
  const commitments = commitmentsForSelectedPerson();
  const issueById = new Map(
    state.caseData.issues.map((issue) => [issue.id, issue]),
  );
  const open = commitments.filter(
    (commitment) => !CLOSED_COMMITMENT_STATUSES.has(commitment.status),
  );
  const completed = commitments.filter(
    (commitment) => commitment.status === "completed",
  );
  elements.commitmentCount.textContent = commitments.length
    ? `${open.length} open · ${completed.length} completed`
    : "No commitments yet";
  renderCommitmentPipeline(commitments);
  elements.commitmentList.innerHTML = commitments.length
    ? commitments
        .map((commitment) =>
          renderCommitmentCard(commitment, issueById.get(commitment.issueId)),
        )
        .join("")
    : `<div class="commitment-empty">
        <strong>No promises recorded for this person.</strong>
        <p>Add only what was stated or directly observed. Status can change without rewriting the original record.</p>
      </div>`;
  elements.outstandingReportText.textContent =
    buildOutstandingReportText(commitments, issueById);
}

function renderCommitmentPersonOptions() {
  const people = relationshipPeople();
  const previous =
    elements.commitmentPerson.value || elements.sender.value || people[0]?.id;
  elements.commitmentPerson.innerHTML = people
    .map(
      (person) =>
        `<option value="${escapeHtml(person.id)}">${escapeHtml(person.displayName)}</option>`,
    )
    .join("");
  elements.commitmentPerson.value = people.some(
    (person) => person.id === previous,
  )
    ? previous
    : people[0]?.id || "";
}

function renderCommitmentPipeline(commitments) {
  const stages = [
    {
      id: "promised",
      label: "Promised",
      statuses: ["mentioned", "promised"],
    },
    {
      id: "scheduled",
      label: "Scheduled",
      statuses: ["scheduled"],
    },
    {
      id: "confirmed",
      label: "Confirmed",
      statuses: ["confirmed"],
    },
    {
      id: "completed",
      label: "Completed",
      statuses: ["completed"],
    },
    {
      id: "exception",
      label: "Needs attention",
      statuses: ["delayed", "missed", "disputed", "cancelled"],
    },
  ];
  elements.commitmentPipeline.innerHTML = stages
    .map((stage, index) => {
      const count = commitments.filter((commitment) =>
        stage.statuses.includes(commitment.status),
      ).length;
      return `<div class="commitment-stage${stage.id === "exception" && count ? " commitment-stage-alert" : ""}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(stage.label)}</strong>
        <b>${count}</b>
      </div>`;
    })
    .join("");
  elements.commitmentPipeline.setAttribute(
    "aria-label",
    stages
      .map((stage) => {
        const count = commitments.filter((commitment) =>
          stage.statuses.includes(commitment.status),
        ).length;
        return `${stage.label}: ${count}`;
      })
      .join(". "),
  );
}

function renderCommitmentCard(commitment, issue) {
  const dueDate = commitment.dueAt
    ? formatCalendarDate(commitment.dueAt)
    : "No expected date";
  const referenceTime = new Date(
    state.caseData.incoming?.receivedAt || Date.now(),
  ).getTime();
  const overdue =
    !CLOSED_COMMITMENT_STATUSES.has(commitment.status) &&
    commitment.dueAt &&
    new Date(commitment.dueAt).getTime() < referenceTime;
  const person = state.caseData.people.find(
    (item) => item.id === commitment.committerPersonId,
  );
  const history = [...commitment.statusHistory]
    .sort(
      (left, right) =>
        new Date(left.changedAt).getTime() - new Date(right.changedAt).getTime(),
    )
    .map(
      (item) => `<li>
        <span>${escapeHtml(commitmentStatusLabel(item.status))}</span>
        <time datetime="${escapeHtml(item.changedAt)}">${escapeHtml(formatCalendarDate(item.changedAt))}</time>
        <small>${escapeHtml(item.sourceReference || "User update")}</small>
      </li>`,
    )
    .join("");
  return `<article class="commitment-card" data-commitment-card="${escapeHtml(commitment.id)}">
    <div class="commitment-card-main">
      <div class="commitment-card-title">
        <div>
          <span>${escapeHtml(person?.displayName || "Person")} · ${escapeHtml(issue?.priority || "normal")} priority</span>
          <h4>${escapeHtml(issue?.title || commitment.description)}</h4>
        </div>
        <label>
          <span class="sr-only">Current status</span>
          <select
            class="commitment-status-select status-${escapeHtml(commitment.status)}"
            data-commitment-status="${escapeHtml(commitment.id)}"
          >
            ${commitmentStatusOptions(commitment.status)}
          </select>
        </label>
      </div>
      <p>${escapeHtml(commitment.description)}</p>
      <div class="commitment-card-meta">
        <span${overdue ? ' class="commitment-overdue"' : ""}>${overdue ? "Past expected date · " : "Expected · "}${escapeHtml(dueDate)}</span>
        <span>Source · ${escapeHtml(commitment.source?.reference || "User entry")}</span>
      </div>
    </div>
    <div class="commitment-history">
      <strong>Status trail</strong>
      <ol>${history || "<li><small>No status changes recorded.</small></li>"}</ol>
    </div>
    <button
      class="event-edit-button"
      type="button"
      data-edit-commitment="${escapeHtml(commitment.id)}"
    >Edit record</button>
  </article>`;
}

function commitmentStatusOptions(selectedStatus) {
  return COMMITMENT_STATUSES.map(
    ([value, label]) =>
      `<option value="${value}" ${value === selectedStatus ? "selected" : ""}>${label}</option>`,
  ).join("");
}

function commitmentStatusLabel(status) {
  return (
    COMMITMENT_STATUSES.find(([value]) => value === status)?.[1] ||
    "Status not set"
  );
}

function openNewCommitmentForm() {
  state.editingCommitmentId = null;
  elements.commitmentForm.reset();
  renderCommitmentPersonOptions();
  elements.commitmentPerson.value =
    elements.sender.value || elements.commitmentPerson.value;
  elements.commitmentStatus.value = "promised";
  elements.commitmentPromisedAt.value = "";
  elements.commitmentSummary.textContent = "Record a promise or outcome";
  elements.deleteCommitment.hidden = true;
  elements.commitmentDetails.open = true;
  elements.commitmentIssueTitle.focus();
}

function closeCommitmentForm() {
  state.editingCommitmentId = null;
  elements.commitmentForm.reset();
  elements.commitmentSummary.textContent = "Record a promise or outcome";
  elements.deleteCommitment.hidden = true;
  elements.commitmentDetails.open = false;
}

function saveCommitment(event) {
  event.preventDefault();
  const personId = elements.commitmentPerson.value;
  const issueTitle = elements.commitmentIssueTitle.value.trim();
  const description = elements.commitmentDescription.value.trim();
  const status = elements.commitmentStatus.value;
  const sourceReference = elements.commitmentSource.value.trim();
  if (!personId || !issueTitle || !description || !sourceReference) return;
  const promisedAt = elements.commitmentPromisedAt.value
    ? new Date(elements.commitmentPromisedAt.value).toISOString()
    : null;
  const dueAt = elements.commitmentDueAt.value
    ? new Date(elements.commitmentDueAt.value).toISOString()
    : null;
  const now = new Date().toISOString();

  if (state.editingCommitmentId) {
    const commitment = state.caseData.commitments.find(
      (item) => item.id === state.editingCommitmentId,
    );
    const issue = state.caseData.issues.find(
      (item) => item.id === commitment?.issueId,
    );
    if (!commitment || !issue) return;
    const statusChanged = commitment.status !== status;
    commitment.committerPersonId = personId;
    commitment.description = description;
    commitment.status = status;
    commitment.promisedAt = promisedAt;
    commitment.dueAt = dueAt;
    commitment.source = {
      kind: "user_entry",
      reference: sourceReference,
    };
    commitment.updatedAt = now;
    if (statusChanged) {
      commitment.statusHistory.push({
        status,
        changedAt: now,
        sourceReference,
      });
    }
    updateIssueFromCommitment(issue, commitment, issueTitle, now);
    closeCommitmentForm();
    renderCommitments();
    persistWorkspace();
    scheduleContextUpdate("The commitment record updated the current reasoning.");
    showToast(`“${issueTitle}” was updated.`);
    return;
  }

  const suffix = crypto.randomUUID();
  const issueId = `issue-${suffix}`;
  const commitmentId = `commitment-${suffix}`;
  state.caseData.issues.push({
    id: issueId,
    title: issueTitle,
    personIds: ["person-you", personId],
    status: status === "completed" ? "resolved" : "open",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
    ...(status === "completed" ? { resolvedAt: now } : {}),
  });
  state.caseData.commitments.push({
    id: commitmentId,
    issueId,
    committerPersonId: personId,
    description,
    status,
    promisedAt,
    dueAt,
    ...(status === "completed" ? { completedAt: now } : {}),
    source: {
      kind: "user_entry",
      reference: sourceReference,
    },
    sourceSituationId: null,
    statusHistory: [
      {
        status,
        changedAt: now,
        sourceReference,
      },
    ],
    userConfirmation: "confirmed",
    updatedAt: now,
  });
  closeCommitmentForm();
  if (personId !== elements.sender.value) {
    elements.sender.value = personId;
    state.caseData.incoming.senderPersonId = personId;
    state.selectedPersonId = personId;
  }
  renderWorkspace();
  persistWorkspace();
  scheduleContextUpdate("A commitment was added to this relationship.");
}

function updateIssueFromCommitment(issue, commitment, title, changedAt) {
  issue.title = title;
  issue.personIds = ["person-you", commitment.committerPersonId];
  issue.status = commitment.status === "completed" ? "resolved" : "open";
  issue.updatedAt = changedAt;
  if (commitment.status === "completed") {
    issue.resolvedAt = changedAt;
    commitment.completedAt = changedAt;
  } else {
    delete issue.resolvedAt;
    delete commitment.completedAt;
  }
}

function editCommitmentFromControl(event) {
  const button = event.target.closest("button[data-edit-commitment]");
  if (!button) return;
  const commitment = state.caseData.commitments.find(
    (item) => item.id === button.dataset.editCommitment,
  );
  const issue = state.caseData.issues.find(
    (item) => item.id === commitment?.issueId,
  );
  if (!commitment || !issue) return;
  state.editingCommitmentId = commitment.id;
  renderCommitmentPersonOptions();
  elements.commitmentPerson.value = commitment.committerPersonId;
  elements.commitmentStatus.value = commitment.status;
  elements.commitmentIssueTitle.value = issue.title;
  elements.commitmentDescription.value = commitment.description;
  elements.commitmentPromisedAt.value = toLocalDateTimeInput(
    commitment.promisedAt,
  );
  elements.commitmentDueAt.value = commitment.dueAt
    ? toLocalDateTimeInput(commitment.dueAt)
    : "";
  elements.commitmentSource.value =
    commitment.source?.reference || "User entry";
  elements.commitmentSummary.textContent = `Edit ${issue.title}`;
  elements.deleteCommitment.hidden = false;
  elements.commitmentDetails.open = true;
  elements.commitmentIssueTitle.focus();
}

function changeCommitmentStatus(event) {
  const select = event.target.closest("select[data-commitment-status]");
  if (!select) return;
  const commitment = state.caseData.commitments.find(
    (item) => item.id === select.dataset.commitmentStatus,
  );
  const issue = state.caseData.issues.find(
    (item) => item.id === commitment?.issueId,
  );
  if (!commitment || !issue || commitment.status === select.value) return;
  const now = new Date().toISOString();
  commitment.status = select.value;
  commitment.updatedAt = now;
  commitment.statusHistory.push({
    status: select.value,
    changedAt: now,
    sourceReference: "Status changed by the user",
  });
  updateIssueFromCommitment(issue, commitment, issue.title, now);
  renderCommitments();
  persistWorkspace();
  scheduleContextUpdate(
    `${issue.title} is now ${commitmentStatusLabel(select.value).toLowerCase()}.`,
  );
}

function deleteCommitment() {
  const commitmentId = state.editingCommitmentId;
  if (!commitmentId) return;
  const commitment = state.caseData.commitments.find(
    (item) => item.id === commitmentId,
  );
  if (!commitment) return;
  const issueId = commitment.issueId;
  state.caseData.commitments = state.caseData.commitments.filter(
    (item) => item.id !== commitmentId,
  );
  if (
    !state.caseData.commitments.some(
      (item) => item.issueId === issueId,
    )
  ) {
    state.caseData.issues = state.caseData.issues.filter(
      (item) => item.id !== issueId,
    );
  }
  closeCommitmentForm();
  renderCommitments();
  persistWorkspace();
  scheduleContextUpdate("The commitment was removed from the current record.");
}

function buildOutstandingReportText(commitments, issueById) {
  const person = state.caseData.people.find(
    (item) => item.id === elements.sender.value,
  );
  if (!commitments.length) {
    return `Outstanding-items report · ${person?.displayName || "No person selected"}\n\nNo commitments recorded.`;
  }
  const asOf = formatCalendarDate(
    state.caseData.incoming?.receivedAt || new Date().toISOString(),
  );
  const lines = [
    `Outstanding-items report · ${person?.displayName || "Selected person"}`,
    `As of ${asOf}`,
    "",
  ];
  for (const commitment of commitments) {
    const issue = issueById.get(commitment.issueId);
    lines.push(
      `• ${issue?.title || commitment.description}`,
      `  Status: ${commitmentStatusLabel(commitment.status)}`,
      `  Commitment: ${commitment.description}`,
      `  Expected: ${commitment.dueAt ? formatCalendarDate(commitment.dueAt) : "Not set"}`,
      `  Source: ${commitment.source?.reference || "User entry"}`,
      "",
    );
  }
  lines.push(
    "This report records user-confirmed states and sources. It does not determine motive, fault, or legal responsibility.",
  );
  return lines.join("\n");
}

async function copyOutstandingReport() {
  try {
    await navigator.clipboard.writeText(
      elements.outstandingReportText.textContent,
    );
    elements.copyOutstandingReport.textContent = "Copied";
    setTimeout(() => {
      elements.copyOutstandingReport.textContent = "Copy report";
    }, 1400);
  } catch {
    elements.copyOutstandingReport.textContent = "Select and copy";
  }
}

function renderTimeline() {
  const senderId = elements.sender.value;
  if (!senderId) {
    elements.selectionCount.textContent = "No person selected";
    elements.timeline.innerHTML = `<div class="timeline-event">
      <div>
        <h3>Your timeline starts with a person</h3>
        <p>Create a relationship first, then add events involving that person.</p>
      </div>
    </div>`;
    return;
  }

  const selected = new Set(state.caseData.selectedSituationIds);
  const isPatternDemo = Boolean(state.caseData.patternModel);
  const situations = state.caseData.situations
    .filter(
      (situation) =>
        situation.personIds.includes("person-you") &&
        (isPatternDemo || situation.personIds.includes(senderId)),
    )
    .sort(
      (left, right) =>
        situationSortTime(left) - situationSortTime(right),
    );

  elements.selectionCount.textContent =
    `${situations.filter((item) => selected.has(item.id)).length} of ${situations.length} used`;
  elements.timeline.innerHTML = situations.length
    ? situations.map((situation) => renderSituation(situation, selected)).join("")
    : `<div class="timeline-event">
        <div>
          <h3>No situations with this person yet</h3>
          <p>Add a separate event below. Second Mind will never substitute another relationship’s history.</p>
        </div>
      </div>`;
}

function renderSituation(situation, selected) {
  const claims = situation.eventClaimIds
    .map((id) => state.caseData.claims.find((claim) => claim.id === id))
    .filter(Boolean);
  const people = situation.personIds
    .map((id) => state.caseData.people.find((person) => person.id === id))
    .filter(Boolean)
    .map((person) => person.displayName)
    .join(" · ");
  const dateMarkup = situation.occurredAt
    ? `<time datetime="${escapeHtml(situation.occurredAt)}">${escapeHtml(formatDate(situation.occurredAt))}</time>`
    : `<span class="event-date-unknown">Date not provided</span>`;
  const sourceButton = situation.sourceCaptureId
    ? `<button
        class="event-edit-button"
        type="button"
        data-view-capture="${escapeHtml(situation.sourceCaptureId)}"
      >View source</button>
      <button
        class="event-edit-button event-remove-button"
        type="button"
        data-remove-capture="${escapeHtml(situation.sourceCaptureId)}"
      >Remove import</button>`
    : "";

  return `<article class="timeline-event" data-situation-card="${escapeHtml(situation.id)}">
    <div>
      <div class="event-meta">
        ${dateMarkup}
        <span>${escapeHtml(situation.location)}</span>
        <span>${escapeHtml(people)}</span>
      </div>
      <h3>${escapeHtml(situation.title)}</h3>
      ${claims.map((claim) => `<p>${escapeHtml(claim.text)}</p>`).join("")}
    </div>
    <div class="timeline-controls">
      <label class="context-toggle">
        <input
          type="checkbox"
          data-situation-id="${escapeHtml(situation.id)}"
          ${selected.has(situation.id) ? "checked" : ""}
        />
        <span>Use as context</span>
      </label>
      <button
        class="event-edit-button"
        type="button"
        data-edit-situation="${escapeHtml(situation.id)}"
      >Edit situation</button>
      ${sourceButton}
    </div>
  </article>`;
}

function situationSortTime(situation) {
  const value = situation.occurredAt || situation.capturedAt || situation.updatedAt;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time)
    ? time
    : Number(situation.recordSequence || 0);
}

function selectTimelineContext(event) {
  const checkbox = event.target.closest("input[data-situation-id]");
  if (!checkbox) return;
  const selected = new Set(state.caseData.selectedSituationIds);
  if (checkbox.checked) selected.add(checkbox.dataset.situationId);
  else selected.delete(checkbox.dataset.situationId);
  state.caseData.selectedSituationIds = [...selected];
  state.reviewConfirmed = false;
  renderTimeline();
  persistWorkspace();
  updateReviewState();
  scheduleContextUpdate(
    checkbox.checked
      ? "Context included. The comparison updated in place."
      : "Context excluded. The comparison updated in place.",
  );
}

function renderEventPeopleOptions(selectedPersonIds = null) {
  if (!elements.eventPeopleOptions || !state.caseData) return;
  const senderId = elements.sender.value;
  const selected = new Set(
    selectedPersonIds ||
      (state.editingSituationId
        ? state.caseData.situations.find(
            (situation) => situation.id === state.editingSituationId,
          )?.personIds || []
        : []),
  );
  const options = relationshipPeople().filter(
    (person) => person.id !== senderId,
  );
  elements.eventPeopleOptions.innerHTML = options.length
    ? options
        .map(
          (person) => `<label>
            <input
              type="checkbox"
              value="${escapeHtml(person.id)}"
              data-event-person-id="${escapeHtml(person.id)}"
              ${selected.has(person.id) ? "checked" : ""}
            />
            <span>${escapeHtml(person.displayName)}</span>
          </label>`,
        )
        .join("")
    : `<span class="event-people-empty">Add another person to connect a multi-person event.</span>`;
}

function selectedEventPersonIds() {
  return [
    ...elements.eventPeopleOptions.querySelectorAll(
      "input[data-event-person-id]:checked",
    ),
  ].map((input) => input.value);
}

function addSituation(event) {
  event.preventDefault();
  const senderId = elements.sender.value;
  if (!senderId) {
    openPersonDialog();
    return;
  }
  const title = elements.eventTitle.value.trim();
  const text = elements.eventText.value.trim();
  if (!title || !text) return;
  const occurredAt = elements.eventDate.value
    ? new Date(elements.eventDate.value).toISOString()
    : null;
  const personIds = [
    ...new Set(["person-you", senderId, ...selectedEventPersonIds()]),
  ];

  if (state.editingSituationId) {
    const situation = state.caseData.situations.find(
      (item) => item.id === state.editingSituationId,
    );
    const claim = state.caseData.claims.find(
      (item) => item.situationId === state.editingSituationId,
    );
    if (!situation || !claim) {
      cancelSituationEdit();
      return;
    }
    situation.title = title;
    situation.occurredAt = occurredAt;
    situation.datePrecision = occurredAt ? "exact" : "unknown";
    situation.dateSource = occurredAt ? "user_supplied" : "not_provided";
    situation.personIds = personIds;
    situation.updatedAt = new Date().toISOString();
    claim.text = text;
    claim.personIds = personIds;
    claim.updatedAt = situation.updatedAt;
    claim.source = {
      kind: "user_entry",
      reference: "Edited by the user",
    };
    const editedTitle = situation.title;
    cancelSituationEdit();
    renderTimeline();
    persistWorkspace();
    scheduleContextUpdate("The edited situation updated the current reasoning.");
    showToast(`“${editedTitle}” was updated locally.`);
    return;
  }

  const suffix = crypto.randomUUID();
  const situationId = `situation-${suffix}`;
  const claimId = `claim-${suffix}`;
  const now = new Date().toISOString();

  state.caseData.claims.push({
    id: claimId,
    situationId,
    personIds,
    type: "user_report",
    text,
    source: {
      kind: "user_entry",
      reference: "Added by the user",
    },
    confidence: "high",
    status: "current",
    userConfirmation: "confirmed",
    createdAt: now,
  });
  state.caseData.situations.push({
    id: situationId,
    title,
    occurredAt,
    datePrecision: occurredAt ? "exact" : "unknown",
    dateSource: occurredAt ? "user_supplied" : "not_provided",
    capturedAt: now,
    recordSequence: state.caseData.situations.length,
    location: "User-added situation",
    personIds,
    sourceRefs: ["User entry"],
    eventClaimIds: [claimId],
    actionTaken: "",
    unresolvedQuestions: [],
    relatedSituationIds: [],
  });
  state.caseData.selectedSituationIds.push(situationId);
  resetSituationForm();
  renderTimeline();
  persistWorkspace();
  scheduleContextUpdate("A separate situation was added to this relationship.");
}

function editSituationFromTimeline(event) {
  const button = event.target.closest("button[data-edit-situation]");
  if (!button) return;
  const situation = state.caseData.situations.find(
    (item) => item.id === button.dataset.editSituation,
  );
  if (!situation) return;
  const claim = state.caseData.claims.find(
    (item) => item.situationId === situation.id,
  );
  state.editingSituationId = situation.id;
  elements.eventTitle.value = situation.title;
  elements.eventText.value = claim?.text || "";
  elements.eventDate.value = toLocalDateTimeInput(situation.occurredAt);
  renderEventPeopleOptions(situation.personIds);
  elements.eventSummary.textContent = "Edit this situation";
  elements.eventSubmit.textContent = "Save changes";
  elements.eventCancel.hidden = false;
  elements.eventDetails.open = true;
  elements.eventTitle.focus();
}

function cancelSituationEdit() {
  state.editingSituationId = null;
  resetSituationForm();
}

function resetSituationForm() {
  elements.eventForm.reset();
  renderEventPeopleOptions([]);
  elements.eventSummary.textContent = "Add a separate situation";
  elements.eventSubmit.textContent = "Add situation";
  elements.eventCancel.hidden = true;
  elements.eventDetails.open = false;
}

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function openPersonDialog() {
  elements.personForm.reset();
  elements.newCloseness.value = "1";
  elements.newTrust.value = "1";
  updateNewPersonRanges();
  elements.personDialog.showModal();
  elements.newPersonName.focus();
}

function closePersonDialog() {
  elements.personDialog.close();
}

function updateNewPersonRanges() {
  elements.newClosenessValue.textContent = `${elements.newCloseness.value} / 4`;
  elements.newTrustValue.textContent = `${elements.newTrust.value} / 4`;
}

function createPerson(event) {
  event.preventDefault();
  const name = elements.newPersonName.value.trim();
  const relationshipType = elements.newRelationshipType.value.trim();
  if (!name || !relationshipType) return;
  const id = `person-${crypto.randomUUID()}`;
  state.caseData.people.push({
    id,
    displayName: name,
    relationshipType,
    closeness: Number(elements.newCloseness.value),
    trust: Number(elements.newTrust.value),
    metThrough: elements.newMetThrough.value.trim(),
    communicationNotes: [],
    boundaries: [],
    relationshipGoals: [],
    currentState: "Active",
  });
  state.selectedPersonId = id;
  if (!state.caseData.incoming.senderPersonId) {
    state.caseData.incoming.senderPersonId = id;
  }
  renderSenderOptions();
  elements.sender.value = state.caseData.incoming.senderPersonId;
  renderWorkspace();
  persistWorkspace();
  closePersonDialog();
  showPanel("people");
  showToast(`${name} was added to your relationship map.`);
}

function renderPeopleDirectory() {
  if (!state.caseData) return;
  const query = elements.peopleSearch.value.trim().toLowerCase();
  const people = relationshipPeople().filter(
    (person) =>
      !query ||
      `${person.displayName} ${person.relationshipType}`
        .toLowerCase()
        .includes(query),
  );
  elements.personList.innerHTML = people.length
    ? people
        .map(
          (person) => `<button
            type="button"
            data-person-id="${escapeHtml(person.id)}"
            class="${person.id === state.selectedPersonId ? "active" : ""}"
          >${escapeHtml(person.displayName)} · ${escapeHtml(person.relationshipType)}</button>`,
        )
        .join("")
    : `<span class="empty-directory">No matching people</span>`;
}

function renderRelationshipMap() {
  if (!state.caseData) return;
  const allPeople = relationshipPeople();
  const people = allPeople.slice(0, 16);
  const connections = relationshipConnections().filter(
    (connection) =>
      people.some((person) => person.id === connection.fromPersonId) &&
      people.some((person) => person.id === connection.toPersonId),
  );
  const positions = graphNodePositions(people);
  const nodeParts = [];
  const edgeParts = [];
  const centre = { x: 320, y: 245 };
  const selfName =
    state.caseData.people.find((person) => person.id === "person-you")
      ?.displayName || "You";

  people.forEach((person) => {
    const position = positions.get(person.id);
    const edgeStrength = (Number(person.closeness) + Number(person.trust)) / 2;
    edgeParts.push(`<g class="graph-edge your-edge" aria-hidden="true">
      <path
        class="edge-visible"
        d="M ${centre.x} ${centre.y} L ${position.x} ${position.y}"
        stroke-width="${(1.5 + edgeStrength * 0.62).toFixed(2)}"
      ></path>
      <path
        class="edge-hit"
        d="M ${centre.x} ${centre.y} L ${position.x} ${position.y}"
      ></path>
    </g>`);
    nodeParts.push(`<g
      class="svg-person-node ${person.id === state.selectedPersonId ? "active" : ""}"
      aria-hidden="true"
    >
      <circle cx="${position.x}" cy="${position.y}" r="45"></circle>
      <text class="svg-node-name" x="${position.x}" y="${position.y - 3}">${escapeHtml(firstName(person.displayName))}</text>
      <text class="svg-node-meta" x="${position.x}" y="${position.y + 15}">${escapeHtml(truncateText(person.relationshipType, 18))}</text>
    </g>`);
  });

  connections.forEach((connection, index) => {
    const from = positions.get(connection.fromPersonId);
    const to = positions.get(connection.toPersonId);
    if (!from || !to) return;
    const curve = graphCurve(from, to, index);
    const dynamic = normalizedDynamic(connection.dynamic);
    const label = truncateText(
      connection.relationshipType || humanizeDynamic(dynamic),
      24,
    );
    edgeParts.unshift(`<g
      class="graph-edge observed-edge dynamic-${escapeHtml(dynamic)}"
      aria-hidden="true"
    >
      <path
        class="edge-visible"
        d="${curve.path}"
        stroke-width="${(1.4 + Number(connection.strength || 0) * 0.72).toFixed(2)}"
      ></path>
      <path class="edge-hit" d="${curve.path}"></path>
      <text
        class="graph-edge-label"
        x="${curve.labelX.toFixed(2)}"
        y="${curve.labelY.toFixed(2)}"
      >${escapeHtml(label)}</text>
    </g>`);
  });

  elements.mapConnections.innerHTML = `${edgeParts.join("")}
    <g class="svg-self-node" aria-hidden="true">
      <circle cx="${centre.x}" cy="${centre.y}" r="52"></circle>
      <text class="svg-self-name" x="${centre.x}" y="${centre.y - 1}">${escapeHtml(firstName(selfName))}</text>
      <text class="svg-self-meta" x="${centre.x}" y="${centre.y + 18}">Map centre</text>
    </g>
    ${nodeParts.join("")}`;
  elements.graphSummary.textContent =
    `${allPeople.length} ${allPeople.length === 1 ? "person" : "people"} · ` +
    `${connections.length} ${connections.length === 1 ? "observed connection" : "observed connections"}` +
    (allPeople.length > people.length ? ` · showing ${people.length}` : "");
}

function graphNodePositions(people) {
  const positions = new Map();
  const count = people.length;
  if (!count) return positions;
  if (count === 1) {
    positions.set(people[0].id, { x: 510, y: 245 });
    return positions;
  }
  people.forEach((person, index) => {
    const ring = count > 9 && index >= 8 ? 1 : 0;
    const ringPeople = ring ? people.slice(8) : people.slice(0, Math.min(8, count));
    const ringIndex = ring ? index - 8 : index;
    const ringCount = Math.max(ringPeople.length, 1);
    const angle = -90 + (360 / ringCount) * ringIndex + ring * 22.5;
    const radians = (angle * Math.PI) / 180;
    const radiusX = ring ? 265 : count <= 4 ? 205 : 220;
    const radiusY = ring ? 195 : count <= 4 ? 155 : 165;
    positions.set(person.id, {
      x: 320 + Math.cos(radians) * radiusX,
      y: 245 + Math.sin(radians) * radiusY,
    });
  });
  return positions;
}

function graphCurve(from, to, index) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const direction = index % 2 === 0 ? 1 : -1;
  const offset = Math.min(34, Math.max(17, length * 0.1)) * direction;
  const controlX = (from.x + to.x) / 2 + (-dy / length) * offset;
  const controlY = (from.y + to.y) / 2 + (dx / length) * offset;
  return {
    path: `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
    labelX: (from.x + 2 * controlX + to.x) / 4,
    labelY: (from.y + 2 * controlY + to.y) / 4 - 7,
  };
}

function selectPersonFromControl(event) {
  const control = event.target.closest?.("[data-person-id]");
  if (!control) return;
  state.selectedPersonId = control.dataset.personId;
  renderRelationshipMap();
  renderPeopleDirectory();
  renderSelectedProfile();
}

function renderConnectionList() {
  if (!state.caseData) return;
  const people = relationshipPeople();
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const connections = relationshipConnections();
  elements.addConnection.disabled = people.length < 2;
  if (!connections.length) {
    elements.connectionList.innerHTML = `<p class="empty-connections">${
      people.length < 2
        ? "Add at least two people before mapping a relationship between them."
        : "No relationships between other people are mapped yet. Add only what you have observed or been told."
    }</p>`;
    return;
  }
  elements.connectionList.innerHTML = connections
    .map((connection) => {
      const from = peopleById.get(connection.fromPersonId);
      const to = peopleById.get(connection.toPersonId);
      const dynamic = normalizedDynamic(connection.dynamic);
      return `<button
        class="connection-card ${connection.id === state.editingConnectionId ? "active" : ""}"
        type="button"
        data-connection-id="${escapeHtml(connection.id)}"
      >
        <span class="connection-avatar-pair" aria-hidden="true">
          <i>${escapeHtml(initials(from.displayName))}</i>
          <i>${escapeHtml(initials(to.displayName))}</i>
        </span>
        <span class="connection-card-copy">
          <strong>${escapeHtml(firstName(from.displayName))} ↔ ${escapeHtml(firstName(to.displayName))}</strong>
          <small>${escapeHtml(connection.relationshipType || "Relationship not yet described")} · confidence ${Number(connection.confidence || 0)}/4</small>
        </span>
        <span class="dynamic-chip" data-dynamic="${escapeHtml(dynamic)}">${escapeHtml(humanizeDynamic(dynamic))}</span>
      </button>`;
    })
    .join("");
}

function openNewConnectionForm() {
  const people = relationshipPeople();
  if (people.length < 2) {
    showToast("Add at least two people before mapping their relationship.");
    return;
  }
  state.editingConnectionId = null;
  populateConnectionPersonOptions();
  const preferred = people.some((person) => person.id === state.selectedPersonId)
    ? state.selectedPersonId
    : people[0].id;
  elements.connectionFrom.value = preferred;
  elements.connectionTo.value =
    people.find((person) => person.id !== preferred)?.id || "";
  elements.connectionRelationshipType.value = "";
  elements.connectionDynamic.value = "developing";
  elements.connectionStrength.value = "2";
  elements.connectionConfidence.value = "2";
  elements.connectionNotes.value = "";
  elements.connectionFormKicker.textContent = "New observed connection";
  elements.connectionFormTitle.textContent =
    "Add a relationship between two people";
  elements.deleteConnection.hidden = true;
  elements.connectionForm.hidden = false;
  updateConnectionRanges();
  renderConnectionList();
  elements.connectionRelationshipType.focus();
}

function populateConnectionPersonOptions() {
  const options = relationshipPeople()
    .map(
      (person) =>
        `<option value="${escapeHtml(person.id)}">${escapeHtml(person.displayName)}</option>`,
    )
    .join("");
  elements.connectionFrom.innerHTML = options;
  elements.connectionTo.innerHTML = options;
}

function editConnectionFromControl(event) {
  const control = event.target.closest?.("[data-connection-id]");
  if (!control) return;
  openConnectionEditor(control.dataset.connectionId);
}

function openConnectionEditor(connectionId) {
  const connection = relationshipConnections().find(
    (item) => item.id === connectionId,
  );
  if (!connection) return;
  state.editingConnectionId = connection.id;
  populateConnectionPersonOptions();
  elements.connectionFrom.value = connection.fromPersonId;
  elements.connectionTo.value = connection.toPersonId;
  elements.connectionRelationshipType.value = connection.relationshipType || "";
  elements.connectionDynamic.value = normalizedDynamic(connection.dynamic);
  elements.connectionStrength.value = String(connection.strength ?? 2);
  elements.connectionConfidence.value = String(connection.confidence ?? 2);
  elements.connectionNotes.value = connection.notes || "";
  elements.connectionFormKicker.textContent = "Editing observed connection";
  elements.connectionFormTitle.textContent =
    `${personNameById(connection.fromPersonId)} and ${personNameById(connection.toPersonId)}`;
  elements.deleteConnection.hidden = false;
  elements.connectionForm.hidden = false;
  updateConnectionRanges();
  renderConnectionList();
  elements.connectionForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeConnectionForm() {
  state.editingConnectionId = null;
  elements.connectionForm.hidden = true;
  renderConnectionList();
}

function updateConnectionRanges() {
  elements.connectionStrengthValue.textContent =
    `${elements.connectionStrength.value} / 4`;
  elements.connectionConfidenceValue.textContent =
    `${elements.connectionConfidence.value} / 4`;
}

function saveConnection(event) {
  event.preventDefault();
  const fromPersonId = elements.connectionFrom.value;
  const toPersonId = elements.connectionTo.value;
  const relationshipType = elements.connectionRelationshipType.value.trim();
  if (!fromPersonId || !toPersonId || !relationshipType) return;
  if (fromPersonId === toPersonId) {
    showToast("Choose two different people for this relationship.");
    return;
  }
  const duplicate = relationshipConnections().find(
    (connection) =>
      connection.id !== state.editingConnectionId &&
      sameConnectionPair(connection, fromPersonId, toPersonId),
  );
  if (duplicate) {
    showToast("That relationship already exists. Edit the existing connection.");
    openConnectionEditor(duplicate.id);
    return;
  }
  const record = {
    id: state.editingConnectionId || `connection-${crypto.randomUUID()}`,
    schemaVersion: "1.0.0",
    fromPersonId,
    toPersonId,
    relationshipType,
    dynamic: normalizedDynamic(elements.connectionDynamic.value),
    strength: Number(elements.connectionStrength.value),
    confidence: Number(elements.connectionConfidence.value),
    notes: elements.connectionNotes.value.trim(),
    source: "user_entry",
    userConfirmation: "confirmed",
    updatedAt: new Date().toISOString(),
  };
  const existingIndex = state.caseData.relationshipConnections.findIndex(
    (connection) => connection.id === state.editingConnectionId,
  );
  if (existingIndex >= 0) {
    state.caseData.relationshipConnections[existingIndex] = record;
  } else {
    state.caseData.relationshipConnections.push(record);
  }
  persistWorkspace();
  closeConnectionForm();
  renderRelationshipMap();
  renderConnectionList();
  showToast(
    `${personNameById(fromPersonId)} and ${personNameById(toPersonId)} were updated on the graph.`,
  );
}

function deleteConnection() {
  const connection = relationshipConnections().find(
    (item) => item.id === state.editingConnectionId,
  );
  if (!connection) return;
  state.caseData.relationshipConnections =
    state.caseData.relationshipConnections.filter(
      (item) => item.id !== connection.id,
    );
  persistWorkspace();
  closeConnectionForm();
  renderRelationshipMap();
  showToast("The mapped relationship was removed.");
}

function sameConnectionPair(connection, fromPersonId, toPersonId) {
  return (
    (connection.fromPersonId === fromPersonId &&
      connection.toPersonId === toPersonId) ||
    (connection.fromPersonId === toPersonId &&
      connection.toPersonId === fromPersonId)
  );
}

function personNameById(personId) {
  return (
    state.caseData?.people.find((person) => person.id === personId)?.displayName ||
    "Unknown person"
  );
}

function normalizedDynamic(value) {
  const allowed = new Set([
    "supportive",
    "close",
    "developing",
    "neutral",
    "strained",
    "distant",
    "unknown",
  ]);
  return allowed.has(value) ? value : "unknown";
}

function humanizeDynamic(value) {
  return normalizedDynamic(value).replaceAll("_", " ");
}

function selectedPerson() {
  return state.caseData?.people.find(
    (person) => person.id === state.selectedPersonId,
  ) || null;
}

function renderSelectedProfile() {
  const person = selectedPerson();
  elements.profileForm.classList.toggle("empty", !person);
  [
    elements.usePerson,
    elements.personName,
    elements.relationshipType,
    elements.currentState,
    elements.closeness,
    elements.trust,
    elements.boundary,
    elements.relationshipGoal,
    elements.metThrough,
  ].forEach((control) => {
    control.disabled = !person;
  });
  if (!person) {
    elements.profilePersonName.textContent = "Add or choose a person";
    elements.relationshipState.textContent = "No relationship selected";
    elements.mapCloseness.textContent = "—";
    elements.mapTrust.textContent = "—";
    elements.closeness.value = "0";
    elements.trust.value = "0";
    elements.closenessValue.textContent = "—";
    elements.trustValue.textContent = "—";
    elements.relationshipType.value = "";
    elements.personName.value = "";
    elements.currentState.value = "";
    elements.boundary.value = "";
    elements.relationshipGoal.value = "";
    elements.metThrough.value = "";
    elements.scopeNote.textContent =
      "Context is scoped to an exact person. Add a relationship to begin.";
    return;
  }

  elements.profilePersonName.textContent = person.displayName;
  elements.relationshipState.textContent = person.currentState;
  elements.personName.value = person.displayName;
  elements.mapCloseness.textContent = `${person.closeness}/4`;
  elements.mapTrust.textContent = `${person.trust}/4`;
  elements.relationshipType.value = person.relationshipType;
  elements.currentState.value = person.currentState || "";
  elements.closeness.value = person.closeness;
  elements.closenessValue.textContent = `${person.closeness} / 4`;
  elements.trust.value = person.trust;
  elements.trustValue.textContent = `${person.trust} / 4`;
  elements.boundary.value = person.boundaries[0] || "";
  elements.relationshipGoal.value = person.relationshipGoals[0] || "";
  elements.metThrough.value = person.metThrough || "";
  updateScopeNote(person);
}

function useSelectedPerson() {
  const person = selectedPerson();
  if (!person) return;
  elements.sender.value = person.id;
  changeSender();
  showToast(`${person.displayName} is now the person in the current thought.`);
}

function updateProfile() {
  const person = selectedPerson();
  if (!person) return;
  const priorName = person.displayName;
  person.displayName = elements.personName.value.trim() || priorName;
  person.relationshipType = elements.relationshipType.value.trim();
  person.currentState = elements.currentState.value.trim() || "Active";
  person.closeness = Number(elements.closeness.value);
  person.trust = Number(elements.trust.value);
  person.boundaries = elements.boundary.value.trim()
    ? [elements.boundary.value.trim()]
    : [];
  person.relationshipGoals = elements.relationshipGoal.value.trim()
    ? [elements.relationshipGoal.value.trim()]
    : [];
  person.metThrough = elements.metThrough.value.trim();
  person.updatedAt = new Date().toISOString();
  elements.profilePersonName.textContent = person.displayName;
  elements.relationshipState.textContent = person.currentState;
  elements.mapCloseness.textContent = `${person.closeness}/4`;
  elements.mapTrust.textContent = `${person.trust}/4`;
  elements.closenessValue.textContent = `${person.closeness} / 4`;
  elements.trustValue.textContent = `${person.trust} / 4`;
  renderRelationshipMap();
  renderPeopleDirectory();
  renderConnectionList();
  renderSenderOptionsPreserving(person.id);
  renderTimeline();
  updateScopeNote(person);
  persistWorkspace();
  state.reviewConfirmed = false;
  updateReviewState();
  if (person.id === elements.sender.value) {
    scheduleContextUpdate(
      "Relationship context changed. Closeness and trust stayed independent.",
    );
  }
}

function updateScopeNote(person) {
  if (state.caseData?.patternModel) {
    const names = relationshipPeople()
      .map((item) => item.displayName)
      .join(", ");
    elements.scopeNote.textContent =
      `Merlin may connect only the selected events involving ${names}. ` +
      "Untick any event to remove it, or adjust its weight inside Merlin’s evidence trail.";
    return;
  }
  const excludedPeople = relationshipPeople().filter(
    (item) => item.id !== person.id,
  );
  const excludedNames = excludedPeople.map((item) => item.displayName).join(", ");
  elements.scopeNote.textContent =
    `Only ${person.displayName}’s explicitly selected situations can enter a response about them. ` +
    `${excludedNames || "Other relationships"} ${excludedPeople.length === 1 ? "remains" : "remain"} outside this context.`;
}

function renderSenderOptionsPreserving(editedPersonId) {
  const activeSender = state.caseData.incoming.senderPersonId;
  renderSenderOptions();
  elements.sender.value = activeSender;
  state.caseData.incoming.senderPersonId = activeSender;
  if (editedPersonId === activeSender) {
    const edited = state.caseData.people.find((person) => person.id === editedPersonId);
    if (edited) state.selectedPersonId = edited.id;
  }
}

function renderResult() {
  if (!state.result) return;
  const { epistemic, generic, contextual } = state.result;
  renderMerlinInsight(state.result.merlinInsight);
  elements.factList.innerHTML = epistemic.facts
    .map(
      (claim) => `<div class="simple-review-item">
        <p>${escapeHtml(claim.text)}</p>
        <small>${escapeHtml(claim.source)} · ${escapeHtml(claim.confidence)} confidence</small>
      </div>`,
    )
    .join("");
  elements.interpretationList.innerHTML = epistemic.interpretations
    .map(renderInterpretation)
    .join("");
  elements.alternativeList.innerHTML = epistemic.alternatives
    .map(
      (text) => `<div class="simple-review-item"><p>${escapeHtml(text)}</p></div>`,
    )
    .join("");
  elements.uncertaintyList.innerHTML = epistemic.uncertainties
    .map(
      (text) => `<div class="simple-review-item"><p>${escapeHtml(text)}</p></div>`,
    )
    .join("");

  elements.genericConfidence.textContent =
    generic.confidenceLabel || `${generic.confidence} confidence`;
  elements.genericInterpretation.textContent = generic.interpretation;
  elements.genericDraft.textContent = generic.draft;
  elements.contextConfidence.textContent =
    contextual.confidenceLabel || `${contextual.confidence} confidence`;
  elements.contextInterpretation.textContent = contextual.interpretation;
  elements.responseOptions.innerHTML = (contextual.responseOptions || [])
    .map(
      (option) => `<button
        class="response-option${option.recommended ? " active" : ""}"
        type="button"
        data-response-option="${escapeHtml(option.id)}"
        aria-pressed="${option.recommended ? "true" : "false"}"
      >
        <span>
          <strong>${escapeHtml(option.label)}</strong>
          ${option.recommended ? "<em>Best fit</em>" : ""}
        </span>
        <p>${escapeHtml(option.text)}</p>
        <small>${escapeHtml(option.why)}</small>
      </button>`,
    )
    .join("");
  elements.contextDraft.value = contextual.draft;
  elements.contextExplanation.textContent = contextual.explanation;
  elements.contextBasisList.innerHTML = contextual.basis.length
    ? contextual.basis
        .map(
          (item) => `<li>
            ${escapeHtml(item.text)}
            <span>${escapeHtml(item.source)} · ${escapeHtml(item.kind)}</span>
          </li>`,
        )
        .join("")
    : `<li>No relationship or situation context was used.</li>`;
  renderPerspectiveSimulation(
    (contextual.responseOptions || []).find((option) => option.recommended) ||
      contextual.responseOptions?.[0],
  );
}

function renderPerspectiveSimulation(option) {
  if (!option || !elements.perspectiveSimulation) {
    if (elements.perspectiveSimulation) elements.perspectiveSimulation.hidden = true;
    return;
  }

  const sender = relationshipPeople().find(
    (person) => person.id === state.caseData?.incoming?.senderPersonId,
  );
  const senderName = sender?.displayName || "the other person";
  const readings = {
    "ask-directly": {
      literal:
        "The user is willing to respond to the request, but wants a concrete explanation before drawing a conclusion.",
      emotional: `${senderName} may feel invited to explain, scrutinised, or challenged. The available evidence cannot establish which reaction applies.`,
      risk:
        "Referring to something “unresolved” could sound as though the user has already formed a theory about the people involved.",
    },
    "avoid-triangle": {
      literal:
        "The user is setting a boundary: they will listen, but will not manage a conflict or relationship on someone else’s behalf.",
      emotional: `${senderName} may experience the boundary as fair, distancing, or insufficiently supportive. Those are alternatives, not detected feelings.`,
      risk:
        "A request to speak directly could be heard as withdrawal even when the intended meaning is healthy role clarity.",
    },
    "preserve-agency": {
      literal:
        "The user will make the decision independently while remaining open to specific information that could matter.",
      emotional: `${senderName} may hear confidence and openness, or may experience the response as resistance. The wording alone cannot decide between them.`,
      risk:
        "Emphasising personal control could sound dismissive if the sender believes they are raising a serious concern.",
    },
    "comply-once": {
      literal:
        "The user agrees to the request for this occasion without agreeing to an unstated reason or permanent rule.",
      emotional: `${senderName} may feel heard or relieved, but the short reply may also leave the underlying issue untouched.`,
      risk:
        "Brief compliance could be mistaken for agreement with the sender’s unstated interpretation or expectations.",
    },
    pause: {
      literal:
        "The user acknowledges the message and postpones a decision until they have had time to think.",
      emotional: `${senderName} may read the pause as care, uncertainty, or distance. More context would be needed to distinguish them.`,
      risk:
        "A pause can reduce impulsivity, but without a time frame it may be mistaken for avoidance.",
    },
  };
  const reading = readings[option.id] || {
    literal: `The response communicates: “${truncateText(option.text, 180)}”`,
    emotional:
      "The same wording could feel supportive, neutral, or distancing depending on expectations that are not represented in the current evidence.",
    risk:
      "Tone and relationship history may change how the message lands. The simulation cannot observe the recipient’s internal state.",
  };
  const selectedSituations = state.caseData?.selectedSituationIds?.length || 0;
  const contextualItems = state.result?.contextual?.basis?.length || 0;

  elements.perspectiveSimulation.hidden = false;
  elements.perspectiveTitle.textContent = `How might ${senderName} read this?`;
  elements.perspectiveLiteral.textContent = reading.literal;
  elements.perspectiveEmotional.textContent = reading.emotional;
  elements.perspectiveRisk.textContent = reading.risk;
  elements.perspectiveConfidence.textContent =
    "Literal reading · moderate confidence; emotional reading · low confidence";
  elements.perspectiveEvidence.innerHTML = [
    `Selected response direction: ${option.label}`,
    `${selectedSituations} selected timeline ${selectedSituations === 1 ? "event" : "events"}`,
    `${contextualItems} context ${contextualItems === 1 ? "item" : "items"} linked to the generated response`,
  ]
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderMerlinInsight(insight) {
  if (!insight) {
    elements.merlinInsight.hidden = true;
    return;
  }

  elements.merlinInsight.hidden = false;
  elements.merlinEyebrow.textContent = insight.eyebrow;
  elements.merlinInsightTitle.textContent = insight.title;
  elements.merlinInsightSummary.textContent = insight.summary;
  elements.merlinConfidence.textContent = insight.confidenceLabel;
  elements.merlinHypotheses.innerHTML = insight.hypotheses
    .map((hypothesis) => {
      const percent = Math.round(hypothesis.probability * 100);
      const color = merlinSeriesColor(hypothesis.colorIndex);
      return `<div class="merlin-hypothesis" style="--hypothesis-color: ${color}">
        <div>
          <strong>${escapeHtml(hypothesis.label)}</strong>
          <span>${percent}%</span>
        </div>
        <div class="hypothesis-track" aria-label="${escapeHtml(hypothesis.label)}: ${percent}%">
          <i style="width: ${percent}%"></i>
        </div>
        <p>${escapeHtml(hypothesis.description)}</p>
      </div>`;
    })
    .join("");
  elements.merlinProbabilityChart.innerHTML = renderProbabilityChart(
    insight.trend,
    insight.hypotheses,
  );
  elements.merlinEvidenceList.innerHTML = insight.evidence.length
    ? insight.evidence
        .map(
          (item, index) => `<div class="merlin-evidence-row">
            <span class="evidence-index">${String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.observation)}</p>
              <small>${escapeHtml(item.caveat)}</small>
            </div>
            <div class="evidence-effect">
              <b>${escapeHtml(item.effect)} · ${escapeHtml(item.adjustmentLabel)}</b>
              <div>
                ${item.likelihoodMultipliers
                  .map(
                    (multiplier) => {
                      const color = merlinSeriesColor(multiplier.colorIndex);
                      return `<span style="--factor-color: ${color}">${escapeHtml(multiplier.shortLabel)} ×${Number(multiplier.value).toFixed(2)}</span>`;
                    },
                  )
                  .join("")}
              </div>
              <label class="evidence-weight-control">
                <span>How much should this count?</span>
                <select data-evidence-adjustment="${escapeHtml(item.situationId)}">
                  <option value="full" ${item.adjustment === "full" ? "selected" : ""}>Use as recorded</option>
                  <option value="downweight" ${item.adjustment === "downweight" ? "selected" : ""}>Downweight</option>
                  <option value="exclude" ${item.adjustment === "exclude" ? "selected" : ""}>Exclude from calculation</option>
                </select>
              </label>
            </div>
          </div>`,
        )
        .join("")
    : `<div class="merlin-empty-evidence">No probability-changing events are selected. Merlin is showing the starting priors only.</div>`;
  elements.merlinNextQuestion.textContent = insight.nextBestQuestion;
  elements.merlinExcludedEvidence.innerHTML = insight.excludedEvidence.length
    ? insight.excludedEvidence
        .map(
          (item) => `<p><b>${escapeHtml(item.label)}:</b> ${escapeHtml(item.reason)}</p>`,
        )
        .join("")
    : "<p>None of the selected events were excluded.</p>";
  elements.merlinCalibration.textContent = insight.calibration;
}

function renderProbabilityChart(trend, hypotheses) {
  const width = 440;
  const height = 208;
  const left = 34;
  const right = 418;
  const top = 18;
  const bottom = 148;
  const series = [...hypotheses].sort(
    (leftHypothesis, rightHypothesis) =>
      leftHypothesis.colorIndex - rightHypothesis.colorIndex,
  );
  const pointsFor = (id) =>
    trend.map((point, index) => {
      const ratio = trend.length <= 1 ? 0.5 : index / (trend.length - 1);
      return {
        x: left + (right - left) * ratio,
        y: bottom - (bottom - top) * Number(point.probabilities[id] || 0),
      };
    });
  const grid = [0, 0.5, 1]
    .map((value) => {
      const y = bottom - (bottom - top) * value;
      return `<g class="probability-grid">
        <line x1="${left}" y1="${y}" x2="${right}" y2="${y}"></line>
        <text x="4" y="${y + 4}">${Math.round(value * 100)}%</text>
      </g>`;
    })
    .join("");
  const lines = series
    .map((hypothesis) => {
      const points = pointsFor(hypothesis.id);
      const path = points
        .map((point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
        )
        .join(" ");
      const color = merlinSeriesColor(hypothesis.colorIndex);
      return `<g class="probability-series" style="--series-color: ${color}">
        <path d="${path}"></path>
        ${points
          .map(
            (point) =>
              `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"></circle>`,
          )
          .join("")}
      </g>`;
    })
    .join("");
  const labels = trend
    .map((point, index) => {
      const ratio = trend.length <= 1 ? 0.5 : index / (trend.length - 1);
      const x = left + (right - left) * ratio;
      return `<text class="probability-event-label" x="${x.toFixed(1)}" y="174">
        ${escapeHtml(truncateText(point.chartLabel || point.label, 12))}
      </text>`;
    })
    .join("");
  return `<svg
    class="probability-chart"
    viewBox="0 0 ${width} ${height}"
    role="img"
    aria-label="Illustrative probability update across the selected events"
  >
    ${grid}
    ${lines}
    ${labels}
  </svg>
  <div class="probability-legend">
    ${series
      .map(
        (hypothesis) =>
          `<span style="--series-color: ${merlinSeriesColor(hypothesis.colorIndex)}">${escapeHtml(hypothesis.shortLabel)}</span>`,
      )
      .join("")}
  </div>`;
}

function merlinSeriesColor(index = 0) {
  return ["#728e78", "#b17c68", "#84919c", "#9b7ca5", "#b58b47"][
    Number(index) % 5
  ];
}

function adjustMerlinEvidence(event) {
  const select = event.target.closest("select[data-evidence-adjustment]");
  if (!select || !state.caseData) return;
  const situationId = select.dataset.evidenceAdjustment;
  if (select.value === "full") {
    delete state.caseData.patternEvidenceAdjustments[situationId];
  } else {
    state.caseData.patternEvidenceAdjustments[situationId] = select.value;
  }
  state.reviewConfirmed = false;
  persistWorkspace();
  updateReviewState();
  scheduleContextUpdate(
    select.value === "exclude"
      ? "Merlin removed that event from the probability calculation."
      : select.value === "downweight"
        ? "Merlin reduced that event’s influence."
        : "Merlin restored the event’s full illustrative weight.",
  );
}

function renderEmptyReasoning() {
  const empty =
    `<div class="simple-review-item"><p>Add a person, a message, and any relevant situations to begin.</p></div>`;
  elements.factList.innerHTML = empty;
  elements.interpretationList.innerHTML = empty;
  elements.alternativeList.innerHTML = empty;
  elements.uncertaintyList.innerHTML = empty;
  elements.genericConfidence.textContent = "Awaiting a thought";
  elements.genericInterpretation.textContent =
    "An isolated reading will appear here.";
  elements.genericDraft.textContent = "No response generated.";
  elements.contextConfidence.textContent = "Awaiting context";
  elements.contextInterpretation.textContent =
    "The context-aware reading will remain empty until you ask for it.";
  elements.responseOptions.innerHTML =
    `<div class="empty-response-options">Personalised response directions will appear here.</div>`;
  elements.perspectiveSimulation.hidden = true;
  elements.contextDraft.value = "";
  elements.contextExplanation.textContent =
    "Second Mind will list exactly which relationship and situation items changed the result.";
  elements.contextBasisList.innerHTML = `<li>No context used yet.</li>`;
  elements.merlinInsight.hidden = true;
}

function chooseResponseOption(event) {
  const button = event.target.closest("button[data-response-option]");
  if (!button || !state.result) return;
  const option = state.result.contextual.responseOptions?.find(
    (item) => item.id === button.dataset.responseOption,
  );
  if (!option) return;
  elements.contextDraft.value = option.text;
  elements.responseOptions
    .querySelectorAll("button[data-response-option]")
    .forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  renderPerspectiveSimulation(option);
  showToast(`${option.label} selected. The response is still yours to edit.`);
}

function renderInterpretation(claim) {
  const review = state.reviews[claim.id] || "unreviewed";
  return `<div class="claim-row" data-claim-id="${escapeHtml(claim.id)}" data-review="${escapeHtml(review)}">
    <p>${escapeHtml(claim.text)}</p>
    <small>${escapeHtml(claim.source)} · ${escapeHtml(claim.confidence)} confidence</small>
    <div class="claim-review-control">
      <label for="review-${escapeHtml(claim.id)}">Your review</label>
      <select id="review-${escapeHtml(claim.id)}" data-review-claim="${escapeHtml(claim.id)}">
        <option value="unreviewed" ${review === "unreviewed" ? "selected" : ""}>Unreviewed AI inference</option>
        <option value="confirmed" ${review === "confirmed" ? "selected" : ""}>Useful interpretation</option>
        <option value="needs_context" ${review === "needs_context" ? "selected" : ""}>Needs more context</option>
        <option value="rejected" ${review === "rejected" ? "selected" : ""}>Reject this interpretation</option>
      </select>
    </div>
  </div>`;
}

function reviewInterpretation(event) {
  const select = event.target.closest("select[data-review-claim]");
  if (!select) return;
  state.reviews[select.dataset.reviewClaim] = select.value;
  state.reviewConfirmed = false;
  select.closest(".claim-row").dataset.review = select.value;
  updateReviewState();
}

function confirmReview() {
  const reviewed = Object.values(state.reviews).filter(
    (value) => value !== "unreviewed",
  ).length;
  if (!reviewed) {
    showToast("Review at least one AI interpretation before confirming.");
    return;
  }
  state.reviewConfirmed = true;
  updateReviewState();
  showToast(
    `${reviewed} interpretation ${reviewed === 1 ? "review" : "reviews"} confirmed for this session only.`,
  );
}

function updateReviewState() {
  if (state.reviewConfirmed) {
    elements.reviewState.textContent = "Review confirmed · session only";
    return;
  }
  const reviewed = Object.values(state.reviews).filter(
    (value) => value !== "unreviewed",
  ).length;
  elements.reviewState.textContent = reviewed
    ? `${reviewed} reviewed · not confirmed`
    : "Not saved";
}

async function copyDraft() {
  try {
    await navigator.clipboard.writeText(elements.contextDraft.value);
    elements.copyDraft.textContent = "Copied";
    setTimeout(() => {
      elements.copyDraft.textContent = "Copy response";
    }, 1400);
  } catch {
    elements.copyDraft.textContent = "Select and copy";
  }
}

function persistWorkspace() {
  if (state.workspaceKind !== "personal" || !state.caseData) return;
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        PERSONAL_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          caseData: state.caseData,
        }),
      );
      elements.sessionLabel.textContent = "Saved on this device · zero cost";
      updateWelcomeAction();
    } catch {
      elements.sessionLabel.textContent = "Local save unavailable · zero cost";
    }
  }, 120);
}

function readSavedWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(PERSONAL_STORAGE_KEY));
    if (
      saved?.version !== 1 ||
      !Array.isArray(saved.caseData?.people) ||
      !Array.isArray(saved.caseData?.situations) ||
      !Array.isArray(saved.caseData?.claims)
    ) {
      return null;
    }
    return saved.caseData;
  } catch {
    return null;
  }
}

async function deleteLocalWorkspace() {
  if (!state.deleteArmed) {
    state.deleteArmed = true;
    elements.deleteLocalData.textContent = "Confirm permanent deletion";
    showToast("Click the delete button again to remove the local relationship map.");
    setTimeout(() => {
      state.deleteArmed = false;
      elements.deleteLocalData.textContent = "Delete all local relationship data";
    }, 6000);
    return;
  }
  try {
    localStorage.removeItem(PERSONAL_STORAGE_KEY);
    await clearEvidenceDatabase();
  } catch {
    showToast("The browser could not remove all local relationship data.");
    return;
  }
  state.deleteArmed = false;
  elements.deleteLocalData.textContent = "Delete all local relationship data";
  elements.privacyDialog.close();
  updateWelcomeAction();
  if (state.workspaceKind === "personal") showWelcome();
  showToast("All locally saved relationship data was deleted.");
}

function setLoading(loading) {
  elements.loading.hidden = !loading;
  elements.analyse.disabled =
    loading || Boolean(state.caseData && relationshipPeople().length === 0);
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  state.toastTimer = setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2600);
}

function formatDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCalendarDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function firstName(displayName) {
  return String(displayName || "").trim().split(/\s+/)[0] || "Person";
}

function initials(displayName) {
  return String(displayName || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "—";
}

function truncateText(value, maximum) {
  const text = String(value || "").trim();
  if (text.length <= maximum) return text;
  return `${text.slice(0, Math.max(1, maximum - 1)).trim()}…`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
