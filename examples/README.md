# Coach scenario sweep

Five conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Salary & Negotiation · last run **2026-08-15 17:12 UTC** — regenerate with `npm run coach:scenarios -- --area=salary`._

**0 of 5 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [A nurse moving into health tech, offered far too little](01-career-changer-lowballed.md) | Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point. | fail — reads the offer as a mismatch, not her worth; values her clinical background rather than discounting it; every reply ends on a question; no two replies open the same way; no reply stacks more than two jargon terms; no reply mostly restates the one before it |
| 02 | [She resigned and they suddenly found the money](02-counter-offer.md) | Stage C throughout, and asks why the number only appeared once she was leaving. | fail — questions why the money appeared only now; treats money as not the whole reason; every reply ends on a question; no two replies open the same way; no reply stacks more than two jargon terms; no reply mostly restates the one before it |
| 03 | [A foreign employer insisting on local currency](03-paid-in-local-currency.md) | Negotiates the mechanism — review interval, pegging — rather than arguing about the currency itself. | fail — reaches the mechanism, not just the currency; takes the currency worry seriously; every reply ends on a question; no two replies open the same way; no reply stacks more than two jargon terms; no reply mostly restates the one before it |
| 04 | [Told to wait for the review cycle, for the second year running](04-fobbed-off-twice.md) | Stage C. Recognises a pattern rather than repeating last year's advice. | fail — names the repetition as information about them; does not treat raising it as complaining; every reply ends on a question; no two replies open the same way; no reply stacks more than two jargon terms; no reply mostly restates the one before it |
| 05 | [A recruiter asking what she is currently on, before any offer exists](05-current-salary-demand.md) | Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is. | fail — never tells her to state a salary she is not on; no two replies open the same way |

## What this does and does not cover

Covered: stage classification across A, B and C; all three leaving layers; the
invented-figure behaviour; and that answers end on a question.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed.

Nothing here writes to a database. State is in memory and discarded per run.
