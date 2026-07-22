import { createHash, randomUUID } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildInstructions,
  demoResponse,
  extractResponseText,
  MODES,
  REASONING_SCHEMA,
} from "./lib/reasoning.mjs";
import {
  buildContextResult,
  createBlankCase,
  createCommitmentDemoCase,
  createDemoCase,
  createPatternDemoCase,
} from "./lib/context.mjs";
import {
  analyzeCommunicationDraft,
  createCommunicationCoachSample,
} from "./lib/communication-studio.mjs";
import {
  buildImportProposal,
  createDemoArchive,
} from "./lib/import-archive.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(ROOT, "public");
const TESSERACT_DIST_DIR = join(ROOT, "node_modules", "tesseract.js", "dist");
const TESSERACT_CORE_DIR =
  [
    join(ROOT, "node_modules", "tesseract.js-core"),
    join(
      ROOT,
      "node_modules",
      ".pnpm",
      "node_modules",
      "tesseract.js-core",
    ),
  ].find((path) => existsSync(path)) ||
  join(ROOT, "node_modules", "tesseract.js-core");
const TESSERACT_LANG_DIR = join(
  ROOT,
  "node_modules",
  "@tesseract.js-data",
  "eng",
  "4.0.0_best_int",
);
loadEnv(join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-terra";
const TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
const DEMO_MODE = process.env.DEMO_MODE !== "false";
const PAID_API_ENABLED = process.env.PAID_API_ENABLED === "true";
const LIVE_API_AVAILABLE = Boolean(OPENAI_API_KEY && PAID_API_ENABLED);
const MAX_JSON_BYTES = 64 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_BYTES = 16 * 1024 * 1024;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
};

const server = createServer(async (request, response) => {
  const requestId = randomUUID();

  try {
    setSecurityHeaders(response);

    if (request.method === "GET" && request.url === "/api/health") {
      return json(response, 200, {
        ok: true,
        mode: LIVE_API_AVAILABLE ? "live" : "demo",
        model: LIVE_API_AVAILABLE ? OPENAI_MODEL : "demo-reasoning",
        transcription: LIVE_API_AVAILABLE,
        paid_api_enabled: PAID_API_ENABLED,
      });
    }

    if (request.method === "GET" && request.url === "/api/demo-case") {
      return json(response, 200, {
        case: createDemoCase(),
        meta: {
          fictional: true,
          ephemeral: true,
          paid_api_enabled: false,
        },
      });
    }

    if (request.method === "GET" && request.url === "/api/pattern-demo-case") {
      return json(response, 200, {
        case: createPatternDemoCase(),
        meta: {
          fictional: true,
          ephemeral: true,
          paid_api_enabled: false,
          transparent_probability_demo: true,
        },
      });
    }

    if (request.method === "GET" && request.url === "/api/commitment-demo-case") {
      return json(response, 200, {
        case: createCommitmentDemoCase(),
        meta: {
          fictional: true,
          ephemeral: true,
          paid_api_enabled: false,
          commitment_tracking_demo: true,
        },
      });
    }

    if (request.method === "GET" && request.url === "/api/blank-case") {
      return json(response, 200, {
        case: createBlankCase(),
        meta: {
          personal: true,
          local_first: true,
          paid_api_enabled: false,
        },
      });
    }

    if (
      request.method === "GET" &&
      request.url === "/api/communication-studio-sample"
    ) {
      return json(response, 200, {
        sample: createCommunicationCoachSample(),
        meta: {
          fictional: true,
          ephemeral: true,
          paid_api_enabled: false,
        },
      });
    }

    if (request.method === "GET" && request.url === "/api/import-demo-archive") {
      return json(response, 200, {
        archive: createDemoArchive(),
        meta: {
          fictional: true,
          ephemeral: true,
          paid_api_enabled: false,
        },
      });
    }

    if (request.method === "POST" && request.url === "/api/import/archive") {
      return await handleImportArchive(request, response);
    }

    if (request.method === "POST" && request.url === "/api/context-reason") {
      return await handleContextReason(request, response);
    }

    if (
      request.method === "POST" &&
      request.url === "/api/communication-studio"
    ) {
      return await handleCommunicationCoach(request, response);
    }

    if (request.method === "POST" && request.url === "/api/reason") {
      return await handleReason(request, response, requestId);
    }

    if (request.method === "POST" && request.url === "/api/transcribe") {
      return await handleTranscribe(request, response);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      return serveStatic(request, response);
    }

    return json(response, 404, { error: "Not found." });
  } catch (error) {
    console.error(`[${requestId}]`, error?.message || error);
    return json(response, error?.statusCode || 500, {
      error: "Second Mind could not complete that request.",
      request_id: requestId,
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const apiStatus = LIVE_API_AVAILABLE
    ? `live API · ${OPENAI_MODEL}`
    : "zero-cost demo mode · paid API calls disabled";
  console.log(`Second Mind running at http://localhost:${PORT}`);
  console.log(apiStatus);
});

async function handleReason(request, response, requestId) {
  const body = await readJson(request, MAX_JSON_BYTES);
  const mode = typeof body.mode === "string" ? body.mode : "think";
  const input = typeof body.input === "string" ? body.input.trim() : "";
  const sessionId =
    typeof body.session_id === "string" ? body.session_id.slice(0, 128) : requestId;

  if (!Object.hasOwn(MODES, mode)) {
    return json(response, 400, { error: "Unknown reasoning mode." });
  }

  if (input.length < 8) {
    return json(response, 400, {
      error: "Add a little more context so the reasoning map has evidence to use.",
    });
  }

  if (input.length > 8_000) {
    return json(response, 413, {
      error: "Keep this prototype input under 8,000 characters.",
    });
  }

  if (!LIVE_API_AVAILABLE) {
    if (!DEMO_MODE) {
      return json(response, 503, {
        error: "Live reasoning is not configured.",
      });
    }
    return json(response, 200, {
      result: demoResponse(mode, input),
      meta: {
        source: "demo",
        model: "demo-reasoning",
        ephemeral: true,
      },
    });
  }

  const safetyIdentifier = createHash("sha256")
    .update(`second-mind:${sessionId}`)
    .digest("hex");

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      store: false,
      safety_identifier: safetyIdentifier,
      reasoning: {
        effort: "low",
        context: "current_turn",
      },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "reasoning_card",
          strict: true,
          schema: REASONING_SCHEMA,
        },
      },
      instructions: buildInstructions(mode),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Mode: ${MODES[mode].label}\n\nUser account:\n${input}`,
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const payload = await apiResponse.json();
  if (!apiResponse.ok) {
    console.error(
      `[${requestId}] OpenAI error ${apiResponse.status}:`,
      payload?.error?.code || payload?.error?.type || "unknown",
    );
    if (DEMO_MODE) {
      return json(response, 200, {
        result: demoResponse(mode, input),
        meta: {
          source: "demo-fallback",
          model: "demo-reasoning",
          ephemeral: true,
        },
      });
    }
    return json(response, 502, {
      error: "The reasoning service is temporarily unavailable.",
      request_id: requestId,
    });
  }

  const extracted = extractResponseText(payload);
  if (extracted.refusal) {
    return json(response, 422, {
      error: extracted.refusal,
      refusal: true,
    });
  }

  let result;
  try {
    result = JSON.parse(extracted.text);
  } catch {
    throw new Error("The model returned an unreadable structured response.");
  }

  return json(response, 200, {
    result,
    meta: {
      source: "live",
      model: payload.model || OPENAI_MODEL,
      ephemeral: true,
      response_id: payload.id,
    },
  });
}

async function handleImportArchive(request, response) {
  const body = await readJson(request, MAX_IMPORT_BYTES);
  const archive = Array.isArray(body) ? body : body?.archive;
  if (!Array.isArray(archive)) {
    return json(response, 400, {
      error:
        "Send the parsed conversations from a ChatGPT or Claude export as JSON.",
    });
  }
  try {
    return json(response, 200, {
      proposal: buildImportProposal(archive),
      meta: {
        processed_locally: true,
        stored: false,
        paid_api_enabled: false,
      },
    });
  } catch (error) {
    if (error?.code === "unrecognised_archive") {
      return json(response, 422, { error: error.message });
    }
    throw error;
  }
}

async function handleContextReason(request, response) {
  const body = await readJson(request, MAX_JSON_BYTES * 2);
  const caseData =
    body.case_data && typeof body.case_data === "object"
      ? body.case_data
      : createDemoCase();
  const message =
    typeof body.message === "string" ? body.message.trim().slice(0, 4_000) : "";
  const senderId =
    typeof body.sender_id === "string"
      ? body.sender_id.slice(0, 128)
      : caseData.incoming?.senderPersonId;
  const selectedSituationIds = Array.isArray(body.selected_situation_ids)
    ? body.selected_situation_ids
        .filter((item) => typeof item === "string")
        .slice(0, 24)
    : [];
  const goal = typeof body.goal === "string" ? body.goal : "warm_boundary";
  const desiredTone =
    typeof body.desired_tone === "string" ? body.desired_tone : "warm";

  if (message.length < 2) {
    return json(response, 400, {
      error: "Add an incoming message before building the context comparison.",
    });
  }

  if (
    !Array.isArray(caseData.people) ||
    !Array.isArray(caseData.situations) ||
    !Array.isArray(caseData.claims)
  ) {
    return json(response, 400, { error: "The case context is incomplete." });
  }

  return json(response, 200, {
    result: buildContextResult({
      caseData,
      message,
      senderId,
      selectedSituationIds,
      goal,
      desiredTone,
    }),
  });
}

async function handleCommunicationCoach(request, response) {
  const body = await readJson(request, MAX_JSON_BYTES * 2);
  const caseData =
    body.case_data && typeof body.case_data === "object"
      ? body.case_data
      : createDemoCase();
  const receivedMessage =
    typeof body.received_message === "string"
      ? body.received_message.trim().slice(0, 4_000)
      : "";
  const draftReply =
    typeof body.draft_reply === "string"
      ? body.draft_reply.trim().slice(0, 4_000)
      : "";
  const senderId =
    typeof body.sender_id === "string"
      ? body.sender_id.slice(0, 128)
      : caseData.incoming?.senderPersonId;
  const selectedSituationIds = Array.isArray(body.selected_situation_ids)
    ? body.selected_situation_ids
        .filter((item) => typeof item === "string")
        .slice(0, 24)
    : [];
  const goal = typeof body.goal === "string" ? body.goal : "warm_boundary";
  const desiredTone =
    typeof body.desired_tone === "string" ? body.desired_tone : "warm";
  const allowedModes = new Set([
    "draft",
    "reply",
    "review",
    "rewrite",
    "predict",
    "compare",
  ]);
  const mode = allowedModes.has(body.mode) ? body.mode : "review";

  if (["draft", "reply", "review"].includes(mode) && receivedMessage.length < 2) {
    return json(response, 400, {
      error:
        mode === "draft"
          ? "Describe what you want to communicate."
          : "Add the received message before continuing.",
    });
  }
  if (["review", "rewrite", "predict", "compare"].includes(mode) && draftReply.length < 2) {
    return json(response, 400, {
      error: "Add your proposed reply before asking Merlin to coach it.",
    });
  }
  if (
    !Array.isArray(caseData.people) ||
    !Array.isArray(caseData.situations) ||
    !Array.isArray(caseData.claims)
  ) {
    return json(response, 400, { error: "The relationship context is incomplete." });
  }
  if (!caseData.people.some((person) => person.id === senderId)) {
    return json(response, 400, {
      error: "Select a relationship before coaching the reply.",
    });
  }

  return json(response, 200, {
    result: analyzeCommunicationDraft({
      caseData,
      senderId,
      receivedMessage,
      draftReply,
      selectedSituationIds,
      goal,
      desiredTone,
      mode,
    }),
  });
}

async function handleTranscribe(request, response) {
  if (!LIVE_API_AVAILABLE) {
    return json(response, 503, {
      error:
        "Voice transcription is unavailable in zero-cost mode. Text input still works in demo mode.",
    });
  }

  const contentType = request.headers["content-type"] || "audio/webm";
  if (!contentType.startsWith("audio/") && contentType !== "video/webm") {
    return json(response, 415, { error: "Send a supported audio recording." });
  }

  const bytes = await readBody(request, MAX_AUDIO_BYTES);
  if (bytes.length < 256) {
    return json(response, 400, { error: "The recording was too short." });
  }

  const extension = contentType.includes("mp4")
    ? "m4a"
    : contentType.includes("wav")
      ? "wav"
      : "webm";
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("response_format", "json");
  form.append(
    "file",
    new Blob([bytes], { type: contentType }),
    `second-mind-capture.${extension}`,
  );

  const apiResponse = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
      signal: AbortSignal.timeout(45_000),
    },
  );

  const payload = await apiResponse.json();
  if (!apiResponse.ok) {
    return json(response, 502, {
      error: "The recording could not be transcribed.",
    });
  }

  return json(response, 200, {
    text: payload.text || "",
    ephemeral: true,
  });
}

function serveStatic(request, response) {
  const parsed = new URL(request.url, `http://${request.headers.host || "local"}`);
  const vendorFile = resolveVendorFile(parsed.pathname);
  if (vendorFile) return streamStaticFile(request, response, vendorFile);
  const requestedPath = parsed.pathname === "/" ? "/index.html" : parsed.pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    return json(response, 404, { error: "Not found." });
  }

  return streamStaticFile(request, response, filePath);
}

function resolveVendorFile(pathname) {
  const routes = [
    {
      prefix: "/vendor/tesseract/core/",
      root: TESSERACT_CORE_DIR,
    },
    {
      prefix: "/vendor/tesseract/lang/",
      root: TESSERACT_LANG_DIR,
    },
    {
      prefix: "/vendor/tesseract/",
      root: TESSERACT_DIST_DIR,
    },
  ];
  for (const route of routes) {
    if (!pathname.startsWith(route.prefix)) continue;
    const relativePath = normalize(pathname.slice(route.prefix.length)).replace(
      /^(\.\.[/\\])+/,
      "",
    );
    const filePath = join(route.root, relativePath);
    if (
      !filePath.startsWith(route.root) ||
      !existsSync(filePath) ||
      statSync(filePath).isDirectory()
    ) {
      return null;
    }
    return filePath;
  }
  return null;
}

function streamStaticFile(request, response, filePath) {
  response.statusCode = 200;
  response.setHeader(
    "Content-Type",
    MIME_TYPES[extname(filePath)] || "application/octet-stream",
  );
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "HEAD") return response.end();
  createReadStream(filePath).pipe(response);
}

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self)",
  );
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  );
}

async function readJson(request, maxBytes) {
  const body = await readBody(request, maxBytes);
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

async function readBody(request, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) {
      request.destroy();
      const error = new Error("Request body too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function json(response, statusCode, value) {
  if (response.writableEnded) return;
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(value));
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
