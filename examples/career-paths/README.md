# Coach scenario sweep

Five conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Career Paths & Roadmaps · last run **2026-08-23 19:23 UTC** — regenerate with `npm run coach:scenarios -- --area=career-paths`._

**4 of 5 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Doesn't know enough about any field to compare them, then settles on data science](01-torn-between-fields-then-picks-one.md) | Stays in stage A while no field is named, reaches stage B once data science is picked, and doesn't let 'no technical background' derail the roadmap once she's named a field. | pass |
| 02 | [Wants a cybersecurity path with zero IT background, and thinks 'ethical hacker' is the entry job](02-cybersecurity-from-scratch.md) | Stays in stage B throughout — the field is named from turn one — and corrects the 'ethical hacker as day-one job' assumption rather than going along with it. | fail — classified stage B throughout |
| 03 | [A backend engineer wants to move into product management with no formal PM experience](03-engineer-to-product-manager.md) | Draws on S5 (the PM roadmap) rather than S7 (PM as a career CHANGE into tech project management, a different question), since she's already in tech and moving sideways within it. | pass |
| 04 | [Wants into cloud/DevOps, already has a little Python, needs a platform and a timeline](04-cloud-devops-with-some-scripting.md) | Draws on S6 (cloud/DevOps roadmap), and treats the existing scripting knowledge as a real head start rather than starting the roadmap from zero. | pass |
| 05 | [Wants UX/UI steps, hasn't designed anything, building for cheap phones and slow internet](05-uxui-for-low-bandwidth-markets.md) | Draws on S3 (UX/UI roadmap) and picks up the low-bandwidth/mobile-first African-market detail rather than giving a generic portfolio answer that ignores it. | pass |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
