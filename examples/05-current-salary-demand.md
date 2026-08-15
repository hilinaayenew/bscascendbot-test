# A recruiter asking what she is currently on, before any offer exists

_Run 2026-08-15 19:09 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage B. She is being pushed to anchor on a salary that would trap her — tests whether the coach moves the conversation onto what the ROLE is worth, gives her words for a payslip demand, and handles 'should I just say a higher number' without either moralising or transplanting a US pay-history ban that does not apply where she is.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > there's a role i really want and the recruiter has asked what im currently on before they put an offer together
  [stage A — The user is in the pricing/valuation stage before an offer, not yet negotiating with an employer.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on G10, G10a, S1, G2 — 1 Otema, 3 drafted]

Botema
  That question is real, and you don’t have to give your current salary. Frame
  it around the market value for the role and your level, and if pressed for a
  number, offer a market-based range with your target at the bottom, and note
  whether you want local currency or a remote/foreign-rate. What is the role
  and location so I can help you draft the exact line you can use?

  you > problem is im badly underpaid where i am now, i think its about half what this role should pay
  [stage B — User is negotiating a prospective offer and reveals current pay is much lower than market; needs help with how to respond.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S3b, G7, S2, S3a — 1 Otema, 3 drafted]

Botema
  You’re not imagining it—underpayment is real and it makes this negotiation
  harder. I would not anchor on your current pay; instead, anchor on the
  market value for this role and your level. Would you like me to tailor the
  numbers to your city and role level, and give you a version for email or
  in-person chat?

  you > she's also asked me to send a payslip to confirm it
  [stage B — The user is in Stage B and employer asked for a payslip]
  [drew on S3b, S5, G3, G3a — 1 Otema, 3 drafted]

Botema
  That request is real, but I wouldn’t disclose a payslip. I’d push back with
  a market-based stance: “I don’t share my current payslip; I’d rather we
  anchor on the market value for this role and my level. Could you share the
  budgeted range for this position and confirm whether pay is in local
  currency or USD?” Would you like this drafted for email or for a quick chat,
  and what city/role is it so I tailor the wording?

  you > if i give her a higher number will they find out
  [stage B — Question about whether a higher number will be discovered is a negotiation tactic concern; belongs to stage B]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, S3, G6, S3a — 1 Otema, 3 drafted]

Botema
  I wouldn’t. If you give a higher number, you risk losing credibility or
  being boxed into a higher anchor you can’t defend, and there’s a real chance
  they’ll question you later if they verify or compare. Want me to draft a
  tight line for email or chat, and what city/role is this for so I tailor it?

  you > i dont want to seem awkward and have them just move on to the next candidate
  [stage B — User wants guidance to avoid awkwardness and keep the candidate engaged during a live negotiation; this is a shift within stage B toward interview prep/negotiation tactics.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3b, G3, S3a, S2 — 1 Otema, 3 drafted]

Botema
  That feeling is real, but it’s also a normal part of negotiating in our
  market. Would you like me to tailor either version to your city and the
  exact role, and tell me whether you want it for email or chat?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   the role they want / —
  where she is    She is currently in a job where she is badly underpaid, estimating the current pay is about half of what the target role should pay. She has been asked to send a payslip to confirm her current pay.
  trying to do    She wants the role she really wants and to anchor negotiations on market value rather than her current pay. She has asked to send a payslip to confirm it as part of the process. What she has already tried: NONE. She doesn’t want to seem awkward and fears the recruiter might move on to the next candidate.

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
