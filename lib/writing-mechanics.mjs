const WORD_CORRECTIONS = new Map(
  Object.entries({
    accomodate: "accommodate",
    accomodation: "accommodation",
    acheive: "achieve",
    adress: "address",
    alot: "a lot",
    apparantly: "apparently",
    arguement: "argument",
    beleive: "believe",
    begining: "beginning",
    buisness: "business",
    calender: "calendar",
    definately: "definitely",
    dissapoint: "disappoint",
    embarass: "embarrass",
    enviroment: "environment",
    existance: "existence",
    goverment: "government",
    happend: "happened",
    immediatly: "immediately",
    independant: "independent",
    knowlege: "knowledge",
    neccessary: "necessary",
    occured: "occurred",
    occuring: "occurring",
    persue: "pursue",
    prefered: "preferred",
    prepareed: "prepared",
    privelege: "privilege",
    recieve: "receive",
    recieved: "received",
    recomend: "recommend",
    responsability: "responsibility",
    seperate: "separate",
    succesful: "successful",
    teh: "the",
    thier: "their",
    tommorow: "tomorrow",
    tp: "to",
    untill: "until",
    wierd: "weird",
    archictecture: "architecture",
    architechture: "architecture",
    dont: "don’t",
    doesnt: "doesn’t",
    didnt: "didn’t",
    cant: "can’t",
    couldnt: "couldn’t",
    shouldnt: "shouldn’t",
    wouldnt: "wouldn’t",
    wont: "won’t",
    im: "I’m",
    ive: "I’ve",
  }),
);

const CLARITY_PATTERNS = [
  {
    pattern: /\bprepared and ready\b/i,
    phrase: "prepared and ready",
    suggestion:
      "The two words overlap. Keep both for emphasis, or use “prepared” alone for a more concise sentence.",
  },
  {
    pattern: /\beach and every\b/i,
    phrase: "each and every",
    suggestion: "“Each” or “every” usually carries the same meaning more concisely.",
  },
  {
    pattern: /\bin order to\b/i,
    phrase: "in order to",
    suggestion: "“To” is usually clearer unless the longer phrase is deliberate emphasis.",
  },
  {
    pattern: /\bfuture plans\b/i,
    phrase: "future plans",
    suggestion: "“Plans” usually already implies the future.",
  },
  {
    pattern: /\bpast history\b/i,
    phrase: "past history",
    suggestion: "“History” usually already refers to the past.",
  },
  {
    pattern: /\babsolutely essential\b/i,
    phrase: "absolutely essential",
    suggestion: "“Essential” is usually strong enough on its own.",
  },
];

export function analyzeWritingMechanics(value) {
  const originalText = String(value || "").trim();
  const corrections = [];
  let correctedText = originalText.replace(
    /\b[\p{L}]+(?:[’'][\p{L}]+)?\b/gu,
    (word) => {
      if (word === "i") {
        corrections.push({
          type: "capitalization",
          original: word,
          replacement: "I",
          confidence: "high",
          reason: "The first-person pronoun is capitalized in standard English.",
        });
        return "I";
      }
      const normalized = word.toLowerCase().replaceAll("'", "’");
      const replacement = WORD_CORRECTIONS.get(normalized);
      if (!replacement) return word;
      const adjusted = matchCase(replacement, word);
      corrections.push({
        type: "likely_typo",
        original: word,
        replacement: adjusted,
        confidence: "high",
        reason: "High-confidence local spelling correction.",
      });
      return adjusted;
    },
  );

  correctedText = correctedText.replace(
    /\b([\p{L}]+)(?:[ \t]+\1\b)+/giu,
    (match, word) => {
      corrections.push({
        type: "repeated_word",
        original: match,
        replacement: word,
        confidence: "high",
        reason: "The same word appears consecutively.",
      });
      return word;
    },
  );

  const spacingCorrected = correctedText
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;!?])/g, "$1")
    .replace(/([,.;!?])([\p{L}])/gu, "$1 $2")
    .trim();
  if (spacingCorrected !== correctedText) {
    corrections.push({
      type: "spacing",
      original: correctedText,
      replacement: spacingCorrected,
      confidence: "high",
      reason: "Standardized repeated or misplaced spaces around punctuation.",
    });
    correctedText = spacingCorrected;
  }

  if (/^[\p{Ll}]/u.test(correctedText)) {
    const capitalized = `${correctedText[0].toUpperCase()}${correctedText.slice(1)}`;
    corrections.push({
      type: "capitalization",
      original: correctedText[0],
      replacement: capitalized[0],
      confidence: "high",
      reason: "Capitalized the beginning of the sentence.",
    });
    correctedText = capitalized;
  }

  if (correctedText && /[\p{L}\p{N}]$/u.test(correctedText)) {
    corrections.push({
      type: "punctuation",
      original: correctedText,
      replacement: `${correctedText}.`,
      confidence: "moderate",
      reason: "Added closing punctuation to a complete-looking sentence.",
    });
    correctedText = `${correctedText}.`;
  }

  return {
    originalText,
    correctedText,
    corrections,
  };
}

export function findClarityOpportunities(value) {
  const text = String(value || "");
  return CLARITY_PATTERNS.filter((item) => item.pattern.test(text)).map(
    (item) => ({
      phrase: item.phrase,
      suggestion: item.suggestion,
      confidence: "moderate",
      optional: true,
    }),
  );
}

function matchCase(replacement, original) {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (/^\p{Lu}/u.test(original)) {
    return `${replacement[0].toUpperCase()}${replacement.slice(1)}`;
  }
  return replacement;
}
