// ============================================================================
// Area 6 · Confidence & Imposter Syndrome — the coverage map
//
// Two stages, not situational (see storyboard.html sub-area6 for the reasoning
// behind the split): A is an internal narrative being processed — comparing
// yourself, discounting your own wins, not feeling like you belong. B is
// self-doubt that has stalled a concrete action — not speaking up, not
// applying, not putting yourself forward. The distinguishing question is
// whether there's a decision sitting behind the feeling.
//
// `topic` is for loadKnowledge() only — KNOWLEDGE_BASE["mindset"]. It is NOT
// used to pull Otema's real answers the way every other area's is: her 5 real
// answers here carry pre-v4 topic tags ("belonging", "confidence" x3,
// "general") that the still-deployed BoteMindset.loadFewShotExamples() filters
// on by challenge_type, and "general" is also the tag on an unrelated
// Wellbeing answer (Q35). Retagging them would risk changing what the
// deployed coach serves and would still collide on "general". `realQuestions`
// below sidesteps both by matching on the literal question text instead.
// ============================================================================

export default {
  n: 6,
  name: "Confidence & Imposter Syndrome",

  topic: "mindset",

  // Otema's 5 real answers (Q36-40), in question-bank order, matched by exact
  // text rather than by topic tag — see the note above. S1..S5 in this order.
  realQuestions: [
    "I constantly feel like I don't belong in tech.",
    "How do I handle moments when I feel less competent than my colleagues?",
    "How do I build confidence speaking up in meetings or presenting my work?",
    "How do I stop holding myself back from applying to roles I feel underqualified for?",
    "How do I actually internalise my achievements instead of brushing them off?",
  ],
  realOrder: ["S1", "S2", "S3", "S4", "S5"],

  stageSummary: {
    A: "working through how you feel about yourself",
    B: "a decision stalled by that feeling",
    C: "pulling together what you're going to do",
  },

  fallbackQuestion: "What feels true for you right now?",

  // Stage C is the wrap-up. Named here rather than inferred from the letter so
  // the harness can find it without every area having to have one — see the
  // wrap-up handling in coach-local.mjs. Two things key off this: the
  // classifier can route to it directly when she signals the advice has
  // landed, and the stall rule diverts into it once before closing, so a
  // conversation that finished and a conversation that ran dry stop sounding
  // identical from the inside.
  wrapUp: "C",

  // No supersedes yet — nothing measured, and there's no live testing at all
  // to have measured it against.
  supersedes: [],

  stages: {
    A: {
      label: "Processing the narrative",
      describes:
        "A feeling being worked through, with no action currently stalled on it: comparing yourself to colleagues, not feeling like you belong, discounting your own achievements or other people's praise. Giveaway words: \"I feel like\", \"don't belong\", \"less competent\", \"brush off\", \"imposter\". If the message names a specific thing she is NOT doing because of the feeling — not applying, not speaking up, not putting herself forward — that's stage B instead, even if the feeling itself sounds the same.",
      facets: ["S1", "S1b", "S2", "S5", "S5a", "G1", "G3", "G5", "G6", "G7", "G8", "G9", "G10", "S1a"],
    },
    B: {
      label: "A stalled action",
      describes:
        "Self-doubt is the stated reason something concrete isn't happening: not speaking up in a meeting, not applying to a role, not accepting or asking for an opportunity. The distinguishing fact is a decision sitting behind the feeling, not just the feeling on its own. Giveaway words: \"holding myself back\", \"scared to apply\", \"won't speak up\", \"turned it down\", \"didn't put myself forward\".",
      facets: ["S3", "S3b", "S3c", "S4", "G2", "G4", "S3a"],
    },
    C: {
      label: "Wrapping up",
      describes:
        "The advice has landed and she is settling rather than asking. She agrees with it, thanks you for it, says she will try it, says it makes sense, or answers a closing check with a yes. Giveaway words: \"that makes sense\", \"okay, I'll try that\", \"thank you\", \"that helps\", \"yeah, I think so\", \"no, that's it\". Do NOT choose this because a message is short or vague — only because she is agreeing or closing. If she raises anything new, however small, or asks another question, she is back in A or B and this is not the stage.",
      // Everything in the area, and deliberately so: C is shown the whole
      // range for voice and told to answer from none of it. Giving it a
      // narrower set would only make it likelier to reach for one and start
      // advising again, which is the exact thing this stage exists to stop.
      facets: [
        "S1", "S1b", "S2", "S5", "S5a", "G1", "G3", "G5", "G6", "G7", "G8", "G9", "G10", "S1a",
        "S3", "S3b", "S3c", "S4", "G2", "G4", "S3a",
      ],
    },
  },
};
