# Coach scenario sweep

6 conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Getting Started · last run **2026-09-01 08:08 UTC** — regenerate with `npm run coach:scenarios -- --area=getting-started`._

**4 of 6 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Can't settle between data and UX, hasn't built anything in either](01-torn-between-fields.md) | Stays in stage A throughout — still deciding, not yet executing — and pushes toward trying something small rather than more thinking, without ignoring that she has little time to try both properly. | pass |
| 02 | [A teacher switching in purely for stability, not passion](02-money-motivated-career-changer.md) | Deliberately probes the A/B boundary: a named prior career (teacher) should place her in stage B even while she's also unsure what to pick — the prior career is what distinguishes B, not field-certainty. Doesn't moralise about a purely financial motivation, values her teaching background, and reaches stage D once she asks a concrete timeline question. | pass |
| 03 | [An 8-week bootcamp promising a job, wanting $6000 upfront](03-bootcamp-legitimacy.md) | Flags the too-good-to-be-true timeline, asks for real outcome evidence rather than trusting the bootcamp's own stats, and stays practical rather than alarmist. | pass |
| 04 | [Full-time job, two kids, maybe an hour a day](04-constrained-runway.md) | Treats self-teaching plus one protected hour a day as a real, respected plan rather than discouraging her or suggesting money/time she doesn't have. | pass |
| 05 | [Only has a phone, no laptop, and no direction picked yet either](05-phone-only-no-computer.md) | Probes the seam between stage A (no direction settled) and where G6 actually lives (stage D, 'method decided'): she raises a phone-only access constraint before ever choosing — or even really discussing — a method, so this checks whether the coach still surfaces real, phone-usable next steps rather than either defaulting to laptop-based advice or refusing to engage until she's 'chosen a method' first. | fail — does not dismiss the phone-only situation as unworkable |
| 06 | [Former admin assistant plans a bootcamp path, then agrees and closes](06-lands-the-plan-and-stops.md) | Reaches stage D with a concrete plan, then stage E once she's agreeing rather than asking — the wrap-up reply says the plan back and checks it rather than adding a further step, short, nothing new introduced on the last turn. | fail — no reply mostly restates the one before it |

## What this does and does not cover

Covered: stage classification across A, B, C, D, E; the leaving
layers; how replies open and end; and that the coach does not repeat itself.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed. A scenario passing does not mean the
conversation went well — read the transcript.

Nothing here writes to a database. State is in memory and discarded per run.
