# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-15 17:47 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — User describes recruiter asking for current compensation during offer process, which is negotiation stage with prospective employer.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3b, S3a, S2, S5 — 2 Otema, 2 drafted]

Botema
  Yes—this is a real tactic, and you should avoid anchoring to your current
  pay. I’d use this pivot: “I’d rather we base the offer on the market value
  for this role and its responsibilities; what range has the budgeted for this
  position?” If pressed, “I can share my current salary only if it helps
  calibrate the offer; otherwise I’d like to proceed with market-based terms.”
  What country are you in and is this a local or remote-for-abroad offer, so I
  can tailor the exact wording for you?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User is negotiating with a prospective employer and reports underpaid current salary; seeks guidance on reframing offer around market value.]
  [drew on G7, S3b, G3, S3 — 1 Otema, 3 drafted]

Botema
  Yes—that underpayment reality is real for women in tech in Africa. Do not
  anchor to your current pay. I’d suggest you respond with a market-based
  range for the role and ask what budget they’ve allocated; if pressed about
  your current salary, say: “I’d rather we base the offer on market value for
  this role and its responsibilities; my current pay isn’t indicative of the
  value I bring.” What country is the role in, and is it local or
  remote-for-abroad?

  you > she's also asked me to send a payslip to confirm it
  [stage B — The user reports the recruiter asked for a payslip; this is new negotiation detail at the offer stage.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S3b, G3a, G7, S2 — 1 Otema, 3 drafted]

Botema
  Don't share your payslip. Underpayment reality is real, and anchoring to
  your current salary can hurt you. Use a market-value framing instead: “I
  won’t share my payslip; let’s base the offer on the market value for this
  role and its responsibilities. What range has the budget allocated for this
  position?” If they push, you can add: “I’m happy to discuss my experience
  and impact to calibrate the offer.” What country is the role in, and is it
  local or remote-for-abroad?

  you > if i give her a higher number will they find out
  [stage B — User asked about consequences of sharing a higher current salary with a prospective employer; this determines how to frame the negotiation and whether to avoid disclosure.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, S3a, S5 — 1 Otema, 3 drafted]

Botema
  Short answer: they might, but they might not. Don’t inflate or lie—inflating
  can backfire if they later verify or notice the mismatch. What country is
  the role in, and is it local or remote-for-abroad?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User is negotiating with a prospective employer and expressed worry about appearing awkward; no new factual data.]
  [drew on S3b, G3, S3a, S2 — 1 Otema, 3 drafted]

Botema
  I know it feels awkward, but negotiation is standard here and it signals you
  know your value—don’t anchor on your current pay. Offer a concise
  market-based range and ask about the budget: “Based on the role’s scope and
  local market, I’d expect X–Y. What range has the budget allocated for this
  position?” If pressed about current salary, keep: “I’d rather anchor on
  market value rather than my current pay.” What country is the role in, and
  is it local or remote-for-abroad, so I tailor the numbers for you?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   prospective role / —

  Nothing was written to any database.
```

## Checks

- PASS — moves onto what the role is worth, not what she is on
- PASS — gives her something she could actually say
- **FAIL** — never tells her to state a salary she is not on
- PASS — stayed in the area through the fear turn
- PASS — every reply ends on a question
- PASS — no two replies open the same way

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
