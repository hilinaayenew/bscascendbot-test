// ============================================================================
// Area 1 · Getting Started — the coverage map
//
// Same non-router shape as Salary (scripts/areas/salary.mjs): one classification
// call places the user in a stage, the stage scopes which of Otema's answers get
// injected, and the model writes the reply from that material.
//
// v2 (2026-08-19) — reworked from 3 stages to 4 after review: the original
// "how far along" split lumped a career changer's transferable-skills question
// in with a first-timer's method choice. Those need genuinely different
// material — a career changer's real question is "how does my past count",
// not "which method should I pick" — so it now has its own stage (B).
//
// This means the harness itself had to be generalized: scripts/coach-local.mjs
// used to hardcode exactly stages A/B/C in the classification tool schema. It
// now builds the stage enum from Object.keys(STAGES), so 2-4 stages both work.
// ============================================================================

export default {
  n: 1,
  name: "Getting Started",

  // Otema's real answers, in question-bank order (Q1-Q8), are S1..S8.
  realOrder: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],

  topic: "getting_started",

  stageSummary: {
    A: "which direction to go in",
    B: "how your background carries over",
    C: "how you're going to learn",
    D: "your first practical steps",
  },

  fallbackQuestion: "What feels like the right next step for you?",

  // No supersedes yet — nothing measured has shown a lexical-collision problem
  // the way "raise"/"asked" did for Salary. Add one if testing finds a stage
  // whose keywords keep winning after the conversation has clearly moved on.
  supersedes: [],

  stages: {
    A: {
      label: "Deciding whether, or which direction",
      describes:
        "NO real prior work experience in another field, and no direction settled: unsure tech is right for them, torn between fields, or curious what the work is like day-to-day. If they name a previous job or profession, that's stage B instead, even if they're also field-unsure — prior career is the distinguishing fact. Giveaway words: \"not sure\", \"which field\", \"torn between\", \"where do I begin\" — with no past career mentioned.",
      facets: ["S1", "S1a", "S7", "S7a", "S8", "S8a", "G3", "G3a"],
    },
    B: {
      label: "Translating a previous career",
      describes:
        "Real prior work experience in a DIFFERENT field, asking how it applies or whether it counts — a career change, not a first career decision. Giveaway words: \"transferable skills\", \"switching careers\", \"start at the bottom\". Field-uncertainty can co-occur and still counts as B, not A. But this tie-break is A-vs-B ONLY: once THIS message is clearly about method (C) or concrete execution (D), classify it there instead, even with a prior career mentioned earlier — a prior career is a fact about her, not a stage she's stuck in.",
      facets: ["S5", "G4"],
    },
    C: {
      label: "Choosing how to learn",
      describes:
        "Field settled or not the live question — open decision is METHOD: self-teach vs. bootcamp vs. degree, or evaluating a programme. Applies regardless of a prior career (B) — a method question is C. Giveaway words: \"bootcamp\", \"degree\", \"self-taught\", \"programme\", \"course\".",
      facets: ["S2", "S2a", "G1", "G1a"],
    },
    D: {
      label: "Actively executing a chosen plan",
      describes:
        "Method decided — wants concrete specifics: a language, free resources, a realistic timeline, savings needed. A THING to use, not a decision. Applies regardless of a prior career (B) — \"how long will this take\" is D, not B. Giveaway words: \"which language\", \"resources\", \"how long\", \"realistically\", \"should I save\".",
      facets: ["S3", "S4", "S4a", "S6", "S6a", "G2"],
    },
  },
};
