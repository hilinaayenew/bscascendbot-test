# A teacher switching in purely for stability, not passion

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Deliberately probes the A/B boundary: a named prior career (teacher) should place her in stage B even while she's also unsure what to pick — the prior career is what distinguishes B, not field-certainty. Doesn't moralise about a purely financial motivation, values her teaching background, and reaches stage D once she asks a concrete timeline question.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I'm a teacher and I want to switch into tech
  [stage B — Prior teaching experience is a non-tech background; user is asking about applying to tech, which is a career change.]
  → enterDiscussionArea(1 · Getting Started)
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, G4, S5a — 1 Otema, 2 drafted]

Botema
  That’s a real and doable transition. Your classroom experience already gave
  you problem-solving, communication, and mentoring—exactly what tech teams
  value, especially for roles like data, product, or frontend with a
  user-focus. What area in tech are you most drawn to—data, web development,
  UX, or something else—and what’s your current time availability for learning
  each week?

  you > honestly it's not really passion, I just want more stable pay
  [stage B — The user is transitioning from teaching to tech with stability/pay as the primary driver, not passion; this is a new information point that moves from initial exploration (A) toward B with a focus on applicability of prior experience.]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, S5a, G4 — 1 Otema, 2 drafted]

Botema
  stability matters, and you’re right to go for a role with steady pay and
  clear progression. In my experience, data analytics, IT support, and QA are
  solid entry points with reliable pathways and local demand, especially if
  you’re open to remote-for-abroad or local roles. How much time per week can
  you realistically commit to learning over the next 3–6 months?

  you > is that a bad reason to do this
  [stage C — User is asking whether a money/stability motive is a valid driver for switching into tech; this is a mindset/method question rather than a specific plan.]
  [no new facts about her — note left alone, no call made]
  [no close example — voice only, advice from knowledge]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2, G1a, S2a — 1 Otema, 2 drafted]
  [voice only: S2b, G1]

Botema
  No—it's a solid, honest reason to switch. Financial stability is real and
  important, and tech often offers clearer progression than teaching if you
  choose a path with real demand. How quickly can you start a 2–3 month
  bootstrapped plan to land a first entry role in one of those areas?

  you > what should I actually pick, given that
  [stage C — User asks which pathway to pick among data analytics, IT support, QA for stability and quick entry.]
  [no new facts about her — note left alone, no call made]
  [second question dropped — one per reply]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2b, G1, G1a — 0 Otema, 3 drafted]
  [voice only: S2, S2a]

Botema
  Given your priority for stability, I’d pick IT support or QA as the most
  realistic entry points right now. IT support is the fastest to land and you
  can lean on your teaching communication skills; QA gives you a solid doorway
  into product teams with less math upfront. Does IT support feel more
  plausible to you to start this month?

  you > how long is this going to realistically take me
  [stage D — User asks for a realistic timeline to land a first entry IT support/QA role; moving from method talk to concrete timeline.]
  [no new facts about her — note left alone, no call made]
  [drew on S4, S6a, S4b — 1 Otema, 2 drafted]
  [voice only: S3, G6, G2, S6]

Botema
  Realistically, 4–6 months of focused, part-time study (around 15–20 hours a
  week) to land an entry IT support or QA role; if you can go full-time, 3–4
  months is possible. The key is steady weekly practice, a small ticketing/QA
  project you can show, and targeted job applications as you learn. Does that
  timeline fit what you can commit starting this month?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  B, C, D
  touched_facets  S5, S5a, G4, S2, S2a, S2b, G1, G1a, S3, S4, S4a, S4b, S6, S6a, G2, G6
  closed_areas    —
  role/location   — / —
  where she is    — A teacher exploring a switch into tech, seeking more stable pay, with current role in education and ongoing interest in a tech path that supports steadier compensation.
  trying to do    — She wants to move toward a tech role that offers reliable pay, focusing less on passion-driven motivation and more on financial stability. She has mentioned stability as a priority and has not specified a preferred area in tech or concrete steps taken so far. NONE

  Nothing was written to any database.
```

## Checks

- PASS — classified stage B on the opening message (named prior career)
- PASS — does not moralise about a money-driven motivation
- PASS — values her teaching background as an asset
- PASS — reaches stage D by the final, concrete timeline question
- PASS — reaches a realistic timeframe by the end
- PASS — most replies still end on a question
- PASS — never asks her to disclose personal financial details
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
