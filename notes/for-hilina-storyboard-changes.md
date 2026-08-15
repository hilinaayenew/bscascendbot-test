# Notes for Hilina — building on the AI Career Coach

Detail behind David's message. A running log of what changed and why, newest entries at the top.
Read as far back as you need — the summary below covers everything.

**This is not a deployment queue.** Nothing here is urgent to ship. It is a direction, and a set of
worked examples showing how far the bot can be pushed beyond the answers BSC gave us.

---

## WHERE THIS STANDS — 15 August 2026

Everything is on the **`david-sub-areas`** branch. Nothing is on main, nothing is deployed, and
there is no rush to change that.

```
git fetch && git checkout david-sub-areas
```

### The point of all this

Otema's 54 answers are a starting point, not the product. The work below is an argument for what a
bot built on top of them could be: it holds a subject open across a conversation, knows what it has
and hasn't covered, notices when the person has moved on, admits what it doesn't know, and goes to
the live web for the few questions where a real number matters.

None of that came from BSC. All of it was built on top of what BSC gave us — which is the habit
worth taking from this. When you get a set of answers, the question is not "how do I serve these",
it is "what can I build that these make possible".

**Don't worry about duplicating code.** Claude writes it, and rewriting is cheap. Worry about the
structure, and about knowing where everything lives. That is what the storyboard is for, and why it
is central rather than documentation written after the fact.

### What changed

**Ten discussion areas.** The 57 training questions divide into ten areas. Salary & Negotiation
(area 9) is worked through in full as the pattern; the rest are named but not built.

**An internal flowchart for one area.** Salary has three stages — before an offer, an offer on the
table, already in the job — and a coverage map of which answers belong to each. Crucially this is
**not a router**: the conversation is wordalisation-driven throughout. One call places the person in
a stage, the stage decides which answers get shown to the model, the model writes the reply. The
first version I specified *was* a router with fixed edges between answers, and it was wrong — that
kind of determinism has been outgrown at every previous layer of this coach.

**26 answers that are not Otema's.** Filling the area properly needed answers she never gave. They
live in a separate file, `botema-generated-examples.ts`, with a per-entry `reviewStatus`, and the
only function that reads them filters to `approved` — so **none of them can reach a user** until she
has been through them. That review step is what Sena's response reviewer should become.

**Web search, for three questions out of fifteen.** Only where a real, current number matters —
what a role pays, freelance rates, cross-border pay. Two separate calls: one that searches, one that
writes the answer in her voice from what came back. Everything else stays unsearched, because
searching "how do I ask for a raise" adds latency and dilutes her voice for nothing.

**Chataki removed from the design.** One bot for now. Her code is untouched and nothing was deleted,
but the picker is gone and every request goes to Botema. Worth revisiting later as a different idea:
one coach, with Chataki answering on some topics and Botema on others.

### What I'd like you to do next

1. **Take two more areas through the same treatment.** The storyboard's Area Flow tab now has
   sub-tabs — Salary is done, and **Getting Started (1)** and **Confidence (6)** are scaffolded with
   a five-step guide on each. Those two on purpose: Getting Started is the busiest area, and
   Confidence is the one most likely to break the stage model, because its stages almost certainly
   aren't situational the way Salary's are. Better to find that out deliberately.

2. **Expand past what you were given.** Salary went 5 real answers → 15 → 31 once the gaps were
   mapped. Expect the same everywhere. A stage with two answers behind it will be thin and
   repetitive — that is the signal to write more, not to merge the stage away.

3. **Try things that seem too ambitious.** The web search took an afternoon and is genuinely useful.
   Whatever you think is out of reach probably isn't.

### How to try it

```
npm run coach              # talk to it — real model, real searches, nothing touches the DB
npm run coach:scenarios    # three five-turn conversations, writes transcripts to examples/
```

`examples/` has three conversations if you'd rather just read. **Always test with five turns** — one
or two make almost any area look fine; the problems only appear over a run.

### Things worth knowing before you read the storyboard

**It is a target spec now, not documentation.** Around two-thirds describes the bot we want rather
than the one running. Every section is tagged LIVE / CHANGED / PROPOSED — check the tag.

**`bsc-functions.ts` is shared, not Chataki's.** Botema imports three of its classes. Deleting it
because the name looks like hers would break the live coach. (I did exactly this and had to undo it.)

**The model will not follow an instruction it keeps losing.** Three times now a formatting rule had
to move into code — the narrowing check, the length cap, and inline lists. When an instruction fails
twice, write the check instead of rewording it a third time.

### Open, whenever you get to them

- **ISSUE-023** — search results sometimes have their pay period converted, month reported as year.
  Wrong number, real citation, so it reads as verified. The one I'd fix before web search goes near
  a user.
- **ISSUE-017 / ISSUE-020** — the live bot invents salary figures with fabricated sources, and its
  length cap has never fired on most answers. Both fixed on this branch. No urgency, but worth
  carrying whenever you next deploy.
- **The migration** `20260815120000_area_state_and_location.sql` is written and not applied. Nothing
  in the area model can run without it. All columns nullable, so it changes nothing on its own.

### Finally

The framework you built is genuinely good, and easy to build on — none of the above would have been
a day's work otherwise. Everything here is on top of that.

---

## 2026-08-15 — Web search built, and two serious faults it introduced

Web search now works in the harness, using the mechanism David specified: Azure's **Responses API**
with `tools: [{ type: "web_search" }]`, and **two deliberately separate calls** — one that only
searches and reports, one ordinary chat completion that says what it found in Botema's voice.
Keeping them apart preserves the raw search text, so the summary can later be checked against what
was actually returned.

### Measured, not guessed

- **`max_tool_calls: 1` is essential.** Uncapped it ran **10 searches in 69s**; capped it ran
  **1 search in 29s** with the same 5 citations. The extra nine bought nothing and the user is
  sitting waiting. Adding an instruction to search once was *worse* (2 searches, 0 citations) —
  the parameter works, the prompt doesn't.
- A waiting line now goes out first, in her voice, because 30 seconds of silence reads as a hang.
- Results are cached per role + location + refinement — the in-memory stand-in for
  `coach_market_lookups` in the migration.

### ⚠️ ISSUE-022 — the guard came off when it shouldn't have (fixed)

Grounded mode switches the invented-figure guard off so real numbers can be cited. It was switching
off whenever a search **ran**, not whenever a search **returned** something. A fintech follow-up
came back with **0 citations** and the answer still cited "Glassdoor, 2026".

That is a fabricated citation arriving through the door we opened for real data — worse than the
original Nairobi bug, because it now looks sourced. Fixed: a search with no citations, or one
reporting NO RELIABLE DATA, counts as no search at all and the guard stays on. **The edge function
will need the same rule when Phase 4 ports across.**

### ⚠️ ISSUE-023 — pay periods being converted (open)

A grounded answer reported "NGN 302,372 **per year**" for a Lagos mid-level backend role when the
sources give roughly that figure **per month**. Not a formatting slip: it is a wrong number someone
could take into a negotiation, carrying a real citation so it reads as verified.

Mitigated by instructing the summarise call never to convert, and asking the search call for a fixed
`amount | period | source | year` shape. Both are instructions — so per the ISSUE-005 pattern,
expect this to need a code-level check comparing figures in the answer against figures in the raw
search text. **Still open.**

### Also fixed this session

- **ISSUE-020 follow-on — inline lists.** Told not to write lists, the model complied with the
  letter (no line breaks) and wrote one inline with dashes. `flattenInlineList()` in `converser.ts`
  handles it in code; instructions have now lost this argument three times.
- **Refinements counted as stalls.** "Is that for fintech?" was scored as no-new-information and
  ticked the stall counter — punishing the user for engaging. A refinement now always counts.
- **Repetition.** The follow-up restated the same figures; it now refers back in a clause instead.
- **Interim messages** are labelled `Botema …` so transcripts and tests can tell a hold from a reply.
  This was also why a sweep "failed" — the check was counting the waiting line as an answer.

---

## 2026-08-15 — Scenario sweep: 10 conversations, committed transcripts, 10/10 twice

> **Superseded later the same day.** David cut the set to three five-turn scenarios — market rate,
> pay gap, equity offer — and set a standing rule that every scenario runs **five** user turns.
> One or two turns make almost any area look fine. The findings below still hold.

`npm run coach:scenarios` runs ten fixed conversations through the local harness against live
Azure and writes each as a transcript in `examples/`, plus a results matrix in
`examples/README.md`. Each scenario tests **one claim the storyboard makes**, and the checks assert
it rather than eyeballing the output. Transcripts are committed, so a later prompt or content
change can be diffed against what the coach used to say.

Covered: stage classification across A, B and C; all three leaving layers; the invented-figure
behaviour; and that every answer ends on a question. **Not** covered: whether the advice is any
good — that judgment is Otema's, and many of these replies rest on drafted answers she hasn't seen.

### The finding worth acting on: the classifier is not stable, and fails quietly

First sweep came out 8/10. One failure was mine (a test-harness bug), but the other was real:

> "my manager refused my raise last week and said there is no budget"

classified as **stage B** — a live negotiation with a prospective employer — when the same sentence
had classified as **stage C** earlier in the session. Same input, different answer across runs.

What matters is the *consequence*. The stage-B reading produced advice about sign-on bonuses and
"locking it into the offer" — new-offer language, for someone already employed and refused a raise.
It doesn't look broken. It reads fluently and is simply the wrong kind of help.

**Fixed** by sharpening the stage descriptions to name what *separates* the stages rather than
what each one is: B is now explicitly a **prospective** employer, C is one you **already work for**,
with the giveaway words (manager, my team, my boss, a raise) called out. Two consecutive full
sweeps at 10/10 since.

Generalisable lesson for the other nine areas: write stage descriptions around the distinguishing
fact, not around the topic. This is ISSUE-001 in practice, and it's now recorded there with the
measurement rather than as a general worry.

### The design changed, and it makes the build smaller

The Area Flow tab used to specify deterministic facet-to-facet routing — S1 leads to S2, S2
leads to S3. **That is gone.** David's call, and he's right: every deterministic layer in this
coach has been outgrown (`isBroadStartingAsk`, then the keyword pre-check rule 5 replaced), and a
fifteen-node edge table is a keyword regex in better clothes.

**What happens inside an area now:** one classification call per message places the user in a
stage — A, B, C, or leaving. The stage decides which of Otema's answers get injected as few-shot
grounding, and the model writes a fresh reply from that material. Structure from the stage, words
from the model.

This is `loadFewShotExamples()` keyed on stage instead of topic, so it is **less** work than the
router would have been, not more. The facet graph survives as a **coverage map**: it records what
material each stage can draw on, and is never consulted to decide what to say.

### ISSUE-010 solved, and verified against real gpt-5-nano

Three layers, and all three fire correctly in the local harness:

1. `leaving` is one outcome of the same stage-classification call — no extra request
2. an explicit leave-phrase check that runs **before** any model call
3. a stall counter — same stage twice with nothing new closes the area

One bug found doing it: the classifier can only choose a destination from the areas it's shown.
Offering it three sent "how do I find a good mentor" to Confidence instead of Mentorship. All ten
areas are now in the enum.

### ⚠️ ISSUE-020 — the paragraph cap has never fired on most answers

**This is a live bug, not a v4 one.** `capParagraphs()` splits on blank lines, so an answer written
as one unbroken paragraph passes through however long it runs — and one unbroken paragraph is what
gpt-5-nano returns most of the time.

Found by running the harness. "How do I negotiate salary" came back as an eight-sentence tour of
market research, anchoring, the value case, the current-salary question and the whole benefits
package. ISSUE-006 was written to stop exactly that and could not see it.

**Fixed** with `capSentences()` in `converser.ts`, composed inside `resolveNarrowOrAnswer()` so it
covers every generation path. Keeps the opening answer and the closing question, drops the tour
between them. It deliberately ignores anything with real paragraph structure or a list, since
`capParagraphs` has already judged those. **6 new tests; 39 pass** (was 33).

Worth knowing this affects the currently deployed coach, so answers in production are longer than
anyone intended.

### The harness is now live, not a mock

`npm run coach` talks to real Azure using the key in `.env`. Free text in, stage classification,
wordalised answer out, with the figure guard and sentence cap applied. `--dry` skips Azure and
shows classification only; `--script="one|two|quit"` replays a conversation.

Two things it showed immediately: the Lagos question ("what should I be earning as a backend dev
in Lagos") produced a refusal to give a figure and a method instead, with **no guard firing** — the
instruction alone did it. And the stage classifications were correct on every message tried,
including inferring stage C from "my manager refused my raise last week".

---

## 2026-08-15 — Shipped: figure guard, African salary knowledge, challenges wired, single coach

First code changes of v4 work. **Nothing is deployed** — all of this is uncommitted working tree.
`npm test` passes 33 (was 25), `vite build` succeeds, and lint is unchanged from HEAD (9 errors,
all pre-existing `@ts-nocheck` plus one `no-explicit-any`).

### 1. Invented-figure guard — the Nairobi bug

Two halves, because an instruction alone won't hold on gpt-5-nano (same lesson as ISSUE-005/006).

- **Instruction** — `NO_INVENTED_FIGURES` in `converser.ts`, added to both personas' advice
  prompts. Tells the coach it has no live pay data and no web access, so it must never state a
  figure or claim to cite market data — and to explain *how to find out* instead.
- **Code** — `stripUnsourcedFigures()` runs inside `resolveNarrowOrAnswer()`, which is the single
  funnel every generation path already passes through, so it covers both personas and both
  functions for free. It removes sentences containing a currency figure or a fabricated source
  claim; if nothing substantive survives, it returns `NO_RELIABLE_PAY_DATA`, which teaches the
  method and ends in a question.

Deliberately conservative detection: an explicit currency next to digits, nothing more. A false
negative just means the instruction has to carry it; a false positive would delete real advice.
Verified it does *not* fire on "not 250, more like 150 billable days" or "10 percent below".

**8 new tests**, including the exact production string as a regression case. `stripUnsourcedFigures`
takes a `hasGroundedData` flag that Phase 4 will set true for W-marked facets that really did
retrieve figures — the guard steps aside for those only.

### 2. `KNOWLEDGE_BASE.salary` rewritten for African markets

Removed the UK legal claim ("in the UK you are not legally required to disclose") and the `£X-Y`
example. Now says plainly that public data is thin and often stale for African cities, treats
global aggregators as a rough ceiling rather than an answer, and points to peers, mentors,
community threads and local ads with published ranges — which is Otema's own position rather than
one contradicting her. Added a paragraph on local-versus-globally-benchmarked remote pay and on
review intervals where currency is unstable.

### 3. `challenges` wired up — ISSUE-016

`captureUserBackground` now takes a `challenges` array and persists it. Written **additively** with
a de-dupe rather than replacing, since challenges surface one at a time across a conversation and a
later mention shouldn't wipe an earlier one.

### 4. Single coach — Botema only

**Nothing was deleted.** `bsc-coach.ts` is untouched, and all seven classes in `bsc-functions.ts`
remain — worth stressing because the naming misleads: **`bsc-functions.ts` is shared, not
Chataki's.** Botema imports `UpdateCareerTopic`, `CaptureUserBackground` and `InviteUserContext`
from it, so deleting that file would break the surviving coach. Only 4 of its 7 classes are hers.

What actually changed is the user experience:

- `index.ts` — always constructs `BotemaCoach`. A `bot` field in the request body is accepted and
  ignored, so older clients keep working rather than erroring. Note `bot` previously defaulted to
  `"chataki"`, so she was the default persona, not the alternative.
- `AICoachWidget.tsx` — persona picker removed, header reads "Botema", `selectedBot` state and
  `sessionStorage` key gone, and the edge-function call no longer sends `bot`.

Reinstating her later is an import plus a branch in `index.ts`, plus the picker in the widget.

### Still to do

The storyboard has **not** had a Chataki pass yet — the Personas, Data Sources and Prompts tabs all
still present two coaches. That needs doing before anyone reads it as current.

---

## 2026-08-15 — Build plan: three workstreams, and web search for exactly three facets

New **Build Plan** tab in the storyboard. Three things David wants next, in a forced order.

**The dependency that sets the sequence:** web search can't ask "what does a backend developer earn
in Lagos?" without knowing the role and the city — which is what the capture work persists. So
capture must land before search, and both need the Phase 1 migration.

- **Phase 1 — one migration** (`active_area`, `covered_facets`, `closed_areas`, `location`, and a
  decision on `challenges`). Needs David's approval before touching the shared DB. Only phase that
  is a decision rather than work.
- **Phase 2 — capture as it arrives.** Amend routing rule 3 (ISSUE-015), chain profile writes off
  refining closers, keep the durable/situational split, write `covered_facets`.
- **Phase 3 — the 16 missing answers.** Draft into the generated store, tag with facet IDs, through
  the reviewer to Otema, promote what she approves. Runs in parallel — it's the one with a person
  in the loop.
- **Phase 4 — web search.** Real new infrastructure: Azure chat completions has no search, so this
  needs an external provider, a secret, a `websearch.ts` module, and a cache table keyed on
  role + location.

### Which facets reach the web: three of fifteen

- **S1 · What should I be earning?** — `W`. The market-rate question, and the exact facet that
  produced the invented Nairobi figure.
- **G5 · Freelance & contract rates** — `W`. Same shape, day rates by market.
- **G7 · Paid from abroad** — `W?` conditional, narrow: exchange-rate context only.
- Everything else — no. Method and mindset don't change because the web changed.
- **G9 ("will I seem difficult?") — never**, on principle. Not a question the web can answer.

The test used: does answering well need a fact that changes over time or by place, from a source
someone actually publishes? If the W list grows past a handful, that's a signal — either we're
searching things that don't need it, or the knowledge base has a gap search is papering over.

### The risk I'd want flagged before Phase 4 starts

Better sourcing may not mean better numbers. African salary data is thin online — which is what
Otema says in S1, and why she points to peers and mentors. Search will happily return Glassdoor and
PayScale pages with poor coverage and stale figures. Swapping an invented number for a
badly-sourced one is worse, because the citation makes it look more trustworthy than the guess did.

So: every figure carries a source and a date; "I couldn't find reliable data for Kampala — here's
how to find out yourself" is a correct answer rather than a fallback; and where search asserts
confidence and Otema says the data is thin, she's the one to believe.

---

## 2026-08-14 — ⚠️ The bot invented a sourced salary figure. No web search exists.

**Observed output:**

> "Based on Nairobi market data for a junior developer with 2 years, I'm targeting 210k–260k KES
> base, plus 13th month and learning budget."

**The bot has no web search and no live data.** Verified: all three `fetch()` calls in the edge
function go to the same Azure OpenAI chat-completions endpoint. The only `tools:` passed to the
model (`index.ts:53`) is `functionSchemas` — the routing functions. There is no search tool, no
browsing, no retrieval. Its whole world is `KNOWLEDGE_BASE`, the few-shot examples, the user
profile, and six messages of history.

There is also **no Kenyan salary data anywhere in the function** — grepped for Nairobi, Kenya, KES
and "13th month", zero hits. `KNOWLEDGE_BASE.salary` names Glassdoor/Levels.fyi/LinkedIn as places
the *user* should look, and prices its worked example in pounds.

So the phrase "Based on Nairobi market data" is a **fabricated citation**: it asserts a source that
does not exist. The numbers came from the model's training data at generation time.

**On the content itself:** KES 210–260k/month (~USD 1,600–2,000) reads high for a Nairobi junior
with two years — closer to mid-level — though that's a soft judgment, not verified. The clearer
tell is "13th month": a real convention in Nigeria and parts of Francophone Africa, but not
standard in Kenya. That's a blend across markets, not knowledge of one.

**Why this is worse than an ordinary wrong answer:**

1. **It breaks the bot's own stated scope.** The storyboard's cannot-answer grid explicitly says it
   can't promise "a specific salary number." It just gave a decimal-precise range.
2. **It contradicts Otema.** Her real Q46 answer says public salary data is thin in many African
   markets, so peer/mentor conversations are the better signal. Her position is *the data is thin*.
   A persona in her voice asserting a sourced figure says the opposite of what she said.
3. **It's the UK-centric knowledge gap showing its consequences.** With nothing African to ground
   salary answers in, the model fills the hole by inventing.

**Suggested fix — two parts, because fixing one won't do it:**

- **Instruction-level:** the salary generation prompt should forbid emitting specific figures and
  forbid citing sources the bot doesn't have. Teach the method — how to research a range, who to
  ask — which is what both Otema's answers and `KNOWLEDGE_BASE.salary` actually do. Never produce
  the number itself.
- **Expect it to need a code-level net too.** This is the same shape as ISSUE-005 and ISSUE-006:
  an instruction the small model won't reliably follow. A check for currency-and-figure patterns
  in salary-area output is cheap and testable in Vitest, unlike the routing behaviour.

Also worth fixing regardless: replace the UK jurisdiction content in `KNOWLEDGE_BASE.salary` (see
the Area 8 entry below). But note that fixing the knowledge does **not** fix this — the model will
still invent numbers unless told not to.

---

## 2026-08-14 — Where the generated answers end up: the response reviewer

**The plan:** the drafted answers in `botema-generated-examples.ts` are not meant to live in a
source file long-term. They'll be **presented and edited in the response reviewer** — the
contributor-facing screen where Otema (or whoever owns a persona's voice) reads a drafted answer and
approves it, rewrites it, or rejects it. Once an answer has been checked, it can be **promoted into
the genuine Otema answers** and stop being generated material at all.

So the file is a staging area, not a destination.

**This is probably ISSUE-003's tool, not a new one.** ISSUE-003 already plans a "Persona Voice Kit —
a contributor-facing tool with provenance tracking and a review/publish workflow." The response
reviewer is that workflow half. Worth building them as one thing rather than discovering later that
we built two screens that do the same job.

### The lifecycle of one answer

1. **Drafted** — written in her voice, lands in `botema-generated-examples.ts` as `unreviewed`.
   Never served: `approvedGeneratedExamples()` filters it out.
2. **Reviewed** — shown in the response reviewer next to the question it answers, the gap it was
   written for, and ideally the real answers from the same area so her voice is on screen for
   comparison. She approves, edits, or rejects.
3. **Promoted** — anything approved or edited becomes genuine material and moves into
   `botema-examples.ts`. At that point it's indistinguishable from her original questionnaire
   answers, because it has been through her.
4. **Retired** — rejected entries stay in the generated file as a record of what she didn't want
   said in her voice. That record is worth keeping; it stops us redrafting the same rejected idea
   in six months.

The `reviewStatus` field already models steps 1–2 (`unreviewed` / `approved` / `edited` /
`rejected`). Step 3 is the part with no code yet.

### Two things to get right in the reviewer

**Edited answers should be promoted, not left behind.** If she rewrites a draft, the text is now
her words, and leaving it in a file labelled "generated" understates its provenance in the opposite
direction from the usual risk. Promotion should be the default action on an edit, not a separate
chore someone remembers to do later.

**Show her the ratio.** Area 8 currently has five real answers and ten drafted ones. Reviewing them
one at a time hides that. The reviewer should make it visible how much of a persona is drafted
versus genuinely hers, per area — that's the number that determines whether the persona still
honestly represents her.

---

## 2026-08-14 — New idea: a second, generated example store, and deepening areas from inside

**The idea in one line:** keep two separate pools of voice examples — Otema's real answers, and
AI-drafted answers written in her voice to fill gaps — and let an area deepen itself by generating
further question/answer pairs while the user is inside it (STATE B).

### Why two pools and not one file

`botema-examples.ts` carries an absolute rule: never invent an answer on her behalf. That rule is
what makes the persona trustworthy, and ISSUE-002 is the record of what happens when it slips —
invented examples had to be found and rebuilt from her original CSV.

So generated material goes in a **new, separate file**, not mixed in:

    supabase/functions/ai-career-coach/botema-generated-examples.ts

The separation is structural rather than a comment at the top. Every entry carries:

- `reviewStatus` — `unreviewed` / `approved` / `edited` / `rejected`
- `gap` — the uncovered question it was written to answer
- `area` — which of the nine discussion areas it belongs to
- `drafted` — when

**The review gate is the important part.** The only exported reader,
`approvedGeneratedExamples()`, filters to `reviewStatus === 'approved'`. There's deliberately no
export that skips the filter, so nothing can reach a user until Otema has personally approved it.
Everything currently in the file is `unreviewed`, which means it returns nothing today — that's the
correct, safe state, not a bug.

If she edits an answer rather than approving it, the text becomes her words, and that entry is
better promoted across into `botema-examples.ts` and deleted here.

### Seeded with ten Area 8 answers

Area 8 now has **ten drafted answers**, all `unreviewed`. The first four came from the identified
salary gaps in the entry below; the other six extend the area past what the question bank ever
asked:

1. Pay equity — being underpaid relative to a peer
2. Pricing yourself as a career changer
3. A lowball offer — counter or walk away
4. Being refused a raise
5. Freelance and contract day rates
6. Valuing equity and options
7. Cross-border pay — currency, transfer mechanics, fees
8. Counter-offers on resignation
9. The social cost of negotiating — the "will I seem difficult" worry
10. Unpaid or underpaid first roles

They carry African-market specifics throughout: no pay transparency law to lean on, employers
pricing career changers as fresh graduates, an agency in Lagos and a client in Berlin being two
different rate cards, pushing to be paid in the stable currency.

**For scale:** Otema's real answers for this area number five. The generated layer is now twice the
size of the real one — which is exactly why the review gate matters, and worth watching as a ratio
across the other areas.

### The bigger idea: deepening an area from inside it

This is what makes it more than a gap-filling patch. Under v4, STATE B is a place the user occupies
and works through — and the constraint is that an area only holds as many facets as someone wrote
questions for. Area 8 has five. A user who genuinely works through salary will exhaust that.

So: **while inside an area, the coach can generate further question/answer pairs for that area** —
either ahead of time as drafted candidates for review, or live, grounded in the area's knowledge
and the surrounding real examples for voice. The generated pool is where those land, and the same
review gate applies before any of them become part of the persona.

Two consequences worth thinking about before building:

- It changes what "coverage" means. An area is no longer complete or incomplete against a fixed
  57-question bank — it has a real-answer core that can grow, plus a generated layer around it.
- It's the natural answer to ISSUE-011 and the Area 9 gap. Rather than waiting on a second
  questionnaire round for the five missing AI questions, draft them here and send Otema four
  approve/edit/reject decisions instead of five blank questions.

### Not wired in yet

I created the store but did **not** change `botema-coach.ts`. Wiring it in is a live-function
change, and unreviewed synthetic material in a real person's voice shouldn't reach users by
default. When we do wire it, `loadFewShotExamples()` at `botema-coach.ts:75-81` is the join point —
and note its existing fallback: when no example matches the topic it picks randomly from the
*whole* pool, so a careless merge would let generated answers surface on unrelated topics.

---

## 2026-08-14 — Area 8 (Salary): full bank coverage, but real gaps beyond it

Area 8 is 5 of 5 on the question bank, and `KNOWLEDGE_BASE.salary` covers the same five subjects
as Otema's answers — market rate, first-offer negotiation, the current-salary question, asking for
a rise, benefits beyond base. The grounding is uniformly shaped; it isn't deeper anywhere.

**A bug to fix regardless of v4.** `KNOWLEDGE_BASE.salary` is written for the UK — "in the UK, you
are not legally required to disclose this," and a worked example priced in `£X-Y`. Otema's answers
pull toward African markets (local vs globally-benchmarked remote rates, currency volatility). Both
go into the same prompt, so the coach is grounded in two jurisdictions at once, and on the
current-salary question the UK legal point is wrong guidance for most of this audience.

**Questions with no grounding at all** (David's judgment, not measured — candidates for the next
questionnaire round):

Most likely given the audience:
- Pay equity — "a male colleague in the same role earns more." Nothing in the area touches being
  underpaid relative to peers or the gender pay gap. Most conspicuous absence given BSC's mission.
- Pricing yourself as a career changer — Getting Started assumes a non-tech background, but nothing
  connects that to naming a number.
- A lowball offer — all five answers assume the negotiation is going well. Nothing on countering or
  walking away.
- Being refused a raise — Q49 covers the ask, nothing covers the no.

Structurally different money questions:
- Freelance/contract day rates (works nothing like salary negotiation)
- How to actually value equity (both sources list it as negotiable; neither says how to judge it)
- Cross-border payment, contracts and tax for remote roles paid from abroad

**Why this matters more under v4:** today a user asks one salary question and leaves. Once the area
is something they enter and work through, five facets goes quickly.

---

## 2026-08-14 — answer coverage: 52 of 57, and every gap is in one area

Checked what sample answers actually exist against the 57 training questions.

**Botema: 54 examples in `botema-examples.ts`, covering 52 of the 57 questions.** Two of the 54
answer questions that aren't in the bank at all (e.g. "Which tech field should I study that AI
couldn't replace?"), so the coverage is 52 matched + 2 extra.

**Five questions have no answer — all five are in Area 9, AI & the Future of Tech Work:**

- Q52 — using AI tools like ChatGPT/Copilot to accelerate learning
- Q53 — will AI make my skills obsolete, how do I future-proof
- Q54 — how AI is changing hiring and recruitment
- Q55 — ethical responsibilities when building/working with AI
- Q57 — breaking into AI/ML without a deep maths background

Area 9 therefore runs on 3 examples for 7 questions, while every other area is complete or nearly
so. The likely explanation is that these questions were added to the bank after Otema filled in her
questionnaire.

**This matters more under v4 than it did before.** With a flat topic tag, thin coverage just meant
slightly less voice-consistent answers. Once an area is something a user *enters and works through*,
Area 9 will run out of grounded material partway through the conversation — the coach would open the
area, answer two facets well, then have nothing behind the remaining five.

Per the standing rule in the Data Sources tab, these must not be invented on Otema's behalf. They
need to go back to her as five follow-up questions.

**Chataki still has zero.** `coach_wordalisations` is empty, so she has no sample answers for any of
the 57 — not just Area 9.

---

## 2026-08-14 — v3 → v4: the storyboard is now a target spec

**The headline change: this document no longer describes the deployed bot.**

Up to v3, `storyboard.html` was a faithful record — prompts pulled verbatim from source, flows
matching the real code path. From v4 it also carries what we *want* the bot to do. So you can no
longer read it as documentation of what's running.

Every section is tagged so you can tell them apart, with a legend at the top of the Overview tab:

| Tag | Meaning |
|---|---|
| `LIVE` | Deployed and working today — unchanged, trust it |
| `CHANGED` | Exists, but should behave differently |
| `PROPOSED` | Doesn't exist yet — needs building |

Build from `PROPOSED` and `CHANGED`. Leave `LIVE` alone.

### What's new in the document

**Nine discussion areas.** The 57 questions in `bsc-coach-training-questions.csv` are grouped into
nine areas, listed in a new *Discussion Areas* section on the Overview tab. Eight map one-to-one
onto topics that already exist in `KNOWLEDGE_BASE`, so this mostly formalises structure the
knowledge base already had:

| Area | Questions | Existing topic key |
|---|---|---|
| 1 · Getting Started | 1–8 | `getting_started` |
| 2 · Further Education | 9–15 | `further_education` |
| 3 · Career Paths & Roadmaps | 16–23 | `career_paths` |
| 4 · Mentorship | 24–29 | `mentorship` |
| 5 · Wellbeing & Balance | 30–35 | `wellbeing` |
| 6 · Confidence & Imposter Syndrome | 36–40 | `mindset` |
| 7 · Job Search & Applications | 41–45 | `cv_job_search` + `interview_prep` |
| 8 · Salary & Negotiation | 46–50 | `salary` |
| 9 · AI & the Future of Tech Work | 51–57 | `ai_impact` |

**A new conversation model — enter, stay, leave.** The old two-state flow (no-context →
context-captured) is replaced by a three-state lifecycle: outside any area, inside one, closing
one. The distinction that matters: *being inside an area is state the bot holds and can leave*,
not a tag on the last answer. A conversation should work through salary properly, close it
deliberately, then open mentorship — with salary remembered as covered.

**Three new flow diagrams** on the Function Flows tab — Flow A (entering an area), Flow B (staying
inside one), Flow C (closing one and opening another). These sit above the existing Flows 1–5.
Where they disagree, the new ones win: Flow A supersedes Flow 1.

**Routing table changes.** Three new functions — `enterDiscussionArea`, `continueInArea`,
`closeDiscussionArea`. Consequence worth flagging: **`updateCareerTopic` is retired.** It's the
current default route, so this is not a small change. Every substantive answer now happens inside
a named, open area.

**A worked example** on the Overview tab showing a full transition: salary opened → two follow-ups
→ closed with a summary → mentorship opened. Note what "what about benefits?" does there — alone
it's ambiguous and would trigger a narrowing question, but inside an open area it needs none. That
disambiguation is the practical payoff of holding the state.

**The Issues tab is now visible.** It was hidden behind `style="display:none"`. With four new
build blockers in it, hiding them from the person building this seemed wrong. Say if you'd rather
it went back.

### What needs deciding or building

Four new issues, all in the Issues tab:

- **ISSUE-008 (high) — nowhere to store which area is open.** `coach_user_profiles` has only the
  single overwritable `career_topic`. Needs a migration adding `active_area`, `covered_facets`,
  `closed_areas`. **This blocks everything else in v4** — Flows A–C can't work at all without it.
- **ISSUE-009 (high) — the 6-message history window is too short.** `history.slice(-6)` is shorter
  than a properly worked-through area, so the coach would lose the start of an area before reaching
  its end. Either widen the window while an area is open, or lean on `covered_facets` as the durable
  record instead of the transcript.
- **ISSUE-010 (medium) — expect the leave-detection to need a code-level fallback.** Deciding
  "is this leaving the area, or a loosely-worded follow-up?" is the same class of judgment call as
  rule-5 narrowing, which took three rounds of instruction tightening and still needed
  `extractEnumeratedOptions()` as a net (ISSUE-005). Budget for the fallback rather than assuming
  the prompt holds.
- **ISSUE-011 (low) — area 7 merges two existing topics.** It covers both `cv_job_search` and
  `interview_prep` because Q43 is the only interview question. Either accept nine areas and merge
  the knowledge, or split it and accept an area resting on one training question. Cheap to decide
  now, expensive after seeding.

### Prompts tab

Everything on that tab is still the current live text, and all of it predates the area model.
Rule 6 routes to a flat topic, so it becomes `enterDiscussionArea`. Rule 5's narrowing options
become the nine areas when no area is open, and facets within the area when one is. Two rules
don't exist yet and need writing: stay in the open area unless the user clearly leaves it, and
close an area explicitly rather than drifting out of it. Rules 1–4 are unaffected.

### Still true from before

Chataki still has zero seeded voice examples — `coach_wordalisations` is empty, cleared by
`20260723150000_clear_coach_wordalisations_pending_real_data.sql`, pending her real questionnaire.
Botema's 54 examples are unaffected by any of the above.
