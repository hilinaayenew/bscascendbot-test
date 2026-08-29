# Feeling like she doesn't belong, then naming a promotion she hasn't applied for

_Run 2026-08-29 04:29 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I constantly feel like I don't belong in this field
  [stage A — User expresses a feeling of not belonging, fitting Stage A (imposter feelings) and not a decision to act yet.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [sentence cap fired — the model wrote a rundown]
  [drew on S1, G5, S2 — 2 Otema, 1 drafted]
  [voice only: S5, G10, G8, G1]

Botema
  That feeling is real, and you’re not alone—many women in tech across Africa
  wrestle with it. It’s not a judge on your competence; it’s a signal to build
  a support network and a few small, provable wins you own. Does that feel
  doable for you, and if so, what one small win could you claim this week?

  you > everyone around me seems so much more sure of themselves than I am
  [stage A — The user expresses ongoing self-doubt and a comparison with others, which fits Stage A (feeling to work through) rather than taking action.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on S1, G9, G10 — 1 Otema, 2 drafted]
  [voice only: G1, G6, S5a, S5]

Botema
  I’d start with one small, public move this week: share a concise update in a
  team meeting, including your reasoning and the concrete next step you’ll
  take. Which meeting would you try it in first?

  you > there's actually a promotion open right now and I haven't put my name forward because of exactly this feeling
  [stage B — User hasn't applied for promotion due to self-doubt; action is blocked by imposter feelings.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: S3a, S3, G4, S3c]

Botema
  Promotions go to those who show up with potential and impact, not people who
  wait until they feel perfectly ready. I’d push you to name yourself and
  present a tight 3-bullet case: what you’ve delivered, what you’d deliver in
  6–12 months if promoted, and what you need to succeed. Want me to help you
  draft that case so you can submit today?

  you > I keep telling myself I'm just not ready for it yet
  [stage B — User expresses self-doubt behind applying for promotion; not taking concrete action.]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, G4, S3a — 0 Otema, 3 drafted]
  [voice only: S3, S3b, S4, S3c]

Botema
  That feeling is exactly what impostor syndrome sounds like—and it’s common.
  Readiness is proven by your plan and your results, not by a mood. What are
  two concrete wins you can cite from the last 6 months, and by what date will
  you submit?

  you > so what should I actually do
  [stage B — User asked for concrete actions to move past self-doubt and apply for promotion; this is action-focused (stage B).]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [second question dropped — one per reply]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: G4, S3a, S3c, S3]

Botema
  Do this now: draft a tight 3-bullet case for the promotion (1) your two
  strongest outcomes that map to the role, with a quick metric, (2) what you’d
  deliver in 6–12 months if promoted, and (3) what you need to succeed; map
  two concrete wins from the last 6–12 months to the role; write a concise
  submission (250–350 words); get fast feedback from 1–2 trusted colleagues or
  a mentor, refine, and submit by the deadline; and be ready to speak to your
  plan in a short interview if asked. Which two wins will you highlight?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    There is a promotion open right now, and she has not put her name forward because of the feeling that she doesn't belong and lacks confidence. She keeps telling herself she isn't ready for it yet.
  trying to do    She wants to apply for the open promotion and move toward a higher role. The barrier is that she keeps telling herself she’s not ready for it yet, and that everyone around her seems more sure of themselves, which makes her hesitate. She has not tried applying yet because of this feeling. She asked what she should actually do.

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
