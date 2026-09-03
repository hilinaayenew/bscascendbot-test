# Coach scenario sweep

6 conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Getting Started · last run **2026-09-03 10:35 UTC** — regenerate with `npm run coach:scenarios -- --area=getting-started`._

**5 of 6 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Can't settle between data and UX, hasn't built anything in either](01-torn-between-fields.md) | Stays in stage A throughout — still deciding, not yet executing — and pushes toward trying something small rather than more thinking, without ignoring that she has little time to try both properly. | fail — most replies still end on a question |
| 02 | [A teacher switching in purely for stability, not passion](02-money-motivated-career-changer.md) | Deliberately probes the A/B boundary: a named prior career (teacher) should place her in stage B even while she's also unsure what to pick — the prior career is what distinguishes B, not field-certainty. Doesn't moralise about a purely financial motivation, values her teaching background, and reaches stage D once she asks a concrete timeline question. | pass |
| 03 | [An 8-week bootcamp promising a job, wanting $6000 upfront](03-bootcamp-legitimacy.md) | Flags the too-good-to-be-true timeline, asks for real outcome evidence rather than trusting the bootcamp's own stats, and stays practical rather than alarmist. | pass |
| 04 | [Full-time job, two kids, maybe an hour a day](04-constrained-runway.md) | Treats self-teaching plus one protected hour a day as a real, respected plan rather than discouraging her or suggesting money/time she doesn't have. | pass |
| 05 | [41, rusty Python from years ago, worried she can't compete with 22-year-olds](05-too-old-mid-decision.md) | Probes the storyboard's own Leaving rule for this area — 'the blocker is self-doubt, not a decision ("I'm too old"), no amount of resource-listing or method advice touches a confidence problem, offer Area 6 instead' — raised mid-conversation, after a fact (some old Python exposure) that a resource-first answer would be tempted to just restate as if she were starting from zero. | pass |
| 06 | [Former admin assistant plans a bootcamp path, then agrees and closes](06-lands-the-plan-and-stops.md) | Reaches stage D with a concrete plan, then stage E once she's agreeing rather than asking — the wrap-up reply says the plan back and checks it rather than adding a further step, short, nothing new introduced on the last turn. | pass |

## What this does and does not cover

Covered: stage classification across A, B, C, D, E; the leaving
layers; how replies open and end; and that the coach does not repeat itself.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed. A scenario passing does not mean the
conversation went well — read the transcript.

Nothing here writes to a database. State is in memory and discarded per run.
