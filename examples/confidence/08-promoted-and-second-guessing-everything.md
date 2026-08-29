# Already promoted to lead, now doubting every call she makes

_Run 2026-08-28 22:02 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Draws on G8 rather than S4, and treats the doubt as post-decision second-guessing — advice about a decision she is sitting on now, not about whether to put herself forward.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I got promoted to lead my team about two months ago
  [stage A — User shared a recent promotion to lead a team, which is a common trigger area for Confidence & Imposter Syndrome; no clear signal of leaving the area.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [drew on G8, G6, S5a — 0 Otema, 3 drafted]
  [voice only: G3, S1a, S2, S1]

Botema
  Congrats—leading a team after a promotion is a real milestone and it often
  comes with real-time learning. In my experience, the first couple of months
  are when you test ideas, set boundaries, and start shaping how the team
  works under your voice. What feels hardest for you in this new role right
  now?

  you > I don't actually feel ready and now I second-guess every single decision
  [stage B — User identifies self-doubt as a concrete blocker in decision-making (second-guessing decisions) rather than just a general feeling.]
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, S4, G4 — 1 Otema, 2 drafted]
  [voice only: S3a, S3c, S3, S3b]

Botema
  That doubt is real—and it’s part of growing into leadership. I’d anchor this
  with a quick decision workflow: pick the most urgent decision, set a tight
  deadline to decide (48 hours, say), write a one-line rationale with the
  risks you’ll monitor, and run it by 1–2 trusted peers or a mentor for a fast
  sanity-check. What decision is weighing on you most right now?

  you > there's one I've been sitting on for over a week because I can't decide
  [stage B — User reports a concrete decision is stalled due to self-doubt, which aligns with Stage B (self-doubt is preventing taking a concrete action like deciding).]
  [repeated advice removed]
  [second question dropped — one per reply]
  [drew on G2, S3a, G4 — 0 Otema, 3 drafted]
  [voice only: S3, S3b, S4, S3c]

Botema
  That kind of indecision is exactly what leadership feels like at the start.
  What are the two options you’re weighing?

  you > I keep thinking they'll work out they picked the wrong person
  [stage A — The user is expressing ongoing impostor feelings without stating a concrete stalled action; it indicates A-level internal struggle rather than a concrete belief that they won't act.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [drew on G8, S1b, S1a — 0 Otema, 3 drafted]
  [voice only: G5, G1, S1, G6]

Botema
  Does that sound doable for you this week?

  you > what do I do about the decision I'm stuck on
  [stage B — User is stuck on a concrete decision due to self-doubt and asked for next steps.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [reply was entirely repetition — treating as a stall]
  [nothing survived the guards — using the area's question]
  [drew on G2, G4, S3 — 1 Otema, 2 drafted]
  [voice only: S3b, S3a, S3c, S4]

Botema
  What feels true for you right now?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    She is a team lead. The promotion happened about two months ago. She does not feel ready and she second-guesses every decision. There is a decision she has been sitting on for over a week because she can't decide.
  trying to do    She is trying to decide the pending decision and move toward being a confident leader. She is seeking guidance on what to do about the decision she is stuck on. What is in her way: persistent indecision, not feeling ready, and the fear that they will realize they picked the wrong person. She keeps thinking they'll realize they picked the wrong person. What she has already tried: NONE.

  Nothing was written to any database.
```

## Checks

- PASS — draws on G8
- PASS — does not advise her to apply for things — she already has the role
- PASS — takes up the specific decision she is sitting on
- PASS — does not just reassure her that she deserved the promotion
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- **FAIL** — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
