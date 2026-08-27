// ============================================================================
// Area 3 · Career Paths & Roadmaps — the coverage map
//
// Built fast under a deadline (2026-08-23) — same non-router shape as every
// other area, lighter design pass than Confidence got. Otema's 8 real answers
// (Q16-23) are almost entirely one shape: "give me the roadmap for field X."
// Only one (Q23) is actually about CHOOSING a field rather than executing on
// one already picked — so the stage split follows that fault line directly
// rather than inventing a "how far along" ladder the content doesn't support.
// ============================================================================

export default {
  n: 3,
  name: "Career Paths & Roadmaps",

  topic: "career_paths",

  realOrder: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],

  stageSummary: {
    A: "which specialisation to aim for",
    B: "the concrete roadmap for one you've picked",
  },

  fallbackQuestion: "Which path are you weighing up right now?",

  supersedes: [],

  stages: {
    A: {
      label: "Choosing a specialisation",
      describes:
        "No specific field named yet, or explicitly comparing more than one — software dev vs data vs design vs security vs PM vs cloud. Giveaway words: \"which field\", \"how do I choose\", \"not sure which path\", \"torn between\". The moment a SINGLE field is named as the one she's pursuing, that's stage B instead, even if she's only just decided.",
      facets: ["S8", "S8a", "G1", "G1a"],
    },
    B: {
      label: "The roadmap for a chosen field",
      describes:
        "A specific field is already named earlier in THIS conversation — software development, data/ML, UX/UI, cybersecurity, product management, cloud/DevOps, or a transition into tech project management. Once that field is on the table, EVERY later message about it stays in stage B — background constraints (\"I have no IT background\"), realism checks about a specific job title (\"is X a realistic first job\"), and timeline questions are all still about THAT field's roadmap, not a return to choosing. Only go back to stage A if she explicitly reopens the choice between fields.",
      facets: ["S1", "S2", "S3", "S4", "S4a", "S5", "S5a", "S6", "S7"],
    },
  },
};
