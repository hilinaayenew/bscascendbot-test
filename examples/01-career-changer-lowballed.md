# A nurse moving into health tech, offered far too little

_Run 2026-08-15 19:09 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is pricing themselves as transitioning into health tech rather than negotiating an offer]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S1, G10a, G10 — 1 Otema, 3 drafted]

Botema
  Your six years as a nurse give you a hard-won view of patient workflows and
  data quality—that’s exactly what health-tech teams pay for. Price the role
  by what the job pays someone who does it well, not by your nursing years,
  and translate your experience into tech terms (clinical workflows, data
  quality, EHRs) while you target roles that value that domain knowledge. What
  health-tech roles are you eyeing, and in which market are you planning to
  work from?

  you > they've offered me something but it feels really low
  [stage B — User received a job offer but feels it is low; wants negotiation help]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5a, G7, S2, S5 — 2 Otema, 2 drafted]

Botema
  That sounds rough, but it’s real—many health-tech offers undervalue the
  clinical insight you bring. I would push to get the full, written package
  and request a quick chat to review it, focusing on base salary, any signing
  bonus, equity (if relevant), learning budget, equipment, and the
  currency/remote terms. What does the current offer break down into, and
  which market are you negotiating from?

  you > it's about half what the job ads say for that role
  [stage B — User reports that the offer is about half of what job ads say for that role; studying how to respond in negotiation]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on G3, G3a, G7, S3 — 1 Otema, 3 drafted]

Botema
  That’s real—and it happens often. What exactly did they say the role
  involves, and what have they offered beyond base so far?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — This message signals impostor syndrome during a live negotiation with a prospective employer; needs alignment on stage and next steps.]
  [W · skipped — no location known yet]
  [drew on S3a, G9a, G7, S2 — 1 Otema, 3 drafted]

Botema
  That feeling is real—and it’s a bias many women face, not a reflection of
  your worth. Your six years in nursing are exactly the value health-tech
  needs, so anchor your ask to the market rate for the role and your domain
  edge, and push for a quick written review of base with a plan for a signing
  bonus or learning budget if the base can’t move. What does the offer look
  like beyond base, and who can you talk to next to review it?

  you > what do I actually say to them
  [stage B — User asks for exact script to respond to an offer and negotiate.]
  [drew on S2a, S3b, G6, S2 — 1 Otema, 3 drafted]

Botema
  That gap is real—and you deserve to be paid for the value you bring. Say
  this, exactly: "Thank you for the offer. Based on the scope of this
  health-tech role and local market rates, I’m targeting a base salary in the
  range of [X to Y]. If the base isn’t flexible, I’d like to discuss a signing
  bonus and a learning budget, along with clear currency/remote terms." What
  does the current offer include beyond base, and which parts matter most to
  you right now?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   health-tech role / —
  where she is    She is a nurse with six years of experience who is moving into health tech. An offer has been extended, but the proposed compensation feels low. The offer is about half of what the job ads say for that role.
  trying to do    She wants to negotiate the offer and figure out exactly what to say to them to advocate for her value in health tech. What is in her way: she has been worried she doesn't deserve more since she's new to tech. What she has already tried: NONE. She has asked for guidance on what to actually say to them.

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — every reply ends on a question
- PASS — never asks her to disclose her own pay
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
