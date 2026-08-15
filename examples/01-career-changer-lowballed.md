# A nurse moving into health tech, offered far too little

_Run 2026-08-15 17:47 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is transitioning from nursing to health tech and is pricing their value for a role in health tech; no offer yet.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S1, G10a, G10 — 1 Otema, 3 drafted]

Botema
  Your nursing years are a real asset in health tech—don’t hide them, price
  the role for the value your clinical insight adds. I would always recommend
  you anchor a range based on health-tech roles that prize domain expertise
  (clinical informatics, product support for health software, healthcare data
  analysis) in your market or for remote work, and then validate with 2–3
  peers what they see as realistic. What health-tech area are you most excited
  about (e.g., product, data, or customer success), and where are you hoping
  to work from (city or remote)?

  you > they've offered me something but it feels really low
  [stage B — They've received an offer but it feels low and they want to know how to evaluate and negotiate; compare to market data.]
  [W · skipped — no location known yet]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5a, G7, S2, S5 — 2 Otema, 2 drafted]

Botema
  That feeling is real and common—offers for clinicians moving into health
  tech are often undervalued. I’d ask for a written breakdown of the offer,
  benchmark it against 2–3 similar roles, and draft a counter that protects
  base pay (and confirm whether it’s local currency or USD) while adding
  extras you care about (sign-on, learning budget, equipment, or equity). What
  is the role, location, and what’s the one thing you want to push hardest in
  the counter (base pay vs currency vs extras)?

  you > it's about half what the job ads say for that role
  [stage B — User has an offer in stage B and reports it is half of job ads; this fits ongoing negotiation with a prospective employer.]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G3, G3a, G7, S3 — 1 Otema, 3 drafted]

Botema
  I’d ask for the budgeted range they used for this role and the scope they
  priced, then respond with a counter that protects base pay and swaps in
  value-adds (sign-on, learning budget, equipment, remote flexibility,
  currency clarity). If they truly can’t move on base, push for a six‑month
  review tied to a pay revisit. What is the exact role title, location, and
  which one non-salary item do you want to push hardest in the counter?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User expresses self-doubt about deserving a higher offer; this affects negotiation mindset.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, G7, S2 — 1 Otema, 3 drafted]

Botema
  That worry is real for many women moving into tech, but your nursing
  background is exactly the value health‑tech teams pay for. What is the role
  title and location, and which piece do you want to push hardest in the
  counter—base pay, currency, or extras?

  you > what do I actually say to them
  [stage B — User asked for exact words to say in a negotiation after receiving an offer]
  [drew on S2a, S3b, G6, S2 — 1 Otema, 3 drafted]

Botema
  Try this script: “Thank you for the offer. Based on the role’s scope and my
  clinical health-tech experience, I’m targeting a base salary in the range of
  X to Y; if base can’t move, I’d like a six-month pay review with a plan to
  revisit, plus value-adds like a signing bonus, learning budget, equipment,
  or currency clarity.” Use it as your opening line in the discussion or
  email. What is the exact role title and location so I tailor the numbers?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   nurse transitioning to health tech / —

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — every reply ends on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
