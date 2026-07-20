import test from "node:test";
import assert from "node:assert/strict";
import { captureSummary, parseCaptureText } from "../public/capture.js";

const DATELESS_SCREENSHOT_TEXT = `Fran
08:42
Fran: I’ve arranged the technician for tomorrow at 10. Please confirm.
08:46
You: Thanks. The tap is still loose too. Is that included?
08:51
Fran: I’ll ask them to look at it while they’re there.`;

test("capture parsing leaves unsupported dates unknown", () => {
  const parsed = parseCaptureText(DATELESS_SCREENSHOT_TEXT);

  assert.equal(parsed.sourceDate, null);
  assert.equal(parsed.datePrecision, "unknown");
  assert.equal(parsed.dateSource, "not_visible");
  assert.deepEqual(parsed.visibleTimes, ["08:42", "08:46", "08:51"]);
  assert.ok(parsed.relativeDateExpressions.includes("tomorrow"));
  assert.ok(parsed.questions.some((question) => question.id === "date"));
});

test("capture parsing extracts people, messages, commitments, requests, and issues", () => {
  const parsed = parseCaptureText(DATELESS_SCREENSHOT_TEXT);

  assert.equal(parsed.primaryPersonName, "Fran");
  assert.equal(parsed.messages.length, 3);
  assert.deepEqual(
    parsed.messages.map((message) => message.speaker),
    ["Fran", "You", "Fran"],
  );
  assert.ok(
    parsed.findings.some(
      (finding) =>
        finding.kind === "commitment" && finding.status === "scheduled",
    ),
  );
  assert.ok(parsed.findings.some((finding) => finding.kind === "request"));
  assert.ok(
    parsed.findings.some(
      (finding) =>
        finding.kind === "issue" && /tap/i.test(finding.label),
    ),
  );
});

test("capture parsing recovers inline OCR speaker and time boundaries", () => {
  const parsed = parseCaptureText(
    "Fran 08:42 Fran I’ve arranged the technician for tomorrow at 10. Please confirm. 08:46 You Thanks. The tap is still loose too. 08:51 Fran I’ll ask them to look at it.",
  );

  assert.equal(parsed.messages.length, 3);
  assert.deepEqual(
    parsed.messages.map((message) => message.speaker),
    ["Fran", "You", "Fran"],
  );
  assert.deepEqual(parsed.visibleTimes, ["08:42", "08:46", "08:51"]);
});

test("tone is labelled as interpretation rather than direct evidence", () => {
  const parsed = parseCaptureText(DATELESS_SCREENSHOT_TEXT);

  assert.equal(parsed.tone.label, "Practical and courteous");
  assert.equal(parsed.tone.confidence, "moderate");
  assert.match(parsed.tone.interpretation, /appears/i);
});

test("an explicit visible calendar date is parsed with provenance", () => {
  const parsed = parseCaptureText(
    `Fran\n18 July 2026\nFran: I will send the report tomorrow.`,
  );

  assert.equal(parsed.sourceDate, "2026-07-18T12:00:00.000Z");
  assert.equal(parsed.datePrecision, "exact");
  assert.equal(parsed.dateSource, "visible_in_source");
  assert.equal(
    parsed.questions.some((question) => question.id === "date"),
    false,
  );
});

test("capture summary communicates the structured result", () => {
  const summary = captureSummary(parseCaptureText(DATELESS_SCREENSHOT_TEXT));

  assert.match(summary, /Fran/i);
  assert.match(summary, /3 messages/i);
  assert.match(summary, /commitment/i);
  assert.match(summary, /unresolved issue/i);
});
