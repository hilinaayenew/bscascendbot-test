# Coach scenario sweep

Three conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

**3 of 3 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [What does this role actually pay?](01-market-rate.md) | The W-marked path: searches the live web, cites sources, and holds up when pushed for a number it can't source. | pass |
| 02 | [A colleague earns more for the same job](02-pay-gap.md) | Stage C held across five turns, including the awkward turn about how she found out. | pass |
| 03 | [An offer weighted towards equity](03-equity-offer.md) | Stage B throughout, works through the equity material, and keeps moving rather than repeating itself. | pass |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
