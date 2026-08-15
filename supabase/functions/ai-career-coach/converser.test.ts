import { describe, it, expect } from "vitest";
import { resolveNarrowOrAnswer, withChoices, CHOICES_MARKER, pickRandom, LONG_FORM_ESCAPE_HATCH, stripUnsourcedFigures, hasUnsourcedFigure, NO_RELIABLE_PAY_DATA, capSentences, flattenInlineList } from "./converser.ts";

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

  it("does NOT delete a requested deliverable (a CV rewrite) that lands in the 'middle' paragraph", () => {
    // Real observed regression: the paragraph cap kept only the intro and
    // the closing question, silently deleting the actual rewrite the user
    // asked for because it happened to be its own blank-line-separated
    // paragraph in between.
    const raw = [
      "I would rewrite those bullets to foreground software-related impact, measurable outcomes, and a GitHub/portfolio link. Here's a tight rewrite to drop into your CV:",
      "- Scaled a peer-led entrepreneurship program to 200+ students by launching structured sessions and a leadership pipeline.\n- Designed and delivered Big Data, Databases, Data Analysis, and Business Ethics courses with hands-on labs.\n- Established cross-program collaboration to embed entrepreneurship thinking across curricula.",
      "What software stack or projects did you actually work on for these roles, and would you like me to tailor these bullets to a specific job description?",
    ].join("\n\n");
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain("Scaled a peer-led entrepreneurship program");
    expect(result).toContain("Designed and delivered Big Data");
    expect(result).toContain("What software stack or projects");
  });

  it("still collapses plain-prose middle paragraphs even when a list-like paragraph is also present", () => {
    const raw = [
      "Intro sentence promising an answer.",
      "Some unrelated prose section that should still be dropped.",
      "- A legitimately requested bullet\n- Another bullet",
      "Another unrelated prose section that should still be dropped.",
      "Closing question?",
    ].join("\n\n");
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain("A legitimately requested bullet");
    expect(result).not.toContain("unrelated prose section");
  });

  it("preserves a legitimately long plain-prose answer self-marked LONG_FORM_OK, stripping the marker", () => {
    const raw = [
      "LONG_FORM_OK",
      "First paragraph of a genuinely long draft the user asked for.",
      "Second paragraph continuing that same draft, still plain prose.",
      "Third paragraph continuing that same draft, still plain prose.",
      "Does this draft work for you?",
    ].join("\n\n");
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain("First paragraph of a genuinely long draft");
    expect(result).toContain("Second paragraph continuing that same draft");
    expect(result).toContain("Third paragraph continuing that same draft");
    expect(result).not.toContain("LONG_FORM_OK");
  });

  it("still catches enumeration hedging even inside a LONG_FORM_OK-marked answer", () => {
    const raw = [
      "LONG_FORM_OK",
      "Some long-form content.",
      "Which would you like to focus on — CV, networking, or interview prep?",
    ].join("\n\n");
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain(CHOICES_MARKER);
    expect(result).not.toContain("LONG_FORM_OK");
  });

  it("without the marker, a long plain-prose answer still gets capped as before", () => {
    const raw = [
      "First paragraph of a plain-prose answer without the marker.",
      "Second paragraph continuing that answer.",
      "Third paragraph continuing that answer.",
      "Closing question?",
    ].join("\n\n");
    const result = resolveNarrowOrAnswer(raw);
    expect(result).toContain("First paragraph of a plain-prose answer");
    expect(result).toContain("Closing question?");
    expect(result).not.toContain("Second paragraph continuing that answer");
  });
});

describe("LONG_FORM_ESCAPE_HATCH", () => {
  it("is a non-empty instruction string mentioning the marker", () => {
    expect(LONG_FORM_ESCAPE_HATCH).toContain("LONG_FORM_OK");
    expect(LONG_FORM_ESCAPE_HATCH.length).toBeGreaterThan(20);
  });
});

// ── Invented-figure guard ───────────────────────────────────────────────────
// Regression cover for the production output:
//   "Based on Nairobi market data for a junior developer with 2 years,
//    I'm targeting 210k-260k KES base, plus 13th month and learning budget."
// The coach has no pay data and no web access, so any figure is invented and
// any cited source is fabricated.

describe("stripUnsourcedFigures", () => {
  it("strips the observed Nairobi hallucination", () => {
    const raw =
      "Based on Nairobi market data for a junior developer with 2 years, I'm targeting 210k-260k KES base. " +
      "Walk in with a number already decided. What range do you have in mind?";
    const out = stripUnsourcedFigures(raw);
    expect(out).not.toContain("KES");
    expect(out).not.toContain("Nairobi market data");
    expect(out).toContain("Walk in with a number already decided.");
  });

  it("catches currency symbols as well as codes", () => {
    expect(hasUnsourcedFigure("I'd ask for $2,000 a month")).toBe(true);
    expect(hasUnsourcedFigure("aim for ₦500,000")).toBe(true);
    expect(hasUnsourcedFigure("around £45,000 base")).toBe(true);
    expect(hasUnsourcedFigure("try for 260k KES")).toBe(true);
  });

  it("catches a claimed source even with no number attached", () => {
    expect(hasUnsourcedFigure("According to recent salary surveys, rates are rising.")).toBe(true);
    expect(hasUnsourcedFigure("Based on market data for your city, push higher.")).toBe(true);
  });

  it("falls back to teaching the method when nothing survives", () => {
    const raw = "Based on market data, the range is 210k-260k KES.";
    expect(stripUnsourcedFigures(raw)).toBe(NO_RELIABLE_PAY_DATA);
  });

  it("leaves ordinary advice untouched", () => {
    const raw =
      "Turn it around and ask what range they've set aside for the role. " +
      "Do you have a number in mind?";
    expect(stripUnsourcedFigures(raw)).toBe(raw);
  });

  it("does not fire on plain numbers that aren't money", () => {
    const raw =
      "Divide by realistic billable days — not 250, more like 150 once you account for admin. " +
      "Who's your first client likely to be?";
    expect(stripUnsourcedFigures(raw)).toBe(raw);
    expect(hasUnsourcedFigure("about 10 percent below your range")).toBe(false);
    expect(hasUnsourcedFigure("three years without an increase")).toBe(false);
  });

  it("steps aside once a facet has genuinely grounded data", () => {
    const raw = "Per Payscale (March 2026), the band is 210k-260k KES.";
    expect(stripUnsourcedFigures(raw, true)).toBe(raw);
  });

  it("runs as part of resolveNarrowOrAnswer, on every generation path", () => {
    const raw = "Based on market data, aim for 260k KES. Ask for a day to think it over.";
    const out = resolveNarrowOrAnswer(raw);
    expect(out).not.toContain("KES");
    expect(out).toContain("Ask for a day to think it over.");
  });
});

// ── Sentence cap ────────────────────────────────────────────────────────────
// capParagraphs() splits on blank lines, so a single unbroken paragraph runs
// as long as it likes. Observed locally against gpt-5-nano: an eight-sentence
// tour of the whole salary topic in answer to one question.

describe("capSentences", () => {
  it("cuts the single-paragraph rundown capParagraphs can't see", () => {
    const raw =
      "Do your market research first. Talk to two or three peers in the same role. " +
      "Check local job ads for published ranges. Decide a floor and a target before you talk. " +
      "Anchor with a range rather than a single number. Back it with the value you bring. " +
      "Negotiate the whole package, not just base. What role are you targeting?";
    const out = capSentences(raw);
    expect(out).toContain("Do your market research first.");
    expect(out).toContain("What role are you targeting?");
    expect(out).not.toContain("Negotiate the whole package");
    expect(out.split(/(?<=[.!?])\s+/)).toHaveLength(4);
  });

  it("always keeps the closing question", () => {
    const raw = "One. Two. Three. Four. Five. Six. So what's your situation?";
    expect(capSentences(raw).endsWith("So what's your situation?")).toBe(true);
  });

  it("leaves a short answer alone", () => {
    const raw = "Walk in with a number already decided. Do you have a range in mind?";
    expect(capSentences(raw)).toBe(raw);
  });

  it("keeps out of the way of real paragraph structure", () => {
    const raw = "First para is long enough to matter here. Second sentence. Third one too. Fourth.\n\nA closing question?";
    expect(capSentences(raw)).toBe(raw);
  });

  it("does not truncate a deliberate list", () => {
    const raw = "Here are the steps:\n- research the range\n- decide a floor\n- ask for a day\n- confirm in writing\n- follow up";
    expect(capSentences(raw)).toBe(raw);
  });

  it("keeps a long answer that has no closing question from losing its end", () => {
    const raw = "One. Two. Three. Four. Five. Six.";
    const out = capSentences(raw);
    expect(out).toBe("One. Two. Three. Four.");
  });
});

// ── Inline lists ────────────────────────────────────────────────────────────
// Told not to write lists, the model complied with the letter — no line breaks
// — and wrote one inline with dashes instead.

describe("flattenInlineList", () => {
  it("flattens the observed inline salary list", () => {
    const raw =
      "I could only find a couple of Lagos figures. Glassdoor lists: " +
      "- Mid-level backend developer in Lagos: NGN 298,578 per month (Glassdoor, 2024). " +
      "- Backend developer in Lagos: total pay about NGN 257,167 per month. " +
      "What are you targeting?";
    const out = flattenInlineList(raw);
    expect(out).not.toMatch(/\s-\s[A-Z]/);
    expect(out).toContain("298,578");
    expect(out).toContain("What are you targeting?");
  });

  it("leaves em-dash asides alone", () => {
    const raw = "Walk in with a number already decided — the awkwardness passes in a minute — and hold it.";
    expect(flattenInlineList(raw)).toBe(raw);
  });

  it("leaves hyphenated words alone", () => {
    const raw = "Look for mid-level and senior-level roles in well-funded companies.";
    expect(flattenInlineList(raw)).toBe(raw);
  });

  it("ignores a single dash — that's an aside, not a list", () => {
    const raw = "Ask for the range - Then decide.";
    expect(flattenInlineList(raw)).toBe(raw);
  });

  it("leaves a real multi-line list to capParagraphs", () => {
    const raw = "Steps:\n- research the range\n- decide a floor\n- ask for a day";
    expect(flattenInlineList(raw)).toBe(raw);
  });
});
