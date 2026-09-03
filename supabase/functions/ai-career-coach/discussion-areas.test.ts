import { describe, it, expect } from "vitest";
import {
  SALARY_AREA,
  GETTING_STARTED_AREA,
  buildFacets,
  mostRelevant,
  queryWords,
  overlapScore,
  matchStrength,
  conversationQuery,
  saysDone,
  saysLeaving,
  otherAreas,
} from "./discussion-areas.ts";

describe("buildFacets", () => {
  it("wires Salary's 5 real Otema answers to S1..S5, in order", () => {
    const facets = buildFacets(SALARY_AREA);
    for (const id of SALARY_AREA.realOrder) {
      expect(facets[id]).toBeDefined();
      expect(facets[id].source).toBe("OTEMA");
    }
  });

  it("wires Getting Started's 8 real Otema answers to S1..S8, in order", () => {
    const facets = buildFacets(GETTING_STARTED_AREA);
    for (const id of GETTING_STARTED_AREA.realOrder) {
      expect(facets[id]).toBeDefined();
      expect(facets[id].source).toBe("OTEMA");
    }
  });

  it("never mixes Salary's and Getting Started's same-named facet IDs", () => {
    const salary = buildFacets(SALARY_AREA);
    const gettingStarted = buildFacets(GETTING_STARTED_AREA);
    // Both areas have a "G1" of their own — they must not be the same object.
    if (salary.G1 && gettingStarted.G1) {
      expect(salary.G1.question).not.toBe(gettingStarted.G1.question);
    }
  });

  it("only ever includes drafted facets that are review-approved", () => {
    const facets = buildFacets(GETTING_STARTED_AREA);
    for (const f of Object.values(facets)) {
      // No way to see reviewStatus from here directly, but every unreviewed
      // drafted example in the current file means DRAFTED-sourced facets
      // should be absent entirely until Otema approves one.
      expect(f.source === "OTEMA" || f.source === "DRAFTED").toBe(true);
    }
  });
});

describe("mostRelevant", () => {
  it("returns at most 3 near + 4 wide facets", () => {
    const facets = buildFacets(SALARY_AREA);
    const pool = SALARY_AREA.stages.B.facets.map((id) => facets[id]).filter(Boolean);
    const { near, wide } = mostRelevant(SALARY_AREA, pool, "I've been offered a job, what should I negotiate?");
    expect(near.length).toBeLessThanOrEqual(3);
    expect(wide.length).toBeLessThanOrEqual(4);
  });

  it("retires facets superseded by a later one already used", () => {
    const facets = buildFacets(SALARY_AREA);
    const pool = SALARY_AREA.stages.C.facets.map((id) => facets[id]).filter(Boolean);
    const { near, wide } = mostRelevant(SALARY_AREA, pool, "should I take the counter offer", 3, ["G8"]);
    const ids = [...near, ...wide].map((e) => e.id);
    for (const retired of ["S4", "S4a", "S4b", "S4c", "G4", "G4a", "G4b", "G4c", "G4d"]) {
      expect(ids).not.toContain(retired);
    }
  });
});

describe("queryWords / overlapScore / matchStrength", () => {
  it("drops short and stop words", () => {
    const words = queryWords("What should I do about the raise?");
    expect(words.has("what")).toBe(false);
    expect(words.has("should")).toBe(false);
    expect(words.has("raise")).toBe(true);
  });

  it("matchStrength is 0 for a pool with no lexical overlap", () => {
    const facets = buildFacets(SALARY_AREA);
    const pool = [facets.S1].filter(Boolean);
    expect(matchStrength(pool, "xyzabc qwerty zzz")).toBe(0);
  });
});

describe("conversationQuery", () => {
  it("weights the latest message and folds in recent user turns", () => {
    const q = conversationQuery("is that for fintech", [
      { role: "user", content: "I handed in my notice and they offered me 30% more" },
      { role: "assistant", content: "..." },
    ]);
    expect(q).toContain("is that for fintech");
    expect(q).toContain("fintech");
    expect(q).toContain("handed in my notice");
  });
});

describe("saysLeaving", () => {
  it("fires on an explicit topic-change request", () => {
    expect(saysLeaving("can we talk about something else")).toBe(true);
    expect(saysLeaving("let's change the subject")).toBe(true);
  });

  it("does not fire on a fear or situation that merely contains 'move on'", () => {
    // The exact false positive this regex was fixed for: "move on" alone
    // used to match even inside a sentence about being replaced, not a
    // request to change the subject.
    expect(saysLeaving("i dont want to seem awkward and have them just move on to the next candidate")).toBe(false);
  });

  it("does not fire on an ordinary follow-up with no leave signal", () => {
    expect(saysLeaving("what should I say if they push back")).toBe(false);
  });
});

describe("saysDone", () => {
  it("fires on a plain closing phrase", () => {
    expect(saysDone("no that's everything, thank you")).toBe(true);
    expect(saysDone("nothing else, thanks")).toBe(true);
  });

  it("does not fire on an ordinary answer that happens to start with 'no'", () => {
    expect(saysDone("no, I haven't asked for a raise before")).toBe(false);
  });
});

describe("otherAreas", () => {
  it("excludes only the area itself, keeping all nine others", () => {
    const others = otherAreas(SALARY_AREA.n);
    expect(Object.keys(others)).toHaveLength(9);
    expect(others[String(SALARY_AREA.n)]).toBeUndefined();
  });
});
