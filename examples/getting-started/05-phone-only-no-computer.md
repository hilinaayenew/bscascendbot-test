# Only has a phone, no laptop, and no direction picked yet either

_Run 2026-09-01 08:08 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Probes the seam between stage A (no direction settled) and where G6 actually lives (stage D, 'method decided'): she raises a phone-only access constraint before ever choosing — or even really discussing — a method, so this checks whether the coach still surfaces real, phone-usable next steps rather than either defaulting to laptop-based advice or refusing to engage until she's 'chosen a method' first.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > okay so I want to get into tech but honestly no idea where to even start
  [classification missing/invalid stage "undefined" — retrying once at double the token budget]
  [stage A — User is at Getting Started stage (no clear direction, wants to start in tech). Recommend moving to Career Paths & Roadmaps to explore possible paths and entry points.]
  → enterDiscussionArea(1 · Getting Started)
  [no new facts about her — note left alone, no call made]
  [validating opener dropped — she described herself, not something done to her]
  [drew on S1a, S1, G5 — 1 Otema, 2 drafted]
  [voice only: G3a, G3, S8a, S7]

Botema
  No idea where to start is exactly where most of us begin. I’d start with one
  tiny, finishable probe in two directions to feel out what lights you up: a
  simple web page (HTML/CSS/JS) and a tiny data project (public dataset, one
  question). Do you feel pulled toward building things people can see on the
  web, or toward playing with data and answers from it?

  you > the thing is I don't have a laptop, just my phone, so idk if this is realistic
  [stage A — User asks about realism of starting tech career with only a phone and no laptop; wants guidance on whether feasible and how to proceed.]
  [no new facts about her — note left alone, no call made]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S7a, G3a, S8a — 0 Otema, 3 drafted]
  [voice only: G5, S7, S8, S1a]

Botema
  That’s real, and it’s okay to be honest about it. You can start learning and
  planning on your phone, but you’ll want regular access to a laptop soon to
  actually build and run things. Does that feel doable with the access you
  have right now?

  you > and at my job we're not allowed to use the computers for personal stuff, no spare ones either
  [stage C — Constraint update: cannot use work computers for personal learning; no spare laptops; need to plan learning paths that work on a phone and offline if possible.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2a, S2b, S2 — 1 Otema, 2 drafted]
  [voice only: G1a, G1]

Botema
  If personal use is off-limits at work and you have no spare device, you’ll
  want a plan that works with what you’ve got now and a clear path to laptop
  access. Two practical paths: - On-phone learning now: focus on fundamentals
  (html/css basics, Python basics, SQL basics) using free resources you can
  read or code in a mobile-friendly way. What’s your most feasible access
  option this month: a library/computer lab, or a community center that lends
  devices?

  you > so is this actually possible on just a phone or am I wasting my time here
  [stage C — The user is asking a feasibility question about pursuing tech with only a phone and no laptop, which is a live-method concern within the Getting Started area.]
  [repeated advice removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2b, G1, G1a — 0 Otema, 3 drafted]
  [voice only: S2, S2a]

Botema
  Yes, it’s possible to start on a phone, but you’re not kidding yourself if
  you think it’ll slow you down. You can learn fundamentals and do small,
  planful projects, but you’ll need a laptop soon to actually run code, save
  work, and ship something hiring teams can see. Does you having a concrete
  laptop-access plan this month feel doable to you?

  you > alright — so what would I actually start doing today, on the phone
  [stage D — User asked for concrete, phone-based first steps today; constraint: only phone now, no laptop.]
  [repeated advice removed]
  [closing question dropped — it referred to advice the cap removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4b, G6, S6 — 1 Otema, 2 drafted]
  [voice only: S4, G2, S3, S6a]

Botema
  Yes. Do two tiny, finishable tasks on your phone today: 1) Build a simple
  web page you can see online: open a mobile-friendly code editor (CodePen or
  Replit) and create a one-page HTML file.

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  A, C, D
  touched_facets  S1, S1a, S7, S7a, S8, S8a, G3, G3a, G5, S2, S2a, S2b, G1, G1a, S3, S4, S4a, S4b, S6, S6a, G2, G6
  closed_areas    —
  role/location   — / —
  where she is    — She is a job-seeker exploring a transition into tech, currently not allowed to use work computers for personal use and without a spare device, and limited to a phone for learning; no laptop access in the near term. She also has expressed concern about whether a plan is realistic given these constraints.
  trying to do    — She wants to determine if starting in tech is realistic with only a phone, and what concrete steps would work given her constraints; she has expressed interest in fundamentals and is weighing whether to pursue learning on mobile first or wait for laptop access, seeking a feasible plan that aligns with current restrictions. In response to the question about today’s actions, she should identify one or two small, phone-friendly tasks to begin immediately and outline a plan to secure laptop access soon. NONE

  Nothing was written to any database.
```

## Checks

- **FAIL** — does not dismiss the phone-only situation as unworkable
- PASS — gives something concrete she can actually do on a phone
- PASS — treats the access constraint as normal, not a reason to stall her
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
