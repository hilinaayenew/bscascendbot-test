# A nurse moving into health tech, offered far too little

_Run 2026-08-24 13:10 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is transitioning from nursing to health tech and is likely in exploration/pricing stage, no live offer or negotiation yet.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on G2, S1, G10a — 1 Otema, 2 drafted]
  [voice only: G10, G5]

Botema
  Your six years as a nurse are a huge asset in health tech—start by targeting
  roles that value clinical insight, like healthcare data analyst or clinical
  informatics, and build a focused base: SQL and Excel, some Python or R, plus
  HL7/FHIR basics and a small portfolio project. I’d also recommend a short
  cert and joining local health-tech networks to get mentored quickly; which
  area in health tech excites you most and where are you aiming to land (city
  or remote) so I can tailor the next steps?

  you > they've offered me something but it feels really low
  [stage B — They have an offer that feels low and want negotiation guidance.]
  [drew on S5a, G7, S2 — 1 Otema, 2 drafted]
  [voice only: G3, G7a, S3b, G9]

Botema
  That real is real: offers can feel low when you’re moving into health tech,
  especially here. I’d push for a written breakdown, a six‑month review with a
  clear uplift, and non‑salary upgrades like a learning budget, signing bonus,
  equipment allowance, or remote flexibility, and make sure currency and
  payment terms are in the contract if it’s remote. What does the current
  offer include, and which parts do you most want to improve—base pay, growth
  funding, or flexibility?

  you > it's about half what the job ads say for that role
  [stage B — The user reported offer is about half the ads, a concrete negotiation trigger.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S5, G3, G3a — 1 Otema, 2 drafted]
  [voice only: S2, S2a, G9, G9a]

Botema
  That gap is real in our market—ads often quote a target that the budget for
  the actual hire doesn’t meet. If base can’t move, push for those levers and
  a six‑month reevaluation. What has the employer said so far about the
  discrepancy, and which levers matter most to you—base, growth funding, or
  flexibility?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User is in stage B (negotiating with an employer) and is expressing imposter syndrome/self-doubt about deserving more; this is new and affects approach to negotiation.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, S2a — 0 Otema, 3 drafted]
  [voice only: S5a, S3b, G7, G3]

Botema
  That imposter feeling is real, and you’re not alone. Your nursing six years
  give you clinical insight that health-tech teams would pay a premium for,
  not dismiss; you deserve a fair offer that reflects the value you bring.
  Practice a short pitch that links your clinical experience to safer patient
  care, better workflows, and clearer data-informed decisions.

  you > what do I actually say to them
  [stage B — User asked for exact talking points to say to a prospective employer about an offer.]
  [sentence cap fired — the model wrote a rundown]
  [drew on G6, S3, S3b — 1 Otema, 2 drafted]
  [voice only: S5, S5a, G3a, G7]

Botema
  Thank you for the offer; I’m excited to bring six years of nursing into
  health tech to improve patient safety, streamline workflows, and drive
  data-informed decisions. Based on the impact I can deliver, I’d like to
  discuss moving the base salary toward the higher end of the range and adding
  concrete non-salary benefits like a learning budget, equipment allowance,
  and a clearly defined six-month performance review with a guaranteed uplift
  if targets are met. Are you open to aligning the offer with the impact I can
  deliver?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   transitioning nurse to health tech (clinical informatics / analytics) / —
  where she is    She is a nurse with six years of experience; she is moving into health tech. She has been offered something but it feels really low. The offer is about half what the job ads say for that role.
  trying to do    She wants to move into health tech with fair compensation, but she is grappling with imposter syndrome and thinking she doesn’t deserve more since she’s new to tech. She hasn’t tried negotiating yet. Now she is asking what she should actually say to them to negotiate—she wants a concise, value-focused script that connects her six years of nursing to safer patient care, streamlined workflows, and clearer data-driven decisions.

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
