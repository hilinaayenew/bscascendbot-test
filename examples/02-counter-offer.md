# She resigned and they suddenly found the money

_Run 2026-08-16 05:27 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage C throughout, and asks why the number only appeared once she was leaving.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I handed in my notice last week and now they've offered me 30% more to stay
  [stage C — User is negotiating with current employer after handing in notice; decision falls in stage C]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G8, S4c, S4 — 1 Otema, 2 drafted]
  [voice only: G4, G4b, G9, G1]

Botema
  Counter-offers are real, but they rarely fix the underlying reasons you
  handed in your notice. If you stay, demand a written retention plan now: a
  clear role scope and title, a six-to-twelve month salary review tied to
  concrete milestones, and specific improvements you actually care about
  (learning budget, equipment, flexible/hybrid work, mentorship). What are the
  two or three non-monetary issues you needed addressed, and would you be
  willing to see them resolved in a retention plan?

  you > I'd asked for a raise twice before and got nothing
  [stage C — User has already been in a money negotiation with their current employer and states they asked for a raise previously without success; clearly stage C (they are negotiating with their current employer)]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G8, G9a, G1 — 0 Otema, 3 drafted]
  [voice only: G1a, G9, G1b]

Botema
  That history isn’t in your head—it's real, and it signals whether they value
  you long-term. If they can’t commit to that, the 30% offer may not be
  durable, and you should be prepared to walk again if the plan falters. What
  two or three specifics do you want in that written plan to feel secure
  staying?

  you > honestly the money was only part of why I was going
  [stage B — User confirms money wasn't the sole reason for leaving and future negotiations should address non-monetary factors; this keeps the area in B (offer/negotiation)]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5a, G6, S2 — 1 Otema, 2 drafted]
  [voice only: S5, S3b, S3a, S2a]

Botema
  I hear you—the money isn’t the whole story, and you shouldn’t sign on
  without real improvements you can count on. What are the two or three
  non-monetary outcomes that matter most to you, and would you insist they sit
  in that plan?

  you > my new employer has already sent the contract
  [stage B — The user now has a current offer contract from a prospective employer, indicating stage B negotiations.]
  [drew on G7, S5a, S3 — 1 Otema, 2 drafted]
  [voice only: G3a, S2a, G9, G5]

Botema
  That contract is your leverage, not a done deal. Don’t sign until you’ve got
  those guardrails written in and you’ve had a quick call to align on
  them—specifically a six-to-twelve month salary review tied to milestones, a
  defined learning budget and equipment support, and clarity on
  currency/payment timing. Does one of those terms need to be added or tweaked
  for you to feel secure?

  you > so do I take it or not
  [stage B — User is asking whether to accept a contract from a prospective employer; they previously negotiated and are weighing guardrails]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5a, G6, S2 — 1 Otema, 2 drafted]
  [voice only: S5, S3a, S3, G7a]

Botema
  Not yet. If they won’t commit in writing, you should walk unless you’re
  prepared to accept the current terms without guardrails. What are your top
  two non-monetary guardrails you’d insist on in writing, and is the company
  willing to lock those in now?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  C, B
  touched_facets  S4, S4a, S4b, S4c, G1, G1a, G1b, G4, G4a, G4b, G4c, G4d, G8, G9, G9a, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G5
  closed_areas    —
  role/location   prospective role / —
  where she is    She handed in her notice last week; the employer offered 30% more to stay; money was only part of why she was leaving. A new employer has sent the contract.
  trying to do    She is trying to secure a raise; she has asked for a raise twice before and got nothing. The money was only part of why she was leaving.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage C
- PASS — questions why the money appeared only now
- PASS — treats money as not the whole reason
- PASS — most replies still end on a question
- PASS — never asks her to disclose her own pay
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
