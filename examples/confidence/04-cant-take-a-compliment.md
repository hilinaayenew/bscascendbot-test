# Doesn't believe positive feedback and never counts her own wins either

_Run 2026-08-28 22:02 UTC · 5 turns · gpt-5-nano via Azure_

**What this tests.** Stays in stage A while nothing is named as stalled, and gives a concrete practice (writing wins down, naming what was actually said) rather than just reassurance that she's good enough.

## Transcript

```
BSC Coach — local area harness
  Area 6 · Confidence & Imposter Syndrome · live via gpt-5-nano
  Type freely. 'state' to inspect, 'quit' to stop.

  you > I got really positive feedback on a project recently but I don't actually believe it
  [stage A — User expresses discounting positive feedback as if it's not deserved, which is a feeling being worked through rather than a concrete action.]
  → enterDiscussionArea(6 · Confidence & Imposter Syndrome)
  [numbered rundown flattened — it was a list]
  [sentence cap fired — the model wrote a rundown]
  [drew on S5, S1a, S1 — 2 Otema, 1 drafted]
  [voice only: G1, G10, G7, S1b]

Botema
  That kind of positive feedback can feel inauthentic when you’re not used to
  hearing it about your own work, but it’s real and common for women in tech.
  I’d keep it simple and concrete. Would you be willing to try those three
  steps this week?

  you > I just assume they're being nice, or that it went well by luck
  [stage A — The user expresses doubt about feedback and discounts praise, which is a feeling being worked through without concrete action.]
  [drew on G1, G8, S1b — 0 Otema, 3 drafted]
  [voice only: S5a, S1, S2, G10]

Botema
  That doubt is real and common for women in tech—feedback often lands as luck
  or niceness when you’re already doubting yourself. Try this: when someone
  praises you, thank them and name the concrete work you did, then ask for one
  specific example of what stood out so you can anchor it to your effort.
  Would you try that with the next piece of feedback you get and tell me what
  you hear?

  you > honestly this happens pretty much every time someone compliments my work
  [stage A — User repeats discounting positive feedback; ongoing pattern of imposter feelings without concrete action.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [drew on G1, G7, G5 — 0 Otema, 3 drafted]
  [voice only: S1b, G3, G6, S5]

Botema
  A practical anchor is: “Thank you — I put real work into X, like Y.” Would
  you try that the next time you’re praised and tell me what concrete detail
  you anchored to?

  you > and I don't really keep track of my own wins either, I just forget about them
  [stage A — User states she doesn’t keep track of her wins, which is a new self-management behavior related to confidence; fits stage A (feeling/problem without a concrete action being stalled).]
  [drew on G1, G6, G10 — 0 Otema, 3 drafted]
  [voice only: S5, G3, G8, G9]

Botema
  You're not alone—forgetting our wins is common, especially when you're in
  the thick of things. I’d start with a tiny habit: a five-minute weekly recap
  where you jot one concrete outcome you delivered, the skill that carried
  you, and one lesson learned, all in a single line or quick note. Does that
  feel doable for you this week?

  you > how do I actually get better at this
  [stage A — User asked for concrete steps to improve handling feedback and recognizing wins, which is a progression in the Confidence & Imposter Syndrome area and indicates they are seeking actionable strategies.]
  [repeated-opener guard fired — a reused opening clause was dropped]
  [repeated advice removed]
  [drew on G1, S1b, S5a — 0 Otema, 3 drafted]
  [voice only: S5, G9, G3, G6]

Botema
  Try a tiny habit: each week write one line with the outcome, the skill you
  used, and the result; when praised, respond with “thank you — I put real
  work into X, which led to Y,” then keep a one-minute impact summary you can
  pull out in conversations.

  you > quit

  ── state ─────────────────────────────────────────────
  active_area     6 · Confidence & Imposter Syndrome
  covered_stages  A
  touched_facets  S1, S1b, S2, S5, S5a, G1, G3, G5, G6, G7, G8, G9, G10, S1a
  closed_areas    —
  role/location   — / —
  trying to do    She wants to get better at turning feedback into real evidence of her contributions, so she can believe the positive things she hears. She is hindered by believing praise is niceness or luck and by forgetting her own wins. She has not described any concrete steps she tried yet. She asked how to actually get better at this.

  Nothing was written to any database.
```

## Checks

- PASS — stays in stage A while nothing is named as stalled
- PASS — draws on S5 or G1
- PASS — gives a concrete practice, not just reassurance
- PASS — does not just tell her she's good enough without anything concrete to do
- PASS — most replies still end on a question
- PASS — no two replies open with the same construction
- PASS — "that ... is real/common" used at most once
- PASS — never stacks two questions into one ending
- PASS — at least one ending is a light check she can answer with yes or no
- PASS — no reply stacks more than two jargon terms

---

_Generated by `npm run coach:scenarios` against live Azure. Regenerate after changing prompts or content._
