# Coach scenario sweep

Five conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Further Education · last run **2026-08-23 19:10 UTC** — regenerate with `npm run coach:scenarios -- --area=further-education`._

**4 of 5 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Weighing a master's against certifications, then settles on AI research](01-masters-vs-certification-then-picks-a-field.md) | Stays in stage A while no direction is chosen, moves to stage B once a field is named, and treats certifications as a real alternative rather than a lesser one. | pass |
| 02 | [A fresh graduate with zero work experience asks whether to do a master's now or later](02-masters-timing-fresh-graduate.md) | Draws on S4 (before-or-after timing) and recommends work experience first, per Otema's own stated experience, rather than defaulting to 'go straight into it'. | pass |
| 03 | [Wants scholarships, has weak savings, and also works full time](03-funding-and-balancing-full-time-work.md) | Stays in stage C throughout — both funding and balancing are logistics on an already-chosen path — and draws on both S6 and S7 rather than only answering the first question asked. | pass |
| 04 | [Wondering if a postgrad helps specifically in cybersecurity governance, and whether it helps with visas](04-cybersecurity-postgrad-and-visas.md) | Draws on S2 (which fields benefit from a postgrad) since the question is field-specific value, and picks up the visa angle rather than ignoring it. | pass |
| 05 | [Torn between a master's and certifications, money is tight, wants to get hired fast](05-cost-conscious-cert-vs-masters.md) | Stays in stage A throughout — nothing is chosen yet — draws on S5, and takes the cost/speed constraint as a real reason to lean toward certifications rather than defaulting to 'a degree is always better'. | fail — stays in stage A throughout |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
