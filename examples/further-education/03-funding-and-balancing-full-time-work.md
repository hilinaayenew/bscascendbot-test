# Wants scholarships, has weak savings, and also works full time

_Run 2026-08-27 08:03 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage C throughout — both funding and balancing are logistics on an already-chosen path — and draws on both S6 and S7 rather than only answering the first question asked.

## Transcript

```
BSC Coach — local area harness
  Area 2 · Further Education · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > how do I fund further education in tech, are there scholarships for women
  [stage C — User asked about funding options and scholarships for women in tech.]
  → enterDiscussionArea(2 · Further Education)
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  Yes — there are scholarships for women in tech, and many are accessible to
  African applicants if you show a clear plan and impact. Options include
  Chevening (UK), AWS re/Start, the Ada Lovelace Institute funds, Women in
  Tech funds, employer sponsorships, and government/university scholarships;
  you can also consider shorter online certificates that cost less and lead to
  quicker returns. What programme are you considering, and when do you want to
  start?

  you > I don't have strong savings
  [stage C — User expressed lack of savings and asked about funding/scholarships, which fits funding logistics in a certificate/master's pathway.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  That’s real, and scholarships exist to cover costs beyond savings. What
  country and program are you considering, and when would you like to start so
  I can help you shortlist options?

  you > what actually makes someone competitive for these scholarships
  [stage C — User asked what makes someone competitive for scholarships.]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  Competitiveness comes from a clear Africa-focused impact story: solid
  grades, concrete applied projects, and demonstrated leadership or mentorship
  that shows you’re lifting others in tech. Funders also want alignment with
  their mission, a credible plan for how you’ll use the credential, and proof
  you can complete (timelines, references, eligibility). What program are you
  aiming for, and what evidence do you already have of your impact and
  readiness?

  you > I also work full time, would I need to quit
  [stage C — The user asked about balancing full-time work with a potential further-education program and whether they would need to quit; this is a logistics/scheduling question within the ongoing discussion about scholarships and programs.]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  Not necessarily—you can study while you work if you choose the right
  program. Look for online/part-time or hybrid options with asynchronous
  content, and plan to commit roughly 8–12 hours per week; you can also
  negotiate study leave or a learning budget with your employer, or start with
  a shorter certificate. Which delivery mode would you prefer, and how many
  hours per week can you realistically devote to study?

  you > how do people usually balance both
  [stage C — User asked about balancing work and study; this is a logistics question within the ongoing 'Further Education' discussion.]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  People balance it by choosing something that fits real life:
  online/part-time or hybrid with asynchronous content, and blocking 2–3 fixed
  study slots per week (about 8–12 hours total). Treat it like a mini-project:
  set milestones, weekly goals, and an accountability buddy or cohort; use
  your employer’s study leave or learning budget if possible; and prepare for
  connectivity issues by downloading materials for offline study. What does
  your current week look like, and which program mode are you leaning toward?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     2 · Further Education
  covered_stages  C
  touched_facets  S6, S7
  closed_areas    —
  role/location   scholarship applicant (women in tech) / —
  where she is    She is working full-time while exploring funding options for further education in tech. There is no information yet about her role, location, or current pay details.
  trying to do    She wants to pursue a tech credential while staying in her job and asks how people usually balance both. She is seeking scholarships for women and wants to know what makes someone competitive for them and whether quitting is required. She has considered online/part-time or hybrid programs and is open to negotiating a study leave or a learning budget with her employer. She aims to find a realistic plan that allows 8–12 hours of study per week without sacrificing her job.

  Nothing was written to any database.
```

## Checks

- PASS — stays in stage C throughout
- PASS — draws on S6 (funding/scholarships)
- PASS — draws on S7 (balancing work) once that's raised
- PASS — names what makes a scholarship application competitive
- PASS — gives a real option short of quitting
- PASS — most replies still end on a question
- PASS — no two replies open the same way

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
