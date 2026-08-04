import { describe, it, expect } from "vitest";
import { TOPIC_CATEGORIES, KNOWLEDGE_BASE } from "./bsc-knowledge.ts";

// Routing decisions (whether a message needs narrowing, which topic it maps
// to) are now entirely the AI's own judgment, guided by instructions in
// bsc-coach.ts/botema-coach.ts — there's no deterministic pre-check left to
// unit test. What's left here just guards the data these instructions rely on.

describe("TOPIC_CATEGORIES", () => {
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
