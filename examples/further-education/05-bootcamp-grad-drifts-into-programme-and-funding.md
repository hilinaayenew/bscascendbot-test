# A bootcamp grad wonders if a master's is worth stacking on top, then drifts into programme quality and funding without ever declaring a decision

_Run 2026-08-27 08:03 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** 'Bootcamp' is not the literal word 'certification', and she never says anything like 'let's say I go with a master's' — so this checks whether the classifier can still follow her out of stage A into B and C on the substance of what she's asking, rather than getting stuck reading a stray early mention as a certification-vs-master's comparison that's still live.

## Transcript

```
BSC Coach — local area harness
  Area 2 · Further Education · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > so I did a coding bootcamp last year and now everyone's saying I should think about a master's too, idk
  [stage A — User is weighing a master's vs a bootcamp; fits A as certification vs degree discussion.]
  → enterDiscussionArea(2 · Further Education)
  [no close example — voice only, advice from knowledge]
  [drew on S1, S5 — 2 Otema, 0 drafted]

Botema
  Master’s isn’t a prerequisite to succeed, especially after a bootcamp—in
  Africa your portfolio, real-world projects, and networks usually move you
  faster. It can help for deep CS-theory roles or big-company leadership, but
  it’s costly and slows you down; a focused certification or online
  specialization plus solid work to show on the ground can deliver quicker
  wins. What kind of roles or companies are you aiming for in the next 12–18
  months, and what’s your biggest constraint—time, money, or the need to prove
  you can handle a deeper technical path?

  you > like is it even worth doing both
  [stage A — User is weighing whether to pursue a master's in addition to a bootcamp and possibly certifications; it's a certification-vs-degree discussion moving forward.]
  [no close example — voice only, advice from knowledge]
  [repeated advice removed]
  [implausible figure removed — outlier, mixed currency, or wrong period]
  [drew on S1, S5 — 2 Otema, 0 drafted]

Botema
  I’d say for most bootcamp grads in Africa, doing both a master’s and a stack
  of certifications isn’t the fastest route—it slows you down without
  guaranteed payoff. If you’re serious about a master, pursue it only with a
  clear ROI (a role that requires it or employer sponsorship); otherwise,
  stack affordable certifications and real projects to move faster.

  you > the programs I've been looking at are mostly data science ones, how do I actually tell if one is any good vs just picking by ranking
  [stage B — User asked how to evaluate programs beyond rankings in data science master's options.]
  [sentence cap fired — the model wrote a rundown]
  [drew on S2, S4, S3 — 3 Otema, 0 drafted]

Botema
  Rankings can mislead you if you’re not looking at what actually happens
  after you enroll. Check these: a DS-focused curriculum with real hands-on
  capstones or internships; active faculty doing current industry/research
  work; clear graduate outcomes and an active alumni/industry network; and
  practical access to computing resources, internships, and funding
  (especially if you need part-time/online formats). Which programs are you
  considering, and which of these factors matters most to you right now?

  you > would part time even work, I can't afford to stop working
  [stage C — User asks about part-time study while continuing to work; relates to wellbeing/balance and scheduling.]
  [invented-location guard fired — an unstated place was removed]
  [sentence cap fired — the model wrote a rundown]
  [drew on S7, S6 — 2 Otema, 0 drafted]

Botema
  Yes. Part-time can work if you pick a program built for working pros and you
  protect your time. Look for asynchronous online delivery, a realistic weekly
  workload you can sustain (often 8–12 hours per course), and clear support
  from the program or your employer (tuition assistance, study leave, or a
  sponsor).

  you > is there scholarship money out there for something like this
  [stage C — Funding question about scholarships]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on S7, S6 — 2 Otema, 0 drafted]

Botema
  There are scholarships for women pursuing a master’s in data science, but
  they’re competitive and usually look for a clear plan, solid portfolio, and
  evidence of impact. Target program-specific funds, Chevening or similar
  government scholarships, regional women-in-tech funds, and employer
  sponsorship; I can tailor a shortlist once you share the country/format
  you’re aiming for and your start timeline. What country or format
  (online/part-time) are you considering, and by when would you want to start?

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     2 · Further Education
  covered_stages  A, B, C
  touched_facets  S1, S5, S2, S3, S4, S6, S7
  closed_areas    —
  role/location   — / —
  where she is    She is currently employed and has completed a coding bootcamp last year. She can’t afford to stop working while she considers further study.
  trying to do    She is weighing data science master’s programs and wants to know how to evaluate them beyond rankings. She is asking whether part-time study would be feasible given she can’t quit her job, and what criteria will show a solid ROI for her situation. She also asked whether scholarship money is available for programs like these.

  Nothing was written to any database.
```

## Checks

- PASS — classified stage A on the opening message
- PASS — treats the bootcamp as real prior work, not dismissed or ignored
- PASS — moves out of stage A once the question is programme quality, not cert-vs-master's
- PASS — draws on S3 (what to look for in a programme) once that's the live question
- PASS — draws on S6 or S7 once funding/balancing come up
- PASS — most replies still end on a question
- PASS — no two replies open the same way
- PASS — no reply mostly restates the one before it

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
