const DATE_PATTERNS = [
  {
    pattern:
      /\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/,
    parse(match) {
      return toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
    },
  },
  {
    pattern:
      /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/,
    parse(match) {
      return toIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    },
  },
  {
    pattern:
      /\b(0?[1-9]|[12]\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
    parse(match) {
      const month = MONTHS.indexOf(match[2].toLowerCase()) + 1;
      return toIsoDate(Number(match[3]), month, Number(match[1]));
    },
  },
];

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const APP_LABELS = new Set([
  "messages",
  "message",
  "whatsapp",
  "signal",
  "telegram",
  "today",
  "yesterday",
  "online",
  "typing",
  "you",
]);

const COMMITMENT_PATTERN =
  /\b(?:i(?:'|’)ve arranged|i have arranged|i(?:'|’)ll|i will|we(?:'|’)ll|we will|booked|scheduled|confirmed|promised|send|share|provide|bring|repair|replace|look at|check)\b/i;
const CANCELLATION_PATTERN =
  /\b(?:cancelled|canceled|can(?:'|’)t make it|cannot make it|won(?:'|’)t be able|need to reschedule|called off)\b/i;
const REQUEST_PATTERN =
  /\b(?:please confirm|can you confirm|let me know|could you|would you|please send|please share)\b/i;
const ISSUE_TERMS = [
  "tap",
  "dishwasher",
  "repair",
  "leak",
  "technician",
  "appointment",
  "boiler",
  "heating",
  "electricity",
  "window",
  "door",
  "payment",
  "deposit",
  "invoice",
];

export function parseCaptureText(rawText) {
  const text = normalizeOcrText(rawText);
  const lines = text.split("\n").filter(Boolean);
  const messages = extractMessages(lines);
  const participantNames = extractParticipantNames(lines, messages);
  const visibleDate = extractExplicitDate(text);
  const visibleTimes = [
    ...new Set(
      [...text.matchAll(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g)].map(
        (match) => match[0],
      ),
    ),
  ];
  const findings = extractFindings(messages, text);
  const tone = inferTone(messages);
  const primaryPersonName =
    participantNames.find((name) => name.toLowerCase() !== "you") || "";

  return {
    normalizedText: text,
    primaryPersonName,
    participantNames,
    messages,
    findings,
    sourceDate: visibleDate,
    datePrecision: visibleDate ? "exact" : "unknown",
    dateSource: visibleDate ? "visible_in_source" : "not_visible",
    visibleTimes,
    relativeDateExpressions: [
      ...new Set(
        [...text.matchAll(/\b(?:today|tomorrow|yesterday|next\s+\w+)\b/gi)].map(
          (match) => match[0],
        ),
      ),
    ],
    tone,
    questions: buildQuestions({
      primaryPersonName,
      visibleDate,
      findings,
      text,
    }),
  };
}

export function captureSummary(parsed) {
  const parts = [];
  if (parsed.primaryPersonName) {
    parts.push(`a conversation involving ${parsed.primaryPersonName}`);
  } else {
    parts.push("a conversation whose contact still needs a name");
  }
  if (parsed.messages.length) {
    parts.push(
      `${parsed.messages.length} message${parsed.messages.length === 1 ? "" : "s"}`,
    );
  }
  const commitments = parsed.findings.filter(
    (finding) => finding.kind === "commitment",
  ).length;
  const issues = parsed.findings.filter(
    (finding) => finding.kind === "issue",
  ).length;
  if (commitments) {
    parts.push(
      `${commitments} commitment${commitments === 1 ? "" : "s"} or promised action${commitments === 1 ? "" : "s"}`,
    );
  }
  if (issues) {
    parts.push(`${issues} unresolved issue${issues === 1 ? "" : "s"}`);
  }
  return sentenceList(parts);
}

function normalizeOcrText(rawText) {
  return String(rawText || "")
    .replaceAll("\r", "\n")
    .replace(/[ \t]+/g, " ")
    .replace(
      /\b((?:[01]?\d|2[0-3]):[0-5]\d)\s+([\p{Lu}][\p{L}'’.-]*|You)\s+/gu,
      "\n$1\n$2: ",
    )
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractMessages(lines) {
  const messages = [];
  let currentSpeaker = "";
  let currentParts = [];
  let currentTime = "";

  const flush = () => {
    const text = currentParts.join(" ").trim();
    if (!text) return;
    messages.push({
      id: `message-${messages.length + 1}`,
      speaker: currentSpeaker || "Unknown speaker",
      text,
      visibleTime: currentTime || null,
      confidence: currentSpeaker ? "high" : "moderate",
    });
    currentParts = [];
    currentTime = "";
  };

  for (const line of lines) {
    const labelled = line.match(
      /^([\p{Lu}][\p{L}'’.-]*(?:\s+[\p{Lu}][\p{L}'’.-]*){0,2}|You)\s*[:—-]\s*(.+)$/u,
    );
    if (labelled) {
      flush();
      currentSpeaker = labelled[1];
      currentParts.push(labelled[2]);
      continue;
    }

    const timeOnly = line.match(/^(?:[01]?\d|2[0-3]):[0-5]\d$/);
    if (timeOnly) {
      currentTime = timeOnly[0];
      continue;
    }

    if (looksLikePersonName(line) && currentParts.length) {
      flush();
      currentSpeaker = line;
      continue;
    }

    if (
      looksLikePersonName(line) &&
      !currentSpeaker &&
      !APP_LABELS.has(line.toLowerCase())
    ) {
      currentSpeaker = line;
      continue;
    }

    if (!isInterfaceNoise(line)) currentParts.push(line);
  }
  flush();

  if (!messages.length && lines.length) {
    messages.push({
      id: "message-1",
      speaker: "Unknown speaker",
      text: lines.filter((line) => !isInterfaceNoise(line)).join(" "),
      visibleTime: null,
      confidence: "low",
    });
  }
  return messages;
}

function extractParticipantNames(lines, messages) {
  const names = [];
  for (const message of messages) {
    if (
      message.speaker !== "Unknown speaker" &&
      !APP_LABELS.has(message.speaker.toLowerCase())
    ) {
      names.push(message.speaker);
    }
  }
  for (const line of lines.slice(0, 5)) {
    if (looksLikePersonName(line) && !APP_LABELS.has(line.toLowerCase())) {
      names.push(line);
    }
  }
  if (messages.some((message) => message.speaker.toLowerCase() === "you")) {
    names.push("You");
  }
  return [...new Set(names)];
}

function extractExplicitDate(text) {
  for (const { pattern, parse } of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const parsed = parse(match);
    if (parsed) return parsed;
  }
  return null;
}

function extractFindings(messages, fullText) {
  const findings = [];
  for (const message of messages) {
    if (CANCELLATION_PATTERN.test(message.text)) {
      findings.push({
        id: `finding-${findings.length + 1}`,
        kind: "commitment",
        label: "Cancellation or rescheduling",
        text: message.text,
        speaker: message.speaker,
        status: "cancelled",
        confidence: "high",
        evidence: quoteEvidence(message.text),
        selected: true,
      });
      continue;
    }
    if (COMMITMENT_PATTERN.test(message.text)) {
      const scheduled =
        /\b(?:arranged|booked|scheduled|appointment|technician)\b/i.test(
          message.text,
        );
      findings.push({
        id: `finding-${findings.length + 1}`,
        kind: "commitment",
        label: scheduled ? "Scheduled action" : "Promised action",
        text: message.text,
        speaker: message.speaker,
        status: scheduled ? "scheduled" : "promised",
        confidence: "moderate",
        evidence: quoteEvidence(message.text),
        selected: true,
      });
    }
    if (REQUEST_PATTERN.test(message.text)) {
      findings.push({
        id: `finding-${findings.length + 1}`,
        kind: "request",
        label: "Explicit request",
        text: message.text,
        speaker: message.speaker,
        confidence: "high",
        evidence: quoteEvidence(message.text),
        selected: true,
      });
    }
  }

  const lower = fullText.toLowerCase();
  for (const term of ISSUE_TERMS) {
    if (!lower.includes(term)) continue;
    const relatedMessage = messages.find((message) =>
      message.text.toLowerCase().includes(term),
    );
    if (!relatedMessage) continue;
    const unresolved =
      /\b(?:still|not fixed|outstanding|loose|leaking|broken|waiting|included)\b/i.test(
        relatedMessage.text,
      );
    if (!unresolved) continue;
    findings.push({
      id: `finding-${findings.length + 1}`,
      kind: "issue",
      label: titleCase(`${term} issue`),
      text: relatedMessage.text,
      speaker: relatedMessage.speaker,
      status: "open",
      confidence: "moderate",
      evidence: quoteEvidence(relatedMessage.text),
      selected: true,
    });
    break;
  }

  return deduplicateFindings(findings);
}

function inferTone(messages) {
  const text = messages.map((message) => message.text).join(" ");
  if (!text) {
    return {
      label: "Tone not assessed",
      interpretation: "There is not enough readable text to assess tone.",
      confidence: "low",
    };
  }
  if (
    /\b(?:please|thanks|thank you|appreciate|sorry)\b/i.test(text) &&
    /\b(?:confirm|arranged|scheduled|send|repair|appointment)\b/i.test(text)
  ) {
    return {
      label: "Practical and courteous",
      interpretation:
        "The wording appears task-focused and includes courteous language.",
      confidence: "moderate",
    };
  }
  if (/\b(?:confirm|send|need|must|today|tomorrow)\b/i.test(text)) {
    return {
      label: "Practical and direct",
      interpretation:
        "The wording appears task-focused and relatively direct.",
      confidence: "low",
    };
  }
  return {
    label: "No strong tone signal",
    interpretation:
      "The screenshot does not provide enough evidence for a stronger tone interpretation.",
    confidence: "low",
  };
}

function buildQuestions({ primaryPersonName, visibleDate, findings, text }) {
  const questions = [];
  if (!primaryPersonName) {
    questions.push({
      id: "person-name",
      field: "person",
      text: "Who is this conversation with?",
      consequence: "A person is required before the record can be filed.",
    });
  }
  if (
    primaryPersonName &&
    /\b(?:repair|technician|tap|dishwasher|boiler|property)\b/i.test(text)
  ) {
    questions.push({
      id: "relationship",
      field: "relationship",
      text: `Is ${primaryPersonName} your landlord or property manager?`,
      consequence:
        "This changes where the practical record belongs, but not what the message says.",
    });
  }
  if (
    findings.some(
      (finding) =>
        finding.kind === "commitment" &&
        ["scheduled", "promised"].includes(finding.status),
    )
  ) {
    questions.push({
      id: "outcome",
      field: "outcome",
      text:
        "The screenshot supports a promise or schedule, but not that the action was completed.",
      consequence:
        "Second Mind will leave the outcome open until later evidence or your confirmation.",
    });
  }
  if (!visibleDate) {
    questions.push({
      id: "date",
      field: "date",
      text: "No explicit calendar date is visible.",
      consequence:
        "The event date will remain unknown unless you choose to add it.",
    });
  }
  return questions;
}

function deduplicateFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.kind}:${finding.status || ""}:${finding.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikePersonName(value) {
  const text = String(value || "").trim();
  if (text.length < 2 || text.length > 60 || /\d/.test(text)) return false;
  const words = text.split(/\s+/);
  if (words.length > 3) return false;
  return words.every((word) => /^[\p{Lu}][\p{L}'’.-]*$/u.test(word));
}

function isInterfaceNoise(line) {
  const text = line.trim().toLowerCase();
  if (!text) return true;
  if (APP_LABELS.has(text)) return true;
  if (/^(?:delivered|read|sent|type a message|message)$/i.test(text)) {
    return true;
  }
  return false;
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString();
}

function quoteEvidence(text) {
  const trimmed = String(text || "").trim();
  return trimmed.length > 140 ? `${trimmed.slice(0, 139).trim()}…` : trimmed;
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function sentenceList(parts) {
  if (!parts.length) return "No structured details yet.";
  if (parts.length === 1) return `I found ${parts[0]}.`;
  if (parts.length === 2) return `I found ${parts[0]} and ${parts[1]}.`;
  return `I found ${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}.`;
}
