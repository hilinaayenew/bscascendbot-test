# Can't settle between data and UX, hasn't built anything in either

_Run 2026-08-21 07:26 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A throughout — still deciding, not yet executing — and pushes toward trying something small rather than more thinking, without ignoring that she has little time to try both properly.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I don't know if tech is even for me, I keep going back and forth
  [stage A — User is unsure about tech as a fit and hasn't established prior field; stage A (no real prior work experience, uncertain about field) matches.]
  → enterDiscussionArea(1 · Getting Started)
  [sentence cap fired — the model wrote a rundown]
  [drew on S1, S7, S8 — 3 Otema, 0 drafted]

Botema
  That back-and-forth is totally normal when you’re figuring out if tech fits
  your life. I’d suggest two tiny pilots over the next week or two: one
  lightweight Python task to automate something in your day, and one small
  frontend project (a simple page that does a useful thing). Which two tiny
  experiments would you actually commit to trying this month?

  you > one week I want to do data science, the next I want UX
  [stage A — User is torn between two field paths (data science vs UX) indicating field-level uncertainty, which fits Stage A guidelines.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S1, S7, S8 — 3 Otema, 0 drafted]

Botema
  That pattern is a smart way to feel out fit—let’s season it with two tight
  sprints so you actually feel the work, not just daydream about it. Week 1
  data science: use Google Colab, a Titanic or Iris dataset, do a quick
  exploratory analysis and a tiny model, deliver a one-page insights summary
  with a chart. Does that plan work for your calendar, and which days could
  you block for these two sprints?

  you > I've never actually built anything in either one
  [stage A — User has no hands-on builds yet and is unsure about which field to pursue; seeking beginner steps to start.]
  [drew on S1, S7, S8 — 3 Otema, 0 drafted]

Botema
  That’s a realistic way to learn—start by building, not just thinking. I’d
  suggest two tiny starters you can finish in a week: data science, explore a
  small public dataset in Colab, do a quick EDA and train a tiny model, then
  write a one-page insights note; UX, sketch a 4-screen prototype in Figma for
  a real everyday problem and turn it into a clickable mock. Which one would
  you pick to start this week, and what problem do you want to tackle first?

  you > I don't have much time to try both properly
  [stage D — User can't try both; request for a concrete, time-boxed plan to start with one domain.]
  [no close example — voice only, advice from knowledge]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, S6, S3 — 3 Otema, 0 drafted]

Botema
  That constraint makes a single path smarter. I’d push you to a tight 3-day
  data science sprint to see if you enjoy the work and can deliver something
  tangible. Does a 3-day data science sprint fit your schedule this week, and
  which days can you block for it?

  you > so where do I actually start
  [stage D — User asked for concrete, actionable starting steps to begin experimenting with data science vs UX; fits D (concrete steps, realistic timeline)]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, S6, S3 — 3 Otema, 0 drafted]

Botema
  Day 1: quick EDA, clean a couple of features, and note a one-line takeaway;
  Day 2: train a simple model and evaluate it; Day 3: write a one-page
  insights note and decide your next step. Block 2–3 hours each day, zero
  cost. Does that fit your week, and which days can you set aside for these
  three sessions?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  A, D
  touched_facets  S1, S7, S8, S3, S4, S6
  closed_areas    —
  role/location   data science starter plan / —
  trying to do    She is trying to decide whether tech is the right path for her and keeps going back and forth between doing data science for a week and UX the next. She has never actually built anything in either area and she doesn't have much time to try both properly. She asks where to start.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage A
- PASS — pushes toward a small, concrete try rather than more deliberation
- PASS — respects the limited-time constraint rather than telling her to try both fully
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
