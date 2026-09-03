# Doesn't believe positive feedback and never counts her own wins either

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while nothing is named as stalled, and gives a concrete practice (writing wins down, naming what was actually said) rather than just reassurance that she's good enough.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I got really positive feedback on a project recently but I don't actually believe it
  [stage A — The user describes a feeling about externally-given positive feedback, indicating imposter syndrome in progress (stage A) without action being stalled.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, S1a, S1 — 2 Otema, 1 drafted]
  [voice only: G5, G10, G7, G6]

Botema
  That feedback is real and you’re not imagining it. I would always recommend
  you capture it as concrete evidence: what was said, which outcomes it tied
  to, and what you did to earn it. Does it feel doable to jot down the exact
  lines of praise and the concrete impact in a quick note right after you
  finish the next milestone?

  you > I just assume they're being nice, or that it went well by luck
  [stage A — The user continues to discount positive feedback and expresses imposter-syndrome doubt without taking action.]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G1, G8, G6 — 0 Otema, 3 drafted]
  [voice only: S5a, S1, S2, G10]

Botema
  What you’re calling “niceness” or “luck” is your brain telling you to
  discount real evidence. I would always recommend you anchor feedback in
  concrete specifics—what exactly was praised, what you delivered, and the
  impact it had. What would it take for you to trust one piece of feedback
  this week as evidence of your growing impact?

  you > honestly this happens pretty much every time someone compliments my work
  [classification missing/invalid stage "undefined" — retrying at 4000 tokens]
  [stage A — This message shows discounting praise (internal belief) without a concrete action or decision stopping them; it's the 'A' stage where the feeling is being worked through.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [only a question survived the guards — answering as a wrap-up instead]
  [drew on G1, S3a, S1b — 0 Otema, 3 drafted]
  [voice only: G6, S3b, G5, S4]

Botema
  Could you start a small habit this week—after any compliment, note the
  specifics and the action you took in a quick line or two?

  you > and I don't really keep track of my own wins either, I just forget about them
  [stage A — Confirming the issue remains in stage A with no action yet]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G1, G10, S5a — 0 Otema, 3 drafted]
  [voice only: G8, G6, S1b, S5]

Botema
  I would always recommend you start a simple living log of wins—one line per
  achievement with what you did, the outcome, and the skill it shows. What’s
  one tiny win you can log today, so you don’t forget it tomorrow?

  you > how do I actually get better at this
  [stage A — The user asked for practical steps to overcome impostor feelings and improve the evidence-building habit discussed earlier.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on G1, G7, G5 — 0 Otema, 3 drafted]
  [voice only: G8, S5, S1a, S2]

Botema
  Two things help: build a tiny, daily wins log and couple it with a weekly
  reflection that ties praise to concrete outcomes. Log: for every win,
  capture date, project, the action you took, the outcome, and the impact
  (data or feedback line). Does that feel doable to start this week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a
  closed_areas    —
  role/location   — / —
  where she is    A senior professional in her field, currently receiving regular feedback but disputing its validity and lacking a system to track wins or evidence of impact.
  trying to do    She wants to build trust in positive feedback and prove her growing impact by capturing concrete specifics of praise, actions, and outcomes; she aims to establish a simple habit to log wins and track progress, and to move from disbelief to a reliable process that demonstrates improvement.

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
- PASS — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
