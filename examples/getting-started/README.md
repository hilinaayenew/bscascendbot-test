# Coach scenario sweep

Five conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Getting Started · last run **2026-08-27 14:39 UTC** — regenerate with `npm run coach:scenarios -- --area=getting-started`._

**1 of 5 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Can't settle between data and UX, hasn't built anything in either](01-torn-between-fields.md) | Stays in stage A throughout — still deciding, not yet executing — and pushes toward trying something small rather than more thinking, without ignoring that she has little time to try both properly. | pass |
| 02 | [A teacher switching in purely for stability, not passion](02-money-motivated-career-changer.md) | Deliberately probes the A/B boundary: a named prior career (teacher) should place her in stage B even while she's also unsure what to pick — the prior career is what distinguishes B, not field-certainty. Doesn't moralise about a purely financial motivation, values her teaching background, and reaches stage D once she asks a concrete timeline question. | ERROR |
| 03 | [An 8-week bootcamp promising a job, wanting $6000 upfront](03-bootcamp-legitimacy.md) | Flags the too-good-to-be-true timeline, asks for real outcome evidence rather than trusting the bootcamp's own stats, and stays practical rather than alarmist. | ERROR |
| 04 | [Full-time job, two kids, maybe an hour a day](04-constrained-runway.md) | Treats self-teaching plus one protected hour a day as a real, respected plan rather than discouraging her or suggesting money/time she doesn't have. | ERROR |
| 05 | [Doesn't know what she'd enjoy, has never tried any of it](05-no-clear-interest-yet.md) | Doesn't just repeat 'what draws you to it' a second way — gives her the smallest possible concrete first action instead of asking her to introspect further. | ERROR |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
