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

## 2026-09-01 — Where the prompt's blocks go, tested rather than argued

Short one. Nothing here changes what you build yet, except the last item, which does.

**The Confidence sweep was re-run** on the five scenarios that were failing or suspect (02, 03, 05,
08, 09). The worst thing in the 28 Aug transcripts is gone: three of ten conversations used to
answer a direct question with the bare canned line *"What feels true for you right now?"* — the
model produced nothing and the guards emptied the reply. Zero occurrences now. 05 and 08 pass, 02
and 09 still fail on endings, and 03's failure is a bad check rather than a bad reply.

**The order of the blocks in the generation prompt was put to a test.** The question was whether the
positive examples should sit at the END of the prompt, with the rules in the middle — the argument
being that recency wins, the guards can only remove, and half this prompt is prohibitions. It was
built as a switchable stack (`--stack=rules-last|examples-last` on the harness) and both orders were
run over four comparable scenarios, five turns each, against live Azure.

The proposed order lost on every shape measure, in every scenario: 17 sentence caps against 3, 12
flattened rundowns against 1, and 1 light-check ending against 10. The mechanism is worth knowing —
it is **mass, not position**. The shape rules sat last in both orders, so nothing was buried. But
~3,600 characters of Q&A next to the generation point sets the shape of the answer, and four
sentences of length rule after them do not undo it. What the model copies from an example is its
structure. Default stays as it was; the flag stays so the arm can be reproduced.

**The one thing for you.** The harness and the deployed edge function do not agree on this order,
and the deployed one is the arrangement that just lost. `botema-coach.ts` sends persona and rules as
the system message, then examples and knowledge afterwards inside the user message
(`buildFewShotPrompt`). The harness puts examples in the middle and rules last. So every Confidence
finding we have acted on was measured against an order the live bot does not use. On the numbers
above, the fix points at the live function: move its examples ahead of its rules. Not done — it is
a change to deployed code and it should be a deliberate one.

**Also.** `notes/prompt-anatomy.html` was showing `VARY_YOUR_OPENING` glued onto the end of an
inline block and attributed to the wrong file; the page now shows every block in the order the call
actually sends it, verified against a live dump rather than by reading the code.

**Three open bugs, none urgent.** (1) The light-check test in `checks.mjs` whitelists check-phrases
("feel doable", "sounds right") while the model varies the adjective, so it fails good endings —
"Does that approach feel actionable for you in that room?" was marked a failure. (2) The profile
note's placeholder guard misses `— NONE`, because the model prefixes the paragraph with an em dash,
so an empty note gets stored as a fact. (3) "I got promoted to lead my team about two months ago"
was classified as *leaving* Confidence for Career Paths, ending a conversation on turn 1.

---

## 2026-08-28 — Confidence tested properly, and the four things it turned up

Ran the Confidence & Imposter Syndrome area through five real conversations, read the transcripts
against the storyboard and against Otema's own answers, then acted on what David picked out of the
report. The set is now ten conversations rather than five, and there is a second sweep of all ten
sitting in `examples/confidence/`.

### The one that matters

She said: *"sometimes I think they hired me to hit some diversity number, not because I was the
best person for it."*

The coach said: *"That concern is real and not in your head — diversity hiring does happen, and it
can feel personal when you're the one on the receiving end."*

It agreed with her. A coach built by an organisation whose entire purpose is getting African women
into tech told one of them she might be a quota. Everything else in the report is fixable in the
ordinary way; this one has a half-life, because she will remember it.

It is worth being precise about how it happened, because the mechanism is more interesting than the
mistake. `STAND_WITH_HER` is a rule we are proud of — it says that when a woman describes something
women in tech demonstrably face, say plainly that it is real and documented **before** giving any
advice, because asking her to prove it first is the experience she is already having at work. It
was written for pay gaps and being talked over. Nothing in it said what must never be validated,
so the model applied the validate-first shape to a doubt she holds *about herself*. The correct
answer was in the prompt at the time — the drafted S1b facet says a process with a bar picked her
and she cleared it — and it lost to the more general rule.

So there is now `NEVER_DISCOUNT_HER_PLACE` in `converser.ts`, sitting immediately after
`STAND_WITH_HER` because it is the boundary on it and has to be read in the same breath. Never
suggest, concede, or leave standing that she got a job, place, promotion or scholarship because of
a target, a quota or an initiative — not as a possibility, not as sympathy, and not repeated back
in order to be knocked down, because she has to read the sentence either way. It is in Botema's
live prompts as well as the area harness.

**The general lesson:** a rule that tells the model to validate needs a companion telling it what
is not eligible for validation. We have one such pair now. There are probably others.

### Listening is done by the examples, not by the instruction

Second finding: she offered the only evidence in her own favour — *"the work is fine, nobody has
ever complained about anything I've shipped"* — and got back *"the work being fine with no
complaints doesn't prove belonging or potential."* Her own evidence, argued down.

David's call on the fix was the right one and worth recording: don't write another instruction,
**put it in the few-shot examples**, because reflecting back is a feature of the pattern rather
than a rule about it. Six of this area's drafted answers now open by saying her own words back to
her — *"Every time it comes up"*, *"You said only"*, *"Nothing comes to mind"* — and the model
imitates material far more reliably than it follows prose. `REFLECT_BACK` exists too, and carries
the half that examples cannot: never argue down a fact she offered in her own favour.

S1b is the deliberate exception to the shape. It reflects the *word* she used and not the claim she
made, because of the rule above.

### Areas had no way to finish

Every area could only end two ways: the stall counter (same stage twice, nothing new) or a leave
classification. Both are failure exits. A conversation that went **well** had no ending at all, so
the coach kept going — which is why the fifth reply in one transcript hands her a two-week wins log,
a fixed owning line, a weekly fifteen-minute review and a monthly mentor check-in. It had nothing
else to do with the turn.

Confidence now has a **stage C, Wrapping up**. It is the first stage in any area that exists to
stop the coach reaching for material rather than to choose which material it gets: it holds the
whole area for voice and is forbidden from answering out of it. It says the plan back in her words
and checks whether that is actually it — *"I think we've got a plan, haven't we?"*, *"Have we
covered that one?"* — and the stall counter now diverts into it once before closing, so running dry
and finishing stop looking identical from the inside.

If this holds up, every area wants one. Storyboard has it as Confidence's stage C for now.

### Banning a phrase just moves it

Fourteen of twenty-two replies in the sweep opened with the same construction — *"That feeling is
real"*, *"That disbelief is real"*, *"That pattern is real"*, *"That forgetting wins is real"* —
twice word for word across different conversations.

The instructive part: we had already banned the previous version of this. `addressMindsetChallenge`
says never open with *"I hear you"* or *"That sounds hard"*. That ban worked exactly as written,
and the model picked a different template. Banning one phrase leaves one gap in the fence.

`VARY_YOUR_OPENING` replaces the ban with a rotation — five named ways in, none of them the
default, and "That X is real" allowed once per conversation and only where something genuinely is
documented. David's suggestion, and it also unbans *"I hear you"*, which was never the problem;
saying it every time was.

The check matters as much as the rule. `noRepeatedOpeners()` compared the first four words and
passed every one of those replies. `noRepeatedOpenerShape()` wildcards the swapped noun and
collapses all four to `that * is real and`, which is what they are.

### Questions had become an interview

Every reply ended by asking her for more information, several with two questions welded into one
sentence, and one re-asked something she had already declined to answer. The prompt was the cause:
it made a forward-driving follow-on the default and a light check the fallback. That is now
inverted — *"Does that make sense?"*, *"Does that feel like something you could actually do?"* is
the ordinary ending, a follow-on has to earn its place, and a second question is cut in code rather
than requested against.

### The Prompts tab was showing the wrong prompt

Worth flagging on its own, because it affected anyone reading the storyboard to understand the bot.
The tab is headed *What's Actually Sent to the Model* and shows `adviseOnCareerTopic` and
`addressMindsetChallenge`. **No area conversation uses either of them.** `wordalise()` in
`scripts/coach-local.mjs` assembles its own system message per turn — the stage's `describes` line,
seven scoped examples, and about twenty reply rules that appeared nowhere on that tab. Every
transcript in `examples/` came from that prompt.

There is now a **Prompts · Area generation** section that writes it out, with the assembly order and
why the order is load-bearing (recency: anything constraining the shape of the reply has to go
last, under a heading that says it overrides everything above).

Related, and an answer to a question David raised: `NO_INVENTED_FIGURES` says "no web access", and
that is still literally true of the deployed edge function — there is no search anywhere in
`supabase/functions/`. Search exists only in the area harness, and there the constant is dropped
from the prompt entirely and replaced by the grounded-mode block. The code was right; the
storyboard was showing one of two modes and implying it was the only one. Both are on the tab now.

### Four bugs, none of them in the model

- **A truncated tool call was being treated as a successful one.** When `gpt-5-nano` runs out of
  budget mid-arguments the JSON fails to parse; the code returned `{}`, the caller saw a
  classification with no stage, retried once, and gave up — while the no-tool-call path next to it
  climbs 2000 → 4000 → 8000 → 12000. That is what killed scenario 02 turn 4, on the message where
  she asked whether to say something or let it go. She got *"that one did not come through
  properly."* Same ladder now, and the `finish_reason` is logged.
- **Every area was being asked for salary fields on every turn.** `needsMarketData`, `role`,
  `refinement` and `location` are only meaningful in Salary, which is the only area that can
  search, and they are four more fields to emit before the model reaches `stage` — see the
  truncation above. Gated on a `marketData` flag now, set in `scripts/areas/salary.mjs` only.
- **A false diagnostic in every transcript, in every area.** `[implausible figure removed]` fired
  on any turn where repeated advice had been stripped, because it compared against the wrong
  baseline. Every one of the eight in the Confidence sweep was this; there is no money anywhere in
  that area. One-line fix, but the transcripts are the artefact we judge these by.
- **"No that's everything, thank you" was read as changing the subject.** The classifier returned
  *leaving*, with a destination, and the coach said *"Of course — let's get into career paths &
  roadmaps"* to someone who had just said she was done. There is now a done-phrase layer that runs
  before any model call, like the leave-phrase check, and closes the area rather than following her
  somewhere she never asked to go.

### The uncomfortable one: the checks were passing conversations with no reply in them

Scenario 02 produced no answer at all on two of its five turns — one bare fallback question, one
*"that one did not come through properly"* — and reported every check PASS, including *"gives a
concrete next move"* and *"most replies still end on a question"*. The second passed because the
harness's own error message ends in a question mark and was being counted as a reply. Scenario 03
ended a turn early and reported 7/7.

The storyboard cited that pass rate under **Already true** as evidence the area worked. It now says
to read the transcripts rather than the pass rate, and the auto-generated README no longer claims
coverage it does not have — it was hardcoded to say "stage classification across A, B and C; all
three leaving layers; the invented-figure behaviour" for every area, including two-stage areas with
no figures in them.

**The habit worth taking:** a pass rate is only worth what its checks can detect. Ours could not
detect the coach failing to speak. If you build a check suite, put a failing conversation through
it deliberately and confirm it fails.

### Where it actually landed, and the thing to know about the number

Three full ten-conversation sweeps overnight. The last two ran **identical code** and scored
**10/10** and **6/10**, with different scenarios failing each time. Nothing regressed between them;
the model simply varies, and the checks are now sharp enough to see it.

That is worth holding on to. The pass rate used to be stable at 5/5 because the checks could not
detect anything — including two turns where the coach said nothing at all. It is now unstable
because they can. **A wobbling number from sensitive checks is more useful than a clean one from
blind checks**, and the transcripts are the deliverable, not the score.

What is solid across all three runs:

- The diversity-hire answer never came back. Where the old run said "diversity hiring does happen",
  it now goes to merit and evidence.
- The opener tic is gone. `[repeated-opener guard fired]` does the work the instruction could not.
- Light checks appear — *"Does that feel doable this week?"*, *"Does that feel like the right next
  step?"* — and *"I hear you"* is back in circulation, varied rather than constant.
- Stage C works. It classifies on agreement, the done-phrase layer closes cleanly on "no I think
  that's everything, thank you", and the coach stops adding.

What is not solid, and is the honest list for the morning:

- **The light-check ending holds about two conversations in three.** Every remaining failure in the
  last run is that check. One prompt inversion so far; by this repo's own rule it gets one more
  attempt before it becomes a code guard.
- **Thin replies when the repeat guard fires.** When `dropRepeatedSentences()` removes everything
  she has already heard, what is left is sometimes a single sentence — one turn was just *"You're
  going to bring it up in your next one-to-one."* Not wrong, and not enough. An earlier version of
  the same turn came back as her own message read back word for word, which is now caught in code;
  the paraphrased version still gets through.
- **Otema's own answers still rarely reach the close-three.** Her voice arrives through the random
  four almost every turn, which is what the design says should happen, but the advice is coming
  from drafted material far more often than from hers.

---

### Also, while in there

The storyboard's *All Answers in Full* for Confidence listed 9 of 21 facets. The twelve added in
the dead-end sweep had been written, drafted, wired into the harness and never shown — in the one
section Otema would read to approve them. All 21 are there now, generated from the source file so
they cannot drift again.

---

## 2026-08-15 (overnight) — Tester findings worked through; prose profile added

David set the area-tester agent running on salary, then left it with me. Everything below is on
`david-sub-areas`. 73 tests pass.

### The agent's constraints held

Six findings at the cap and not over, every one citing both the bot line and the rule it broke,
eight more weighed and rejected in `## Not reported`. It ran the conversations once and did not edit
the storyboard. That is the design working — the anti-spiral constraints are in
`.claude/agents/area-tester.md` and are the reusable part.

### The worst finding was the harness, not the coach

When the scenarios were split per area, their check functions kept calling `replyOf`,
`everyReplyAsks`, `jargonPerReply` and `maxRepeatOverlap` — which stayed in the runner's module
scope. Every check threw `ReferenceError`; the runner's `catch` recorded each as a silent FAIL.
`examples/README.md` read **"0 of 5 passed"** and carried no information at all.

That is worse than having no tests, because it looks like a result. Helpers now live in
`scripts/checks.mjs` and both files import them — verified 34 checks evaluate, 0 throw. The agent
found this and correctly filed it as a harness problem rather than a coach one.

### Then the coach findings, in order

- **A fear read as a request to leave.** "i dont want to seem awkward and have them just move on to
  the next candidate" — the bare "move on" matched `LEAVE_PHRASES`, which runs *before* any model
  call, so the area closed with no judgment applied, at the exact sentence the confidence facet
  exists for. Every phrase must now express leaving on its own, plus a `NOT_LEAVING` guard for fear
  language. Eleven cases unit-tested.
- **Two conversations died on their final turn** — the tool-call path returned null where the
  content path already retried. It retries now, and all three failure paths speak instead of
  printing a stack trace.
- **Advice that had stopped applying.** Once a counter-offer is live she has already asked, already
  been refused, already resigned — but "raise" and "asked" still matched the raise-asking examples.
  A `supersedes` rule in the area config now retires those nine facets outright; down-weighting was
  not enough, because the closest lexical match still wins.
- **Repetition, in code at last.** The same three-item checklist on four consecutive turns. The
  instruction had lost four times out of five conversations. `dropRepeatedSentences()` compares
  content words, so a *rephrasing* is caught. Then it turned out a repeated script was hiding behind
  a closing question — the sentence splitter merges quoted material with what follows, and the
  "always keep questions" rule was exempting the whole block. Fixed and tested.
- **"Ads often oversell what the company will pay"** — the employer's own argument, handed to her
  mid-decision, contradicting Otema's S1. Rewriting the draft did not stop it reappearing, so
  `stripAdsOversell()` now removes it.
- **A missing facet.** Nothing covered an employer *demanding* proof of current pay, so the model
  improvised a "redacted summary" — still her number, and she had just said it was half the market
  rate. New **S3b** says don't send it and put the range question back to them.

### The storyboard gained what it was missing

**"What the Coach Will Never Do"** on the Prompts tab: every guard, whether a **prompt** or a
**check** enforces it, and the answer that went wrong first. That column is the point — half these
rules are code precisely because asking did not work, and treating the two alike is how you end up
relying on a rule that has failed. Sena's notes predicted this gap exactly.

### David's to-do — storage about the individual

Two prose fields, `situation` and `aims`, alongside the variables rather than instead of them.
Written by a small call that runs only when the classifier says she added something. Columns are in
the unpushed migration.

Three things learned by watching it fail: write in the third person as a note ("She is a backend
developer in Nairobi, three years in the role") rather than quoting her back at herself; accumulate
rather than restarting from the latest message; and never store a placeholder, because "(no
information provided)" sitting in a field reads as something known.

### Where it stands

Sweep went 0/5 → 3/5, and the two remaining failures traced to faulty *checks* rather than the
coach — one matching the bare word "inflate" against the correct advice "don't inflate or lie", the
other missing "isn't complaining" because it looked for "not complain". Both corrected.

The count of instructions that have had to become code is now **eight**.

---

## 2026-08-15 — An agent for testing an area

`.claude/agents/area-tester.md` — invoke it and ask it to test an area. It runs five conversations
against the live model, critiques the output **against Otema** rather than against abstract quality,
and reports at most six ranked findings. It stops there; David picks what to act on.

### Why it is built the way it is

David has set up testers before and they spiral — fixating on marginal specifics and producing
volume instead of judgment. Five constraints are written into the agent definition to stop that, and
they are the reusable part of this:

- **Two separated phases.** Run all five conversations, *then* critique using only the transcripts.
  Interleaving is the compounding mechanism: each new conversation raises new marginal questions.
- **Six findings maximum**, three per category, force-ranked. Prioritisation is exactly the judgment
  that disappears when a tester spirals, so the cap forces it.
- **Two-artifact citation.** Every finding quotes the bot line *and* the thing it violates. The
  strongest filter available, because marginal things cannot be traced to a concrete violation.
- **A severity gate in plain words** — would this mislead her, cost her money in a real negotiation,
  or make her stop trusting the coach?
- **"No findings" declared valid in advance**, plus a `## Not reported` section where marginal
  observations go. Agents manufacture findings because reporting none feels like failing the task.

The three things it looks for are David's: outright errors, not listening to the conversation, and
"Otema wouldn't say that". Examined in that order deliberately — the first is checkable and the last
is taste, and doing the checkable one first stops it reaching for taste too early.

### Running it for a new area

The harness and runner are now area-parameterised:

```
npm run coach -- --area=9              # talk to one area
npm run coach:scenarios -- --area=9    # run its five conversations
```

To add Area 1 or 6 you need two files, and neither touches the harness:

1. **`scripts/areas/area-01-getting-started.mjs`** — the coverage map. Copy `area-09-salary.mjs`;
   its header explains the three things that matter. The one that matters most: each stage's
   `describes` must say what distinguishes it **from the other stages**, not just what it is about.
   Salary's classifier flipped between two stages on the same input until those descriptions said
   "prospective employer" versus "already work there".
2. **`scripts/scenarios/area-01.mjs`** — four fixed conversations plus a slot 05 the agent rewrites
   each run. Five turns each, always.

Then register the file in `AREA_FILES` in `scripts/coach-local.mjs` — there are commented
placeholders for areas 1 and 6 already.

---

## TWO KINDS OF CHANGE — read this before reusing any of it

Everything below divides into two piles, and they have different lifespans. One is about **what
this bot knows and how Otema sounds** — it dies if you change persona or subject. The other is
about **how any LLM-grounded coach gets an answer out** — it transfers to every area you build
next, and to other bots entirely.

Worth separating because the second pile is where the reusable engineering is, and because it is
much larger than it looks from the log below.

---

### A · Specific to this bot — content, voice, subject

These are BSC's and Otema's. They do not transfer.

| What | Where | Why it is specific |
|---|---|---|
| **`BOTEMA_VALUES`** | `botema-examples.ts` | Otema's identity, BSC's stated values, the Ghanaian and African context. Meaningless for another persona |
| **Salary knowledge rewritten for African markets** | `bsc-knowledge.ts` | Removed UK disclosure law and `£` examples; added local-vs-remote pricing and currency instability. Wrong for a UK bot |
| **The ten discussion areas** | storyboard | Derived from BSC's own 57 training questions |
| **Salary's three stages (A/B/C)** | `coach-local.mjs` | Situational stages that fit *salary*. Confidence almost certainly needs different ones — that is why it is scaffolded as a test |
| **26 drafted answers + the review gate** | `botema-generated-examples.ts` | Otema's voice, awaiting Otema's approval |
| **Chataki parked** | `index.ts`, widget | A product decision about this product |

**One borderline case worth arguing about.** `STAND_WITH_HER` — validate a woman's experience of
discrimination with a documented fact *before* advising — reads as BSC-specific, and its content is.
But the underlying move is general: **when a user reports something the evidence says is common,
say so before you coach them through it.** Any bot serving people who are routinely disbelieved
needs that, with different evidence. Treat the constant as specific and the pattern as portable.

---

### B · General — how to get a bot to answer well

These came out of this bot but are not about it. Reuse them.

**Making the answer trustworthy.** Every one exists because the model asserted something it could
not know:

- `stripUnsourcedFigures` — no figure, and no claimed source, without grounding
- `stripImplausibleFigures` — reject an outlier or a second currency; there is no conversion rate
- `stripImplausiblePeriods` — a monthly figure reported as annual is a wrong answer, not a typo
- Grounding must be **returned**, not merely **attempted** — a search with zero citations is not
  grounding, and treating it as such reopened the exact hole the guard was built to close

**Making the answer readable.** All three were instructions first, and all three failed:

- `capParagraphs` → `capSentences` — the second exists because the first only saw blank lines
- `flattenInlineList` — told not to write a list, the model wrote one inline with dashes
- `PLAIN_LANGUAGE` + a jargon-density check — monitored rather than rewritten

**Making it a conversation rather than a lookup.** The most transferable group, and the one nobody
would think to build up front:

- **Retrieve against the whole conversation, not the latest message.** "I asked twice and got
  nothing" pulled *how to ask for a raise* for someone who had already been offered one
- **The examples are the nearest material, not necessarily the right material.** If her situation
  has moved past them, answer her and let the examples inform only the voice
- **Rotate what you inject.** The same top-scoring example every turn makes the bot re-derive the
  same advice in fresh words
- **A new fact must change the answer**, not decorate it
- **Do not repeat yourself** — checked on openers *and* on content-word overlap

**Knowing when to stop, or leave.**

- Leaving detection in three layers: the classifier, an explicit phrase check that runs first, and
  a stall counter — because one layer never holds on a small model
- Stall keyed on *the user adding nothing*, never on the topic repeating: several productive turns
  on one subject is the normal case
- Who closed the conversation decides how it closes. If she said "something else", follow her —
  summarising what she covered reads as a chair closing an agenda item

**Search discipline** — most of it is about restraint:

- Search only where the fact genuinely varies by time and place. Three facets of fifteen
- **Cap the tool calls.** Measured: 10 searches / 69s uncapped versus 1 search / 29s capped, same
  citations. An *instruction* to search once was worse than the parameter
- Never search on a parameter the user did not give. The classifier invented `location:
  "unspecified"` and searched three times for it — the fix is requiring the place to appear in
  **her own words**, not a longer blocklist of invented ones
- Say something while it runs. Thirty seconds of silence reads as a hang
- Prefer surveys over a single employer's recruitment marketing

**Honesty about capability.** `NEVER_OFFER_TO_ACT` — the coach cannot call, email, read a document
or follow up. Any chat-only assistant needs this, and the reason is not pedantry: a bot that appears
to promise contact and never makes it is worse than one that never offered.

---

### The one lesson underneath most of section B

**When an instruction fails twice, write the check instead of rewording it a third time.**

| What kept failing | The check that fixed it |
|---|---|
| Hedging across tracks | `extractEnumeratedOptions()` |
| "Keep it short" | `capParagraphs()`, then `capSentences()` |
| "Never write a list" | `flattenInlineList()` |
| "Be sceptical of outliers" | `stripImplausibleFigures()` |
| "Never convert the pay period" | `stripImplausiblePeriods()` |
| "Only use a location she gave" | `mentionedByUser()` |

Six times. Rewording is cheap and feels like progress; it has not once been the thing that worked.
The corollary is that **a prompt rule you cannot test is a prompt rule you should not rely on** —
which is why every one of these has unit tests, and why the scenario checks assert claims rather
than being read by eye.

---

## 2026-08-15 — A real citation for a number nobody gets

David spotted this reading a transcript. Asked about remote work for a European company, the coach
answered a Lagos developer with:

> ...they anchor around NGN 1,927,160 per year (Glassdoor, 2026). For fully remote roles with a
> European company, there are higher anchors like **USD 200,000 per year (Crossover, 2026)**.

Crossover advertises headline rates as a recruitment hook. Nobody in that market is paid it, and a
European developer might be on EUR 60,000. Presented beside a Nigerian salary survey as a comparable
"anchor", it invites someone into a negotiation with an expectation that will damage them.

**Why this one is worth studying.** Every individual step worked. The search found a real page. The
citation was genuine. The figure was transcribed accurately. Nothing malfunctioned — the failure was
entirely one of *judgment*: that a company's marketing is not a market rate, and that a Lagos salary
and a US-benchmarked remote rate are not comparable numbers. This is the class of error guards can
blunt but never remove, and it is the strongest argument for Otema reviewing anything that reaches a
user.

### Three layers, and why the third exists

1. **Search brief** — prefer salary surveys and aggregators; explicitly avoid a single employer's own
   recruitment pages.
2. **Summarise rule** — if one figure is several times the others, name it as a headline rate from
   one employer rather than presenting it as an anchor.
3. **A code check**, because 1 and 2 are instructions. `stripImplausibleFigures()` in `converser.ts`
   drops a figure in a second currency (there is no conversion rate available, so the two are not
   comparable) or one more than 5× the smallest in the same currency. Six tests, including this exact
   example.

Note that this check runs **even when the answer is grounded**, unlike the invented-figure guard
which steps aside for real data. A genuine citation attached to an unreachable number is precisely
the case that needs catching.

### The pattern worth taking from this

**When an instruction fails twice, write the check instead of rewording it a third time.** That has
now happened four times in this coach:

| What kept failing | The check that fixed it |
|---|---|
| Hedging across tracks | `extractEnumeratedOptions()` (ISSUE-005) |
| "Keep it short" | `capParagraphs()`, then `capSentences()` (ISSUE-006, ISSUE-020) |
| "Never write a list" | `flattenInlineList()` — it complied with the letter and wrote one inline |
| "Be sceptical of outliers" | `stripImplausibleFigures()` |

Rewording is cheap and feels like progress. It has not once been the thing that worked.

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
