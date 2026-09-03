# Full-time job, two kids, maybe an hour a day

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Treats self-teaching plus one protected hour a day as a real, respected plan rather than discouraging her or suggesting money/time she doesn't have.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I want to get into tech but I have a full time job and two kids
  [stage C — Method-focused question: balancing full-time work and parenting with tech study.]
  → enterDiscussionArea(1 · Getting Started)
  [sentence cap fired — the model wrote a rundown]
  [drew on S2, S2b, G1a — 1 Otema, 2 drafted]
  [voice only: S2a, G1]

Botema
  That’s a real juggle, but it’s absolutely doable with the right plan. Given
  your full-time job and two kids, I’d aim for a low-friction, structured path
  you can fit into a few hours a week—think an evening or weekend block, with
  a clear project at the end to show for it. How many hours per week can you
  realistically protect for learning right now?

  you > there's basically no spare money for courses
  [stage C — The user states financial constraints on learning; this is a method-level question about how to learn tech affordably (free/low-cost resources and plan).]
  [no new facts about her — note left alone, no call made]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2a, G1, S2b — 0 Otema, 3 drafted]
  [voice only: G1a, S2]

Botema
  With almost no money for courses, I’d start with free, structured
  self-teaching and a tiny, concrete project you can finish in a few weekends.
  Use free resources (CS50, freeCodeCamp, The Odin Project) and pair them with
  a low-cost or free toolkit (a basic laptop you already have or borrow a
  moment, free cloud credits if you can get them). Does that feel doable?

  you > I can maybe get an hour a day if I'm lucky
  [stage C — User updated constraint: now can commit about 1 hour per day, affecting the chosen learning method and timeline.]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2b, S2a, S2 — 1 Otema, 2 drafted]
  [voice only: G1, G1a]

Botema
  I’d pick a single track and a tiny, finishable project to anchor it. My
  suggestion: start with Python basics or JavaScript basics (both have plenty
  of free, guided material). Does that feel like the right first track for
  your one-hour-a-day rhythm?

  you > is that even enough to get anywhere
  [classification missing/invalid stage "undefined" — retrying at 4000 tokens]
  [stage D — User asked for a viability check on a one-hour/day plan and wants concrete outcomes.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S6, S4b — 1 Otema, 2 drafted]
  [voice only: S4, S3, S4a, S6a]

Botema
  Short answer: yes, with discipline it can move you forward, but you’ll want
  a tight plan and a tangible project to prove progress. If you’re at one hour
  a day, you’re looking at steady basics for a few months, then a small,
  finishable project you can actually show. Pick one track (Python or
  JavaScript) and stick to a free, structured path (CS50, freeCodeCamp, The
  Odin Project) while you build a 2–3 module project that demonstrates a real
  outcome (a simple web app, data tiny project, or automation script).

  you > what should I actually spend that hour on
  [stage D — You’re asking for a concrete, hour-by-hour plan for a one-hour daily study session.]
  [no new facts about her — note left alone, no call made]
  [sentence cap fired — the model wrote a rundown]
  [drew on S6a, G6, S4a — 0 Otema, 3 drafted]
  [voice only: G2, S3, S6, S4]

Botema
  Great question. I’d structure your hour like this: 20 minutes of guided
  learning (CS50/FreeCodeCamp Python or JavaScript), 25 minutes of hands-on
  practice (write small scripts or mini‑projects in the browser or a local
  editor), and 15 minutes to journal your progress and outline the next small
  step. Does that feel doable for your current routine?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  C, D
  touched_facets  S2, S2a, S2b, G1, G1a, S3, S4, S4a, S4b, S6, S6a, G2, G6
  closed_areas    —
  role/location   — / —
  where she is    — A software-adjacent aspiring professional who currently works full time and has two kids. No salary details provided yet, but she is balancing caregiving with a limited amount of time for learning—approximately one hour per day is what she can protect.
  trying to do    — She wants to break into tech by building foundational skills through free, self-guided learning and a small, finishable project. The plan hinges on free resources (such as CS50, freeCodeCamp, The Odin Project) and a minimal toolkit, aiming for a low-friction path that fits into about one hour per day, with a concrete project to demonstrate capability.

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
