# She resigned and they suddenly found the money

_Run 2026-08-15 19:33 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage C throughout, and asks why the number only appeared once she was leaving.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I handed in my notice last week and now they've offered me 30% more to stay
  [stage B — User is negotiating with a prospective employer after receiving a retention offer; Stage B]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on S5a, G6, G7, S2 — 1 Otema, 3 drafted]

Botema
  Counteroffers are real—your company knows they’ll lose you and will throw a
  bigger number to keep you, and 30% is meaningful in this market. The trap is
  that it’s not always a permanent fix and there may be higher expectations or
  a ceiling later if there’s no clear growth path. What matters most to you
  right now—the money, the growth path, or staying somewhere you feel
  valued—and where are you leaning after this offer?

  you > I'd asked for a raise twice before and got nothing
  [stage C — User is in the employer pay-talk stage (they already work there) and has past raise refusals; they now report a counteroffer after handing notice.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on G8, S4b, S4c, S4 — 1 Otema, 3 drafted]

Botema
  That pattern is real for women in tech—being ignored on pay after you push
  for it isn’t you, it’s the system. Since you asked twice before and got
  nothing, push for a concrete, written growth plan tied to the raise: a
  formal title/role expansion, a six- to twelve-month salary review with a
  market-aligned target, and clear milestones (plus any learning or support
  you need). What would a credible growth path look like for you here, and
  what milestones would you insist on?

  you > honestly the money was only part of why I was going
  [stage C — User handed notice and got counteroffer; message signals stage C with new emphasis on non-monetary reasons and long-term fit.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G8, G9, G9a, G1 — 0 Otema, 4 drafted]

Botema
  You’re right—the reasons you were leaving go beyond money. If you leave,
  identify your top non-monetary priorities (leadership, mentorship, culture,
  flexibility) and judge offers against those. What matters most to you right
  now, and which path aligns best with your long-term goals?

  you > my new employer has already sent the contract
  [stage B — User has a contract from a new employer; categorizes as offer/negotiation stage with prospective employer.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5a, G7a, G6, S3 — 1 Otema, 3 drafted]

Botema
  Nice move to have the contract in hand. Do a quick pass now to verify: title
  and duties match what you were promised, base pay and currency with a clear
  payment schedule, and the non‑monetary terms (start date, remote/flexible
  work, leave, benefits, notice period). What three terms in the contract are
  you most uncertain about right now, so I can help you draft the exact
  language to push back or confirm?

  you > so do I take it or not
  [stage B — User has a live contract/offer and is asking whether to accept or reject; falls squarely in stage B negotiation with prospective employer.]
  [drew on S5a, G6, G7, S2 — 1 Otema, 3 drafted]

Botema
  I can’t decide for you, but use three lenses: does the role genuinely grow
  you, is the pay fair and stable in your context (currency, payment
  schedule), and do the everyday terms (start date, remote options, leave,
  benefits) feel sustainable for the next 2–3 years. If all three line up,
  accepting makes sense; if any is weak, push for clarity or walk away. What
  is the one term in the contract you’re most uncertain about, and what would
  you need to feel confident saying yes?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  B, C
  touched_facets  S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a, G5, S4, S4a, S4b, S4c, G1, G1a, G1b, G4, G4a, G4b, G4c, G4d, G8
  closed_areas    —
  role/location   current role at employer / —
  where she is    She handed in her notice last week; the employer offered 30% more to stay; the new employer has already sent the contract.
  trying to do    She is weighing whether to accept the counteroffer; money was only part of why she was leaving, and she had asked for a raise twice before and got nothing.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage C
- PASS — questions why the money appeared only now
- PASS — treats money as not the whole reason
- PASS — every reply ends on a question
- PASS — never asks her to disclose her own pay
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
