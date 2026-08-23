# Wants a cybersecurity path with zero IT background, and thinks 'ethical hacker' is the entry job

_Run 2026-08-23 19:23 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage B throughout — the field is named from turn one — and corrects the 'ethical hacker as day-one job' assumption rather than going along with it.

## Transcript

```
BSC Coach — local area harness
  Area 3 · Career Paths & Roadmaps · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > what does a career path in cybersecurity actually look like
  [stage A — User asked for a general cybersecurity career path without naming a field yet]
  → enterDiscussionArea(3 · Career Paths & Roadmaps)
  [no close example — voice only, advice from knowledge]
  [sentence cap fired — the model wrote a rundown]
  [drew on S8, G1 — 1 Otema, 1 drafted]

Botema
  Here’s the straight path I’ve seen work: you start by cementing IT
  fundamentals—networks, Linux, scripting—and you build hands-on practice.
  Then you land a junior security role (often as a security or SOC analyst),
  and 2–4 years later you specialise into incident response, threat hunting,
  security engineering, cloud security, or governance, risk and compliance.
  What area in cybersecurity feels most compelling to you, and where are you
  starting from (your current skills, resources, and location)?

  you > I have zero IT background at all
  [stage B — User named cybersecurity earlier and now states zero IT background; this moves the conversation into a getting-started path within cybersecurity.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, S1, S2 — 3 Otema, 0 drafted]
  [voice only: S5, S3, S7, S6]

Botema
  That’s real and common—and completely doable with the right stepping stones.
  Start with IT fundamentals (basic networking, Linux CLI, Windows basics)
  using low-cost or free options like Google’s IT Support Certificate or
  ITF+/Linux journey. What resources can you commit to right now (time,
  internet access, device), and where are you located so I can tailor the
  starting points?

  you > is 'ethical hacker' a realistic first job for me
  [stage B — The user now asks about realism of an 'ethical hacker' as a first role in cybersecurity, fitting stage B.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, S5, S6 — 3 Otema, 0 drafted]
  [voice only: S1, S2, S7, S3]

Botema
  Not realistic as a first job from zero IT background. Most people start in
  IT support or a junior security analyst role and move toward penetration
  testing later, after some hands-on fundamentals. What country are you in and
  what devices or internet access do you have so I can tailor the first steps
  for you?

  you > what should I actually start with this month
  [stage B — User has zero IT background and is asking for concrete starting steps for this month within cybersecurity roadmap.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S4, S3, S1 — 3 Otema, 0 drafted]
  [voice only: S6, S7, S5, S2]

Botema
  Here’s a tight start for this month: complete a free IT fundamentals path
  focused on Linux command line and basic networking, and pair it with 2–3
  beginner cybersecurity labs on TryHackMe or OverTheWire to apply what you
  learn, while you document progress in a simple GitHub repo.

  you > how long before I could get an entry-level security job
  [stage B — User asked for realistic timeframe to land an entry-level cybersecurity job]
  [sentence cap fired — the model wrote a rundown]
  [drew on S4, S2, S7 — 3 Otema, 0 drafted]
  [voice only: S5, S3, S1, S6]

Botema
  Realistically, 9–18 months from zero IT to an entry-level security role in
  Africa, if you follow a tight plan and do real hands-on work. If you can
  commit near-full-time (20+ hours/week) and pair IT fundamentals with labs
  plus a starter cert, you might push toward 6–12 months; otherwise 12–18
  months is more likely. What country are you in, and how many hours per week
  can you dedicate to learning and hands-on practice?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     3 · Career Paths & Roadmaps
  covered_stages  A, B
  touched_facets  S8, G1, S1, S2, S3, S4, S5, S6, S7
  closed_areas    —
  role/location   entry-level security analyst / junior cybersecurity analyst / —
  trying to do    She is trying to gauge how long it would take to land an entry-level security job. The target is an entry-level role in cybersecurity, but the main barrier remains zero IT background. She has not indicated any steps taken yet toward that path and is seeking a realistic timeline.

  Nothing was written to any database.
```

## Checks

- **FAIL** — classified stage B throughout
- PASS — draws on S4 (cybersecurity roadmap)
- PASS — corrects the ethical-hacker-as-first-job assumption
- PASS — gives a concrete starting point despite no IT background
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
