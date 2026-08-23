// ============================================================================
// Area 3 · Career Paths & Roadmaps — test conversations
//
// Built fast under a deadline (2026-08-23), same shape as the other areas'
// scenario files. Every conversation runs FIVE user turns.
// ============================================================================

import { replyOf, everyReplyAsks, noRepeatedOpeners, jargonPerReply, maxRepeatOverlap } from "../checks.mjs";

const stagesInOrder = (o) => [...o.matchAll(/\[stage ([A-Z]+)/g)].map((m) => m[1]);
const facetsDrawn = (o) => new Set(
  [...o.matchAll(/\[drew on ([^—\]]+)—/g)].flatMap((m) => m[1].split(",").map((s) => s.trim())),
);

export default [
  {
    id: "01-torn-between-fields-then-picks-one",
    title: "Doesn't know enough about any field to compare them, then settles on data science",
    claim: "Stays in stage A while no field is named, reaches stage B once data science is picked, and doesn't let 'no technical background' derail the roadmap once she's named a field.",
    turns: [
      "I don't really know enough about any of these fields to know which one I'd even be good at or enjoy",
      "I guess data science sounds interesting but I've never tried it",
      "okay I want to actually pursue data science then",
      "I don't have a technical background though",
      "so what's actually the roadmap for me",
    ],
    checks: [
      ["classified stage A on the opening message", (o) => stagesInOrder(o)[0] === "A"],
      ["reaches stage B once data science is named", (o) => stagesInOrder(o).slice(2).includes("B")],
      ["draws on S2 (data/ML roadmap) once the field is named", (o) => facetsDrawn(o).has("S2")],
      ["gives a concrete starting step despite no technical background", (o) => /(spreadsheet|sql|python|pandas|analyst)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "02-cybersecurity-from-scratch",
    title: "Wants a cybersecurity path with zero IT background, and thinks 'ethical hacker' is the entry job",
    claim: "Stays in stage B throughout — the field is named from turn one — and corrects the 'ethical hacker as day-one job' assumption rather than going along with it.",
    turns: [
      "what does a career path in cybersecurity actually look like",
      "I have zero IT background at all",
      "is 'ethical hacker' a realistic first job for me",
      "what should I actually start with this month",
      "how long before I could get an entry-level security job",
    ],
    checks: [
      ["classified stage B throughout", (o) => stagesInOrder(o).every((s) => s === "B")],
      ["draws on S4 (cybersecurity roadmap)", (o) => facetsDrawn(o).has("S4")],
      ["corrects the ethical-hacker-as-first-job assumption", (o) => /(soc analyst|security support|not.{0,20}ethical hacker|realistic entry)/i.test(replyOf(o))],
      ["gives a concrete starting point despite no IT background", (o) => /(networking|it fundamentals|security\+|tryhackme)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
    ],
  },
  {
    id: "03-engineer-to-product-manager",
    title: "A backend engineer wants to move into product management with no formal PM experience",
    claim: "Draws on S5 (the PM roadmap) rather than S7 (PM as a career CHANGE into tech project management, a different question), since she's already in tech and moving sideways within it.",
    turns: [
      "I'm a backend engineer and I want to move into product management",
      "I don't have any formal PM experience",
      "would getting a PM certificate actually help",
      "how do people usually make this jump",
      "what's my actual first move",
    ],
    checks: [
      ["draws on S5 (product management)", (o) => facetsDrawn(o).has("S5")],
      // Broadened: a live run made the same point via "internal rotation" /
      // "co-lead a project with a PM" / "internal PM exposure" rather than
      // the literal word "sideways" — same substance, different phrasing.
      ["treats an internal move from her current role as the normal path", (o) => /(sideways|engineering|business analysis|customer success|internal rotation|co-lead|internal.{0,15}(exposure|move))/i.test(replyOf(o))],
      ["gives a concrete first move", (o) => /(prd|informational interview|sample|write)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "04-cloud-devops-with-some-scripting",
    title: "Wants into cloud/DevOps, already has a little Python, needs a platform and a timeline",
    claim: "Draws on S6 (cloud/DevOps roadmap), and treats the existing scripting knowledge as a real head start rather than starting the roadmap from zero.",
    turns: [
      "I want to get into cloud computing or DevOps",
      "I already know a bit of Python scripting",
      "which cloud platform should I actually start with",
      "do I need a certification before applying anywhere",
      "what's realistic timeline-wise",
    ],
    checks: [
      ["classified stage B", (o) => stagesInOrder(o).includes("B")],
      ["draws on S6 (cloud/DevOps roadmap)", (o) => facetsDrawn(o).has("S6")],
      ["recommends AWS specifically as the widest-adoption starting platform", (o) => /\bAWS\b/.test(replyOf(o))],
      ["treats existing scripting as a head start, not ignored", (o) => /(scripting|python|already)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
    ],
  },
  {
    id: "05-uxui-for-low-bandwidth-markets",
    title: "Wants UX/UI steps, hasn't designed anything, building for cheap phones and slow internet",
    claim: "Draws on S3 (UX/UI roadmap) and picks up the low-bandwidth/mobile-first African-market detail rather than giving a generic portfolio answer that ignores it.",
    turns: [
      "what are the actual steps to becoming a UX or UI designer",
      "I haven't designed anything yet",
      "I'm based in a market where most apps need to work on cheap phones and slow internet",
      "what should my portfolio actually include",
      "how many case studies do I really need",
    ],
    checks: [
      ["draws on S3 (UX/UI roadmap)", (o) => facetsDrawn(o).has("S3")],
      ["picks up the low-bandwidth/mobile-first detail", (o) => /(mobile-first|low-bandwidth|slow internet|cheap phones|offline)/i.test(replyOf(o))],
      ["gives a concrete number or scope of case studies", (o) => /(three|four|3|4|case stud)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
];
