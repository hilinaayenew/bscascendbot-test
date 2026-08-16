# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-16 06:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — The user is negotiating with a prospective employer; they have a live recruiter request for their current pay.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3a, S3b, S2 — 1 Otema, 2 drafted]
  [voice only: G6, G5, G7, G3a]

Botema
  That question is a classic anchor, and you don’t have to disclose your
  current pay. I’d push back with: “I’d prefer we base the offer on the market
  value of this role and my experience—what range has the budgeted for this
  role?” If they push, you can add: “I can share a target range based on the
  role and local market, but not my current pay.” What did they say and how
  far along is the negotiation?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User is in stage B (negotiation with prospective employer) and reveals they are underpaid currently, which informs their leverage and messaging.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G7, G3, S3 — 1 Otema, 2 drafted]
  [voice only: G6, S5, S5a, G9a]

Botema
  You’re right to flag that—underpayment is real in our market, and it’s
  exactly why you anchor on market value, not your current pay. What stage is
  the negotiation at now, and is the offer expected in local currency or USD?

  you > she's also asked me to send a payslip to confirm it
  [stage B — User reports recruiter asked for payslip; this is a live negotiation with a prospective employer.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, S5, G3a — 1 Otema, 2 drafted]
  [voice only: G3, G9, S2, G6]

Botema
  Don’t send a payslip. How does that feel for your situation, and what did
  they say next?

  you > if i give her a higher number will they find out
  [stage B — User is in stage B negotiating with a prospective employer and asked about risk of revealing higher number; we classify the area.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, S5 — 1 Otema, 2 drafted]
  [voice only: G5, S3, S2, G7a]

Botema
  No. Inflating or sharing a higher number won’t help and can backfire if they
  poke around the details later. How has the recruiter responded so far, and
  have they given a budget range for the role?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User is negotiating with a prospective employer and wants to avoid awkwardness and not lose the candidate to others.]
  [drew on S3b, G3, S2 — 1 Otema, 2 drafted]
  [voice only: S3, G9a, G9, G6]

Botema
  That fear is real, but negotiating for value is exactly what good employers
  expect. Try: “I’m really excited about this role—could you share the
  budgeted range for this position? I want us to anchor on the market value of
  the role, not my current pay.” If they push back, add: “If the base can’t
  move, what about other components like a learning budget, signing bonus, or
  a six-month review with a potential increase?” How does that feel, and what
  did the recruiter say in response so far?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   prospective role negotiation / —
  where she is    She is a backend developer who is currently underpaid in her current role; she believes her current pay is about half of what the role she wants should pay. A recruiter has asked what she is currently on before they put together an offer. She has been asked to send a payslip to confirm it.
  trying to do    She wants to land the role she really wants and receive an offer for that role. The main obstacle is the underpayment she is experiencing in her current job; she believes it’s about half of what the new role should pay. She doesn’t want to seem awkward or pushy and risk them moving on to the next candidate.

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
