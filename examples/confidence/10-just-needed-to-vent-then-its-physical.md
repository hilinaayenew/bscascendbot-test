# Does not want a plan, and it turns out the block is her body, not her belief

_Run 2026-09-01 12:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Reads the request to be heard rather than steered (G3) without immediately proposing an action, and once she describes a physical response, draws on S3c rather than offering more speaking technique.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I froze completely in a meeting today and I've felt awful about it since
  [stage B — The user describes a concrete obstacle (frozen in a meeting) tied to self-doubt, indicating a blockage behind action rather than just a feeling.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [no close example — voice only, advice from knowledge]
  [validating opener dropped — she described herself, not something done to her]
  [drew on S3, S3b, S3c — 1 Otema, 2 drafted]
  [voice only: S3a, G2, S4, G4]

Botema
  What I’d do next time is have a simple re-entry line ready and a tiny plan
  to regain your voice quickly. What happened right before you froze—the
  trigger you noticed—so we can tailor the re-entry plan?

  you > honestly I don't really want to make it a whole thing, I just needed to say it out loud
  [stage A — User clarifies they don't want to turn it into a bigger plan and just needed to say it aloud; this fits stage A (feelings without action).]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [second question dropped — one per reply]
  [drew on G3, S5a, S1a — 0 Otema, 3 drafted]
  [voice only: G10, S1b, G6, G9]

Botema
  freezing in a meeting is something many of us have faced, and feeling awful
  after it is normal but manageable. If you ever want a tiny, fast recovery
  plan for next time, I’ve got something simple you can try. Do you want that
  quick two-step re-entry you can test in the next meeting?

  you > it's not that I don't know the material, I know it better than most of them
  [stage A — The user is describing internal doubt and a cognitive blocker (freezing) without a concrete action yet, indicating stage A.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on G3, G9, G10 — 0 Otema, 3 drafted]
  [voice only: G7, G5, S1, S1a]

Botema
  That’s real and it’s not a competence issue. You know the material; the
  moment is about how your brain handles pressure in the room, not what you
  can do. Want me to tailor a tiny one-liner you can use next time for a fast
  re-entry?

  you > my heart just goes and my mind goes totally blank, it's a physical thing
  [stage A — The user is describing a physical reaction (heart racing, mind going blank) tied to an ongoing confidence-related challenge, not a decision to act differently, so this fits stage A (a feeling being worked through).]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [drew on G3, G6, G5 — 0 Otema, 3 drafted]
  [voice only: G9, G1, G10, S5a]

Botema
  Two tiny steps you can try right away: take a slow 4-4-4 breath to reset,
  then use a clean re-entry line like “Thanks — I’d like a moment to gather my
  thoughts and respond. ” Want me to tailor a two-line re-entry you can test
  in the next meeting?

  you > does that ever actually get better
  [stage A — User asked if the symptom improves over time, indicating interest in continuing to work through the imposter/self-doubt dynamics rather than leaving the area.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [sentence cap fired — the model wrote a rundown]
  [drew on G3, G1, G8 — 0 Otema, 3 drafted]
  [voice only: G6, S2, S5, S1b]

Botema
  Yes. It gets better with focused practice and support, not by wishing it
  away. How does that sound for a plan you can try this week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  B, A
  touched_facets  S3, S3b, S3c, S4, G2, G4, S3a, S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a
  closed_areas    —
  role/location   — / —

  Nothing was written to any database.
```

## Checks

- PASS — draws on G3 or S3c
- PASS — does not hand her a plan on the turn she says she does not want one
- PASS — treats the physical response as physical, not as a knowledge or nerve gap
- PASS — does not answer it with more speaking or delivery technique
- PASS — does not promise it goes away
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- **FAIL** — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
