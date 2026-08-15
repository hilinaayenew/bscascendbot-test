# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-15 19:33 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage B — They are negotiating with a prospective employer and the recruiter asked for current salary.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on S3b, S3a, S2, S5 — 2 Otema, 2 drafted]

Botema
  Don’t share your current pay; anchor on the role’s value: “I’d rather we
  anchor on what this role is worth in the market—what range has the budget
  for this role been set at?” For remote roles, confirm whether pay is in
  local currency or USD as part of that range. What did they say about the
  budget range so far?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User is negotiating with a prospective employer; they reveal they are underpaid currently and believe this role should pay much more, which informs strategy.]
  [drew on G7, S3b, G3, S3 — 1 Otema, 3 drafted]

Botema
  You’re not imagining it—the pay gap for women in tech is real, and
  underpayment like you’re describing happens far too often. I’d push to
  anchor the discussion on the role’s market value, not your current pay: “I’d
  rather we anchor on what this role is worth in the market—what range has the
  budget for this role been set at?” If they pressure for your current salary,
  keep it simple: “I’m not comfortable sharing my current salary; I want to
  discuss compensation based on the market rate for this role and my
  experience.” Have they given you a budget range yet, and is it in local
  currency or USD?

  you > she's also asked me to send a payslip to confirm it
  [stage B — User is negotiating a role and recruiter asked for payslip; this fits stage B (negotiating with prospective employer)]
  [drew on S3b, G3a, G7, S2 — 1 Otema, 3 drafted]

Botema
  Don’t send a payslip. I’d rather we anchor on the market value of this role
  and my experience—what budget range has been set for this role, and will the
  pay be in local currency or USD? Have they given you a budget range yet, and
  in what currency?

  you > if i give her a higher number will they find out
  [stage B — User asks if inflating current salary will be discovered; this is a live negotiation scenario (stage B) and the advice should focus on not misrepresenting earnings and handling verification risks.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G6, S3a, S5 — 1 Otema, 3 drafted]

Botema
  Yes. They can and often do verify, so inflating your current pay runs real
  risk of trust and offers being pulled later. What did they say about the
  budget range and currency for this role?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — The user is worried about appearing awkward and losing the opportunity during a live chat/offer stage; this is a negotiation tactic question within stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G3, S3a, S2 — 1 Otema, 3 drafted]

Botema
  That fear is real, but you’re not doing anything wrong by centering the talk
  on value. What range and currency have they mentioned, and how did they
  respond?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   — / —
  where she is    She is currently employed and is aware that her pay is under market value; she believes her current pay is about half of what this role should pay. The recruiter has asked her to send a payslip to confirm her current pay.
  trying to do    She wants the role she is really pursuing. The obstacle is the pay gap at her current job, which she estimates to be about half of the market value for the target role. The recruiter has asked what she is currently earning before they put together an offer. She is concerned that if she provides a higher current-salary figure, the recruiter might find out. She doesn’t want to seem awkward and have them move on to the next candidate.

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
