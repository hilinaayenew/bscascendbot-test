# She resigned and they suddenly found the money

_Run 2026-08-16 06:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stage C throughout, and asks why the number only appeared once she was leaving.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I handed in my notice last week and now they've offered me 30% more to stay
  [stage C — The user has submitted notice and received a 30% retention increase; needs guidance on whether to negotiate, accept, or leverage offer.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G8, S4c, S4 — 1 Otema, 2 drafted]
  [voice only: G4, G4b, G9, G1]

Botema
  Counter-offers are real, and in Africa they often buy time rather than fix
  the underlying issue. If you left for growth, learning, or culture, a 30%
  bump may not address those longer-term gaps, and many people accept and
  still move on within a year. What was the core reason you handed in your
  notice, and what outcome would make you feel confident staying?

  you > I'd asked for a raise twice before and got nothing
  [stage C — User is negotiating with employer they already work for; mentions past attempts to raise and no success; indicates internal negotiation context.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G9a, G8, G1 — 0 Otema, 3 drafted]
  [voice only: G1a, G9, G1b]

Botema
  That’s real: you asked for a raise twice before and got nothing, so a 30%
  bump to stay often hides the same underlying issue. With your notice on the
  table, push for a concrete retention package in writing—a clear promotion
  path or expanded responsibilities, a learning/mentorship budget, and a
  defined salary review date with a real ceiling if milestones are met. What
  would a credible retention plan look like for you, and what two to three
  non-negotiables must be in writing?

  you > honestly the money was only part of why I was going
  [stage C — User indicates monetary reasons were not the sole factor; focus on non-monetary retention levers and the underlying issues beyond pay.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G8, G9, G1a — 0 Otema, 3 drafted]
  [voice only: G1, G9a, G1b]

Botema
  You’re right: money is part of it, but growth, culture and real
  responsibility can matter just as much. What non-monetary elements would
  have to be included in that plan for you to feel confident staying?

  you > my new employer has already sent the contract
  [stage B — User has received a contract from a new employer and is in active negotiation with a prospective employer.]
  [drew on S5a, G6, S2 — 1 Otema, 2 drafted]
  [voice only: G3a, S5, G7a, G5]

Botema
  That contract is your next step, so don’t sign anything you haven’t fully
  reviewed. Request a written extension to review it and outline amendments
  that reflect your non-negotiables: concrete retention terms (promotion path
  and a salary review date with a ceiling), a learning/mentorship budget, and
  clarity on currency and any signing bonus or equipment. Do you want me to
  draft a concise note you can send to the employer to request time and lay
  out the changes?

  you > so do I take it or not
  [stage B — User is deciding whether to accept a raised offer and wants guidance.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G7, G7a, S3 — 1 Otema, 2 drafted]
  [voice only: S2, G3a, G9, S5a]

Botema
  Don’t sign today. If they can’t commit those in writing, you have every
  reason to walk away and keep negotiating elsewhere. What are your two
  must‑have terms to see in writing before you decide?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  C, B
  touched_facets  S4, S4a, S4b, S4c, G1, G1a, G1b, G4, G4a, G4b, G4c, G4d, G8, G9, G9a, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G5
  closed_areas    —
  role/location   — / —
  where she is    She handed in her notice last week. They offered 30% more to stay. Her new employer has sent the contract. She is deciding whether to take the counter-offer or move to the new contract.
  trying to do    She is weighing two paths: staying with the current employer or joining the new contract. Money was only part of why she was leaving; she had asked for a raise twice before and got nothing.

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
