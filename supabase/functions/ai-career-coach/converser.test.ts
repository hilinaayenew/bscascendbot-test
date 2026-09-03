import { describe, it, expect } from "vitest";
import { resolveNarrowOrAnswer, withChoices, CHOICES_MARKER, pickRandom, LONG_FORM_ESCAPE_HATCH, stripUnsourcedFigures, hasUnsourcedFigure, NO_RELIABLE_PAY_DATA, capSentences, flattenInlineList, stripImplausibleFigures, stripImplausiblePeriods, dropRepeatedSentences, stripAdsOversell, stripQuotaConcession, dropSecondQuestion, openerShape, isValidatingOpener, stripRepeatedOpener, stripUnearnedValidation, flattenEnumerations, dropDanglingQuestion, endsOnDanglingReference, isOnlyAQuestion, echoesUser, stripInventedLocation, mentionedByUser, capSentencesFlagged } from "./converser.ts";

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

// ── Implausible figures ─────────────────────────────────────────────────────
// A number she cannot actually get is worse than no number: it sets an
// expectation that will damage her in the room.

describe("stripImplausibleFigures", () => {
  it("drops the Crossover-style outlier presented beside a local salary", () => {
    const raw =
      "I could only find Lagos-specific figures for mid-level backend roles, and they anchor around NGN 1,927,160 per year (Glassdoor, 2026). " +
      "For fully remote roles with a European company, there are higher anchors like USD 200,000 per year (Crossover, 2026). " +
      "Are you aiming for a fully remote EU role?";
    const out = stripImplausibleFigures(raw);
    expect(out).not.toContain("200,000");
    expect(out).not.toContain("Crossover");
    expect(out).toContain("NGN 1,927,160");
    expect(out).toContain("Are you aiming for a fully remote EU role?");
  });

  it("drops an outlier within a single currency", () => {
    const raw =
      "Mid-level roles sit around NGN 300,000 a month (Glassdoor, 2026). " +
      "Some listings claim NGN 4,000,000 a month (a recruiter ad). " +
      "What are you targeting?";
    const out = stripImplausibleFigures(raw);
    expect(out).not.toContain("4,000,000");
    expect(out).toContain("300,000");
  });

  it("leaves a sane range in one currency alone", () => {
    const raw = "Expect NGN 250,000 to NGN 600,000 a month (CareerBuddy, 2026). What level are you at?";
    expect(stripImplausibleFigures(raw)).toBe(raw);
  });

  it("handles k and m shorthand", () => {
    const raw = "Around NGN 300k a month is typical. Some claim NGN 5m a month. What are you targeting?";
    const out = stripImplausibleFigures(raw);
    expect(out).not.toContain("5m");
    expect(out).toContain("300k");
  });

  it("ignores text with a single figure", () => {
    const raw = "Roughly NGN 298,578 a month (Glassdoor, 2024). Does that match what you've seen?";
    expect(stripImplausibleFigures(raw)).toBe(raw);
  });

  it("keeps the first currency and drops the rest — it cannot convert between them", () => {
    const raw = "It could be USD 200,000 a year. Or EUR 300,000 a year.";
    const out = stripImplausibleFigures(raw);
    expect(out).toContain("USD 200,000");
    expect(out).not.toContain("EUR 300,000");
  });

  it("falls back to the method when nothing survives but a question", () => {
    const raw = "Around NGN 300,000 a month. Some say USD 200,000 a year. What are you targeting?";
    const out = stripImplausibleFigures(raw);
    expect(out).not.toContain("USD 200,000");
    expect(out).toContain("NGN 300,000");
  });
});

// ── Cap must not strand a half-sentence ─────────────────────────────────────
// Observed: answers cut mid-clause ("...align on pay now and revisit in")
// because the closing question wasn't the final sentence, so nothing was
// rescued and everything after the cap was dropped.

describe("capSentences — closing question and quotes", () => {
  it("rescues a question that is not the last sentence", () => {
    const raw =
      "One point here. Two points here. Three points here. What would you like to do? " +
      "A stray extra sentence the model tacked on afterwards.";
    const out = capSentences(raw);
    expect(out).toContain("What would you like to do?");
    expect(out.trim().endsWith("?")).toBe(true);
  });

  it("never ends mid-clause", () => {
    const raw =
      "First sentence of advice. Second sentence of advice. Third sentence of advice. " +
      "Fourth sentence of advice. When would you want to have that conversation? Trailing note.";
    const out = capSentences(raw);
    expect(out.trim()).toMatch(/[.!?]$/);
  });

  it("does not split inside a quoted script", () => {
    const raw =
      "Frame it around the market. Say: \"Based on my research, the market rate is X. " +
      "I'd like us to align on that.\" Then stop talking and let them answer. " +
      "Another sentence. And another one. When is your review?";
    const out = capSentences(raw);
    expect(out).not.toMatch(/market rate is X\.$/);
    expect(out).toContain("When is your review?");
  });

  it("still leaves a short answer untouched", () => {
    const raw = "Walk in with a number already decided. Do you have a range in mind?";
    expect(capSentences(raw)).toBe(raw);
  });
});

// ── Implausible pay periods ─────────────────────────────────────────────────
// The monthly Lagos figure reported as annual: NGN 300k a year is about EUR
// 190. Instructed against explicitly, and it happened twice (ISSUE-023).

describe("stripImplausiblePeriods", () => {
  it("rejects the observed Lagos figures reported as annual", () => {
    const raw =
      "I could only find a couple of Lagos figures: mid-level backend developer about NGN 299,513 per year (Glassdoor, 2026). " +
      "A closely related role is about NGN 316,667 per year (Glassdoor, 2026). " +
      "What's your experience level?";
    const out = stripImplausiblePeriods(raw);
    expect(out).not.toContain("299,513");
    expect(out).not.toContain("316,667");
    // Both figures were the whole answer, so what is left is the honest one.
    expect(out).toBe(NO_RELIABLE_PAY_DATA);
  });

  it("accepts a genuine annual figure", () => {
    const raw = "Mid-level backend in Lagos runs about NGN 3,600,000 per year (Glassdoor, 2026). What level are you?";
    expect(stripImplausiblePeriods(raw)).toBe(raw);
  });

  it("leaves monthly figures alone — they are not the failure mode", () => {
    const raw = "Around NGN 300,000 per month (Glassdoor, 2026). Does that match what you've seen?";
    expect(stripImplausiblePeriods(raw)).toBe(raw);
  });

  it("handles 'a year' and 'annually' as well as 'per year'", () => {
    expect(stripImplausiblePeriods("About NGN 250,000 a year. What next?")).not.toContain("250,000");
    expect(stripImplausiblePeriods("About KES 120,000 annually. What next?")).not.toContain("120,000");
  });

  it("handles k and m shorthand", () => {
    expect(stripImplausiblePeriods("Roughly NGN 300k per year. And you?")).not.toContain("300k");
    expect(stripImplausiblePeriods("Roughly NGN 4m per year. And you?")).toContain("4m");
  });

  it("falls back to the method when nothing credible survives", () => {
    const raw = "It's about NGN 299,513 per year.";
    expect(stripImplausiblePeriods(raw)).toBe(NO_RELIABLE_PAY_DATA);
  });

  it("ignores currencies it has no floor for", () => {
    const raw = "About XYZ 100 per year. What next?";
    expect(stripImplausiblePeriods(raw)).toBe(raw);
  });
});

// ── Repeated advice ─────────────────────────────────────────────────────────
// The same three-item checklist on four consecutive turns, including one where
// she admitted a fear rather than asking anything. The instruction lost four
// times out of five conversations.

describe("dropRepeatedSentences", () => {
  const earlier = [
    "Push for a formal written plan: a fixed review date, explicit targets that trigger a raise, and written confirmation. When is the cycle?",
  ];

  it("drops a rephrasing of advice already given", () => {
    const raw =
      "Ask for a formal written review with a fixed date and explicit targets that would trigger a raise, plus written confirmation of the outcome. " +
      "What did she say when you pushed back?";
    const out = dropRepeatedSentences(raw, earlier);
    expect(out).not.toContain("explicit targets");
    expect(out).toContain("What did she say when you pushed back?");
  });

  it("keeps genuinely new advice", () => {
    const raw = "Start looking now, quietly, while the conversation is still open. What would make you stay?";
    expect(dropRepeatedSentences(raw, earlier)).toBe(raw);
  });

  it("always keeps the closing question", () => {
    const raw = "A fixed review date with explicit targets and written confirmation. When is the cycle?";
    expect(dropRepeatedSentences(raw, earlier)).toBe("When is the cycle?");
  });

  it("returns empty when the whole reply was a repeat", () => {
    const raw = "Push for a formal written plan with a fixed review date and explicit targets that trigger a raise.";
    expect(dropRepeatedSentences(raw, earlier)).toBe("");
  });

  it("does nothing on the first reply of a conversation", () => {
    const raw = "Push for a formal written plan. When is the cycle?";
    expect(dropRepeatedSentences(raw, [])).toBe(raw);
  });

  it("leaves short sentences alone — too little to judge", () => {
    const raw = "Be careful here. Push for a formal written plan with fixed review dates and explicit targets. What now?";
    const out = dropRepeatedSentences(raw, earlier);
    expect(out).toContain("Be careful here.");
  });
});

// ── The ads-oversell claim ──────────────────────────────────────────────────
// Seen twice in different words. It is the employer's argument for the low
// offer, and it contradicts both KNOWLEDGE_BASE.salary and Otema's S1.

describe("stripAdsOversell", () => {
  it("drops the observed phrasings", () => {
    const a = "That gap is real—ads often oversell what the company will actually pay. What did they quote?";
    expect(stripAdsOversell(a)).not.toContain("oversell");
    expect(stripAdsOversell(a)).toContain("What did they quote?");

    const b = "You're not imagining it—ads often show higher ranges than the actual offer. What's the number?";
    expect(stripAdsOversell(b)).not.toContain("higher ranges");
  });

  it("leaves legitimate talk about job ads alone", () => {
    const raw = "Local job ads with published ranges are one of the few honest signals. Have you looked at any?";
    expect(stripAdsOversell(raw)).toBe(raw);
  });

  it("leaves the mismatch reading intact — that one is correct", () => {
    const raw = "That isn't a negotiation, it's a mismatch: either they misunderstood the role or they're hoping you don't know. What did they say?";
    expect(stripAdsOversell(raw)).toBe(raw);
  });
});

describe("dropRepeatedSentences — quoted scripts", () => {
  it("drops a repeated script hiding behind a closing question", () => {
    // splitSentences merges the quote with what follows, so the script and the
    // question arrive as one sentence. Exempting anything ending in "?" let a
    // near-verbatim script through on two consecutive turns.
    const before = [
      'Push for a written commitment. Send a short note like: "Hi, I have completed X, Y, Z as discussed. Please confirm in writing by [date] the salary range and the milestones that trigger the raise." What did you deliver?',
    ];
    const raw =
      'This is not complaining, it is about clarity on scope and pay. ' +
      'Try: "Hi, I have completed X, Y, Z as discussed. Please confirm in writing by [date] the salary range and the milestones that trigger the raise." What date do you want to attach?';
    const out = dropRepeatedSentences(raw, before);
    expect(out).toContain("This is not complaining");
    expect(out).not.toContain("Please confirm in writing");
    expect(out.trim().endsWith("?")).toBe(true);
  });

  it("keeps a quoted script the first time it appears", () => {
    const raw = 'Try saying: "Based on my research I am looking at X to Y." What range do you have?';
    expect(dropRepeatedSentences(raw, ["Something entirely unrelated about mentors and networks."])).toBe(raw);
  });
});

describe("stripQuotaConcession", () => {
  // Both of these are real replies from live runs of the Confidence area.
  it("removes an outright agreement that diversity hiring explains her job", () => {
    const raw = "That concern is real and not in your head—diversity hiring does happen, and it can feel personal when you're the one on the receiving end. What have you shipped that you are proud of?";
    const { text, stripped } = stripQuotaConcession(raw);
    expect(stripped).toBe(true);
    expect(text).not.toMatch(/diversity/i);
    expect(text).toContain("What have you shipped");
  });

  it("removes the restatement even though the reply was about to disagree", () => {
    const raw = "You're worried you were hired to hit a diversity number rather than because you were the best. That pattern is real, and you're not alone. What is one project you can point to now that proves your impact?";
    const { text, stripped } = stripQuotaConcession(raw);
    expect(stripped).toBe(true);
    expect(text).not.toMatch(/diversity number/i);
    expect(text).toContain("What is one project");
  });

  it("removes it whether she is described as hired, picked or promoted for it", () => {
    for (const s of [
      "Maybe they picked you to fill a quota, but that is not the whole story.",
      "Some places do promote women to hit a diversity target.",
      "You were not just a box-tick when they offered you the role.",
    ]) {
      expect(stripQuotaConcession(s).stripped).toBe(true);
    }
  });

  it("leaves the answer this rule exists to make room for", () => {
    // S1b's drafted answer. It says the true thing without naming the claim.
    const raw = "You sat the interviews. You got the offer. Nobody hires someone they expect to fail, and no initiative sits an interview on your behalf. What was it in the process itself that made you the one they picked?";
    const { text, stripped } = stripQuotaConcession(raw);
    expect(stripped).toBe(false);
    expect(text).toBe(raw);
  });

  it("does not fire on ordinary talk about a diversity programme she might join", () => {
    const raw = "BSC runs a mentorship programme worth looking at. Would that help?";
    expect(stripQuotaConcession(raw).stripped).toBe(false);
  });
});

// ── Area/stage model guards (ported from scripts/coach-local.mjs) ──────────

describe("dropSecondQuestion", () => {
  it("cuts a second question welded onto the first with 'and'", () => {
    const raw = "Does that feel like something you could try this month, and what area would you target?";
    expect(dropSecondQuestion(raw)).toBe("Does that feel like something you could try this month?");
  });

  it("leaves a single question alone", () => {
    const raw = "Does that make sense to you?";
    expect(dropSecondQuestion(raw)).toBe(raw);
  });

  it("leaves a reply with no closing question alone", () => {
    const raw = "That's the approach I'd take here.";
    expect(dropSecondQuestion(raw)).toBe(raw);
  });
});

describe("openerShape / isValidatingOpener / stripRepeatedOpener", () => {
  it("collapses a swapped-noun validating opener to the same shape", () => {
    expect(openerShape("That disbelief is real and common."))
      .toBe(openerShape("That pattern is real and common."));
  });

  it("recognises the validating-opener family", () => {
    expect(isValidatingOpener("That pattern is real and you're not imagining it.")).toBe(true);
    expect(isValidatingOpener("Apply anyway.")).toBe(false);
  });

  it("strips an opener that repeats a previous reply's exact shape", () => {
    const previous = ["That pattern is real and you're not imagining it. Here's what to do."];
    const reply = "That belief is real and worth naming. Try writing your wins down.";
    expect(stripRepeatedOpener(reply, previous)).toBe("Try writing your wins down.");
  });

  it("allows a second validating opener when the first reply didn't use one", () => {
    const previous = ["Apply anyway. It's the only way to find out."];
    const reply = "That pattern is real and you're not imagining it. Try it.";
    expect(stripRepeatedOpener(reply, previous)).toBe(reply);
  });

  it("leaves a single-sentence reply alone (nothing to strip down to)", () => {
    const previous = ["That pattern is real."];
    const reply = "That pattern is real.";
    expect(stripRepeatedOpener(reply, previous)).toBe(reply);
  });
});

describe("stripUnearnedValidation", () => {
  it("drops an acknowledging opener ahead of advice", () => {
    const raw = "That's real and common in tech. Apply anyway and see what happens.";
    expect(stripUnearnedValidation(raw)).toBe("Apply anyway and see what happens.");
  });

  it("leaves a reply with no acknowledging opener alone", () => {
    const raw = "Apply anyway and see what happens.";
    expect(stripUnearnedValidation(raw)).toBe(raw);
  });
});

describe("flattenEnumerations", () => {
  it("flattens a numbered list into sentences", () => {
    const raw = "Here's the plan: 1. Draft a CV. 2. Apply to five roles. 3. Follow up in a week.";
    const out = flattenEnumerations(raw);
    expect(out).not.toMatch(/\d\./);
    expect(out).toContain("Draft a CV");
  });

  it("leaves plain prose with fewer than 3 markers alone", () => {
    const raw = "First, update your CV. Then apply.";
    expect(flattenEnumerations(raw)).toBe(raw);
  });
});

describe("dropDanglingQuestion / endsOnDanglingReference", () => {
  it("drops a closing question that refers to steps the cap just removed", () => {
    const raw = "Update your CV first. Would you be willing to try those three steps this week?";
    expect(dropDanglingQuestion(raw, true)).toBe("Update your CV first.");
  });

  it("does nothing when capping never happened", () => {
    const raw = "Update your CV first. Would you be willing to try those three steps this week?";
    expect(dropDanglingQuestion(raw, false)).toBe(raw);
  });

  it("flags a closing statement that promises content that isn't there", () => {
    expect(endsOnDanglingReference("Pick one path and do these steps.")).toBe(true);
    expect(endsOnDanglingReference("Pick one path and start today.")).toBe(false);
  });
});

describe("isOnlyAQuestion", () => {
  it("is true when every sentence ends in a question mark", () => {
    expect(isOnlyAQuestion("What feels true for you right now?")).toBe(true);
  });

  it("is false when any sentence is a statement", () => {
    expect(isOnlyAQuestion("Here's what I'd try. Does that make sense?")).toBe(false);
  });
});

describe("echoesUser", () => {
  it("catches a short reply that is mostly her own words read back", () => {
    const message = "yeah I think I can do that — I'll bring it up in our next one-to-one";
    const reply = "Yeah, I think I can do that — I'll bring it up in our next one-to-one.";
    expect(echoesUser(reply, message)).toBe(true);
  });

  it("does not flag a normal reflective opener followed by real advice", () => {
    const message = "eight months of the same maintenance tickets and nothing's changed";
    const reply = "Eight months of the same tickets is a long time to wait quietly. Ask your manager directly for a rotation date.";
    expect(echoesUser(reply, message)).toBe(false);
  });
});

describe("mentionedByUser / stripInventedLocation", () => {
  it("only counts a place as real if she actually said it", () => {
    expect(mentionedByUser("Ghana", "i am not sure where to start")).toBe(false);
    expect(mentionedByUser("Ghana", "i live in accra ghana and want to switch careers")).toBe(true);
  });

  it("never treats a non-place word as satisfying the check", () => {
    expect(mentionedByUser("remote", "i work remote for a company")).toBe(false);
  });

  it("strips a sentence naming a place she never mentioned, even inside a question", () => {
    const raw = "Are you aiming for local Ghana roles or remote-for-abroad opportunities? Either way, start with your network.";
    const out = stripInventedLocation(raw, "i am not sure where to start");
    expect(out).not.toMatch(/ghana/i);
    expect(out).toContain("start with your network");
  });

  it("leaves a place alone once she has actually said it", () => {
    const raw = "Nairobi's market favours generalists early on.";
    expect(stripInventedLocation(raw, "i am based in nairobi")).toBe(raw);
  });
});

describe("capSentencesFlagged", () => {
  it("reports capped:true and keeps the closing question when it trims", () => {
    const raw = "One. Two. Three. Four. Five. Does that make sense?";
    const { text, capped } = capSentencesFlagged(raw, 3);
    expect(capped).toBe(true);
    expect(text.endsWith("Does that make sense?")).toBe(true);
  });

  it("reports capped:false when nothing needed trimming", () => {
    const raw = "One thing. Does that make sense?";
    const { capped } = capSentencesFlagged(raw, 3);
    expect(capped).toBe(false);
  });
});
