// ============================================================================
// Area 2 · Further Education — the coverage map
//
// Built fast under a deadline (2026-08-23). Otema's 7 real answers (Q9-15)
// split cleanly into three points in a decision: whether a master's/further
// study is even the right move at all (vs a cheaper alternative like a
// certification), choosing a specific programme once that's decided, and the
// logistics of actually doing it (funding, balancing it with work).
// ============================================================================

export default {
  n: 2,
  name: "Further Education",

  topic: "further_education",

  realOrder: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],

  stageSummary: {
    A: "whether further study is the right move at all",
    B: "choosing a specific programme",
    C: "funding and balancing it once you're pursuing it",
  },

  fallbackQuestion: "What's actually pulling you toward further study right now?",

  supersedes: [],

  stages: {
    A: {
      label: "Deciding whether it's worth it",
      describes:
        "No programme chosen yet — the live question is whether a master's (or further study at all) is actually necessary, or whether a cheaper/faster alternative like a certification would serve just as well. Giveaway words: \"do I need\", \"is it worth it\", \"instead of a master's\", \"certification vs degree\".",
      facets: ["S1", "S5"],
    },
    B: {
      label: "Choosing a programme",
      describes:
        "Further study is the decided direction — the live question is WHICH programme, which field benefits most, what to look for, or when (before or after work experience). Giveaway words: \"which programme\", \"what should I look for\", \"before or after\", naming a specific field.",
      facets: ["S2", "S3", "S4"],
    },
    C: {
      label: "Funding and balancing it",
      describes:
        "A programme is chosen or close to it — the live question is logistics: paying for it, scholarships, or balancing it with a full-time job. Giveaway words: \"fund\", \"scholarship\", \"afford\", \"balance\", \"while working\".",
      facets: ["S6", "S7"],
    },
  },
};
