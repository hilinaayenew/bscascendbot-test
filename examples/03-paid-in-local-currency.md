# A foreign employer insisting on local currency

_Run 2026-08-15 17:12 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Negotiates the mechanism — review interval, pegging — rather than arguing about the currency itself.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I'm in Accra and a German company wants to hire me remotely
  [stage B — User has a potential remote job offer from a German company; it's a negotiation stage with a prospective employer.]
  → enterDiscussionArea(9 · Salary & Negotiation)

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: remote role (unspecified), Accra, Ghana, remote with German company based in Europe; Accra location] 2 search, 3 sources
  [sentence cap fired — the model wrote a rundown]
  [drew on G6, G7, G7a, S2 — 1 Otema, 3 drafted]

Botema
  That setup is real and common: a German company hiring you remotely from
  Accra. The big leverage is the currency and the contract terms around it.
  What I would recommend right now: - Push for payment in a stable currency
  (USD or EUR). If they insist on local currency, demand a clear mechanism
  (e.g., monthly pegged to USD at a set rate or a quarterly revaluation) and
  get it written in the contract. I’d love to know: what currency did they
  propose, and is there a written contract yet?

  sources: himalayas.app, ghanacitizenship.com, sokojob.com

  you > they say they'll only pay in cedis
  [stage B — The employer insists on paying in Ghanaian Cedi, affecting pricing/negotiation strategy.]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: remote developer, Accra, Remote -based negotiation; currency in Cedi; international payroll; currency risk; negotiations about compensation terms] 2 search, 3 sources
  [sentence cap fired — the model wrote a rundown]
  [drew on S2a, S3, S3a, S5 — 2 Otema, 2 drafted]

Botema
  That’s real, and it’s a big risk. Paying in cedis for remote work with a
  German company can erode your true earnings because of exchange-rate
  volatility and unclear protections. What I would push for right now: -
  Demand payment in USD or EUR. If they won’t, get a clearly written mechanism
  in the contract: a fixed exchange-rate monthly or a quarterly true-up to the
  USD/EUR rate, so your pay doesn’t drift with the market. What currency did
  they propose, and do you have a draft contract yet?

  sources: www.glassdoor.com, www.levels.fyi, www.spotsalary.com

  you > the cedi has moved a lot this year and I'm worried
  [stage B — User expressed worry about cedi volatility affecting earnings; needs negotiation stance and tactics]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: remote tech worker, Accra, Ghana, ; German company; currency in cedi; volatility concerns] 2 search, 3 sources
  [sentence cap fired — the model wrote a rundown]
  [drew on G9, G5, S5a, S2 — 1 Otema, 3 drafted]

Botema
  You’re right to worry — paying in cedis for a German remote role exposes you
  to real exchange-rate risk, and that can crush your take-home over a year if
  prices swing. I would push for one of these protections: - Salary in USD or
  EUR, paid into your Ghana account, with no drift into local currency. - If
  they won’t pay in a foreign currency, a clearly written FX hedge: a fixed
  exchange rate each payday or a quarterly true-up to the USD/EUR rate, so
  your pay doesn’t drift with the cedi. - If you must accept GHS, add a
  floor/ceiling: your effective monthly salary won’t fall by more than a
  defined percentage due to FX, plus an annual cost-of-living adjustment. What
  terms did they put in writing, and would you be comfortable pushing for
  USD/EUR or a precise hedging mechanism?

  sources: www.glassdoor.com, www.glassdoor.com, www.payscale.com

  you > is there anything I can actually ask for here
  [stage B — User asked for actionable asks in a B-stage negotiation with a prospective employer; classify and tailor guidance.]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: remote software engineer (unspecified), Accra, Germany-based company hiring remotely from] 3 search, 3 sources
  [sentence cap fired — the model wrote a rundown]
  [drew on G6, G3a, G9a, S2 — 1 Otema, 3 drafted]

Botema
  Yes. There are clear, concrete asks you can make to reduce that currency
  risk and protect your take-home. - Salary currency: insist on USD or EUR. If
  they won’t pay in a foreign currency, demand a written FX hedge in the
  contract (for example, a fixed rate at each payday or a quarterly true-up to
  USD/EUR). What terms have they written so far, and would you want me to
  draft some exact lines you can send back?

  sources: www.levels.fyi, globalcostdata.com, grokipedia.com

  you > how do I put that to them without sounding difficult
  [stage B — User asked for how to phrase their request to avoid sounding difficult; stage B negotiation with prospective employer]

Botema …
  Let me check what's actually being paid for that at the moment — one moment.

  [W · searching: remote software engineer, Accra, Ghana, currency clause, FX hedge, USD/EUR] 2 search, 3 sources
  [sentence cap fired — the model wrote a rundown]
  [drew on G6, G9, G7, S2 — 1 Otema, 3 drafted]

Botema
  Yes. This is a normal, professional ask and you can frame it calmly and
  clearly. I’d use a short opening, then two concrete lines you can drop into
  a call or email. One-liner you can open with: - “I’m excited about this role
  and the impact we’ll create. Given FX volatility in Ghana, I’d like to align
  on compensation currency to protect both sides.” Two concrete asks you can
  include: - If possible, salary paid in USD or EUR. What is the current
  currency they’re proposing and when would the first payment be?

  sources: www.levels.fyi, grokipedia.com, globalcostdata.com

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B
  touched_facets  S2, S2a, S3, S3a, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5
  closed_areas    —
  role/location   remote software engineer / Accra, Ghana

  Nothing was written to any database.
```

## Checks

- **FAIL** — reaches the mechanism, not just the currency
- **FAIL** — takes the currency worry seriously
- PASS — handles the 'sounding difficult' turn without leaving
- **FAIL** — every reply ends on a question
- **FAIL** — no two replies open the same way
- **FAIL** — no reply stacks more than two jargon terms
- **FAIL** — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
