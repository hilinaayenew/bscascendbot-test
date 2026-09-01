# A teacher switching in purely for stability, not passion

_Run 2026-09-01 08:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Deliberately probes the A/B boundary: a named prior career (teacher) should place her in stage B even while she's also unsure what to pick — the prior career is what distinguishes B, not field-certainty. Doesn't moralise about a purely financial motivation, values her teaching background, and reaches stage D once she asks a concrete timeline question.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I'm a teacher and I want to switch into tech
  [stage B — She has a prior career as a teacher and wants to switch into tech; this is a career change scenario, not starting from scratch.]
  → enterDiscussionArea(1 · Getting Started)
  [second question dropped — one per reply]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, G4, S5a — 1 Otema, 2 drafted]

Botema
  Nice. Switching from teaching to tech is a real path many of us have walked,
  and your strengths (Explain concepts clearly, structure learning for others,
  manage projects) are highly transferable. What area in tech are you most
  drawn to?

  you > honestly it's not really passion, I just want more stable pay
  [stage C — Motivation shifts from passion to financial stability; evaluating method/path questions rather than a specific program.]
  [no new facts about her — note left alone, no call made]
  [no close example — voice only, advice from knowledge]
  [repeated advice removed]
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2, G1a, S2a — 1 Otema, 2 drafted]
  [voice only: G1, S2b]

Botema
  That’s a real motivation, and stability is a legitimate driver. If you want
  quicker, tangible pay stability without too heavy a time or money pull, I’d
  target data-focused roles or software engineering with a clear, low-friction
  entry path. Does that feel like a workable plan you could start this month?

  you > is that a bad reason to do this
  [stage B — User with prior teaching career asking if seeking higher pay/stability is a valid reason to switch to tech; moving from B to C/D if they act on it.]
  [no new facts about her — note left alone, no call made]
  [second question dropped — one per reply]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, S5a, G4 — 1 Otema, 2 drafted]

Botema
  Not bad at all. In tech, stability is a real, practical driver, and you’re
  allowed to aim for a solid, sustainable path. Does that framing feel
  believable for your situation?

  you > what should I actually pick, given that
  [stage D — User asked for concrete, actionable guidance on which path to pick (data-focused roles vs software engineering), given motivation of income stability.]
  [repeated advice removed]
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on S6a, S4b, S4a — 0 Otema, 3 drafted]
  [voice only: S3, S4, G6, S6]

Botema
  Good question. Based on your aim for stability with a reasonable entry path,
  I’d rank three realistic picks. Does that plan feel realistic for what you
  can start this month?

  you > how long is this going to realistically take me
  [stage D — The user asked for a concrete,timeline-focused question, which is characteristic of stage D (concrete details after a method has been chosen).]
  [no new facts about her — note left alone, no call made]
  [second question dropped — one per reply]
  [drew on S4, S6, G2 — 2 Otema, 1 drafted]
  [voice only: S4a, S4b, S6a, S3]

Botema
  Realistically, you’re looking at about 6–12 months of focused study and
  steady job searching if you can put in decent hours weekly; 12–18 months if
  you’re balancing it fully around teaching. The fastest path tends to be a
  junior role like QA, a data analyst, or a beginner software engineer, with a
  structured bootcamp or self-study plus small projects. How many hours a week
  can you dedicate?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  B, C, D
  touched_facets  S5, S5a, G4, S2, S2a, S2b, G1, G1a, S3, S4, S4a, S4b, S6, S6a, G2, G6
  closed_areas    —
  role/location   — / —
  where she is    — NONE
  trying to do    — NONE

  Nothing was written to any database.
```

## Checks

- PASS — classified stage B on the opening message (named prior career)
- PASS — does not moralise about a money-driven motivation
- PASS — values her teaching background as an asset
- PASS — reaches stage D by the final, concrete timeline question
- PASS — reaches a realistic timeframe by the end
- PASS — most replies still end on a question
- PASS — never asks her to disclose personal financial details
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
