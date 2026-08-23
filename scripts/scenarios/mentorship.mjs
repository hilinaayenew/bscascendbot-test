// ============================================================================
// Area 4 · Mentorship — test conversations
//
// Built fast under a deadline (2026-08-23). Every conversation runs FIVE
// user turns.
// ============================================================================

import { replyOf, everyReplyAsks, noRepeatedOpeners, jargonPerReply, maxRepeatOverlap } from "../checks.mjs";

const stagesInOrder = (o) => [...o.matchAll(/\[stage ([A-Z]+)/g)].map((m) => m[1]);
const facetsDrawn = (o) => new Set(
  [...o.matchAll(/\[drew on ([^—\]]+)—/g)].flatMap((m) => m[1].split(",").map((s) => s.trim())),
);

export default [
  {
    id: "01-finding-and-approaching-a-mentor",
    title: "Doesn't know anyone senior, wonders if a cold LinkedIn message is weird",
    claim: "Stays in stage A throughout — no mentor yet — draws on S1/S2, and steers away from cold-messaging toward a structured route rather than just answering 'no, go ahead and message them'.",
    turns: [
      "how do I find a good mentor in tech",
      "I don't really know anyone senior in my field",
      "is it weird to just message someone on linkedin",
      "what should I actually say to them",
      "what should I look for in general when picking someone",
    ],
    checks: [
      ["stays in stage A throughout", (o) => stagesInOrder(o).every((s) => s === "A")],
      ["draws on S1 or S2", (o) => { const f = facetsDrawn(o); return f.has("S1") || f.has("S2"); }],
      ["steers away from cold-messaging a stranger", (o) => /(rarely works|engage.{0,20}first|introduction|structured program)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "02-mentor-vs-sponsor",
    title: "Has a mentor already, but wants to know if she also needs a sponsor",
    claim: "Draws on S4 and keeps the mentor/sponsor distinction clear (advice vs advocacy) rather than blurring the two together.",
    turns: [
      "I have a mentor already but I keep hearing about sponsors too, what's the actual difference",
      "do I need both or is a mentor enough",
      "nobody really advocates for me in rooms I'm not in though",
      "should I ask my mentor to do that, or is that a different person entirely",
      "how do I even bring this up with them",
    ],
    checks: [
      ["classified stage B", (o) => stagesInOrder(o).includes("B")],
      ["draws on S4 (mentor vs sponsor)", (o) => facetsDrawn(o).has("S4")],
      ["keeps the distinction clear: advice vs advocacy", (o) => /(advoca|vouch|advice|puts your name forward)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
    ],
  },
  {
    id: "03-making-the-most-of-sessions",
    title: "Shows up to mentorship sessions without much to say",
    claim: "Draws on S3 and pushes toward bringing initiative rather than just reassuring her that showing up with questions is enough.",
    turns: [
      "how do I actually make the most of my mentorship sessions",
      "I feel like I show up without much to say sometimes",
      "is it okay to just ask them general questions",
      "how often should we even be meeting",
      "what should I bring to the next one",
    ],
    checks: [
      ["draws on S3 (making the most of sessions)", (o) => facetsDrawn(o).has("S3")],
      ["pushes toward bringing initiative, not just questions", (o) => /(initiative|bring|update|not just questions)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "04-long-term-relationship-maintenance",
    title: "Eight months into a mentorship, worried she isn't updating enough between sessions",
    claim: "Draws on S5 and names follow-through/regular updates as what builds the trust that eventually turns into sponsorship-like advocacy.",
    turns: [
      "I've been meeting my mentor for about eight months now",
      "I worry I'm not updating them enough between sessions",
      "how do I keep this going long term without being annoying",
      "does this actually turn into them vouching for me later",
      "what should I be doing differently",
    ],
    checks: [
      ["draws on S5 (maintaining it long-term)", (o) => facetsDrawn(o).has("S5")],
      ["names regular updates and follow-through as what builds trust", (o) => /(update|follow through|trust|vouch)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
    ],
  },
  {
    id: "05-bsc-programme-no-clear-goal-yet",
    title: "In the BSC mentorship programme but doesn't have a clear career goal yet",
    claim: "Draws on S6 and reassures that being unsure is workable — tell the mentor directly — rather than treating the lack of a goal as a problem to fix before starting.",
    turns: [
      "I'm in the BSC mentorship programme but I don't really have a clear career goal yet",
      "is that going to be a problem",
      "what should I actually tell my mentor",
      "how do most people figure out their focus through this",
      "what's my first move with them",
    ],
    checks: [
      ["draws on S6 (BSC programme, career goals)", (o) => facetsDrawn(o).has("S6")],
      ["treats being unsure as workable, not a blocker", (o) => /(that.{0,15}fine|tell your mentor|help structure|not a problem)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
];
