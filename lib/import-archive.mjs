/**
 * LLM chat-archive import (Phase A of the post-competition roadmap).
 *
 * Parses exported conversation archives from ChatGPT and Claude, then builds
 * a PROVISIONAL import proposal: candidate people and candidate events, with
 * every extracted claim labelled by origin.
 *
 * Epistemic rules, enforced here and tested in test/import-archive.test.mjs:
 * - Text a user wrote is labelled origin "user_stated". It is still not a
 *   verified fact; it is what the user said at the time.
 * - Text an assistant wrote is labelled origin "ai_inferred" and carries
 *   status "interpretation_not_confirmed". It must never be filed as fact.
 * - Dates come from conversation timestamps, not from the described events,
 *   and are labelled dateSource "archive_timestamp" to keep that visible.
 * - Everything in the proposal is status "proposed" until a person reviews it.
 */

const NAME_TOKEN_PATTERN = /^[\p{Lu}][\p{L}'’.-]+$/u;
const NAME_MENTION_PATTERN =
  /(^|[^\p{L}])([\p{Lu}][\p{L}'’.-]+(?:\s+[\p{Lu}][\p{L}'’.-]+)?)/gu;

const NAME_STOPWORDS = new Set(
  [
    // Pronouns, articles, and common sentence starters.
    "i", "i'm", "i've", "me", "my", "you", "your", "we", "our", "they",
    "the", "a", "an", "it", "its", "this", "that", "these", "those",
    "and", "but", "or", "so", "if", "then", "when", "what", "who", "how",
    "why", "where", "is", "are", "was", "were", "do", "does", "did",
    "can", "could", "should", "would", "will", "please", "thanks", "thank",
    "hello", "hey", "hi", "ok", "okay", "yes", "no", "not", "also", "just",
    "maybe", "actually", "anyway", "well", "right", "sure", "sorry",
    // Calendar words.
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
    "sunday", "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
    "today", "tomorrow", "yesterday",
    // Products and tools that read like names in chat archives.
    "chatgpt", "claude", "gpt", "codex", "openai", "anthropic", "google",
    "iphone", "android", "instagram", "whatsapp", "tiktok", "linkedin",
    "facebook", "youtube", "gmail", "maps", "app", "ai",
  ].map((word) => word.toLowerCase()),
);

const DEFAULT_OPTIONS = {
  minMentions: 2,
  maxEvents: 200,
  maxQuoteLength: 180,
  maxUserClaimsPerEvent: 3,
  maxAiClaimsPerEvent: 2,
};

export function detectArchiveFormat(archive) {
  if (!Array.isArray(archive) || archive.length === 0) return "unknown";
  const first = archive.find((item) => item && typeof item === "object");
  if (!first) return "unknown";
  if (first.mapping && typeof first.mapping === "object") return "chatgpt";
  if (Array.isArray(first.chat_messages)) return "claude";
  return "unknown";
}

export function parseArchive(archive) {
  const format = detectArchiveFormat(archive);
  if (format === "unknown") {
    const error = new Error(
      "This file is not a recognised ChatGPT or Claude conversation export.",
    );
    error.code = "unrecognised_archive";
    throw error;
  }
  const conversations =
    format === "chatgpt"
      ? archive.map(parseChatgptConversation)
      : archive.map(parseClaudeConversation);
  return {
    format,
    conversations: conversations.filter(
      (conversation) => conversation.messages.length > 0,
    ),
  };
}

function parseChatgptConversation(raw, index) {
  const messages = [];
  const mapping =
    raw && typeof raw.mapping === "object" && raw.mapping ? raw.mapping : {};
  const ordered = orderChatgptNodes(mapping, raw?.current_node);
  for (const node of ordered) {
    const message = node?.message;
    const role = message?.author?.role;
    if (role !== "user" && role !== "assistant") continue;
    const text = extractChatgptText(message);
    if (!text) continue;
    messages.push({
      role,
      text,
      createdAt: epochToIso(message.create_time),
    });
  }
  return {
    id: String(raw?.id || raw?.conversation_id || `conversation-${index + 1}`),
    title: cleanTitle(raw?.title),
    createdAt: epochToIso(raw?.create_time),
    messages,
  };
}

function orderChatgptNodes(mapping, currentNodeId) {
  // Prefer the canonical thread: walk parents from current_node, then reverse.
  if (currentNodeId && mapping[currentNodeId]) {
    const thread = [];
    let cursor = mapping[currentNodeId];
    const seen = new Set();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      thread.push(cursor);
      cursor = cursor.parent ? mapping[cursor.parent] : null;
    }
    return thread.reverse();
  }
  // Fallback: every message node sorted by its timestamp.
  return Object.values(mapping)
    .filter((node) => node?.message)
    .sort(
      (a, b) => (a.message.create_time || 0) - (b.message.create_time || 0),
    );
}

function extractChatgptText(message) {
  const content = message?.content;
  if (!content) return "";
  if (content.content_type === "text" && Array.isArray(content.parts)) {
    return content.parts
      .filter((part) => typeof part === "string")
      .join("\n")
      .trim();
  }
  if (content.content_type === "multimodal_text" && Array.isArray(content.parts)) {
    return content.parts
      .filter((part) => typeof part === "string")
      .join("\n")
      .trim();
  }
  return "";
}

function parseClaudeConversation(raw, index) {
  const messages = [];
  for (const message of raw?.chat_messages || []) {
    const sender = message?.sender;
    const role =
      sender === "human" ? "user" : sender === "assistant" ? "assistant" : null;
    if (!role) continue;
    const text = extractClaudeText(message);
    if (!text) continue;
    messages.push({
      role,
      text,
      createdAt: isoOrNull(message.created_at),
    });
  }
  return {
    id: String(raw?.uuid || `conversation-${index + 1}`),
    title: cleanTitle(raw?.name),
    createdAt: isoOrNull(raw?.created_at),
    messages,
  };
}

function extractClaudeText(message) {
  if (typeof message?.text === "string" && message.text.trim()) {
    return message.text.trim();
  }
  if (Array.isArray(message?.content)) {
    return message.content
      .filter((block) => block?.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n")
      .trim();
  }
  return "";
}

export function buildImportProposal(archive, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const { format, conversations } = parseArchive(archive);

  const stats = {
    conversations: conversations.length,
    userMessages: 0,
    assistantMessages: 0,
    peopleProposed: 0,
    eventsProposed: 0,
    conversationsWithoutPeople: 0,
  };
  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (message.role === "user") stats.userMessages += 1;
      else stats.assistantMessages += 1;
    }
  }

  const candidates = collectPersonCandidates(conversations, settings);
  const people = candidates.map((candidate, index) => ({
    id: `import-person-${index + 1}`,
    name: candidate.name,
    mentionCount: candidate.count,
    conversationCount: candidate.conversationIds.size,
    possibleAliasOf: candidate.possibleAliasOf,
    sampleQuote: candidate.sampleQuote,
    origin: "user_stated",
    status: "proposed",
  }));
  const nameSet = new Set(candidates.map((candidate) => candidate.name));

  const events = [];
  for (const conversation of conversations) {
    if (events.length >= settings.maxEvents) break;
    const event = buildEventProposal(conversation, nameSet, settings);
    if (!event) {
      stats.conversationsWithoutPeople += 1;
      continue;
    }
    event.id = `import-event-${events.length + 1}`;
    events.push(event);
  }

  stats.peopleProposed = people.length;
  stats.eventsProposed = events.length;

  return {
    schemaVersion: "1.0.0",
    format,
    stats,
    people,
    events,
    epistemicNote:
      "Everything below is provisional. Statements written by an AI assistant are interpretations, not facts, and stay labelled that way after import.",
  };
}

function collectPersonCandidates(conversations, settings) {
  const tally = new Map();
  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (message.role !== "user") continue;
      for (const mention of findNameMentions(message.text)) {
        const key = mention.name.toLowerCase();
        if (!tally.has(key)) {
          tally.set(key, {
            name: mention.name,
            count: 0,
            midSentenceCount: 0,
            conversationIds: new Set(),
            sampleQuote: "",
            possibleAliasOf: null,
          });
        }
        const entry = tally.get(key);
        entry.count += 1;
        if (mention.midSentence) entry.midSentenceCount += 1;
        entry.conversationIds.add(conversation.id);
        if (!entry.sampleQuote) {
          entry.sampleQuote = sentenceAround(
            message.text,
            mention.index,
            settings.maxQuoteLength,
          );
        }
      }
    }
  }

  const candidates = [...tally.values()]
    .filter(
      (entry) =>
        entry.count >= settings.minMentions &&
        (entry.midSentenceCount >= 1 || entry.count >= 3),
    )
    .sort((a, b) => b.count - a.count);

  // Alias hint: "Maya" alongside "Maya Chen" is probably the same person.
  for (const candidate of candidates) {
    if (candidate.name.includes(" ")) continue;
    const fuller = candidates.find(
      (other) =>
        other !== candidate &&
        other.name.includes(" ") &&
        other.name.toLowerCase().startsWith(`${candidate.name.toLowerCase()} `),
    );
    if (fuller) candidate.possibleAliasOf = fuller.name;
  }
  return candidates;
}

function findNameMentions(text) {
  const mentions = [];
  for (const match of String(text || "").matchAll(NAME_MENTION_PATTERN)) {
    const name = match[2];
    const index = match.index + match[1].length;
    if (!isPlausiblePersonName(name)) continue;
    const before = text.slice(0, index).trimEnd();
    const midSentence =
      before.length > 0 && !/[.!?\n]$/.test(before);
    mentions.push({ name, index, midSentence });
  }
  return mentions;
}

function isPlausiblePersonName(value) {
  const text = String(value || "").trim();
  if (text.length < 2 || text.length > 60 || /\d/.test(text)) return false;
  const words = text.split(/\s+/);
  if (words.length > 2) return false;
  if (words.some((word) => NAME_STOPWORDS.has(word.toLowerCase()))) {
    return false;
  }
  return words.every((word) => NAME_TOKEN_PATTERN.test(word));
}

function buildEventProposal(conversation, nameSet, settings) {
  const mentionedNames = new Set();
  const userStatedClaims = [];
  const aiInferredClaims = [];

  for (const message of conversation.messages) {
    const mentions = findNameMentions(message.text).filter((mention) =>
      nameSet.has(mention.name),
    );
    if (!mentions.length) continue;
    if (message.role === "user") {
      for (const mention of mentions) mentionedNames.add(mention.name);
      if (userStatedClaims.length < settings.maxUserClaimsPerEvent) {
        userStatedClaims.push({
          origin: "user_stated",
          text: sentenceAround(
            message.text,
            mentions[0].index,
            settings.maxQuoteLength,
          ),
          verification: "unverified",
          timestamp: message.createdAt,
        });
      }
    } else if (aiInferredClaims.length < settings.maxAiClaimsPerEvent) {
      aiInferredClaims.push({
        origin: "ai_inferred",
        text: sentenceAround(
          message.text,
          mentions[0].index,
          settings.maxQuoteLength,
        ),
        status: "interpretation_not_confirmed",
        verification: "unverified",
        timestamp: message.createdAt,
      });
    }
  }

  if (!mentionedNames.size || !userStatedClaims.length) return null;

  return {
    title: conversation.title,
    sourceConversationId: conversation.id,
    sourceConversationTitle: conversation.title,
    occurredAt: conversation.createdAt,
    datePrecision: conversation.createdAt ? "day" : "unknown",
    dateSource: conversation.createdAt ? "archive_timestamp" : "not_available",
    personNames: [...mentionedNames],
    userStatedClaims,
    aiInferredClaims,
    unresolvedQuestions: [
      conversation.createdAt
        ? "The date comes from the conversation timestamp, not from the events it describes."
        : "The archive did not include a timestamp for this conversation.",
      ...(aiInferredClaims.length
        ? [
            "AI-written statements are interpretations and remain unconfirmed until you verify them.",
          ]
        : []),
    ],
    status: "proposed",
  };
}

function sentenceAround(text, index, maxLength) {
  const value = String(text || "");
  let start = index;
  while (start > 0 && !/[.!?\n]/.test(value[start - 1])) start -= 1;
  let end = index;
  while (end < value.length && !/[.!?\n]/.test(value[end])) end += 1;
  if (end < value.length) end += 1;
  const sentence = value.slice(start, end).trim();
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength - 1).trim()}…`;
}

function cleanTitle(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "new chat") return "Imported conversation";
  return text.slice(0, 140);
}

function epochToIso(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isoOrNull(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * A small FICTIONAL ChatGPT-format archive so the import flow can be
 * demonstrated without anyone's real data. Uses the existing demo cast.
 */
export function createDemoArchive() {
  const base = Date.UTC(2026, 6, 12, 10, 0, 0) / 1000;
  return [
    chatgptConversation({
      id: "demo-conversation-1",
      title: "Workshop planning with Maya",
      createTime: base,
      turns: [
        [
          "user",
          "Maya Chen invited me to co-run a design workshop next month. I want to help but I already told Maya I am offline after 20:00 on weekdays.",
        ],
        [
          "assistant",
          "It sounds like Maya values your input. Since Maya proposed an evening slot, she may not remember your availability boundary, so it could help to restate it kindly.",
        ],
        [
          "user",
          "Good idea. I will suggest to Maya that we prepare on Saturday afternoon instead, since Maya Chen usually prefers afternoons.",
        ],
      ],
    }),
    chatgptConversation({
      id: "demo-conversation-2",
      title: "Tap repair follow-up",
      createTime: base + 86_400 * 3,
      turns: [
        [
          "user",
          "Leo Ortiz said the technician was booked for Thursday, but the kitchen tap is still leaking. Should I message Leo again?",
        ],
        [
          "assistant",
          "Leo may be waiting on the contractor. A short, factual follow-up asking Leo for the new appointment date keeps the record clear without escalating.",
        ],
        [
          "user",
          "I asked Leo for the new date and said the leak is getting worse.",
        ],
      ],
    }),
    chatgptConversation({
      id: "demo-conversation-3",
      title: "Feedback wording",
      createTime: base + 86_400 * 6,
      turns: [
        [
          "user",
          "Priya sent detailed feedback through Maya instead of messaging me directly. I want to thank Priya without making it awkward.",
        ],
        [
          "assistant",
          "Priya may simply prefer indirect channels. Thanking Priya briefly and inviting direct notes next time leaves the choice with her.",
        ],
      ],
    }),
  ];
}

/**
 * A larger FICTIONAL archive for scale testing: what does Second Mind look
 * like when months of conversations and a full cast arrive at once?
 * Deterministic, so tests and demos stay reproducible. Every name is invented.
 */
export function createStressArchive({ conversations = 40 } = {}) {
  const cast = [
    "Nora Vale", "Tomás Rivera", "Keiko Tan", "Bram Olsen", "Ada Whitfield",
    "Felix Marsh", "Ines Duarte", "Rowan Pike", "Sela Nkemi", "Viktor Hale",
    "June Abara", "Cormac Lyle", "Petra Voss", "Dele Okon", "Isla Finch",
  ];
  const topics = [
    ["dinner plans", "suggested we cook on Friday instead of eating out"],
    ["the project deadline", "said the draft needs another pass before Monday"],
    ["the apartment repair", "promised to send the technician's new date"],
    ["the gym schedule", "asked to move our session to the morning"],
    ["the book club", "offered to host the next meeting"],
    ["the trip planning", "wants to book the train tickets this week"],
    ["the borrowed camera", "said they will return the camera on Sunday"],
    ["feedback on my draft", "sent three suggestions and one open question"],
  ];
  const rng = mulberry32(20260722);
  const base = Date.UTC(2026, 1, 1, 9, 0, 0) / 1000;
  const archive = [];
  for (let index = 0; index < conversations; index += 1) {
    const personA = cast[Math.floor(rng() * cast.length)];
    let personB = cast[Math.floor(rng() * cast.length)];
    if (personB === personA) personB = cast[(cast.indexOf(personA) + 1) % cast.length];
    const firstA = personA.split(" ")[0];
    const firstB = personB.split(" ")[0];
    const [topic, detail] = topics[Math.floor(rng() * topics.length)];
    const createTime = base + index * 86_400 * 3.5 + Math.floor(rng() * 7200);
    archive.push(
      chatgptConversation({
        id: `stress-conversation-${index + 1}`,
        title: `${topic[0].toUpperCase()}${topic.slice(1)} with ${firstA}`,
        createTime,
        turns: [
          [
            "user",
            `I spoke to ${personA} about ${topic}. ${firstA} ${detail}. I also mentioned it to ${firstB} afterwards.`,
          ],
          [
            "assistant",
            `${firstA} may be signalling a preference here, though one conversation is not enough to be sure.`,
          ],
          [
            "user",
            `I told ${firstA} I would confirm by tomorrow evening.`,
          ],
        ],
      }),
    );
  }
  return archive;
}

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chatgptConversation({ id, title, createTime, turns }) {
  const mapping = {};
  let previousId = null;
  turns.forEach(([role, text], index) => {
    const nodeId = `${id}-node-${index + 1}`;
    mapping[nodeId] = {
      id: nodeId,
      parent: previousId,
      children: [],
      message: {
        id: `${nodeId}-message`,
        author: { role },
        create_time: createTime + index * 60,
        content: { content_type: "text", parts: [text] },
      },
    };
    if (previousId) mapping[previousId].children.push(nodeId);
    previousId = nodeId;
  });
  return {
    id,
    title,
    create_time: createTime,
    current_node: previousId,
    mapping,
  };
}
