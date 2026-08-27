// ============================================================================
// Area 4 · Mentorship — the coverage map
//
// Built fast under a deadline (2026-08-23). Otema's 6 real answers (Q24-29)
// split on whether she already has a mentor: finding and approaching one
// (Q24-25) versus making an existing relationship work — sessions, the
// mentor/sponsor distinction, maintaining it long-term, using the BSC
// programme's structure (Q26-29).
// ============================================================================

export default {
  n: 4,
  name: "Mentorship",

  topic: "mentorship",

  realOrder: ["S1", "S2", "S3", "S4", "S5", "S6"],

  stageSummary: {
    A: "finding and approaching a mentor",
    B: "making an existing mentorship work",
  },

  fallbackQuestion: "Where are you at with mentorship right now?",

  supersedes: [],

  stages: {
    A: {
      label: "Finding a mentor",
      describes:
        "No mentor yet — the live question is where to find one, what to look for, or how to approach them. Giveaway words: \"find a mentor\", \"how do I approach\", \"don't have a mentor\".",
      facets: ["S1", "S1a", "S2"],
    },
    B: {
      label: "Making it work",
      describes:
        "Already has a mentor, or is inside the BSC programme — the live question is how to use the relationship well: sessions, the mentor/sponsor distinction, maintaining it long-term, or structuring goals with a mentor's help. Giveaway words: \"my mentor\", \"our sessions\", \"sponsor\", naming an existing relationship.",
      facets: ["S3", "S3a", "S4", "S4a", "S5", "S6"],
    },
  },
};
