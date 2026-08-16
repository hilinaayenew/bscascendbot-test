# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-16 05:27 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — User is negotiating with a prospective employer; recruiter asked for current salary as part of offer preparation.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3a, S3b, S2 — 1 Otema, 2 drafted]
  [voice only: G6, G5, G7, G3a]

Botema
  That’s a real pressure point, and you’re not wrong to push back. Try: “I’d
  rather we anchor the offer on the market value of this role here. What range
  has the company budgeted for it?” If they push back, add: “I’m happy to
  discuss my experience and impact to support that range.” What city and role
  level is this in, so I can tailor the exact line?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User expressed current underpayment, seeking market-driven offer for a new role; needs market data to anchor negotiation.]
  [W · skipped — no location known yet]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G7, G3, S3 — 1 Otema, 2 drafted]
  [voice only: S5, S3b, S3a, G6]

Botema
  That gap is real and you’re not imagining it. Would you like me to tailor
  this to the exact city and role level you’re targeting?

  you > she's also asked me to send a payslip to confirm it
  [stage B — The user reports the recruiter asked for a payslip in a live negotiation with a prospective employer.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, S5, G3a — 1 Otema, 2 drafted]
  [voice only: G7a, S3, S2a, G7]

Botema
  That request is real, but not something you should share. Do not send your
  payslip. What city and role level is this, so I can tailor the exact line
  for you?

  you > if i give her a higher number will they find out
  [stage B — User asked if inflating current salary would be discovered; it's a strategic question in a live offer negotiation.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, S5 — 1 Otema, 2 drafted]
  [voice only: G7, S2a, G3a, S3a]

Botema
  Short answer: yes, giving a higher number as your current pay can anchor the
  whole negotiation at a higher level, and if it’s not genuine it can
  backfire. What city and level is this role in so I tailor the exact line for
  you?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User wants to avoid awkwardness and prevent being passed over; remains in negotiation stage with prospective employer.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S3b, G3, S2 — 1 Otema, 2 drafted]
  [voice only: G6, S5, G9, S5a]

Botema
  Yes. If you give a higher number, they’ll anchor the offer to that figure,
  and it can be hard to unwind later. What city and level is this role, and
  how has the recruiter responded to your range question so far?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   prospective software engineer / —
  where she is    The recruiter has asked what she is currently on before they put an offer together. She is badly underpaid where she is now, estimating her current pay is about half of what this role should pay. She has been asked to send a payslip to confirm it.
  trying to do    She wants the role she really wants and is preparing to share her current pay so a formal offer can be put together. She notes the pay gap at her current job, estimating her pay is about half of what this role should pay. She wonders whether giving a higher current-pay figure would be discovered by the recruiter. She does not want to seem awkward and have them move on to the next candidate.

  Nothing was written to any database.
```

## Checks

- PASS — moves onto what the role is worth, not what she is on
- PASS — gives her something she could actually say
- PASS — never tells her to state a salary she is not on
- PASS — stayed in the area through the fear turn
- PASS — every reply ends on a question
- PASS — no two replies open the same way

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
