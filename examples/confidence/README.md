# Coach scenario sweep

Five conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Confidence & Imposter Syndrome · last run **2026-08-23 19:21 UTC** — regenerate with `npm run coach:scenarios -- --area=confidence`._

**4 of 5 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Feeling like she doesn't belong, then naming a promotion she hasn't applied for](01-belonging-to-a-stalled-decision.md) | Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real. | pass |
| 02 | [What looks like belonging-doubt turns out to be being talked over as the only woman on the team](02-not-imposter-syndrome-its-the-room.md) | Reaches for S1a once the structural pattern is named — validates it as documented rather than coaching it as a confidence deficit, and asks what she wants to do about the specific pattern rather than how to feel more confident. | pass |
| 03 | [Wants to work on speaking-up confidence, until it turns out one specific meeting is the problem](03-one-specific-meeting.md) | Starts in stage B (a stalled action — speaking up), and once she narrows it to a specific, repeated pattern in one meeting, draws on S3a rather than continuing to coach it as a general confidence skill. | pass |
| 04 | [Doesn't believe positive feedback and never counts her own wins either](04-cant-take-a-compliment.md) | Stays in stage A while nothing is named as stalled, and gives a concrete practice (writing wins down, naming what was actually said) rather than just reassurance that she's good enough. | pass |
| 05 | [A lead role just opened up, and she's already decided not to put her name forward](05-turned-down-the-last-one-too.md) | Classifies as stage B — a decision, not just a feeling — and redirects from the feeling to a concrete, testable action rather than either pushing her to apply outright or simply validating the avoidance. | fail — redirects to a concrete, testable action rather than resolving readiness first |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
