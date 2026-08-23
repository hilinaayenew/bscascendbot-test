# Doesn't know enough about any field to compare them, then settles on data science

_Run 2026-08-23 19:23 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while no field is named, reaches stage B once data science is picked, and doesn't let 'no technical background' derail the roadmap once she's named a field.

## Transcript

```
BSC Coach — local area harness
  Area 3 · Career Paths & Roadmaps · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I don't really know enough about any of these fields to know which one I'd even be good at or enjoy
  [stage A — The user has not named a field and is expressing uncertainty about which path to choose, indicating early exploration (stage A).]
  → enterDiscussionArea(3 · Career Paths & Roadmaps)
  [drew on G1, S8 — 1 Otema, 1 drafted]

Botema
  Totally normal to feel unsure at this stage. I would always recommend trying
  tiny tasters in a couple of fields to see what sticks: spend one day on a
  small frontend page, one day cleaning a dataset and making a simple chart,
  and one day designing a screen in Figma; pay attention which you enjoyed and
  wanted to keep going. Which two areas feel most plausible to you right now,
  and what would make a one-day trial doable this week?

  you > I guess data science sounds interesting but I've never tried it
  [stage B — User named data science as a field they're considering; stays in field-based stage.]
  [drew on S2, S1, S5 — 3 Otema, 0 drafted]
  [voice only: S6, S3, S7, S4]

Botema
  That interest is real, and you don’t need to have tried it to know you might
  love it—many people start with a tiny taster before committing. I’d
  recommend a one-day plan: pick a public dataset (Titanic, Iris, or something
  in a domain you care about like education), use Google Colab to load it with
  pandas, print a couple of basic stats, make a simple chart, and write one
  sentence about what it suggests. Do you want me to tailor a 1-day plan
  around a domain you care about (health, education, finance) for this week,
  and outline the exact steps you’d follow?

  you > okay I want to actually pursue data science then
  [stage B — User explicitly named data science and wants a structured road map from exploration to a focused field.]
  [no close example — voice only, advice from knowledge]
  [drew on S3, S4, S6 — 3 Otema, 0 drafted]
  [voice only: S2, S1, S7, S5]

Botema
  Fantastic—data science is approachable with small, concrete wins. I’d start
  you with a 1–2 week plan: set up Google Colab, finish a brief Python/pandas
  intro, then load a public dataset (Titanic or one relevant to
  health/education) and produce a simple analysis and chart, ending with a
  short notebook you can share. Which domain should we tie it to (health,
  education, fintech), and how many hours can you commit this week to get your
  first notebook done?

  you > I don't have a technical background though
  [stage B — User has clarified lack of technical background; we should adapt plan to be beginner-friendly within Stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2, S7, S1 — 3 Otema, 0 drafted]
  [voice only: S5, S6, S4, S3]

Botema
  That's real—and a non-technical background isn’t a blocker. Start with
  Excel/Sheets at an advanced level, then SQL basics, then Python with pandas
  on Colab, aiming for a small notebook that cleans a dataset and makes a
  chart.

  you > so what's actually the roadmap for me
  [stage B — User asked for concrete roadmap tailored to pursuing data science given non-technical background; field already chosen in this thread.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2, S1, S4 — 3 Otema, 0 drafted]
  [voice only: S7, S3, S6, S5]

Botema
  That’s your path, laid out simply. Start with foundations and stack your way
  up, anchoring the work in real domains you care about. Foundations (0–4
  weeks): master Excel/Sheets at an advanced level, learn SQL basics (SELECT,
  JOIN, aggregations), and do a gentle Python/pandas intro in Colab (read_csv,
  head, describe, basic charts).

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     3 · Career Paths & Roadmaps
  covered_stages  A, B
  touched_facets  S8, G1, S1, S2, S3, S4, S5, S6, S7
  closed_areas    —
  role/location   data scientist / —
  trying to do    She wants to pursue data science. She has no technical background. She has not tried data science yet. She is asking for a concrete roadmap to get started.

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
