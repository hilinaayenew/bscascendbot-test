# Wants to work on speaking-up confidence, until it turns out one specific meeting is the problem

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Starts in stage B (a stalled action — speaking up), and once she narrows it to a specific, repeated pattern in one meeting, draws on S3a rather than continuing to coach it as a general confidence skill.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I keep chickening out of speaking up in meetings, so half the time I just stay quiet instead
  [stage B — The user reports self-doubt causing them to stay quiet in meetings.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [drew on S3, S4, G4 — 2 Otema, 1 drafted]
  [voice only: G2, S3a, S3c, S3b]

Botema
  I’d recommend a tiny, repeatable move: before the next meeting, write down
  one line you will say—either to ask a clarification or to add a point—and
  deliver it even if you feel unsure. Does that feel doable for you to try in
  the next meeting?

  you > actually, thinking about it more, it's really just one specific meeting — every time I try to say something there, someone repeats it back a minute later as their own idea
  [stage B — The user is reporting a concrete barrier to speaking up in a specific meeting: others are repeating her ideas as their own, which blocks action.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [reply promised content it didn't contain the guards — answering as a wrap-up instead]
  [drew on S3a, S1a, S1b — 0 Otema, 3 drafted]
  [voice only: G2, S3, G1, G3]

Botema
  That pattern is real and well documented — you’re not overreacting, you’re
  witnessing a common tactic where a woman’s contribution is claimed by
  someone else. In that meeting, when they repeat your point, name it in the
  moment: “I had that idea a moment ago; I’d like to finish my thought.” Does
  that feel doable for you in the next instance?

  you > it's happened at least four times now, always the same person
  [stage B — User reports a colleague consistently undermining her by taking credit; this is a concrete barrier to speaking up (external treatment), not just a thought/feeling.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [only a question survived the guards — answering as a wrap-up instead]
  [drew on G1, G10, G6 — 0 Otema, 3 drafted]
  [voice only: S5, G9, S3b, G4]

Botema
  Do you think you could try that in the next meeting with that person?

  you > I'm not sure this is really a confidence problem anymore
  [classification missing/invalid stage "undefined" — retrying at 4000 tokens]
  [classification missing/invalid stage "undefined" — retrying at 8000 tokens]
  [stage B — User indicates the core issue might not be confidence-based but a different blocker; still within confidence area but reframe the problem.]
  [no new facts about her — note left alone, no call made]
  [drew on S3a, S3b, S3c — 0 Otema, 3 drafted]
  [voice only: G4, S3, S4, G2]

Botema
  What you’re describing is a known pattern, not a failing on your part. In
  the moment, try: “That was my point earlier—I’d like to finish my thought.”
  After the meeting, note the four incidents and consider raising it with the
  chair or HR if it repeats. Does that feel like a path you could try in the
  next occurrence with that person?

  you > so what do I actually do about it
  [stage B — The user is asking for concrete actions to address a pattern of credit-taking by a colleague, which moves from recognizing the issue to planning steps.]
  [no new facts about her — note left alone, no call made]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [drew on S3a, G2, S3 — 1 Otema, 2 drafted]
  [voice only: S4, S3c, S3b, G4]

Botema
  You can also ask the chair to enforce speaking order or to have a neutral
  facilitator for the session. Does that plan feel actionable for your next
  meeting and your particular setup?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  B
  touched_facets  S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  trying to do    — She is a professional in a meeting environment who has reported being repeatedly interrupted and her ideas claimed by the same person, four times or more. She wants to reliably contribute and have her own points recognized, ideally by finishing her thoughts before the other person can restate them, or by naming the behavior in the moment to preserve credit.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage B on the opening message
- PASS — draws on S3a once the pattern is named as specific and repeated
- PASS — frames it as the room's problem, not a confidence gap, once named
- PASS — does not fall back to generic public-speaking advice once the pattern is named
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
