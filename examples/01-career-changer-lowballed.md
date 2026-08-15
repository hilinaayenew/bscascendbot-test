# A nurse moving into health tech, offered far too little

_Run 2026-08-15 16:05 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is transitioning from nursing to health tech, which aligns with pricing/self-worth exploration stage (A).]
  → enterDiscussionArea(9 · Salary & Negotiation)

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: health tech (nurse transitioning), unspecified, nursing to health tech] 2 search, 2 sources
  [drew on G2, S1, G10a, G10 — 1 Otema, 3 drafted]

Botema
  You’re not imagining a real path here—nursing can be a strong bridge into
  health tech, and your clinical insight is exactly what teams need. The
  closest anchor I can give for health informatics roles is US-based RN
  Clinical Informatics salary: about USD 67,310 to 126,884 per year
  (Salary.com, 2025). In Africa, public salary data is thin and most roles are
  priced locally or as remote contracts priced to the employer’s market;
  you’ll want to anchor against local health-tech roles or remote roles with a
  local-pay or dollar-pay option, not your nursing salary itself. What
  health-tech area excites you most—data analytics, EHR/clinical workflow
  implementation, or digital health operations—and which country are you in?
  I’ll help you map a practical local range and a bridge plan.

  sources: www.salary.com, www.bls.gov

  you > they've offered me something but it feels really low
  [stage B — Offer exists and feels under-market; need market data and negotiation guidance]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: Health tech offer evaluation (nurse transitioning), unspecified, nurse-to-health-tech offer evaluation] 2 search, 1 sources
  [nothing citable — answering ungrounded, guard back on]
  [drew on S5a, G7, S2, S5 — 2 Otema, 2 drafted]

Botema
  That feeling is real—and it’s common when moving into health tech here. I
  would always recommend you get a written breakdown, benchmark the base
  against local roles or USD-paid remote roles, and push for non-salary levers
  like a learning budget, equipment, or a signing bonus if the base won’t
  move. What are the base salary, currency, and the major non-salary terms in
  the offer?

  you > it's about half what the job ads say for that role

  Azure error: fetch failed

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User is negotiating an offer (stage B) and expresses self-doubt about deserving more; needs guidance on confidence and value-based negotiation.]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: Health-tech: RN transitioning to HealthTech / Clinical Informatics, unspecified, Negotiating an offer (salary + non-salary terms)] 1 search, 0 sources
  [nothing citable — answering ungrounded, guard back on]
  [sentence cap fired — the model wrote a rundown]
  [drew on G9, S3a, G3, S3 — 1 Otema, 3 drafted]

Botema
  That feeling is real and common—your clinical experience is exactly the
  value health tech teams need, even if you’re new to coding or product. You
  don’t have to hollowly accept less; you bring domain insight, patient safety
  perspective, and real workflow knowledge that shorten timelines and improve
  outcomes. What were the base salary, currency, and the non-salary terms they
  included so I can tailor a sharp, direct script you can use to push for a
  fairer package?

  you > what do I actually say to them
  [stage B — User asked for concrete phrases to use in a live negotiation with a prospective employer.]
  [figure guard fired — a figure or source claim was removed]
  [drew on G3a, G6, G9a, S2 — 1 Otema, 3 drafted]

Botema
  Here’s a sharp script you can use in the conversation: “Thank you for the
  offer. I’m excited to bring six years of nursing—clinical workflows, patient
  safety, and data quality—into health tech, but the base salary is below
  market for this role in [location].

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   Health-tech: RN transitioning to HealthTech / Clinical Informatics / unspecified

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- **FAIL** — every reply ends on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
