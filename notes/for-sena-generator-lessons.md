# Notes for Sena — what the BSC coach work teaches us about Storyboard-Generator

A running log of places where hand-editing the BSC coach storyboard ran past what
`Storyboard-Generator` can express or produce. Each entry is a candidate change to the tool, not a
change already made. Newest at the top.

Context: the BSC AI Career Coach (`bscascendbot-test`) has a `storyboard.html` in the generator's
house style. Working on it over two days surfaced limits that are general, not specific to this bot.

---

## WHERE THIS STANDS — 15 August 2026

Seven findings, all still open as candidate changes. **Nothing has been changed in the generator** —
this is a list of requirements, not a changelog.

### The single biggest one

**The tool's flow vocabulary is inherited from deterministic software, and most conversers aren't.**
`flows[].steps` is a linear list of typed steps, `capabilities` is a trigger-to-function table,
`conversationStates` is a chain. Every primitive presumes the same thing: this input causes that
step causes that output.

So when we specified what happens inside a discussion area, every shape available to us presumed a
route — and we produced one, a fifteen-node facet graph with explicit edges. It rendered beautifully
in the house style. It was also wrong, and it took the person who knows the architecture to say that
everything inside an area is wordalisation-driven. The correct design has no routing at all:
classify into a stage, let the stage scope which examples are injected, let the model do the rest.

**A generic-codebase run would have shipped the wrong one.** That is the finding I would act on
first. For a converser whose branches are the model's judgment, drawing those branches is not merely
unhelpful — it implies a control nobody has.

### The seven, in the order I would fix them

| # | Finding | Cheapest useful change |
|---|---|---|
| 1 | Flow vocabulary assumes determinism | A retrieval-scoped flow type: classify → inject → generate |
| 2 | `conversationStates` is a straight line, and is never even *asked* about | Optional `entryTrigger` / `exitTrigger` / `reentry`, plus an O6-adjacent question about state shape |
| 3 | Provenance is tracked, coverage is not | Where answers are keyed to questions, render matched/total and list the gaps |
| 4 | `origin: synthetic` is file-level where per-item is needed | Allow per-item origin, or a `mixed` source carrying a breakdown |
| 5 | Synthetic content implies a review loop the tool can't draw | Let a source declare its reviewer, states, and promotion destination |
| 6 | Status vocabulary exists for pages, not for states / flows / capabilities | Extend the existing enum rather than inventing a second one |
| 7 | Regeneration would silently destroy hand edits | Refuse to overwrite a `storyboard.html` that has no matching config |

### Two that are cheap and independently useful

**(2) and (7).** The state-shape question costs one `AskUserQuestion`, and would have stopped this
project carrying an unexamined two-state diagram through three versions — it was never chosen, it
was the default that follows from "does this need data before it can answer?". The regeneration
guard is a few lines and prevents a whole class of silent loss.

### What this project built instead, for reference

Where the tool couldn't express something, we hand-rolled it. Each of these is a workaround worth
reading as a requirement:

- LIVE / CHANGED / PROPOSED badges with bespoke CSS, because status exists only on `pages`
- Sub-tabs inside a tab, because one page per discussion area has nowhere to live
- A separate file plus per-entry `reviewStatus`, because `origin` is per-source
- A coverage map rendered as cards, because the graph vocabulary would have implied routing

### One caveat on all of it

These findings come from a single converser, and a distinctive one — a named real person's voice, an
audience the tool doesn't otherwise serve, and an architecture (Vivid Insights Converser) the
generator was partly modelled on already. Worth testing against Ask-Afya or Kujenga before treating
any of it as general.

---

## 2026-08-15 — the tool draws deterministic flows, and this converser doesn't have any

**The finding.** We specified an in-area conversation model twice. The first version was a
fifteen-node facet graph with explicit edges — S1 leads to S2, S2 leads to S3 — and it rendered
beautifully in the storyboard's flow vocabulary. It was also wrong. The second version has no
routing at all: one classification call places the user in a stage, the stage scopes which examples
get injected, and the model writes the reply. Structure without a route.

**Why the tool pushed us toward the wrong one.** `flows[].steps` is a linear list of typed steps,
`overview.capabilities` is a trigger-to-function table, and `conversationStates` is a chain. Every
primitive the schema offers describes *deterministic* behaviour: this input causes that step causes
that output. So when we sat down to specify what happens inside an area, the shapes available to us
were all shapes that presume a route — and we produced one, and it took the person who knows the
architecture to say "no, everything in here is wordalisation-driven".

That is a schema quietly making an architectural argument.

**What was actually needed** was a way to say: *this content is grouped like so, the grouping scopes
retrieval, and the model decides everything else.* There is no vocabulary for that. Closest is
`dataSources`, but it describes provenance rather than how material is selected at run time.

**Candidate changes:**

1. Add a **retrieval-scoped** flow type — one whose steps are "classify into N buckets", "inject
   the bucket's material", "generate" — as a first-class alternative to a routing flow. Most
   LLM-grounded conversers are this shape, and none of them are the shape the tool currently draws.
2. Let a flow step be marked non-deterministic, so a diagram can distinguish "the code decides this"
   from "the model decides this, and here is what it was given". Ours mixes both and the rendering
   can't tell them apart.
3. Consider whether the storyboard should show what grounds an answer — which examples, which
   knowledge — since for a wordalisation converser that is the *only* thing anyone controls. The
   prompts tab shows the instruction and the data-sources tab shows the corpus, but nothing shows
   the selection between them.

**The wider point for Sena:** the tool's flow vocabulary is inherited from deterministic software,
where a diagram of the branches is a faithful description. For a converser where the branches are
the model's judgment, drawing them is not just unhelpful — it is actively misleading, because it
suggests control that nobody has. Ours was drawn, reviewed, and only caught because a human knew
better. A generic-codebase tool would have shipped it.

## 2026-08-14 — synthetic content implies a review loop, and the loop is a flow the tool never draws

**What we decided in the project.** The AI-drafted answers now sitting in
`botema-generated-examples.ts` are staging, not a destination. They'll be presented in a **response
reviewer** — a contributor-facing screen where the real person whose voice it is reads each draft
and approves, edits, or rejects it. Anything she approves or edits gets **promoted into the genuine
answers file** and stops being generated material. Rejected drafts stay behind as a record of what
she didn't want said in her voice.

**The observation for the tool.** The generator can already say a data source is `synthetic` and
that `reviewRequired: true`. What it can't express is what happens next. Review isn't an attribute
of a data source — it's a *process* with states, a human actor, and an outcome that changes the
source. The tool models conversation flows in detail and doesn't model this flow at all, even though
it's the flow that determines whether the converser's grounding is trustworthy.

Concretely, none of this is currently expressible in a storyboard:

- who reviews the material, and on what screen
- what states a draft moves through, and which of them are servable
- where approved material ends up, and that it stops being synthetic when it gets there
- how much of a source is still pending review

**Candidate changes:**

1. Let a `synthetic` data source declare a review workflow: reviewer, states, and the destination
   material is promoted into. Render it as a flow diagram — it's the same shape as everything
   already on the Function Flows tab.
2. Treat "promoted" as a real provenance transition. `origin` is currently a fixed property; here
   it genuinely changes, and a storyboard that can't show material moving from synthetic to real
   will drift out of date the moment the first review round happens.
3. Consider whether reviewer screens belong in the `pages` inventory. The Persona Voice Kit in this
   project's ISSUE-003 is exactly such a screen, and it exists to serve the data sources — but
   `pages` and `dataSources` are unconnected in the schema, so nothing links a review screen to the
   material it governs.

**Why this generalises beyond one bot.** Any converser grounded in a named person's voice, or in
expert-authored content, will eventually generate material to fill gaps — the pressure to do so is
structural, because real people answer a fixed set of questions once and users ask an open-ended
set forever. The moment that happens, the project needs a review loop, and the storyboard needs to
be able to describe it. Better for the tool to anticipate that than for each project to invent its
own staging file and conventions, as we just did.

## 2026-08-14 — `origin: synthetic` was right, but it's a file-level flag where a per-item one is needed

**Where the tool got there first.** `dataSources[].origin` already has `synthetic`, described as
"AI-generated placeholder that needs human review before going live," with `reviewRequired: true`
triggering a review banner. That is exactly the distinction we needed today, and SKILL.md Step 1 is
right to say "don't silently present placeholder content as finished." Good instinct, already in
the tool.

**Where it didn't stretch.** We ended up with a source that is *neither* wholly real nor wholly
synthetic: a persona whose voice examples are a real person's words, plus a growing set of
AI-drafted answers written in her voice to cover gaps she never answered. `origin` is a property of
the whole data source, so it can't say "these 54 are real and those 4 are drafted."

We solved it in the project by splitting into two files — a real pool and a generated pool, with a
per-entry `reviewStatus` (`unreviewed` / `approved` / `edited` / `rejected`) and a reader that only
ever returns approved items. Two files is a blunt fix, but it makes the boundary impossible to blur
by accident, which mattered more here than elegance: the persona is a real, named person, and this
project already has a logged incident (ISSUE-002) of invented examples drifting into her real set.

**Candidate changes:**

1. Allow `origin` per item, or let a data source declare `mixed` and carry a breakdown. The
   storyboard should be able to say "54 real, 4 drafted, 0 approved" rather than picking one label
   for the whole file.
2. Model the review *state*, not just the review *requirement*. `reviewRequired: true` says
   something needs looking at; it can't say how much of it has been looked at. A count of
   approved-versus-pending is the number a project lead actually wants on the page.
3. Consider whether "synthetic content in a real person's voice" deserves naming as its own
   category. It's a sharper risk than generic placeholder text — the failure mode isn't
   "unreviewed filler shipped," it's "we put words in a named person's mouth." Ask-Afya has the
   same exposure if it ever quotes a real clinician.

**Related idea worth watching for generality:** the project also wants to *generate* new
question/answer pairs while a user is inside a discussion area, expanding an area beyond the fixed
question bank it was seeded from. If that works, "coverage" stops being a fraction of a fixed
denominator and becomes a real core plus a growing reviewed layer — which would change what the
coverage rendering suggested in the entry below should actually display.

## 2026-08-14 — the tool tracks provenance but not coverage

**The finding.** `dataSources[].origin` records *where* material came from
(`pre-existing / synthetic / planned / newly-wired-up`) and `reviewRequired` flags what needs human
review. Both are about trustworthiness. Neither says whether the material is *complete*.

We asked a simple question of the BSC coach — "do we have sample answers for the training
questions?" — and the storyboard couldn't answer it. It reported "54 voice examples, source-traced"
and "0 rows, pending real voice", which sounds like full coverage for one persona and none for the
other. The real picture needed a script: 52 of 57 questions answered, and all five gaps concentrated
in a single discussion area, which runs on 3 examples for 7 questions.

A reader of that storyboard would have had no way to see the concentration. "54 examples" reads as
comprehensive.

**Why it generalises.** Any converser grounded in a question bank plus authored answers has this
shape, and the interesting number is never the total — it's *which* questions are unanswered and
whether the gaps cluster. Clustered gaps are the dangerous kind: they mean one whole subject is
thin, which is invisible in an aggregate count.

**Candidate change:** where a data source is a set of answers keyed to a set of questions, compute
and render coverage rather than a bare count — matched / total, plus the unmatched items listed, and
a per-area breakdown if areas exist. The generator already reads these files during Step 1
discovery, so it has both sides in hand; it just doesn't compare them.

**Smaller related observation:** the topic tags in `botema-examples.ts` don't all correspond to
`KNOWLEDGE_BASE` keys — `belonging`, `confidence`, `motivation`, `general` appear as tags but aren't
topics. In this case that's benign (they're `challenge_type` values on a different function), but a
tool that cross-checked tag vocabularies against the canonical list would catch the cases where it
isn't benign.

## 2026-08-14 — conversation states can only be a straight line

**The finding.** We wanted a model where a conversation *enters* a discussion area, *stays* in it
across several exchanges, then *leaves* it deliberately and opens another — with the closed area
remembered so returning resumes rather than restarts. The generator cannot represent this.

Evidence, both halves of the pipeline:

- **Schema.** `overview.conversationStates[].transitionTrigger` is defined as "what causes the
  conversation to move FROM this state to the next one… Omit on the final state." One forward edge
  per state, terminating.
- **Renderer.** `template/shell.html:349-368` walks the array and emits a forward `→` between
  consecutive states only. No back-edges, no loops, no re-entry — it's hardcoded to a chain.
- **Flows.** `flows[].steps` is a flat list too — no branching, no conditionals. The `kind` enum
  does include `state-change`, which is the nearest existing primitive but only labels a step.

**The sharper finding — states are never actually asked about.** SKILL.md O6 doesn't surface state
shape as a design decision. If the converser needs a data point up front, it *auto-generates* a
fixed two-state diagram (`STATE 1 · No data yet` → `STATE 2 · Data provided`); otherwise it omits
`conversationStates` entirely. So the two-state flow isn't a choice anyone made — it's a default
that follows from "does this need data before it can answer?"

This is the part worth Sena's attention. The BSC storyboard carried that two-state diagram through
three versions without anyone questioning it, because it never presented itself as a question. A
tool that generates a plausible default silently is harder to correct than one that asks.

**Candidate changes:**

1. Give `conversationStates` optional `entryTrigger`, `exitTrigger` and `reentry` fields, so a
   state can be a *place* the conversation occupies rather than a *step* it passes through. Render
   return edges when they're present, keep the current linear rendering when they aren't — backward
   compatible with every existing storyboard.
2. Add an `areas` concept (or a `grouping` on capabilities): a named subject the conversation can
   be inside, with the questions/facets belonging to it. We derived nine areas by grouping 57
   training questions; that grouping step seems generally useful for any converser with a question
   bank.
3. Add an O6-adjacent question that asks about state shape directly, with the current two-state
   pattern as one suggested option rather than the silent default. Suggestions could be: "one-shot
   Q&A, no states", "needs data first (two states)", "moves between subject areas", "guided
   multi-step process".

**Priority note:** (1) and (3) are cheap and independently useful. (2) is only worth it if more
than one converser needs it — but Ask-Afya and Kujenga sit in the same folder and are plausibly
in the same shape.

## 2026-08-14 — status vocabulary exists, but not where a spec needs it

**The finding.** We needed to mark parts of the storyboard as aspirational, because the document
shifted from *describing* the bot to *specifying* it. The generator has this concept — but only in
two places:

- `pages[].status` — enum `done / in-progress / placeholder / planned`
- `dataSources[].origin` — includes `planned`; `reviewRequired: true` triggers a review banner

There's no status field on `conversationStates`, `flows`, or `overview.capabilities` (the routing
table) — exactly the sections a design spec needs to mark up. We hand-rolled `LIVE / CHANGED /
PROPOSED` badges with bespoke CSS to fill the gap.

**Candidate change:** extend the existing `status` enum to states, flows and capabilities rather
than inventing a second vocabulary. Our three labels map onto the existing words well enough —
`done` ≈ LIVE, `planned` ≈ PROPOSED — with a gap around CHANGED, meaning "exists but should behave
differently." That distinction is worth a word of its own in a spec document; `in-progress` doesn't
quite carry it.

**The larger question behind it:** the tool currently assumes a storyboard *describes* a converser.
Ours became a *request* for one. That's arguably a mode, not a field — a storyboard someone builds
from, versus a storyboard that documents what exists. Worth deciding deliberately, because it
changes what "regenerate" should mean.

## 2026-08-14 — regeneration would silently destroy hand edits

**The finding.** `bscascendbot-test` has a `storyboard.html` in the generator's style but **no
`.storyboard-config.json`**. Step 0 loads prior state from that file, and Step 6's diff-aware
regeneration depends on it. Without it, a re-run reads as a first run and writes a fresh
`storyboard.html` over the top. Every hand-written section we added would be gone.

The failure is quiet: the tool is doing exactly what it should, and the output looks right.

**Candidate changes:**

1. Before writing `storyboard.html`, check whether one already exists *without* a matching config,
   and stop to ask rather than overwriting. Cheap guard, prevents a whole class of loss.
2. Consider whether hand-edited sections should survive regeneration at all — either a marked
   region the tool won't touch, or an explicit "this file has diverged, here's the diff" report
   consistent with Step 6's stated philosophy of reporting plainly rather than regenerating
   silently.

**Immediate mitigation for this repo:** either drop a `.storyboard-config.json` marker so
regeneration is deliberate, or accept that `storyboard.html` here is now hand-maintained and out of
the tool's care. Not yet decided.
