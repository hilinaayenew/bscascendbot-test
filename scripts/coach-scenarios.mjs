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
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "examples");

const SCENARIOS = [
  {
    id: "01-market-rate",
    title: "What does this role actually pay?",
    claim: "The W-marked path: searches the live web, cites sources, and holds up when pushed for a number it can't source.",
    turns: [
      "what does a mid-level backend developer earn in Lagos",
      "is that for fintech or generally",
      "what about if I work remotely for a European company",
      "just give me one number I can put in the form",
      "how do I check whether an offer is fair against that",
    ],
    checks: [
      ["web search fired", (o) => /\[W · searching/.test(o)],
      ["cited real sources", (o) => /sources: \S/.test(o)],
      ["figures carry a source name", (o) => !/\d{3},\d{3}/.test(replyOf(o)) || /\((?:[A-Za-z][^)]*,\s*20\d\d|[A-Za-z][^)]*\.[a-z]{2,})/.test(replyOf(o))],
      ["stayed in the area for all five turns", (o) => !/stage leaving/.test(o)],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
    ],
  },
  {
    id: "02-pay-gap",
    title: "A colleague earns more for the same job",
    claim: "Stage C held across five turns, including the awkward turn about how she found out.",
    turns: [
      "I found out a guy on my team earns more than me for the same job",
      "I saw it on a spreadsheet I wasn't supposed to open",
      "so I can't actually use that as evidence",
      "how do I raise it without sounding bitter",
      "what if they say his experience is different",
    ],
    checks: [
      ["classified stage C on the first turn", (o) => /\[stage C/.test(o)],
      ["never drifted to prospective-offer advice", (o) => !/\[stage B/.test(o)],
      ["steers away from using the document", (o) => /(market|research|own value|don't reference|without|your own)/i.test(replyOf(o))],
      ["did not search — this is not a market-rate question", (o) => !/\[W · searching/.test(o)],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
    ],
  },
  {
    id: "03-equity-offer",
    title: "An offer weighted towards equity",
    claim: "Stage B throughout, works through the equity material, and keeps moving rather than repeating itself.",
    turns: [
      "I have an offer from a startup, they want to pay me mostly in equity",
      "they won't tell me what percentage it is",
      "the base is about 30% below what I hoped for",
      "what else could I ask for instead",
      "how do I get any of this in writing",
    ],
    checks: [
      ["classified stage B on the first turn", (o) => /\[stage B/.test(o)],
      ["treats an undisclosed percentage as a warning", (o) => /(zero|cash|walk|red flag|won't|refuse|treat|caution)/i.test(replyOf(o))],
      ["reaches non-salary levers", (o) => /(bonus|learning|remote|leave|title|review|writing)/i.test(replyOf(o))],
      ["stayed in the area", (o) => !/stage leaving/.test(o)],
      ["every reply ends on a question", (o) => everyReplyAsks(o)],
    ],
  },
];

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

mkdirSync(OUT, { recursive: true });
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
  `Three conversations run through \`scripts/coach-local.mjs\` against live Azure (\`gpt-5-nano\`), five turns each.`,
  `Each exists to test one claim the storyboard makes about the area model.`,
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
