# She resigned and they suddenly found the money

_Run 2026-08-16 05:13 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage C throughout, and asks why the number only appeared once she was leaving.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I handed in my notice last week and now they've offered me 30% more to stay
  [stage C — User already works for the employer; money conversation is happening at their current job after submitting notice; they received a 30% counter-offer and are seeking guidance on next steps.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G8, S4c, S4, S4a — 1 Otema, 3 drafted]

Botema
  That 30% counter-offer is real and a classic move; it buys time but doesn’t
  always fix the deeper reasons you started looking. If you stay, demand a
  written plan: a clear title upgrade, a binding salary review date, specific
  milestones, and negotiable non-salary wins like a learning budget or
  flexible work. What is the one outcome you want to lock in in the next
  talk—title, growth, or a concrete plan—and how soon can you push for it?

  you > I'd asked for a raise twice before and got nothing
  [stage C — User is negotiating with current employer after past failed raise requests; now they face a retention offer and must decide next steps.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G9a, G1, G1a, G1b — 0 Otema, 4 drafted]

Botema
  That pattern is real and common: they offer a bump to keep you, but the
  deeper issues don’t move unless you insist on a binding plan. Since you
  asked before and got nothing, what is the one non-negotiable commitment you
  want in writing in the next discussion (and the earliest date you’ll accept
  it)?

  you > honestly the money was only part of why I was going
  [stage C — User is currently employed; negotiation is with their employer; money is not the sole driver.]
  [drew on G9, G8, G9a, G1 — 0 Otema, 4 drafted]

Botema
  That’s real—money is part of it, but the bigger pull is growth, impact, and
  the right environment. For the next discussion, have a short list of three
  non-monetary asks you must see in writing (e.g., a clear path to a bigger
  title or expanded responsibilities, a dedicated learning/mentorship plan,
  and a defined flexible-work arrangement with a concrete review date). What
  are the three non-monetary outcomes that would make you stay, and by when
  would you want them agreed in writing?

  you > my new employer has already sent the contract
  [stage B — User has received a contract from a new employer; currently in Stage B (negotiating with prospective employer)]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5a, G6, G7, S2 — 1 Otema, 3 drafted]

Botema
  That’s real leverage—use the contract to lock in what matters. Also confirm
  the currency and payment terms, and ask for a short extension to review if
  you need it. What are the three non-monetary terms you must have in writing,
  and by when would you want them confirmed?

  you > so do I take it or not
  [stage B — User asked for a go/no-go decision on a job offer; contract received; needs guidance on acceptance vs negotiation.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G7a, S3, S3a, G3 — 1 Otema, 3 drafted]

Botema
  I wouldn’t rush—take it only if the contract actually locks in your three
  non-monetary asks in writing and the growth path, title, and work terms are
  solid, plus payment terms are clear and stable. What are the three
  non-monetary terms you must have in writing, and would you want help framing
  the exact language to push for in the next reply?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  C, B
  touched_facets  S4, S4a, S4b, S4c, G1, G1a, G1b, G4, G4a, G4b, G4c, G4d, G8, G9, G9a, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G5
  closed_areas    —
  role/location   — / —
  where she is    She handed in her notice last week; they offered her a 30% raise to stay. She had asked for a raise twice before and got nothing. She has said that money was only part of why she was going. A contract from the new employer has been sent.
  trying to do    Decide whether to take the counter-offer or accept the contract from the new employer. Money is part of the calculation, but not the whole story.

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
