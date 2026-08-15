# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-15 18:45 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — The user describes that a recruiter asked for current pay while negotiating for a role they want.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3b, S3a, S2, S5 — 2 Otema, 2 drafted]

Botema
  Don't share your current pay. I’d respond, calmly: “I’d rather we anchor the
  offer on the market value of this role here—what range has been budgeted for
  it?” If they push, ask whose policy that is and whether the offer depends on
  disclosing your current figure. What did they say so far about budget or
  range, and how far have you gotten in the negotiation?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — The user is negotiating with a prospective employer about compensation and disclosed current underpayment; they want guidance on handling the offer process.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G7, S3b, G3, S3 — 1 Otema, 3 drafted]

Botema
  What has the recruiter said about the budget or range so far?

  you > she's also asked me to send a payslip to confirm it
  [stage B — User is in live negotiation with recruiter; payslip request indicates a current pay disclosure step.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G3a, G7, S2 — 1 Otema, 3 drafted]

Botema
  Don’t send the payslip. What did they say about the budget or range so far,
  and where do you want the range to land?

  you > if i give her a higher number will they find out
  [stage B — User asked whether giving a higher number will be discovered by employer during offer stage]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, S3a, S5 — 1 Otema, 3 drafted]

Botema
  Yes, it can come out in some form—pay audits, payroll checks, or even
  guesses from colleagues—so fabricating a higher figure isn’t a good move. If
  pressed, say: “I’m not comfortable sharing my current pay; what range has
  your budget allocated for this role?” What range has the recruiter given you
  for this role, and how close is that to the market you’ve researched?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User is negotiating with a prospective employer and is worried about appearing awkward and losing the role; this is clearly stage B.]
  [drew on S3b, G3, S3a, S2 — 1 Otema, 3 drafted]

Botema
  That awkwardness is real, but you protect your future earnings by anchoring
  to the role’s market value, not your current pay. Try: “I’d rather we anchor
  this on the market value for this role; for similar roles here I’m looking
  at a range of [low] to [high]. Is that within your budget?” If they push on
  a payslip, push back with the same line and shift to the full package. What
  range did they mention, and what’s most important to you in this offer
  beyond base salary (equity, learning budget, remote days, etc.)?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   prospective role being priced / —
  where she is    She is currently employed in a role where she believes she is underpaid; the recruiter has asked for her current pay before they put together an offer.
  trying to do    She is aiming for the role she really wants and wants to anchor the offer on the market value of the role rather than her current pay; she thinks her current pay is about half of what the role should pay. She is wondering whether giving a higher current-pay figure will be discovered by the recruiter; she has not sent a payslip and has asked about the budget or range for the role. She doesn't want to seem awkward and have them move on to the next candidate.

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
