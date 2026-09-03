// @ts-nocheck
// ============================================================================
// v4 area/stage model — coverage maps + facet selection, ported from the local
// test harness (scripts/coach-local.mjs, scripts/areas/*.mjs) into production.
//
// THE MODEL (unchanged from the harness)
// There is no deterministic path through an area. For every message inside an
// active area, one classification call decides which stage it belongs to, or
// whether the user is leaving. The stage decides which facets (Otema's real
// answers, plus Otema-approved AI-drafted gap-fillers) get shown to the model
// as grounding; the model writes a fresh reply from that material.
//
// So the facet graph is a COVERAGE MAP, not a router: it records what material
// each stage can draw on, never which answer to serve.
//
// SCOPE OF THIS PORT
// Salary & Negotiation and Getting Started only — the two areas with the
// fullest, most-verified test coverage. The other four designed areas
// (Confidence, Career Paths, Further Education, Mentorship) keep running
// through the older flat-topic path until they get the same treatment.
//
// Salary's live web-search behaviour (Phase 4 in the storyboard) is NOT
// ported here — that facet still answers ungrounded, guarded by
// NO_INVENTED_FIGURES, exactly as the deployed coach already does today.
// ============================================================================

import { BOTEMA_EXAMPLES } from "./botema-examples.ts";
import { approvedGeneratedFacets } from "./botema-generated-examples.ts";

// ── Area configs ─────────────────────────────────────────────────────────

export interface StageConfig {
  label: string;
  describes: string;
  facets: string[];
}

export interface AreaConfig {
  n: number;
  name: string;
  topic: string;
  realOrder: string[];
  stageSummary: Record<string, string>;
  fallbackQuestion: string;
  wrapUp: string | null;
  supersedes: Array<{ after: string; retire: string[] }>;
  stages: Record<string, StageConfig>;
}

// Ported verbatim from scripts/areas/salary.mjs, minus `marketData` — live web
// search is a later phase; this facet answers ungrounded for now, same as the
// deployed coach already does.
export const SALARY_AREA: AreaConfig = {
  n: 9,
  name: "Salary & Negotiation",
  realOrder: ["S1", "S2", "S3", "S4", "S5"],
  topic: "salary",
  wrapUp: null,
  stageSummary: {
    A: "what the role is worth",
    B: "the offer on the table",
    C: "the conversation with your employer",
  },
  fallbackQuestion: "What is the situation you are weighing up right now?",
  supersedes: [
    { after: "G8", retire: ["S4", "S4a", "S4b", "S4c", "G4", "G4a", "G4b", "G4c", "G4d"] },
  ],
  stages: {
    A: {
      label: "Before there's an offer",
      describes:
        "They are pricing themselves — working out what a role pays, or what they're worth coming from another field. No live negotiation, no employer at the table yet.",
      facets: ["S1", "G2", "G10", "G10a", "G5"],
    },
    B: {
      label: "An offer is on the table",
      describes:
        "They are negotiating with a PROSPECTIVE employer. A job offer exists, or one is being discussed — they do not work there yet. Anything about an offer, an equity package, a signing bonus, or what to say during hiring.",
      facets: ["S2", "S2a", "S3", "S3a", "S3b", "S5", "S5a", "G3", "G3a", "G6", "G7", "G7a", "G9", "G9a", "G5"],
    },
    C: {
      label: "Already in the job",
      describes:
        "They ALREADY WORK for the employer in question, so the money conversation is one they must start themselves. A rise asked for or refused, a manager who said no, a pay gap with a colleague, a counter-offer on resigning. If the words manager, my team, my job, my boss or a raise appear, this is almost always the stage — even if a negotiation is live. " +
        "Saying the money was not the only reason she was leaving is squarely THIS stage, not a departure from it: weighing a counter-offer against why she wanted to go is the decision itself. Do not read it as a confidence or wellbeing question.",
      facets: ["S4", "S4a", "S4b", "S4c", "G1", "G1a", "G1b", "G4", "G4a", "G4b", "G4c", "G4d", "G8", "G9", "G9a"],
    },
  },
};

// Ported verbatim from scripts/areas/getting-started.mjs.
export const GETTING_STARTED_AREA: AreaConfig = {
  n: 1,
  name: "Getting Started",
  realOrder: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
  topic: "getting_started",
  wrapUp: "E",
  stageSummary: {
    A: "which direction to go in",
    B: "how your background carries over",
    C: "how you're going to learn",
    D: "your first practical steps",
    E: "pulling together what you're going to do",
  },
  fallbackQuestion: "What feels like the right next step for you?",
  supersedes: [],
  stages: {
    A: {
      label: "Deciding whether, or which direction",
      describes:
        "NO real prior work experience in another field, and no direction settled: unsure tech is right for them, torn between fields, or curious what the work is like day-to-day. If they name a previous job or profession, that's stage B instead, even if they're also field-unsure — prior career is the distinguishing fact. Giveaway words: \"not sure\", \"which field\", \"torn between\", \"where do I begin\" — with no past career mentioned.",
      facets: ["S1", "S1a", "S7", "S7a", "S8", "S8a", "G3", "G3a", "G5"],
    },
    B: {
      label: "Translating a previous career",
      describes:
        "Real prior work experience in a DIFFERENT field, asking how it applies or whether it counts — a career change, not a first career decision. Giveaway words: \"transferable skills\", \"switching careers\", \"start at the bottom\". Field-uncertainty can co-occur and still counts as B, not A. But this tie-break is A-vs-B ONLY: once THIS message is clearly about method (C) or concrete execution (D), classify it there instead, even with a prior career mentioned earlier — a prior career is a fact about her, not a stage she's stuck in.",
      facets: ["S5", "S5a", "G4"],
    },
    C: {
      label: "Choosing how to learn",
      describes:
        "Field settled or not the live question — open decision is METHOD: self-teach vs. bootcamp vs. degree, or evaluating a programme, with no concrete detail about it asked yet. Applies regardless of a prior career (B) — a method question is C. Giveaway words: \"bootcamp\", \"degree\", \"self-taught\", \"programme\", \"course\". But this tie-break is C-vs-D ONLY: the MOMENT a method is named (in this message or an earlier one) AND the live question asks a concrete detail about it — how long it takes, what it costs, what to actually do — that's stage D instead, even within the same message that names the method. \"A self-paced bootcamp sounds right, how long would that realistically take\" is D, not C: a method was just named and the live question is D's own giveaway (\"how long\", \"realistically\").",
      facets: ["S2", "S2a", "S2b", "G1", "G1a"],
    },
    D: {
      label: "Actively executing a chosen plan",
      describes:
        "Method decided — wants concrete specifics: a language, free resources, a realistic timeline, savings needed. A THING to use, not a decision. Applies regardless of a prior career (B) — \"how long will this take\" is D, not B. This is also the read the MOMENT a method named earlier in C is followed by a concrete-detail question — the method doesn't need to be re-litigated, only the detail answered. Giveaway words: \"which language\", \"resources\", \"how long\", \"realistically\", \"should I save\" — especially right after a method has just been named.",
      facets: ["S3", "S4", "S4a", "S4b", "S6", "S6a", "G2", "G6"],
    },
    E: {
      label: "Wrapping up",
      describes:
        "The advice has landed and she is settling rather than asking. She agrees with it, thanks you for it, says she will try it, says it makes sense, or answers a closing check with a yes. Giveaway words: \"that makes sense\", \"okay, I'll try that\", \"thank you\", \"that helps\", \"yeah, I think so\", \"no, that's it\". Do NOT choose this because a message is short or vague — only because she is agreeing or closing. If she raises anything new, however small, or asks another question, she is back in A, B, C or D and this is not the stage. The reply itself MUST name at least one concrete element of the plan actually settled on in this conversation — the method, the language, the timeline, the resource — not just an approving generality like \"you've got something to work with.\" If nothing concrete was ever settled, say so honestly rather than inventing a plan to reflect back.",
      facets: [
        "S1", "S1a", "S7", "S7a", "S8", "S8a", "G3", "G3a", "G5",
        "S5", "S5a", "G4",
        "S2", "S2a", "S2b", "G1", "G1a",
        "S3", "S4", "S4a", "S4b", "S6", "S6a", "G2", "G6",
      ],
    },
  },
};

// One WORDALISE function per built area — see AREA_TOPIC_TO_FUNCTION_NAME
// below, used by UpdateCareerTopic to decide where to chain, and by index.ts
// to call the right one directly when an area is already open.
export const AREAS: Record<string, AreaConfig> = {
  salary: SALARY_AREA,
  getting_started: GETTING_STARTED_AREA,
};

export const AREA_TOPIC_TO_FUNCTION_NAME: Record<string, string> = {
  salary: "discussSalaryArea",
  getting_started: "discussGettingStartedArea",
};

export const WRAP_UP_LINE =
  "I think we've got something you can actually work with there. Is there anything else on your mind?";

// All ten areas, for the classifier's leaveTo field and the leaving-response
// copy. A user can leave for anywhere, not just the areas that happen to be
// built — an earlier version of this only listed the built areas' own exits,
// which sent a mentorship question nowhere sensible.
export const ALL_AREAS: Record<string, string> = {
  "1": "Getting Started",
  "2": "Further Education",
  "3": "Career Paths & Roadmaps",
  "4": "Mentorship",
  "5": "Wellbeing & Balance",
  "6": "Confidence & Imposter Syndrome",
  "7": "Job Search & Applications",
  "8": "Interview Preparation",
  "9": "Salary & Negotiation",
  "10": "AI & the Future of Tech Work",
};

export function otherAreas(areaN: number): Record<string, string> {
  return Object.fromEntries(Object.entries(ALL_AREAS).filter(([n]) => Number(n) !== areaN));
}

// ── Leave / done detection (layer 2 + 2a) ───────────────────────────────────
// Ported verbatim from scripts/coach-local.mjs. Deliberately deterministic and
// runs ahead of any model call — see index.ts, which checks these before
// deciding whether to route through the area machinery at all.

export const LEAVE_PHRASES = new RegExp(
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

export const NOT_LEAVING = /\b(?:move on to the next|moving on to the next|move on without|they (?:just )?move on|worried|scared|afraid|nervous|don'?t want to (?:seem|look|be seen))\b/i;

export const DONE_PHRASES =
  /^(?:(?:no|nope|yeah|yes|ok|okay)[,.!\s]*)?(?:(?:i|I)\s+(?:think|guess|reckon)[,.!\s]*)?(?:that'?s|thats)\s+(?:everything|it|all|the lot)\b|^(?:no|nope|nothing)[,.!\s]*(?:else|more|thanks?|thank you)?\s*$|\bnothing else\b|\bthat'?s all (?:for now|thanks|thank you)\b|^(?:i'?m|im)\s+(?:good|all set|fine)\b|^thanks?[,.!\s]*(?:that'?s|thats)?\s*(?:everything|it|all)?\s*$|^thank you[,.!\s]*(?:that'?s|thats)?\s*(?:everything|it|all)?\s*$/i;

export function saysDone(text: string): boolean {
  return DONE_PHRASES.test(text.trim());
}

export function saysLeaving(text: string): boolean {
  if (NOT_LEAVING.test(text)) return false;
  return LEAVE_PHRASES.test(text);
}

export const COULD_NOT_ANSWER =
  "Sorry — that one did not come through properly on my end. Could you say it again, or put it a different way?";

// ── Facets: Otema's real answers (by topic, in realOrder) + Otema-approved
// drafted gap-fillers (by facet ID) ─────────────────────────────────────────

export interface Facet {
  id: string;
  question: string;
  answer: string;
  source: "OTEMA" | "DRAFTED";
  respondsTo?: string;
}

export function buildFacets(area: AreaConfig): Record<string, Facet> {
  const f: Record<string, Facet> = {};
  const real = (BOTEMA_EXAMPLES.adviseOnCareerTopic || []).filter((ex) => ex.topic === area.topic);
  real.forEach((ex, i) => {
    const id = area.realOrder[i];
    if (id) f[id] = { id, question: ex.question, answer: ex.answer, source: "OTEMA" };
  });
  // Review-gated — see botema-generated-examples.ts. Returns nothing until
  // Otema has approved an entry for this area, which is the correct default.
  for (const d of approvedGeneratedFacets(area.n)) {
    f[d.id] = { id: d.id, question: d.question, answer: d.answer, source: "DRAFTED", respondsTo: d.respondsTo };
  }
  return f;
}

// ── Facet selection ──────────────────────────────────────────────────────
// Ported verbatim from scripts/coach-local.mjs.

const STOP = new Set(["what", "when", "should", "would", "there", "their", "about", "this", "that", "with", "from", "have", "they", "them", "your", "just", "been", "much", "more", "than"]);

export function queryWords(message: string): Set<string> {
  return new Set(
    message.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

export function overlapScore(e: Facet, words: Set<string>): number {
  const hay = `${e.question} ${e.answer}`.toLowerCase();
  let n = 0;
  for (const w of words) if (hay.includes(w)) n += 1;
  return n;
}

// The same count, divided by the square root of how long the facet is, so a
// long drafted answer doesn't win on size alone against a short real one.
function fitScore(e: Facet, words: Set<string>): number {
  const length = `${e.question} ${e.answer}`.split(/\s+/).length;
  return overlapScore(e, words) / Math.sqrt(length);
}

export function matchStrength(pool: Facet[], message: string): number {
  const words = queryWords(message);
  if (!words.size || !pool.length) return 0;
  return Math.max(...pool.map((e) => overlapScore(e, words)));
}

// Facets the conversation has moved past — removed from the pool outright
// rather than down-weighted, per the area's `supersedes` rules.
function retiredBy(area: AreaConfig, used: string[]): Set<string> {
  const gone = new Set<string>();
  for (const rule of area.supersedes) {
    if (used.includes(rule.after)) for (const f of rule.retire) gone.add(f);
  }
  return gone;
}

// Deterministic stand-in for Math.random, seeded from the query text, so two
// runs of the same conversation pick the same "random" four.
function seeded(text: string): () => number {
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

const USED_PENALTY = 0.35;

// Reads the whole conversation, not just the latest message — the latest
// message still dominates, but an established situation from a turn earlier
// tips the balance (e.g. "I've already been offered a raise" should keep
// out how-to-ask-for-a-raise material once that's been established).
export function conversationQuery(message: string, history: Array<{ role: string; content: string }>): string {
  const earlier = history
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content)
    .join(" ");
  return `${message} ${message} ${earlier}`;
}

// Seven examples: the three closest, then four drawn at random from the rest
// of the stage's facet pool — voice range, not advice, so they're labelled
// separately in the prompt.
export function mostRelevant(
  area: AreaConfig,
  pool: Facet[],
  message: string,
  closest = 3,
  used: string[] = [],
  random = 4,
): { near: Facet[]; wide: Facet[] } {
  const retired = retiredBy(area, used);
  if (retired.size) pool = pool.filter((e) => !retired.has(e.id));
  const words = queryWords(message);
  const total = closest + random;
  if (!words.size) return { near: pool.slice(0, total), wide: [] };

  const scored = pool
    .map((e) => ({ e, score: fitScore(e, words) - (used.includes(e.id) ? USED_PENALTY : 0) }))
    .sort((a, b) => b.score - a.score);

  const near = scored.slice(0, closest).map((s) => s.e);

  const rest = scored.map((s) => s.e).filter((e) => !near.includes(e));
  const rand = seeded(message);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { near, wide: rest.slice(0, random) };
}
