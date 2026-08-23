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

// Most areas' real answers share one topic tag, so matching on AREA_TOPIC is
// enough. Confidence doesn't: its 5 real answers in botema-examples.ts carry
// granular pre-v4 tags ("belonging", "confidence" ×3, "general") because the
// live BoteMindset.loadFewShotExamples() still filters on that same field by
// challenge_type — so retagging them to one area-level topic would quietly
// change what the deployed coach serves. Worse, "general" is also the tag on
// an unrelated Wellbeing answer (Q35), so even matching all of Confidence's
// tags together would pull that one in too. An area can set `realQuestions`
// (the exact question text, in the order it wants S1.. to land) to sidestep
// both problems — matched by literal text instead of by topic at all.
function loadReal(area) {
  const src = readFileSync(join(FN, "botema-examples.ts"), "utf8");
  if (area.realQuestions) {
    return area.realQuestions
      .map((q) => {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const m = src.match(new RegExp(`question:\\s*"${escaped}",\\s*\\n\\s*answer:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
        return m ? { question: q, answer: unq(m[1]), source: "OTEMA" } : null;
      })
      .filter(Boolean);
  }
  const re = new RegExp(
    `question:\\s*"((?:[^"\\\\]|\\\\.)*)",\\s*\\n\\s*answer:\\s*"((?:[^"\\\\]|\\\\.)*)",\\s*\\n\\s*topic:\\s*"${area.topic}"`,
    "g",
  );
  return [...src.matchAll(re)].map((m) => ({ question: unq(m[1]), answer: unq(m[2]), source: "OTEMA" }));
}

// Facet IDs are only unique WITHIN an area — Getting Started's G1 (bootcamp
// legitimacy) and Salary's G1 (pay equity) are different content sharing one
// name, and Confidence's G1/G2 make it a three-way collision. Without the
// area filter, whichever area's same-named facet appears later in the source
// file silently overwrites the earlier one in the flat facet map, for every
// area being tested — not just the one that collided. Scoped by the `area:`
// number every entry already carries.
function loadDrafted(areaN) {
  const src = readFileSync(join(FN, "botema-generated-examples.ts"), "utf8");
  const body = src.slice(src.indexOf("adviseOnCareerTopic: ["));
  const out = [];
  // botema-generated-examples.ts checks out as CRLF on this machine; a literal
  // \n split never matched a single chunk boundary, so this returned nothing
  // for every area, every time, all session — every "0 drafted" in every
  // transcript so far is this bug, not an actual absence of drafted material.
  // loadReal() was unaffected because \s*\n\s* already absorbs \r; this split
  // used a bare \n.
  for (const chunk of body.split(/\r?\n    \{\r?\n/).slice(1)) {
    const e = chunk.split(/\r?\n    \},/)[0];
    const q = e.match(/question:\s*"((?:[^"\\]|\\.)*)"/);
    const a = e.match(/answer:\s*\n?\s*"((?:[^"\\]|\\.)*)"/);
    const f = e.match(/facet:\s*"([A-Za-z0-9]+)"/);
    const ar = e.match(/area:\s*(\d+)/);
    if (q && a && f && ar && Number(ar[1]) === areaN) out.push({ question: unq(q[1]), answer: unq(a[1]), facet: f[1], source: "DRAFTED" });
  }
  return out;
}

function loadSystemPrompt() {
  const src = readFileSync(join(FN, "botema-examples.ts"), "utf8");
  const values = src.match(/export const BOTEMA_VALUES = `([^`]*)`/);
  const voice = src.match(/export const BOTEMA_SYSTEM_PROMPT = `([^`]*)`/);
  return [values?.[1], voice?.[1] || "You are Botema, a BSC Career Coach."].filter(Boolean).join("\n\n");
}

function loadKnowledge(topic) {
  const src = readFileSync(join(FN, "bsc-knowledge.ts"), "utf8");
  const m = src.match(new RegExp(`${topic}: \`([\\s\\S]*?)\`\\.trim\\(\\)`));
  return m ? m[1].trim() : "";
}

// All five of these matched `;\n` literally. converser.ts checks out as CRLF
// on this machine, so the actual text is `;\r\n` — the match failed outright,
// every function fell back to "", and every one of these guards has been
// silently absent from the system prompt for every test run this session,
// across every area: STAND_WITH_HER, NEVER_OFFER_TO_ACT, PLAIN_LANGUAGE,
// ASK_WITHOUT_EXTRACTING, NO_INVENTED_FIGURES. `;\r?\n` fixes all five.
function loadStandWithHer() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const STAND_WITH_HER =\s*([\s\S]*?);\r?\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\r?\n\s*"/g, "").trim() : "";
}

function loadNeverAct() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const NEVER_OFFER_TO_ACT =\s*([\s\S]*?);\r?\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\r?\n\s*"/g, "").trim() : "";
}

function loadPlainLanguage() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const PLAIN_LANGUAGE =\s*([\s\S]*?);\r?\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\r?\n\s*"/g, "").trim() : "";
}

function loadAskWell() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const ASK_WITHOUT_EXTRACTING =\s*([\s\S]*?);\r?\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\r?\n\s*"/g, "").trim() : "";
}

function loadFigureGuard() {
  const src = readFileSync(join(FN, "converser.ts"), "utf8");
  const m = src.match(/export const NO_INVENTED_FIGURES =\s*([\s\S]*?);\r?\n/);
  return m ? m[1].replace(/^\s*"|"\s*\+?\s*$/gm, "").replace(/"\s*\+\s*\r?\n\s*"/g, "").trim() : "";
}

// ── The area under test ─────────────────────────────────────────────────────
// The coverage map lives in scripts/areas/, one file per discussion area, so a
// new area is a new file rather than an edit to this harness.

// Areas are named, not numbered — `--area=salary`, not `--area=9`. The numbers
// exist because the storyboard orders them, but nobody thinks in numbers and
// "area 9" tells a reader nothing.
const areaArg = process.argv.find((a) => a.startsWith("--area="));
const AREA_SLUG = areaArg ? areaArg.slice(7).toLowerCase() : "salary";

const AREAS_BUILT = [
  "salary",
  "getting-started",
  "confidence",
  "career-paths",
  "further-education",
  "mentorship",
];

if (!AREAS_BUILT.includes(AREA_SLUG)) {
  console.error(`\n  No coverage map for "${AREA_SLUG}".`);
  console.error(`  Built so far: ${AREAS_BUILT.join(", ")}`);
  console.error(`  Add one at scripts/areas/${AREA_SLUG}.mjs — copy salary.mjs for the shape.\n`);
  process.exit(1);
}

const areaConfig = (await import(`./areas/${AREA_SLUG}.mjs`)).default;
const AREA = { n: areaConfig.n, name: areaConfig.name };
const AREA_N = areaConfig.n;
const STAGES = areaConfig.stages;
const STAGE_SUMMARY = areaConfig.stageSummary;
const S_ORDER = areaConfig.realOrder;
const AREA_TOPIC = areaConfig.topic;
const HISTORY_WINDOW_LOCAL = 10;
const SUPERSEDES = areaConfig.supersedes || [];
const FALLBACK_QUESTION = areaConfig.fallbackQuestion || "What would you like to look at next?";

function buildFacets() {
  const f = {};
  loadReal(areaConfig).forEach((e, i) => { if (S_ORDER[i]) f[S_ORDER[i]] = { ...e, id: S_ORDER[i] }; });
  loadDrafted(AREA_N).forEach((e) => { f[e.facet] = { ...e, id: e.facet }; });
  return f;
}

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
const OTHER_AREAS = Object.fromEntries(Object.entries(ALL_AREAS).filter(([n]) => Number(n) !== AREA_N));

// ── Leave detection, layer 2: explicit phrases ──────────────────────────────
// Fires regardless of what the classifier says. Cheap, deterministic, and the
// one case where a user is unambiguous and being ignored would be insulting.

// Every phrase here must express an intent to change subject ON ITS OWN. This
// check runs before any model call, so a false positive closes the area with
// no judgment applied at all.
//
// Observed: she typed "i dont want to seem awkward and have them just move on
// to the next candidate" and the bare "move on" matched. The coach closed the
// area and asked what was on her mind — at the exact sentence the confidence
// facet exists for. A worry about how she will be perceived is never a leave
// signal.
//
// So the loose fragments are gone, and the ones that survive are either
// unambiguous on their own or anchored to a subject word.
const LEAVE_PHRASES = new RegExp(
  [
    "\\btalk about something else\\b",
    "\\b(?:different|another|new)\\s+(?:topic|subject|area|question)\\b",
    "\\bchange (?:the )?(?:topic|subject)\\b",
    "\\blet'?s (?:move on|leave (?:it|this|that))\\b",
    "\\bmove on to (?:something|another|a different)\\b",
    "\\bcan we talk about (?:something|mentors?|cvs?|interviews?)\\b",
    "\\bforget (?:this|that|it)\\b",
    "\\bnext (?:topic|question|subject)\\b",
    "\\bdone with (?:this|that|salary|pay)\\b",
    "\\benough about (?:this|that|salary|pay|money)\\b",
  ].join("|"),
  "i",
);

// Phrases that look like leaving but are her describing a fear or a situation.
// Checked first: if one of these is present, the message is about her, not
// about changing the subject.
const NOT_LEAVING = /\b(?:move on to the next|moving on to the next|move on without|they (?:just )?move on|worried|scared|afraid|nervous|don'?t want to (?:seem|look|be seen))\b/i;

// Said when a model call fails outright. Keeps her in the conversation and
// keeps the question with her, rather than stranding her on the turn she
// most needed answered.
const COULD_NOT_ANSWER =
  "Sorry — that one did not come through properly on my end. Could you say it again, or put it a different way?";

function saysLeaving(text) {
  if (NOT_LEAVING.test(text)) return false;
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

const MONEY = /(?:\b(?:NGN|KES|KSh|ZAR|GHS|UGX|TZS|RWF|USD|GBP|EUR)\b|[$£€₦])\s?([\d][\d,.]*)\s*(k|m|million)?/gi;

function stripImplausibleFigures(text) {
  const found = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  sentences.forEach((sentence, i) => {
    for (const m of sentence.matchAll(MONEY)) {
      const currency = (m[0].match(/[A-Z]{3}|[$£€₦]/i) || [""])[0].toUpperCase();
      let value = parseFloat(m[1].replace(/,/g, ""));
      if (/^k$/i.test(m[2] || "")) value *= 1000;
      if (/^(m|million)$/i.test(m[2] || "")) value *= 1000000;
      if (Number.isFinite(value)) found.push({ currency, value, sentence: i });
    }
  });
  if (found.length < 2) return text;
  const primary = found[0].currency;
  const same = found.filter((f) => f.currency === primary);
  const smallest = Math.min(...same.map((f) => f.value));
  const drop = new Set();
  for (const f of found) {
    if (f.currency !== primary) drop.add(f.sentence);
    else if (f.value > smallest * 5) drop.add(f.sentence);
  }
  if (!drop.size) return text;
  const kept = sentences.filter((s, i) => !drop.has(i) || s.trim().endsWith("?"));
  return kept.join(" ").trim();
}

const ANNUAL_FLOOR = { NGN: 1200000, KES: 300000, GHS: 30000, ZAR: 100000, UGX: 5000000, TZS: 3000000, RWF: 1500000, ZMW: 30000, ETB: 100000, XOF: 1000000, XAF: 1000000, USD: 5000, EUR: 5000, GBP: 5000, "$": 5000, "£": 5000, "€": 5000, "₦": 1200000 };
const ANNUAL_CLAIM = /(?:\b(NGN|KES|KSh|ZAR|GHS|UGX|TZS|RWF|XOF|XAF|ZMW|ETB|USD|GBP|EUR)\b|([$£€₦]))\s?([\d][\d,.]*)\s*(k|m|million)?[^.!?]{0,24}?\b(?:(?:per|a|\/)\s*(?:year|annum|yr)|annually)\b/gi;

// A monthly figure reported as annual — NGN 300k a year is about EUR 190.
function stripImplausiblePeriods(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const drop = new Set();
  sentences.forEach((sentence, i) => {
    for (const m of sentence.matchAll(ANNUAL_CLAIM)) {
      const cur = (m[1] || m[2] || "").toUpperCase().replace("KSH", "KES");
      let v = parseFloat((m[3] || "").replace(/,/g, ""));
      const sc = (m[4] || "").toLowerCase();
      if (sc === "k") v *= 1000;
      if (sc === "m" || sc === "million") v *= 1000000;
      const floor = ANNUAL_FLOOR[cur];
      if (floor && Number.isFinite(v) && v < floor) drop.add(i);
    }
  });
  if (!drop.size) return text;
  const kept = sentences.filter((s, i) => !drop.has(i) || s.trim().endsWith("?"));
  return kept.join(" ").trim();
}

// Mirrors stripAdsOversell in converser.ts.
const ADS_OVERSELL = /\b(?:ads?|adverts?|advertisements?|listings?|job (?:ads?|posts?|postings?))\b[^.!?]{0,60}?\b(?:oversell|overstate|inflate[d]?|exaggerat\w+|higher than|show higher|more than (?:what|the company))\b|\b(?:oversell|overstate|inflated)\b[^.!?]{0,40}?\b(?:ads?|adverts?|listings?)\b/i;

function stripAdsOversell(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (!sentences.some((s) => ADS_OVERSELL.test(s))) return text;
  const kept = sentences.filter((s) => !ADS_OVERSELL.test(s) || s.trim().endsWith("?"));
  return kept.length ? kept.join(" ").trim() : "";
}

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
// Mirrors capSentences in converser.ts, including the two fixes: rescue the
// closing question wherever it sits, and never split inside a quoted script.
function hasOpenQuote(s) {
  const straight = (s.match(/"/g) || []).length;
  return straight % 2 === 1 || (s.match(/[“„]/g) || []).length > (s.match(/[”]/g) || []).length;
}

function splitSentences(text) {
  const rough = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const part of rough) {
    const prev = out[out.length - 1];
    if (prev && hasOpenQuote(prev)) out[out.length - 1] = prev + " " + part;
    else out.push(part);
  }
  return out;
}

// Mirrors dropRepeatedSentences in converser.ts.
function dropRepeatedSentences(text, previousReplies, threshold = 0.45) {
  if (!previousReplies.length) return text;
  const words = (s) => new Set(s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 4));
  const seen = previousReplies.flatMap((r) => splitSentences(r)).map(words);
  const repeats = (s) => {
    const w = words(s);
    if (w.size < 4) return false;
    return seen.some((before) => {
      if (!before.size) return false;
      let shared = 0;
      w.forEach((x) => { if (before.has(x)) shared++; });
      return shared / w.size >= threshold;
    });
  };
  // repeats() exempts anything with fewer than 4 words over 4 letters — right
  // for a normal sentence, but a closing question that survives this far has
  // often already had its substance stripped by the loop below, leaving just
  // a few words ("Would you try that next session and tell me how it goes?"
  // has exactly one: "session"). That's too thin for repeats() to ever engage,
  // so a closer that's nearly identical to the turn immediately before it —
  // the single worst place for a repeat to land — slipped through untouched.
  // Checked only against the ONE most recent reply's own closer, with a lower
  // word bar and a stricter ratio, rather than loosening repeats() itself and
  // risking new false positives against the whole conversation's history.
  const lastCloser = (() => {
    const prevSentences = splitSentences(previousReplies[previousReplies.length - 1] || "");
    const last = prevSentences[prevSentences.length - 1] || "";
    return last.trim().endsWith("?") ? last : null;
  })();
  const echoesLastCloser = (s) => {
    if (!lastCloser || !s.trim().endsWith("?")) return false;
    const lowWords = (t) => new Set(t.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 3));
    const a = lowWords(s), b = lowWords(lastCloser);
    if (!a.size || !b.size) return false;
    let shared = 0;
    a.forEach((w) => { if (b.has(w)) shared++; });
    return shared / a.size >= 0.6;
  };
  const kept = [];
  for (const sentence of splitSentences(text)) {
    if (!sentence.trim().endsWith("?")) {
      if (!repeats(sentence)) kept.push(sentence);
      continue;
    }
    // A quoted script merged with the closing question arrives as one
    // sentence; exempting everything ending in "?" let a near-verbatim script
    // through twice. Split the question off and judge the rest.
    const lastBreak = sentence.search(/[.!”"]\s+[^.!?]*\?$/);
    if (lastBreak === -1) {
      // A standalone closing question, no quoted script attached — this used
      // to be kept unconditionally, on the theory that varying the question
      // was enough. Getting Started's thinner stages (S2/G1 in Stage C, only
      // two facets) showed the coach can land on the exact same closer turn
      // after turn regardless — "which lane feels most urgent to you, web or
      // data, and which days can you protect for study this month?" recurred
      // near-verbatim across all five turns of the constrained-runway
      // scenario, unchecked, because nothing here ever looked at it. Now
      // checked like any other sentence; if it repeats, the reply simply
      // lands without a closing question that turn, which is an accepted
      // shape already (see everyReplyAsks — not every reply needs one).
      if (!repeats(sentence) && !echoesLastCloser(sentence)) kept.push(sentence);
      continue;
    }
    const body = sentence.slice(0, lastBreak + 1).trim();
    const question = sentence.slice(lastBreak + 1).trim();
    if (!repeats(body)) kept.push(sentence);
    else if (question && !echoesLastCloser(question)) kept.push(question);
  }
  return kept.length ? kept.join(" ").trim() : "";
}

function capSentences(text, keep = 3) {
  const sentences = splitSentences(text);
  if (sentences.length <= keep) return { text, capped: false };
  let qi = -1;
  for (let i = sentences.length - 1; i >= 0; i--) if (sentences[i].endsWith("?")) { qi = i; break; }
  const question = qi >= 0 ? sentences[qi] : null;
  const body = sentences.slice(0, keep - (question ? 1 : 0)).filter((_, i) => i !== qi);
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

async function callAzure(messages, { tools, maxTokens = 2000, attempt = 1 } = {}) {
  const url = `${AZURE.endpoint.replace(/\/?$/, "/")}openai/deployments/${AZURE.deployment}/chat/completions?api-version=${AZURE.apiVersion}`;
  const body = { messages, max_completion_tokens: maxTokens };
  if (tools) { body.tools = tools; body.tool_choice = "required"; body.parallel_tool_calls = false; }

  // Transient network failures happen — two in one five-turn run left two
  // turns unanswered. One quiet retry before giving up.
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": AZURE.apiKey },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return callAzure(messages, { tools, maxTokens, attempt: attempt + 1 });
    }
    throw err;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(`Azure ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);

  const choice = data.choices?.[0];
  if (tools) {
    const call = choice?.message?.tool_calls?.[0];
    // The content path already retries once at double the budget when
    // gpt-5-nano spends everything on hidden reasoning. The tool path returned
    // null instead — so a dropped classification ended the turn with nothing,
    // and it did so on the last turn of two conversations, both times on the
    // decision she had come for. Same retry, same reason.
    if (!call) {
      if (maxTokens < 12000) return callAzure(messages, { tools, maxTokens: maxTokens * 2 });
      return null;
    }
    try { return JSON.parse(call.function.arguments || "{}"); } catch { return {}; }
  }
  // gpt-5-nano can spend the whole budget on hidden reasoning and return
  // nothing — retry once at double, same as callAzure() in the real function.
  if (!choice?.message?.content && maxTokens < 12000) {
    return callAzure(messages, { maxTokens: maxTokens * 2 });
  }
  return choice?.message?.content || null;
}

// Words that describe a location without being one. The model reaches for
// these when it has no city, and they must never satisfy the check.
const NON_PLACES = [
  "unspecified", "unknown", "none", "remote", "global", "local", "market",
  "based", "abroad", "international", "anywhere", "various", "your", "their",
];

// True only when the place actually appears in what she typed. Matches on any
// word of the candidate that is a real place-word — so "Lagos, Nigeria"
// counts if she said either — while "unspecified", "remote" and "her market"
// never do, because she never said them.
function mentionedByUser(candidate, saidByUser) {
  const words = String(candidate)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !NON_PLACES.includes(w));
  return words.length > 0 && words.some((w) => saidByUser.includes(w));
}

// ── The invented-location guard ──────────────────────────────────────────
// Observed live, twice, on Getting Started with no location ever given: the
// model volunteered a specific country/city unprompted ("Ghana-based roles",
// "local firms in Ghana") — a fabrication in the same shape as an invented
// figure, just a place instead of a number. mentionedByUser() above already
// keeps the web-search location honest; this applies the same test to every
// reply, not just search-triggering ones. The list is curated, not
// exhaustive — extend it if a different invented place turns up.
const KNOWN_PLACES = [
  "ghana", "accra", "nigeria", "lagos", "abuja", "kenya", "nairobi",
  "south africa", "cape town", "johannesburg", "uganda", "kampala",
  "rwanda", "kigali", "tanzania", "ethiopia", "addis ababa", "senegal",
  "dakar", "egypt", "cairo", "morocco", "zambia", "malawi", "zimbabwe",
  "germany", "berlin", "united kingdom", "united states",
];

function stripInventedLocation(text, saidByUser) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const invented = (s) => {
    const low = s.toLowerCase();
    return KNOWN_PLACES.some((p) => low.includes(p) && !mentionedByUser(p, saidByUser));
  };
  if (!sentences.some(invented)) return text;
  // Unlike a figure, a place named inside a question is still a fabrication —
  // "are you aiming for local Ghana roles?" presumes Ghana just as much as
  // stating it outright would. Confirmed live: this exemption is exactly what
  // let "local Ghana roles or remote-for-abroad opportunities" survive inside
  // a closing question after the same guard had already fired earlier in the
  // same reply on a non-question sentence. No exemption for questions here.
  const kept = sentences.filter((s) => !invented(s));
  return kept.join(" ").trim();
}

// The prompt already tells the model every opener used so far in this
// conversation and asks for a different one ("different first words,
// different shape") — but on live transcripts it still reused the same
// opening clause ("That back-and-forth is...", twice, one turn apart) with
// only the back half changed, which reads as a fresh sentence to the model
// but is the same tic to her. A third reminder is not going to land where a
// second one didn't — this checks it instead, same 4-word key the
// noRepeatedOpeners test uses, so the guard and the check agree.
function openerKey(sentence) {
  return sentence.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
}
function stripRepeatedOpener(text, previousReplies) {
  if (!previousReplies.length) return text;
  const used = new Set(previousReplies.map((r) => openerKey(splitSentences(r)[0] || "")));
  const sentences = splitSentences(text);
  if (sentences.length < 2 || !used.has(openerKey(sentences[0]))) return text;
  return sentences.slice(1).join(" ").trim();
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
    "Prefer salary surveys, aggregators and job ads with published ranges. AVOID a single employer's own recruitment or marketing pages — an advertised headline rate is a hiring hook, not a market rate.",
    "Report AT MOST THREE figures, the three most reliable and most recent you find, all in the SAME currency and the SAME period wherever possible.",
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

// ── Who she is, in prose ────────────────────────────────────────────────────
// A fixed set of variables only holds what somebody anticipated. Two short
// paragraphs hold the situation — what a mentor would actually remember.
//
// Runs only when the classifier says she added something, so a turn that
// carries no new information costs nothing. Rewrites in full rather than
// appending, so it stays readable instead of growing into a file on her.

async function updateProfile(message, history) {
  const sys = [
    "You keep a short private note about someone a career coach is talking to. Rewrite it now, incorporating anything new in her latest message.",
    "",
    "Return exactly two paragraphs separated by a blank line, nothing else:",
    "1. WHERE SHE IS — her role, her place, what is happening with her pay or job right now.",
    "2. WHAT SHE IS TRYING TO DO — where she wants to get to, what is in her way, what she has already tried.",
    "",
    "Write it as a note in the third person — \"She is a backend developer in Nairobi, three years in the role\" — never by quoting her back at herself.",
    "ACCUMULATE. The note so far is below; keep everything in it that is still true and fold in whatever is new. Do not start again from only the latest message.",
    "Record ONLY what she has actually said. Never infer, never embellish, never guess a city or a salary she has not given.",
    "If you genuinely know nothing for a paragraph, output the single word NONE for it. Never write \"no information provided\" or any other placeholder — that gets stored as if it were a fact.",
    "A few sentences each at most. This is a memory, not a dossier.",
    "",
    "The note so far:",
    state.situation ? "WHERE SHE IS: " + state.situation : "WHERE SHE IS: (nothing yet)",
    state.aims ? "WHAT SHE IS TRYING TO DO: " + state.aims : "WHAT SHE IS TRYING TO DO: (nothing yet)",
  ].filter((x) => x !== null).join("\n");

  const out = await callAzure([
    { role: "system", content: sys },
    ...history.slice(-HISTORY_WINDOW_LOCAL),
    { role: "user", content: message },
  ], { maxTokens: 1200 });
  if (!out) return;

  const parts = out.split(/\n\s*\n/).map((p) => p.replace(/^\s*(?:\d[.)]\s*)?(?:WHERE SHE IS|WHAT SHE IS TRYING TO DO)\s*:?\s*/i, "").trim());
  // A placeholder stored as content is worse than an empty field: it reads as
  // something known. Observed once — "(no information provided in this
  // message)" sitting where her aims should be.
  const real = (p) => p && !/^\(?\s*(?:none|n\/a|unknown|no information|nothing)\b/i.test(p.trim());
  if (real(parts[0])) state.situation = parts[0];
  if (real(parts[1])) state.aims = parts[1];
}

// ── Layer 1: classification ─────────────────────────────────────────────────

const AREA_LIST = () => Object.entries(OTHER_AREAS).map(([n,t])=>n+" ("+t+")").join(", ");

const CLASSIFY_TOOL = [{
  type: "function",
  function: {
    name: "placeInArea",
    description: `Decide which stage of the ${AREA.name} area this message belongs to, or whether the user is leaving the area.`,
    parameters: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          // Stage letters are whatever the area config defines — 2 to 4 of
          // them, not always exactly A/B/C. Hardcoding three here is what
          // broke Getting Started's first pass when it needed a 4th (D).
          enum: [...Object.keys(STAGES), "leaving"],
          description: [
            ...Object.keys(STAGES).map((k) => `${k} — ${STAGES[k].describes}`),
            `leaving — the message is not about ${AREA.name} at all: they want a different subject, or the real blocker belongs to another area entirely (e.g. confidence rather than tactics).`,
          ].join(" | "),
        },
        leaveTo: {
          type: "string",
          description: "If leaving, the number of the area that suits better — always give one. Use \"none\" when not leaving. Options: " + AREA_LIST(),
        },
        needsMarketData: {
          type: "boolean",
          description: "True ONLY if she is asking what a role actually pays, AND she has already named a city or country. False for everything else: how to negotiate, what to say, whether an offer is fair in principle, and anything about how she feels — self-doubt, deserving more, fear of asking. If no place has been named, this is false.",
        },
        role: { type: "string", description: "The role being priced, if any. e.g. mid-level backend developer." },
        refinement: { type: "string", description: "Any narrowing this message adds to a pay question — an industry, a company type, remote vs local. Use none if there is none." },
        location: { type: "string", description: "The city or country, if the user has given one." },
        newInformation: {
          type: "boolean",
          // Confirmed live on Mentorship: "is that going to be a problem" and
          // "what should I actually tell my mentor" both scored false under
          // the old wording — true by the letter (no fact/constraint/answer),
          // but each was a genuinely new question, and two in a row closed
          // the whole area on someone who was actively engaging, not stuck.
          // Asking something not asked before is forward motion; only an
          // actual repeat, filler, or shrug is a stall.
          description: "Did this message move the conversation forward — a fact, a constraint, an answer to what was asked, OR a genuinely new question she hasn't asked before? False only for filler, a restatement of something already said, or a shrug.",
        },
        why: { type: "string", description: "One short clause explaining the choice." },
      },
      // All required. Optional fields get dropped intermittently by the model,
      // and a leaveTo that vanishes loses the destination it had just worked out.
      required: ["stage", "leaveTo", "needsMarketData", "refinement", "newInformation", "why"],
    },
  },
}];

async function classify(message, history, covered, maxTokens = 2000) {
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
  ], { tools: CLASSIFY_TOOL, maxTokens });
}

// ── Generation: stage-scoped wordalisation ──────────────────────────────────

// Pick the few examples closest to what she actually said, rather than handing
// over the whole stage. Stage C has fifteen; dumping all of them buries the one
// that matters and the model answers from the average instead of the example.
// The deployed loadFewShotExamples() already takes 3 — this does the same, but
// chosen by relevance rather than at random.
// Selection reads the whole conversation, not just the latest message.
//
// Observed: turn 1 was "I handed in my notice and they've offered me 30% more
// to stay"; turn 2 was "I'd asked for a raise twice before and got nothing".
// Matching on turn 2 alone pulled S4 and G4 — how to ASK for a raise — when
// she had already been given one and the live question was whether to take it.
// The situation was established a turn earlier and the retrieval couldn't see
// it, so the coach answered the words rather than the conversation.
//
// The latest message still dominates; earlier ones only tip the balance.
function conversationQuery(message, history) {
  const earlier = history
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content)
    .join(" ");
  return `${message} ${message} ${earlier}`;
}

// Facets the conversation has moved past. Removed from the pool outright
// rather than down-weighted, because a down-weighted example still wins when
// it is the closest lexical match — which is exactly how raise-asking material
// kept surfacing after a resignation.
function retiredBy(used) {
  const gone = new Set();
  for (const rule of SUPERSEDES) {
    if (used.includes(rule.after)) for (const f of rule.retire) gone.add(f);
  }
  return gone;
}

const STOP = new Set(["what", "when", "should", "would", "there", "their", "about", "this", "that", "with", "from", "have", "they", "them", "your", "just", "been", "much", "more", "than"]);

function queryWords(message) {
  return new Set(
    message.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

function overlapScore(e, words) {
  const hay = `${e.question} ${e.answer}`.toLowerCase();
  let n = 0;
  for (const w of words) if (hay.includes(w)) n += 1;
  return n;
}

// How well the best available example actually matches what she asked. Used to
// tell the model when it is on its own — see the note in wordalise().
function matchStrength(pool, message) {
  const words = queryWords(message);
  if (!words.size || !pool.length) return 0;
  return Math.max(...pool.map((e) => overlapScore(e, words)));
}

// Deterministic stand-in for Math.random, seeded from the query text. The
// random four must genuinely vary from turn to turn, but two runs of the same
// scenario have to pick the same examples or nothing can be compared between
// them — a regression would be indistinguishable from a reshuffle.
const USED_PENALTY = 2.5;

function seeded(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Seven examples: the three closest, then four drawn at random from the rest
// of the area.
//
// The three closest give the model the material for THIS question. The random
// four are there for the opposite reason — to widen the voice it is matching,
// so it hears her across the whole area rather than echoing the shape of the
// nearest neighbour back at her. Retrieval by word overlap tends to return
// examples that resemble each other as much as they resemble the question, and
// a prompt built only from those reads as a variation on one answer.
//
// Random ones are labelled separately in the prompt, so their job is plain: a
// far-off example is voice, not advice.
function mostRelevant(pool, message, closest = 3, used = [], random = 4) {
  const retired = retiredBy(used);
  if (retired.size) pool = pool.filter((e) => !retired.has(e.id));
  const words = queryWords(message);
  const total = closest + random;
  if (!words.size) return { near: pool.slice(0, total), wide: [] };

  const scored = pool
    // 2.5, not the 1.5 it started at. Measured: the gap between the best
    // example and the fifth-best is about 3, so 1.5 could not move anything —
    // in the review-cycle conversation the same three facets came back on
    // three consecutive turns and the coach asked the same closing question
    // four times. At 2.5 an example can still return when it is clearly the
    // best fit for a new question, which is wanted, but not turn after turn.
    // This governs the three nearest ONLY. The random four are shuffled
    // uniformly and the penalty never reaches them — their job is the range of
    // her voice, not fit, so a repeat there costs nothing.
    .map((e) => ({ e, score: overlapScore(e, words) - (used.includes(e.id) ? USED_PENALTY : 0) }))
    .sort((a, b) => b.score - a.score);

  // There used to be a guarantee here that at least one of Otema's real
  // answers made it into every reply. Dropped, because it was pinning a slot.
  //
  // Stage C contains exactly one real answer of hers, so the guarantee spliced
  // that same answer into all four turns of the review-cycle conversation —
  // including turns where it scored zero against what was actually asked. Two
  // of the three close slots were fixed for the whole conversation, one by this
  // and one by a near-verbatim match, which no penalty value could dislodge.
  //
  // Her voice can still arrive by the ordinary routes: on merit in the close
  // three, or in the random four, which are drawn from the whole stage.
  const near = scored.slice(0, closest).map((s) => s.e);

  const rest = scored.map((s) => s.e).filter((e) => !near.includes(e));
  const rand = seeded(message);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { near, wide: rest.slice(0, random) };
}

async function wordalise(message, stage, history, facets, search = null, used = [], previousReplies = []) {
  const all = STAGES[stage].facets.map((id) => facets[id]).filter(Boolean);
  const query = conversationQuery(message, history);
  const { near, wide } = mostRelevant(all, query, 3, used);
  const render = (list) => list.map((e) => `Q: ${e.question}\nA: ${e.answer}`).join("\n\n");

  // Record what actually went into the prompt rather than recomputing it after
  // the fact. The caller used to call mostRelevant a second time to find out —
  // which was correct only for as long as both calls were passed identical
  // arguments, and this function's signature has now changed twice.
  state.lastSelection = { near, wide };

  // Retrieval always returns its full quota, however badly the examples fit —
  // ask about relocation costs or maternity pay and raise answers come back
  // looking exactly as authoritative as good matches. Measured: a well-matched
  // question scores 4 against the best example, an off-map one scores 0 or 1.
  // Without this the model has no way to tell the two cases apart, and it
  // answers the question the examples are about rather than the one she asked.
  //
  // Scored on the close three alone. They are the best of whatever the pool
  // held after retiring, so they are the true strength — and leaving the random
  // four out means a lucky draw scoring well by accident cannot talk it up.
  const thin = matchStrength(near, query) <= 1;
  if (thin) console.log(C.dim("  [no close example — voice only, advice from knowledge]"));

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
    "Be sceptical of an outlier. If one figure is several times the others, do not present it as an anchor — say plainly that it looks like a headline rate from one employer rather than what the market pays. A number she cannot actually get is worse than no number.",
    "Never put two currencies side by side as if they were comparable. If the results mix them, use the one for HER market and mention the other only as a contrast, saying so.",
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
    // What a mentor would remember about her, kept as prose rather than
    // variables. Placed before the examples so it frames them: the examples
    // are generic, she is not.
    state.situation ? `WHAT YOU KNOW ABOUT HER: ${state.situation}` : null,
    state.aims ? `WHAT SHE IS TRYING TO DO: ${state.aims}` : null,
    state.situation || state.aims
      ? "Use this. Never ask her again for something she has already told you, and never recite it back at her — just let it shape the answer."
      : null,
    state.situation || state.aims ? "" : null,
    thin
      ? "Answers you have given to OTHER questions. Nothing here is close to what she just asked, so take ONLY the voice from them — the directness, the length, the habit of giving her one thing she can act on. The advice must be your own, worked out for her question from what you know. Do not bend her question towards these answers because they are what you have."
      : "Answers you have given to related questions. These are your VOICE REFERENCE — match their tone, their directness and above all their length. Do not quote them, and do not answer questions the user did not ask.",
    "",
    render(near),
    "",
    // Deliberately further afield, and said so plainly. Without the label the
    // model treats them as material for the question and tries to work them in.
    wide.length
      ? "OTHER ANSWERS OF YOURS, on different questions in this same area. These are NOT about what she asked and you must not answer from them. They are here so you can hear the full range of how you write — where you are blunt, where you soften, how long you run, how you open. Take the range, leave the content."
      : null,
    wide.length ? "" : null,
    wide.length ? render(wide) : null,
    "",
    "Background you may draw on if it is relevant to what was actually asked:",
    loadKnowledge(AREA_TOPIC),
    "",
    search ? "" : loadFigureGuard(),
    grounding,
    "",
    "NOW THE RULES FOR YOUR REPLY, WHICH OVERRIDE EVERYTHING ABOVE:",
    // Present in botema-coach.ts's real prompt, missing here — the harness's
    // "Great question." opener on a live career-paths test turn confirmed
    // this documented gap is real, not just theoretical, for every area.
    'Never start your answer with a filler acknowledgment like "Great question," "Good question," or "Nice" — get straight to the point.',
    loadStandWithHer(),
    loadNeverAct(),
    loadPlainLanguage(),
    loadAskWell(),
    // Observed across five turns on freelance rates: four replies opened "I
    // would always recommend" and the billable-days method was re-derived
    // three times. She has already been told; saying it again is not emphasis,
    // it is not listening.
    // Observed: turn 1 was "I handed in my notice and they've offered me 30%
    // more to stay"; turn 2 mentioned having asked for a raise twice before.
    // The reply explained how to go in and ask for a raise — advice for
    // someone still seeking one, given to someone who had already been
    // offered it. The examples were about asking, so it advised asking.
    "ANSWER THE CONVERSATION, NOT THE TOPIC. Before you write, ask yourself what has actually already happened to her — what she has been offered, refused, told or decided in this conversation so far. Her latest message is usually a detail added to that situation, not a new question.",
    "The examples above are the nearest material you have. They are not necessarily the right material. If her situation has moved past what they describe — she already has the offer, she already resigned, she already got the raise — then say what fits HER, and let the examples inform only your voice. Advice that would have been right two turns ago is wrong now, and she will notice.",
    "When she adds a fact, the reply must be ABOUT that fact. 'I asked twice before and got nothing' is not background colour — it is evidence about how her employer behaves, and it should change what you tell her, not sit alongside the same advice as before.",
    "You can see everything you have already said in this conversation. Do NOT repeat advice you have already given — she heard it. If a point still applies, refer back to it in a clause ('using the floor rate we worked out') and spend the reply on what is new.",
    previousReplies.length
      // Every opener so far, not just the last one. Looking back a single turn
      // let "That's real" come back on turn 3 after turn 2 happened to open
      // differently — the rule could not see two turns ago, so the phrase was
      // free again the moment it skipped one.
      ? `You have already opened replies in this conversation with: ${previousReplies.map((r) => `"${r.split(/\s+/).slice(0, 6).join(" ")}…"`).join(", ")}. Do NOT begin this one like ANY of those — different first words, different shape. Openers that validate before saying anything ("That's real", "That's a real", "I hear you") wear out fastest; you have other ways in.`
      : null,
    "'I would always recommend' is yours, but used every turn it stops sounding like you and starts sounding like a template.",
    "Answer only the one thing the user actually asked. You have been given several examples so that you can pick the right one — not so that you can cover them all.",
    search
      ? [
          "FIRST PERSON, always. You are telling her what you found, not publishing it. Start with what YOU found or couldn't find — \"I could only find a couple of figures for Lagos\", \"I couldn't find much on fintech specifically\" — then give the numbers with their sources, then what to do with them.",
          "Never open with a bare fact like \"Data on X is thin\" or \"Those figures are for Y\". That is a report, not a coach.",
          "Three or four sentences. Two figures at most — she needs an anchor, not a table.",
        ].join(" ")
      : "Two or three sentences. Never a list. Never a rundown of the whole subject.",
    "HOW TO END. Usually end on a question — and usually a follow-on, one that moves things forward because her answer would genuinely change what you say next. That is the default and the best ending you have. Never ask one that presses her to disclose her own pay.",
    "Where a follow-on would be forced, a lighter check is better: 'Does that make sense?', 'How does that sit with you?', 'What do you think?'.",
    "And occasionally — where the answer is complete in itself and any question would only pad it — end on the advice and stop. That should be the exception, not a habit.",
    "Never ask a question you do not need the answer to. A reply that stops cleanly is better than one that reaches for a question to fill the ending.",
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
  situation: "",
  aims: "",
  lastRefinement: null,
  usedExamples: [],
  lastSelection: { near: [], wide: [] },
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
  if (state.situation) console.log(C.dim(`  where she is    ${state.situation}`));
  if (state.aims) console.log(C.dim(`  trying to do    ${state.aims}`));
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
      // Content filter, network, or a hard API failure. She sees a coach who
      // is still present, not a stack trace — and the diagnostic stays dim so
      // it is obvious to us and invisible in tone to her.
      console.log(C.dim(`  [azure error: ${err.message.slice(0, 120)}]`));
      console.log(`\n${C.wine("Botema")}`);
      console.log(wrap(COULD_NOT_ANSWER));
      console.log("");
      continue;
    }
    if (!placed) {
      console.log(C.dim("  [no classification after retry]"));
      console.log(`\n${C.wine("Botema")}`);
      console.log(wrap(COULD_NOT_ANSWER));
      console.log("");
      continue;
    }

    // The model can call the tool but drop a required field anyway (seen on
    // Getting Started's very first turn) — same failure shape as `!call`
    // above, just one layer deeper, and it used to crash the whole harness
    // with a TypeError on STAGES[undefined] instead of speaking. One retry,
    // then speak rather than throw, same as every other failure path here.
    if (placed.stage !== "leaving" && !STAGES[placed.stage]) {
      console.log(C.dim(`  [classification missing/invalid stage "${placed.stage}" — retrying once at double the token budget]`));
      // Same reasoning-model shape as the empty-content retry in callAzure():
      // a longer system prompt (more stages, more description text, per area)
      // means more hidden reasoning before the model can emit the tool call,
      // so the same 2000-token budget that worked for 3 stages started
      // dropping the required field more often at 4. Double it here rather
      // than raising the default for every call — most classifications don't
      // need it.
      const retried = DRY ? null : await classify(input, history, state.covered_stages, 4000).catch(() => null);
      if (retried && (retried.stage === "leaving" || STAGES[retried.stage])) {
        placed = retried;
      } else {
        console.log(C.dim("  [still no valid stage after retry]"));
        console.log(`\n${C.wine("Botema")}`);
        console.log(wrap(COULD_NOT_ANSWER));
        console.log("");
        continue;
      }
    }

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
    //
    // A location is only real if SHE SAID IT. Observed: a nurse moving into
    // health tech never mentioned a city, and the classifier returned
    // "unspecified" — which passed a blocklist of none/unknown/n\/a and
    // triggered three web searches for a place called "unspecified", ~90
    // seconds of waiting for nothing. Blocklisting the words the model happens
    // to invent is whack-a-mole; requiring the place to appear in her own
    // words is not. A city is a proper noun. If she never typed it, we do not
    // have it.
    const saidByUser = [...history.filter((m) => m.role === "user").map((m) => m.content), input]
      .join(" ")
      .toLowerCase();

    if (placed.role && !/^(none|unknown|n\/a|unspecified)$/i.test(placed.role)) state.role = placed.role;
    if (placed.location && mentionedByUser(placed.location, saidByUser)) state.location = placed.location;

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

    // Keep the note current before answering, so this turn already benefits
    // from whatever she just said. Never block the reply on it.
    if (placed.newInformation !== false) {
      try { await updateProfile(input, history); } catch { /* ignore */ }
    }

    // W-marked behaviour: only a question about what something PAYS reaches
    // the web, and only when we know both the role and the place. Without a
    // location the query is unanswerable and a search is worse than none.
    let search = null;
    // A refinement narrows an EXISTING market question; it does not turn a
    // tactical one into a market question. Observed: five turns of currency
    // advice, every one preceded by a ~30s search that returned no figure,
    // because any refinement satisfied the disjunction on its own.
    if (placed.needsMarketData && state.role && state.location) {
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
      reply = await wordalise(input, placed.stage, history, facets, search, state.usedExamples, history.filter((m) => m.role === "assistant").map((m) => m.content));
    } catch (err) {
      // Was still printing the raw error. A transient "fetch failed" left two
      // turns of a conversation with no reply at all, and nothing said so.
      console.log(C.dim(`  [azure error: ${err.message.slice(0, 120)}]`));
      console.log(`\n${C.wine("Botema")}`);
      console.log(wrap(COULD_NOT_ANSWER));
      console.log("");
      continue;
    }
    if (!reply) {
      console.log(C.dim("  [empty response after retry]"));
      console.log(`\n${C.wine("Botema")}`);
      console.log(wrap(COULD_NOT_ANSWER));
      console.log("");
      continue;
    }

    const { text: figureGuarded, stripped } = search ? { text: reply, stripped: false } : stripFigures(reply);
    if (stripped) console.log(C.amber("  [figure guard fired — a figure or source claim was removed]"));
    const guarded = stripInventedLocation(figureGuarded, saidByUser);
    if (guarded !== figureGuarded) console.log(C.amber("  [invented-location guard fired — an unstated place was removed]"));
    const priorReplies = history.filter((m) => m.role === "assistant").map((m) => m.content);
    const openerFixed = stripRepeatedOpener(guarded, priorReplies);
    if (openerFixed !== guarded) console.log(C.amber("  [repeated-opener guard fired — a reused opening clause was dropped]"));
    const deduped = dropRepeatedSentences(openerFixed, priorReplies);
    if (deduped !== openerFixed) console.log(C.amber("  [repeated advice removed]"));
    if (!deduped) {
      // The whole reply was advice she has already had. That is the stall
      // condition, not something to fill with more words.
      //
      // Confirmed live on the constrained-runway scenario: this branch logged
      // "entirely repetition" and incremented stallCount correctly, but the
      // line below still fell back to `openerFixed` — the untouched,
      // fully-repetitive text — so the exact SQL/Python rundown from the
      // previous turn got shown again verbatim anyway. Counting a stall while
      // still displaying the thing the stall exists to prevent defeated the
      // check. Falling through to the empty string here instead means the
      // "nothing survived the guards" branch further down does its job and
      // substitutes the area's fallback question.
      console.log(C.amber("  [reply was entirely repetition — treating as a stall]"));
      state.stallCount += 1;
      if (state.stallCount >= 2) { await closeArea("nothing new left to say — the stall rule"); break; }
    }
    const plausible = stripAdsOversell(stripImplausiblePeriods(stripImplausibleFigures(deduped)));
    if (plausible !== openerFixed) console.log(C.amber("  [implausible figure removed — outlier, mixed currency, or wrong period]"));
    let { text, capped } = capSentences(flattenInlineList(plausible), search ? 5 : 3);
    // Every reply must end on a question — it is how the coach leads. When the
    // model does not manage one, append the area's own rather than strand her.
    // No longer forces a question. An answer that ends on the advice is a
    // deliberate shape — about a quarter of the examples do it. The area's
    // fallback is kept for the one case that still needs rescuing: a reply
    // left empty after the guards have stripped it.
    if (!text || !text.trim()) {
      console.log(C.amber("  [nothing survived the guards — using the area's question]"));
      text = FALLBACK_QUESTION;
    }
    if (capped) console.log(C.amber("  [sentence cap fired — the model wrote a rundown]"));

    // Only the three closest count as "used". The random four were shown for
    // voice, not drawn on for advice, and marking them used would burn through
    // the area in two turns and start retiring facets she has never been told.
    const { near: chosen, wide } = state.lastSelection;
    for (const e of chosen) if (!state.usedExamples.includes(e.id)) state.usedExamples.push(e.id);
    const real = chosen.filter((e) => e.source === "OTEMA").length;
    console.log(C.dim(`  [drew on ${chosen.map((e) => e.id).join(", ")} — ${real} Otema, ${chosen.length - real} drafted]`));
    // The wide four go in the transcript too. Without them, a reply that drifts
    // to something she never asked about cannot be traced back to the example
    // that pulled it there — which is the one new way this selection can fail.
    if (wide.length) console.log(C.dim(`  [voice only: ${wide.map((e) => e.id).join(", ")}]`));
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
