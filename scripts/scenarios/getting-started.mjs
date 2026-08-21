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

import { replyOf, everyReplyAsks, noRepeatedOpeners, jargonPerReply, maxRepeatOverlap, extractiveQuestions } from "../checks.mjs";

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
  // Placeholder — no area-tester agent run against this area yet.
  {
    id: "05-no-clear-interest-yet",
    title: "Doesn't know what she'd enjoy, has never tried any of it",
    claim: "Doesn't just repeat 'what draws you to it' a second way — gives her the smallest possible concrete first action instead of asking her to introspect further.",
    turns: [
      "everyone says find your passion in tech but I genuinely don't know what that would be",
      "I've never coded anything or used any of these tools",
      "I don't even know what UX or data science actually involve day to day",
      "how am I supposed to know what I'd enjoy",
      "okay what's the smallest possible way to just try something",
    ],
    checks: [
      // Scoped to the LAST reply specifically — the claim is about how the
      // conversation closes, not whether "tiny" language appears anywhere in
      // five turns. The original keyword list (weekend/one project/etc.) was
      // too narrow: a real run closed with "a 15-minute browser-based Python
      // starter — go to trinket.io, type print('Hello') and Run", which is
      // exactly the smallest-possible-action ask, just phrased with a time-box
      // and a named tool rather than any of the four guessed phrases.
      ["gives a concrete tiny first action by the end", (o) => {
        const last = replyOf(o).split("\n\n").filter(Boolean).at(-1) || "";
        return /(\btiny\b|micro-?experiment|\d+[- ]?(minute|hour|day)s?\b|weekend|small project|start(ing)? with one)/i.test(last);
      }],
      ["does not just repeat the same 'what draws you' framing a second way", (o) => !/what (drew|draws) you/i.test(replyOf(o))],
      ["treats not knowing yet as normal, not a deficiency", (o) => /(normal|fine|okay|common|expected)/i.test(o)],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
];
