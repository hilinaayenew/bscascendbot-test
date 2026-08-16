# A nurse moving into health tech, offered far too little

_Run 2026-08-16 05:21 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — Transitioning from nursing to health tech; exploring salary expectations.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S1, G10a — 1 Otema, 2 drafted]

Botema
  That’s a solid move—and your nursing experience is your strongest entry
  ticket in health tech, because you understand patient care workflows from
  the inside. In my experience, the fastest path is to target roles that value
  clinical context (clinical data analyst, health informatics,
  implementation/support, product specialist) and then spell out how your
  nursing skills map to what those roles do, while you close the gaps in data
  and tech skills with a focused plan. Which health-tech area appeals most to
  you right now, and what learning resources or time do you have available to
  start?

  you > they've offered me something but it feels really low
  [stage B — User has received an offer but compensation seems low]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5a, G7, S2 — 1 Otema, 2 drafted]

Botema
  Yes—this is real and common. You deserve market value, not a lowball
  opening. What exactly did they offer, and which parts do you want to push
  for first (base, learning budget, signing bonus, or a review-and-raise
  clause)?

  you > it's about half what the job ads say for that role
  [stage B — The user has an actual offer that is significantly below market, so this is a negotiation in stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5, G3, G3a — 1 Otema, 2 drafted]

Botema
  Ask them straight: what range was this role budgeted at and what would that
  cover? If the budget won’t move, push for a structured package (base aligned
  to the range plus a six-month review and a learning budget or signing bonus)
  and confirm whether pay is in local currency or USD for remote work. How did
  they respond when you asked for the range?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User is negotiating an offer and expressing self-doubt about deserving more; it's still in negotiation stage (B) and this message adds new info about confidence concerns.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, S3 — 1 Otema, 2 drafted]

Botema
  That doubt is real for many women, but your nursing experience is exactly
  why you belong in health tech. Your clinical background gives you unique
  insight into patient care, safety, and workflows, and you deserve market
  value, not a lowball. What did they say when you asked for the range, and
  which part of the package matters most to you to win first?

  you > what do I actually say to them
  [stage B — User asks for concrete script to negotiate offer in stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2a, G6, S2 — 1 Otema, 2 drafted]

Botema
  Here’s a tight script you can use in your next convo: “Thank you for the
  offer — I’m excited to contribute here. Based on what I’ve researched for
  this role and the value my six years in nursing brings to health tech, I’m
  looking at a base in the range of [X to Y]. I’d also like a six‑month
  performance review to adjust pay if targets are met, plus a learning budget
  or signing bonus to build the necessary tech skills. Please confirm whether
  pay is in local currency or USD for remote work, and whether there’s room to
  move on the base.” If they push back, you can add: “If the base can’t move,
  I’d consider the bottom of the range plus a signing bonus or learning budget
  and the six‑month review.” Does that tone and structure fit how you want to
  approach the conversation, or do you want me to tailor it to the exact role
  and location?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   health tech entry role (nursing-to-healthtech transition) / —
  where she is    She is a nurse with six years of experience, currently transitioning into health tech. They have offered her a role, but the compensation feels really low. The offer is about half of what the job ads say for that role.
  trying to do    move into health tech and negotiate a fair package. What is in her way: the offer remains half of what the ads say and she is wrestling with self-doubt, thinking she doesn't deserve more because she is new to tech. What she has already tried: NONE. She is now seeking guidance on what to say to them.

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — most replies still end on a question
- PASS — never asks her to disclose her own pay
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
