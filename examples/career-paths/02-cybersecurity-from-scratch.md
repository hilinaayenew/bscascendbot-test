# Wants a cybersecurity path with zero IT background, and thinks 'ethical hacker' is the entry job

_Run 2026-08-27 13:40 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage B throughout — the field is named from turn one — and corrects the 'ethical hacker as day-one job' assumption rather than going along with it.

## Transcript

```
BSC Coach — local area harness
  Area 3 · Career Paths & Roadmaps · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > what does a career path in cybersecurity actually look like
  [stage B — User named cybersecurity and asked for a general career path]
  → enterDiscussionArea(3 · Career Paths & Roadmaps)
  [drew on S4, S1, S4a — 2 Otema, 1 drafted]
  [voice only: S3, S2, S5, S6]

Botema
  In my experience, a cybersecurity career starts with solid IT fundamentals
  (networks, operating systems, basic security) and then you land a junior
  security role—often as a SOC analyst or IT security support—before
  specialising in incident response, security engineering, pentesting, cloud
  security, or governance/risk. The practical path is: build hands-on labs,
  get a foundation cert (Security+, Network+), pick a track, and pursue a
  focused certification while you gain real work; what track are you drawn to,
  and what’s your current background?

  you > I have zero IT background at all
  [stage B — User has zero IT background and asked for path; needs beginner-friendly roadmap and entry roles]
  [drew on S4, S2, S5 — 3 Otema, 0 drafted]
  [voice only: S1, S4a, S6, S3]

Botema
  That’s real—and starting from zero is doable with a clear ladder. Begin with
  IT fundamentals (networks, OS, hardware) and a beginner cert like ITF+ or
  the Google Cybersecurity Certificate, then aim for an IT support role to get
  hands-on while you start a cybersecurity track and labs (TryHackMe/Hack The
  Box) toward Security+ as you gain experience. Where are you located, and
  what training options are realistically accessible there so I can tailor the
  first 6–8 weeks for you?

  you > is 'ethical hacker' a realistic first job for me
  [stage B — The user asked if 'ethical hacker' is a realistic first job for someone with zero IT background, which is new information that affects the roadmap within cybersecurity.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S4, S5a, S6 — 2 Otema, 1 drafted]
  [voice only: S2, S5, S4a, S7]

Botema
  Not realistic as a first job. Start with IT support or a SOC analyst role,
  then build a security certs and lab portfolio (Security+, PenTest+ later)
  before aiming for entry‑level pentest roles.

  you > what should I actually start with this month
  [stage B — The user has named cybersecurity and asks for actionable steps for this month, which should stay in the B stage.]
  [drew on S4, S3, S1 — 3 Otema, 0 drafted]
  [voice only: S6, S4a, S2, S5a]

Botema
  Start this month with two concrete moves: pick a beginner IT foundation you
  can access now (Google IT Support Certificate or ITF+/Net+), and set up a
  minimal home lab (a Linux VM and basic Windows practice) to learn by doing.
  Pair that with 2–3 TryHackMe starter rooms per week and start applying for
  IT support or SOC roles in parallel. Given your constraints, which
  path—Google IT Support or ITF+—is more doable for you this month, and where
  will you practise (home, library, etc.) so I can tailor the 6‑week plan?

  you > how long before I could get an entry-level security job
  [stage B — Cybersecurity is the chosen field; user asks for realistic timeframe to land an entry-level role.]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S4, S2, S7 — 3 Otema, 0 drafted]
  [voice only: S1, S3, S5, S4a]

Botema
  Realistically, from zero IT background to an entry-level security job takes
  about 6–12 months with consistent, focused work. Does that timeline fit what
  you can access locally, and where are you located so I can tailor a concrete
  6‑week plan for you this month?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     3 · Career Paths & Roadmaps
  covered_stages  B
  touched_facets  S1, S2, S3, S4, S4a, S5, S5a, S6, S7
  closed_areas    —
  role/location   entry-level cybersecurity role (e.g., SOC Analyst / IT Security Support) / —
  trying to do    She wants to know how long before she could get an entry-level security job. She has zero IT background. She has already asked whether an ethical hacker role is a realistic first job, and she is seeking a concrete starting plan this month to build foundational IT skills and pursue a security track.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage B throughout
- PASS — draws on S4 (cybersecurity roadmap)
- PASS — corrects the ethical-hacker-as-first-job assumption
- PASS — gives a concrete starting point despite no IT background
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply stacks more than two jargon terms

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
