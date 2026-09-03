# Does not want a plan, and it turns out the block is her body, not her belief

_Run 2026-09-03 10:35 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Reads the request to be heard rather than steered (G3) without immediately proposing an action, and once she describes a physical response, draws on S3c rather than offering more speaking technique.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I froze completely in a meeting today and I've felt awful about it since
  [stage B — The user describes a concrete action they didn’t take (speaking up) due to self-doubt; that’s a B-stage blocker.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [no new facts about her — note left alone, no call made]
  [no close example — voice only, advice from knowledge]
  [validating opener dropped — she described herself, not something done to her]
  [sentence cap fired — the model wrote a rundown]
  [drew on S3, S3b, S3c — 1 Otema, 2 drafted]
  [voice only: S3a, G2, S4, G4]

Botema
  Yes, freezing in a meeting happens when the pressure is high, not because
  you’re not capable. What you do next matters more than what happened today.
  What feels more doable for you right now: crafting that one-line
  contribution for your next meeting, or choosing a specific moment in the
  last meeting to request a quick pause and add your point?

  you > honestly I don't really want to make it a whole thing, I just needed to say it out loud
  [classification missing/invalid stage "undefined" — retrying at 4000 tokens]
  [stage C — User is settling after the incident and not seeking further guidance.]
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [second question dropped — one per reply]
  [drew on G3, S5a, S1a — 0 Otema, 3 drafted]
  [voice only: S3c, G2, G7, G4]

Botema
  It’s real to feel awful after a freeze, and you’re not alone; you don’t have
  to turn this into a big thing today. Would you like me to help you draft a
  tiny, one-line contribution for your next meeting?

  you > it's not that I don't know the material, I know it better than most of them
  [stage A — User clarifies that lack of knowledge is not the blocker; recognizing competence moves conversation toward addressing the performance block.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G3, G9, G10 — 0 Otema, 3 drafted]
  [voice only: G7, G5, S1, S1a]

Botema
  If a tiny move helps, I can draft a single, sharp line you can drop into the
  next meeting to claim your point quickly. Do you want me to draft that line
  for you to use next time?

  you > my heart just goes and my mind goes totally blank, it's a physical thing
  [stage A — User describes a physical reaction (heart racing, mind blank) in response to freezing in a meeting; this aligns with stage A where the focus is on processing the experience and trying micro-steps rather than taking a concrete action yet.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [validating opener dropped — she described herself, not something done to her]
  [repeated advice removed]
  [drew on G3, G6, G5 — 0 Otema, 3 drafted]
  [voice only: G9, G1, G10, S5a]

Botema
  I’d suggest a tiny pre-meeting reset: four cycles of 4-4-4 breathing (inhale
  4, hold 4, exhale 4, hold 4) and a short, prepared line you can drop in when
  needed.

  you > does that ever actually get better
  [stage A — The user is asking about progress and continues to seek reassurance; not yet moving to a new tactic or leaving the area; staying with Confidence & Imposter area and exploring feasibility.]
  [nothing recorded about her yet — writing the note anyway before it ages out]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on G3, G1, G8 — 0 Otema, 3 drafted]
  [voice only: G6, S2, S5, S1b]

Botema
  Yes. It gets better with steady, small exposure plus a simple toolkit you
  actually use. Does a plan like that feel doable for you for next week?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  B, C, A
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
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
