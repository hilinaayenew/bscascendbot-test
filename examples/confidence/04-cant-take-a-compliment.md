# Doesn't believe positive feedback and never counts her own wins either

_Run 2026-09-01 12:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while nothing is named as stalled, and gives a concrete practice (writing wins down, naming what was actually said) rather than just reassurance that she's good enough.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I got really positive feedback on a project recently but I don't actually believe it
  [stage A — User expresses disbelief about positive feedback, indicating impostor syndrome but not taking action yet.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [drew on S5, S1a, S1 — 2 Otema, 1 drafted]
  [voice only: G5, G10, G7, G6]

Botema
  Imposter feelings love company, but the concrete praise you got is evidence
  you did real work. I would take it as a data point to anchor your own sense
  of competence, and pair it with a quick note: what exactly did they
  highlight, what did you contribute, what impact did it have? What one
  concrete thing in that feedback would you want to own and carry into your
  next project?

  you > I just assume they're being nice, or that it went well by luck
  [stage A — She expressed imposter feelings about praising feedback—no action, just belief.]
  [no new facts about her — note left alone, no call made]
  [sentence cap fired — the model wrote a rundown]
  [drew on G1, G8, G6 — 0 Otema, 3 drafted]
  [voice only: S5a, S1, S2, G10]

Botema
  That line of thinking is exactly what imposter syndrome feeds on—praise
  feeling like luck or politeness, not real impact. I’d treat the feedback as
  evidence of your doing real work and pull out one concrete detail you can
  own going forward. Does that feel like something you could act on this week?

  you > honestly this happens pretty much every time someone compliments my work
  [stage A — User expresses ongoing imposter feelings with compliments, not a concrete next step; keeps within A stage.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G1, S1b, G7 — 0 Otema, 3 drafted]
  [voice only: S5a, S5, G5, G6]

Botema
  It’s not you failing to internalise praise; it’s a common response to being
  under constant scrutiny. I’d suggest you pick the most recent compliment,
  write down exactly what you did, the impact, and one concrete thing you’ll
  own from it this week.

  you > and I don't really keep track of my own wins either, I just forget about them
  [stage A — User is describing a pattern (forgetting wins) that keeps imposter syndrome alive; still in development phase, not yet acting on a plan.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [sentence cap fired — the model wrote a rundown]
  [drew on G1, G10, S5a — 0 Otema, 3 drafted]
  [voice only: S2, S1, G9, G8]

Botema
  That pattern is exactly how imposter feelings hide in plain sight. I would
  start a simple wins log you actually use: one line per task, what you did,
  the impact, and a concrete takeaway you own next time. What was your last
  small win you could log right now?

  you > how do I actually get better at this
  [stage A — User is asking for actionable steps to improve imposter syndrome in the Confidence & Imposter Syndrome area.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [drew on G1, G5, S1b — 0 Otema, 3 drafted]
  [voice only: S2, G8, G10, G3]

Botema
  What you’re asking for is a skill you get better at with practice and a
  simple system you actually use. Do that for a week, then review it with a
  trusted mentor or peer to reinforce the pattern. Does that feel doable for
  you this week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a
  closed_areas    —
  role/location   — / —

  Nothing was written to any database.
```

## Checks

- PASS — stays in stage A while nothing is named as stalled
- PASS — draws on S5 or G1
- PASS — gives a concrete practice, not just reassurance
- PASS — does not just tell her she's good enough without anything concrete to do
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- **FAIL** — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
