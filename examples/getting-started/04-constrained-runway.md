# Full-time job, two kids, maybe an hour a day

_Run 2026-09-01 08:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Treats self-teaching plus one protected hour a day as a real, respected plan rather than discouraging her or suggesting money/time she doesn't have.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I want to get into tech but I have a full time job and two kids
  [stage A — User wants to enter tech but has heavy time/childcare constraints; needs guidance on feasible, time-efficient paths.]
  → enterDiscussionArea(1 · Getting Started)
  [validating opener dropped — she described herself, not something done to her]
  [drew on S1a, S8, S1 — 2 Otema, 1 drafted]
  [voice only: S8a, G3a, S7a, S7]

Botema
  I’d recommend a small, flexible path: pick one entry project-based area
  (Python for data or web basics, or SQL) and commit a steady, limited
  schedule (even 3–4 hours a week) for the next 3–6 months, using bite-sized
  courses and a simple project you can finish in a weekend. What part of tech
  feels most doable with your current schedule—data, development, or something
  like helping users with tech (support/UX) — and how many hours a week could
  you realistically carve out right now?

  you > there's basically no spare money for courses
  [stage D — Budget constraint: asking for affordable or free learning options; needs concrete plan using no-cost resources.]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S6, S4a — 1 Otema, 2 drafted]
  [voice only: S6a, G6, S3, S4b]

Botema
  I’d zero in on free, offline-friendly paths and tiny, doable projects. What
  I’d do now: - Use free, text-heavy resources you can download or read
  offline: freeCodeCamp (text-first), The Odin Project, CS50 notes, and Khan
  Academy basics. Clear next step: which free path feels most natural—web
  basics (HTML/CSS/JS), Python for data, or SQL—and how many hours could you
  reliably set aside each week?

  you > I can maybe get an hour a day if I'm lucky
  [stage D — Time is tight; plan must fit a small, repeatable daily window.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on S6a, S4, G6 — 1 Otema, 2 drafted]
  [voice only: S6, G2, S3, S4a]

Botema
  One hour a day is a solid, real commitment. Recommendation: start with
  HTML/CSS and basic JavaScript for web fundamentals. Do a simple project like
  a personal portfolio page plus a little interactive feature (a to-do list).

  you > is that even enough to get anywhere
  [stage D — User is asking if a 1-hour-a-day plan is enough to make progress in tech and wants milestone guidance.]
  [no new information — stall 1/2]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [second question dropped — one per reply]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4b, S3, G2 — 1 Otema, 2 drafted]
  [voice only: G6, S4, S6, S4a]

Botema
  Yes, it can, but you’ll need a focused, output-driven plan. With about 1
  hour a day, six to nine months of steady, project-based learning can get you
  a solid portfolio (two or three small web projects), basic JS interactivity,
  and Git/GitHub basics. Does that feel like something you could start now?

  you > what should I actually spend that hour on
  [stage D — The user asked for concrete, time-bound daily plan (one hour) after having settled on HTML/CSS/JS path and is seeking actionable steps.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4b, S6a, G2 — 0 Otema, 3 drafted]
  [voice only: S4, S4a, S3, G6]

Botema
  Yes. With one hour a day you can build real momentum—just be relentlessly
  practical and output-focused. Here’s a concrete, repeatable 4-week plan you
  can follow every weekday (60 minutes per day).

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  A, D
  touched_facets  S1, S1a, S7, S7a, S8, S8a, G3, G3a, G5, S3, S4, S4a, S4b, S6, S6a, G2, G6
  closed_areas    —
  role/location   — / —
  where she is    A full-time employee with two kids, exploring a transition into tech, currently able to dedicate about an hour a day if lucky.
  trying to do    Wants to break into tech while managing family and work responsibilities, focusing on free, offline-friendly learning paths and small projects; she has tried freeCodeCamp, The Odin Project, CS50 notes, and Khan Academy, and is seeking a realistic plan that fits roughly 7 hours a week.

  Nothing was written to any database.
```

## Checks

- PASS — does not suggest finding money or time she said she doesn't have
- PASS — treats one hour a day as workable, not dismissed
- PASS — gives a concrete, free thing to actually do with the time
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
