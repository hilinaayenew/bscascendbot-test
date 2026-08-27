# She resigned and they suddenly found the money

_Run 2026-08-24 13:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage C throughout, and asks why the number only appeared once she was leaving.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I handed in my notice last week and now they've offered me 30% more to stay
  [stage C — User is negotiating with current employer after handing in notice; they have been offered a 30% raise to stay.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G8, S4c, S4 — 1 Otema, 2 drafted]
  [voice only: G4, G4b, G9, G1]

Botema
  That 30% bump is a solid offer, but counter-offers rarely fix the deeper
  reasons you started looking in the first place. Before deciding, check: has
  the role genuinely improved, is the raise sustainable (currency, review
  cadence, future raises), and will you see a clear path for growth? What was
  the core reason you started looking, and what would have to change in the
  next 6 months for you to feel confident staying?

  you > I'd asked for a raise twice before and got nothing
  [stage C — They’ve previously been denied raises and now face a current 30% offer after giving notice; this changes negotiation dynamics and decision making.]
  [sentence cap fired — the model wrote a rundown]
  [drew on G9a, G8, G1 — 0 Otema, 3 drafted]
  [voice only: G1a, G9, G1b]

Botema
  That’s real, and it’s part of the pattern many women face. Because you asked
  before and got nothing, the 30% offer should come with a formal plan, not a
  one-off bump. What matters most to you right now—salary, growth path, or
  something else—and what would have to be in the plan for you to stay?

  you > honestly the money was only part of why I was going
  [stage C — They say money was only part of your motivation; this changes the negotiation framing to non-salary factors and a retention plan.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on G8, G9, G1a — 0 Otema, 3 drafted]
  [voice only: G1, G9a, G1b]

Botema
  I’d push for a concrete 6–12 month plan that ties the new role’s scope to a
  clear growth path, mentorship or learning budget, and a milestones-based
  salary review with attention to currency/remote-work realities. What
  non-monetary factors matter most to you now, and what milestones would you
  need in that plan to feel confident staying?

  you > my new employer has already sent the contract
  [stage B — User has an active job offer/contract from a new employer; this is negotiation with a prospective employer.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on S5a, G6, G7 — 0 Otema, 3 drafted]
  [voice only: G3a, S5, G7a, G5]

Botema
  Since the contract is already in play, respond with a brief pause to review
  and push for concrete tweaks: a stable currency with a defined salary review
  cadence, a signing bonus or equipment budget, and a 6–12 month milestones
  plan that ties scope to growth and a salary review. Do you want me to draft
  a tight note you can send today, prioritising currency, growth plan, and
  remote-work terms?

  you > so do I take it or not
  [stage C — User is deciding whether to accept a counter-offer from their current employer; this is a post-offer negotiation scenario related to career path and growth, so stage C and routing to Career Paths & Roadmaps.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G8, G9a, G1b — 0 Otema, 3 drafted]
  [voice only: G9, G1a, G1]

Botema
  If they can’t promise that now, I’d take the new role and treat the
  counter-offer as information, not a fix.

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  C, B
  touched_facets  S4, S4a, S4b, S4c, G1, G1a, G1b, G4, G4a, G4b, G4c, G4d, G8, G9, G9a, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G5
  closed_areas    —
  role/location   New role contract / —
  where she is    She handed in her notice last week, and the current employer has offered her 30% more to stay. Her new employer has already sent the contract.
  trying to do    She is trying to decide whether to take the offer to stay or move to the new role, which already has a contract in play. Money was only part of why she started looking, and she has asked for a raise twice before and got nothing.

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
