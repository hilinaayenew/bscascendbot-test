# Wants scholarships, has weak savings, and also works full time

_Run 2026-08-23 19:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage C throughout — both funding and balancing are logistics on an already-chosen path — and draws on both S6 and S7 rather than only answering the first question asked.

## Transcript

```
BSC Coach — local area harness
  Area 2 · Further Education · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > how do I fund further education in tech, are there scholarships for women
  [stage C — User asking about funding and scholarships for pursuing a tech education, which is logistics for a chosen or near-chosen program.]
  → enterDiscussionArea(2 · Further Education)
  [sentence cap fired — the model wrote a rundown]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  Yes—there are scholarships and funding for women in tech, but you’ll need a
  plan and a strong portfolio to win them. Look for government or university
  scholarships (Chevening, Commonwealth, regional funds), employer tuition
  support, and lower-cost paths with stipends (AWS re/Start, Google Career
  Certificates) or women-focused funds. What country are you in and what area
  are you planning to study?

  you > I don't have strong savings
  [stage C — The user expressed a constraint (no strong savings) relevant to funding and logistics for pursuing education, which fits Stage C (logistics like paying, scholarships).]
  [sentence cap fired — the model wrote a rundown]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  That’s real, and it’s exactly why you need a plan with multiple funding
  avenues. Look for scholarships (Chevening, Commonwealth, Mastercard
  Foundation Scholars, Aga Khan Foundation, plus country-specific bursaries),
  plus any employer tuition support you might access; for lower-cost routes,
  consider online certificates (AWS re/Start, Google Career Certificates) or
  programs with income-sharing options. What country are you in, what tech
  area do you want to study, and would you prefer a short online certificate
  or a longer degree path?

  you > what actually makes someone competitive for these scholarships
  [stage C — The user asked about what makes someone competitive for scholarships, which is a funding/selection criterion question in the 'C' stage.]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  That competition is real, and the strongest candidates show a tight,
  evidence-based story: strong academics and real technical outputs (projects,
  certifications, a portfolio), demonstrable leadership or community impact
  (mentoring, women-in-tech activities, local projects), and a clear plan that
  links your chosen study to solving a real problem in your country after you
  graduate. Add credible references and crisp essays that align with the
  sponsor’s mission, plus a practical sense of how you’d fund the gap if
  needed. What country and scholarship are you aiming for, and which two or
  three projects best demonstrate your impact so far?

  you > I also work full time, would I need to quit
  [stage C — User asked about balancing work with study—logistics case within stage C]
  [sentence cap fired — the model wrote a rundown]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  Not necessarily. You don’t have to quit to study, especially if you pick an
  online or part-time program and you negotiate with your employer for study
  leave or a training budget. What country are you in, what program type are
  you considering, and how flexible is your job about study leave or a
  training budget?

  you > how do people usually balance both
  [stage C — User asked about logistics for balancing work and studying within ongoing program planning.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S6, S7 — 2 Otema, 0 drafted]

Botema
  They block regular study windows (evenings or weekends) and use small daily
  blocks (about 60–90 minutes), then lean on a support network to stay
  accountable.

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     2 · Further Education
  covered_stages  C
  touched_facets  S6, S7
  closed_areas    —
  role/location   — / —
  where she is    She is employed full-time; no details about her role or location are provided, and she is evaluating how to fund further study while keeping her job.
  trying to do    She wants to understand what actually makes someone competitive for these scholarships and whether she would need to quit to pursue study full-time. She is also trying to figure out how to balance a full-time job with study, including whether quitting is necessary and what practical options exist (online or part-time programs, study leave, or a training budget). She has already identified funding avenues to consider—government or university scholarships (Chevening, Commonwealth, Mastercard Foundation Scholars, Aga Khan Foundation), employer tuition support, and lower-cost paths with stipends or income-sharing options (AWS re/Start, Google Career Certificates). She is seeking concrete criteria to strengthen her applications and guidance on country-specific options and how to apply.

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
