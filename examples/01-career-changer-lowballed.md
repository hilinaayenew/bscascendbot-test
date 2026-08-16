# A nurse moving into health tech, offered far too little

_Run 2026-08-16 06:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is shifting from nursing to health tech and wants guidance on pricing/market value before or during job search.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on G2, S1, G10a — 1 Otema, 2 drafted]
  [voice only: G10, G5]

Botema
  You’re not overreaching—your nursing experience is your real edge in health
  tech. Map to 1–2 roles that lean on clinical knowledge (for example,
  clinical product specialist or health IT analyst / customer success) and
  price yourself by what the role pays locally or for remote work, not your
  nurse salary; talk to two or three peers or mentors, and pull ranges from
  local job ads to set a defensible floor. Where are you based, and would you
  consider remote roles as well?

  you > they've offered me something but it feels really low
  [stage B — User has an offer that feels low; they need help evaluating and negotiating, potentially with market data to benchmark and a counteroffer.]
  [W · skipped — no location known yet]
  [drew on S5a, G7, S2 — 1 Otema, 2 drafted]
  [voice only: G3, G7a, S3b, G9]

Botema
  That’s real—and it’s common when moving into health tech. I’d respond with
  appreciation, ask for a quick call to review the package, and push for a
  base that aligns with local health‑tech roles for someone with your clinical
  background, while also locking in value in other parts (learning budget,
  signing bonus, a six‑month review, extra remote days). Do you want me to
  tailor a short email or a call script to your exact role and city, and
  what’s the role title and company type (startup or established company)?

  you > it's about half what the job ads say for that role
  [stage B — Live offer much lower than advertised; negotiation guidance needed]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5, G3, G3a — 1 Otema, 2 drafted]
  [voice only: S2, S2a, G9, G9a]

Botema
  That gap is real and common—ads often outpace what gets budgeted, especially
  in health tech in Africa. To tailor a tight counter and script, what is the
  exact role title and city, and what does the current written offer include?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User is in stage B and expressed self-doubt about deserving more; new info about mental barrier added.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, S3 — 1 Otema, 2 drafted]
  [voice only: S5a, S3b, G7, G3]

Botema
  That thought is real, but it isn’t true about you—your six years as a nurse
  are a strong asset in health tech, not a deficit. What is the exact role
  title and city, and what does the current written offer include?

  you > what do I actually say to them
  [stage B — User asked for exact negotiation script, which fits stage B (offer on the table) and needs guidance on what to say.]
  [figure guard fired — a figure or source claim was removed]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2a, G6, S2 — 1 Otema, 2 drafted]
  [voice only: G3, G9, S5a, G3a]

Botema
  Here are two tight, ready-to-use lines you can pick from. Call script (short
  and direct) “Thank you for the offer. I’m excited about joining [Company] as
  [Role]. Is there room to adjust the base or add these elements to bring the
  package in line with the role?” Email snippet (if you prefer writing)
  “Subject: Quick chat to review compensation for [Role] Thank you for the
  offer for [Role]. I’m excited to contribute my clinical experience to
  [Company]. Could we schedule a 15-minute call to review the compensation
  package?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   health tech role (e.g., clinical product specialist or health IT analyst) / —
  where she is    She is a nurse with six years of experience who is moving into health tech, and she is new to tech. They have offered her a health-tech role, but the compensation is about half of what job ads say for that role.
  trying to do    She wants to get to a health tech role. What is in her way: the current offer is about half of what the job ads say for that role. What she has already tried: NONE. She is also thinking she may not deserve more since she is new to tech.

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — most replies still end on a question
- PASS — never asks her to disclose her own pay
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- **FAIL** — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
