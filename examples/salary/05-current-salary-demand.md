# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-24 13:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — User is at a live negotiation with a prospective employer; recruiter asked for current compensation, and the user needs guidance on how to respond or negotiate around it.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3a, S3b, S2 — 1 Otema, 2 drafted]
  [voice only: G6, G5, G7, G3a]

Botema
  That request is real in our market, but you don’t have to reveal your
  current pay. Try: “I’d rather we anchor the offer on the market value of
  this role—what range has the team budgeted for it?” How did they respond to
  that, and what matters most to you in this offer besides salary?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User indicates current pay is about half of the market value for the role, which strengthens their negotiation case in a prospective-offer stage.]
  [repeated advice removed]
  [reply was entirely repetition — treating as a stall]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [nothing survived the guards — using the area's question]
  [drew on G7, G3, G3a — 0 Otema, 3 drafted]
  [voice only: G6, S5, S5a, G9a]

Botema
  What is the situation you are weighing up right now?

  you > she's also asked me to send a payslip to confirm it
  [stage B — The recruiter asked for a payslip to verify current pay during offer negotiation.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, S5, S3 — 2 Otema, 1 drafted]
  [voice only: G3, G3a, S2, G6]

Botema
  That’s real, and you don’t have to share a payslip. What has the recruiter
  said in response, and what other elements of the offer matter most to you
  besides salary?

  you > if i give her a higher number will they find out
  [stage B — User asks about risk of disclosing higher current salary and whether recruiter will find out; this is a live negotiation tactic in stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, G7a — 0 Otema, 3 drafted]
  [voice only: S3a, S3, S2, G9a]

Botema
  No. sharing a higher number can anchor the whole offer to that past figure,
  and some recruiters will try to verify it. What range have they mentioned so
  far, and which parts of the offer matter most to you besides salary?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User asking for tactics to avoid awkwardness and keep candidate engaged during negotiation]
  [drew on S3b, G3, S3a — 0 Otema, 3 drafted]
  [voice only: G3a, S2, G9, G7a]

Botema
  That concern is real, but negotiating for market value is normal here. Try
  something tight like: “I’m really excited about this role; to avoid
  anchoring on my current pay, could you share the budgeted range for this
  position and the decision timeline? I’d like to anchor on market value given
  the scope.” If they push back, you can steer to other levers later (signing
  bonus, learning budget, six-month review). Does that feel doable, and what
  have they already said about range or timing?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   — / —
  where she is    She is currently underpaid in her current role and believes her pay is roughly half of what the target role should pay. The recruiter has asked for her current pay and a payslip before an offer is prepared.
  trying to do    She wants the role she really wants, and the pay discrepancy between her current role and the market value for the target role is the main obstacle in negotiations. She has not described any concrete steps she has tried yet. She does not want to seem awkward or to have them move on to the next candidate. The recruiter has asked for her current pay and a payslip before an offer is prepared.

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
