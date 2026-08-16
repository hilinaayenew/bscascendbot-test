# A nurse moving into health tech, offered far too little

_Run 2026-08-16 05:13 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is pricing themselves coming from nursing into health tech; no live negotiation yet.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S1, G10a, G10 — 1 Otema, 3 drafted]

Botema
  Your nursing six years is exactly the kind of domain knowledge health tech
  teams pay for. Price yourself by the role, not your past title; target roles
  where your clinical insight is immediately valuable (clinical product
  analyst, health data analyst, implementation/rollout specialist, or a
  health-tech product associate). Which health-tech roles feel like the best
  fit for you, and are you looking locally or open to remote opportunities?

  you > they've offered me something but it feels really low
  [stage B — User has an offer that feels low; this is a negotiation at the offer stage (stage B).]
  [W · skipped — no location known yet]
  [drew on S5a, G7, S2, S5 — 2 Otema, 2 drafted]

Botema
  That feeling is real and common; offers often undervalue the health-tech
  value you bring, especially for women negotiating. I’d push for the full
  written package with a clear base, currency, and any non-salary elements
  (like a learning budget or equipment), then propose a quick call to discuss
  a fair adjustment. What does this current offer include, and which parts
  matter most to you to upgrade first?

  you > it's about half what the job ads say for that role
  [stage B — Offer is about half of market ads for that role; user is negotiating and needs to push for market-aligned compensation.]
  [drew on G3, G3a, S2a, S3 — 1 Otema, 3 drafted]

Botema
  That gap is real and common here—the advertised range and the actual budget
  for the role often don’t line up. I’d push for clarity on the budgeted range
  for this role (in the local currency) and, if the base can’t move, negotiate
  a concrete upgrade on non-salary terms (learning budget, equipment, signing
  bonus) plus a six‑month review. What has the recruiter said about the range
  so far, and which upgrade would matter most to you first?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User is in a live offer negotiation and expresses imposter syndrome, which is a mindset barrier affecting this stage.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, S3b, S2 — 1 Otema, 3 drafted]

Botema
  That feeling is real for many women stepping into tech, but your six years
  in nursing is exactly the health-tech value they’re buying—domain insight,
  risk awareness, patient outcomes. What has the recruiter said about the
  budget for this role, and which upgrade would matter most to you to push
  first?

  you > what do I actually say to them
  [stage B — User asked for exact script to say during a live offer negotiation in stage B]
  [drew on G6, G7a, G9, S2 — 1 Otema, 3 drafted]

Botema
  Thank you for the offer—I'm excited to bring my nursing experience into
  health tech. Could we confirm the budgeted range for this role in local
  currency, and if the base can’t move, discuss upgrading non-salary terms
  (learning budget, equipment, signing bonus) plus a six-month review with a
  salary re-check? Would you have time for a short call this week to align on
  the package?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   health-tech transition candidate (clinical product analyst / health data analyst, etc.) / —
  where she is    She is a nurse with six years of experience; she is moving into health tech. They have offered her something, but the offer feels really low, about half of what the job ads say for that role.
  trying to do    She is trying to move into health tech. She is wrestling with the belief that she doesn't deserve more because she is new to tech.

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — most replies still end on a question
- PASS — never asks her to disclose her own pay
- **FAIL** — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
