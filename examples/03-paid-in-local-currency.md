# A foreign employer insisting on local currency

_Run 2026-08-16 06:42 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Negotiates the mechanism — review interval, pegging — rather than arguing about the currency itself.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I'm in Accra and a German company wants to hire me remotely
  [stage B — User has a German company offering a remote role; it's a live job discussion requiring negotiation with a prospective employer.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [no close example — voice only, advice from knowledge]
  [drew on G6, G7, G7a — 0 Otema, 3 drafted]
  [voice only: S5, G5, G9, S3a]

Botema
  That setup is exactly why currency and pricing matter in remote jobs from
  abroad. Push to be paid in a stable currency (USD or EUR) or have a formal
  FX-adjustment clause in the contract, with the rate reviewed at regular
  intervals (every 3–6 months) so you’re not hit by sudden moves. What have
  they offered so far around payment currency and contract terms?

  you > they say they'll only pay in cedis
  [stage B — Live negotiation about currency and contract terms with an overseas employer]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: remote software developer, Accra, remote , German company, pay in GHS (cedis)] 2 search, 0 sources
  [nothing citable — answering ungrounded, guard back on]
  [no close example — voice only, advice from knowledge]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2, S2a, S3 — 2 Otema, 1 drafted]
  [voice only: G9a, G7a, G9, G3a]

Botema
  That’s real and it’s why currency risk matters for you. My move would be to
  push for payment in USD or EUR, or at minimum a formal FX-adjustment clause
  that reviews the rate every 3 months so your salary doesn’t drift with the
  cedi. If you want a ready-to-use line: “Based on currency risk and market
  norms, I would like to be paid in USD (or EUR). If that isn’t possible,
  please include an FX adjustment clause in the contract that resets the
  salary every three months.” Does that approach fit what you’re comfortable
  pushing for, and would you like me to tailor the exact line to your
  situation?

  you > the cedi has moved a lot this year and I'm worried
  [stage B — User expresses worry about currency volatility (GHS) affecting remote job offer payment terms.]
  [no close example — voice only, advice from knowledge]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G9, G5, S3a — 0 Otema, 3 drafted]
  [voice only: S2, S5, G7, S3]

Botema
  That volatility is real and you’re right to worry. Does USD with a quarterly
  reset feel workable for you, or would you prefer a different mechanism?

  you > is there anything I can actually ask for here
  [stage B — User is negotiating with a prospective employer about payment terms; they asked for concrete asks they can propose.]
  [no new information — stall 1/2]
  [no close example — voice only, advice from knowledge]
  [drew on S5a, G3a, G9a — 0 Otema, 3 drafted]
  [voice only: G9, G7a, G3, S5]

Botema
  Yes. The most practical asks are: 1) get paid in USD (or EUR), or at minimum
  a quarterly FX adjustment clause that resets the salary to reflect the rate,
  using a published reference rate; 2) if they won’t budge on currency, push
  for a signing bonus to offset the currency risk. Does one of those feel
  workable for you, and would you like me to tailor the exact wording for your
  reply?

  you > how do I put that to them without sounding difficult
  [stage B — The user is in a live negotiation with a prospective employer and wants to phrase a request without sounding difficult.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G6, G9, S3b — 0 Otema, 3 drafted]
  [voice only: S2a, S2, S5a, S3a]

Botema
  Currency volatility is real, and it’s fair to address it in pay. Does that
  feel workable, or should I tailor it to your exact offer?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   remote software engineer / Accra, Ghana
  where she is    She is in Accra. A German company wants to hire her remotely and pay in cedis.
  trying to do    She wants to proceed with the remote opportunity from the German company, but she is worried about currency risk because the cedi has moved a lot this year.

  Nothing was written to any database.
```

## Checks

- PASS — reaches the mechanism, not just the currency
- PASS — takes the currency worry seriously
- PASS — handles the 'sounding difficult' turn without leaving
- PASS — most replies still end on a question
- PASS — never asks her to disclose her own pay
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- **FAIL** — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
