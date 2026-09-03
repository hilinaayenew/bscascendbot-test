# Feeling like she doesn't belong, then naming a promotion she hasn't applied for

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I constantly feel like I don't belong in this field
  [stage A — User expressed imposter feelings without an action; seeking empathy and next steps.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [drew on S1, G5, S2 — 2 Otema, 1 drafted]
  [voice only: G1, G7, S1b, G3]

Botema
  I would always recommend finding a mentor or a women-in-tech community you
  can lean on, and start logging one concrete win each week to ground your
  sense of progress. What moment or situation this week is making you feel you
  don’t belong the most?

  you > everyone around me seems so much more sure of themselves than I am
  [stage A — User expresses feeling of not belonging due to others' apparent confidence; this is a continuing confidence imposter feeling (stage A).]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on S1, G10, G7 — 1 Otema, 2 drafted]
  [voice only: G1, G5, G6, S5]

Botema
  I’d pull you toward two concrete steps: pick one low-stakes thing you can
  contribute this week (a small pull request, answering a question in a forum,
  or documenting a workaround you found) and ask for quick feedback from
  someone you trust. Then log one win from it and refer back to it when you
  doubt yourself. What’s one tiny thing you could contribute this week that
  would be visible to others?

  you > there's actually a promotion open right now and I haven't put my name forward because of exactly this feeling
  [stage B — Self-doubt is blocking them from applying for a promotion despite opportunity.]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [second question dropped — one per reply]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: S3a, S3, G4, S3c]

Botema
  A promotion bid isn’t a reward for being flawless; it’s an invitation to
  demonstrate how you’ve already moved the work forward and what you’ll
  deliver next. I’d propose you either draft a tight 1-page bid now (highlight
  your impact, how you’ve solved real problems, and the concrete outputs you’d
  drive in the new role) or, if you prefer, set up a 15-minute mentorship chat
  to shape the pitch with someone who can vouch for your impact. Which would
  you rather do?

  you > I keep telling myself I'm just not ready for it yet
  [stage B — Self-doubt is delaying applying for a promotion.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [drew on G2, G4, S3a — 0 Otema, 3 drafted]
  [voice only: S3, S3b, S4, S3c]

Botema
  Not ready is a feeling, not a decision proof.

  you > so what should I actually do
  [stage B — User is asking for concrete actions to move forward with a promotion despite self-doubt; seeking tactical steps to overcome inaction.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: G4, S3a, S3c, S3]

Botema
  Do the work in front of you, not the fantasy of being ready. Set a firm
  deadline for whichever you pick (this week).

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    A software engineer currently feeling uncertain about belonging in the field; she has not expressed specifics about tenure or location, and there is no salary information provided.
  trying to do    She wants to overcome self-doubt to pursue career advancement, including applying for the open promotion. The new barrier is she hasn’t put her name forward due to feelings of insecurity and not belonging. She has not yet tried submitting a formal promotion bid or seeking internal mentorship specifically for this opportunity.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage A on the opening message
- PASS — reaches stage B once the stalled promotion is named
- PASS — does not dismiss or minimise the feeling
- PASS — names the decision as separate from the feeling by the end
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
