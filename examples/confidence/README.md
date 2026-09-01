# Coach scenario sweep

10 conversations run through `scripts/coach-local.mjs` against live Azure (`gpt-5-nano`), five turns each.
Each exists to test one claim the storyboard makes about the area model.

_Confidence & Imposter Syndrome · last run **2026-09-01 12:08 UTC** — regenerate with `npm run coach:scenarios -- --area=confidence`._

**7 of 10 scenarios passed all checks.**

| # | Scenario | Tests | Result |
|---|---|---|---|
| 01 | [Feeling like she doesn't belong, then naming a promotion she hasn't applied for](01-belonging-to-a-stalled-decision.md) | Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real. | pass |
| 02 | [What looks like belonging-doubt turns out to be being talked over as the only woman on the team](02-not-imposter-syndrome-its-the-room.md) | Reaches for S1a once the structural pattern is named — validates it as documented rather than coaching it as a confidence deficit, and asks what she wants to do about the specific pattern rather than how to feel more confident. | pass |
| 03 | [Wants to work on speaking-up confidence, until it turns out one specific meeting is the problem](03-one-specific-meeting.md) | Starts in stage B (a stalled action — speaking up), and once she narrows it to a specific, repeated pattern in one meeting, draws on S3a rather than continuing to coach it as a general confidence skill. | pass |
| 04 | [Doesn't believe positive feedback and never counts her own wins either](04-cant-take-a-compliment.md) | Stays in stage A while nothing is named as stalled, and gives a concrete practice (writing wins down, naming what was actually said) rather than just reassurance that she's good enough. | fail — never stacks two questions into one ending |
| 05 | [Self-taught among CS graduates, quietly convinced she was hired to make a number](05-bootcamp-hire-who-suspects-she-was-a-quota.md) | Stays in stage A throughout — nothing is stalled, only a belief being carried — and answers the legitimacy-of-the-hire doubt with what she has actually built rather than with a credential to go and get, or with a flat reassurance that the worry is imaginary. | pass |
| 06 | [Talks herself into asking for different work, then agrees and closes the conversation](06-lands-the-plan-and-stops.md) | Reaches stage C once she is agreeing rather than asking, and the wrap-up reply says the plan back and checks it rather than adding a further step — short, one light check, nothing new introduced on the last turn. | fail — never stacks two questions into one ending; no reply mostly restates the one before it |
| 07 | [One visible mistake would prove she doesn't belong](07-terrified-of-getting-it-wrong-in-public.md) | Stays in stage A and draws on G5, treating the fear as perfectionism rather than a realistic forecast — without promising her she won't get anything wrong, and without a list of preparation rituals. | pass |
| 08 | [Already promoted to lead, now doubting every call she makes](08-promoted-and-second-guessing-everything.md) | Draws on G8 rather than S4, and treats the doubt as post-decision second-guessing — advice about a decision she is sitting on now, not about whether to put herself forward. | pass |
| 09 | [Convinced a technical interview will expose her, then starts asking about the format](09-technical-interview-found-out.md) | Draws on G9 while the subject is the fear, and once she turns to how the interview itself is run, either hands off to Interview Preparation or answers without pretending the fear is still the question. | pass |
| 10 | [Does not want a plan, and it turns out the block is her body, not her belief](10-just-needed-to-vent-then-its-physical.md) | Reads the request to be heard rather than steered (G3) without immediately proposing an action, and once she describes a physical response, draws on S3c rather than offering more speaking technique. | fail — at least one ending is a light check she can answer with yes or no |

## What this does and does not cover

Covered: stage classification across A, B, C; the leaving
layers; how replies open and end; and that the coach does not repeat itself.

Not covered: whether the *advice* is good. These check shape and routing, not
quality — that judgment belongs to Otema, and the drafted answers behind many of
these replies are still unreviewed. A scenario passing does not mean the
conversation went well — read the transcript.

Nothing here writes to a database. State is in memory and discarded per run.
