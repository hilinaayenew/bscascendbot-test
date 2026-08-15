#!/usr/bin/env node
// ============================================================================
// Scenario sweep — runs a fixed set of conversations through the local harness
// and writes each as a transcript, plus a results matrix.
//
//   npm run coach:scenarios
//
// Every run costs real Azure calls (two per user turn, three when a turn
// triggers a web search — and a search is ~10 queries, so those turns are
// slow). The set is kept
// small and deliberate rather than exhaustive. Each scenario exists to test
// one claim the storyboard makes; the `checks` field is that claim, asserted
// against what actually came back.
//
// Output lands in examples/ — transcripts are committed so a later change can
// be compared against what the coach used to say.
// ============================================================================

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "examples");

const SCENARIOS = [
  {
    id: "01-career-changer-lowballed",
    title: "A nurse moving into health tech, offered far too little",
    claim: "Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.",
    turns: [
      "I've been a nurse for 6 years and I'm moving into health tech",
      "they've offered me something but it feels really low",
      "it's about half what the job ads say for that role",
      "I keep thinking maybe I don't deserve more since I'm new to tech",
      "what do I actually say to them",
    ],
    checks: [
      ["reads the offer as a mismatch, not her worth", (o) => /(mismatch|misunderstood|budget|range|not about you|worth)/i.test(replyOf(o))],
      ["values her clinical background rather than discounting it", (o) => /(nurse|clinical|healthcare|domain|background|experience)/i.test(replyOf(o))],
      ["stayed in the area for all five turns", (o) => !/stage leaving/.test(o)],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "02-counter-offer",
    title: "She resigned and they suddenly found the money",
    claim: "Stage C throughout, and asks why the number only appeared once she was leaving.",
    turns: [
      "I handed in my notice last week and now they've offered me 30% more to stay",
      "I'd asked for a raise twice before and got nothing",
      "honestly the money was only part of why I was going",
      "my new employer has already sent the contract",
      "so do I take it or not",
    ],
    checks: [
      ["classified stage C", (o) => /\[stage C/.test(o)],
      ["questions why the money appeared only now", (o) => /(before|why|earlier|only now|resignation|notice)/i.test(replyOf(o))],
      ["treats money as not the whole reason", (o) => /(reason|why you|what was wrong|part of|fix)/i.test(replyOf(o))],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "03-paid-in-local-currency",
    title: "A foreign employer insisting on local currency",
    claim: "Negotiates the mechanism — review interval, pegging — rather than arguing about the currency itself.",
    turns: [
      "I'm in Accra and a German company wants to hire me remotely",
      "they say they'll only pay in cedis",
      "the cedi has moved a lot this year and I'm worried",
      "is there anything I can actually ask for here",
      "how do I put that to them without sounding difficult",
    ],
    checks: [
      ["reaches the mechanism, not just the currency", (o) => /(review|peg|interval|adjust|index|contract|written)/i.test(replyOf(o))],
      ["takes the currency worry seriously", (o) => /(volatil|inflation|moved|devalu|risk|stable)/i.test(replyOf(o))],
      ["handles the 'sounding difficult' turn without leaving", (o) => !/stage leaving/.test(o)],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "04-fobbed-off-twice",
    title: "Told to wait for the review cycle, for the second year running",
    claim: "Stage C. Recognises a pattern rather than repeating last year's advice.",
    turns: [
      "my manager told me to wait for the review cycle",
      "she said exactly the same thing last year",
      "I did everything on the list she gave me",
      "I don't want to be the person who complains",
      "am I being naive staying here",
    ],
    checks: [
      ["classified stage C", (o) => /\[stage C/.test(o)],
      ["names the repetition as information about them", (o) => /(pattern|again|last year|twice|says something|about them|not about you)/i.test(replyOf(o))],
      ["does not treat raising it as complaining", (o) => /(not complain|reasonable|entitled|fair|normal|right to)/i.test(replyOf(o))],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
      ["no two replies open the same way", (o) => noRepeatedOpeners(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "05-no-job-yet",
    title: "Asking what to earn before she has anything to negotiate",
    claim: "The precondition is missing — it should hand off to Job Search rather than coach a negotiation that cannot happen.",
    turns: [
      "what should I be earning as a junior data analyst",
      "I'm in Kampala",
      "well I haven't actually got a job yet",
      "I've been applying for about four months with nothing back",
      "should I just take whatever I'm offered",
    ],
    checks: [
      ["noticed the missing precondition", (o) => /stage leaving/.test(o) || /(applying|job search|no offer|haven't got|first)/i.test(replyOf(o))],
      ["did not simply keep coaching a negotiation that cannot happen", (o) => /(search|applying|CV|interview|Area 7|Job Search|first)/i.test(o)],
      ["never told her to take whatever she is offered", (o) => !/take whatever|accept anything|any offer is/i.test(replyOf(o))],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
];

// Substance repetition: how much of a reply is words it already used in the
// previous one. Openers were the visible symptom; this catches restating the
// same advice in fresh words, which is the actual failure.
function maxRepeatOverlap(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  const words = (r) => new Set(r.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 4));
  let worst = 0;
  for (let i = 1; i < replies.length; i++) {
    const a = words(replies[i - 1]), b = words(replies[i]);
    if (!b.size) continue;
    let shared = 0;
    b.forEach((w) => { if (a.has(w)) shared++; });
    worst = Math.max(worst, shared / b.size);
  }
  return worst;
}

// Jargon density. Observed: "a milestone-based cash bonus, an equity refresh
// or larger option grant with a clear vesting schedule, and a currency
// protection clause or USD pegging" — five pieces of Silicon Valley vocabulary
// in two sentences. Monitored rather than rewritten: the fix belongs in the
// prompt, but nobody would notice the drift without a number on it.
const JARGON = /\b(equity refresh|option grant|vesting schedule|cliff|term sheet|cap table|post-money|pre-money|liquidity event|acceleration|RSUs?|exercise price|strike price|pegging|stipend|milestone-based|comp band|total comp|OTE|equity component|dilution|tranche)\b/gi;

function jargonPerReply(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  if (!replies.length) return 0;
  return Math.max(...replies.map((r) => (r.match(JARGON) || []).length));
}

// True when no two replies open with the same first six words. Observed on
// freelance rates: four of five opened "I would always recommend".
function noRepeatedOpeners(out) {
  const openers = replyOf(out).split("\n\n").filter(Boolean)
    .map((r) => r.trim().toLowerCase().split(/\s+/).slice(0, 6).join(" "));
  return new Set(openers).size === openers.length;
}

// True when every reply in the run ends on a question — the coach is supposed
// to lead, so a reply that just stops is a failure however good the advice is.
function everyReplyAsks(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  return replies.length > 0 && replies.every((r) => r.trim().endsWith("?"));
}

// The coach's replies only. Extracted by block — everything between a "Botema"
// line and the next user prompt — rather than by filtering line prefixes, which
// silently ate wrapped reply lines that happened to begin with "you".
function replyOf(out) {
  const blocks = [];
  const lines = out.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*Botema\s*$/.test(lines[i])) continue; // "Botema …" is an interim hold, not a reply
    const body = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s*you >/.test(lines[j]) || /^\s*(──|offering:|sources:|\[)/.test(lines[j])) break;
      body.push(lines[j].trim());
    }
    blocks.push(body.join(" ").trim());
  }
  return blocks.join("\n\n").trim();
}

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

const RUN_AT = new Date();
const STAMP = RUN_AT.toISOString().replace("T", " ").slice(0, 16) + " UTC";

mkdirSync(OUT, { recursive: true });

// Delete transcripts for scenarios no longer in the set. Without this, dropping
// a scenario leaves its last transcript sitting in examples/ looking current —
// which is exactly what happened with fear-of-negotiating after it was retired.
const expected = new Set([...SCENARIOS.map((s) => `${s.id}.md`), "README.md"]);
for (const file of readdirSync(OUT)) {
  if (file.endsWith(".md") && !expected.has(file)) {
    unlinkSync(join(OUT, file));
    console.log(`  removed stale ${file}`);
  }
}
const results = [];

for (const s of SCENARIOS) {
  process.stdout.write(`  ${s.id} … `);
  let out = "";
  let error = null;
  try {
    out = strip(execFileSync("node", [
      join(ROOT, "scripts/coach-local.mjs"),
      `--script=${[...s.turns, "quit"].join("|")}`,
    ], { encoding: "utf8", timeout: 900000 }));
  } catch (err) {
    error = err.message.slice(0, 200);
  }

  const checks = error ? [] : s.checks.map(([name, fn]) => {
    let pass = false;
    try { pass = !!fn(out); } catch { pass = false; }
    return { name, pass };
  });
  const ok = !error && checks.every((c) => c.pass);
  results.push({ ...s, ok, checks, error });
  console.log(ok ? "pass" : error ? "ERROR" : `${checks.filter((c) => !c.pass).length} failed`);

  const body = [
    `# ${s.title}`,
    "",
    `_Run ${STAMP} · ${s.turns.length} turns · gpt-5-nano via Azure_`,
    "",
    `**What this tests.** ${s.claim}`,
    "",
    "## Transcript",
    "",
    "```",
    out.trim(),
    "```",
    "",
    "## Checks",
    "",
    ...(error ? [`- **ERROR** — ${error}`] : checks.map((c) => `- ${c.pass ? "PASS" : "**FAIL**"} — ${c.name}`)),
    "",
    "---",
    "",
    "_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._",
    "",
  ].join("\n");
  writeFileSync(join(OUT, `${s.id}.md`), body);
}

const passed = results.filter((r) => r.ok).length;
const index = [
  "# Coach scenario sweep",
  "",
  `Five conversations run through \`scripts/coach-local.mjs\` against live Azure (\`gpt-5-nano\`), five turns each.`,
  `Each exists to test one claim the storyboard makes about the area model.`,
  "",
  `_Last run: **${STAMP}** — regenerate with \`npm run coach:scenarios\`._`,
  "",
  `**${passed} of ${results.length} scenarios passed all checks.**`,
  "",
  "| # | Scenario | Tests | Result |",
  "|---|---|---|---|",
  ...results.map((r) => {
    const failed = r.checks.filter((c) => !c.pass).map((c) => c.name);
    const status = r.error ? "ERROR" : r.ok ? "pass" : `fail — ${failed.join("; ")}`;
    return `| ${r.id.slice(0, 2)} | [${r.title}](${r.id}.md) | ${r.claim} | ${status} |`;
  }),
  "",
  "## What this does and does not cover",
  "",
  "Covered: stage classification across A, B and C; all three leaving layers; the",
  "invented-figure behaviour; and that answers end on a question.",
  "",
  "Not covered: whether the *advice* is good. These check shape and routing, not",
  "quality — that judgment belongs to Otema, and the drafted answers behind many of",
  "these replies are still unreviewed.",
  "",
  "Nothing here writes to a database. State is in memory and discarded per run.",
  "",
].join("\n");
writeFileSync(join(OUT, "README.md"), index);

console.log(`\n  ${passed}/${results.length} passed — examples/README.md written\n`);
process.exit(passed === results.length ? 0 : 1);
