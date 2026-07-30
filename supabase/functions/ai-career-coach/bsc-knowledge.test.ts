import { describe, it, expect } from "vitest";
import { isBroadStartingAsk, classifyTopic } from "./bsc-knowledge.ts";

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

describe("classifyTopic", () => {
  const cases: Array<[string, string]> = [
    ["how do I learn python", "getting_started"],
    ["help me write a cv", "cv_job_search"],
    ["salary negotiation tips", "salary"],
    ["imposter syndrome", "mindset"],
    ["AI replacing my job", "ai_impact"],
    ["something totally unrelated to any topic", "general"],
  ];

  it.each(cases)("classifies %s as %s", (message, expected) => {
    expect(classifyTopic(message)).toBe(expected);
  });
});
