# A nurse moving into health tech, offered far too little

_Run 2026-08-15 19:33 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is transitioning from nursing to health tech and is in early pricing/market positioning stage.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on G2, S1, G10a, G10 — 1 Otema, 3 drafted]

Botema
  Six years as a nurse give you a valuable lens for health tech—your clinical
  insight, care workflows, and patient safety mindset are exactly what teams
  need. To move in, map your transferrable skills to roles like health
  informatics, clinical data analyst, or implementation support, and start
  building healthcare-focused data skills (SQL, Python, dashboards) plus a
  small portfolio. Which health-tech area excites you most, and do you want
  local Ghana roles or remote international work?

  you > they've offered me something but it feels really low
  [stage B — They offered a fixed amount; needs market data and negotiation plan]
  [W · skipped — no location known yet]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5a, G7, S2, S5 — 2 Otema, 2 drafted]

Botema
  That feeling is real and common—offers in health tech here often don’t
  reflect the value you bring. I would always recommend getting the full
  package in writing and a concrete 12-month path to growth, plus clarity on
  whether pay is in local currency or USD and any non-salary levers like a
  signing bonus, learning budget, equipment, or extra leave. What matters most
  to you in this offer, and have you asked for the full written package and
  growth plan yet?

  you > it's about half what the job ads say for that role
  [stage B — Offer is about half of the advertised range; you need market data and a plan for a fair counter-offer.]
  [W · skipped — no location known yet]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G3, G3a, G7, S3 — 1 Otema, 3 drafted]

Botema
  What matters most to you in this offer, and have you asked for the budgeted
  range and growth plan yet?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User expresses imposter syndrome and doubt about deserving more in a negotiation.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, G7, S2 — 1 Otema, 3 drafted]

Botema
  That doubt is real and common, but it isn’t the truth you need to carry
  forward. Your six years in nursing give you a unique, valuable lens for
  health tech, and you deserve a fair market offer for the role, not a
  discount because you’re new to tech. Would you like me to draft a tight
  script you can use in your next negotiation to push for a higher offer and a
  growth plan?

  you > what do I actually say to them
  [stage B — User is asking for actual script to negotiate a low offer in a health tech role]
  [drew on S2a, S3b, G6, S2 — 1 Otema, 3 drafted]

Botema
  That doubt is real, but your value isn’t negotiable. Use this tight script:
  “Thank you for the offer — I’m excited to bring six years of nursing into
  health tech, and I need the package to reflect market value and the impact
  I’ll deliver. Could we align on a base salary within the budgeted range for
  this role, plus a concrete 12‑month growth plan and non‑salary levers like a
  signing bonus, learning budget, equipment, and extra leave, with a written
  package that confirms whether pay is in local currency or USD?” What else do
  you want this offer to include to feel truly fair?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   health tech / health informatics / —
  where she is    She is a nurse with six years of experience moving into health tech and is newly transitioning to tech roles. She has been offered a health tech role, but the compensation feels really low, and the offer is about half of what the job ads say for that role.
  trying to do    She wants to move into health tech roles and now aims to negotiate a higher offer and a growth plan; what is in her way: self-doubt about whether she deserves more since she's new to tech, and the current offer being low compared with ads; what she has already tried: NONE; what she has asked: what to say to them.

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — every reply ends on a question
- **FAIL** — never asks her to disclose her own pay
- **FAIL** — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- **FAIL** — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
