import { describe, it, expect } from "vitest";
import { resolveNarrowOrAnswer, withChoices, CHOICES_MARKER, pickRandom } from "./converser.ts";

describe("pickRandom", () => {
  it("returns exactly n items when the pool is larger than n", () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8];
    const picked = pickRandom(pool, 3);
    expect(picked).toHaveLength(3);
  });

  it("never returns duplicates from a pool of unique items", () => {
    const pool = ["a", "b", "c", "d", "e", "f"];
    const picked = pickRandom(pool, 4);
    expect(new Set(picked).size).toBe(picked.length);
  });

  it("only returns items that were actually in the pool", () => {
    const pool = [10, 20, 30, 40, 50];
    const picked = pickRandom(pool, 3);
    picked.forEach((item) => expect(pool).toContain(item));
  });

  it("caps at the pool size when n exceeds it, without erroring", () => {
    const pool = [1, 2, 3];
    expect(pickRandom(pool, 10)).toHaveLength(3);
  });

  it("does not mutate the original pool", () => {
    const pool = [1, 2, 3, 4, 5];
    const copy = [...pool];
    pickRandom(pool, 3);
    expect(pool).toEqual(copy);
  });

  it("eventually surfaces items beyond the first n across repeated calls", () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const seen = new Set<number>();
    for (let i = 0; i < 50; i++) {
      pickRandom(pool, 3).forEach((item) => seen.add(item));
    }
    // With 50 draws of 3-from-10, it would be statistically absurd not to
    // see items outside the first 3 — this is the whole point of the fix.
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe("resolveNarrowOrAnswer", () => {
  it("converts a well-formed NARROW_QUESTION/NARROW_OPTIONS block into a choices message", () => {
    const raw = `NARROW_QUESTION: Which track are you most drawn to?
NARROW_OPTIONS: Web development | Data | IT support`;
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toBe(
      withChoices("Which track are you most drawn to?", ["Web development", "Data", "IT support"])
    );
    expect(result).toContain(CHOICES_MARKER);
  });

  it("passes through a normal prose answer unchanged, even one ending in a question", () => {
    const raw = "Lead with a summary tied to the role and quantify your achievements. What role are you targeting?";
    expect(resolveNarrowOrAnswer(raw)).toBe(raw);
  });

  it("passes through unchanged if fewer than 2 options are given", () => {
    const raw = `NARROW_QUESTION: Which track?
NARROW_OPTIONS: Web development`;
    expect(resolveNarrowOrAnswer(raw)).toBe(raw);
  });

  it("is case-insensitive on the marker labels", () => {
    const raw = `narrow_question: Which track are you most drawn to?
narrow_options: Web | Data | IT`;
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain(CHOICES_MARKER);
    expect(result).toContain("Which track are you most drawn to?");
  });

  it("trims whitespace around each option", () => {
    const raw = `NARROW_QUESTION: Which track?
NARROW_OPTIONS:   Web development   |  Data   |IT support  `;
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toBe(withChoices("Which track?", ["Web development", "Data", "IT support"]));
  });

  it("catches a real observed failure: model hedges across tracks instead of self-reporting", () => {
    const raw = "Focus on a simple, flexible starting path: use free, reputable beginner resources like CS50, freeCodeCamp, and The Odin Project. Since you're aiming for college, keep a record of what you learn. How many hours per week can you commit, and which area do you want to emphasize in college—web, data, or IT?";
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain(CHOICES_MARKER);
    expect(result).toContain("Web");
    expect(result).toContain("Data");
    expect(result).toContain("IT");
    expect(result).not.toContain("CS50");
  });

  it("catches a three-item enumerated question even without an explicit self-report", () => {
    const raw = "Networking and referrals help most early on. Which would you like to focus on—CV, networking, or interview prep?";
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain(CHOICES_MARKER);
    expect(result).toContain("CV");
    expect(result).toContain("Networking");
    expect(result).toContain("Interview prep");
  });

  it("does NOT trigger on a normal two-item question ending an already-focused answer", () => {
    const raw = "Self-teaching is cheapest and most flexible, a bootcamp is faster and structured. What matters most to you right now — time or money?";
    expect(resolveNarrowOrAnswer(raw)).toBe(raw);
  });

  it("caps a real observed multi-section rundown down to the opening answer and closing question", () => {
    const raw = [
      "Foundations to learn: OSI and TCP/IP concepts, subnetting, routing and switching basics.",
      "Beginner-friendly labs: TryHackMe's networking paths, OverTheWire Bandit, and Wireshark practice.",
      "Security basics to cover: threat models, defense in depth, and common attack vectors.",
      "Tools and hands-on skills: learn Nmap, Wireshark, basic Linux command line, and firewall rules.",
      "Certification and college prep options: CompTIA Network+ and Security+ are practical entry credentials.",
      "Free resources to keep in your toolkit: CS50, Google IT Support Certificate, TryHackMe, OverTheWire.",
      "What college program are you aiming for, and how many hours per week can you dedicate to study and labs?",
    ].join("\n\n");
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain("Foundations to learn");
    expect(result).toContain("What college program are you aiming for");
    expect(result).not.toContain("Beginner-friendly labs");
    expect(result).not.toContain("Certification and college prep");
  });

  it("leaves a normal two-paragraph answer (advice + closing question) untouched", () => {
    const raw = "Lead with a summary tied to the role and quantify your achievements.\n\nWhat role are you targeting?";
    expect(resolveNarrowOrAnswer(raw)).toBe(raw);
  });
});
