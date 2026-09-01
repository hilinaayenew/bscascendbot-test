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
    E: "pulling together what you're going to do",
  },

  fallbackQuestion: "What feels like the right next step for you?",

  // Stage E is the wrap-up, same mechanism Confidence's stage C introduced —
  // see the wrap-up handling in coach-local.mjs. This is "the busiest area,
  // most people arrive here first" (storyboard.html), so it sees the most
  // turns and the most chances to stall; reflecting the concrete plan back
  // ("here's what you're walking away with") is an even more natural fit
  // here than in Confidence, since this area's endpoint is a literal plan
  // (method + language + resources + timeline), not just a feeling.
  wrapUp: "E",

  // No supersedes yet — nothing measured has shown a lexical-collision problem
  // the way "raise"/"asked" did for Salary. Add one if testing finds a stage
  // whose keywords keep winning after the conversation has clearly moved on.
  supersedes: [],

  stages: {
    A: {
      label: "Deciding whether, or which direction",
      describes:
        "NO real prior work experience in another field, and no direction settled: unsure tech is right for them, torn between fields, or curious what the work is like day-to-day. If they name a previous job or profession, that's stage B instead, even if they're also field-unsure — prior career is the distinguishing fact. Giveaway words: \"not sure\", \"which field\", \"torn between\", \"where do I begin\" — with no past career mentioned.",
      facets: ["S1", "S1a", "S7", "S7a", "S8", "S8a", "G3", "G3a", "G5"],
    },
    B: {
      label: "Translating a previous career",
      describes:
        "Real prior work experience in a DIFFERENT field, asking how it applies or whether it counts — a career change, not a first career decision. Giveaway words: \"transferable skills\", \"switching careers\", \"start at the bottom\". Field-uncertainty can co-occur and still counts as B, not A. But this tie-break is A-vs-B ONLY: once THIS message is clearly about method (C) or concrete execution (D), classify it there instead, even with a prior career mentioned earlier — a prior career is a fact about her, not a stage she's stuck in.",
      facets: ["S5", "S5a", "G4"],
    },
    C: {
      label: "Choosing how to learn",
      describes:
        "Field settled or not the live question — open decision is METHOD: self-teach vs. bootcamp vs. degree, or evaluating a programme, with no concrete detail about it asked yet. Applies regardless of a prior career (B) — a method question is C. Giveaway words: \"bootcamp\", \"degree\", \"self-taught\", \"programme\", \"course\". But this tie-break is C-vs-D ONLY: the MOMENT a method is named (in this message or an earlier one) AND the live question asks a concrete detail about it — how long it takes, what it costs, what to actually do — that's stage D instead, even within the same message that names the method. \"A self-paced bootcamp sounds right, how long would that realistically take\" is D, not C: a method was just named and the live question is D's own giveaway (\"how long\", \"realistically\").",
      facets: ["S2", "S2a", "S2b", "G1", "G1a"],
    },
    D: {
      label: "Actively executing a chosen plan",
      describes:
        "Method decided — wants concrete specifics: a language, free resources, a realistic timeline, savings needed. A THING to use, not a decision. Applies regardless of a prior career (B) — \"how long will this take\" is D, not B. This is also the read the MOMENT a method named earlier in C is followed by a concrete-detail question — the method doesn't need to be re-litigated, only the detail answered. Giveaway words: \"which language\", \"resources\", \"how long\", \"realistically\", \"should I save\" — especially right after a method has just been named.",
      facets: ["S3", "S4", "S4a", "S4b", "S6", "S6a", "G2", "G6"],
    },
    E: {
      label: "Wrapping up",
      describes:
        "The advice has landed and she is settling rather than asking. She agrees with it, thanks you for it, says she will try it, says it makes sense, or answers a closing check with a yes. Giveaway words: \"that makes sense\", \"okay, I'll try that\", \"thank you\", \"that helps\", \"yeah, I think so\", \"no, that's it\". Do NOT choose this because a message is short or vague — only because she is agreeing or closing. If she raises anything new, however small, or asks another question, she is back in A, B, C or D and this is not the stage. The reply itself MUST name at least one concrete element of the plan actually settled on in this conversation — the method, the language, the timeline, the resource — not just an approving generality like \"you've got something to work with.\" If nothing concrete was ever settled, say so honestly rather than inventing a plan to reflect back.",
      // Everything in the area, deliberately — shown for voice and range,
      // answered from none of it. See Confidence's stage C for why.
      facets: [
        "S1", "S1a", "S7", "S7a", "S8", "S8a", "G3", "G3a", "G5",
        "S5", "S5a", "G4",
        "S2", "S2a", "S2b", "G1", "G1a",
        "S3", "S4", "S4a", "S4b", "S6", "S6a", "G2", "G6",
      ],
    },
  },
};
