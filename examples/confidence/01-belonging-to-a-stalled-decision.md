# Feeling like she doesn't belong, then naming a promotion she hasn't applied for

_Run 2026-09-01 12:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I constantly feel like I don't belong in this field
  [stage A — User is expressing ongoing imposter feelings with no action blocked yet.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [drew on S1, G5, S2 — 2 Otema, 1 drafted]
  [voice only: G1, G7, S1b, G3]

Botema
  Feeling like you don’t belong in tech is incredibly common for women here,
  not a personal flaw—you’re up against a field that’s still slowly changing
  its culture, not you. What I’d do next: pick one small thing you can own
  this week—log one win, ask one question in a meeting, or reach out to a
  mentor or sister in tech for coffee. Does one of those feel doable for you
  this week?

  you > everyone around me seems so much more sure of themselves than I am
  [classification missing/invalid stage "undefined" — retrying once at double the token budget]
  [stage A — Expression of internal comparison and imposter feelings with no action, fits Stage A.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [drew on S1, G10, G7 — 1 Otema, 2 drafted]
  [voice only: G1, G5, G6, S5]

Botema
  That impression is incredibly common in tech, especially for
  women—confidence on the outside often hides the same inner dialogue you’re
  having. What matters is what you show up with, not how loud the doubt
  sounds. Which one feels most doable for you right now?

  you > there's actually a promotion open right now and I haven't put my name forward because of exactly this feeling
  [stage B — The user is delaying applying for a promotion due to self-doubt, i.e., a concrete action (applying) is being blocked by imposter syndrome.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [second question dropped — one per reply]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: S3a, S3, G4, S3c]

Botema
  In my experience, you apply to keep the door open even when you’re not 100%
  sure—they hire for potential and for what you can learn next, not a perfect
  snapshot of today. What I’d do now: write a 2–3 line case for why you
  deserve it, focusing on what you’ve shipped, what you’ve learned, and what
  you’d tackle next in that role, and put your name forward. Does that feel
  doable this week?

  you > I keep telling myself I'm just not ready for it yet
  [stage B — User expresses self-doubt that is preventing taking action (not applying for promotion).]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G2, G4, S3a — 0 Otema, 3 drafted]
  [voice only: S3, S3b, S4, S3c]

Botema
  What I would do next is: draft a 2–3 sentence case for why you deserve the
  promotion (shipments, learnings, and concrete plan for the role) and submit
  your name this week anyway. What is the smallest, truly doable piece you
  could commit to delivering in the next two weeks to back up that pitch?

  you > so what should I actually do
  [stage B — User is asking for concrete actions to overcome self-doubt that is blocking applying for a promotion.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [drew on G2, S3b, S4 — 1 Otema, 2 drafted]
  [voice only: G4, S3a, S3c, S3]

Botema
  If you want a quick win, add two bullets of recent impact and one clear
  next-step you’d own in the new role, then run it by a trusted mentor for
  quick feedback. Does that feel doable this week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    — A mid-level professional in tech, in a place where advancement opportunities exist but she is currently hesitant to pursue them, and she has not yet submitted for the open promotion.
  trying to do    — she wants to move into the promotion, but the fear of not being ready holds her back; she has tried reframing the doubt and considering small steps like applying despite insecurity, but she has not taken action yet for this opportunity. NONE

  Nothing was written to any database.
```

## Checks

- PASS — classified stage A on the opening message
- PASS — reaches stage B once the stalled promotion is named
- PASS — does not dismiss or minimise the feeling
- PASS — names the decision as separate from the feeling by the end
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
