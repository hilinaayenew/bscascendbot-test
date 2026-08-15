// ============================================================================
// Area 9 · Salary & Negotiation — the coverage map
//
// This is NOT a route. It records only what material each stage can draw on;
// nothing here decides what the coach says. One classification call places the
// user in a stage, the stage scopes which of Otema's answers get injected, and
// the model writes the reply from that material.
//
// To add an area, copy this shape into scripts/areas/area-NN-name.mjs. The
// three things that matter, in order:
//
//   1. `stages` — what genuinely separates one conversation in this area from
//      another. Salary's are situational (before an offer / offer on the table
//      / already in the job) because that is what actually differs. Another
//      area may not divide situationally at all — Confidence probably doesn't.
//
//   2. `describes` — must say what distinguishes this stage FROM THE OTHERS,
//      not just what it is about. The salary classifier flipped between B and C
//      on the same input until these said "prospective employer" versus
//      "already work there". Name the giveaway words.
//
//   3. `facets` — the answers available at that stage. A stage with two answers
//      behind it will be thin and repetitive; that is a signal to write more,
//      not to merge the stage away.
// ============================================================================

export default {
  n: 9,
  name: "Salary & Negotiation",

  // Otema's real answers, in question-bank order (Q46-Q50), are S1..S5.
  realOrder: ["S1", "S2", "S3", "S4", "S5"],

  // The topic key in KNOWLEDGE_BASE and on the examples.
  topic: "salary",

  // Noun phrases for a closing summary. The labels below are clause-shaped and
  // read as nonsense in a list ("we covered an offer is on the table").
  stageSummary: {
    A: "what the role is worth",
    B: "the offer on the table",
    C: "the conversation with your employer",
  },

  stages: {
    A: {
      label: "Before there's an offer",
      describes:
        "They are pricing themselves — working out what a role pays, or what they're worth coming from another field. No live negotiation, no employer at the table yet.",
      facets: ["S1", "G2", "G10", "G10a", "G5"],
    },
    B: {
      label: "An offer is on the table",
      describes:
        "They are negotiating with a PROSPECTIVE employer. A job offer exists, or one is being discussed — they do not work there yet. Anything about an offer, an equity package, a signing bonus, or what to say during hiring.",
      facets: ["S2", "S2a", "S3", "S3a", "S5", "S5a", "G3", "G3a", "G6", "G7", "G7a", "G9", "G9a", "G5"],
    },
    C: {
      label: "Already in the job",
      describes:
        "They ALREADY WORK for the employer in question, so the money conversation is one they must start themselves. A rise asked for or refused, a manager who said no, a pay gap with a colleague, a counter-offer on resigning. If the words manager, my team, my job, my boss or a raise appear, this is almost always the stage — even if a negotiation is live.",
      facets: ["S4", "S4a", "S4b", "S4c", "G1", "G1a", "G1b", "G4", "G4a", "G4b", "G4c", "G4d", "G8", "G9", "G9a"],
    },
  },
};
