# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-16 06:42 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — User is in a live opportunity negotiating with a prospective employer; recruiter asked about current compensation.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3a, S3b, S2 — 1 Otema, 2 drafted]
  [voice only: G6, G5, G7, G3a]

Botema
  That’s a real barrier, and you don’t have to anchor there. Tell them: “I’d
  rather we base the offer on the role’s value rather than my current salary.
  Could you share the budgeted range for this role and confirm the currency?”
  How did they respond, and what currency is the role paid in?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User is in a live negotiation with a prospective employer (stage B) and reveals their current pay is far below market; this affects strategy and messaging.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G7, G3, G3a — 0 Otema, 3 drafted]
  [voice only: G6, S5, S5a, G9a]

Botema
  You’re not imagining it—underpayment is real and you shouldn’t anchor a
  future offer to what you’re earning now. I would push to base any offer on
  the role’s value and market rate, and push for the budgeted range and the
  currency in writing (local vs USD, depending on the remote setup). How has
  the recruiter responded on range and currency so far?

  you > she's also asked me to send a payslip to confirm it
  [stage B — They are negotiating with a prospective employer; recruiter asked for payslip to confirm current pay; classify as stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, S5, S3 — 2 Otema, 1 drafted]
  [voice only: G3, G3a, S2, G6]

Botema
  That request is common—but it anchors you to your current pay and you
  shouldn’t share a payslip. How did they respond last time, and do you want
  me to tailor a short reply you can send now?

  you > if i give her a higher number will they find out
  [stage B — User asked if inflating the number will be discovered; need to guide on honesty and negotiation tactics]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, G7a — 0 Otema, 3 drafted]
  [voice only: S3a, S3, S2, G9a]

Botema
  Yes—there’s a real risk they’ll anchor to whatever number you give and some
  recruiters will verify payroll. How did they respond to the range and
  currency request last time?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User is worried about sounding awkward while still negotiating with a prospective employer.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S3b, G3, S3a — 0 Otema, 3 drafted]
  [voice only: G3a, S2, G9, G7a]

Botema
  Negotiating honestly about value is normal, not awkward. If you want to keep
  it smooth, say something like: I’d rather we anchor the offer to the role’s
  value and market rate. What did they say in their last reply about range and
  currency?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   — / —
  where she is    She is in her current role and feels underpaid. She believes her current salary is about half of what the role she wants should pay. The recruiter has asked for a payslip to confirm her current pay. She is concerned about whether giving a higher number will be discovered. She doesn’t want to seem awkward or to cause the recruiter to move on to the next candidate.
  trying to do    She is trying to secure the role she really wants. She wants the offer to be based on the role’s value and market rate, and she is seeking the budgeted range and the currency for the role in writing. She has been avoiding sharing a payslip and is weighing how to respond about range and currency. She is worried that appearing awkward could lead to being passed over to another candidate, and she wants to handle the conversation smoothly while protecting her position.

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
