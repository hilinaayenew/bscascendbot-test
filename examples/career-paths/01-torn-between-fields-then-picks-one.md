# Doesn't know enough about any field to compare them, then settles on data science

_Run 2026-08-27 13:40 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while no field is named, reaches stage B once data science is picked, and doesn't let 'no technical background' derail the roadmap once she's named a field.

## Transcript

```
BSC Coach — local area harness
  Area 3 · Career Paths & Roadmaps · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I don't really know enough about any of these fields to know which one I'd even be good at or enjoy
  [stage A — User hasn't chosen a field yet and is exploring options.]
  → enterDiscussionArea(3 · Career Paths & Roadmaps)
  [sentence cap fired — the model wrote a rundown]
  [drew on G1, S8, S8a — 1 Otema, 2 drafted]
  [voice only: G1a]

Botema
  You’re not imagining it; most of us only know what fits after trying a few
  things. I’d recommend tiny trials for each field to see what sticks. What
  would your week look like to run these three tiny experiments, and which one
  would you want me to tailor a short plan for?

  you > I guess data science sounds interesting but I've never tried it
  [stage B — User named a field (data science) and indicates interest but no hands-on experience; moving to field B and suggesting Getting Started as next area.]
  [drew on S2, S5a, S1 — 2 Otema, 1 drafted]
  [voice only: S5, S4, S6, S4a]

Botema
  That’s real, and data science is learnable with small experiments. I’d
  suggest a 7‑day starter: use Google Colab to learn Python basics, then
  pandas to load a CSV, do simple cleaning and summary stats, make a basic
  visualization, and write a one-page takeaway. Does that fit your week, and
  would you like me to tailor the dataset to your interests (health,
  education, business) and give you day‑by‑day prompts?

  you > okay I want to actually pursue data science then
  [stage B — User has named a specific field (data science) and is committing to pursuing it, moving from exploration to a focused roadmap.]
  [no close example — voice only, advice from knowledge]
  [sentence cap fired — the model wrote a rundown]
  [drew on S3, S4, S4a — 2 Otema, 1 drafted]
  [voice only: S5, S1, S6, S5a]

Botema
  Great. I’d map a focused 6‑week kickstart: Python basics plus stats, then
  pandas for data wrangling, simple visualizations, and a first model with
  scikit‑learn; do 2–3 end‑to‑end mini projects on datasets you care about
  (health, education, or business) to build a small portfolio of notebooks.
  What problem area would you like to start with, and which resources can you
  access this week to kick off?

  you > I don't have a technical background though
  [stage B — User expresses lack of a technical background as a concrete blocker for pursuing data science, which shifts the approach from a pure field choice to building foundational skills. They remain in the Data Science path (Stage B) and need beginner-friendly guidance.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2, S5, S6 — 3 Otema, 0 drafted]
  [voice only: S4, S1, S5a, S4a]

Botema
  The fastest ladder for non-technical entrants is Excel/Sheets, then SQL,
  then Python with pandas, plus 2 small end-to-end projects to prove you can
  wrangle data and extract insights. Do you have a laptop and reliable
  internet, and which topic should I tailor the datasets to?

  you > so what's actually the roadmap for me
  [stage B — User asked for a concrete roadmap to become data scientist starting from zero.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2, S1, S5a — 2 Otema, 1 drafted]
  [voice only: S4, S4a, S3, S6]

Botema
  here’s a practical, Africa-aware roadmap you can start this week, starting
  from zero technical background. Weeks 0–2: Foundation with everyday
  data—master Excel/Sheets for cleaning, pivoting, basic stats; pick 1-2 clean
  datasets you care about and practice. Weeks 3–4: SQL basics—SELECT, WHERE,
  JOINs; do short exercises on a public dataset and keep a running notebook of
  what you learned.

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     3 · Career Paths & Roadmaps
  covered_stages  A, B
  touched_facets  S8, S8a, G1, G1a, S1, S2, S3, S4, S4a, S5, S5a, S6, S7
  closed_areas    —
  role/location   entry-level data scientist / —
  trying to do    She wants a concrete roadmap to pursue data science. She has never tried data science and does not have a technical background. She is asking for guidance on what steps to take next.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage A on the opening message
- PASS — reaches stage B once data science is named
- PASS — draws on S2 (data/ML roadmap) once the field is named
- PASS — gives a concrete starting step despite no technical background
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
