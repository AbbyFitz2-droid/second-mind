import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImportProposal,
  createDemoArchive,
  detectArchiveFormat,
  parseArchive,
} from "../lib/import-archive.mjs";

function claudeArchive() {
  return [
    {
      uuid: "claude-conversation-1",
      name: "Planning the workshop",
      created_at: "2026-07-10T09:30:00Z",
      chat_messages: [
        {
          uuid: "m1",
          sender: "human",
          text: "Maya Chen asked me to co-run a workshop. I told Maya I finish at 20:00.",
          created_at: "2026-07-10T09:30:10Z",
        },
        {
          uuid: "m2",
          sender: "assistant",
          text: "Maya may appreciate a reminder of your evening boundary before you agree.",
          created_at: "2026-07-10T09:30:40Z",
        },
        {
          uuid: "m3",
          sender: "human",
          text: "I suggested Saturday to Maya instead.",
          created_at: "2026-07-10T09:31:20Z",
        },
      ],
    },
  ];
}

describe("archive format detection", () => {
  it("recognises ChatGPT exports", () => {
    assert.equal(detectArchiveFormat(createDemoArchive()), "chatgpt");
  });

  it("recognises Claude exports", () => {
    assert.equal(detectArchiveFormat(claudeArchive()), "claude");
  });

  it("rejects unknown structures", () => {
    assert.equal(detectArchiveFormat([{ foo: 1 }]), "unknown");
    assert.equal(detectArchiveFormat({}), "unknown");
    assert.throws(() => parseArchive([{ foo: 1 }]), /not a recognised/);
  });
});

describe("ChatGPT parsing", () => {
  it("walks the canonical thread and keeps only user and assistant text", () => {
    const { conversations } = parseArchive(createDemoArchive());
    assert.equal(conversations.length, 3);
    const first = conversations[0];
    assert.equal(first.messages.length, 3);
    assert.deepEqual(
      first.messages.map((message) => message.role),
      ["user", "assistant", "user"],
    );
    assert.match(first.messages[0].text, /Maya Chen invited me/);
    assert.ok(first.createdAt?.startsWith("2026-07-12"));
  });

  it("survives a conversation without current_node", () => {
    const archive = createDemoArchive();
    delete archive[0].current_node;
    const { conversations } = parseArchive(archive);
    assert.equal(conversations[0].messages.length, 3);
  });
});

describe("Claude parsing", () => {
  it("maps human and assistant senders to roles", () => {
    const { format, conversations } = parseArchive(claudeArchive());
    assert.equal(format, "claude");
    assert.deepEqual(
      conversations[0].messages.map((message) => message.role),
      ["user", "assistant", "user"],
    );
    assert.equal(
      conversations[0].createdAt,
      new Date("2026-07-10T09:30:00Z").toISOString(),
    );
  });
});

describe("import proposal", () => {
  it("proposes people from user messages with mention counts", () => {
    const proposal = buildImportProposal(createDemoArchive());
    const names = proposal.people.map((person) => person.name);
    assert.ok(names.includes("Maya"));
    assert.ok(names.includes("Leo"));
    assert.ok(names.includes("Priya"));
    const maya = proposal.people.find((person) => person.name === "Maya");
    assert.ok(maya.mentionCount >= 2);
    assert.equal(maya.status, "proposed");
  });

  it("flags a short name as a possible alias of a fuller name", () => {
    const proposal = buildImportProposal(createDemoArchive());
    const maya = proposal.people.find((person) => person.name === "Maya");
    assert.equal(maya.possibleAliasOf, "Maya Chen");
  });

  it("keeps assistant statements out of user_stated claims", () => {
    const proposal = buildImportProposal(createDemoArchive());
    for (const event of proposal.events) {
      for (const claim of event.userStatedClaims) {
        assert.equal(claim.origin, "user_stated");
        assert.doesNotMatch(
          claim.text,
          /may appreciate|may not remember|may be waiting|may simply prefer/,
        );
      }
      for (const claim of event.aiInferredClaims) {
        assert.equal(claim.origin, "ai_inferred");
        assert.equal(claim.status, "interpretation_not_confirmed");
        assert.equal(claim.verification, "unverified");
      }
    }
  });

  it("labels event dates as archive timestamps, not event dates", () => {
    const proposal = buildImportProposal(createDemoArchive());
    for (const event of proposal.events) {
      assert.equal(event.dateSource, "archive_timestamp");
      assert.ok(
        event.unresolvedQuestions.some((question) =>
          question.includes("conversation timestamp"),
        ),
      );
    }
  });

  it("marks a missing timestamp as unknown instead of inventing one", () => {
    const archive = claudeArchive();
    delete archive[0].created_at;
    const proposal = buildImportProposal(archive);
    assert.equal(proposal.events.length, 1);
    assert.equal(proposal.events[0].occurredAt, null);
    assert.equal(proposal.events[0].datePrecision, "unknown");
    assert.equal(proposal.events[0].dateSource, "not_available");
  });

  it("ignores stopwords, products, and single mentions", () => {
    const archive = [
      {
        uuid: "c1",
        name: "Noise test",
        created_at: "2026-07-01T10:00:00Z",
        chat_messages: [
          {
            sender: "human",
            text: "Yesterday I asked ChatGPT about Instagram. I met Nadia at the gym. Nadia also fixed the plan on Tuesday.",
            created_at: "2026-07-01T10:00:05Z",
          },
        ],
      },
    ];
    const proposal = buildImportProposal(archive);
    const names = proposal.people.map((person) => person.name);
    assert.deepEqual(names, ["Nadia"]);
  });

  it("reports honest stats", () => {
    const proposal = buildImportProposal(createDemoArchive());
    assert.equal(proposal.stats.conversations, 3);
    assert.equal(proposal.stats.userMessages, 5);
    assert.equal(proposal.stats.assistantMessages, 3);
    assert.equal(proposal.stats.eventsProposed, proposal.events.length);
    assert.equal(proposal.stats.peopleProposed, proposal.people.length);
  });

  it("caps events at the configured maximum", () => {
    const archive = createDemoArchive();
    const proposal = buildImportProposal(archive, { maxEvents: 1 });
    assert.equal(proposal.events.length, 1);
  });
});
