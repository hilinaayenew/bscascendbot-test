# Wants to work on speaking-up confidence, until it turns out one specific meeting is the problem

_Run 2026-09-01 12:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Starts in stage B (a stalled action — speaking up), and once she narrows it to a specific, repeated pattern in one meeting, draws on S3a rather than continuing to coach it as a general confidence skill.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I keep chickening out of speaking up in meetings, so half the time I just stay quiet instead
  [stage B — User describes self-doubt causing not speaking up in meetings (concrete action affected).]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [validating opener dropped — she described herself, not something done to her]
  [drew on S3, S4, G4 — 2 Otema, 1 drafted]
  [voice only: G2, S3a, S3c, S3b]

Botema
  I would always recommend you prep one concrete, value-adding sentence you
  can drop in early in the discussion, using a phrase like “I’d like to add…”
  and keep it to 15–20 seconds. Does that feel like something you could
  actually try in your next meeting?

  you > actually, thinking about it more, it's really just one specific meeting — every time I try to say something there, someone repeats it back a minute later as their own idea
  [stage B — The user is describing external behavior in a specific meeting that affects speaking up; not leaving the area.]
  [no new facts about her — note left alone, no call made]
  [drew on S3a, S3b, S3c — 0 Otema, 3 drafted]
  [voice only: S3, G4, G2, S4]

Botema
  That pattern is real and you’re not imagining it—the same meeting-room
  dynamic where ideas are attributed to others is well documented. In the
  moment, try a crisp reclaim like, “I’d like to finish my point about X,”
  then proceed; would that be something you could test in that meeting next
  time?

  you > it's happened at least four times now, always the same person
  [stage B — User reports recurring external attribution of her ideas by the same person, creating a concrete barrier to speaking up.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on S3a, G2, G4 — 0 Otema, 3 drafted]
  [voice only: S3, S4, S3b, S3c]

Botema
  In the moment, you can preface with a brief flag like, “That was my point
  about X; I’d like to finish it,” then move on, or quickly re-state your line
  and attribute it to you, not them. If it keeps happening, name the pattern
  to the meeting lead or note-taker and ask them to track attribution next
  time. Does that feel doable in that room?

  you > I'm not sure this is really a confidence problem anymore
  [stage B — The user signals that the root blocker may be external (not a confidence issue), shifting focus from internal self-doubt to external dynamics.]
  [no new facts about her — note left alone, no call made]
  [drew on S3a, S3, G4 — 1 Otema, 2 drafted]
  [voice only: S3c, S3b, G2, S4]

Botema
  This isn’t a confidence problem, it’s a repeatable pattern of attribution
  that you’re witnessing in that room—and that’s real. What I’d do next is two
  things: in the moment, reclaim your line clearly, and after the meeting,
  raise it with the facilitator or note-taker so they track who said what. Do
  you want me to draft a one-minute script you can use verbatim in that
  meeting?

  you > so what do I actually do about it
  [stage B — User asked for concrete steps to address ongoing attribution of her ideas in a specific meeting; needs actionable plan.]
  [no new facts about her — note left alone, no call made]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on S3a, S3, G4 — 1 Otema, 2 drafted]
  [voice only: S3b, G2, S3c, S4]

Botema
  Would you like me to tailor a one-minute script for your exact topic so you
  can drop it in flat, no-nonsense next time?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  B
  touched_facets  S3, S3b, S3c, S4, G2, G4, S3a
  closed_areas    —
  role/location   — / —
  trying to do    — She is a professional seeking to speak up in meetings without having her ideas attributed to others, specifically in a recurring scenario where the same person consistently repeats her points as their own. She wants to reclaim ownership of her contributions and ensure her points are recognized in the moment. Her latest message notes that this has happened at least four times, always with the same person, and she has not yet described what she has tried in concrete terms beyond the general approach.

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
