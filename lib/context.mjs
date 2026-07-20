const GOALS = new Set([
  "warm_boundary",
  "clarify_intent",
  "keep_distance",
  "welcome_connection",
  "coordinate_practical",
  "create_record",
]);

const TONES = new Set(["warm", "neutral", "direct"]);

const CLOSED_COMMITMENT_STATUSES = new Set(["completed", "cancelled"]);

const DEMO_CASE = {
  id: "case-maya-evening-message",
  title: "The ambiguous sign-off",
  incoming: {
    id: "incoming-1",
    senderPersonId: "person-maya",
    text: "No worries — I’ll leave you to it.",
    receivedAt: "2026-07-18T20:14:00+02:00",
    source: "Message excerpt",
  },
  currentGoal: "warm_boundary",
  desiredTone: "warm",
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
    {
      id: "person-maya",
      displayName: "Maya Chen",
      relationshipType: "New collaborator · emerging friend",
      closeness: 2,
      trust: 3,
      metThrough: "A community design project",
      communicationNotes: [
        "Usually concise and literal in work messages.",
      ],
      boundaries: ["No non-urgent work conversation after 20:00."],
      relationshipGoals: ["Build a warm, dependable collaboration."],
      currentState: "Positive, still developing",
    },
    {
      id: "person-leo",
      displayName: "Leo Ortiz",
      relationshipType: "Neighbour · acquaintance",
      closeness: 1,
      trust: 2,
      metThrough: "The apartment building",
      communicationNotes: ["Mostly communicates about practical matters."],
      boundaries: ["Keep private work details separate."],
      relationshipGoals: ["Remain friendly and clear."],
      currentState: "Casual",
    },
    {
      id: "person-priya",
      displayName: "Priya Nair",
      relationshipType: "Project teammate · friend of Maya",
      closeness: 1,
      trust: 2,
      metThrough: "The same community design project",
      communicationNotes: [
        "Usually contributes through Maya rather than messaging directly.",
      ],
      boundaries: ["Keep project feedback specific and constructive."],
      relationshipGoals: ["Build an easy, respectful working relationship."],
      currentState: "Developing",
    },
  ],
  relationshipConnections: [
    {
      id: "connection-maya-priya",
      schemaVersion: "1.0.0",
      fromPersonId: "person-maya",
      toPersonId: "person-priya",
      relationshipType: "Close friends · project teammates",
      dynamic: "supportive",
      strength: 4,
      confidence: 3,
      notes:
        "They arrived together and have described working together on earlier projects.",
      source: "demo_seed",
      userConfirmation: "confirmed",
      updatedAt: "2026-07-18T18:25:00+02:00",
    },
    {
      id: "connection-leo-priya",
      schemaVersion: "1.0.0",
      fromPersonId: "person-leo",
      toPersonId: "person-priya",
      relationshipType: "Occasional acquaintances",
      dynamic: "unknown",
      strength: 1,
      confidence: 1,
      notes: "They have met once; there is not enough evidence to infer more.",
      source: "demo_seed",
      userConfirmation: "confirmed",
      updatedAt: "2026-07-18T18:25:00+02:00",
    },
  ],
  claims: [
    {
      id: "claim-availability",
      situationId: "situation-availability",
      personIds: ["person-you", "person-maya"],
      type: "confirmed_fact",
      text: "You told Maya you would be offline after 20:00.",
      source: {
        kind: "demo_seed",
        reference: "User-confirmed availability note",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-18T18:10:00+02:00",
    },
    {
      id: "claim-deadline",
      situationId: "situation-deadline",
      personIds: ["person-you", "person-maya"],
      type: "direct_observation",
      text: "Maya wrote that no response was needed that evening.",
      source: {
        kind: "message",
        reference: "Project message excerpt",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-18T18:25:00+02:00",
    },
    {
      id: "claim-prior-phrase",
      situationId: "situation-prior-phrase",
      personIds: ["person-you", "person-maya"],
      type: "direct_observation",
      text:
        "Maya previously used “I’ll leave you to it” while neutrally ending a work exchange.",
      source: {
        kind: "message",
        reference: "Earlier message excerpt",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-11T17:40:00+02:00",
    },
    {
      id: "claim-package",
      situationId: "situation-package",
      personIds: ["person-you", "person-leo"],
      type: "confirmed_fact",
      text: "Leo collected a package for you while you were away.",
      source: {
        kind: "user_entry",
        reference: "Neighbour note",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-09T12:00:00+02:00",
    },
  ],
  situations: [
    {
      id: "situation-prior-phrase",
      title: "Earlier neutral sign-off",
      occurredAt: "2026-07-11T17:40:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-maya"],
      sourceRefs: ["Earlier message excerpt"],
      eventClaimIds: ["claim-prior-phrase"],
      actionTaken: "The exchange ended normally.",
      unresolvedQuestions: [],
      relatedSituationIds: ["situation-availability"],
    },
    {
      id: "situation-availability",
      title: "Evening availability shared",
      occurredAt: "2026-07-18T18:10:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-maya"],
      sourceRefs: ["User-confirmed availability note"],
      eventClaimIds: ["claim-availability"],
      actionTaken: "Maya acknowledged the schedule.",
      unresolvedQuestions: [],
      relatedSituationIds: ["situation-deadline"],
    },
    {
      id: "situation-deadline",
      title: "Deadline moved to Tuesday",
      occurredAt: "2026-07-18T18:25:00+02:00",
      location: "Project chat",
      personIds: ["person-you", "person-maya"],
      sourceRefs: ["Project message excerpt"],
      eventClaimIds: ["claim-deadline"],
      actionTaken: "No action was required that evening.",
      unresolvedQuestions: ["Whether Maya expected an acknowledgment anyway"],
      relatedSituationIds: ["situation-availability"],
    },
    {
      id: "situation-package",
      title: "Package collection",
      occurredAt: "2026-07-09T12:00:00+02:00",
      location: "Apartment building",
      personIds: ["person-you", "person-leo"],
      sourceRefs: ["Neighbour note"],
      eventClaimIds: ["claim-package"],
      actionTaken: "You thanked Leo.",
      unresolvedQuestions: [],
      relatedSituationIds: [],
    },
  ],
  selectedSituationIds: [
    "situation-prior-phrase",
    "situation-availability",
    "situation-deadline",
  ],
};

const PATTERN_DEMO_CASE_ID = "case-vargus-relationship-pattern";

const PATTERN_DEMO_CASE = {
  id: PATTERN_DEMO_CASE_ID,
  title: "The deleted message",
  incoming: {
    id: "incoming-vargus-1",
    senderPersonId: "person-benedict",
    text: "Please don’t invite Gertrude out with us.",
    receivedAt: "2026-07-19T20:10:00+02:00",
    source: "Fictional message excerpt",
  },
  currentGoal: "clarify_intent",
  desiredTone: "warm",
  patternModel: {
    schemaVersion: "1.0.0",
    eyebrow: "MERLIN PATTERN",
    title:
      "There may be an unresolved dynamic between {focusA} and {focusB}.",
    focusPersonIds: ["person-gertrude", "person-benedict"],
    closeThreshold: 0.12,
    hypotheses: [
      {
        id: "romantic",
        label: "Romantic interest or tension",
        shortLabel: "Romantic",
        prior: 0.25,
        description:
          "One or both people may have romantic interest, embarrassment, jealousy, or rejected interest.",
      },
      {
        id: "friction",
        label: "Non-romantic interpersonal friction",
        shortLabel: "Friction",
        prior: 0.35,
        description:
          "They may have disagreed, felt uncomfortable, or simply not liked one another.",
      },
      {
        id: "ordinary",
        label: "Ordinary social preference",
        shortLabel: "Ordinary",
        prior: 0.4,
        description:
          "The messages may reflect logistics or group preference without a deeper relational dynamic.",
      },
    ],
    evidence: [
      {
        situationId: "situation-introduction",
        chartLabel: "Intro",
        effect: "Very weak support for romantic interest",
        caveat:
          "Vargus says Benedict is often warm with other people, so this behaviour is close to his baseline.",
        multipliers: { romantic: 1.08, friction: 0.9, ordinary: 1 },
      },
      {
        situationId: "situation-deleted-question",
        chartLabel: "Deleted",
        effect: "Raises the romantic-interest hypothesis",
        caveat:
          "Deletion may reflect embarrassment, accidental sending, privacy, conflict, or a change of mind.",
        multipliers: { romantic: 2.4, friction: 1.2, ordinary: 0.65 },
      },
      {
        situationId: "situation-no-invite",
        chartLabel: "No invite",
        effect: "Raises unresolved tension, especially non-romantic friction",
        caveat:
          "The request does not state a reason. It could follow attraction, rejection, disagreement, discomfort, or ordinary preference.",
        multipliers: { romantic: 1.4, friction: 2.1, ordinary: 0.55 },
      },
    ],
    excludedEvidence: [
      {
        situationId: "situation-benedict-bar",
        label: "“Salty” at the bar",
        reason:
          "Vargus’s broad impression of Benedict does not identify a Gertrude-related dynamic.",
      },
      {
        situationId: "situation-gertrude-conference",
        label: "“Bossy” at the conference",
        reason:
          "Vargus’s broad impression of Gertrude predates the introduction and does not establish how the pair relate.",
      },
    ],
    calibration:
      "Prototype Bayesian update: priors and likelihood multipliers are transparent design assumptions for this fictional demo, not probabilities learned from real relationship outcomes.",
    nextBestQuestion:
      "Ask Benedict what happened or what concern he wants Vargus to understand—without mentioning romance as if it were established.",
    contextualInterpretation:
      "Benedict’s request is explicit, but his reason is not. The deleted question and later exclusion request together support an unresolved dynamic between Gertrude and Benedict. Romantic interest or tension is one plausible explanation; non-romantic friction remains nearly as plausible.",
    confidenceLabel: "unresolved dynamic · moderate; romance · low",
    responseOptions: [
      {
        id: "ask-directly",
        label: "Ask what happened",
        text:
          "I can leave Gertrude out this time, but I don’t want to assume why. Is there something unresolved between you that you want me to understand?",
        why:
          "Clarifies the request without presenting romance, conflict, or anyone’s motive as fact.",
      },
      {
        id: "avoid-triangle",
        label: "Avoid becoming the go-between",
        text:
          "I’m willing to hear your concern, but I don’t want to manage something between you and Gertrude. Could you speak with her directly?",
        why:
          "Protects Vargus from being pulled into an unresolved two-person dynamic.",
      },
      {
        id: "preserve-agency",
        label: "Keep the decision yours",
        text:
          "I’ll decide invitations myself, but I’m open to hearing if there is a specific reason you’re uncomfortable.",
        why:
          "Keeps Vargus in control while allowing Benedict to provide relevant information.",
      },
      {
        id: "comply-once",
        label: "Comply this time",
        text: "Okay, I won’t invite Gertrude this time.",
        why:
          "A low-friction option that does not infer or resolve the underlying dynamic.",
      },
    ],
    recommendedByGoal: {
      warm_boundary: "ask-directly",
      clarify_intent: "ask-directly",
      keep_distance: "preserve-agency",
      welcome_connection: "comply-once",
    },
  },
  patternEvidenceAdjustments: {},
  people: [
    {
      id: "person-you",
      displayName: "Vargus",
      relationshipType: "Self",
      closeness: 4,
      trust: 4,
      metThrough: "",
      communicationNotes: [],
      boundaries: [],
      relationshipGoals: [],
      currentState: "Active",
    },
    {
      id: "person-benedict",
      displayName: "Benedict",
      relationshipType: "Friend",
      closeness: 3,
      trust: 3,
      metThrough: "Social life",
      communicationNotes: [
        "Vargus reports that Benedict is often sweet when speaking with other people.",
      ],
      boundaries: [],
      relationshipGoals: [
        "Keep the friendship direct without becoming a go-between.",
      ],
      currentState: "Friendly, with a new group tension",
    },
    {
      id: "person-gertrude",
      displayName: "Gertrude",
      relationshipType: "Friend",
      closeness: 3,
      trust: 3,
      metThrough: "A conference",
      communicationNotes: [],
      boundaries: [],
      relationshipGoals: [
        "Keep the friendship open while avoiding assumptions.",
      ],
      currentState: "Friendly, with a new group tension",
    },
  ],
  relationshipConnections: [
    {
      id: "connection-gertrude-benedict",
      schemaVersion: "1.0.0",
      fromPersonId: "person-gertrude",
      toPersonId: "person-benedict",
      relationshipType: "Recently introduced · dynamic unclear",
      dynamic: "unknown",
      strength: 1,
      confidence: 1,
      notes:
        "They met once through Vargus. Later events suggest an unresolved dynamic, but its nature is not established.",
      source: "demo_seed",
      userConfirmation: "confirmed",
      updatedAt: "2026-07-19T20:10:00+02:00",
    },
  ],
  claims: [
    {
      id: "claim-benedict-salty",
      situationId: "situation-benedict-bar",
      personIds: ["person-you", "person-benedict"],
      type: "user_report",
      text: "Vargus remembers Benedict as seeming “salty” at the bar.",
      source: {
        kind: "demo_seed",
        reference: "Vargus’s retrospective description",
      },
      confidence: "moderate",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-05T21:30:00+02:00",
    },
    {
      id: "claim-gertrude-bossy",
      situationId: "situation-gertrude-conference",
      personIds: ["person-you", "person-gertrude"],
      type: "user_report",
      text: "Vargus remembers Gertrude as seeming “bossy” at the conference.",
      source: {
        kind: "demo_seed",
        reference: "Vargus’s retrospective description",
      },
      confidence: "moderate",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-08T14:20:00+02:00",
    },
    {
      id: "claim-benedict-warm",
      situationId: "situation-introduction",
      personIds: ["person-you", "person-benedict", "person-gertrude"],
      type: "direct_observation",
      text: "After Vargus introduced them, Benedict spoke warmly to Gertrude.",
      source: {
        kind: "demo_seed",
        reference: "Vargus’s account of the introduction",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-12T18:10:00+02:00",
    },
    {
      id: "claim-benedict-usually-warm",
      situationId: "situation-introduction",
      personIds: ["person-you", "person-benedict", "person-gertrude"],
      type: "user_report",
      text: "Vargus reports that Benedict is often warm when talking with other people.",
      source: {
        kind: "demo_seed",
        reference: "Vargus’s behavioural baseline for Benedict",
      },
      confidence: "moderate",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-12T18:10:00+02:00",
    },
    {
      id: "claim-gertrude-deleted-question",
      situationId: "situation-deleted-question",
      personIds: ["person-you", "person-gertrude", "person-benedict"],
      type: "direct_observation",
      text:
        "Gertrude messaged Vargus, “Have you heard from Benedict?” and then deleted the message.",
      source: {
        kind: "message",
        reference: "Deleted fictional message observed by Vargus",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-17T16:45:00+02:00",
    },
    {
      id: "claim-benedict-no-invite",
      situationId: "situation-no-invite",
      personIds: ["person-you", "person-benedict", "person-gertrude"],
      type: "direct_observation",
      text: "Benedict asked Vargus not to invite Gertrude out.",
      source: {
        kind: "message",
        reference: "Fictional message from Benedict",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-19T20:10:00+02:00",
    },
  ],
  situations: [
    {
      id: "situation-benedict-bar",
      title: "Benedict at the bar",
      occurredAt: "2026-07-05T21:30:00+02:00",
      location: "Bar",
      personIds: ["person-you", "person-benedict"],
      sourceRefs: ["Vargus’s retrospective description"],
      eventClaimIds: ["claim-benedict-salty"],
      actionTaken: "Vargus noted the interaction.",
      unresolvedQuestions: ["What Vargus meant by “salty” in this context"],
      relatedSituationIds: [],
    },
    {
      id: "situation-gertrude-conference",
      title: "Gertrude at the conference",
      occurredAt: "2026-07-08T14:20:00+02:00",
      location: "Conference",
      personIds: ["person-you", "person-gertrude"],
      sourceRefs: ["Vargus’s retrospective description"],
      eventClaimIds: ["claim-gertrude-bossy"],
      actionTaken: "Vargus noted the interaction.",
      unresolvedQuestions: ["What behaviour Vargus described as “bossy”"],
      relatedSituationIds: [],
    },
    {
      id: "situation-introduction",
      title: "Vargus introduces Gertrude and Benedict",
      occurredAt: "2026-07-12T18:10:00+02:00",
      location: "Social gathering",
      personIds: ["person-you", "person-gertrude", "person-benedict"],
      sourceRefs: [
        "Vargus’s account of the introduction",
        "Vargus’s behavioural baseline for Benedict",
      ],
      eventClaimIds: [
        "claim-benedict-warm",
        "claim-benedict-usually-warm",
      ],
      actionTaken: "The three spent time together.",
      unresolvedQuestions: [
        "Whether Benedict’s warmth differed from his usual social behaviour",
      ],
      relatedSituationIds: [
        "situation-deleted-question",
        "situation-no-invite",
      ],
    },
    {
      id: "situation-deleted-question",
      title: "Gertrude asks about Benedict, then deletes it",
      occurredAt: "2026-07-17T16:45:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-gertrude", "person-benedict"],
      sourceRefs: ["Deleted fictional message observed by Vargus"],
      eventClaimIds: ["claim-gertrude-deleted-question"],
      actionTaken: "No answer was recorded before deletion.",
      unresolvedQuestions: [
        "Why Gertrude asked",
        "Why Gertrude deleted the question",
      ],
      relatedSituationIds: ["situation-introduction", "situation-no-invite"],
    },
    {
      id: "situation-no-invite",
      title: "Benedict asks Vargus not to invite Gertrude",
      occurredAt: "2026-07-19T20:10:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-benedict", "person-gertrude"],
      sourceRefs: ["Fictional message from Benedict"],
      eventClaimIds: ["claim-benedict-no-invite"],
      actionTaken: "Vargus has not decided how to respond.",
      unresolvedQuestions: [
        "Benedict’s reason",
        "Whether Gertrude knows about the request",
      ],
      relatedSituationIds: [
        "situation-introduction",
        "situation-deleted-question",
      ],
    },
  ],
  selectedSituationIds: [
    "situation-benedict-bar",
    "situation-gertrude-conference",
    "situation-introduction",
    "situation-deleted-question",
    "situation-no-invite",
  ],
};

const COMMITMENT_DEMO_CASE = {
  id: "case-nadia-property-commitments",
  title: "The unconfirmed appointment",
  incoming: {
    id: "incoming-property-1",
    senderPersonId: "person-tomas",
    text: "I’ve arranged the technician for tomorrow at 10. Please confirm.",
    receivedAt: "2026-07-20T09:30:00+02:00",
    source: "Fictional message excerpt",
  },
  currentGoal: "coordinate_practical",
  desiredTone: "direct",
  people: [
    {
      id: "person-you",
      displayName: "Nadia",
      relationshipType: "Self",
      closeness: 4,
      trust: 4,
      metThrough: "",
      communicationNotes: [],
      boundaries: [],
      relationshipGoals: [],
      currentState: "Active",
    },
    {
      id: "person-tomas",
      displayName: "Tomas Vega",
      relationshipType: "Property manager",
      closeness: 1,
      trust: 2,
      metThrough: "The tenancy",
      communicationNotes: [
        "Most communication concerns appointments and maintenance.",
      ],
      boundaries: [
        "Appointments must be confirmed with Nadia before access is arranged.",
      ],
      relationshipGoals: [
        "Resolve maintenance issues with a clear written record and minimal rescheduling.",
      ],
      currentState: "Cooperative, with repeated coordination delays",
    },
  ],
  relationshipConnections: [],
  claims: [
    {
      id: "claim-repairs-reported",
      situationId: "situation-repairs-reported",
      personIds: ["person-you", "person-tomas"],
      type: "direct_observation",
      text:
        "Nadia reported that the dishwasher was not working and the kitchen tap was loose.",
      source: {
        kind: "message",
        reference: "Maintenance message · 5 July",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-05T11:20:00+02:00",
    },
    {
      id: "claim-repair-promise",
      situationId: "situation-repair-promise",
      personIds: ["person-you", "person-tomas"],
      type: "direct_observation",
      text:
        "Tomas wrote that he would arrange a dishwasher technician and have the tap checked.",
      source: {
        kind: "message",
        reference: "Property-manager message · 8 July",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-08T16:10:00+02:00",
    },
    {
      id: "claim-availability-sent",
      situationId: "situation-availability-sent",
      personIds: ["person-you", "person-tomas"],
      type: "direct_observation",
      text:
        "Nadia supplied two availability windows and asked for confirmation before booking.",
      source: {
        kind: "message",
        reference: "Nadia’s availability message · 12 July",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-12T10:00:00+02:00",
    },
    {
      id: "claim-first-visit-unconfirmed",
      situationId: "situation-first-visit-unconfirmed",
      personIds: ["person-you", "person-tomas"],
      type: "direct_observation",
      text:
        "A proposed technician visit was not confirmed and no technician attended.",
      source: {
        kind: "user_entry",
        reference: "User-confirmed outcome · 17 July",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-17T18:00:00+02:00",
    },
    {
      id: "claim-electricity-completed",
      situationId: "situation-electricity-completed",
      personIds: ["person-you", "person-tomas"],
      type: "confirmed_fact",
      text: "The requested electrical-capacity change was completed.",
      source: {
        kind: "user_entry",
        reference: "User-confirmed completion · 14 July",
      },
      confidence: "high",
      status: "current",
      userConfirmation: "confirmed",
      createdAt: "2026-07-14T15:30:00+02:00",
    },
  ],
  situations: [
    {
      id: "situation-repairs-reported",
      title: "Maintenance issues reported",
      occurredAt: "2026-07-05T11:20:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-tomas"],
      sourceRefs: ["Maintenance message · 5 July"],
      eventClaimIds: ["claim-repairs-reported"],
      actionTaken: "The issues were added to the maintenance record.",
      unresolvedQuestions: [],
      relatedSituationIds: ["situation-repair-promise"],
    },
    {
      id: "situation-repair-promise",
      title: "Repairs promised",
      occurredAt: "2026-07-08T16:10:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-tomas"],
      sourceRefs: ["Property-manager message · 8 July"],
      eventClaimIds: ["claim-repair-promise"],
      actionTaken: "Nadia waited for appointment details.",
      unresolvedQuestions: ["When the technician would be confirmed"],
      relatedSituationIds: [
        "situation-availability-sent",
        "situation-first-visit-unconfirmed",
      ],
    },
    {
      id: "situation-availability-sent",
      title: "Availability supplied",
      occurredAt: "2026-07-12T10:00:00+02:00",
      location: "Messages",
      personIds: ["person-you", "person-tomas"],
      sourceRefs: ["Nadia’s availability message · 12 July"],
      eventClaimIds: ["claim-availability-sent"],
      actionTaken: "Two possible windows were offered.",
      unresolvedQuestions: ["Which window would be confirmed"],
      relatedSituationIds: ["situation-first-visit-unconfirmed"],
    },
    {
      id: "situation-electricity-completed",
      title: "Electrical change completed",
      occurredAt: "2026-07-14T15:30:00+02:00",
      location: "Apartment",
      personIds: ["person-you", "person-tomas"],
      sourceRefs: ["User-confirmed completion · 14 July"],
      eventClaimIds: ["claim-electricity-completed"],
      actionTaken: "The issue was marked completed.",
      unresolvedQuestions: [],
      relatedSituationIds: [],
    },
    {
      id: "situation-first-visit-unconfirmed",
      title: "Technician visit remained unconfirmed",
      occurredAt: "2026-07-17T18:00:00+02:00",
      location: "Apartment",
      personIds: ["person-you", "person-tomas"],
      sourceRefs: ["User-confirmed outcome · 17 July"],
      eventClaimIds: ["claim-first-visit-unconfirmed"],
      actionTaken: "No access occurred.",
      unresolvedQuestions: ["When a confirmed appointment will take place"],
      relatedSituationIds: ["situation-repair-promise"],
    },
  ],
  issues: [
    {
      id: "issue-dishwasher",
      title: "Dishwasher repair",
      personIds: ["person-you", "person-tomas"],
      status: "open",
      priority: "high",
      createdAt: "2026-07-05T11:20:00+02:00",
      updatedAt: "2026-07-17T18:00:00+02:00",
    },
    {
      id: "issue-tap",
      title: "Loose kitchen tap",
      personIds: ["person-you", "person-tomas"],
      status: "open",
      priority: "medium",
      createdAt: "2026-07-05T11:20:00+02:00",
      updatedAt: "2026-07-08T16:10:00+02:00",
    },
    {
      id: "issue-electricity",
      title: "Electrical-capacity change",
      personIds: ["person-you", "person-tomas"],
      status: "resolved",
      priority: "medium",
      createdAt: "2026-07-06T09:00:00+02:00",
      updatedAt: "2026-07-14T15:30:00+02:00",
      resolvedAt: "2026-07-14T15:30:00+02:00",
    },
  ],
  commitments: [
    {
      id: "commitment-dishwasher",
      issueId: "issue-dishwasher",
      committerPersonId: "person-tomas",
      description: "Arrange a technician to repair the dishwasher.",
      status: "delayed",
      promisedAt: "2026-07-08T16:10:00+02:00",
      dueAt: "2026-07-17T17:00:00+02:00",
      source: {
        kind: "message",
        reference: "Property-manager message · 8 July",
      },
      sourceSituationId: "situation-repair-promise",
      statusHistory: [
        {
          status: "promised",
          changedAt: "2026-07-08T16:10:00+02:00",
          sourceReference: "Property-manager message · 8 July",
        },
        {
          status: "scheduled",
          changedAt: "2026-07-15T09:00:00+02:00",
          sourceReference: "Proposed appointment · 15 July",
        },
        {
          status: "delayed",
          changedAt: "2026-07-17T18:00:00+02:00",
          sourceReference: "User-confirmed outcome · 17 July",
        },
      ],
      userConfirmation: "confirmed",
      updatedAt: "2026-07-17T18:00:00+02:00",
    },
    {
      id: "commitment-tap",
      issueId: "issue-tap",
      committerPersonId: "person-tomas",
      description: "Have the loose kitchen tap checked.",
      status: "promised",
      promisedAt: "2026-07-08T16:10:00+02:00",
      dueAt: "2026-07-22T17:00:00+02:00",
      source: {
        kind: "message",
        reference: "Property-manager message · 8 July",
      },
      sourceSituationId: "situation-repair-promise",
      statusHistory: [
        {
          status: "promised",
          changedAt: "2026-07-08T16:10:00+02:00",
          sourceReference: "Property-manager message · 8 July",
        },
      ],
      userConfirmation: "confirmed",
      updatedAt: "2026-07-08T16:10:00+02:00",
    },
    {
      id: "commitment-electricity",
      issueId: "issue-electricity",
      committerPersonId: "person-tomas",
      description: "Arrange the requested electrical-capacity change.",
      status: "completed",
      promisedAt: "2026-07-06T09:00:00+02:00",
      dueAt: "2026-07-15T17:00:00+02:00",
      completedAt: "2026-07-14T15:30:00+02:00",
      source: {
        kind: "message",
        reference: "Property-manager message · 6 July",
      },
      sourceSituationId: "situation-electricity-completed",
      statusHistory: [
        {
          status: "promised",
          changedAt: "2026-07-06T09:00:00+02:00",
          sourceReference: "Property-manager message · 6 July",
        },
        {
          status: "completed",
          changedAt: "2026-07-14T15:30:00+02:00",
          sourceReference: "User-confirmed completion · 14 July",
        },
      ],
      userConfirmation: "confirmed",
      updatedAt: "2026-07-14T15:30:00+02:00",
    },
  ],
  selectedSituationIds: [
    "situation-repairs-reported",
    "situation-repair-promise",
    "situation-availability-sent",
    "situation-electricity-completed",
    "situation-first-visit-unconfirmed",
  ],
  patternEvidenceAdjustments: {},
};

export function createDemoCase() {
  return structuredClone(DEMO_CASE);
}

export function createPatternDemoCase() {
  return structuredClone(PATTERN_DEMO_CASE);
}

export function createCommitmentDemoCase() {
  return structuredClone(COMMITMENT_DEMO_CASE);
}

export function createBlankCase() {
  return {
    id: "local-personal-workspace",
    title: "My relationship context",
    incoming: {
      id: "incoming-local",
      senderPersonId: "",
      text: "",
      receivedAt: new Date().toISOString(),
      source: "User entry",
    },
    currentGoal: "warm_boundary",
    desiredTone: "warm",
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
    ],
    relationshipConnections: [],
    claims: [],
    situations: [],
    issues: [],
    commitments: [],
    captures: [],
    selectedSituationIds: [],
    patternEvidenceAdjustments: {},
  };
}

export function retrieveRelevantContext({
  caseData,
  senderId,
  selectedSituationIds = [],
}) {
  const person = caseData.people.find((item) => item.id === senderId) || null;
  const selected = new Set(selectedSituationIds);
  const situations = caseData.situations
    .filter(
      (item) =>
        selected.has(item.id) &&
        item.personIds.includes(senderId) &&
        item.personIds.includes("person-you"),
    )
    .sort(
      (left, right) =>
        contextualRecordTime(left) - contextualRecordTime(right),
    );
  const situationIds = new Set(situations.map((item) => item.id));
  const claims = caseData.claims.filter(
    (claim) =>
      situationIds.has(claim.situationId) &&
      claim.personIds.includes(senderId) &&
      claim.personIds.includes("person-you"),
  );
  const commitments = (caseData.commitments || []).filter(
    (commitment) => commitment.committerPersonId === senderId,
  );
  const commitmentIssueIds = new Set(
    commitments.map((commitment) => commitment.issueId).filter(Boolean),
  );
  const issues = (caseData.issues || []).filter(
    (issue) =>
      commitmentIssueIds.has(issue.id) &&
      (!Array.isArray(issue.personIds) ||
        (issue.personIds.includes(senderId) &&
          issue.personIds.includes("person-you"))),
  );

  return { person, situations, claims, commitments, issues };
}

export function buildContextResult({
  caseData,
  message,
  senderId,
  selectedSituationIds,
  goal,
  desiredTone,
}) {
  const safeGoal = GOALS.has(goal) ? goal : "warm_boundary";
  const safeTone = TONES.has(desiredTone) ? desiredTone : "warm";
  const cleanMessage = String(message || "").trim();
  const context = retrieveRelevantContext({
    caseData,
    senderId,
    selectedSituationIds,
  });
  const personName = context.person?.displayName || "the sender";
  const intent = analyzeMessageIntent(cleanMessage);
  const merlinInsight = buildPatternInsight({
    caseData,
    senderId,
    selectedSituationIds,
    goal: safeGoal,
    tone: safeTone,
  });
  let relevantClaims = context.claims.filter((claim) =>
    isClaimRelevantToIntent(claim, intent),
  );
  if (merlinInsight) {
    const selected = new Set(selectedSituationIds);
    relevantClaims = caseData.claims.filter((claim) =>
      selected.has(claim.situationId),
    );
  }
  const claimIds = new Set(relevantClaims.map((claim) => claim.id));
  const hasAvailability = claimIds.has("claim-availability");
  const hasNoUrgency = claimIds.has("claim-deadline");
  const hasPriorPhrase = claimIds.has("claim-prior-phrase");
  const boundaries = context.person?.boundaries?.filter(Boolean) || [];
  const boundary = findRelevantBoundary(boundaries, intent);
  const hasBoundary = Boolean(boundary);
  const closeness = context.person?.closeness ?? 0;
  const trust = context.person?.trust ?? 0;
  const currentState = context.person?.currentState || "";
  const relationshipGoal = context.person?.relationshipGoals?.[0] || "";
  const cautiousProfile =
    /\b(strained|paused|distant|uncertain|conflict|repair|professional|slow|cautious)\b/i.test(
      `${currentState} ${relationshipGoal}`,
    );

  const generic = buildGenericReading({
    intent,
    goal: safeGoal,
  });
  const commitmentInsight = buildCommitmentInsight({
    caseData,
    context,
    personName,
    goal: safeGoal,
    tone: safeTone,
    boundary,
  });
  const responseOptions = merlinInsight?.responseOptions?.length
    ? merlinInsight.responseOptions
    : commitmentInsight?.responseOptions?.length
      ? commitmentInsight.responseOptions
    : buildResponseOptions({
        intent,
        personName,
        goal: safeGoal,
        tone: safeTone,
        closeness,
        trust,
        cautiousProfile,
        hasAvailability,
        hasNoUrgency,
        hasBoundary,
        boundary,
      });
  const contextualDraft =
    responseOptions.find((option) => option.recommended)?.text ||
    responseOptions[0]?.text ||
    "";

  const contextBasis = [
    {
      id: `relationship-${senderId}`,
      text:
        `${context.person?.relationshipType || "Relationship type not set"} · ` +
        `${currentState || "state not set"} · closeness ${closeness}/4 · trust ${trust}/4`,
      source: `${personName} relationship profile`,
      kind: "relationship",
    },
    ...relevantClaims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      source: claim.source.reference,
      kind: "situation",
    })),
    ...context.commitments.map((commitment) => {
      const issue = context.issues.find(
        (item) => item.id === commitment.issueId,
      );
      return {
        id: commitment.id,
        text:
          `${issue?.title || commitment.description} · ` +
          `${humanizeCommitmentStatus(commitment.status)}`,
        source: commitment.source?.reference || "User-confirmed commitment",
        kind: "commitment",
      };
    }),
  ];
  if (hasBoundary) {
    contextBasis.push({
      id: `boundary-${senderId}`,
      text: boundary,
      source: `${personName} relationship profile`,
      kind: "relationship",
    });
  }
  if (relationshipGoal) {
    contextBasis.push({
      id: `relationship-goal-${senderId}`,
      text: relationshipGoal,
      source: "User’s relationship goal",
      kind: "relationship",
    });
  }

  const contextualReading = merlinInsight
    ? {
        text:
          merlinInsight.contextualInterpretation || merlinInsight.summary,
        confidence: "mixed",
        confidenceLabel:
          merlinInsight.contextualConfidenceLabel ||
          "pattern support · moderate; motive · low",
      }
    : commitmentInsight
      ? {
          text: commitmentInsight.interpretation,
          confidence: "high",
          confidenceLabel: "record status · high; motive · not inferred",
        }
    : buildContextualInterpretation({
        intent,
        personName,
        hasPriorPhrase,
        closeness,
        trust,
      });
  const epistemic = buildEpistemicLayer({
    intent,
    personName,
    cleanMessage,
    relevantClaims,
    hasPriorPhrase,
    commitments: context.commitments,
    issues: context.issues,
  });

  return {
    generic,
    contextual: {
      label: "With selected Second Mind context",
      interpretation: contextualReading.text,
      draft: contextualDraft,
      responseOptions,
      confidence: contextualReading.confidence,
      confidenceLabel: contextualReading.confidenceLabel,
      basis: contextBasis,
      explanation: buildContextExplanation({
        intent,
        personName,
        relationshipType: context.person?.relationshipType || "",
        currentState,
        relationshipGoal,
        cautiousProfile,
        hasPriorPhrase,
        hasAvailability,
        hasNoUrgency,
        hasBoundary,
        closeness,
        trust,
        relevantSituationCount: relevantClaims.length,
        commitmentInsight,
      }),
    },
    retrievedContext: {
      person: context.person,
      situations: context.situations,
      claims: context.claims,
      commitments: context.commitments,
      issues: context.issues,
    },
    epistemic,
    merlinInsight,
    commitmentInsight,
    meta: {
      source: "local-context-demo",
      ephemeral: true,
      paidApiUsed: false,
      intentCategory: intent.category,
      explicitIntentDetected: intent.explicit,
    },
  };
}

function buildCommitmentInsight({
  caseData,
  context,
  personName,
  goal,
  tone,
  boundary,
}) {
  if (!context.commitments.length) return null;

  const referenceTime = new Date(
    caseData.incoming?.receivedAt || new Date().toISOString(),
  ).getTime();
  const issueById = new Map(context.issues.map((issue) => [issue.id, issue]));
  const commitments = context.commitments
    .map((commitment) => {
      const dueAt = commitment.dueAt
        ? new Date(commitment.dueAt).getTime()
        : null;
      return {
        ...commitment,
        issueTitle:
          issueById.get(commitment.issueId)?.title || commitment.description,
        overdue:
          !CLOSED_COMMITMENT_STATUSES.has(commitment.status) &&
          Number.isFinite(dueAt) &&
          dueAt < referenceTime,
      };
    })
    .sort(
      (left, right) =>
        contextualRecordTime(left) - contextualRecordTime(right),
    );
  const open = commitments.filter(
    (commitment) => !CLOSED_COMMITMENT_STATUSES.has(commitment.status),
  );
  const completed = commitments.filter(
    (commitment) => commitment.status === "completed",
  );
  const exceptions = open.filter((commitment) =>
    ["delayed", "missed", "disputed"].includes(commitment.status),
  );
  const openTitles = open.map((commitment) => commitment.issueTitle);
  const openList = formatNaturalList(openTitles);
  const statusList = open
    .map(
      (commitment) =>
        `${commitment.issueTitle} (${humanizeCommitmentStatus(commitment.status)})`,
    )
    .join("; ");
  const appointmentLanguage =
    /\b(?:appointment|technician|visit|tomorrow|come at|arranged)\b/i.test(
      caseData.incoming?.text || "",
    );
  const coordinateText = appointmentLanguage
    ? `Thanks, ${firstNameFromDisplayName(personName)}. Please confirm the appointment with me before it is treated as agreed. ${openList ? `For clarity, ${openList} ${open.length === 1 ? "remains" : "remain"} open.` : ""}`.trim()
    : `Thanks, ${firstNameFromDisplayName(personName)}. Please confirm the next dated step for ${openList || "the outstanding item"}.`;
  const boundaryText = boundary
    ? `Thanks, ${firstNameFromDisplayName(personName)}. I’m keeping to the arrangement I recorded: ${ensureSentence(boundary)} ${openList ? `${capitalize(openList)} ${open.length === 1 ? "remains" : "remain"} open.` : ""}`
    : coordinateText;
  const recordText =
    `For clarity, my current record shows: ${statusList || "no open commitments"}. ` +
    "Please confirm any correction and the next dated step.";
  const statusText =
    open.length === 1
      ? `Can you confirm the current status and next dated step for ${openList}?`
      : `Can you confirm the current status and next dated step for each of these items: ${openList}?`;
  const recommended =
    goal === "create_record"
      ? "create-record"
      : goal === "clarify_intent"
        ? "ask-status"
        : goal === "warm_boundary" || goal === "keep_distance"
          ? "restate-boundary"
          : "coordinate";
  const responseOptions = markRecommended(
    [
      {
        id: "coordinate",
        label: "Coordinate the next step",
        text: coordinateText,
        why:
          "Requests confirmation while naming the unresolved work from the structured record.",
      },
      {
        id: "create-record",
        label: "Create a factual record",
        text: recordText,
        why:
          "States the recorded statuses without making a claim about motive or fault.",
      },
      {
        id: "restate-boundary",
        label: "Restate the arrangement",
        text: boundaryText,
        why: boundary
          ? "Uses the user’s recorded scheduling boundary."
          : "Keeps the reply limited to confirmation and outstanding work.",
      },
      {
        id: "ask-status",
        label: "Ask for exact status",
        text: statusText,
        why:
          "Seeks a dated operational update instead of reconstructing intent.",
      },
    ],
    tone === "direct" && goal === "coordinate_practical"
      ? "coordinate"
      : recommended,
  );

  return {
    title:
      open.length === 1
        ? `One commitment with ${personName} remains open.`
        : `${open.length} commitments with ${personName} remain open.`,
    interpretation:
      `${open.length} of ${commitments.length} recorded commitments remain open` +
      `${exceptions.length ? `; ${exceptions.length} ${exceptions.length === 1 ? "has" : "have"} a delayed, missed, or disputed status` : ""}. ` +
      "This supports a coordination and follow-through concern. It does not establish why the other person acted this way.",
    commitments,
    openCount: open.length,
    completedCount: completed.length,
    exceptionCount: exceptions.length,
    overdueCount: open.filter((commitment) => commitment.overdue).length,
    responseOptions,
    outstandingReport: buildOutstandingReport({
      personName,
      commitments,
      referenceTime,
    }),
  };
}

function buildOutstandingReport({ personName, commitments, referenceTime }) {
  const lines = [
    `Outstanding-items report · ${personName}`,
    `As of ${new Date(referenceTime).toISOString().slice(0, 10)}`,
    "",
  ];
  for (const commitment of commitments) {
    const due = commitment.dueAt
      ? new Date(commitment.dueAt).toISOString().slice(0, 10)
      : "not set";
    lines.push(
      `- ${commitment.issueTitle}: ${humanizeCommitmentStatus(commitment.status)} · due ${due}`,
      `  Commitment: ${commitment.description}`,
      `  Source: ${commitment.source?.reference || "User entry"}`,
    );
  }
  lines.push(
    "",
    "AI note: This report records user-confirmed states and sources. It does not determine motive, fault, or legal responsibility.",
  );
  return lines.join("\n");
}

function humanizeCommitmentStatus(status) {
  return {
    mentioned: "Mentioned",
    promised: "Promised",
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    delayed: "Delayed",
    cancelled: "Cancelled",
    missed: "Missed",
    completed: "Completed",
    disputed: "Disputed",
  }[status] || "Status not set";
}

function formatNaturalList(items) {
  const values = items.filter(Boolean);
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function firstNameFromDisplayName(name) {
  return String(name || "there").trim().split(/\s+/)[0] || "there";
}

function ensureSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function capitalize(text) {
  const value = String(text || "");
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "";
}

function buildPatternInsight({
  caseData,
  senderId,
  selectedSituationIds = [],
  goal,
  tone,
}) {
  const selected = new Set(selectedSituationIds);
  const model =
    normalizePatternModel(caseData.patternModel) ||
    inferPatternModel({ caseData, senderId, selected });
  if (!model) return null;

  const hypotheses = model.hypotheses;
  const situationsById = new Map(
    caseData.situations.map((situation) => [situation.id, situation]),
  );
  const claimsBySituation = new Map();
  for (const claim of caseData.claims) {
    const claims = claimsBySituation.get(claim.situationId) || [];
    claims.push(claim);
    claimsBySituation.set(claim.situationId, claims);
  }
  const weights = Object.fromEntries(
    hypotheses.map((hypothesis) => [hypothesis.id, hypothesis.prior]),
  );
  const evidenceDefinitions = model.evidence
    .filter((item) => situationsById.has(item.situationId))
    .sort(
      (left, right) =>
        contextualRecordTime(situationsById.get(left.situationId)) -
        contextualRecordTime(situationsById.get(right.situationId)),
    );
  const firstEvidenceAt =
    situationsById.get(evidenceDefinitions[0]?.situationId)?.occurredAt ||
    new Date().toISOString();
  const trend = [
    {
      label: "Starting priors",
      chartLabel: "Prior",
      occurredAt: firstEvidenceAt,
      probabilities: normalizeHypothesisWeights(weights),
    },
  ];
  const evidence = [];

  for (const item of evidenceDefinitions) {
    if (!selected.has(item.situationId)) continue;
    const situation = situationsById.get(item.situationId);
    const adjustment = normalizeEvidenceAdjustment(
      caseData.patternEvidenceAdjustments?.[item.situationId],
    );
    for (const hypothesis of hypotheses) {
      const multiplier = safeLikelihoodMultiplier(
        item.multipliers[hypothesis.id],
      );
      weights[hypothesis.id] *= multiplier ** adjustment.weight;
    }
    const probabilities = normalizeHypothesisWeights(weights);
    const claims = claimsBySituation.get(item.situationId) || [];
    evidence.push({
      situationId: item.situationId,
      title: item.title || situation.title,
      occurredAt: item.occurredAt || situation.occurredAt,
      chartLabel: item.chartLabel || situation.title,
      observation:
        item.observation ||
        claims.map((claim) => claim.text).join(" ") ||
        "No written observation was supplied for this event.",
      effect: item.effect,
      caveat: item.caveat,
      adjustment: adjustment.id,
      adjustmentLabel: adjustment.label,
      effectiveWeight: adjustment.weight,
      likelihoodMultipliers: hypotheses.map((hypothesis) => ({
        id: hypothesis.id,
        label: hypothesis.label,
        shortLabel: hypothesis.shortLabel,
        colorIndex: hypothesis.colorIndex,
        value: safeLikelihoodMultiplier(item.multipliers[hypothesis.id]),
      })),
    });
    trend.push({
      label: item.title || situation.title,
      chartLabel: item.chartLabel || situation.title,
      occurredAt: item.occurredAt || situation.occurredAt,
      probabilities,
    });
  }

  const probabilities = normalizeHypothesisWeights(weights);
  const ranked = hypotheses
    .map((hypothesis) => ({
      ...hypothesis,
      probability: probabilities[hypothesis.id],
    }))
    .sort((left, right) => right.probability - left.probability);
  const leading = ranked[0];
  const runnerUp = ranked[1];
  const closeRace =
    runnerUp &&
    leading.probability - runnerUp.probability <
      (model.closeThreshold || 0.12);
  const responseOptions = buildPatternResponseOptions({
    model,
    goal,
    tone,
  });

  return {
    modelSource: model.source,
    eyebrow: model.eyebrow || "MERLIN PATTERN",
    title: formatPatternText(
      model.title || "Merlin noticed a pattern worth examining.",
      { caseData, model, senderId },
    ),
    summary:
      `${leading.label} is the leading illustrative hypothesis at ${formatProbability(leading.probability)}, ` +
      `${closeRace ? `but ${runnerUp.label.toLowerCase()} remains close at ${formatProbability(runnerUp.probability)}.` : "but the available evidence is still sparse."} ` +
      "This is a prompt to clarify, not a conclusion about either person.",
    confidenceLabel: closeRace
      ? "Competing explanations remain close"
      : "One explanation leads, with substantial uncertainty",
    hypotheses: ranked,
    evidence,
    trend,
    excludedEvidence: model.excludedEvidence.filter((item) =>
      selected.has(item.situationId),
    ),
    calibration: model.calibration,
    nextBestQuestion: model.nextBestQuestion,
    contextualInterpretation: model.contextualInterpretation,
    contextualConfidenceLabel: model.confidenceLabel,
    responseOptions,
  };
}

function formatPatternText(text, { caseData, model, senderId }) {
  const focusNames = (model.focusPersonIds || [])
    .map(
      (personId) =>
        caseData.people.find((person) => person.id === personId)?.displayName,
    )
    .filter(Boolean);
  const senderName =
    caseData.people.find((person) => person.id === senderId)?.displayName ||
    "the sender";
  return String(text)
    .replaceAll("{focusA}", focusNames[0] || senderName)
    .replaceAll("{focusB}", focusNames[1] || "the other person")
    .replaceAll("{sender}", senderName);
}

function normalizePatternModel(input) {
  if (!input || typeof input !== "object") return null;
  const hypotheses = Array.isArray(input.hypotheses)
    ? input.hypotheses
        .filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.label === "string" &&
            Number(item.prior) > 0,
        )
        .slice(0, 5)
        .map((item, index) => ({
          id: item.id,
          label: item.label,
          shortLabel: item.shortLabel || item.label,
          prior: Number(item.prior),
          description: item.description || "",
          colorIndex: index,
        }))
    : [];
  if (hypotheses.length < 2 || !Array.isArray(input.evidence)) return null;
  const hypothesisIds = new Set(hypotheses.map((item) => item.id));
  const evidence = input.evidence
    .filter(
      (item) =>
        item &&
        typeof item.situationId === "string" &&
        item.multipliers &&
        [...hypothesisIds].every((id) =>
          Number.isFinite(Number(item.multipliers[id])),
        ),
    )
    .map((item) => ({
      ...item,
      multipliers: Object.fromEntries(
        hypotheses.map((hypothesis) => [
          hypothesis.id,
          safeLikelihoodMultiplier(item.multipliers[hypothesis.id]),
        ]),
      ),
    }));
  if (!evidence.length) return null;

  return {
    ...input,
    source: "declared",
    hypotheses,
    evidence,
    excludedEvidence: Array.isArray(input.excludedEvidence)
      ? input.excludedEvidence
      : [],
    calibration:
      input.calibration ||
      "Illustrative Bayesian update using transparent, user-visible assumptions. These values are not calibrated outcome predictions.",
    nextBestQuestion:
      input.nextBestQuestion ||
      "Ask what happened before deciding which interpretation fits.",
  };
}

function inferPatternModel({ caseData, senderId, selected }) {
  const connection = (caseData.relationshipConnections || []).find(
    (item) =>
      item.fromPersonId === senderId || item.toPersonId === senderId,
  );
  if (!connection) return null;
  const otherPersonId =
    connection.fromPersonId === senderId
      ? connection.toPersonId
      : connection.fromPersonId;
  const sender = caseData.people.find((person) => person.id === senderId);
  const other = caseData.people.find((person) => person.id === otherPersonId);
  if (!sender || !other) return null;

  const candidateSituations = caseData.situations
    .filter(
      (situation) =>
        selected.has(situation.id) &&
        situation.personIds.includes(senderId) &&
        situation.personIds.includes(otherPersonId),
    )
    .sort(
      (left, right) =>
        contextualRecordTime(left) - contextualRecordTime(right),
    );
  if (candidateSituations.length < 2) return null;

  const evidence = candidateSituations.map((situation) =>
    inferEvidenceDefinition(caseData, situation),
  );
  const includedSituationIds = new Set(
    candidateSituations.map((situation) => situation.id),
  );
  const excludedEvidence = caseData.situations
    .filter(
      (situation) =>
        selected.has(situation.id) && !includedSituationIds.has(situation.id),
    )
    .map((situation) => ({
      situationId: situation.id,
      label: situation.title,
      reason: `This event does not directly include both ${sender.displayName} and ${other.displayName}.`,
    }));

  return {
    source: "local-pattern-rules",
    eyebrow: "MERLIN PATTERN",
    title: `A recurring dynamic may involve ${sender.displayName} and ${other.displayName}.`,
    closeThreshold: 0.15,
    hypotheses: [
      {
        id: "affiliation",
        label: "Affiliation or personal interest",
        shortLabel: "Affiliation",
        prior: 0.3,
        description:
          "The pattern may reflect attention, warmth, curiosity, or a wish for greater connection.",
        colorIndex: 0,
      },
      {
        id: "friction",
        label: "Friction or discomfort",
        shortLabel: "Friction",
        prior: 0.35,
        description:
          "The pattern may reflect disagreement, avoidance, discomfort, or a strained interaction.",
        colorIndex: 1,
      },
      {
        id: "ordinary",
        label: "Ordinary coordination",
        shortLabel: "Ordinary",
        prior: 0.35,
        description:
          "The events may be ordinary social or logistical choices without a deeper dynamic.",
        colorIndex: 2,
      },
    ],
    evidence,
    excludedEvidence,
    calibration:
      "Local pattern rules found repeated multi-person events and applied transparent illustrative likelihoods. They are prompts for reflection, not empirically calibrated relationship predictions.",
    nextBestQuestion:
      `Ask ${sender.displayName} what concern or context they want you to understand about ${other.displayName}, without supplying a motive for them.`,
    contextualInterpretation:
      `The selected history repeatedly connects ${sender.displayName} and ${other.displayName}. That supports asking whether there is an unresolved dynamic, but it does not establish attraction, conflict, or intent.`,
    confidenceLabel: "recurring connection · moderate; motive · low",
    responseOptions: [
      {
        id: "ask-directly",
        label: "Ask what happened",
        text:
          `I don’t want to guess what is happening between you and ${other.displayName}. Is there something specific you want me to understand?`,
        why:
          "Asks for relevant evidence without treating Merlin’s hypothesis as fact.",
      },
      {
        id: "avoid-triangle",
        label: "Avoid becoming the go-between",
        text:
          `I’m willing to hear your concern, but I don’t want to manage something between you and ${other.displayName}. Could you speak with them directly?`,
        why:
          "Keeps the user from becoming the default intermediary.",
      },
      {
        id: "preserve-agency",
        label: "Keep the decision yours",
        text:
          "I’ll make my own decision, but I’m open to hearing any specific context that affects it.",
        why:
          "Preserves the user’s agency while leaving room for relevant information.",
      },
      {
        id: "pause",
        label: "Pause before acting",
        text: "I’ve heard you. I want to think before I decide what to do.",
        why:
          "Creates time without endorsing any interpretation.",
      },
    ],
    recommendedByGoal: {
      warm_boundary: "ask-directly",
      clarify_intent: "ask-directly",
      keep_distance: "preserve-agency",
      welcome_connection: "pause",
    },
  };
}

function inferEvidenceDefinition(caseData, situation) {
  const claims = caseData.claims.filter(
    (claim) => claim.situationId === situation.id,
  );
  const text = claims.map((claim) => claim.text).join(" ").toLowerCase();
  const multipliers = { affiliation: 1, friction: 1, ordinary: 1 };
  const signals = [];

  if (/\b(delet(?:e|ed)|unsent|removed the message|took it back)\b/i.test(text)) {
    multipliers.affiliation *= 1.5;
    multipliers.friction *= 1.2;
    multipliers.ordinary *= 0.75;
    signals.push("withdrawn communication");
  }
  if (/\b(heard from|ask(?:ed)? about|mention(?:ed)?|checking on)\b/i.test(text)) {
    multipliers.affiliation *= 1.4;
    multipliers.ordinary *= 0.9;
    signals.push("person-specific attention");
  }
  if (
    /\b(don['’]?t invite|not invite|leave .* out|exclude|avoid|stay away)\b/i.test(
      text,
    )
  ) {
    multipliers.affiliation *= 1.15;
    multipliers.friction *= 2;
    multipliers.ordinary *= 0.65;
    signals.push("social exclusion or avoidance");
  }
  if (/\b(warm|sweet|kind|affection|flirt|close)\b/i.test(text)) {
    multipliers.affiliation *= 1.45;
    multipliers.friction *= 0.8;
    signals.push("warmth or affiliation");
  }
  if (
    /\b(argu(?:e|ed)|conflict|upset|uncomfortable|ignored|hurt|angry|tense)\b/i.test(
      text,
    )
  ) {
    multipliers.affiliation *= 0.75;
    multipliers.friction *= 2.2;
    multipliers.ordinary *= 0.7;
    signals.push("reported friction");
  }
  if (/\b(schedule|plan|logistics|group|timing|available)\b/i.test(text)) {
    multipliers.ordinary *= 1.4;
    signals.push("ordinary coordination");
  }
  if (!signals.length) {
    multipliers.ordinary = 1.1;
    signals.push("repeated co-occurrence");
  }

  return {
    situationId: situation.id,
    chartLabel: truncatePatternLabel(situation.title),
    effect: `Detected ${signals.join(" and ")}`,
    caveat:
      "This event is user-recorded context. Co-occurrence and wording can support questions, but they do not establish motive.",
    multipliers,
  };
}

function normalizeEvidenceAdjustment(value) {
  if (value === "exclude" || Number(value) === 0) {
    return { id: "exclude", label: "Excluded by you", weight: 0 };
  }
  if (value === "downweight" || Number(value) === 0.5) {
    return { id: "downweight", label: "Downweighted by you", weight: 0.5 };
  }
  return { id: "full", label: "Used as recorded", weight: 1 };
}

function safeLikelihoodMultiplier(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 1;
}

function truncatePatternLabel(value) {
  const text = String(value || "Event").trim();
  return text.length <= 12 ? text : `${text.slice(0, 11)}…`;
}

function buildPatternResponseOptions({ model, goal, tone }) {
  if (!Array.isArray(model.responseOptions) || !model.responseOptions.length) {
    return [];
  }
  const recommended =
    model.recommendedByGoal?.[goal] ||
    (tone === "direct" ? "preserve-agency" : model.responseOptions[0].id);
  return markRecommended(
    model.responseOptions.map((option) => ({ ...option })),
    recommended,
  );
}

function normalizeHypothesisWeights(weights) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [
      key,
      total ? value / total : 0,
    ]),
  );
}

function formatProbability(value) {
  return `${Math.round(value * 100)}%`;
}

function analyzeMessageIntent(message) {
  const text = message.toLowerCase();
  const physicalAction =
    message.match(
      /\b(?:i\s+(?:want|would like|wish|need|would love)\s+to|i['’]d\s+(?:like|love)\s+to|can i|could i|may i)\s+(?:really\s+)?(hug|hold|cuddle|kiss)\s+you\b(?!\s+accountable)/i,
    ) ||
    message.match(
      /\b(?:i\s+(?:want|would like|need)|i['’]d\s+like)\s+(?:a\s+)?(hug|cuddle)\b/i,
    );

  if (physicalAction) {
    const action = physicalAction[1]?.toLowerCase() || "hug";
    const gesture = physicalGesture(action);
    return {
      category: "physical_affection",
      action,
      gesture,
      explicit: true,
      explicitFact: `The message explicitly states a desire for ${gesture}.`,
    };
  }

  if (/\b(?:i miss you|i love you|i care about you|thinking of you)\b/i.test(message)) {
    return {
      category: "emotional_affection",
      explicit: true,
      explicitFact: "The message explicitly expresses affection, care, or longing.",
    };
  }

  if (
    /\b(?:would you like to|do you want to|can we|could we|shall we)\b/i.test(
      message,
    ) ||
    /\b(?:meet|come over|hang out|grab (?:coffee|lunch|dinner))\b[^.?!]*\?/i.test(
      text,
    )
  ) {
    return {
      category: "invitation",
      explicit: true,
      explicitFact: "The message explicitly proposes or explores spending time together.",
    };
  }

  if (
    /\b(?:i['’]?m sorry (?:i|for|about my)|i apologise|i apologize|my apologies)\b/i.test(
      message,
    )
  ) {
    return {
      category: "apology",
      explicit: true,
      explicitFact: "The message explicitly offers an apology.",
    };
  }

  if (
    /\b(?:please don['’]?t|do not (?:call|contact|touch|message|visit|ask|share|invite)|don['’]?t (?:call|contact|touch|message|visit|ask|share|invite)|stop\b|i (?:can['’]?t|cannot|won['’]?t) (?:do|continue|meet|talk|help|attend|accept|agree|come|make|take|be|stay|discuss)|i don['’]?t want to|i need (?:space|distance)|i['’]?m not comfortable)\b/i.test(
      message,
    )
  ) {
    return {
      category: "boundary",
      explicit: true,
      explicitFact: "The message explicitly sets a limit, declines something, or asks for space.",
    };
  }

  if (/\b(?:thank you|thanks|i appreciate|grateful)\b/i.test(message)) {
    return {
      category: "gratitude",
      explicit: true,
      explicitFact: "The message explicitly expresses thanks or appreciation.",
    };
  }

  if (
    /\b(?:how are you|how have you been|are you (?:okay|ok|alright)|how did .* go)\b/i.test(
      message,
    )
  ) {
    return {
      category: "check_in",
      explicit: true,
      explicitFact: "The message explicitly checks in on the user’s experience or wellbeing.",
    };
  }

  if (
    /\b(?:i['’]?m here for you|i can help|can i help|let me know (?:if|how) i can help|you can talk to me)\b/i.test(
      message,
    )
  ) {
    return {
      category: "support_offer",
      explicit: true,
      explicitFact: "The message explicitly offers emotional or practical support.",
    };
  }

  if (
    /\b(?:i['’]?m|i am|i feel|feeling)\s+(?:overwhelmed|upset|sad|lost|anxious|worried|exhausted)\b/i.test(
      message,
    ) ||
    /\b(?:bad news|hard time|need help|don['’]?t know what to do)\b/i.test(message)
  ) {
    return {
      category: "distress",
      explicit: true,
      explicitFact: "The message explicitly reports difficulty, distress, or a need for support.",
    };
  }

  if (
    /\b(?:i felt|i feel)\s+(?:dismissed|ignored|hurt|disrespected|frustrated|angry)\b/i.test(
      message,
    ) ||
    /\b(?:you always|you never|disappointed in you|why did you)\b/i.test(message)
  ) {
    return {
      category: "conflict",
      explicit: true,
      explicitFact: "The message explicitly raises hurt, frustration, criticism, or a relational concern.",
    };
  }

  if (
    /\b(?:great news|good news|got approved|was accepted|got promoted|i won|i passed|we did it|i['’]?m so excited)\b/i.test(
      message,
    )
  ) {
    return {
      category: "celebration",
      explicit: true,
      explicitFact: "The message explicitly shares a positive event or achievement.",
    };
  }

  if (
    /\b(?:i(?:['’]ve| have) decided|my decision is|i think we should|we need to decide|i propose)\b/i.test(
      message,
    )
  ) {
    return {
      category: "decision",
      explicit: true,
      explicitFact: "The message explicitly communicates a decision or proposal.",
    };
  }

  if (
    /\b(?:just letting you know|just wanted to let you know|fyi|for your information|the (?:deadline|meeting|plan|time|date) (?:is|has|was)|has been moved|has changed)\b/i.test(
      message,
    )
  ) {
    return {
      category: "update",
      explicit: true,
      explicitFact: "The message explicitly provides an update or new information.",
    };
  }

  if (
    /\?\s*$/.test(message) ||
    /^(?:can|could|would|will|do|are|is)\b/i.test(message) ||
    /\bplease\s+(?:confirm|send|share|reply|provide|arrange|check|let me know)\b/i.test(
      message,
    )
  ) {
    return {
      category: "request",
      explicit: true,
      explicitFact: "The message explicitly asks a question or makes a request.",
    };
  }

  return {
    category: "ambiguous",
    explicit: false,
    explicitFact: "",
  };
}

function isClaimRelevantToIntent(claim, intent) {
  if (intent.category === "ambiguous") return true;
  const text = claim.text.toLowerCase();
  const patterns = {
    physical_affection: /\b(hug|hold|touch|physical|affection|comfort|cuddle|kiss)\b/,
    emotional_affection: /\b(affection|care|miss|love|emotional|feeling)\b/,
    invitation: /\b(meet|plan|schedule|available|availability|coffee|dinner|visit)\b/,
    apology: /\b(apolog|sorry|conflict|hurt|accountab|repair)\b/,
    request: /\b(request|ask|question|needed|deadline|availability)\b/,
    boundary: /\b(boundar|limit|space|distance|comfortable|contact|communication|invite)\b/,
    gratitude: /\b(thank|appreciat|support|help|kind)\b/,
    check_in: /\b(wellbeing|health|feeling|yesterday|experience|check)\b/,
    support_offer: /\b(support|help|need|practical|listen|talk)\b/,
    distress: /\b(distress|hard|hurt|sad|anxious|overwhelm|support|help)\b/,
    conflict: /\b(conflict|hurt|dismiss|ignore|frustrat|repair|accountab)\b/,
    celebration: /\b(achievement|approved|accept|promot|celebrat|success|good news)\b/,
    decision: /\b(decision|proposal|option|criteria|plan|choose)\b/,
    update: /\b(update|deadline|meeting|plan|schedule|changed|moved)\b/,
  };
  return patterns[intent.category]?.test(text) || false;
}

function findRelevantBoundary(boundaries, intent) {
  if (!boundaries.length) return "";
  const patterns = {
    physical_affection: /\b(hugs?|holding|touch(?:ing)?|physical|contact|affection|cuddl(?:e|ing)|kiss(?:ing)?)\b/i,
    emotional_affection: /\b(emotional|affection|romantic|love|personal)\b/i,
    invitation: /\b(meet|visit|home|time|after|before|work|available|availability)\b/i,
    apology: /\b(conflict|contact|communication|apolog|repair)\b/i,
    request: /\b(contact|communication|work|time|after|before|request)\b/i,
    boundary: /\b(contact|communication|work|time|after|before|space|distance)\b/i,
    check_in: /\b(personal|health|emotional|private|space)\b/i,
    support_offer: /\b(help|support|contact|personal|private)\b/i,
    distress: /\b(help|support|contact|personal|private|capacity)\b/i,
    conflict: /\b(conflict|communication|contact|respect|space|time)\b/i,
    decision: /\b(work|decision|commit|money|time|deadline)\b/i,
    update: /\b(work|time|after|before|deadline|communication)\b/i,
  };
  const pattern = patterns[intent.category];
  if (pattern) {
    const matching = boundaries.find((item) => pattern.test(item));
    if (matching) return matching;
  }
  return intent.category === "ambiguous" ? boundaries[0] : "";
}

function buildGenericReading({ intent, goal }) {
  if (intent.category === "physical_affection") {
    return {
      label: "Without relationship context",
      interpretation:
        `The desire for ${intent.gesture} is explicit. The message alone does not establish whether it is friendly, comforting, romantic, or playful—or whether the contact is welcome.`,
      draft:
        goal === "clarify_intent"
          ? `That sounds affectionate — what does ${intent.gesture} mean to you?`
          : goal === "keep_distance"
            ? "I appreciate you saying that."
            : "That’s sweet of you to say.",
      confidence: "mixed",
      confidenceLabel: "stated action · high; motive · low",
      basis: ["The incoming message only"],
    };
  }

  if (intent.category === "emotional_affection") {
    return {
      label: "Without relationship context",
      interpretation:
        "The affection is explicit, but its desired outcome and the kind of relationship the sender has in mind are not.",
      draft:
        goal === "clarify_intent"
          ? "Thank you for saying that. What brought it to mind?"
          : "Thank you for telling me.",
      confidence: "mixed",
      confidenceLabel: "expressed feeling · high; desired outcome · low",
      basis: ["The incoming message only"],
    };
  }

  if (intent.category === "invitation") {
    return {
      label: "Without relationship context",
      interpretation:
        "The proposal to spend time together is explicit. The message alone may not establish whether the invitation is practical, friendly, or romantic.",
      draft:
        goal === "clarify_intent"
          ? "I may be interested. What did you have in mind?"
          : "Thanks for asking — let me check and get back to you.",
      confidence: "moderate",
      basis: ["The incoming message only"],
    };
  }

  if (intent.category === "apology") {
    return {
      label: "Without relationship context",
      interpretation:
        "An apology is explicit. Its completeness, accountability, and hoped-for outcome require more context.",
      draft: "Thank you for apologising. I’d like a little time to think about it.",
      confidence: "moderate",
      basis: ["The incoming message only"],
    };
  }

  if (intent.category === "request") {
    return {
      label: "Without relationship context",
      interpretation:
        "A question or request is explicit, but the relationship context may change how direct, warm, or detailed the response should be.",
      draft: "Thanks for asking — let me think about that and get back to you.",
      confidence: "moderate",
      basis: ["The incoming message only"],
    };
  }

  const general = {
    boundary: {
      interpretation:
        "A limit or refusal is explicit. The reason, permanence, and desired future contact may still be unclear.",
      draft: "I understand. I’ll respect that.",
      confidence: "moderate",
    },
    gratitude: {
      interpretation:
        "The appreciation is explicit. The message may be simple thanks or an invitation to a warmer exchange.",
      draft: "You’re very welcome — I’m glad I could be there.",
      confidence: "moderate",
    },
    check_in: {
      interpretation:
        "The check-in is explicit. The depth of answer the sender expects is not established.",
      draft: "Thanks for asking. I’m doing okay — how are you?",
      confidence: "moderate",
    },
    support_offer: {
      interpretation:
        "The offer of support is explicit. What kind of help is available and whether the user wants it remain open.",
      draft: "Thank you. I appreciate knowing the offer is there.",
      confidence: "moderate",
    },
    distress: {
      interpretation:
        "The difficulty is explicitly reported. The message does not establish whether the sender wants listening, reassurance, practical help, or space.",
      draft: "I’m sorry you’re dealing with that. Would listening or practical help be more useful right now?",
      confidence: "mixed",
      confidenceLabel: "reported difficulty · high; desired support · low",
    },
    conflict: {
      interpretation:
        "A concern or hurt is explicitly raised. The cause, responsibility, and best repair cannot be established from one message.",
      draft: "I hear that this affected you. I want to understand what felt most important.",
      confidence: "mixed",
      confidenceLabel: "reported concern · high; cause and repair · low",
    },
    celebration: {
      interpretation:
        "A positive event is explicitly shared. The relationship context can shape the warmth and depth of the response.",
      draft: "That’s wonderful news — congratulations!",
      confidence: "high",
    },
    decision: {
      interpretation:
        "A decision or proposal is explicit. Its rationale, flexibility, and consequences may require clarification.",
      draft: "Thanks for telling me. Can you walk me through what led you there?",
      confidence: "moderate",
    },
    update: {
      interpretation:
        "The update is explicit. Whether it requires acknowledgment, action, or discussion may remain unstated.",
      draft: "Thanks for the update. Does anything need to change on my side?",
      confidence: "moderate",
    },
  }[intent.category];
  if (general) {
    return {
      label: "Without relationship context",
      ...general,
      basis: ["The incoming message only"],
    };
  }

  return {
    label: "Without relationship context",
    interpretation:
      "The wording could be neutral, disappointed, or simply a way of ending the exchange. The message alone does not distinguish between those readings.",
    draft:
      goal === "clarify_intent"
        ? "Thanks — just checking, did you mean you’d prefer to leave it there, or revisit it later?"
        : "Thanks — I’ll come back to this tomorrow. Let me know if I misunderstood.",
    confidence: "low",
    basis: ["The incoming message only"],
  };
}

function buildResponseOptions({
  intent,
  personName,
  goal,
  tone,
  closeness,
  trust,
  cautiousProfile,
  hasAvailability,
  hasNoUrgency,
  hasBoundary,
  boundary,
}) {
  const styleCloseness = cautiousProfile ? Math.min(closeness, 2) : closeness;
  if (intent.category === "physical_affection") {
    const gesture = intent.gesture || physicalGesture(intent.action);
    const receptive =
      styleCloseness >= 3 && trust >= 2
        ? "I’d really like that too."
        : trust >= 2
          ? `That’s sweet of you. I’d be open to ${gesture} when we see each other.`
          : "That’s kind of you to say. I’d like to take things slowly, but I appreciate the warmth.";
    const warm =
      styleCloseness >= 3
        ? "That sounds lovely. I appreciate you saying it."
        : "That’s kind of you to say. I appreciate the thought.";
    const clarify =
      styleCloseness >= 3
        ? `That sounds affectionate — does ${gesture} mean you’re missing me, or trying to comfort me?`
        : `That sounds affectionate — what does ${gesture} mean to you?`;
    const boundaryText = hasBoundary
      ? `I appreciate the warmth. I want to keep to what I shared: ${normaliseBoundaryForReply(boundary)}`
      : `I appreciate the affection, but I’m not comfortable with ${gesture}.`;

    return markRecommended(
      [
        {
          id: "receptive",
          label: "Welcome it",
          text: receptive,
          why: `Warmer wording based on closeness ${closeness}/4 and trust ${trust}/4.`,
        },
        {
          id: "warm-no-commitment",
          label: "Acknowledge warmly",
          text: warm,
          why: "Recognises the affection without agreeing to physical contact.",
        },
        {
          id: "clarify",
          label: "Clarify the meaning",
          text: clarify,
          why: "Separates the explicit gesture from its still-uncertain motive.",
        },
        {
          id: "boundary",
          label: "Set a boundary",
          text: boundaryText,
          why: hasBoundary
            ? `Uses the physical-contact boundary in ${personName}’s profile.`
            : "Provides a clear option if the contact is not welcome.",
        },
      ],
      hasBoundary
        ? "boundary"
        : goal === "welcome_connection"
          ? "receptive"
          : goal === "clarify_intent"
            ? "clarify"
            : goal === "keep_distance" || tone === "direct"
              ? "boundary"
              : "warm-no-commitment",
    );
  }

  if (intent.category === "emotional_affection") {
    return markRecommended(
      [
        {
          id: "receptive",
          label: "Reciprocate",
          text:
            styleCloseness >= 3
              ? "I care about you too. I’m glad you told me."
              : "I’m glad you told me. I’d like to keep getting to know each other.",
          why: `Calibrated to closeness ${closeness}/4.`,
        },
        {
          id: "warm-no-commitment",
          label: "Receive it warmly",
          text: "Thank you for telling me. That means a lot.",
          why: "Acknowledges the feeling without claiming the same feeling.",
        },
        {
          id: "clarify",
          label: "Invite context",
          text: "Thank you for saying that. What brought it to mind?",
          why: "Opens space for meaning without assuming it.",
        },
        {
          id: "boundary",
          label: "Slow the pace",
          text: "I appreciate your honesty. I’d like to take this slowly.",
          why: "Keeps warmth while preserving space.",
        },
      ],
      goal === "welcome_connection"
        ? "receptive"
        : goal === "clarify_intent"
          ? "clarify"
          : goal === "keep_distance"
            ? "boundary"
            : "warm-no-commitment",
    );
  }

  if (intent.category === "invitation") {
    return markRecommended(
      [
        {
          id: "receptive",
          label: "Accept",
          text: "I’d like that. What day were you thinking?",
          why: "Welcomes the invitation while clarifying logistics.",
        },
        {
          id: "warm-no-commitment",
          label: "Stay open",
          text: "Thanks for asking. Let me check my plans and come back to you.",
          why: "Keeps the connection open without committing.",
        },
        {
          id: "clarify",
          label: "Ask for detail",
          text: "I may be interested. What did you have in mind?",
          why: "Clarifies the proposal before deciding.",
        },
        {
          id: "boundary",
          label: "Decline warmly",
          text: "Thanks for thinking of me, but I’m going to pass.",
          why: "Clear, brief, and non-judgmental.",
        },
      ],
      goal === "welcome_connection"
        ? "receptive"
        : goal === "clarify_intent"
          ? "clarify"
          : goal === "keep_distance"
            ? "boundary"
            : "warm-no-commitment",
    );
  }

  const broadOptions = buildBroadResponseOptions({
    intent,
    personName,
    goal,
    tone,
    closeness,
    trust,
    styleCloseness,
    hasBoundary,
    boundary,
  });
  if (broadOptions) return broadOptions;

  const contextualDraft = buildAmbiguousDraft({
    goal,
    tone,
    closeness: styleCloseness,
    trust,
    hasAvailability,
    hasNoUrgency,
    hasBoundary,
  });
  const clarify =
    "Thanks — I may be overreading the wording. Did you mean you’d prefer to leave it there, or revisit it later?";
  const direct = hasBoundary
    ? "Thanks. I’m keeping to the boundary I mentioned, and I’ll leave it there for now."
    : "Thanks for letting me know.";
  return markRecommended(
    [
      {
        id: "context-fit",
        label: "Best contextual fit",
        text: contextualDraft,
        why: "Uses the selected relationship and situation context.",
      },
      {
        id: "clarify",
        label: "Clarify",
        text: clarify,
        why: "Checks meaning instead of inferring it.",
      },
      {
        id: "brief",
        label: "Keep it brief",
        text: direct,
        why: "Acknowledges the message without extending the exchange.",
      },
    ],
    goal === "clarify_intent"
      ? "clarify"
      : goal === "keep_distance" || tone === "direct"
        ? "brief"
        : "context-fit",
  );
}

function buildBroadResponseOptions({
  intent,
  personName,
  goal,
  tone,
  closeness,
  trust,
  styleCloseness,
  hasBoundary,
  boundary,
}) {
  const warm = styleCloseness >= 3 && tone === "warm";
  const sets = {
    apology: [
      ["welcome", "Receive the apology", warm ? "Thank you for saying that. I care about repairing this too." : "Thank you for apologising. I appreciate you acknowledging it.", "Acknowledges the apology without erasing what happened."],
      ["acknowledge", "Take time", "Thank you for apologising. I need some time to think before I respond fully.", "Preserves space before deciding what repair means."],
      ["clarify", "Ask about repair", "Thank you for apologising. What do you think needs to change from here?", "Tests accountability through a concrete next step."],
      ["boundary", "Accept with a boundary", hasBoundary ? `I hear your apology. I still need to keep to what I shared: ${normaliseBoundaryForReply(boundary)}` : "I hear your apology. I’m not ready to move past this yet.", "Keeps the apology separate from automatic forgiveness."],
    ],
    request: [
      ["welcome", "Agree", warm ? "Yes, I’d be happy to help with that." : "Yes, I can do that.", `Directness calibrated to trust ${trust}/4.`],
      ["acknowledge", "Consider it", "Let me check what I can realistically do, then I’ll come back to you.", "Avoids agreeing before capacity is clear."],
      ["clarify", "Clarify the request", "Before I answer, could you clarify exactly what you need and by when?", "Makes the request concrete before deciding."],
      ["boundary", "Decline", "I’m not able to do that, but thank you for asking directly.", "Declines the request without judging it."],
    ],
    boundary: [
      ["welcome", "Respect the boundary", "I understand. I’ll respect that.", "Takes the stated limit literally without challenging it."],
      ["acknowledge", "Acknowledge and pause", "Thank you for being clear. I’ll give this some space.", "Signals receipt without extending the exchange."],
      ["clarify", "Clarify the scope", "I want to respect that correctly. Does this apply for now, or would you prefer no further contact?", "Clarifies scope without disputing the boundary."],
      ["boundary", "Confirm your own limit", "I understand your boundary. I’ll respect it, and I’ll keep to my own limits as well.", "Recognises that both people retain agency."],
    ],
    gratitude: [
      ["welcome", "Receive it warmly", warm ? "That means a lot to hear. I’m really glad I could be there for you." : "You’re very welcome. I’m glad I could help.", `Warmth calibrated to closeness ${closeness}/4.`],
      ["acknowledge", "Keep it simple", "You’re welcome — I appreciate you saying that.", "Warm without making the exchange larger."],
      ["clarify", "Invite reflection", "You’re welcome. What felt most helpful to you?", "Invites useful context without assuming it."],
      ["boundary", "Keep it brief", "You’re welcome.", "A complete response when little more is needed."],
    ],
    check_in: [
      ["welcome", "Open up", warm ? "Thanks for asking. I’ve had a lot on my mind, and I’d like to tell you about it." : "Thanks for asking. I’m doing okay, and I appreciate the check-in.", `Disclosure depth calibrated to closeness ${closeness}/4 and trust ${trust}/4.`],
      ["acknowledge", "Answer briefly", "Thanks for asking. I’m taking things one step at a time.", "Answers honestly without over-disclosing."],
      ["clarify", "Ask what prompted it", "Thanks for checking in. Was there something in particular you noticed?", "Clarifies why they asked."],
      ["boundary", "Keep it private", "Thanks for asking. I’d rather not get into it right now, but I appreciate the thought.", "Maintains privacy without rejecting the care."],
    ],
    support_offer: [
      ["welcome", "Accept support", "Thank you. I could use some support, and I’d like to talk.", "Accepts the offer directly."],
      ["acknowledge", "Appreciate the offer", "Thank you. It helps to know the offer is there.", "Receives the care without committing to disclosure."],
      ["clarify", "Say what would help", "Thank you. What would help most is having someone listen without trying to solve it.", "Turns a broad offer into a concrete preference."],
      ["boundary", "Decline gently", "Thank you for offering. I need some space, but I appreciate you thinking of me.", "Declines help while preserving warmth."],
    ],
    distress: [
      ["welcome", "Offer presence", warm ? "I’m really sorry you’re going through this. I’m here with you." : "I’m sorry you’re dealing with that. I can listen.", `Warmth calibrated to closeness ${closeness}/4.`],
      ["acknowledge", "Acknowledge the difficulty", "That sounds like a lot to carry. Thank you for telling me.", "Validates the report without claiming to know the whole experience."],
      ["clarify", "Ask what helps", "Would it help more if I listened, helped think through options, or gave you some space?", "Lets the sender define the support they want."],
      ["boundary", "Name your capacity", "I care about what you’re going through. I don’t have capacity to help fully right now, but I can check in later.", "Keeps care and capacity separate."],
    ],
    conflict: [
      ["welcome", "Engage constructively", "I hear that this affected you. I want to understand and respond carefully.", "Treats the reported impact seriously without accepting an unverified interpretation."],
      ["acknowledge", "Pause before replying", "I hear that you’re upset. I want to take a little time so I can respond thoughtfully.", "Reduces reactive communication."],
      ["clarify", "Clarify the concern", "Can you tell me which part felt dismissive to you? I want to understand the specific moment.", "Moves from a broad concern to observable detail."],
      ["boundary", "Set a communication boundary", "I’m willing to discuss what happened, but not through insults or accusations.", "Keeps the conversation possible while setting a condition."],
    ],
    celebration: [
      ["welcome", "Celebrate fully", warm ? "That’s amazing — I’m genuinely so happy for you! Tell me everything." : "That’s wonderful news — congratulations!", `Enthusiasm calibrated to closeness ${closeness}/4.`],
      ["acknowledge", "Congratulate", "Congratulations — that’s a real achievement.", "Recognises the significance without overclaiming intimacy."],
      ["clarify", "Invite the story", "Congratulations! What part of it feels most meaningful to you?", "Invites reflection beyond the headline."],
      ["boundary", "Keep it concise", "Congratulations — well done.", "Positive and complete without extending the exchange."],
    ],
    decision: [
      ["welcome", "Engage with it", "Thanks for telling me. I’m open to working through what this means together.", "Signals collaboration without automatic agreement."],
      ["acknowledge", "Request time", "I understand that’s your current decision. I need a little time to consider its impact.", "Preserves the user’s decision-making space."],
      ["clarify", "Ask for reasoning", "Can you walk me through the main reasons and what alternatives you considered?", "Surfaces criteria rather than debating a conclusion immediately."],
      ["boundary", "Disagree carefully", "I understand your position, but I don’t agree to that outcome as it stands.", "Separates understanding from agreement."],
    ],
    update: [
      ["welcome", "Acknowledge warmly", "Thanks for keeping me updated — I appreciate it.", "Fits a warmer established relationship."],
      ["acknowledge", "Acknowledge", "Thanks for the update.", "A concise response when no action is obvious."],
      ["clarify", "Confirm implications", "Thanks for the update. Does this change anything you need from me?", "Checks whether action is required."],
      ["boundary", "State your constraint", hasBoundary ? `Thanks for the update. I still need to keep to what I shared: ${normaliseBoundaryForReply(boundary)}` : "Thanks for the update. I can’t make any changes on my side right now.", "Acknowledges the information while preserving a constraint."],
    ],
  };
  const rows = sets[intent.category];
  if (!rows) return null;
  const options = rows.map(([id, label, text, why]) => ({
    id,
    label,
    text,
    why: `${why} Relationship: ${personName}; closeness ${closeness}/4, trust ${trust}/4.`,
  }));
  const recommended =
    hasBoundary && intent.category === "conflict"
      ? "boundary"
      : goal === "welcome_connection"
        ? "welcome"
        : goal === "clarify_intent"
          ? "clarify"
          : goal === "keep_distance" || tone === "direct"
            ? "boundary"
            : "acknowledge";
  return markRecommended(options, recommended);
}

function markRecommended(options, recommendedId) {
  return options.map((option) => ({
    ...option,
    recommended: option.id === recommendedId,
  }));
}

function normaliseBoundaryForReply(boundary) {
  const text = boundary.trim().replace(/[.]+$/, "");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function physicalGesture(action) {
  return {
    hug: "a hug",
    kiss: "a kiss",
    hold: "being held",
    cuddle: "cuddling",
  }[action] || "physical closeness";
}

function buildAmbiguousDraft({
  goal,
  tone,
  closeness,
  trust,
  hasAvailability,
  hasNoUrgency,
  hasBoundary,
}) {
  if (goal === "clarify_intent") {
    return "Thanks — I may be overreading the wording. Did you mean you’d prefer to leave it there, or revisit it later?";
  }

  if (goal === "keep_distance" || tone === "direct") {
    return hasBoundary
      ? "Thanks. I’m keeping to the boundary I mentioned, and I’ll leave it there for now."
      : "Thanks for letting me know.";
  }

  if (trust <= 1 && !hasBoundary) {
    return "Thanks for letting me know — I appreciate the message.";
  }

  if (hasBoundary && (hasAvailability || hasNoUrgency)) {
    return closeness >= 3 && tone === "warm"
      ? "Thanks for understanding — hope you have a good evening. I’m offline now, but I’ll pick this up tomorrow morning."
      : "Thanks for understanding — I’m offline tonight, but I’ll pick this up tomorrow morning.";
  }

  if (hasBoundary) {
    return tone === "neutral"
      ? "Thanks. I’m keeping to the boundary I mentioned."
      : "Thanks for understanding — I’m keeping to the boundary I mentioned.";
  }

  return tone === "neutral"
    ? "Thanks for letting me know."
    : "Thanks for letting me know — I appreciate the message.";
}

function buildContextualInterpretation({
  intent,
  personName,
  hasPriorPhrase,
  closeness,
  trust,
}) {
  if (intent.category === "physical_affection") {
    const gesture = intent.gesture || physicalGesture(intent.action);
    return {
      text:
        `${personName} explicitly states a desire for ${gesture}. ` +
        `That establishes the proposed physical action—not why they want it. Friendly affection, comfort, romance, and playfulness remain alternatives. The relationship profile (closeness ${closeness}/4, trust ${trust}/4) helps tailor your response, not diagnose their motive.`,
      confidence: "mixed",
      confidenceLabel: "stated action · high; motive · low",
    };
  }

  if (intent.category === "emotional_affection") {
    return {
      text:
        `${personName} explicitly expresses affection or care. The relationship profile helps calibrate the response, but the desired outcome remains unstated.`,
      confidence: "mixed",
      confidenceLabel: "expressed feeling · high; desired outcome · low",
    };
  }

  if (intent.category === "invitation") {
    return {
      text:
        `${personName} is proposing time together. The invitation is explicit; whether it is practical, friendly, or romantic is not established.`,
      confidence: "moderate",
    };
  }

  if (intent.category === "apology") {
    return {
      text:
        `${personName} is explicitly apologising. Whether the apology addresses the relevant harm and what repair they expect require relationship history.`,
      confidence: "moderate",
    };
  }

  if (intent.category === "request") {
    return {
      text:
        `${personName} is explicitly asking something. Closeness and trust can shape response style, but they do not change the request itself.`,
      confidence: "moderate",
    };
  }

  const broad = {
    boundary: ["sets a clear limit or asks for space", "The reason and duration may still be unstated"],
    gratitude: ["expresses appreciation", "The desired depth of the exchange remains open"],
    check_in: ["checks in on the user", "How much disclosure is expected remains unstated"],
    support_offer: ["offers support", "The kind of help and the user’s willingness to accept it remain open"],
    distress: ["reports difficulty or distress", "The kind of support wanted is not established"],
    conflict: ["raises a relational concern or hurt", "Cause, responsibility, and repair require more context"],
    celebration: ["shares a positive event or achievement", "The relationship profile helps calibrate enthusiasm"],
    decision: ["communicates a decision or proposal", "Its rationale and flexibility may still need clarification"],
    update: ["provides an update", "Whether acknowledgment or action is required may remain unstated"],
  }[intent.category];
  if (broad) {
    return {
      text:
        `${personName} explicitly ${broad[0]}. ${broad[1]}. ` +
        `The relationship profile (closeness ${closeness}/4, trust ${trust}/4) shapes response style, not the underlying facts.`,
      confidence: "mixed",
      confidenceLabel: "literal content · high; relational meaning · low",
    };
  }

  return {
    text: hasPriorPhrase
      ? `A neutral reading is somewhat better supported because ${personName} used the same phrase neutrally before. That still does not establish current intent.`
      : "The selected history does not establish the sender’s intent, so the ambiguity remains.",
    confidence: hasPriorPhrase ? "moderate" : "low",
  };
}

function buildEpistemicLayer({
  intent,
  personName,
  cleanMessage,
  relevantClaims,
  hasPriorPhrase,
  commitments = [],
  issues = [],
}) {
  const facts = [
    {
      id: "incoming-message",
      type: "direct_observation",
      text: `${personName} sent: “${cleanMessage || "No message supplied"}”`,
      source: "Incoming message",
      confidence: "high",
      userConfirmation: "confirmed",
    },
  ];
  if (intent.explicit) {
    facts.push({
      id: "explicit-message-intent",
      type: "direct_observation",
      text: intent.explicitFact,
      source: "Literal wording of the incoming message",
      confidence: "high",
      userConfirmation: "confirmed",
    });
  }
  facts.push(
    ...relevantClaims.map((claim) => ({
      id: claim.id,
      type: claim.type,
      text: claim.text,
      source: claim.source.reference,
      confidence: claim.confidence,
      userConfirmation: claim.userConfirmation,
    })),
  );
  const issueById = new Map(issues.map((issue) => [issue.id, issue]));
  facts.push(
    ...commitments.map((commitment) => ({
      id: commitment.id,
      type: "direct_observation",
      text:
        `${issueById.get(commitment.issueId)?.title || commitment.description}: ` +
        `${humanizeCommitmentStatus(commitment.status)}. ${commitment.description}`,
      source:
        commitment.source?.reference || "User-confirmed commitment record",
      confidence: "high",
      userConfirmation: commitment.userConfirmation || "confirmed",
    })),
  );

  if (intent.category === "physical_affection") {
    const gesture = intent.gesture || physicalGesture(intent.action);
    return {
      facts,
      interpretations: [
        {
          id: "inference-friendly-comfort",
          type: "ai_inference",
          text: "The gesture may express friendly affection or an attempt to offer comfort.",
          source: "One possible meaning of the stated gesture",
          confidence: "low",
          userConfirmation: "unreviewed",
        },
        {
          id: "inference-romantic-playful",
          type: "ai_inference",
          text: "The gesture could instead have romantic or playful meaning.",
          source: "Alternative meaning of the stated gesture",
          confidence: "low",
          userConfirmation: "unreviewed",
        },
      ],
      alternatives: [
        "Friendly physical affection.",
        "An attempt to comfort or reassure you.",
        "Romantic or flirtatious interest.",
        `A literal wish for ${gesture} without a broader implication.`,
      ],
      uncertainties: [
        `The motive behind ${gesture} is not established.`,
        "Whether you welcome physical contact is not stated in the message.",
      ],
    };
  }

  if (intent.category !== "ambiguous") {
    const readings = {
      apology: [
        "The apology may be an attempt at genuine repair.",
        "It may also seek reassurance or closure without fully addressing impact.",
      ],
      request: [
        "The request may be practical and limited.",
        "It may also carry an unstated expectation based on the relationship.",
      ],
      boundary: [
        "The limit may be temporary and situation-specific.",
        "It may instead describe a longer-term change in the relationship.",
      ],
      gratitude: [
        "The message may be simple appreciation.",
        "It may also invite a warmer or more reciprocal exchange.",
      ],
      check_in: [
        "The sender may be expressing care.",
        "They may also be making a routine or practical check-in.",
      ],
      support_offer: [
        "The sender may be offering emotional presence.",
        "They may instead mean a specific practical form of help.",
      ],
      distress: [
        "The sender may primarily want to be heard.",
        "They may instead want advice, practical help, reassurance, or space.",
      ],
      conflict: [
        "The sender may be seeking understanding and repair.",
        "They may instead be venting, setting a limit, or asking for accountability.",
      ],
      celebration: [
        "The sender may want shared celebration.",
        "They may simply be keeping the user informed about meaningful news.",
      ],
      decision: [
        "The decision may still be open to discussion.",
        "It may instead be a final position being communicated.",
      ],
      update: [
        "The update may require only acknowledgment.",
        "It may instead imply a decision, request, or change of plan.",
      ],
    }[intent.category] || [
      "The sender may be seeking a warmer or more connected exchange.",
      "The message may be intended literally without a broader relational signal.",
    ];
    return {
      facts,
      interpretations: [
        {
          id: `inference-${intent.category}-meaning`,
          type: "ai_inference",
          text: readings[0],
          source: "Possible relational meaning",
          confidence: "low",
          userConfirmation: "unreviewed",
        },
        {
          id: `inference-${intent.category}-literal`,
          type: "ai_inference",
          text: readings[1],
          source: "Alternative reading",
          confidence: "low",
          userConfirmation: "unreviewed",
        },
      ],
      alternatives: [
        "The message may be primarily literal.",
        "It may also carry a relationship-specific meaning not stated in the words.",
      ],
      uncertainties: [
        "The sender’s motive and hoped-for outcome remain unstated.",
        "The user’s preferred response is not implied by the message.",
      ],
    };
  }

  return {
    facts,
    interpretations: [
      {
        id: "inference-disappointment",
        type: "ai_inference",
        text: `${personName} may be disappointed.`,
        source: "Possible reading of the incoming message",
        confidence: "low",
        userConfirmation: "unreviewed",
      },
      {
        id: "inference-neutral",
        type: "ai_inference",
        text: hasPriorPhrase
          ? "A neutral sign-off is supported by one prior comparable message."
          : "A neutral sign-off remains possible.",
        source: hasPriorPhrase
          ? "Earlier neutral sign-off"
          : "Alternative reading of the words",
        confidence: hasPriorPhrase ? "moderate" : "low",
        userConfirmation: "unreviewed",
      },
    ],
    alternatives: [
      "The sender may be acknowledging the boundary literally.",
      "The sender may be disappointed without intending criticism.",
      "The sender may simply be ending the exchange efficiently.",
    ],
    uncertainties: [
      "Tone and intent cannot be established from the text.",
      "Whether a reply is expected remains unstated.",
    ],
  };
}

function contextualRecordTime(record) {
  const value =
    record?.occurredAt ||
    record?.promisedAt ||
    record?.capturedAt ||
    record?.updatedAt ||
    record?.createdAt;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time)
    ? time
    : Number(record?.recordSequence || 0);
}

function buildContextExplanation({
  intent,
  personName,
  relationshipType,
  currentState,
  relationshipGoal,
  cautiousProfile,
  hasPriorPhrase,
  hasAvailability,
  hasNoUrgency,
  hasBoundary,
  closeness,
  trust,
  relevantSituationCount,
  commitmentInsight,
}) {
  const parts = [];
  parts.push(
    `${personName} is profiled as ${relationshipType || "a relationship not yet labelled"}${currentState ? `, currently “${currentState}”` : ""}; closeness (${closeness}/4) changes warmth and trust (${trust}/4) changes directness.`,
  );
  if (relationshipGoal) {
    parts.push(`The user’s current relationship goal is “${relationshipGoal}”.`);
  }
  if (cautiousProfile) {
    parts.push("Because the current state or goal calls for caution, the wording remains measured even if historical closeness is high.");
  }
  if (intent.explicit) {
    parts.push("The response treats the literal statement as evidence while keeping unspoken motive uncertain.");
  }
  if (hasPriorPhrase) {
    parts.push("A prior comparable phrase supports—but does not prove—a neutral reading.");
  }
  if (hasAvailability || hasNoUrgency) {
    parts.push("The timeline supports replying tomorrow rather than treating the message as urgent.");
  }
  if (hasBoundary) {
    parts.push("The draft preserves the user’s explicit relationship boundary without treating it as evidence of intent.");
  }
  if (commitmentInsight) {
    parts.push(
      `The structured record contains ${commitmentInsight.openCount} open and ${commitmentInsight.completedCount} completed ${commitmentInsight.openCount + commitmentInsight.completedCount === 1 ? "commitment" : "commitments"}; promises and completed actions remain different states.`,
    );
  }
  if (!relevantSituationCount) {
    parts.push("No selected situation was relevant enough to shape this response.");
  }
  return parts.join(" ");
}
