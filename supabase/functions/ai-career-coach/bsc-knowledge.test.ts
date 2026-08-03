import { describe, it, expect } from "vitest";
import { isBroadStartingAsk, TOPIC_CATEGORIES, KNOWLEDGE_BASE } from "./bsc-knowledge.ts";

describe("isBroadStartingAsk", () => {
  const shouldBeBroad = [
    "am currently learning tech and what magerials should i use", // exact real failure case, incl. typo + dropped pronoun
    "i am currently learning tech and what materials should i use",
    "help me get into tech",
    "how do i start in tech",
    "how do i learn tech",
    "i want to get into tech",
    "i want to begin learning tech",
    "i am trying to learn tech",
    "im trying to start in tech",
    "im currently learning tech",
    "guide me into tech",
    "where do i start with tech",
    "how can i break into tech",
    "i am trying to learn tech in ethiopia .help me",
    "i want a job",
    "how do i get a job in tech",
    "programming is hard for me",
    "i need help with my career",
    // Accepted false positive: not tech-related, but on a tech-career-coaching
    // app this tradeoff is cheap. Documented here so a future change that
    // narrows the heuristic and "fixes" this doesn't look like a regression.
    "whats the best job for astronauts",
    // Negated-tech cases: this function only FLAGS a message for the AI to
    // confirm (see BROAD_ASK_HINT in index.ts) — it deliberately does not
    // try to resolve negation/contradiction itself. Getting these right end
    // to end is the AI-confirmation step's job, not something testable here
    // without a live API call.
    "i want a field that is not related to tech",
    "i don't want a career in tech",
    "give me a job that isn't tech",
    "i want something outside of tech",
    "im not interested in tech at all",
  ];

  const shouldNotBeBroad = [
    "how do i learn python",
    "help me write a cv",
    "is coding still worth it because of ai",
    "whats a good career in data science",
    "hi",
    "hello how are you",
    "whats the capital of france",
    "i feel like an imposter",
    "i want to apply to google and i dont know how",
    "how is it like working in kenya",
    "how do i negotiate salary",
    "tell me about ux design",
  ];

  it.each(shouldBeBroad)("flags broad ask: %s", (message) => {
    expect(isBroadStartingAsk(message)).toBe(true);
  });

  it.each(shouldNotBeBroad)("does not flag specific/unrelated ask: %s", (message) => {
    expect(isBroadStartingAsk(message)).toBe(false);
  });
});

describe("TOPIC_CATEGORIES", () => {
  // Topic classification is now the AI's own judgment (see the `topic` enum
  // on UpdateCareerTopic in bsc-functions.ts), not a testable pure function —
  // this just guards against the enum drifting out of sync with the actual
  // knowledge base, which would silently break a category for the AI.
  it("has a KNOWLEDGE_BASE entry for every category except the general fallback", () => {
    for (const category of TOPIC_CATEGORIES) {
      if (category === "general") continue;
      expect(KNOWLEDGE_BASE[category], `missing KNOWLEDGE_BASE["${category}"]`).toBeTruthy();
    }
  });

  it("has no duplicate categories", () => {
    expect(new Set(TOPIC_CATEGORIES).size).toBe(TOPIC_CATEGORIES.length);
  });
});
