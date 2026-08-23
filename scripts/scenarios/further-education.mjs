// ============================================================================
// Area 2 · Further Education — test conversations
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
    id: "01-masters-vs-certification-then-picks-a-field",
    title: "Weighing a master's against certifications, then settles on AI research",
    claim: "Stays in stage A while no direction is chosen, moves to stage B once a field is named, and treats certifications as a real alternative rather than a lesser one.",
    turns: [
      "do I actually need a master's degree to succeed in tech",
      "are there certifications that would work just as well",
      "okay let's say I go with a master's instead, which fields actually benefit most from one",
      "I'm interested in AI research specifically",
      "what should I actually look for in a programme then",
    ],
    checks: [
      ["classified stage A on the opening message", (o) => stagesInOrder(o)[0] === "A"],
      ["mentions certifications as a real alternative, not dismissed", (o) => /(certification|aws|pmp|security\+)/i.test(replyOf(o))],
      ["reaches stage B once AI research is named", (o) => stagesInOrder(o).slice(2).includes("B")],
      ["draws on S2 or S3 once the field is named", (o) => { const f = facetsDrawn(o); return f.has("S2") || f.has("S3"); }],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "02-masters-timing-fresh-graduate",
    title: "A fresh graduate with zero work experience asks whether to do a master's now or later",
    claim: "Draws on S4 (before-or-after timing) and recommends work experience first, per Otema's own stated experience, rather than defaulting to 'go straight into it'.",
    turns: [
      "is it better to do a master's before or after gaining work experience",
      "I have zero work experience right now, I just finished undergrad",
      "would waiting hurt my chances later",
      "how long should I realistically wait",
      "what should I do in the meantime",
    ],
    checks: [
      ["classified stage B", (o) => stagesInOrder(o).includes("B")],
      ["draws on S4 (timing)", (o) => facetsDrawn(o).has("S4")],
      ["recommends gaining work experience first", (o) => /(work experience|after.{0,20}experience|gain experience)/i.test(replyOf(o))],
      ["gives something concrete to do in the meantime", (o) => /(build|project|apply|junior|internship)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
    ],
  },
  {
    id: "03-funding-and-balancing-full-time-work",
    title: "Wants scholarships, has weak savings, and also works full time",
    claim: "Stays in stage C throughout — both funding and balancing are logistics on an already-chosen path — and draws on both S6 and S7 rather than only answering the first question asked.",
    turns: [
      "how do I fund further education in tech, are there scholarships for women",
      "I don't have strong savings",
      "what actually makes someone competitive for these scholarships",
      "I also work full time, would I need to quit",
      "how do people usually balance both",
    ],
    checks: [
      ["stays in stage C throughout", (o) => stagesInOrder(o).every((s) => s === "C")],
      ["draws on S6 (funding/scholarships)", (o) => facetsDrawn(o).has("S6")],
      ["draws on S7 (balancing work) once that's raised", (o) => facetsDrawn(o).has("S7")],
      ["names what makes a scholarship application competitive", (o) => /(grades|project|applied skill|competitive)/i.test(replyOf(o))],
      ["gives a real option short of quitting", (o) => /(hybrid|online|evening|weekend|part.time)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
    ],
  },
  {
    id: "04-cybersecurity-postgrad-and-visas",
    title: "Wondering if a postgrad helps specifically in cybersecurity governance, and whether it helps with visas",
    claim: "Draws on S2 (which fields benefit from a postgrad) since the question is field-specific value, and picks up the visa angle rather than ignoring it.",
    turns: [
      "would a postgraduate qualification actually help in cybersecurity",
      "specifically I'm thinking cybersecurity governance and compliance",
      "does it help with visas for places like the uk or canada",
      "what should the actual programme focus on",
      "is it worth doing full time or part time",
    ],
    checks: [
      ["draws on S2 (which fields benefit)", (o) => facetsDrawn(o).has("S2")],
      ["picks up the visa angle", (o) => /(visa|migration)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "05-cost-conscious-cert-vs-masters",
    title: "Torn between a master's and certifications, money is tight, wants to get hired fast",
    claim: "Stays in stage A throughout — nothing is chosen yet — draws on S5, and takes the cost/speed constraint as a real reason to lean toward certifications rather than defaulting to 'a degree is always better'.",
    turns: [
      "I'm trying to decide between a master's and just doing certifications",
      "money is a real constraint for me",
      "I want something that gets me hired faster",
      "are certifications actually respected by employers",
      "so which one should I lean toward",
    ],
    checks: [
      ["stays in stage A throughout", (o) => stagesInOrder(o).every((s) => s === "A")],
      ["draws on S5 (certs vs master's)", (o) => facetsDrawn(o).has("S5")],
      ["names a specific certification example", (o) => /(aws|pmp|security\+|azure)/i.test(replyOf(o))],
      ["leans toward certifications given the stated cost/speed constraint, not just 'a degree is always better'", (o) => !/^\W*a (master.?s|degree) is (always|generally) (better|the way to go)/im.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
    ],
  },
];
