#!/usr/bin/env node
// ============================================================================
// Local area harness — stage-scoped wordalisation, run against real Azure
//
//   npm run coach                     talk to it
//   npm run coach -- --script="a,b"   replay a scripted conversation
//   npm run coach -- --dry            no Azure calls; shows classification only
//
// THE MODEL
// There is no deterministic path through an area. For every user message we
// make ONE classification call — which stage of the area is this, or is the
// user leaving — and the stage decides which of Otema's answers get injected
// as few-shot grounding. GPT then writes a fresh reply from that material.
// Structure comes from the stage; the words come from the model.
//
// So the facet graph is a COVERAGE MAP, not a router: it records what material
// each stage can draw on, never which answer to serve.
//
// LEAVING (ISSUE-010)
// Three layers, because the ISSUE-005 history says the instruction alone won't
// hold on a small model:
//   1. `leaving` is one outcome of the same classification call
//   2. an explicit leave-phrase check that fires whatever the classifier says
//   3. a stall counter — same stage twice with nothing new added
//
// Reads content and prompts from the source files at run time, so it can't
// drift from what the deployed coach would say. Nothing is written anywhere.
// ============================================================================

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FN = join(ROOT, "supabase/functions/ai-career-coach");

// ── Config ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env — dry mode only */ }
  return env;
}

const ENV = loadEnv();
const AZURE = {
  endpoint: ENV.AZURE_OPENAI_ENDPOINT,
  apiKey: ENV.AZURE_OPENAI_API_KEY,
  apiVersion: ENV.AZURE_OPENAI_API_VERSION || "2025-04-01-preview",
  deployment: ENV.AZURE_OPENAI_DEPLOYMENT || "gpt-5-nano",
};

const DRY = process.argv.includes("--dry") || !AZURE.endpoint || !AZURE.apiKey;

// ── Content, read from source so it can't drift ─────────────────────────────

const unq = (s) => s.replace(/\\"/g, '"').replace(/\\n/g, "\n");

function loadReal() {
  const src = readFileSync(join(FN, "botema-examples.ts"), "utf8");
  return [...src.matchAll(
    /question:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*answer:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*topic:\s*"salary"/g,
  )].map((m) => ({ question: unq(m[1]), answer: unq(m[2]), source: "OTEMA" }));
}

function loadDrafted() {
  const src = readFileSync(join(FN, "botema-generated-examples.ts"), "utf8");
  const body = src.slice(src.indexOf("adviseOnCareerTopic: ["));
  const out = [];
  for (const chunk of body.split(/\n    \{\n/).slice(1)) {
    const e = chunk.split(/\n    \},/)[0];
    const q = e.match(/question:\s*"((?:[^"\\]|\\.)*)"/);
    const a = e.match(/answer:\s*\n?\s*"((?:[^"\\]|\\.)*)"/);
    const f = e.match(/facet:\s*"([A-Za-z0-9]+)"/);
    if (q && a && f) out.push({ question: unq(q[1]), answer: unq(a[1]), facet: f[1], source: "DRAFTED" });
  }
  return out;
}

function loadSystemPrompt() {
  const src = readFileSync(join(FN, "botema-examples.ts"), "utf8");
  const m = src.match(/export const BOTEMA_SYSTEM_PROMPT = `([^`]*)`/);
  return m ? m[1] : "You are Botema, a BSC Career Coach.";
}

function loadKnowledge() {
  const src = readFileSync(join(FN, "bsc-knowledge.ts"), "utf8");
  const m = src.match(/salary: `([\s\S]*?)`\.trim\(\)/);
  return m ? m[1].trim() : "";
}

function loadStandWithHer() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const STAND_WITH_HER =\s*([\s\S]*?);\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\n\s*"/g, "").trim() : "";
}

function loadFigureGuard() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const NO_INVENTED_FIGURES =\s*([\s\S]*?);\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\n\s*"/g, "").trim() : "";
}

const S_ORDER = ["S1", "S2", "S3", "S4", "S5"];

function buildFacets() {
  const f = {};
  loadReal().forEach((e, i) => { if (S_ORDER[i]) f[S_ORDER[i]] = { ...e, id: S_ORDER[i] }; });
  loadDrafted().forEach((e) => { f[e.facet] = { ...e, id: e.facet }; });
  return f;
}

// ── The coverage map ────────────────────────────────────────────────────────
// Not a route. This says only what material each stage can draw on.

const AREA = { n: 9, name: "Salary & Negotiation" };

const STAGE_SUMMARY = {
  A: "what the role is worth",
  B: "the offer on the table",
  C: "the conversation with your employer",
};

const STAGES = {
  A: {
    label: "Before there's an offer",
    describes: "They are pricing themselves — working out what a role pays, or what they're worth coming from another field. No live negotiation, no employer at the table yet.",
    facets: ["S1", "G2", "G10", "G10a", "G5"],
  },
  B: {
    label: "An offer is on the table",
    describes: "They are negotiating with a PROSPECTIVE employer. A job offer exists, or one is being discussed — they do not work there yet. Anything about an offer, an equity package, a signing bonus, or what to say during hiring.",
    facets: ["S2", "S2a", "S3", "S3a", "S5", "S5a", "G3", "G3a", "G6", "G7", "G7a", "G9", "G9a", "G5"],
  },
  C: {
    label: "Already in the job",
    describes: "They ALREADY WORK for the employer in question, so the money conversation is one they must start themselves. A rise asked for or refused, a manager who said no, a pay gap with a colleague, a counter-offer on resigning. If the words manager, my team, my job, my boss or a raise appear, this is almost always the stage — even if a negotiation is live.",
    facets: ["S4", "S4a", "S4b", "S4c", "G1", "G1a", "G1b", "G4", "G4a", "G4b", "G4c", "G4d", "G8", "G9", "G9a"],
  },
};

// All ten areas. An earlier version listed only salary's three designed exits,
// which sent a mentorship question to Confidence — the classifier could only
// pick from what it was shown. A user can leave for anywhere.
const ALL_AREAS = {
  1: "Getting Started",
  2: "Further Education",
  3: "Career Paths & Roadmaps",
  4: "Mentorship",
  5: "Wellbeing & Balance",
  6: "Confidence & Imposter Syndrome",
  7: "Job Search & Applications",
  8: "Interview Preparation",
  9: "Salary & Negotiation",
  10: "AI & the Future of Tech Work",
};
const OTHER_AREAS = Object.fromEntries(Object.entries(ALL_AREAS).filter(([n]) => Number(n) !== 9));

// ── Leave detection, layer 2: explicit phrases ──────────────────────────────
// Fires regardless of what the classifier says. Cheap, deterministic, and the
// one case where a user is unambiguous and being ignored would be insulting.

const LEAVE_PHRASES = /\b(?:something else|different (?:topic|area|subject)|move on|change (?:the )?(?:topic|subject)|talk about (?:something|mentors?|cvs?|interviews?)|let'?s leave|forget (?:this|that)|next topic|done with (?:this|that|salary))\b/i;

function saysLeaving(text) {
  return LEAVE_PHRASES.test(text);
}

// ── The invented-figure guard, mirroring converser.ts ────────────────────────
// Duplicated rather than imported: converser.ts is Deno TypeScript and this is
// plain Node. If you change the real one, change this too.

const CURRENCY_CODES = "KES|KSh|NGN|ZAR|GHS|UGX|TZS|RWF|XOF|XAF|ZMW|MWK|ETB|USD|GBP|EUR";
const CURRENCY_FIGURE = new RegExp(
  `(?:\\b(?:${CURRENCY_CODES})\\b[\\s:]*\\d)|(?:\\d[\\d,.]*\\s*[km]?\\s*\\b(?:${CURRENCY_CODES})\\b)|(?:[$£€₦]\\s?\\d)`, "i");
const FABRICATED_SOURCE =
  /\b(?:based on|according to|per)\b[^.!?]{0,50}\b(?:market data|salary data|pay data|salary surveys?|surveys?|research|reports?|figures|benchmarks?)\b/i;

function flattenInlineList(text) {
  if (/\n/.test(text)) return text;
  const bullets = text.match(/\s-\s(?=[A-Z0-9])/g);
  if (!bullets || bullets.length < 2) return text;
  return text.replace(/:\s-\s(?=[A-Z0-9])/g, ". ").replace(/\s-\s(?=[A-Z0-9])/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s{2,}/g, " ").trim();
}

// Sentence-level cap. The deployed capParagraphs() splits on blank lines, so a
// single long paragraph — which is what gpt-5-nano actually returns most of the
// time — sails straight through it. Keeps the opening answer and the closing
// question, drops the rundown in between.
function capSentences(text, keep = 3) {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= keep) return { text, capped: false };
  const question = sentences[sentences.length - 1].endsWith("?") ? sentences.pop() : null;
  const body = sentences.slice(0, keep - (question ? 1 : 0));
  return { text: [...body, question].filter(Boolean).join(" "), capped: true };
}

function stripFigures(text) {
  const bad = (s) => CURRENCY_FIGURE.test(s) || FABRICATED_SOURCE.test(s);
  if (!bad(text)) return { text, stripped: false };
  const kept = text.split(/(?<=[.!?])\s+/).filter((s) => !bad(s));
  const substantive = kept.filter((s) => !s.trim().endsWith("?"));
  if (!substantive.length) {
    return { text: "I don't have reliable, current pay data for your market, and I'd rather not hand you a number I can't stand behind. The most accurate signal is people doing the same role near you — ask in a community group, or ask a mentor what band they'd expect. What role and location are you looking at?", stripped: true };
  }
  return { text: kept.join(" ").trim(), stripped: true };
}

// ── Azure ───────────────────────────────────────────────────────────────────

async function callAzure(messages, { tools, maxTokens = 2000 } = {}) {
  const url = `${AZURE.endpoint.replace(/\/?$/, "/")}openai/deployments/${AZURE.deployment}/chat/completions?api-version=${AZURE.apiVersion}`;
  const body = { messages, max_completion_tokens: maxTokens };
  if (tools) { body.tools = tools; body.tool_choice = "required"; body.parallel_tool_calls = false; }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": AZURE.apiKey },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Azure ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);

  const choice = data.choices?.[0];
  if (tools) {
    const call = choice?.message?.tool_calls?.[0];
    if (!call) return null;
    try { return JSON.parse(call.function.arguments || "{}"); } catch { return {}; }
  }
  // gpt-5-nano can spend the whole budget on hidden reasoning and return
  // nothing — retry once at double, same as callAzure() in the real function.
  if (!choice?.message?.content && maxTokens < 12000) {
    return callAzure(messages, { maxTokens: maxTokens * 2 });
  }
  return choice?.message?.content || null;
}

// ── Web search — call one of two ────────────────────────────────────────────
// Azure's Responses API with the web_search tool. This call ONLY searches and
// reports back; it is never asked to write in Botema's voice.
//
// The split is deliberate. A single call told to search, stay grounded and
// speak in a particular voice reliably drops one of those jobs — usually the
// grounding, which is the one that matters. Keeping them apart also preserves
// the raw search text, so a later check can confirm the summary didn't invent
// anything that wasn't returned.
//
// Only fires for the W-marked facets: what a role pays, and freelance rates.

const searchCache = new Map();

async function searchMarketRate(role, location, context = "") {
  const key = [role, location, context].join("|").toLowerCase();
  if (searchCache.has(key)) return { ...searchCache.get(key), cached: true };
  const url = `${AZURE.endpoint.replace(/\/?$/, "/")}openai/responses?api-version=${AZURE.apiVersion}`;
  const question = [
    `What does a ${role} earn in ${location}?`,
    context ? `Focus specifically on: ${context}.` : "",
    "Report AT MOST THREE figures, the three most reliable and most recent you find.",
    "Give each on its own line as: amount | period | source name | year. Nothing else — no commentary, no caveats, no extra rows.",
    "If you cannot find reliable data for this specific market, reply with the single line: NO RELIABLE DATA — and say in one clause what you did find, if anything.",
  ].filter(Boolean).join(" ");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": AZURE.apiKey },
    body: JSON.stringify({
      model: AZURE.deployment,
      input: question,
      tools: [{ type: "web_search" }],
      max_tool_calls: 1,
    }),
  });
  if (!res.ok) throw new Error(`search ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const message = (data.output || []).find((o) => o.type === "message");
  const raw = message?.content?.map((c) => c.text).filter(Boolean).join("\n") || data.output_text || "";
  const citations = (message?.content || []).flatMap((c) => c.annotations || [])
    .map((a) => a.url).filter(Boolean);
  const queries = (data.output || []).filter((o) => o.type === "web_search_call").length;

  const result = { raw, citations: [...new Set(citations)], queries };
  searchCache.set(key, result);
  return result;
}

// ── Layer 1: classification ─────────────────────────────────────────────────

const AREA_LIST = () => Object.entries(OTHER_AREAS).map(([n,t])=>n+" ("+t+")").join(", ");

const CLASSIFY_TOOL = [{
  type: "function",
  function: {
    name: "placeInArea",
    description: "Decide which stage of the Salary & Negotiation area this message belongs to, or whether the user is leaving the area.",
    parameters: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          enum: ["A", "B", "C", "leaving"],
          description: [
            "A — " + STAGES.A.describes,
            "B — " + STAGES.B.describes,
            "C — " + STAGES.C.describes,
            "leaving — the message is not about their pay at all: they want another subject, they are pricing a job they do not have, or the real blocker is confidence rather than tactics.",
          ].join(" | "),
        },
        leaveTo: {
          type: "string",
          description: "If leaving, the number of the area that suits better — always give one. Use \"none\" when not leaving. Options: " + AREA_LIST(),
        },
        needsMarketData: {
          type: "boolean",
          description: "True only if answering well requires knowing what a role actually pays in a specific place — a market rate or a freelance rate. False for everything else, including how to negotiate, what to say, or how to feel about asking.",
        },
        role: { type: "string", description: "The role being priced, if any. e.g. mid-level backend developer." },
        refinement: { type: "string", description: "Any narrowing this message adds to a pay question — an industry, a company type, remote vs local. Use none if there is none." },
        location: { type: "string", description: "The city or country, if the user has given one." },
        newInformation: {
          type: "boolean",
          description: "Did this message add anything the coach did not already know — a fact, a constraint, an answer to what was asked? False for filler, restatements, or a shrug.",
        },
        why: { type: "string", description: "One short clause explaining the choice." },
      },
      // All required. Optional fields get dropped intermittently by the model,
      // and a leaveTo that vanishes loses the destination it had just worked out.
      required: ["stage", "leaveTo", "needsMarketData", "refinement", "newInformation", "why"],
    },
  },
}];

async function classify(message, history, covered) {
  const sys = [
    `You are placing a message inside the "${AREA.name}" discussion area of a tech career coach.`,
    `Decide which stage of that area it belongs to, or whether the user has left the area.`,
    covered.length ? `Stages already worked through: ${covered.join(", ")}. Prefer a new stage only if the message genuinely moved.` : "",
    `Judge from the user's situation, not their wording. Someone can be in stage C without using the word "raise".`,
    `Only choose "leaving" on a clear signal — an ambiguous follow-up belongs to the stage that is already open.`,
  ].filter(Boolean).join(" ");

  return callAzure([
    { role: "system", content: sys },
    ...history.slice(-10),
    { role: "user", content: message },
  ], { tools: CLASSIFY_TOOL });
}

// ── Generation: stage-scoped wordalisation ──────────────────────────────────

// Pick the few examples closest to what she actually said, rather than handing
// over the whole stage. Stage C has fifteen; dumping all of them buries the one
// that matters and the model answers from the average instead of the example.
// The deployed loadFewShotExamples() already takes 3 — this does the same, but
// chosen by relevance rather than at random.
function mostRelevant(pool, message, limit = 4) {
  const stop = new Set(["what", "when", "should", "would", "there", "their", "about", "this", "that", "with", "from", "have", "they", "them", "your", "just", "been", "much", "more", "than"]);
  const words = new Set(
    message.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w)),
  );
  if (!words.size) return pool.slice(0, limit);

  const score = (e) => {
    const hay = `${e.question} ${e.answer}`.toLowerCase();
    let n = 0;
    for (const w of words) if (hay.includes(w)) n += 1;
    return n;
  };
  const scored = pool.map((e) => ({ e, score: score(e) })).sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, limit).map((s) => s.e);

  // Always carry at least one of Otema's real answers, even when the drafted
  // ones are lexically closer. Observed: "my manager said there's no budget"
  // selected G4, G4a, G4b, G4d — all four drafted, so her voice was absent
  // from a prompt whose whole job is to sound like her. The drafts echo her;
  // they are not a substitute for her.
  if (!picked.some((e) => e.source === "OTEMA")) {
    const hers = scored.find((s) => s.e.source === "OTEMA");
    if (hers) picked.splice(limit - 1, 1, hers.e);
  }
  return picked;
}

async function wordalise(message, stage, history, facets, search = null) {
  const all = STAGES[stage].facets.map((id) => facets[id]).filter(Boolean);
  const pool = mostRelevant(all, message);
  const examples = pool.map((e) => `Q: ${e.question}\nA: ${e.answer}`).join("\n\n");

  // Call two of two. An ordinary chat completion — no tools, no searching.
  // Its only job is to say what the search found, in her voice. Because the
  // raw text is passed in rather than fetched here, the figure rule inverts:
  // figures are now allowed, but ONLY ones that appear below.
  const grounding = search ? [
    "",
    "SEARCH RESULTS — retrieved just now for this question:",
    search.raw,
    "",
    "Rules for using these results, which replace the no-figures rule above:",
    "You may give figures, but only ones that appear in the results. Never adjust, average or round beyond what is written there.",
    "Name the source and its date whenever you give a number — 'Glassdoor, 2025' — so she can judge it herself.",
    "If the results are thin, or don't cover what she asked, say so as yourself — 'I couldn't find much on fintech specifically' — and then give her the approach instead. Never switch to a neutral, sourceless summary and pretend it answers her.",
    "Never mention searching, sources you could fetch, or offering to look again — she is talking to a coach, not a search box. Cite the source of a figure by name, but never narrate how you got it.",
    "Copy the period EXACTLY as the results give it. If a source says per month, say per month. Never convert monthly to annual or the reverse, and never restate a figure in a period the source did not use.",
    "Cite each figure ONCE, inline, in brackets — 'NGN 298,578 a month (Glassdoor, 2024)'. Never add a separate 'Source:' sentence afterwards; you have already said it.",
    "If you gave her figures earlier in this conversation, do NOT repeat them. She has them. Answer only what she has just narrowed to, and refer back in one clause if you must — 'those were general roles, but for fintech…'. Restating the same numbers reads as if you weren't listening.",
  ].join("\n") : "";

  // Order matters. The length constraint goes LAST because recency wins: with
  // five examples and a knowledge dump above it, an instruction at the top gets
  // buried and the model writes a rundown of everything it was given.
  const sys = [
    loadSystemPrompt(),
    "",
    `Where the user is right now: ${STAGES[stage].describes}`,
    "",
    "Answers you have given to related questions. These are your VOICE REFERENCE — match their tone, their directness and above all their length. Do not quote them, and do not answer questions the user did not ask.",
    "",
    examples,
    "",
    "Background you may draw on if it is relevant to what was actually asked:",
    loadKnowledge(),
    "",
    search ? "" : loadFigureGuard(),
    grounding,
    "",
    "NOW THE RULES FOR YOUR REPLY, WHICH OVERRIDE EVERYTHING ABOVE:",
    loadStandWithHer(),
    "Answer only the one thing the user actually asked. You have been given several examples so that you can pick the right one — not so that you can cover them all.",
    search
      ? [
          "FIRST PERSON, always. You are telling her what you found, not publishing it. Start with what YOU found or couldn't find — \"I could only find a couple of figures for Lagos\", \"I couldn't find much on fintech specifically\" — then give the numbers with their sources, then what to do with them.",
          "Never open with a bare fact like \"Data on X is thin\" or \"Those figures are for Y\". That is a report, not a coach.",
          "Three or four sentences. Two figures at most — she needs an anchor, not a table.",
        ].join(" ")
      : "Two or three sentences. Never a list. Never a rundown of the whole subject.",
    "Then one short question that the material above can actually answer.",
  ].join("\n");

  return callAzure([
    { role: "system", content: sys },
    ...history.slice(-10),
    { role: "user", content: message },
  ], { maxTokens: search ? 6000 : 2000 });
}

// ── State: the in-memory equivalent of the migration ────────────────────────

const state = {
  active_area: null,
  covered_stages: [],
  touched_facets: [],
  closed_areas: [],
  stallCount: 0,
  lastStage: null,
  role: null,
  location: null,
  lastRefinement: null,
};

// ── Presentation ────────────────────────────────────────────────────────────

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  wine: (s) => `\x1b[35m${s}\x1b[0m`,
  teal: (s) => `\x1b[36m${s}\x1b[0m`,
  amber: (s) => `\x1b[33m${s}\x1b[0m`,
};

function wrap(t, width = 78, indent = "  ") {
  const out = []; let line = indent;
  for (const w of t.split(/\s+/)) {
    if ((line + w).length > width) { out.push(line.trimEnd()); line = indent; }
    line += w + " ";
  }
  out.push(line.trimEnd());
  return out.join("\n");
}

function showState() {
  console.log(C.dim("\n  ── state ─────────────────────────────────────────────"));
  console.log(C.dim(`  active_area     ${state.active_area ? `${AREA.n} · ${AREA.name}` : "none"}`));
  console.log(C.dim(`  covered_stages  ${state.covered_stages.join(", ") || "—"}`));
  console.log(C.dim(`  touched_facets  ${state.touched_facets.join(", ") || "—"}`));
  console.log(C.dim(`  closed_areas    ${state.closed_areas.join(", ") || "—"}`));
  console.log(C.dim(`  role/location   ${state.role || "—"} / ${state.location || "—"}`));
}

// ── Loop ────────────────────────────────────────────────────────────────────

const facets = buildFacets();
const scripted = process.argv.find((a) => a.startsWith("--script="));
const queue = scripted ? scripted.slice(9).split("|").map((s) => s.trim()) : null;
const rl = queue ? null : createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => {
  if (queue) { const n = queue.shift() ?? "quit"; console.log(`${q}${n}`); return Promise.resolve(n); }
  return new Promise((res) => rl.question(q, res));
};

const history = [];

async function closeArea(reason, { by = "coach", to = null } = {}) {
  console.log(C.dim(`\n  → closeDiscussionArea() — ${reason}`));
  const names = state.covered_stages.map((k) => STAGE_SUMMARY[k]).filter(Boolean);
  const list = names.length > 1
    ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
    : names[0];

  // The coach is a coach, not a chair. Nothing here should sound like someone
  // closing an agenda item, declaring what was achieved, or granting
  // permission to continue — offering, not concluding.
  let line;
  if (by === "user") {
    // They have already moved. Follow them; don't deliver a report card.
    line = to
      ? `Of course — let's get into ${to.toLowerCase()}.`
      : "Of course — what's on your mind?";
  } else {
    // No summary at all. Naming what was covered is what made this sound like
    // a chair closing an agenda item — and it reads badly besides ("useful on
    // the offer on the table"). The state still records it; the user just
    // doesn't need it read back to them.
    line = "Hope that's been helpful. Is there anything else on your mind?";
  }
  console.log(`\n${C.wine("Botema")}`);
  console.log(wrap(line));
  state.closed_areas.push(AREA.n);
  state.active_area = null;
  if (by === "coach") console.log(C.dim(`\n  offering: ${Object.entries(OTHER_AREAS).map(([n, t]) => `${n} · ${t}`).join("  |  ")}`));
}

async function main() {
  console.log(C.bold("\n  BSC Coach — local area harness"));
  console.log(C.dim(`  Area ${AREA.n} · ${AREA.name} · ${DRY ? "DRY (no Azure)" : `live via ${AZURE.deployment}`}`));
  console.log(C.dim("  Type freely. 'state' to inspect, 'quit' to stop.\n"));

  for (;;) {
    const input = (await ask(`${C.bold("  you")} > `)).trim();
    if (!input) continue;
    if (input.toLowerCase() === "quit") break;
    if (input.toLowerCase() === "state") { showState(); continue; }

    // Layer 2 — explicit leave, ahead of any model call.
    if (state.active_area && saysLeaving(input)) {
      console.log(C.dim("  [leave-phrase check fired — no classification needed]"));
      await closeArea("the user said so outright", { by: "user" });
      break;
    }

    let placed;
    try {
      placed = DRY ? { stage: "A", why: "dry mode — not classified" } : await classify(input, history, state.covered_stages);
    } catch (err) {
      console.log(C.amber(`\n  Azure error: ${err.message}\n`));
      continue;
    }
    if (!placed) { console.log(C.amber("  (no classification returned — try rephrasing)")); continue; }

    console.log(C.dim(`  [stage ${placed.stage} — ${placed.why}]`));

    // Layer 1 — the classifier itself.
    if (placed.stage === "leaving") {
      // The model answers this field loosely — "4", "4 (Mentorship)", or the
      // area name on its own — so match on a number if there is one, and fall
      // back to matching the name.
      const dest = (() => {
        const raw = String(placed.leaveTo || "").trim();
        if (!raw || /^none$/i.test(raw)) return null;
        const num = raw.match(/\d+/)?.[0];
        if (num && OTHER_AREAS[num]) return OTHER_AREAS[num];
        const byName = Object.values(OTHER_AREAS).find((t) =>
          raw.toLowerCase().includes(t.split(" ")[0].toLowerCase()));
        return byName || null;
      })();
      await closeArea(`classified as leaving${dest ? ` → area ${placed.leaveTo} · ${dest}` : ""}`, { by: "user", to: dest });
      break;
    }

    // Carry forward what we already know about them — these are facts about
    // the person, not about one message, and the location column in the
    // migration exists for exactly this.
    if (placed.role && !/^(none|unknown|n\/a)$/i.test(placed.role)) state.role = placed.role;
    if (placed.location && !/^(none|unknown|n\/a)$/i.test(placed.location)) state.location = placed.location;

    // What this turn narrows to — "is that for fintech" should search again
    // with fintech in the query, not reuse the previous general answer.
    let refinement = placed.refinement && !/^(none|n\/a)$/i.test(placed.refinement) ? placed.refinement : "";
    if (state.location && refinement.toLowerCase().includes(state.location.toLowerCase())) {
      refinement = refinement.replace(new RegExp(state.location, "ig"), "").replace(/^[,\s]+|[,\s]+$/g, "");
    }
    const narrowed = Boolean(refinement && refinement !== state.lastRefinement);

    // Layer 3 — stall. Keyed on the USER adding nothing new, not on the stage
    // repeating: staying in one stage for several productive turns is the
    // normal case and must never be mistaken for being stuck.
    //
    // A refinement counts as new information even when the classifier says
    // otherwise. Narrowing the question — "is that for fintech?" — tells the
    // coach something it did not know, and treating that as a stall punishes
    // the user for engaging.
    const addedSomething = placed.newInformation !== false || narrowed;
    if (placed.stage === state.lastStage && !addedSomething) {
      state.stallCount += 1;
      console.log(C.dim(`  [no new information — stall ${state.stallCount}/2]`));
      if (state.stallCount >= 2) {
        await closeArea("two turns with nothing new added — the stall rule");
        break;
      }
    } else {
      state.stallCount = 0;
    }
    state.lastStage = placed.stage;

    if (!state.active_area) {
      state.active_area = AREA.n;
      console.log(C.dim(`  → enterDiscussionArea(${AREA.n} · ${AREA.name})`));
    }
    if (!state.covered_stages.includes(placed.stage)) state.covered_stages.push(placed.stage);
    for (const f of STAGES[placed.stage].facets) {
      if (facets[f] && !state.touched_facets.includes(f)) state.touched_facets.push(f);
    }

    if (DRY) { console.log(C.dim("  (dry mode — no answer generated)\n")); continue; }

    // W-marked behaviour: only a question about what something PAYS reaches
    // the web, and only when we know both the role and the place. Without a
    // location the query is unanswerable and a search is worse than none.
    let search = null;
    if ((placed.needsMarketData || narrowed) && state.role && state.location) {
      try {
        // A search takes ~30s. Saying nothing for half a minute reads as a
        // hang, so tell her what's happening in her coach's voice — not as a
        // system message.
        console.log(`\n${C.wine("Botema")} ${C.dim("…")}`);
        console.log(wrap("Let me check what's actually being paid for that at the moment — one moment."));
        process.stdout.write(C.dim(`\n  [W · searching: ${state.role}, ${state.location}${refinement ? ", " + refinement : ""}] `));
        search = await searchMarketRate(state.role, state.location, refinement);
        state.lastRefinement = refinement;
        console.log(C.dim(search.cached ? "cached" : `${search.queries} search, ${search.citations.length} sources`));
        // A search with no citations is not grounding. Treating it as such
        // switches the invented-figure guard off and lets the model cite
        // sources it never saw — the exact failure the guard exists to stop,
        // coming back through the door we opened for real data.
        if (!search.citations.length || /NO RELIABLE DATA/i.test(search.raw)) {
          console.log(C.amber("  [nothing citable — answering ungrounded, guard back on]"));
          search = null;
        }
      } catch (err) {
        console.log(C.amber(`search failed: ${err.message} — answering without it`));
      }
    } else if (placed.needsMarketData) {
      console.log(C.dim(`  [W · skipped — ${state.location ? "no role" : "no location"} known yet]`));
    }

    let reply;
    try {
      reply = await wordalise(input, placed.stage, history, facets, search);
    } catch (err) {
      console.log(C.amber(`\n  Azure error: ${err.message}\n`));
      continue;
    }
    if (!reply) { console.log(C.amber("  (empty response — the reasoning budget ran out)")); continue; }

    const { text: guarded, stripped } = search ? { text: reply, stripped: false } : stripFigures(reply);
    if (stripped) console.log(C.amber("  [figure guard fired — a figure or source claim was removed]"));
    const { text, capped } = capSentences(flattenInlineList(guarded), search ? 5 : 3);
    if (capped) console.log(C.amber("  [sentence cap fired — the model wrote a rundown]"));

    const chosen = mostRelevant(STAGES[placed.stage].facets.map((f) => facets[f]).filter(Boolean), input);
    const real = chosen.filter((e) => e.source === "OTEMA").length;
    console.log(C.dim(`  [drew on ${chosen.map((e) => e.id).join(", ")} — ${real} Otema, ${chosen.length - real} drafted]`));
    console.log(`\n${C.wine("Botema")}`);
    console.log(wrap(text));
    if (search?.citations.length) {
      console.log(C.dim("\n  sources: " + search.citations.slice(0, 4).map((u) => u.replace(/^https?:\/\//, "").split("/")[0]).join(", ")));
    }
    console.log("");

    history.push({ role: "user", content: input }, { role: "assistant", content: text });
  }

  showState();
  console.log(C.dim("\n  Nothing was written to any database.\n"));
  if (rl) rl.close();
}

main();
