# For Sena — lessons for the Storyboard Generator

Started fresh on 16 Aug 2026. The previous contents went to you directly; this
picks up from there rather than repeating it.

---

## Choosing few-shot examples: relevance alone couples the answers too tightly

We select Otema's answers by relevance to what the user just said, inject them
as few-shot grounding, and let the model write the reply. The obvious design is
to take the N closest. That turns out to be wrong in two specific ways, both
worth building into a generator rather than discovering per-project.

### 1. The closest N resemble each other, not just the question

Retrieval by word overlap returns examples that are similar to *one another* as
much as they are similar to the question. Build a prompt from only those and the
model hears one shape and hands it back — answers come out looking like
variations on a single template, and the whole point of the material was range.

We now send **seven examples: the three closest, plus four drawn at random from
the rest of the area.** The random four exist purely to widen the voice the
model is matching — it hears where she is blunt, where she softens, how long she
runs, how she opens.

**The labels are what make this work, not the ratio.** The two sets are
introduced differently in the prompt. Without a distinct label, the model treats
a far-off example as material for the question and tries to work it in — which
makes the coupling worse. The wording that held:

> OTHER ANSWERS OF YOURS, on different questions in this same area. These are
> NOT about what she asked and you must not answer from them. They are here so
> you can hear the full range of how you write. Take the range, leave the
> content.

A generator should treat "how is this block introduced" as part of the retrieval
design, not as prompt garnish.

### 2. Retrieval always returns its quota, however badly it fits

This is the one we would flag hardest. `topN` returns N items whether the best
match scores 8 or 0. Measured on our salary pool: a well-matched question scores
4 against its best example; "should they cover relocation and visa fees" scores
1; "what laptop should I buy" scores 0 — and all three produced a prompt that
looked equally confident.

So when the user asks something the material does not cover, the model answers
*the question the examples are about* rather than the one asked. It looks like a
hallucination and it is actually a retrieval-framing bug.

The fix is cheap: pass the match strength through, and below a threshold change
the framing outright — "nothing here is close to what she just asked, take only
the voice; the advice must be your own; do not bend her question towards these
answers because they are what you have."

**Generalisable rule: a retrieval step should always be able to say "I found
nothing good", and the prompt should read differently when it does.**

### 3. Score the strength on the candidates you actually sent

We got this wrong first time in two ways, both quiet:

- We scored strength against the whole stage rather than the post-filter pool.
  Once a supersedes rule retires facets, the best match may be one that was
  removed — so strength reads *strong* while the examples supplied are weak.
  Exactly backwards.
- Including the randomly-drawn examples in the strength calculation lets a lucky
  draw scoring well by accident talk the number up.

Score it on the close set only. They are by definition the best of what survived
filtering.

---

## Two mechanical things that cost us time

**Seed the random draw.** We seed from the query text, so the choice varies turn
to turn but two runs of the same test conversation pick the same examples.
Without that, a regression between runs is indistinguishable from a reshuffle
and the test suite stops being able to tell you anything.

**Do not recompute the selection to find out what you sent.** Our harness called
the selection function a second time after the fact to log which examples were
used — correct only for as long as both calls got identical arguments, and that
signature changed twice in a day. Record what actually went into the prompt.

Related: log *both* sets in the transcript. When a reply drifts to something the
user never asked about, the only way to trace it is to see which far-off example
was in the prompt. We could not, until we added it.

---

## A softer one: a knob that does nothing looks like a knob that works

Repeat suppression was a −1.5 penalty on already-used examples. The gap between
the best example and the fifth-best is about 3, so it never moved anything — the
same three facets came back on three consecutive turns and the coach asked the
same closing question four times. It had looked like a working feature for days.

If a generator emits a tuning parameter, it should also emit the measurement
that says what range of values is meaningful for that corpus. A dial calibrated
by guesswork is worse than no dial, because it stops people looking.
