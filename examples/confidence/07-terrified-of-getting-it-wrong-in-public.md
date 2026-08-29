# One visible mistake would prove she doesn't belong

_Run 2026-08-28 22:02 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A and draws on G5, treating the fear as perfectionism rather than a realistic forecast — without promising her she won't get anything wrong, and without a list of preparation rituals.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I'm terrified of getting something wrong in front of the whole team
  [stage A — User expresses fear about making mistakes in front of the team, a feeling without an action avoidance yet.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [sentence cap fired — the model wrote a rundown]
  [drew on G5, G8, G6 — 0 Otema, 3 drafted]
  [voice only: S5, G9, S2, S1b]

Botema
  That fear is real and common—especially when you care about belonging and
  proving yourself. One slip in front of the team doesn’t define you; it’s
  data you can learn from and recover from quickly. What would make this feel
  safer for you this week—what is the first small step you could take?

  you > it feels like one mistake would just prove what I already suspect about myself
  [stage A — User expressed fear of a single mistake proving a negative belief about themselves; it's a feeling being worked through without a concrete action stalled.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on G5, G7, G9 — 0 Otema, 3 drafted]
  [voice only: S5, G8, G10, S2]

Botema
  One slip won’t prove anything about your abilities; it’s data you can learn
  from and recover from. I would always recommend you practice thinking out
  loud in the next few meetings and have a simple recovery line ready if you
  stumble. Which moment this week are you most anxious about?

  you > I check everything about four times before I push anything, it takes me ages
  [stage B — The user describes over-checking that slows down pushing changes, indicating action-stalling due to self-doubt rather than a pure feeling.]
  [second question dropped — one per reply]
  [drew on G2, G4, S3b — 0 Otema, 3 drafted]
  [voice only: S3c, S3a, S4, S3]

Botema
  That level of caution is coming from wanting to protect yourself and your
  work, but four checks every time will slow you down. Try a two-minute
  preflight before you push: state the problem and expected outcome in one
  sentence, name the top two edge cases and how you’ll test them, and make
  your commit message explicit about intent and test steps; then push the
  smallest change first and only do a second pass if feedback asks for it.
  Does that feel doable for you this week?

  you > nothing bad has actually happened yet, I know that sounds silly
  [stage A — User is expressing an ongoing fear without stating a concrete action they're delaying or avoiding; it's a feeling being worked through.]
  [repeated advice removed]
  [drew on G5, S5a, G10 — 0 Otema, 3 drafted]
  [voice only: G9, S1b, G8, G1]

Botema
  That isn’t silly—that fear comes from real patterns many women face in
  teams.

  you > how do I stop doing this to myself
  [stage A — User asked for strategies to stop self-doubt and negative self-talk; it's a direct request for tactics to move from A stage.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [second question dropped — one per reply]
  [drew on G5, G9, G10 — 0 Otema, 3 drafted]
  [voice only: S1a, G6, G1, S5a]

Botema
  I would always recommend: give yourself a hard, two-minute preflight and
  push one tiny change first, then record what you learn from the outcome so
  you have evidence you can rely on. Does committing to a single small change
  this week feel doable?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  trying to do    She wants to move away from needing to check everything four times before pushing; it takes her ages. The fear of getting something wrong in front of the team remains the main barrier, driving meticulous double-checking. She notes that nothing bad has happened yet, which she finds silly. She has asked how to stop doing this to herself.

  Nothing was written to any database.
```

## Checks

- PASS — opens in stage A — a feeling, with nothing named as stalled
- PASS — draws on G5
- PASS — does not promise her she won't make mistakes
- PASS — picks up that nothing bad has actually happened, rather than talking past it
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
