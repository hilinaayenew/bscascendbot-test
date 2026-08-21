# Doesn't know what she'd enjoy, has never tried any of it

_Run 2026-08-21 07:26 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Doesn't just repeat 'what draws you to it' a second way — gives her the smallest possible concrete first action instead of asking her to introspect further.

## Transcript

```
BSC Coach — local area harness
  Area 1 · Getting Started · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > everyone says find your passion in tech but I genuinely don't know what that would be
  [stage A — User is unsure about which tech path to pursue and asks for guidance.]
  → enterDiscussionArea(1 · Getting Started)
  [no close example — voice only, advice from knowledge]
  [drew on S1, S7, S8 — 3 Otema, 0 drafted]

Botema
  Starting without a clear passion is common—the way forward is to test a few
  things quickly and see what sticks. I’d suggest a two-week, low-risk
  exploration: pick three broad threads (web basics, data basics, and a domain
  you care about) and spend 20–30 minutes a day on free beginner resources,
  then build a tiny 1–2 day project in each; the thread that makes you want to
  keep going is likely the right path. What are 2–3 problems or topics you
  care about outside tech so I can tailor these threads to you?

  you > I've never coded anything or used any of these tools
  [stage A — User reports no coding experience and no prior direction; matches Stage A (unsure about tech path and starting from scratch).]
  [no close example — voice only, advice from knowledge]
  [drew on S1, S7, S8 — 3 Otema, 0 drafted]

Botema
  That’s real. Start ultra-beginner with a single 1–2 hour intro (CS50’s intro
  or Python for absolute beginners) and just see how it feels—no pressure to
  build anything yet. What are two areas outside tech you care about (health,
  education, finance, climate, etc.) so I can tailor your first tiny
  exploration?

  you > I don't even know what UX or data science actually involve day to day
  [stage C — User asked what day-to-day work looks like in UX vs data science, a conceptual/info question typical for method/info stage (C).]
  [no close example — voice only, advice from knowledge]
  [drew on S2 — 1 Otema, 0 drafted]

Botema
  UX is about how people actually use a product—day-to-day you talk to users,
  map journeys, sketch screens, and test ideas with real feedback; data
  science is about turning numbers into business decisions—cleaning data,
  exploring it with visuals, and presenting findings (often with some coding,
  but you can start with no-code dashboards). Since you’re starting from
  scratch, try ultra-beginner steps: for UX, draft a one-screen user flow for
  a service you care about and watch a quick UX intro; for data science, take
  a 1-hour Python or SQL intro and load a tiny dataset to describe it in words
  and simple charts. Which path sounds more compelling to you right now?

  you > how am I supposed to know what I'd enjoy
  [stage C — The user is asking how to decide what they would enjoy, which is a method/decision step about exploring interests (stage C) rather than concrete actions (stage D).]
  [no close example — voice only, advice from knowledge]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S2 — 1 Otema, 0 drafted]

Botema
  The only way to know what you’ll enjoy is to try tiny, no-pressure tasks and
  notice what you look forward to doing. Which two everyday topics would you
  want me to anchor these explorations to, so I tailor them for you—and are
  you ready to commit 20–30 minutes a day for the next two weeks?

  you > okay what's the smallest possible way to just try something
  [stage D — User asked for the smallest possible way to try something (concrete, ultra-short task).]
  [drew on S4, S6, S3 — 3 Otema, 0 drafted]

Botema
  Here’s the absolute smallest path that still gives you a real feel: 10–15
  minutes, zero setup. Pick one: A) UX—watch a 5–7 minute intro and sketch one
  screen flow for an app you use; B) Data—watch a 5–7 minute intro and write
  one question about a daily dataset plus a rough chart idea. Which path feels
  easier for you to start today?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     1 · Getting Started
  covered_stages  A, C, D
  touched_facets  S1, S7, S8, S2, S3, S4, S6
  closed_areas    —
  role/location   — / —
  trying to do    She is trying to figure out the smallest possible way to just try something in tech. She wants ultra-beginner, no-pressure experiments that require minimal time and no coding or tools, so she can see what might resonate. She has not tried any paths yet and is looking for a tiny first step she can start with immediately.

  Nothing was written to any database.
```

## Checks

- PASS — gives a concrete tiny first action by the end
- PASS — does not just repeat the same 'what draws you' framing a second way
- PASS — treats not knowing yet as normal, not a deficiency
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
