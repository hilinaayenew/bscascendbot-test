# Feeling like she doesn't belong, then naming a promotion she hasn't applied for

_Run 2026-08-27 15:41 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I constantly feel like I don't belong in this field
  [stage A — She states a persistent feeling of not belonging, which indicates an internal confidence issue rather than a concrete action (like applying or speaking up).]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [drew on S1, G5, S2 — 2 Otema, 1 drafted]
  [voice only: S5, G9, G8, G1]

Botema
  You’re not imagining it—and you’re not alone. In tech across Africa,
  imposter feelings are real because the environment can undermine newcomers
  in concrete ways. What was the most recent moment that triggered this for
  you, and what one small step could you take this week to test your value (a
  quick comment in a meeting, a tiny contribution, or a chat with a mentor)?

  you > everyone around me seems so much more sure of themselves than I am
  [stage A — New expression of imposter feelings; it's a continuing comparison and insecurity about belonging.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S1, G7, G9 — 1 Otema, 2 drafted]
  [voice only: G1, S5a, G5, S5]

Botema
  That feeling is real and common—the room can make others look more certain
  than they are, and you’re not alone in noticing it. The practical fix is
  small, repeatable wins: pick one micro-contribution this week where you
  speak up or take ownership, and note what happened.

  you > there's actually a promotion open right now and I haven't put my name forward because of exactly this feeling
  [classification missing/invalid stage "undefined" — retrying once at double the token budget]
  [stage B — User reports self-doubt preventing applying for a promotion (concrete action not taken)]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: S3a, S3, G4, S3c]

Botema
  That’s real, and it’s exactly why so many capable women don’t push for what
  they deserve. I would always recommend you move forward with a tight plan:
  pick a deadline to apply this week, draft a short case for why you fit the
  role with 3–4 concrete impact bullets, and book a 15-minute chat with your
  manager to express interest and get feedback. What are the top 3 criteria
  this promotion is evaluating, and which of your recent results best map to
  those points?

  you > I keep telling myself I'm just not ready for it yet
  [stage B — User expressed self-doubt as the reason they haven't applied for the promotion, indicating action is stalled by imposter feelings (stage B).]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G2, G4, S3b — 0 Otema, 3 drafted]
  [voice only: S3, S3a, S4, S3c]

Botema
  That belief is the imposter story, not a real barrier—promotion readiness is
  proven by impact, not perfection.

  you > so what should I actually do
  [stage B — User asked for concrete steps to apply for a promotion blocked by imposter feelings.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G2, S3b, S3a — 0 Otema, 3 drafted]
  [voice only: S3, S3c, G4, S4]

Botema
  Do this now: identify the top 3 criteria the promotion will evaluate, map
  3–4 concrete outcomes from your recent work to those criteria, and draft a
  tight 150–200 word case with 3–4 impact bullets. What are the 2 bullets you
  already have that best map to the role, and who can you show them to for
  fast feedback before you submit?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    There is a promotion open right now. She hasn't put her name forward because of exactly this feeling.
  trying to do    She wants to apply for the open promotion. She hasn't yet because of the imposter feeling. She keeps telling herself she's not ready yet. She asked what she should actually do.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage A on the opening message
- PASS — reaches stage B once the stalled promotion is named
- PASS — does not dismiss or minimise the feeling
- PASS — names the decision as separate from the feeling by the end
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
