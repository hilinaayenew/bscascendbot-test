# Already promoted to lead, now doubting every call she makes

_Run 2026-09-01 12:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Draws on G8 rather than S4, and treats the doubt as post-decision second-guessing — advice about a decision she is sitting on now, not about whether to put herself forward.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I got promoted to lead my team about two months ago
  [stage A — User shares a new career milestone (promotion) without expressing doubt or current action block.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [sentence cap fired — the model wrote a rundown]
  [drew on G8, G6, S5a — 0 Otema, 3 drafted]
  [voice only: G3, S1a, S2, S1]

Botema
  Congrats on the promotion. Two months in is when the real work begins—you'll
  be tested on your prioritization, your communication, and how you scale
  decisions through the team. What’s one decision you’re sitting on this week
  that you could own and act on?

  you > I don't actually feel ready and now I second-guess every single decision
  [classification missing/invalid stage "undefined" — retrying once at double the token budget]
  [stage A — User is expressing imposter syndrome feelings that affect decision-making, indicating stage A (feeling being worked through)]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [second question dropped — one per reply]
  [drew on G8, G5, S1 — 1 Otema, 2 drafted]
  [voice only: G6, G10, S1b, S2]

Botema
  I’d suggest you pick one concrete decision you’re wavering on, make a clear
  call this week, then document your rationale and the outcome you expect so
  you can review it with your peer or sponsor. What decision are you on the
  fence about right now?

  you > there's one I've been sitting on for over a week because I can't decide
  [stage B — Concrete decision is stalled due to self-doubt; a decision is blocked rather than just a feeling.]
  [no new facts about her — note left alone, no call made]
  [sentence cap fired — the model wrote a rundown]
  [drew on G2, G4, S4 — 1 Otema, 2 drafted]
  [voice only: S3a, S3, S3c, S3b]

Botema
  That lingering doubt is exactly why you lead by making a call. Try this: lay
  out two practical paths you’re weighing, write the worst-case you’re willing
  to tolerate for each, and choose the one with the highest impact that you
  can survive if it goes sideways. Does that feel doable this week?

  you > I keep thinking they'll work out they picked the wrong person
  [classification missing/invalid stage "undefined" — retrying once at double the token budget]
  [stage A — The user is expressing an ongoing imposter feeling without naming a concrete action they are avoiding, which fits Stage A: a feeling being worked through rather than a stalled action.]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G8, S1b, G1 — 0 Otema, 3 drafted]
  [voice only: G10, S1a, G3, G7]

Botema
  I’d push you to lock in a decision you can stand behind, then ask for a
  quick feedback loop with your sponsor to validate the approach and learn
  what they’re watching for. Would you feel confident proposing a 15-minute
  check-in this week to review the latest decision and get concrete feedback?

  you > what do I do about the decision I'm stuck on
  [stage B — Deciding whether to act on a specific lead/decision falls under self-doubt blocking action (Stage B)]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G2, S3, S3a — 1 Otema, 2 drafted]
  [voice only: G4, S4, S3b, S3c]

Botema
  Map two concrete paths, write the worst-case you’ll tolerate for each, pick
  the path with the highest impact you can stand behind, and lock in a
  15-minute check-in with your sponsor this week to get crisp feedback. Does
  that feel doable this week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A, B
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a, S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  where she is    — She is a lead in her team, about two months into the role.

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
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
