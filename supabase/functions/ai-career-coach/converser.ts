// @ts-nocheck
// Vivid Insights Converser Framework — TypeScript/Deno port
// Mirrors the Python architecture in vivid-insights-main/framework/converser.py

export enum FunctionType {
  CHANGE_CONTEXT = "change_context",
  WORDALISE = "wordalise",
  INSTRUCTIONS = "instructions",
  ENGAGE = "engage",
}

// Appends a parseable marker the frontend uses to render clickable option
// buttons under a message, without needing a DB schema change — it's just
// plain text in the same `messages.content` column. Fixed option sets only
// (no extra AI call to generate them), so these responses stay instant.
export const CHOICES_MARKER = "%%CHOICES%%";

export function withChoices(text: string, choices: string[]): string {
  return choices.length ? `${text}\n${CHOICES_MARKER}${JSON.stringify(choices)}` : text;
}

// A WORDALISE function sometimes only realizes mid-answer that the request
// was still too broad to answer in one direction (e.g. it would need to
// write "which track are you most drawn to" before it can recommend
// anything specific). Rather than a second AI call to re-route, it signals
// this in its own output using this fixed, code-parseable format instead of
// writing the hedged multi-direction answer — resolveNarrowOrAnswer() turns
// that into the same tappable-button format inviteUserContext uses, or
// passes the text through unchanged if the model just answered normally.
export const NARROW_SELF_CHECK = `Self-check before you answer — read this carefully: if your answer would name more than one distinct direction/track/option side by side (e.g. "for web development, do A; for data, do B; for IT, do C"), that is ALWAYS wrong — even if you also end with a clarifying question. Listing every track "to be safe" instead of asking which one FIRST is exactly the mistake to avoid; ending with a question does not excuse it. The moment you notice yourself about to name a second distinct track/option in the same answer, stop — do not send that answer. Output ONLY these two lines instead, exactly, and nothing else:
NARROW_QUESTION: <a short question tailored to what they asked>
NARROW_OPTIONS: <option 1> | <option 2> | <option 3>
(3-5 short options tailored to their message, each under 6 words, separated by " | ")`;

const NARROW_OUTPUT_PATTERN = /^\s*NARROW_QUESTION:\s*(.+?)\s*\n+\s*NARROW_OPTIONS:\s*(.+?)\s*$/is;

// Fallback safety net for when the model hedges across multiple tracks
// anyway, without self-reporting via NARROW_QUESTION/NARROW_OPTIONS above
// (observed repeatedly in practice — the instruction alone isn't fully
// reliable). This checks the model's OWN generated answer for a generic
// structural tell — a comma-separated list of 3+ short items ending in
// "or <item>" (e.g. "web, data, or IT?", "CV, networking, or interview
// prep?") — not a guess at the user's intent from their input wording.
// Deliberately requires 2+ comma-joined items before the "or" so it doesn't
// fire on ordinary two-item questions ("time or money?"), which are a
// normal, legitimate way to end an already-focused answer.
const ENUMERATED_LIST_PATTERN = /\b([A-Za-z][A-Za-z0-9&/]*(?:\s[A-Za-z][A-Za-z0-9&/]*){0,2}(?:,\s*[A-Za-z][A-Za-z0-9&/]*(?:\s[A-Za-z][A-Za-z0-9&/]*){0,2})+,?\s+or\s+[A-Za-z][A-Za-z0-9&/]*(?:\s[A-Za-z][A-Za-z0-9&/]*){0,2})\b/;

function extractEnumeratedOptions(text: string): string[] | null {
  const match = text.match(ENUMERATED_LIST_PATTERN);
  if (!match) return null;
  // Normalize the trailing ", or X" / " or X" into a plain ", X" first — a
  // combined split on /,|\bor\b/ would let the comma-branch greedily eat the
  // space before "or", fusing it onto the next word ("or interview prep").
  const normalized = match[1].replace(/,?\s+or\s+/i, ", ");
  const options = normalized
    .split(/,\s*/)
    .map((o) => o.trim())
    .filter((o) => o.length > 0 && o.length <= 40)
    .map((o) => o.charAt(0).toUpperCase() + o.slice(1));
  const unique = [...new Set(options)];
  return unique.length >= 2 ? unique.slice(0, 5) : null;
}

// A different failure mode from hedging across tracks: the model stays on
// one topic but writes it up as a multi-section rundown (e.g. "Foundations
// to learn... / Beginner-friendly labs... / Security basics... / Tools...
// / Certifications... / Free resources...") instead of a short answer, even
// though it was told to. Rather than trust that instruction alone (it
// repeatedly hasn't held), this keeps only the opening answer and the
// closing question — a paragraph-count cap, not a content judgment.
//
// One thing this must NOT do: drop a structured deliverable the user
// actually asked for (a rewritten CV, a checklist) just because it's
// long enough to land in its own paragraph. Observed in practice — a CV
// rewrite came back as intro / [blank line] / the rewritten bullets /
// [blank line] / closing question, and blindly keeping only first+last
// silently deleted the rewrite itself. A paragraph containing a bullet
// or numbered list item is a deliverable, not filler prose, and survives
// the cap even when it falls in the "middle".
const LIST_LIKE_PARAGRAPH = /^\s*([-•*]|\d+[.)])\s/m;

function capParagraphs(text: string, max = 2): string {
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= max) return text;
  const first = paragraphs[0];
  const last = paragraphs[paragraphs.length - 1];
  const keptMiddle = paragraphs.slice(1, -1).filter((p) => LIST_LIKE_PARAGRAPH.test(p));
  return [first, ...keptMiddle, last].join("\n\n");
}

/**
 * Flattens a list the model wrote inline, mid-paragraph.
 *
 * Observed against a grounded salary answer: "Glassdoor lists: - Mid-level
 * backend developer in Lagos: NGN 298,578 per month (Glassdoor, 2024). -
 * Backend developer in Lagos: total pay about NGN 257,167 per month." Told
 * repeatedly not to write lists, the model complied with the letter — no line
 * breaks — and produced a list anyway. Instructions have lost this argument
 * three times now (ISSUE-005, ISSUE-006, and here), so it is handled in code.
 *
 * Only touches inline dashes acting as bullets: a hyphen preceded by a space
 * and followed by a capital or digit. Real em-dash asides and hyphenated
 * words are left alone, and a genuine multi-line list is capParagraphs'
 * business, not this function's.
 */
export function flattenInlineList(text: string): string {
  if (/\n/.test(text)) return text;
  const bullets = text.match(/\s-\s(?=[A-Z0-9])/g);
  if (!bullets || bullets.length < 2) return text;

  // Turn each bullet into a sentence boundary, then let capSentences decide
  // how many survive — the point is that she gets an anchor, not a table.
  return text
    .replace(/:\s-\s(?=[A-Z0-9])/g, ". ")
    .replace(/\s-\s(?=[A-Z0-9])/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Removes a pay figure that cannot be true for the person asking.
 *
 * Observed against a grounded answer for a Lagos developer considering remote
 * European work: "around NGN 1,927,160 per year (Glassdoor, 2026) … higher
 * anchors like USD 200,000 per year (Crossover, 2026)". Crossover advertises
 * headline rates as a recruitment hook; nobody in that market is being paid it,
 * and a European developer might be on €60,000. Presented side by side as
 * "anchors", it invites someone to walk into a negotiation with an expectation
 * that will damage them.
 *
 * Two rules, both deliberately blunt:
 *   • mixed currencies — keep the one that appears first (hers), drop the rest,
 *     because two currencies without a conversion rate are not comparable and
 *     the model has no rate
 *   • within one currency, a figure more than 5× the smallest is an outlier
 *
 * Sentences carrying a rejected figure are dropped whole, as with
 * stripUnsourcedFigures. Losing a sentence is much cheaper than the number.
 */
const MONEY = /(?:\b(?:NGN|KES|KSh|ZAR|GHS|UGX|TZS|RWF|USD|GBP|EUR)\b|[$£€₦])\s?([\d][\d,.]*)\s*(k|m|million)?/gi;

export function stripImplausibleFigures(text: string): string {
  const found: Array<{ currency: string; value: number; sentence: number }> = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  sentences.forEach((sentence, i) => {
    for (const m of sentence.matchAll(MONEY)) {
      const currency = (m[0].match(/[A-Z]{3}|[$£€₦]/i) || [""])[0].toUpperCase();
      let value = parseFloat(m[1].replace(/,/g, ""));
      if (/^k$/i.test(m[2] || "")) value *= 1_000;
      if (/^(m|million)$/i.test(m[2] || "")) value *= 1_000_000;
      if (Number.isFinite(value)) found.push({ currency, value, sentence: i });
    }
  });
  if (found.length < 2) return text;

  const primary = found[0].currency;
  const sameCurrency = found.filter((f) => f.currency === primary);
  const smallest = Math.min(...sameCurrency.map((f) => f.value));

  const drop = new Set<number>();
  for (const f of found) {
    if (f.currency !== primary) drop.add(f.sentence);
    else if (f.value > smallest * 5) drop.add(f.sentence);
  }
  if (!drop.size) return text;

  const kept = sentences.filter((s, i) => !drop.has(i) || s.trim().endsWith("?"));
  const substantive = kept.filter((s) => !s.trim().endsWith("?"));
  return substantive.length ? kept.join(" ").trim() : NO_RELIABLE_PAY_DATA;
}

/**
 * Rejects a pay figure whose stated period cannot be right.
 *
 * Observed twice: "NGN 299,513 per year" and "NGN 316,667 per year" for Lagos
 * backend roles. Those are the *monthly* Glassdoor figures — as annual salaries
 * they come to roughly €190 a year. The summarise call was told in plain terms
 * to copy the period exactly and never convert; it converted anyway. Fourth
 * time an instruction has lost, so it moves into code (ISSUE-023).
 *
 * The test is deliberately crude: a floor below which an annual professional
 * salary simply isn't credible in that currency. Set low on purpose — the aim
 * is to catch a figure off by a factor of twelve, not to adjudicate whether a
 * salary is good. A real annual figure will clear these easily.
 *
 * Detection only. It never rewrites the period to what it guesses was meant,
 * because that would be asserting a number nobody verified.
 */
const ANNUAL_FLOOR: Record<string, number> = {
  NGN: 1_200_000, KES: 300_000, GHS: 30_000, ZAR: 100_000, UGX: 5_000_000,
  TZS: 3_000_000, RWF: 1_500_000, ZMW: 30_000, ETB: 100_000, XOF: 1_000_000,
  XAF: 1_000_000, USD: 5_000, EUR: 5_000, GBP: 5_000,
  "$": 5_000, "£": 5_000, "€": 5_000, "₦": 1_200_000,
};

const ANNUAL_CLAIM =
  /(?:\b(NGN|KES|KSh|ZAR|GHS|UGX|TZS|RWF|XOF|XAF|ZMW|ETB|USD|GBP|EUR)\b|([$£€₦]))\s?([\d][\d,.]*)\s*(k|m|million)?[^.!?]{0,24}?\b(?:(?:per|a|\/)\s*(?:year|annum|yr)|annually)\b/gi;

export function stripImplausiblePeriods(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const drop = new Set<number>();

  sentences.forEach((sentence, i) => {
    for (const m of sentence.matchAll(ANNUAL_CLAIM)) {
      const currency = (m[1] || m[2] || "").toUpperCase().replace("KSH", "KES");
      let value = parseFloat((m[3] || "").replace(/,/g, ""));
      const scale = (m[4] || "").toLowerCase();
      if (scale === "k") value *= 1_000;
      if (scale === "m" || scale === "million") value *= 1_000_000;

      const floor = ANNUAL_FLOOR[currency];
      if (floor && Number.isFinite(value) && value < floor) drop.add(i);
    }
  });
  if (!drop.size) return text;

  const kept = sentences.filter((s, i) => !drop.has(i) || s.trim().endsWith("?"));
  const substantive = kept.filter((s) => !s.trim().endsWith("?"));
  return substantive.length ? kept.join(" ").trim() : NO_RELIABLE_PAY_DATA;
}

/**
 * Drops a sentence that repeats one the coach already said this conversation.
 *
 * Observed across four of five test conversations: the same three-item
 * checklist — a fixed review date, explicit targets, confirmation in writing —
 * issued on four consecutive turns, including on a turn where she admitted a
 * fear rather than asking anything. Another conversation re-asked for a
 * breakdown of base, equity and bonus on four turns running.
 *
 * The instruction ("do NOT repeat advice you have already given — she heard
 * it") has now lost this argument repeatedly, so it moves into code. Seventh
 * time a prompt rule has had to become a check.
 *
 * Compares content words only, so a rephrasing of the same advice is caught
 * where an exact-string match would miss it. The closing question is always
 * kept: questions legitimately recur, and dropping one strands the turn.
 */
export function dropRepeatedSentences(text: string, previousReplies: string[], threshold = 0.45): string {
  if (!previousReplies.length) return text;

  const contentWords = (s: string) =>
    new Set(
      s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w.length > 4),
    );

  const seen = previousReplies.flatMap((r) => splitSentences(r)).map(contentWords);
  const repeats = (s: string) => {
    const words = contentWords(s);
    if (words.size < 4) return false;
    return seen.some((before) => {
      if (!before.size) return false;
      let shared = 0;
      words.forEach((w) => { if (before.has(w)) shared++; });
      return shared / words.size >= threshold;
    });
  };

  const kept: string[] = [];
  for (const sentence of splitSentences(text)) {
    if (!sentence.trim().endsWith("?")) {
      if (!repeats(sentence)) kept.push(sentence);
      continue;
    }

    // Ends in a question — but that does not make the whole thing a question.
    // splitSentences merges quoted material with what follows, so a repeated
    // script and the closing question arrive as ONE sentence, and blanket-
    // exempting anything ending in "?" let a near-verbatim script through
    // twice. Split the trailing question off and judge the rest on its merits.
    const lastBreak = sentence.search(/[.!”"]\s+[^.!?]*\?$/);
    if (lastBreak === -1) { kept.push(sentence); continue; }

    const body = sentence.slice(0, lastBreak + 1).trim();
    const question = sentence.slice(lastBreak + 1).trim();
    if (!repeats(body)) kept.push(sentence);
    else if (question) kept.push(question);
  }

  // If everything was a repeat, the turn genuinely had nothing new in it —
  // which is the stall condition, not something to paper over with filler.
  return kept.length ? kept.join(" ").trim() : "";
}

/**
 * Removes the claim that job adverts overstate what a role pays.
 *
 * Seen twice now, in different words: "ads often oversell what the company
 * will actually pay" and "ads often show higher ranges than the actual offer".
 * It is the employer's own argument for the low offer, handed to her at the
 * moment she is deciding what to counter with — and it contradicts both
 * KNOWLEDGE_BASE.salary ("local job ads that publish ranges are useful too")
 * and Otema's S1 ("job boards give you a rough range").
 *
 * Rewriting the G3a draft to rule it out did not stop it, so it moves to code.
 */
const ADS_OVERSELL =
  /\b(?:ads?|adverts?|advertisements?|listings?|job (?:ads?|posts?|postings?))\b[^.!?]{0,60}?\b(?:oversell|overstate|inflate[d]?|exaggerat\w+|higher than|show higher|more than (?:what|the company))\b|\b(?:oversell|overstate|inflated)\b[^.!?]{0,40}?\b(?:ads?|adverts?|listings?)\b/i;

export function stripAdsOversell(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (!sentences.some((s) => ADS_OVERSELL.test(s))) return text;
  const kept = sentences.filter((s) => !ADS_OVERSELL.test(s) || s.trim().endsWith("?"));
  return kept.length ? kept.join(" ").trim() : "";
}

/**
 * Sentence-level cap, for the rundown that capParagraphs() cannot see.
 *
 * capParagraphs splits on blank lines, so a single unbroken paragraph — which
 * is what gpt-5-nano returns most of the time — passes through it untouched
 * however long it runs. Observed locally: an eight-sentence tour of market
 * research, anchoring, the value case, the current-salary question and the
 * full benefits package, all in one paragraph, in answer to "how do I
 * negotiate salary". ISSUE-006 intended to stop exactly that and didn't.
 *
 * Keeps the opening answer and the closing question, drops the tour between
 * them. Only touches single-paragraph text: anything with real paragraph
 * structure has already been through capParagraphs, and a list that survived
 * that check survived deliberately.
 */
export function capSentences(text: string, keep = 4): string {
  if (/\n\s*\n/.test(text)) return text;
  if (LIST_LIKE_PARAGRAPH.test(text)) return text;

  const sentences = splitSentences(text);
  if (sentences.length <= keep) return text;

  // The closing question must survive — every answer is supposed to end on one,
  // and dropping it strands the conversation.
  //
  // It is not always the last sentence. The model sometimes puts a quoted
  // script or a stray list item after it, and an earlier version only rescued
  // the question when it came last — so those answers were cut mid-sentence
  // ("...I'd like us to align on pay now and revisit in"). Search backwards
  // instead, and take the last question wherever it sits.
  const closingIndex = findLastIndex(sentences, (s) => s.endsWith("?"));
  const closing = closingIndex >= 0 ? sentences[closingIndex] : null;

  const body = sentences
    .slice(0, keep - (closing ? 1 : 0))
    .filter((_, i) => i !== closingIndex);
  return [...body, closing].filter(Boolean).join(" ");
}

// Same cap, but reports whether it actually fired — the area/stage guard
// chain needs that flag to decide whether dropDanglingQuestion() should look
// at the closing sentence at all (unlike the flat-topic capSentences() above,
// this one does not bail out on paragraph/list shape, matching the harness's
// version — flattenEnumerations()/flattenInlineList() have already turned any
// list into plain sentences by the time this runs in that pipeline).
export function capSentencesFlagged(text: string, keep = 3): { text: string; capped: boolean } {
  const sentences = splitSentences(text);
  if (sentences.length <= keep) return { text, capped: false };
  const closingIndex = findLastIndex(sentences, (s) => s.endsWith("?"));
  const closing = closingIndex >= 0 ? sentences[closingIndex] : null;
  const body = sentences.slice(0, keep - (closing ? 1 : 0)).filter((_, i) => i !== closingIndex);
  return { text: [...body, closing].filter(Boolean).join(" "), capped: true };
}

// Splits on sentence boundaries without cutting inside a quotation. The model
// often quotes a script for her to say — "Based on my research, I'm looking at
// X" — and splitting inside it strands half a sentence in the output.
function splitSentences(text: string): string[] {
  const rough = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of rough) {
    const previous = out[out.length - 1];
    if (previous && hasOpenQuote(previous)) out[out.length - 1] = `${previous} ${part}`;
    else out.push(part);
  }
  return out;
}

function hasOpenQuote(s: string): boolean {
  const straight = (s.match(/"/g) || []).length;
  const opened = (s.match(/[“„]/g) || []).length;
  const closed = (s.match(/[”]/g) || []).length;
  return straight % 2 === 1 || opened > closed;
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (predicate(items[i])) return i;
  return -1;
}

// The bullet-shape check above still can't save a legitimately long
// deliverable written as plain prose (a full cover-letter draft, an
// explanation the user explicitly asked to go deeper on) — nothing marks
// those paragraphs as "keep me" the way a bullet does. Same pattern as
// NARROW_SELF_CHECK: give the model an explicit, code-parseable way to
// say "this length is intentional" instead of guessing from shape alone.
export const LONG_FORM_ESCAPE_HATCH = `If — and only if — the user explicitly asked for something that genuinely needs a longer, multi-paragraph answer (a full draft, a full rewrite, or they asked you to explain more or go deeper), start your reply with the exact marker LONG_FORM_OK alone on its own first line, then continue with your full answer as normal on the following lines. Do not include this marker for an ordinary short answer — it should be rare, not the default.`;

const LONG_FORM_OK_PATTERN = /^\s*LONG_FORM_OK\s*\n+/i;

// ── Conversation history window ─────────────────────────────────────────────
// Raised from 6 to 10 on 15 Aug 2026 (ISSUE-009). Six messages is three
// exchanges, and a properly worked-through discussion area runs longer than
// that — enter, two or three follow-ups, then close — so the coach reached the
// close having already lost sight of how the area opened, and couldn't
// summarise what it had covered.
//
// Ten buys headroom, but it is not the real fix and won't survive a long area
// either. The durable record is `covered_facets` on coach_user_profiles: a
// compact list of facet IDs that can be expanded back into "market rate,
// opening the negotiation, benefits" for a few tokens, and that never falls
// out of a window. Treat this constant as the short-term memory and
// covered_facets as the long-term one.
export const HISTORY_WINDOW = 10;

// Fetched from the DB before slicing — kept above HISTORY_WINDOW so the slice
// always has a full window available rather than whatever happened to fit.
export const HISTORY_FETCH = 20;

// ── Whose side the coach is on ──────────────────────────────────────────────
// This coach exists for women building tech careers, and it should sound like
// it. Observed 15 Aug: asked about a male colleague earning more for the same
// job, it opened with "confirm you truly have the same role and scope" —
// sound advice, and the wrong first move. It asks her to prove it before it
// takes her seriously, which is the experience she is already having at work.
//
// The fix is not sympathy noises; those are banned elsewhere in these prompts
// for good reason. It is *substantive* validation — a fact about the world.
// "Pay gaps between men and women in the same role are well documented" does
// more for her than "that sounds hard", and it is also true.
export const STAND_WITH_HER =
  "You are coaching women building tech careers, and you are on their side. " +
  "WHEN THIS APPLIES: she reports something done TO her that women in tech demonstrably face — being paid less than a male colleague for the same work, being called difficult for negotiating, being assumed junior, being talked over, having her idea repeated back as someone else's. Then say plainly that it is real and well documented BEFORE you give any advice. She is not imagining it, and she is not alone. " +
  "WHEN IT DOES NOT APPLY: she is describing her own behaviour, her own feeling, or a habit — she goes quiet in meetings, she forgets to write her wins down, she rechecks her work four times, she does not believe a compliment. There is nothing there for her to be imagining and nothing documented to cite, and \"that pattern is real and you're not imagining it\" answers a fact she has just told you with agreement she did not ask for. Say something true about it instead, or go straight to what to do. " +
  "Never open by asking her to prove it. 'Check whether it's really the same role' is useful and it is not how you start; it reads as doubt. Validate first, then help her get her facts. " +
  "Be accurate rather than sweeping: the pattern is well established, this particular case you cannot know from here — say both, in that order. " +
  "Do this with substance, not sympathy: a fact she can use beats a soft phrase every time.";

// ── The quota concession, enforced rather than requested ───────────────────
// NEVER_DISCOUNT_HER_PLACE has now failed twice, in two different shapes. The
// first run agreed with her outright: "diversity hiring does happen." Told not
// to agree, the next run stopped agreeing and started restating instead —
// "You're worried you were hired to hit a diversity number rather than because
// you were the best. That pattern is real, and you're not alone." The rule
// says in as many words not to repeat the idea back even in order to knock it
// down, because she has to read the sentence either way. It was repeated back.
//
// Twice is where this repo stops rewording and writes the check. Any sentence
// that ties how she got in to a diversity target is removed, including one
// that was about to disagree with it: the sentence is the harm, not its verb.
// What survives is whatever the reply says about her own evidence, and if
// nothing survives, the caller's empty-reply path handles it — which is a
// better outcome than the sentence.
const QUOTA_TERM =
  /\b(?:diversity (?:number|quota|hire|hiring|target|push|initiative|programme|program)|dei\b|affirmative action|gender quota|quota hire|tick(?:ing)? (?:a|the) box|box[- ]tick\w*|fill(?:ing)? (?:a|the|some) (?:quota|number|target)|hit(?:ting)? (?:a|the|some) (?:diversity )?(?:number|quota|target))/i;
const PLACEMENT_TERM =
  /\b(?:hire[ds]?|hiring|got (?:the|this|your) (?:job|role|offer|place)|picked|chosen|choose|selected|recruit\w*|offer(?:ed)?|promot\w+|admitted|accepted|place|role|job|position|seat|spot)\b/i;

export function stripQuotaConcession(text: string): { text: string; stripped: boolean } {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const kept = sentences.filter((s) => !(QUOTA_TERM.test(s) && PLACEMENT_TERM.test(s)));
  if (kept.length === sentences.length) return { text, stripped: false };
  return { text: kept.join(" ").replace(/\s{2,}/g, " ").trim(), stripped: true };
}

// ── Vary the way in ─────────────────────────────────────────────────────────
// The previous approach here was a ban: addressMindsetChallenge said never to
// open with "I hear you" or "That sounds hard". It worked, in the narrow sense
// that those phrases stopped appearing — and the model simply chose a
// different template. The Confidence sweep of 28 Aug opened 14 of 22 replies
// with "That [noun] is real", twice word for word across different
// conversations: "That feeling is real and common in tech" in two separate
// scenarios, plus "That disbelief is real", "That belief is real", "That
// pattern is real", "That forgetting wins is real".
//
// Banning one phrase leaves one gap in the fence. So this names several ways
// in and asks for rotation instead, which is what a person actually does.
export const VARY_YOUR_OPENING =
  "Vary how you open, and do not treat acknowledgement as the default. Otema's own five answers open by diagnosing (\"Confront where it's actually coming from — is it the field itself, or the pressure of being in a male-dominated space?\"), by naming what is actually happening (\"You're likely comparing their output to yours without seeing their struggles\"), or by going straight to the instruction (\"Apply anyway\", \"Write your wins down as they happen\"). Not one of them opens by telling her a feeling is real. " +
  "Ways in, all of them yours, none of them the standing one: go straight to the advice; name the mechanism behind what she described; ask the one question that would change your answer; disagree with something in her own account of it; point at her own evidence (\"Trust yourself on this one\"); name a fact that settles it (\"That pattern is well documented\"); or hear her (\"I hear you\", \"It's not just you\"). The last two are options, not the opening move. " +
  "Never open two replies in the same conversation the same way, and that means the same SHAPE, not the same words — swapping the noun in 'That [feeling] is real' for 'That [pattern] is real' is the same opener twice. " +
  "Use a validating opener at most ONCE in a conversation, and only where something genuinely is documented and was done to her. Being talked over as the only woman in the room qualifies. Going quiet in meetings, forgetting to log your wins, rechecking your work — those are things she does, and telling her they are real and common says nothing. " +
  "Never start with a filler acknowledgment that says nothing: 'Great question', 'Good question', 'Nice'.";

// ── Never take her place away from her ──────────────────────────────────────
// Observed 28 Aug in the Confidence area. She said "sometimes I think they
// hired me to hit some diversity number, not because I was the best person for
// it", and the reply opened: "That concern is real and not in your head —
// diversity hiring does happen, and it can feel personal when you're the one
// on the receiving end."
//
// It confirmed the accusation she was making against herself. It did that
// because STAND_WITH_HER tells it to validate before advising and nothing told
// it what must never be validated — the rule was written for things done TO
// her, and the model applied it to a doubt she holds ABOUT herself. The
// drafted answer for exactly this question (S1b) says the opposite and was in
// the prompt at the time; it was overridden.
//
// Of everything this coach can get wrong, this is the one with a half-life.
// She will forget a mediocre answer about wins logs. She will not forget being
// told by a coach built for her that she might be a quota.
export const NEVER_DISCOUNT_HER_PLACE =
  "NEVER suggest, agree with, concede, or leave standing the idea that she got a job, a place, a promotion, a scholarship or an opportunity because of a diversity target, a quota, a hiring push, an initiative, or anything other than being chosen on her merits. " +
  "Not as a possibility, not as 'that does happen', not as 'even if it were true', not as sympathy, and not as a preamble before you disagree. Do not repeat the idea back in order to knock it down — she has to read the sentence either way. " +
  "This doubt is extremely common and she will raise it about herself. When she does: a process with a bar picked her and she cleared it. A programme existing alongside her hire did not sit her interview for her, and nobody hires someone they expect to fail. " +
  // Was "STAND_WITH_HER governs what is done TO her, not what she believes
  // about herself" -- a contrast with a rule that, for now, is not in the
  // prompt this sits in. Restated so the boundary holds on its own.
  "This rule is about what she believes about HERSELF, not about something done to her by someone else — those are different situations needing different responses. Validate how heavy the doubt is to carry. Never validate the claim inside it.";

// ── Reflect her back before you advise ──────────────────────────────────────
// The listening failure this coach actually has is not that it forgets what
// she said — the profile note carries that fine. It is that her own words
// never appear in the reply, so an answer that is technically responsive still
// reads as generic. Observed the same day: "the confusing part is the work is
// fine, nobody has ever complained about anything I've shipped" was answered
// with "the work being fine with no complaints doesn't prove belonging or
// potential" — she offered the only evidence in her own favour and the coach
// argued it down. That is the shape this rule exists to stop, in both halves:
// use her words, and never take her side of the ledger away from her.
export const REFLECT_BACK =
  "Before you advise, say her own thing back to her — in HER words, not a paraphrase that flattens them into yours. One clause is enough: 'Eight months of the same maintenance tickets, and you're still asking whether you've earned better ones.' " +
  "Pick the specific detail she actually gave you — the number, the timing, the thing that was said, the person who said it. A reflection with the details filed off is not a reflection, it is a stock phrase, and she can tell the difference immediately. " +
  "Never argue down a fact she offered in her own favour. If she tells you the work is fine and nobody has complained, that is evidence, and your job is to help her count it — not to explain why it does not count. Taking her side of the ledger away is the opposite of coaching. " +
  "One thing is never reflected back: an accusation she is making against herself. \"You're worried you were hired to hit a diversity number\" is not listening, it is handing the thought back to her with your voice on it. Reflect the FEELING or the DETAIL instead — how long she has carried it, what set it off, what she has actually shipped — and go straight to the evidence.";

// ── The coach cannot do anything outside this chat ──────────────────────────
// Observed: an answer about getting an equity offer in writing ended
// "...I'm happy to discuss on a quick call if needed." It was meant as part
// of a script for HER to send an employer, but the quote boundary was lost and
// it read as Botema offering to phone her.
//
// Either reading is a problem. She cannot call, and a coach that appears to
// promise contact and then never makes it is worse than one that never
// offered — particularly for a user who is already short of people to ask.
// The honest move is to point at BSC's actual mentors, which is also what
// "lift as they climb" means in practice.
export const NEVER_OFFER_TO_ACT =
  "You exist only inside this chat. You cannot make or join calls, send or read email, attend meetings, review a document she sends, contact anyone on her behalf, or follow anything up later. " +
  "Never offer or imply otherwise — no 'happy to jump on a call', no 'send it over and I'll look', no 'I'll check back with you'. " +
  "When you give her words to use with someone else, say whose they are and close the quotation cleanly, so it is never mistaken for you offering to act. " +
  "If what she needs is a person rather than an answer, say so and point her at BSC's mentorship programme or a mentor in her network — not at yourself.";

// ── Plain language ──────────────────────────────────────────────────────────
// Observed: "a milestone-based cash bonus, an equity refresh or larger option
// grant with a clear vesting schedule, and a currency protection clause or USD
// pegging… or an equipment stipend." Five pieces of Silicon Valley vocabulary
// in two sentences, aimed at someone who may be negotiating her first offer.
//
// This is not only a style problem. BSC's stated values include Education —
// "explain, don't gatekeep" — and jargon gatekeeps: it quietly signals that
// the room has a vocabulary she is expected to already know. Otema is
// well-spoken and professional, which is not the same as sounding like a term
// sheet.
export const PLAIN_LANGUAGE =
  "Use ordinary words. If a plain phrase will do, use it — 'a bigger share' not 'an equity refresh', 'paid in dollars' not 'USD pegging', 'money towards a laptop' not 'an equipment stipend'. " +
  "Some terms are genuinely worth knowing because she will meet them in the room — vesting, equity, a signing bonus. Use those, and say what each means in the same breath, once, without making a lesson of it. " +
  "Never stack two or more technical terms in one sentence. If a sentence needs a glossary, rewrite it. " +
  "Avoid startup and US-tech vocabulary that does not travel. She is negotiating in Lagos or Accra or Nairobi, not reading a term sheet in San Francisco.";

// ── Do not extract what she has not offered ─────────────────────────────────
// Observed across one conversation: "What range are you prepared to anchor
// on?" twice, "Could you share the budgeted range for this role?", "What range
// have you seen?" — the coach asking her to name her number, turn after turn.
//
// It is intrusive, and worse, it is incoherent. Otema's S3 coaches her to
// refuse exactly this: "turn it around and ask what range they've set aside —
// that tells you more than giving your own number first." A coach that tells
// her not to disclose, then presses her for the same figure, has not
// understood its own advice.
//
// She will volunteer a number when it helps her. Until then, none of the
// advice needs it: how to open a negotiation, what to do about a low offer,
// how to answer the current-salary question — all of it works without knowing
// what she earns.
export const ASK_WITHOUT_EXTRACTING =
  "Never ask her what she currently earns, what she is prepared to accept, what her range is, or for a payslip, a screenshot or any document. Do not ask her to name a figure at all. " +
  "If she volunteers a number, use it. If she does not, the advice still works without it — none of what you have to say depends on knowing what she is paid. " +
  "When you close on a question, ask about her SITUATION rather than her finances: what has been said so far, where the conversation has got to, what matters most to her here, what she has already tried, what is making her hesitate. " +
  "Asking her to disclose is also incoherent: you are the coach telling her not to give her number away first. Do not be the one extracting it.";

// ── Invented-figure guard ───────────────────────────────────────────────────
// The coach has no web search and no pay data of any kind: its only sources are
// KNOWLEDGE_BASE, the few-shot examples and the user's own profile. So any
// currency figure it produces is invented, and any claim to be citing data is
// a fabricated source. Observed in production: "Based on Nairobi market data
// for a junior developer with 2 years, I'm targeting 210k-260k KES base."
//
// This is also what Otema actually says — that public pay data is thin in many
// African markets, and peers and mentors are the more reliable signal. So the
// guard isn't only about accuracy; a coach asserting a sourced number is
// contradicting the person whose voice it speaks in.
//
// When Phase 4 lands, pass hasGroundedData=true for W-marked facets that
// genuinely retrieved figures, and the guard steps aside for those only.

const CURRENCY_CODES = "KES|KSh|NGN|ZAR|GHS|UGX|TZS|RWF|XOF|XAF|ZMW|MWK|ETB|USD|GBP|EUR";

// Deliberately conservative: an explicit currency next to digits, nothing more.
// A false negative just means the instruction has to carry it; a false positive
// would delete legitimate advice, which is the worse failure.
const CURRENCY_FIGURE = new RegExp(
  `(?:\\b(?:${CURRENCY_CODES})\\b[\\s:]*\\d)|(?:\\d[\\d,.]*\\s*[km]?\\s*\\b(?:${CURRENCY_CODES})\\b)|(?:[$£€₦]\\s?\\d)`,
  "i",
);

// "Based on Nairobi market data", "according to salary surveys" — a claimed
// source is wrong even with no number attached to it.
const FABRICATED_SOURCE =
  /\b(?:based on|according to|per)\b[^.!?]{0,50}\b(?:market data|salary data|pay data|salary surveys?|surveys?|research|reports?|figures|benchmarks?)\b/i;

export function hasUnsourcedFigure(text: string): boolean {
  return CURRENCY_FIGURE.test(text) || FABRICATED_SOURCE.test(text);
}

// Said in place of a stripped figure. Teaches the method instead of asserting a
// number — which is both the honest answer and the one Otema actually gives.
export const NO_RELIABLE_PAY_DATA =
  "I don't have reliable, current pay data for your market, and I'd rather not hand you a number I can't stand behind. " +
  "The most accurate signal is people doing the same role near you — ask in a community group, or ask a mentor directly what band they'd expect for it. " +
  "What role and location are you looking at?";

/**
 * Removes sentences that state a currency figure or claim a source the coach
 * doesn't have. Surgical rather than wholesale: an answer is usually mostly
 * sound advice with one invented number in it, and throwing away the advice to
 * remove the number would be its own kind of failure.
 */
export function stripUnsourcedFigures(text: string, hasGroundedData = false): string {
  if (hasGroundedData || !hasUnsourcedFigure(text)) return text;

  const kept = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !hasUnsourcedFigure(sentence));

  // If stripping left nothing of substance — or only the closing question —
  // there was no answer underneath the invented number, so say so plainly.
  const substantive = kept.filter((s) => !s.trim().endsWith("?"));
  if (substantive.length === 0) return NO_RELIABLE_PAY_DATA;

  return kept.join(" ").trim();
}

// Instruction half of the same guard. Code catches what the model ignores, but
// the model should not be producing these in the first place.
export const NO_INVENTED_FIGURES =
  "You have no live pay data and no web access, so never state a specific salary, rate or currency figure, " +
  "and never claim to be citing market data, surveys or research — you have none. " +
  "If someone asks what a role pays, tell them how to find out instead: what to compare, who to ask, and what makes a source trustworthy. " +
  "Being honest that reliable public data is thin in many markets is a better answer than a confident number.";

// Front half of resolveNarrowOrAnswer(), split out so the area/stage
// generation path (DiscussArea, in botema-coach.ts) can reuse the same
// self-report/long-form/enumerated-hedge handling and then run its OWN,
// richer back-half guard chain instead of the one below — no behaviour
// change here for the flat-topic path, which still calls
// resolveNarrowOrAnswer() exactly as before.
export function parseNarrowSelfReport(raw: string): string | null {
  const selfReported = raw.match(NARROW_OUTPUT_PATTERN);
  if (!selfReported) return null;
  const question = selfReported[1].trim();
  const options = selfReported[2].split("|").map((o) => o.trim()).filter(Boolean);
  return question && options.length >= 2 ? withChoices(question, options) : null;
}

export function stripLongFormMarker(raw: string): { body: string; isLongForm: boolean } {
  const longFormMatch = raw.match(LONG_FORM_OK_PATTERN);
  return longFormMatch ? { body: raw.slice(longFormMatch[0].length), isLongForm: true } : { body: raw, isLongForm: false };
}

// Hedging across tracks is wrong even in a deliberately long answer, so this
// runs regardless of the long-form marker.
export function enumeratedOptionsReply(body: string): string | null {
  const enumeratedOptions = extractEnumeratedOptions(body);
  return enumeratedOptions ? withChoices("Which one would you like to focus on?", enumeratedOptions) : null;
}

export function resolveNarrowOrAnswer(raw: string): string {
  const selfReport = parseNarrowSelfReport(raw);
  if (selfReport) return selfReport;

  const { body, isLongForm } = stripLongFormMarker(raw);

  const enumerated = enumeratedOptionsReply(body);
  if (enumerated) return enumerated;

  const resolved = isLongForm ? body : capSentences(capParagraphs(flattenInlineList(stripAdsOversell(stripImplausiblePeriods(stripImplausibleFigures(body))))));

  // Last gate before the user sees it. Runs on every generation path — both
  // personas, advice and mindset alike — because this is the single funnel
  // they all pass through. The quota guard belongs here for the same reason:
  // the sentence it removes must never reach her by any route, including a
  // long-form answer, which is why it sits outside the capSentences branch.
  return stripQuotaConcession(stripUnsourcedFigures(resolved)).text;
}

// ── Area/stage model guards ──────────────────────────────────────────────
// Ported from the local test harness (scripts/coach-local.mjs), which had
// these and the flat-topic path above did not. Used only by the area/stage
// generation path (discussion-areas.ts, botema-coach.ts's DiscussArea) —
// the older flat-topic path is untouched, so this is purely additive.

// One question per reply, in code. The prompt says one and the model
// sometimes writes two, welded with "and" — this cuts from the join rather
// than trying to choose between them.
const SECOND_QUESTION =
  /,\s+(?:and|or)\s+(?:what|how|which|who|when|where|why|whose|would|will|do|does|did|can|could|is|are|have|has|should)\b[^.!?]*\?\s*$/i;

// Checks every question-ending sentence, not just a trailing one — found by
// area-tester (2026-09-03) firing on a stacked question in the OPENING
// sentence of a reply, which a check for only the very end of the text can't
// see. Same fix ported into scripts/coach-local.mjs.
export function dropSecondQuestion(text: string): string {
  const sentences = splitSentences(text);
  let changed = false;
  const fixed = sentences.map((s) => {
    if (!s.trim().endsWith("?")) return s;
    const cut = s.replace(SECOND_QUESTION, "?");
    if (cut !== s) changed = true;
    return cut;
  });
  return changed ? fixed.join(" ") : text;
}

// Same 4-word "shape" the noRepeatedOpenerShape scenario check uses, so the
// guard that strips a reused opener and the check that fails a run for
// having one agree on what "the same opener" means. Wildcards the swappable
// noun so "That disbelief is real and" and "That pattern is real and"
// collapse to the same shape.
const OPENER_FRAME = new Set([
  "a", "an", "the", "and", "but", "so", "not", "no", "it", "its", "this", "that", "these", "those",
  "i", "you", "your", "we", "our", "she", "her", "they", "them",
  "is", "are", "was", "were", "be", "been", "do", "does", "did", "have", "has", "had",
  "would", "will", "can", "could", "should", "in", "of", "to", "for", "on", "at", "with",
  "real", "common", "normal", "fair", "valid", "true", "right", "hard", "tough", "understandable",
]);

export function openerShape(reply: string): string {
  return reply.trim().toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/).filter(Boolean).slice(0, 5)
    .map((w) => (OPENER_FRAME.has(w) ? w : "*"))
    .join(" ");
}

// A validating opener is right when she has just reported being treated
// badly, and empty when she has reported her own behaviour back to herself.
// Matched on the SENSE of the sentence, not a fixed phrase list — every
// tightening of a word-list version was answered with a different wording
// for the same move.
const ACKNOWLEDGING_OPENER = new RegExp(
  "^\\s*(?:i hear you|i know that feeling|you'?re not alone|you are not alone|you'?re not imagining|it'?s not just you|that'?s fair|that sounds|i understand)\\b" +
  "|^[^.!?]{0,120}?\\b(?:is|are|'s)\\s+(?:a\\s+|so\\s+|very\\s+|completely\\s+|entirely\\s+)*(?:real|normal|common|natural|understandable|valid|fair|not your fault|not a failure|nothing to be ashamed)\\b",
  "i",
);

// Wider than isValidatingOpener() below — this catches the whole
// acknowledge-first family, not just the "That X is real" construction.
export function stripUnearnedValidation(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [];
  if (sentences.length < 2) return text;
  if (!ACKNOWLEDGING_OPENER.test(sentences[0])) return text;
  return sentences.slice(1).join(" ").trim();
}

const VALIDATING_OPENER = /^\s*(?:that|this|it)\b[^.!?]{0,40}?\b(?:is|are|'s|s)\s+(?:a\s+)?(?:real|very real|completely normal|normal|common|understandable|valid)\b/i;

export function isValidatingOpener(sentence: string): boolean {
  return VALIDATING_OPENER.test(sentence || "");
}

export function stripRepeatedOpener(text: string, previousReplies: string[]): string {
  if (!previousReplies.length) return text;
  const firsts = previousReplies.map((r) => splitSentences(r)[0] || "");
  const used = new Set(firsts.map(openerShape));
  const sentences = splitSentences(text);
  if (sentences.length < 2) return text;
  const sameShape = used.has(openerShape(sentences[0]));
  const secondValidator = isValidatingOpener(sentences[0]) && firsts.some(isValidatingOpener);
  if (!sameShape && !secondValidator) return text;
  return sentences.slice(1).join(" ").trim();
}

// Numbered and bulleted rundowns, flattened into sentences so capSentences()
// can do its job — a five-step numbered plan with sub-bullets otherwise
// sails past a sentence cap that only knows how to count on ". ".
export function flattenEnumerations(text: string): string {
  const markers = text.match(/(?:^|\s)(?:\d+[).]|[-•*])\s+(?=[A-Za-z0-9])/g);
  if (!markers || markers.length < 3) return text;
  return text
    .replace(/\s*\n+\s*/g, " ")
    .replace(/(?:^|\s)(?:\d+[).]|[-•*])\s+(?=[A-Za-z0-9])/g, ". ")
    .replace(/\s*\.\s*\.\s*/g, ". ")
    .replace(/\s*([;,:])\s*\.\s*/g, ". ")
    .replace(/:\s*\.\s*/g, ": ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// A question with nothing left in front of it, two shapes. The first is
// explicit: the question names what a length cap just removed ("would you be
// willing to try those three steps this week?" after the three steps were
// cut). Only fires when capping actually happened.
const DANGLING_REFERENCE =
  /\b(?:those|these|the)\s+(?:\w+\s+)?(?:steps?|points?|items?|things?|ideas?|options?|tips?|moves?|two|three|four|first two|first three)\b/i;

// A second shape of the same promise-with-nothing-behind-it failure — found
// by area-tester (2026-09-03) on a reply that said "Try this in order." with
// no routine anywhere in the text (dropRepeatedSentences() had stripped it as
// already-said). DANGLING_REFERENCE only matches a demonstrative next to a
// list-noun ("those steps"); this names no noun at all.
const DANGLING_PROMISE =
  /\btry\s+(?:this|that|these|it)\b[^.!?]*\b(?:in order|first|below|next|like (?:this|so))\b/i;

export function dropDanglingQuestion(text: string, wasCapped: boolean): string {
  if (!wasCapped) return text;
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [];
  if (sentences.length < 2) return text;
  const last = sentences[sentences.length - 1];
  if (!last.trim().endsWith("?") || !DANGLING_REFERENCE.test(last)) return text;
  return sentences.slice(0, -1).join(" ").trim();
}

// The same failure in a trailing STATEMENT rather than a question — the
// reply's own closing line promises content ("pick one path and do these
// steps") that isn't there because an earlier guard removed it. Nothing to
// repair in the text here either; the caller regenerates instead.
export function endsOnDanglingReference(text: string): boolean {
  const sentences = (text.match(/[^.!?]+[.!?]*/g) || []).map((s) => s.trim()).filter(Boolean);
  const body = sentences.filter((s) => !s.endsWith("?"));
  if (!body.length) return false;
  const last = body[body.length - 1];
  return DANGLING_REFERENCE.test(last) || DANGLING_PROMISE.test(last);
}

// The other shape has no tell in the words at all — everything except the
// closing question was removed as already-said, leaving a bare question
// about advice she can no longer see. Nothing to salvage; the caller
// regenerates the turn as a wrap-up instead.
export function isOnlyAQuestion(text: string): boolean {
  const sentences = (text.match(/[^.!?]+[.!?]*/g) || []).map((x) => x.trim()).filter(Boolean);
  return sentences.length > 0 && sentences.every((x) => x.endsWith("?"));
}

// REFLECT_BACK asks the coach to open with her own words, taken to its
// degenerate limit: combined with dropRepeatedSentences() stripping
// everything else as already-said, a reply can end up being her own message
// read back at her and nothing else. Only short replies are tested — a long
// answer that happens to reuse her vocabulary is what good reflection looks
// like, not this failure.
export function echoesUser(text: string, message: string): boolean {
  const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
  const reply = words(text);
  if (reply.size < 3 || text.trim().split(/\s+/).length > 30) return false;
  const hers = words(message);
  let shared = 0;
  reply.forEach((w) => { if (hers.has(w)) shared += 1; });
  return shared / reply.size >= 0.7;
}

// Words that describe a location without being one — the model reaches for
// these when it has no city, and they must never satisfy mentionedByUser().
const NON_PLACES = [
  "unspecified", "unknown", "none", "remote", "global", "local", "market",
  "based", "abroad", "international", "anywhere", "various", "your", "their",
];

// True only when the candidate place actually appears in what she typed.
export function mentionedByUser(candidate: string, saidByUser: string): boolean {
  const words = String(candidate)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !NON_PLACES.includes(w));
  return words.length > 0 && words.some((w) => saidByUser.includes(w));
}

// A curated, not exhaustive, list — extend it if a different invented place
// turns up. The model has volunteered a specific country/city unprompted on
// areas with no location given at all; this catches that the same way an
// invented pay figure is caught.
const KNOWN_PLACES = [
  "ghana", "accra", "nigeria", "lagos", "abuja", "kenya", "nairobi",
  "south africa", "cape town", "johannesburg", "uganda", "kampala",
  "rwanda", "kigali", "tanzania", "ethiopia", "addis ababa", "senegal",
  "dakar", "egypt", "cairo", "morocco", "zambia", "malawi", "zimbabwe",
  "germany", "berlin", "united kingdom", "united states",
];

export function stripInventedLocation(text: string, saidByUser: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const invented = (s: string) => {
    const low = s.toLowerCase();
    return KNOWN_PLACES.some((p) => low.includes(p) && !mentionedByUser(p, saidByUser));
  };
  if (!sentences.some(invented)) return text;
  // A place named inside a question is still a fabrication — no exemption
  // for questions here, unlike some of the other guards.
  const kept = sentences.filter((s) => !invented(s));
  return kept.join(" ").trim();
}

// Azure OpenAI config — passed through from index.ts (loaded from Supabase secrets)
export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deployment: string;
}

// Azure OpenAI tool schema (wraps the function declaration)
export interface AzureToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// Base class for all converser functions
export abstract class ChatFunction {
  abstract get functionType(): FunctionType;
  abstract get name(): string;
  abstract get description(): string;

  get parameters(): { type: string; properties: Record<string, unknown>; required: string[] } {
    return { type: "object", properties: {}, required: [] };
  }

  toSchema(): AzureToolSchema {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }

  abstract call(args: Record<string, unknown>, question: string): Promise<string>;
}

// CHANGE_CONTEXT: updates converser state, then triggers a WORDALISE function
export abstract class ChangeContextFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.CHANGE_CONTEXT;
  }

  abstract updateContext(args: Record<string, unknown>): Promise<void>;
  abstract getWordaliseFunction(): string;

  async call(args: Record<string, unknown>, question: string): Promise<string> {
    await this.updateContext(args);
    const wordaliseFunc = this.converser.getFunctionByName(this.getWordaliseFunction());
    if (!wordaliseFunc) throw new Error(`WORDALISE function '${this.getWordaliseFunction()}' not found`);
    return wordaliseFunc.call(args, question);
  }

  constructor(protected converser: Converser) {
    super();
  }
}

// Fisher-Yates shuffle, then take the first n — used so few-shot example
// selection actually exercises the whole matched pool over time instead of
// always showing the model the same fixed subset (e.g. always the first 3
// in array order, or always the 3 most recently added rows).
export function pickRandom<T>(pool: T[], n: number): T[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

// WORDALISE: fetches domain knowledge + loads few-shot examples + generates response
export abstract class WordaliseFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.WORDALISE;
  }

  constructor(protected converser: Converser) {
    super();
  }

  abstract getDomainKnowledge(args: Record<string, unknown>): string;

  // Subclasses override getTopicFilter() to say which topic tag to prefer —
  // AdviseOnCareerTopic uses the classified career topic, AddressMindsetChallenge
  // uses the challenge_type argument. Returning null skips topic filtering.
  getTopicFilter(_args: Record<string, unknown>): string | null {
    return null;
  }

  async loadFewShotExamples(args: Record<string, unknown> = {}, limit = 3): Promise<Array<{ question: string; knowledge: string; answer: string }>> {
    try {
      const topic = this.getTopicFilter(args);

      if (topic) {
        const { data } = await this.converser.supabase
          .from("coach_wordalisations")
          .select("question, knowledge, answer")
          .eq("function_name", this.name)
          .eq("topic", topic);
        if (data && data.length > 0) return pickRandom(data, limit);
      }

      // No topic match (or no topic given) — sample from everything for this function.
      const { data } = await this.converser.supabase
        .from("coach_wordalisations")
        .select("question, knowledge, answer")
        .eq("function_name", this.name);
      return data ? pickRandom(data, limit) : [];
    } catch {
      return [];
    }
  }

  buildFewShotPrompt(question: string, knowledge: string, examples: Array<{ question: string; knowledge: string; answer: string }>): string {
    const parts: string[] = [];

    if (examples.length > 0) {
      parts.push(
        "[DEVELOPER MESSAGE]\n\n" +
        "You are the BSC AI Career Coach. Below are examples of how you have answered similar questions in the past.\n" +
        "Your voice is: first-person, empathetic, practical, and always ends with a question that invites the user to share more.\n" +
        "Default to a short, direct answer — a sentence or two, or a short paragraph at most. Only go longer if the question genuinely needs it, or the user asks you to explain more or go deeper. Do not use markdown.\n"
      );

      examples.forEach((ex, i) => {
        parts.push(`Example ${i + 1}:`);
        parts.push(`Question: ${ex.question}`);
        parts.push(`Your Knowledge: ${ex.knowledge.slice(0, 300)}...`);
        parts.push(`Your Answer: ${ex.answer}\n`);
      });

      parts.push("---\nNow follow this same voice and style for the current question.");
    }

    parts.push(`\nUser's Question: ${question}`);
    parts.push(`Your Knowledge:\n${knowledge}`);
    parts.push("\nNow give your answer directly to the user:");

    return parts.join("\n");
  }

  abstract generateResponse(prompt: string, question: string): Promise<string>;

  async call(args: Record<string, unknown>, question: string): Promise<string> {
    const knowledge = this.getDomainKnowledge(args);
    const examples = await this.loadFewShotExamples(args);
    const prompt = this.buildFewShotPrompt(question, knowledge, examples);
    return this.generateResponse(prompt, question);
  }
}

// INSTRUCTIONS: explains how the converser works
export abstract class InstructionsFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.INSTRUCTIONS;
  }

  constructor(protected converser: Converser) {
    super();
  }

  abstract getInstructionsContent(): string;

  async call(_args: Record<string, unknown>, _question: string): Promise<string> {
    return this.getInstructionsContent();
  }
}

// ENGAGE: proactively invites the user to share context
export abstract class EngageFunction extends ChatFunction {
  get functionType(): FunctionType {
    return FunctionType.ENGAGE;
  }

  constructor(protected converser: Converser) {
    super();
  }

  abstract getEngagementPrompt(args: Record<string, unknown>): string;

  async call(args: Record<string, unknown>, _question: string): Promise<string> {
    return this.getEngagementPrompt(args);
  }
}

// User profile persisted across sessions
export interface UserProfile {
  career_stage: string;
  current_background: string;
  target_role: string;
  goals: string;
  challenges: string[];
}

// OpenAI message format (used by Azure OpenAI)
export interface OAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Persisted state for the v4 area/stage model (discussion-areas.ts). Kept
// separate from UserProfile deliberately — this is about the CONVERSATION
// (which area is open, what's been covered), not about HER (career stage,
// background). Optional because the flat-topic path (bsc-functions.ts) never
// reads or writes it.
export interface AreaState {
  activeArea: string | null; // area topic key, e.g. "salary" — matches AreaConfig.topic
  coveredFacets: string[];
  closedAreas: string[];
  location: string | null;
  situation: string;
  aims: string;
  stallCount: number;
  wrappedUp: boolean;
  lastStage: string | null;
}

export interface ConverserContext {
  currentEntities: string[];
  userProfile: UserProfile;
  conversationHistory: OAIMessage[];
  areaState?: AreaState;
}

// Base converser class
export abstract class Converser {
  name: string;
  domain: string;
  context: ConverserContext;
  supabase: unknown;
  azureConfig: AzureConfig;
  protected _functions: ChatFunction[] = [];

  constructor(name: string, domain: string, context: ConverserContext, supabase: unknown, azureConfig: AzureConfig) {
    this.name = name;
    this.domain = domain;
    this.context = context;
    this.supabase = supabase;
    this.azureConfig = azureConfig;
  }

  abstract get instructions(): string;
  abstract initializeFunctions(): ChatFunction[];

  get functions(): ChatFunction[] {
    if (!this._functions.length) {
      this._functions = this.initializeFunctions();
    }
    return this._functions;
  }

  get functionSchemas(): AzureToolSchema[] {
    return this.functions.map((f) => f.toSchema());
  }

  getFunctionByName(name: string): ChatFunction | undefined {
    return this.functions.find((f) => f.name === name);
  }
}
