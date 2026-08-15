# A nurse moving into health tech, offered far too little

_Run 2026-08-15 18:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Crosses stage A into B mid-conversation, and treats a half offer as a mismatch rather than a starting point.

## Transcript

```
BSC Coach — local area harness
  Area 9 · Salary & Negotiation · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've been a nurse for 6 years and I'm moving into health tech
  [stage A — User is re-pricing themselves into a new domain; no employer yet; exploring market value without an offer.]
  → enterDiscussionArea(9 · Salary & Negotiation)
  [drew on G2, S1, G10a, G10 — 1 Otema, 3 drafted]

Botema
  Your nursing experience is a real edge in health tech—target roles where
  clinical insight matters, like health data analyst or clinical product
  specialist. Start by picking one or two core skills (SQL and Python basics,
  plus healthcare data/workflow knowledge) and build a small portfolio project
  that demonstrates turning a clinical question into a data-backed answer.
  Which area in health tech are you most excited about—data, product, or
  implementation—and who in your network could mentor you as you begin?

  you > they've offered me something but it feels really low
  [stage B — Offer received; compensation appears below market; seeking negotiation guidance]
  [W · skipped — no location known yet]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5a, G7, S2, S5 — 2 Otema, 2 drafted]

Botema
  That’s real and common when you’re moving into health tech; your clinical
  experience is valuable, so you deserve a fair offer. Start by asking for a
  full breakdown (base, currency, signing bonus, learning budget, equipment,
  benefits, and any equity) and push for a clear path to salary review if the
  base can’t move. What is the base salary and currency they offered?

  you > it's about half what the job ads say for that role
  [stage B — User has an offer that is much lower than advertised; in negotiation stage]
  [drew on G3, G3a, G7, S3 — 1 Otema, 3 drafted]

Botema
  That’s real, and it’s not you—ads often show a range that the offer never
  meets. I’d push for a clear budgeted base range for the role and a direct
  link between the duties and your six years of clinical experience; if the
  base can’t move, negotiate a signing bonus, a learning budget, equipment,
  and a six‑month salary review, plus confirm pay in a stable local currency.
  What base and currency did they offer, and what was the range in the job ad?

  you > I keep thinking maybe I don't deserve more since I'm new to tech
  [stage B — User is still in offer stage and is experiencing imposter syndrome; pertains to negotiating with a prospective employer.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S3a, G9a, G7, S2 — 1 Otema, 3 drafted]

Botema
  That feeling is real, but it doesn’t mean you don’t belong here. Six years
  in nursing is exactly the kind of clinical insight health tech needs, so you
  absolutely deserve a fair offer for the role. What base and currency did
  they offer, and what was the range in the job ad?

  you > what do I actually say to them
  [stage B — User asked for exact phrases to use when negotiating after receiving a low offer in stage B.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2a, S3b, G6, S2 — 1 Otema, 3 drafted]

Botema
  Based on what I’ve researched for this role and the value of that clinical
  insight I’d contribute, the base salary offered is below the published
  range, so I’m looking for a base in the [X] to [Y] range in [local
  currency]. If the base can’t move, can we discuss a signing bonus, a
  learning budget, and a six‑month salary review to re‑base the package? What
  range can you move to today?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     9 · Salary & Negotiation
  covered_stages  A, B
  touched_facets  S1, G2, G10, G10a, G5, S2, S2a, S3, S3a, S3b, S5, S5a, G3, G3a, G6, G7, G7a, G9, G9a
  closed_areas    —
  role/location   health tech role (clinical background nurse transitioning) / —
  where she is    She is a nurse with six years of experience, currently transitioning into health tech. She has received an offer for a health tech role, but the compensation feels really low and is about half of what the job ads say for that role.
  trying to do    She wants to move into health tech. In her way is an underwhelming offer compared with the advertised range, and her own doubt about whether she deserves more since she is new to tech. What she has already tried: NONE.

  Nothing was written to any database.
```

## Checks

- PASS — reads the offer as a mismatch, not her worth
- PASS — values her clinical background rather than discounting it
- PASS — stayed in the area for all five turns
- PASS — every reply ends on a question
- **FAIL** — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
