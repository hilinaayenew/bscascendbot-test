// ============================================================================
// Shared checks for scenario transcripts.
//
// These live here, not in coach-scenarios.mjs, because the per-area scenario
// files call them from inside their `checks` arrays. When the scenarios were
// split out into scripts/scenarios/, these stayed in the runner's module scope
// and every check threw ReferenceError — which the runner's catch swallowed and
// recorded as a silent FAIL. The results matrix read "0 of 5 passed" and
// carried no information at all.
//
// Any new area's scenario file should import from here.
// ============================================================================

// Substance repetition: how much of a reply is words it already used in the
// previous one. Openers were the visible symptom; this catches restating the
// same advice in fresh words, which is the actual failure.
export function maxRepeatOverlap(out) {
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

// Jargon density.
//
// The list needs extending whenever a new family of jargon shows up: the
// monitor scored a reply containing "a clearly written FX hedge", "a quarterly
// true-up to the USD/EUR rate" and "a floor/ceiling" at ZERO, because none of
// those were in it. A blind monitor is worse than none — it reports success.
//
// Originally observed: "a milestone-based cash bonus, an equity refresh
// or larger option grant with a clear vesting schedule, and a currency
// protection clause or USD pegging" — five pieces of Silicon Valley vocabulary
// in two sentences. Monitored rather than rewritten: the fix belongs in the
// prompt, but nobody would notice the drift without a number on it.
const JARGON = /\b(equity refresh|option grant|vesting schedule|cliff|term sheet|cap table|post-money|pre-money|liquidity event|acceleration|RSUs?|exercise price|strike price|pegging|stipend|milestone-based|comp band|total comp|OTE|equity component|dilution|tranche|FX hedge|hedging|true-?up|floor\/ceiling|cost-of-living adjustment|COLA|indexation|escrow|clawback|accrual|gross-?up|in-kind|variable comp|on-target earnings)\b/gi;

export function jargonPerReply(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  if (!replies.length) return 0;
  return Math.max(...replies.map((r) => (r.match(JARGON) || []).length));
}

// True when no two replies open the same way. Compares the first FOUR words
// with punctuation stripped: at six words and punctuation intact, "You're not
// imagining it—pay offers" and "You're not imagining it—ads often" read as
// different openers when they are plainly the same one.
export function noRepeatedOpeners(out) {
  const openers = replyOf(out).split("\n\n").filter(Boolean)
    .map((r) => r.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 4).join(" "));
  return new Set(openers).size === openers.length;
}

// True when every reply in the run ends on a question — the coach is supposed
// to lead, so a reply that just stops is a failure however good the advice is.
export function everyReplyAsks(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  return replies.length > 0 && replies.every((r) => r.trim().endsWith("?"));
}

// The coach's replies only. Extracted by block — everything between a "Botema"
// line and the next user prompt — rather than by filtering line prefixes, which
// silently ate wrapped reply lines that happened to begin with "you".
export function replyOf(out) {
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

// Questions that press her to disclose her own pay.
//
// Otema's S3 coaches her to refuse exactly this — "turn it around and ask what
// range they've set aside, that tells you more than giving your own number
// first" — so a coach that then extracts the same figure has not understood
// its own advice. Observed: "What range are you prepared to anchor on?" twice
// in one conversation, plus asking her for the employer's budgeted range.
const EXTRACTIVE_Q =
  /\b(?:what|how much|share|tell me|could you)\b[^?]{0,90}?\b(?:your (?:current )?(?:salary|pay|rate|range|number|figure)|you (?:currently )?(?:earn|make|are on)|prepared to (?:accept|anchor)|payslip|pay slip|screenshot|budgeted range)\b[^?]{0,50}\?/i;

export function extractiveQuestions(out) {
  const qs = replyOf(out).match(/[^.!?]*\?/g) || [];
  return qs.filter((q) => EXTRACTIVE_Q.test(q)).map((q) => q.trim());
}
