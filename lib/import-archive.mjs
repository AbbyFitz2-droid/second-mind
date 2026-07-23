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

  const connections = collectConnectionCandidates(events);
  stats.connectionsProposed = connections.length;

  return {
    schemaVersion: "1.0.0",
    format,
    stats,
    people,
    events,
    connections,
    epistemicNote:
      "Everything below is provisional. Statements written by an AI assistant are interpretations, not facts, and stay labelled that way after import.",
  };
}

function collectConnectionCandidates(events) {
  const tally = new Map();
  for (const event of events) {
    const names = [...event.personNames].sort();
    for (let a = 0; a < names.length; a += 1) {
      for (let b = a + 1; b < names.length; b += 1) {
        const lowerA = names[a].toLowerCase();
        const lowerB = names[b].toLowerCase();
        // "Nora" and "Nora Vale" are probably the same person, not a pair.
        if (
          lowerB.startsWith(`${lowerA} `) ||
          lowerA.startsWith(`${lowerB} `)
        ) {
          continue;
        }
        const key = `${names[a]}::${names[b]}`;
        if (!tally.has(key)) {
          tally.set(key, {
            fromName: names[a],
            toName: names[b],
            coMentionCount: 0,
            conversationTitles: [],
          });
        }
        const entry = tally.get(key);
        entry.coMentionCount += 1;
        if (entry.conversationTitles.length < 3) {
          entry.conversationTitles.push(event.sourceConversationTitle);
        }
      }
    }
  }
  return [...tally.values()]
    .filter((entry) => entry.coMentionCount >= 2)
    .sort((a, b) => b.coMentionCount - a.coMentionCount)
    .map((entry, index) => ({
      id: `import-connection-${index + 1}`,
      ...entry,
      origin: "user_stated",
      status: "proposed",
      note: "Mentioned together in your own messages. Co-mention is not proof of a relationship.",
    }));
}

function collectPersonCandidates(conversations, settings) {
  const tally = new Map();
  for (const conversation of conversations) {
    for (const message of conversation.messages) {
      if (message.role !== "user") continue;
      const rawMentions = findNameMentions(message.text);
      // "Keiko Tan" is also a mention of "Keiko": count the first name too,
      // so people referred to by full name once and first name later add up.
      const expanded = rawMentions.flatMap((mention) => {
        if (!mention.name.includes(" ")) return [mention];
        const firstToken = mention.name.split(/\s+/)[0];
        if (!isPlausiblePersonName(firstToken)) return [mention];
        return [mention, { ...mention, name: firstToken }];
      });
      for (const mention of expanded) {
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
    const name = match[2].replace(/[.,]+$/u, "").replace(/[’']s$/u, "");
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
    const mentions = findNameMentions(message.text)
      .map((mention) => {
        if (nameSet.has(mention.name)) return mention;
        const firstToken = mention.name.split(/\s+/)[0];
        // "Felix Marsh" counts as a mention of the known "Felix".
        if (mention.name.includes(" ") && nameSet.has(firstToken)) {
          return { ...mention, name: firstToken };
        }
        return null;
      })
      .filter(Boolean);
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
export function createStressArchive() {
  const t = (month, day, hour = 10) => Date.UTC(2026, month - 1, day, hour) / 1000;
  const stories = [
    // Nora Vale: long-term close friend, present in every month.
    ["Sunday walk plans", t(2, 1), [
      ["user", "Nora Vale asked if I fancy the coast walk on Sunday. I told Nora I would bring the flask if she brings the terrible biscuits."],
      ["assistant", "It sounds like an easy plan with Nora. The biscuit joke suggests a comfortable shorthand between you."],
      ["user", "Confirmed with Nora for 10am."],
    ]],
    ["Venting about the deadline", t(2, 19, 21), [
      ["user", "Long call with Nora tonight. I was worried about the deadline and Nora talked me down off the ledge again."],
      ["assistant", "You describe Nora as someone you go to under pressure. That reads as a support pattern, at least in this record."],
    ]],
    ["Birthday planning", t(3, 8), [
      ["user", "Nora wants to do a joint birthday dinner. I suggested the tapas place and Nora immediately agreed."],
      ["assistant", "Quick agreement can mean shared taste or an easy-going mood. Either way the planning with Nora seems frictionless."],
      ["user", "I will book the table for the 15th and told Nora to invite Felix."],
    ]],
    ["Post-dinner debrief", t(3, 16, 23), [
      ["user", "Dinner was lovely. Felix Marsh told the story about the ferry again and Nora laughed until she cried."],
      ["assistant", "A repeated story that still lands says something warm about how Felix and Nora hold the group together."],
    ]],
    ["Asking a favour", t(4, 12), [
      ["user", "I asked Nora to water the plants while I am away. Nora said yes before I finished the sentence."],
      ["assistant", "Saying yes that quickly fits the picture of Nora you have recorded elsewhere, though it is still one moment."],
    ]],
    ["The tough conversation", t(5, 20, 20), [
      ["user", "I finally told Nora that the comment at the picnic had stung. Nora went quiet, then apologised properly."],
      ["assistant", "You raised something hard and Nora stayed in the conversation. The apology is recorded; how it settles will show over time."],
      ["user", "We are fine. I am glad I said it to Nora directly."],
    ]],
    ["Flat hunting support", t(6, 14), [
      ["user", "Spent the afternoon helping Nora compare flats. Nora is torn between the bright one and the cheap one."],
      ["assistant", "Nora seems to be weighing light against money. You listening may matter more than the spreadsheet."],
    ]],
    ["July catch-up", t(7, 5, 18), [
      ["user", "Coffee with Nora. I told Nora about the hackathon and she asked better questions than most engineers would."],
      ["assistant", "Curiosity like that from Nora is consistent with the long, engaged history in this archive."],
    ]],
    // Felix Marsh: friend through Nora, two co-mention conversations above.
    ["Ferry story follow-up", t(3, 20), [
      ["user", "Felix sent me the photo from the ferry trip. I told Felix it belongs in a museum of bad weather."],
      ["assistant", "Felix following up with the photo suggests he enjoyed the evening too."],
    ]],
    ["Gig tickets", t(5, 2), [
      ["user", "Felix has a spare ticket for the gig on Thursday and offered it to me before anyone else."],
      ["assistant", "Being first on the list for Felix's spare ticket is a small but concrete signal of inclusion."],
      ["user", "I said yes and will sort food with Felix beforehand."],
    ]],
    // Keiko Tan: brand-new acquaintance, single July conversation.
    ["Pottery class debrief", t(7, 16, 21), [
      ["user", "I met Keiko Tan at the pottery class tonight. Keiko explained glazing like it was a philosophy lecture and I mean that as a compliment."],
      ["assistant", "One evening with Keiko is a thin record. Interesting first impression, nothing more can honestly be said yet."],
    ]],
    // Bram Olsen: warm start, then cooled. Nothing after March.
    ["Climbing plans", t(2, 6), [
      ["user", "Bram Olsen wants to try the new climbing wall on Saturday. I told Bram I am in if we go early."],
      ["assistant", "A first proper plan with Bram. Early Saturdays are a decent test of enthusiasm."],
    ]],
    ["Great session", t(2, 9), [
      ["user", "Climbing with Bram was brilliant. Bram pushed me to try the overhang and I actually got it."],
      ["assistant", "Encouragement that lands well, recorded in your own words about Bram."],
    ]],
    ["First cancellation", t(3, 1), [
      ["user", "Bram cancelled an hour before we were meant to meet. Something about work. I told Bram it was fine."],
      ["assistant", "One cancellation with an apology is ordinary life. Worth noticing only if it repeats with Bram."],
    ]],
    ["Second cancellation", t(3, 22), [
      ["user", "Bram cancelled again, same excuse, no suggestion of another date. I am not going to chase Bram this time."],
      ["assistant", "Two cancellations and no counter-offer from Bram is a pattern worth watching. Your decision not to chase is also part of the record."],
    ]],
    // Ines Duarte: colleague becoming a friend across the months.
    ["Handover notes", t(2, 12), [
      ["user", "Ines Duarte sent impeccable handover notes for the audit. I thanked Ines and asked one clarifying question."],
      ["assistant", "Strictly professional so far. Ines reads as precise and responsive in this exchange."],
    ]],
    ["Lunch beyond work", t(4, 3, 13), [
      ["user", "Lunch with Ines drifted from the audit to families and how we both ended up in this city. Two hours went by fast."],
      ["assistant", "The topics with Ines have widened well past work. That is usually how a colleague becomes a friend."],
    ]],
    ["Weekend market", t(5, 24), [
      ["user", "Ines invited me to the weekend market with her sister. I bought too much cheese and regret nothing, as I told Ines."],
      ["assistant", "Meeting family territory with Ines confirms the shift in the relationship you have been recording."],
    ]],
    ["Advice about the boss", t(6, 28, 19), [
      ["user", "I asked Ines how she would handle the situation with my manager. Ines gave me the honest version, not the polite one."],
      ["assistant", "Choosing Ines for the honest version shows where the trust has moved since February."],
    ]],
    // Rowan Pike: the unresolved promise. No later confirmation anywhere.
    ["Deposit discussion", t(5, 9), [
      ["user", "Rowan Pike agreed the old flat deposit maths at last. Rowan said he will send the refund by Friday."],
      ["assistant", "A concrete promise from Rowan with a date attached. The record should stay open until the transfer actually lands."],
    ]],
    ["Checking in", t(6, 2), [
      ["user", "Still nothing from Rowan. I sent a polite nudge and reminded Rowan of the Friday he chose himself."],
      ["assistant", "The promise from Rowan is now overdue by your account. A dated nudge was the right move for the record."],
    ]],
    // Sela Nkemi and Dele Okon: connected to each other.
    ["The introduction", t(4, 18, 19), [
      ["user", "Sela Nkemi introduced me to Dele Okon at the launch. Sela swears Dele and I will argue about films, in a good way."],
      ["assistant", "An introduction with a prediction attached. Whether Sela is right about Dele will be fun to find out."],
    ]],
    ["Film argument fulfilled", t(5, 30, 22), [
      ["user", "Sela was right. Dele and I argued about the space film for an hour and swapped lists. I owe Sela a drink for this one."],
      ["assistant", "The prediction from Sela held up. Two records now place Dele and Sela in your life as a connected pair."],
    ]],
    ["Documentary swap", t(6, 20), [
      ["user", "Dele sent the documentary list as promised and told me to start with the third one."],
      ["assistant", "Dele followed through on the list. Small kept promises are how a new friendship earns weight."],
    ]],
    // Ada Whitfield: steady book-club thread.
    ["Book club pick", t(3, 5), [
      ["user", "Ada Whitfield picked the sea novel for book club and defended it against the whole room. I admire Ada's stubbornness."],
      ["assistant", "Defending a pick against the room says Ada holds her ground. Your word for it was admiration."],
    ]],
    ["Hosting swap", t(4, 26), [
      ["user", "I asked Ada to swap hosting months and Ada agreed, provided I supply the good coffee."],
      ["assistant", "A condition about coffee is the friendliest possible contract with Ada."],
    ]],
    ["The quiet meeting", t(6, 7, 20), [
      ["user", "Ada was unusually quiet at book club tonight and left early without saying much to anyone."],
      ["assistant", "One quiet evening from Ada is only a data point. If it recurs, it might be worth a gentle check-in."],
    ]],
    // Viktor Hale: practical neighbour.
    ["Bin schedule confusion", t(2, 25), [
      ["user", "Viktor Hale knocked to explain the new bin schedule. I would be lost without Viktor's laminated chart."],
      ["assistant", "A laminated chart is strong evidence that Viktor enjoys being the building's institutional memory."],
    ]],
    ["Parcel rescue", t(5, 15), [
      ["user", "Viktor took in my parcel during the storm and texted me a photo of it, safe next to his radiator."],
      ["assistant", "The photo from Viktor was thoughtful beyond the favour itself. Reliable neighbour, on this evidence."],
    ]],
  ];
  return stories.map(([title, createTime, turns], index) =>
    chatgptConversation({
      id: `stress-conversation-${index + 1}`,
      title,
      createTime,
      turns,
    }),
  );
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
