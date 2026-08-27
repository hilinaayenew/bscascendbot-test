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
        "A certification is ACTIVELY being weighed as an alternative to a master's SOMEWHERE in this conversation, or the message questions whether further study is worth it at all in the abstract — not just whether a master's specifically is a good idea. Cost, speed-to-hire, or timing raised AS PART OF a certification-vs-master's comparison stays here (\"money is a constraint\" while certs are on the table, \"I want something faster\" comparing the two paths). Giveaway words: \"do I need\", \"is it worth it\", \"instead of a master's\", \"certification vs degree\", or any mention of a certification at all this conversation. If a certification has never come up at all, this is NOT the default — go to B or C on their own merits instead.",
      facets: ["S1", "S1a", "S5", "S5a"],
    },
    B: {
      label: "Choosing a programme",
      describes:
        "The live question is specifically about A MASTER'S — which programme, which field benefits most, what to look for, or before/after-experience timing — and no certification is being weighed as an alternative anywhere in this conversation. This is the default for a master's-specific question that never mentioned certifications at all, including the very first message of a conversation that opens directly on a master's timing or programme question.",
      facets: ["S2", "S3", "S4", "S4a"],
    },
    C: {
      label: "Funding and balancing it",
      describes:
        "A specific programme is chosen — the live question is logistics: paying for it, scholarships, or balancing it with a full-time job. If NO certification has been mentioned anywhere in this conversation, a bare mention of money, savings or time (\"I don't have strong savings\", \"I also work full time\") stays in C — it does NOT move to stage A by itself, since there is no certification for it to be weighed against. Only move to stage A when a certification is genuinely still being weighed as an alternative somewhere in this conversation; otherwise, a funding or scheduling question about a master's already under discussion belongs here.",
      facets: ["S6", "S6a", "S6b", "S7", "S7a"],
    },
  },
};
