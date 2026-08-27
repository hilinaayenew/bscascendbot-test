# Coach scenario sweep

Five conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Mentorship · last run **2026-08-27 13:15 UTC** — regenerate with `npm run coach:scenarios -- --area=mentorship`._

**3 of 5 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Doesn't know anyone senior, wonders if a cold LinkedIn message is weird](01-finding-and-approaching-a-mentor.md) | Stays in stage A throughout — no mentor yet — draws on S1/S2, and steers away from cold-messaging toward a structured route rather than just answering 'no, go ahead and message them'. | pass |
| 02 | [Has a mentor already, but wants to know if she also needs a sponsor](02-mentor-vs-sponsor.md) | Draws on S4 and keeps the mentor/sponsor distinction clear (advice vs advocacy) rather than blurring the two together. | fail — most replies still end on a question |
| 03 | [Shows up to mentorship sessions without much to say](03-making-the-most-of-sessions.md) | Draws on S3 and pushes toward bringing initiative rather than just reassuring her that showing up with questions is enough. | pass |
| 04 | [Eight months into a mentorship, worried she isn't updating enough between sessions](04-long-term-relationship-maintenance.md) | Draws on S5 and names follow-through/regular updates as what builds the trust that eventually turns into sponsorship-like advocacy. | pass |
| 05 | [In the BSC mentorship programme but doesn't have a clear career goal yet](05-bsc-programme-no-clear-goal-yet.md) | Draws on S6 and reassures that being unsure is workable — tell the mentor directly — rather than treating the lack of a goal as a problem to fix before starting. | fail — treats being unsure as workable, not a blocker |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
