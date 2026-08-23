# Feeling like she doesn't belong, then naming a promotion she hasn't applied for

_Run 2026-08-23 19:21 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I constantly feel like I don't belong in this field
  [stage A — User is expressing a core imposter-syndrome feeling (not belonging) without referencing a concrete action they are avoiding; it fits stage A.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [drew on S1, S2, S5 — 3 Otema, 0 drafted]
  [voice only: S1a, G1]

Botema
  You’re not imagining it—and it’s a real pattern many women in tech in Africa
  face, not a personal failing. The way forward is to anchor belonging with
  one small, concrete step: find a mentor or a women-in-tech circle, and do
  one low-stakes thing this week—like posting a quick note about what you
  learned or asking a question in a meeting. What would be the simplest step
  you can take this week to start feeling like you belong?

  you > everyone around me seems so much more sure of themselves than I am
  [stage A — User expresses comparison and feeling of not belonging/low confidence (imposter feelings) without concrete action yet.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S1, G1, S1a — 1 Otema, 2 drafted]
  [voice only: S2, S5]

Botema
  That feeling is real, and it’s a common pattern for women in tech to look
  around and think others are more sure of themselves. Confidence grows when
  you claim a small, visible moment. Which one feels safest for you to try
  first?

  you > there's actually a promotion open right now and I haven't put my name forward because of exactly this feeling
  [stage B — The user is not applying due to self-doubt; applying is the concrete action blocked by the feeling.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on G2, S4, S3a — 1 Otema, 2 drafted]
  [voice only: S3]

Botema
  I would always recommend you put your name forward for the promotion.
  Prepare a concise 3-bullet case of your impact that aligns with the role,
  and send a brief note to your manager asking for the process and a quick
  15-minute chat to discuss it. What is the simplest first step you can take
  today to move this forward—send the note with the bullets, or ask for the
  process details first?

  you > I keep telling myself I'm just not ready for it yet
  [stage B — User states self-doubt is preventing them from applying for a promotion (concrete action blocked by confidence concerns).]
  [no new information — stall 1/2]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G2, S4, S3 — 2 Otema, 1 drafted]
  [voice only: S3a]

Botema
  That “not ready” thought is a feeling, not a fact—and many women feel it
  right before stepping up.

  you > so what should I actually do
  [stage B — User is experiencing self-doubt and has stalled a concrete action (applying for promotion); the user asked for actual steps, which is a concrete action.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on G2, S4, S3a — 1 Otema, 2 drafted]
  [voice only: S3]

Botema
  Draft a brief note to your manager with three concrete impacts you’ve
  driven, show how they map to the role, ask for the promotion process, and
  request a 15-minute chat; send it today. Does that feel doable, or would you
  like me to tailor the bullets to your exact achievements?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S2, S5, G1, S1a, S3, S4, G2, S3a
  closed_areas    —
  role/location   promotion candidate / —
  trying to do    She wants to belong in the field and to feel more confident, and now there is a promotion open that she would like to pursue. The barrier is the same sense that she doesn't belong and that everyone around her seems more sure of themselves. She has not stated any steps she has already tried, and she has not put her name forward for the open promotion because of this feeling.

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
