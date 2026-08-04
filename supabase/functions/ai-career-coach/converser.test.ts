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
});
