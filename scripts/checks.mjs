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
  // Two network failures in a row produce the identical COULD_NOT_ANSWER line
  // twice — a real fixed string matching itself, not the coach repeating
  // itself. noRepeatedOpeners already excludes it; this one didn't, and a
  // run that hit consecutive fetch failures scored 100% overlap and failed a
  // scenario that never actually generated two replies to compare.
  const replies = replyOf(out).split("\n\n").filter(Boolean).filter((r) => !FALLBACK_LINE.test(r));
  const words = (r) => new Set(r.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 4));
  let worst = 0;
  for (let i = 1; i < replies.length; i++) {
    const a = words(replies[i - 1]), b = words(replies[i]);
    // A reply this thin is usually one the runtime's own repeat-guard has
    // already stripped down to a single validating line — "That pattern is
    // real—and it's not your fault." has exactly two words over 4 letters,
    // and sharing just one of them with a much longer previous reply (the
    // conversation is still on the same subject, which is normal) pushes the
    // ratio to 0.5 on a sample of 2. Below this size the ratio is noise, not
    // evidence — mirrors the size gate dropRepeatedSentences() already uses
    // for the same reason, one level down at the sentence level.
    if (b.size < 3) continue;
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
// The could-not-answer line is a fixed system message, not generated content.
// Two network failures in a run produced it twice and tripped this check.
const FALLBACK_LINE = /that one did not come through properly/i;

export function noRepeatedOpeners(out) {
  const openers = replyOf(out).split("\n\n").filter(Boolean).filter((r) => !FALLBACK_LINE.test(r))
    .map((r) => r.trim().toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 4).join(" "));
  return new Set(openers).size === openers.length;
}

// Most replies should end on a question, but not all of them. Roughly a
// quarter of the examples deliberately end on the advice instead — asking
// something you do not need the answer to is padding, and it reads as a tic.
// This now checks the coach still leads MOST of the time rather than always.
export function everyReplyAsks(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  if (!replies.length) return false;
  const asking = replies.filter((r) => r.trim().endsWith("?")).length;
  return asking / replies.length >= 0.5;
}

// Opener SHAPE, not opener words.
//
// noRepeatedOpeners() compares the first four words and passes anything that
// swaps one of them. The confidence sweep of 28 Aug walked straight through
// it: "That disbelief is real and", "That belief is real and", "That pattern
// is real and", "That feeling is real and" — four different four-word openers
// and plainly one opener, used 14 times across 22 replies and twice word for
// word in different conversations.
//
// So: replace the swappable word with a wildcard and compare what is left.
// Everything that carries the construction stays — pronouns, auxiliaries, and
// the validating adjectives the tic is built from — and the noun in the middle
// becomes "*". All four of the above collapse to "that * is real and".
const OPENER_FRAME = new Set([
  "a", "an", "the", "and", "but", "so", "not", "no", "it", "its", "this", "that", "these", "those",
  "i", "you", "your", "we", "our", "she", "her", "they", "them",
  "is", "are", "was", "were", "be", "been", "do", "does", "did", "have", "has", "had",
  "would", "will", "can", "could", "should", "in", "of", "to", "for", "on", "at", "with",
  "real", "common", "normal", "fair", "valid", "true", "right", "hard", "tough", "understandable",
]);

export function openerShape(reply) {
  return reply.trim().toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/).filter(Boolean).slice(0, 5)
    .map((w) => (OPENER_FRAME.has(w) ? w : "*"))
    .join(" ");
}

export function noRepeatedOpenerShape(out) {
  const shapes = replyOf(out).split("\n\n").filter(Boolean).filter((r) => !FALLBACK_LINE.test(r))
    .map(openerShape).filter((sh) => sh.replace(/[* ]/g, "").length > 0);
  return new Set(shapes).size === shapes.length;
}

// "That [noun] is real" is one legitimate way in, not the coach's only one.
// The area generation prompt allows it once per conversation; this counts it.
const VALIDATING_OPENER = /^\s*(?:that|this|it)\b[^.!?]{0,40}?\b(?:is|are|'s|s)\s+(?:a\s+)?(?:real|very real|completely normal|normal|common|understandable|valid)\b/i;

// Exported as a predicate too, so coach-local.mjs's opener guard can strip a
// second one at generation time using the identical definition the check uses
// to fail the run. Shape-matching alone does not catch the whole family:
// "That not-ready voice is real, but" has a different shape from "That feeling
// is real and" and is plainly the same move.
export function isValidatingOpener(sentence) {
  return VALIDATING_OPENER.test(sentence || "");
}

export function validatingOpeners(out) {
  return replyOf(out).split("\n\n").filter(Boolean).filter((r) => VALIDATING_OPENER.test(r)).length;
}

// How many questions the coach stacks into one reply.
//
// Counting question marks is not enough, and the confidence sweep is why: the
// pushiest endings in it are a single "?" with two questions welded together —
// "When is the deadline, and what are the two strongest achievements you'd
// anchor your case on?", "Which project would you highlight first in an impact
// note, and how would you frame it to show both capability and growth?". One
// question mark, two things she has to go away and produce. So count the
// interrogative clauses, not the punctuation: each "?" is one, and each
// "and/or <wh-word or auxiliary>" joined inside a question sentence is another.
const SECOND_CLAUSE = /,?\s+(?:and|or)\s+(?:what|how|which|who|when|where|why|whose|would|will|do|does|did|can|could|is|are|have|has|should)\b/gi;

// Quoted material is stripped first. A script the coach hands her to use —
// 'say "Could we agree an intervention if it happens again?"' — carries a
// question mark that is not the coach asking her anything, and counting it
// failed a reply that then went on to end with a single light check, which is
// exactly the shape we are asking for.
const QUOTED = /[\u201c"][^\u201d"]{0,300}[\u201d"]/g;

export function maxQuestionsPerReply(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean).filter((r) => !FALLBACK_LINE.test(r));
  if (!replies.length) return 0;
  const count = (r) => (r.replace(QUOTED, " ").match(/[^.!?]*\?/g) || [])
    .reduce((n, q) => n + 1 + (q.match(SECOND_CLAUSE) || []).length, 0);
  return Math.max(...replies.map(count));
}

// Endings she can answer with a yes or a no, rather than ones that requisition
// more information from her. The area generation prompt makes these the
// ordinary ending; this is the check that they actually appear.
const LIGHT_CHECK =
  /\b(?:does|do|is|are|would|will|can|could|has|have|did|shall|should|any)\b[^.!?]{0,70}\?\s*$/i;
// Was a fixed phrase list -- "Does that approach feel actionable for you in
// that room?" failed because "actionable" wasn't one of the listed
// adjectives, even though the sentence is exactly the shape this check
// exists to find. Same bug a second time: "How does that sound for a plan
// you can try this week?" failed because "for" isn't "right/good/ok/okay".
// "feel \w+" and "sound(?:s)? \w+" generalise both families instead of
// enumerating adjectives one at a time; the specific phrases stay for the
// checks that aren't a bare "feel X" / "sound X".
const LIGHT_CHECK_WORDS =
  /\b(?:make sense|makes sense|sound(?:s)? \w+|sit with you|feel \w+|work for you|what do you think|the bit you'?re stuck on|anything else|got a plan|covered that|helpful)\b/i;

export function lightChecks(out) {
  return replyOf(out).split("\n\n").filter(Boolean)
    .filter((r) => !FALLBACK_LINE.test(r))
    .filter((r) => LIGHT_CHECK.test(r) && LIGHT_CHECK_WORDS.test(r)).length;
}

// The final reply on its own. Wrap-up assertions are about the LAST thing the
// coach says, and replyOf() joins every reply into one string, so a check
// written against it passes on evidence from turn 1.
export function lastReply(out) {
  const replies = replyOf(out).split("\n\n").filter(Boolean);
  return replies.length ? replies[replies.length - 1] : "";
}

export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
