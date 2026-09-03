// ============================================================================
// Area 1 · Getting Started — test conversations
//
// Same shape as scripts/scenarios/salary.mjs. Slots 01-04 are FIXED and
// committed — do not rewrite them casually. Slot 05 is a placeholder written
// for this first build (no area-tester agent run has replaced it yet); treat
// it as regenerable once that agent is run against this area.
//
// Every conversation runs FIVE user turns.
// ============================================================================

import { replyOf, everyReplyAsks, noRepeatedOpeners, jargonPerReply, maxRepeatOverlap, extractiveQuestions, noRepeatedOpenerShape, lightChecks, lastReply, wordCount } from "../checks.mjs";

// The stage letter classified on each turn, in order. Line-slicing the raw
// output (e.g. `o.split("\n").slice(0, 6)`) is fragile — the harness's own
// banner eats a variable number of lines before the first "[stage ...]" line
// appears, which produced a false FAIL here even when turn 1 classified
// correctly. Matching "[stage X" directly, in order, isn't fooled by that.
const stagesInOrder = (o) => [...o.matchAll(/\[stage ([A-Z]+)/g)].map((m) => m[1]);

export default [
  {
    id: "01-torn-between-fields",
    title: "Can't settle between data and UX, hasn't built anything in either",
    claim: "Stays in stage A throughout — still deciding, not yet executing — and pushes toward trying something small rather than more thinking, without ignoring that she has little time to try both properly.",
    turns: [
      "I don't know if tech is even for me, I keep going back and forth",
      "one week I want to do data science, the next I want UX",
      "I've never actually built anything in either one",
      "I don't have much time to try both properly",
      "so where do I actually start",
    ],
    checks: [
      ["classified stage A", (o) => /\[stage A/.test(o)],
      ["pushes toward a small, concrete try rather than more deliberation", (o) => /(project|build|try|weekend|small)/i.test(replyOf(o))],
      ["respects the limited-time constraint rather than telling her to try both fully", (o) => /(one|pick|start with|first)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "02-money-motivated-career-changer",
    title: "A teacher switching in purely for stability, not passion",
    claim: "Deliberately probes the A/B boundary: a named prior career (teacher) should place her in stage B even while she's also unsure what to pick — the prior career is what distinguishes B, not field-certainty. Doesn't moralise about a purely financial motivation, values her teaching background, and reaches stage D once she asks a concrete timeline question.",
    turns: [
      "I'm a teacher and I want to switch into tech",
      "honestly it's not really passion, I just want more stable pay",
      "is that a bad reason to do this",
      "what should I actually pick, given that",
      "how long is this going to realistically take me",
    ],
    checks: [
      ["classified stage B on the opening message (named prior career)", (o) => stagesInOrder(o)[0] === "B"],
      ["does not moralise about a money-driven motivation", (o) => !/(shouldn.t|wrong reason|only for the money is|not a good reason)/i.test(replyOf(o))],
      ["values her teaching background as an asset", (o) => /(teach|teaching|classroom|communicat|domain|explain)/i.test(o)],
      ["reaches stage D by the final, concrete timeline question", (o) => stagesInOrder(o).at(-1) === "D"],
      ["reaches a realistic timeframe by the end", (o) => /(year|month|realistic)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["never asks her to disclose personal financial details", (o) => extractiveQuestions(o).length === 0],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "03-bootcamp-legitimacy",
    title: "An 8-week bootcamp promising a job, wanting $6000 upfront",
    claim: "Flags the too-good-to-be-true timeline, asks for real outcome evidence rather than trusting the bootcamp's own stats, and stays practical rather than alarmist.",
    turns: [
      "I've decided I want to do a bootcamp instead of teaching myself",
      "there's one that says I'll be job ready in 8 weeks",
      "how do I know if it's actually legit",
      "they want $6000 upfront",
      "should I just trust their placement stats",
    ],
    checks: [
      ["classified stage C — choosing how to learn", (o) => /\[stage C/.test(o)],
      ["flags the short timeline as a red flag", (o) => /(8.week|eight.week|too (good|short|fast)|promis|facade|three month|red flag)/i.test(o)],
      ["asks for independent evidence, not just their own claim", (o) => /(ask|verify|independent|talk to|graduates|alumni|cohort)/i.test(replyOf(o))],
      ["stays practical rather than telling her to just walk away outright", (o) => !/(never|scam|absolutely not)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "04-constrained-runway",
    title: "Full-time job, two kids, maybe an hour a day",
    claim: "Treats self-teaching plus one protected hour a day as a real, respected plan rather than discouraging her or suggesting money/time she doesn't have.",
    turns: [
      "I want to get into tech but I have a full time job and two kids",
      "there's basically no spare money for courses",
      "I can maybe get an hour a day if I'm lucky",
      "is that even enough to get anywhere",
      "what should I actually spend that hour on",
    ],
    checks: [
      ["does not suggest finding money or time she said she doesn't have", (o) => !/(quit your job|find the money|save up first|take out a loan)/i.test(replyOf(o))],
      ["treats one hour a day as workable, not dismissed", (o) => /(hour|consistent|small|adds up|enough)/i.test(replyOf(o))],
      ["gives a concrete, free thing to actually do with the time", (o) => /(freeCodeCamp|free|resource|project|practice)/i.test(o)],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  // NEW this run
  {
    id: "05-too-old-mid-decision",
    title: "41, rusty Python from years ago, worried she can't compete with 22-year-olds",
    claim: "Probes the storyboard's own Leaving rule for this area — 'the blocker is self-doubt, not a decision (\"I'm too old\"), no amount of resource-listing or method advice touches a confidence problem, offer Area 6 instead' — raised mid-conversation, after a fact (some old Python exposure) that a resource-first answer would be tempted to just restate as if she were starting from zero.",
    turns: [
      "so I keep looking into this coding stuff but idk",
      "did python basics a couple years back in a course, barely remember any of it now tbh",
      "it's more that I'm turning 41 this year and everyone doing bootcamps looks like they're 22",
      "not sure I can actually compete against people that much younger for these jobs",
      "should I even bother starting at this point",
    ],
    checks: [
      ["does not dismiss the age worry with empty reassurance instead of engaging it", (o) => !/(age is just a number|don.t worry about (your )?age|age (is|doesn.t) not (a|an) (real )?(barrier|issue|problem))/i.test(replyOf(o))],
      ["does not invent a statistic about age and hiring", (o) => !/\d+\s?(%|percent)\D{0,40}(older|age|41)/i.test(o)],
      ["does not promise she will get hired or succeed", (o) => !/(you.ll (definitely|certainly)|guarantee|you will get (a job|hired))/i.test(replyOf(o))],
      ["picks up the earlier Python exposure rather than treating her as starting from zero", (o) => /(python|before|already|refresh|remember|rusty)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    // Stage E has never been in front of the model — nothing in slots 01-05
    // ever agrees and stops, the same gap Confidence had before its own
    // stage C got a dedicated scenario. This one is built to actually land
    // on a concrete plan and then close, rather than keep asking.
    id: "06-lands-the-plan-and-stops",
    title: "Former admin assistant plans a bootcamp path, then agrees and closes",
    claim: "Reaches stage D with a concrete plan, then stage E once she's agreeing rather than asking — the wrap-up reply says the plan back and checks it rather than adding a further step, short, nothing new introduced on the last turn.",
    turns: [
      "I used to work as an administrative assistant, now I want to move into data analysis",
      "I don't have money for a full degree, so probably a bootcamp or self-teaching",
      "okay, a self-paced bootcamp with a mentor sounds right — how long would that realistically take me",
      "yeah, three months of steady evenings sounds doable, I think that's the plan",
      "no, that covers it, thank you",
    ],
    checks: [
      ["classified stage B on the opening message (named prior career)", (o) => stagesInOrder(o)[0] === "B"],
      ["reaches stage D once a concrete method and timeline are the live question", (o) => stagesInOrder(o).slice(0, 3).includes("D")],
      ["reaches stage E once she's agreeing rather than asking", (o) => stagesInOrder(o).slice(3).includes("E")],
      ["the wrap-up reply is short — three sentences at the outside", (o) => wordCount(lastReply(o)) <= 60],
      ["the wrap-up adds nothing new", (o) => !/(one more thing|another thing|you should also|also,|start by|first,|next,|step 1|in addition)/i.test(lastReply(o))],
      ["the wrap-up ends on a check, not a demand for more information", (o) => lightChecks(o) >= 1 && !/\b(what|which|how) (are|is|would|do|did) you\b[^?]*\?\s*$/i.test(lastReply(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
];
