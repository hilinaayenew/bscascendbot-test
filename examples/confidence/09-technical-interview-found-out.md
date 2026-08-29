# Convinced a technical interview will expose her, then starts asking about the format

_Run 2026-08-28 22:02 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Draws on G9 while the subject is the fear, and once she turns to how the interview itself is run, either hands off to Interview Preparation or answers without pretending the fear is still the question.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I've got a technical interview next week and I'm convinced they'll realise I don't know what I'm doing
  [stage A — The user is expressing imposter-syndrome feelings about an upcoming interview; no concrete action is stalled yet.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [sentence cap fired — the model wrote a rundown]
  [drew on G9, S1b, S2 — 1 Otema, 2 drafted]
  [voice only: G5, S1a, G8, G1]

Botema
  That fear is real, and it’s exactly what I’d expect right before a technical
  interview. They’re judging how you think as much as what you know, and you
  earned this opportunity by being in the room already. What part of the
  interview format worries you most to rehearse first?

  you > I've been doing this job for three years, so I know that isn't rational
  [stage A — User still experiences fear (A stage) but is expressing awareness it’s irrational; this reveals a shift toward recognizing the feeling without taking action.]
  [drew on G9, S5, S5a — 1 Otema, 2 drafted]
  [voice only: G3, G6, G7, G1]

Botema
  I hear you, and yes—tenure doesn’t erase imposter feelings; they’re real and
  common even after three years. What has consistently helped is a focused,
  thinking-out-loud rehearsal on a single, well-understood project from your
  work. Which project would you choose for a 5-minute walk-through that shows
  your problem-solving process clearly?

  you > it's the live coding part specifically, having someone watch me think
  [stage B — User expressed a concrete barrier (live coding while being watched) that would cause them to hesitate or avoid the activity; this signals a decision behind the feeling, i.e., action/inaction, fitting Stage B.]
  [drew on S3a, G2, S3c — 0 Otema, 3 drafted]
  [voice only: S3, G4, S3b, S4]

Botema
  That live-coding bit with someone watching your thinking is exactly what
  they’re evaluating—your process under pressure, not a pristine spotless
  result. I would always recommend a tight thinking-aloud frame: clarify the
  goal, outline the approach, then implement in small, testable steps while
  narrating each decision and edge case; if you hit a snag, name a pivot you’d
  try and why. Which part of the live coding worries you most—the pace, the
  talking, or the way to handle a mistake?

  you > what actually happens in one of those, how are they marking it
  [stage A — User asked for specifics on how live-coding interviews are marked, which is new information that could guide preparation.]
  [repeated advice removed]
  [second question dropped — one per reply]
  [sentence cap fired — the model wrote a rundown]
  [drew on G9, G1, S1b — 0 Otema, 3 drafted]
  [voice only: G7, G5, G10, S2]

Botema
  In my experience, you’re given a problem and asked to solve it while the
  interviewer watches your reasoning, not just the final code. They’re scoring
  how you understand the goal, how you outline and execute a plan, what data
  structures and algorithms you choose, how you test with edge cases, and how
  you handle a snag or pivot when you’re unsure. Does that alignment help you
  map what to practice?

  you > so what should I be practising
  [stage A — User asked for actionable next steps in confidence area, indicating they're still working through feelings and seeking practical guidance.]
  [repeated advice removed]
  [drew on G9, S1b, G8 — 0 Otema, 3 drafted]
  [voice only: G1, G7, G5, G3]

Botema
  Great question. Do this: drill 2–3 problem families that show up in live
  coding—two-pointer problems, sliding-window/substring questions, and a solid
  bit of DP or graph traversal—and practice thinking aloud every step: state
  the goal, outline a plan, implement in small steps, write quick edge-case
  tests, and name a pivot if you’re stuck. Do 3–4 focused 20-minute
  live-coding sessions this week with a partner, narrating as you go and
  reviewing what you said afterward.

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    She has been in the current job for three years.
  trying to do    She is preparing for an upcoming technical interview next week, with emphasis on the live coding portion where someone will watch her think. She wants guidance on what to practice and how the interviewers will mark her performance. She has identified the live coding segment as the main hurdle and is seeking a focused practice plan.

  Nothing was written to any database.
```

## Checks

- PASS — draws on G9
- **FAIL** — names the fear as normal before the interview, not as evidence she is underprepared
- PASS — engages with how the interview is actually run once she asks
- PASS — uses her three years rather than treating her as a beginner
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- **FAIL** — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
