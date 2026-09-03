# Former admin assistant plans a bootcamp path, then agrees and closes

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Reaches stage D with a concrete plan, then stage E once she's agreeing rather than asking — the wrap-up reply says the plan back and checks it rather than adding a further step, short, nothing new introduced on the last turn.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I used to work as an administrative assistant, now I want to move into data analysis
  [stage B — She has real prior work in a different field and is asking how/where it fits transitioning to data analysis.]
  → enterDiscussionArea(1 · Getting Started)
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, S5a, G4 — 1 Otema, 2 drafted]

Botema
  Great pivot. From admin to data analysis, you already bring organisation,
  dashboards, and data handling experience—that’s a solid base. What data
  domain are you most excited to analyse (e.g., sales, operations, marketing,
  finance)?

  you > I don't have money for a full degree, so probably a bootcamp or self-teaching
  [stage C — User is discussing learning paths (bootcamp vs self-teaching) as a method for moving into data analysis, which is a live method question.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [drew on S2, S2a, S2b — 1 Otema, 2 drafted]
  [voice only: G1a, G1]

Botema
  That makes sense. If money is tight, start with self-teaching using free
  resources to build the core skills, then add a structured bootcamp only if
  you find a cohort with solid outcomes and a realistic path to paid work.

  you > okay, a self-paced bootcamp with a mentor sounds right — how long would that realistically take me
  [stage D — Provide a realistic timeline for a self-paced bootcamp with mentor.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, G2, S4a — 1 Otema, 2 drafted]
  [voice only: S6, S6a, S3, G6]

Botema
  Realistically, a self-paced bootcamp with a mentor tends to take about 6–12
  months, depending on your weekly commitment. If you can put in 15–20 hours a
  week, plan for around 6–9 months; if it’s closer to 8–10 hours, expect 9–12
  months. Does that align with how much time you can realistically devote each
  week?

  you > yeah, three months of steady evenings sounds doable, I think that's the plan
  [stage D — User confirmed a 3-month evening plan for a self-paced bootcamp with a mentor, moving from planning to concrete timeline.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, G2, S6a — 1 Otema, 2 drafted]
  [voice only: S4a, S4b, S3, S6]

Botema
  That three-month window is tight but doable if you stay ultra-focused. I’d
  lock in Python and SQL as your core tools, with a simple three-month plan
  like this. Would you say your strongest starting point is Python or SQL, and
  what kind of data domain (sales, operations, finance, etc.) do you want to
  practice with?

  you > no, that covers it, thank you
  [stage E — Closing the Getting Started conversation; no further questions in this area.]
  [no new facts about her — note left alone, no call made]
  [drew on S2, G1, S1a — 1 Otema, 2 drafted]
  [voice only: G5, S5, S3, G2]

Botema
  You're going with a three-month, self-paced bootcamp with a mentor, focusing
  on Python and SQL. Does that feel like the plan you’ll start next week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  B, C, D, E
  touched_facets  S5, S5a, G4, S2, S2a, S2b, G1, G1a, S3, S4, S4a, S4b, S6, S6a, G2, G6, S1, S1a, S7, S7a, S8, S8a, G3, G3a, G5
  closed_areas    —
  role/location   — / —
  where she is    — Former administrative assistant, now aiming to move into data analysis; currently planning a self-paced bootcamp with a mentor as a pathway, and considering a three-month schedule for steady evenings.
  trying to do    — Wants to transition into data analysis with a low-cost path (bootcamp or self-teaching), prioritizing a three-month evening-focused plan to develop core data skills and mentor-guided progression, and to translate that into paid work.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage B on the opening message (named prior career)
- PASS — reaches stage D once a concrete method and timeline are the live question
- PASS — reaches stage E once she's agreeing rather than asking
- PASS — the wrap-up reply is short — three sentences at the outside
- PASS — the wrap-up adds nothing new
- PASS — the wrap-up ends on a check, not a demand for more information
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
