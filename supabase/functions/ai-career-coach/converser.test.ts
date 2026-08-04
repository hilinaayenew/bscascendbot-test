import { describe, it, expect } from "vitest";
import { resolveNarrowOrAnswer, withChoices, CHOICES_MARKER } from "./converser.ts";

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
});
