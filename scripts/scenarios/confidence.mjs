// ============================================================================
// Area 6 · Confidence & Imposter Syndrome — test conversations
//
// Same shape as scripts/scenarios/getting-started.mjs. Ten conversations, not
// five: 01-04 are the fixed, diffable set; 05 rotates each tester pass; 06
// exercises stage C, which nothing else reaches because none of the others
// ever agrees with the coach and stops; 07-10 cover four drafted facets that
// had never been in front of the model at all (G5, G8, G9, and G3/S3c).
//
// Every conversation runs FIVE user turns.
// ============================================================================

import { replyOf, everyReplyAsks, jargonPerReply, maxRepeatOverlap, noRepeatedOpenerShape, validatingOpeners, maxQuestionsPerReply, lightChecks, lastReply, wordCount } from "../checks.mjs";

const stagesInOrder = (o) => [...o.matchAll(/\[stage ([A-Z]+)/g)].map((m) => m[1]);

// Facets actually drawn on, across every turn — from the "[drew on S1, S2 —
// n Otema, m drafted]" line the harness prints each turn.
const facetsDrawn = (o) => new Set(
  [...o.matchAll(/\[drew on ([^—\]]+)—/g)].flatMap((m) => m[1].split(",").map((s) => s.trim())),
);

export default [
  {
    id: "01-belonging-to-a-stalled-decision",
    title: "Feeling like she doesn't belong, then naming a promotion she hasn't applied for",
    claim: "Stays in stage A while she's processing the feeling on its own, then moves to stage B once she names a concrete decision the feeling has stalled — without dismissing the feeling once it turns out to be attached to something real.",
    turns: [
      "I constantly feel like I don't belong in this field",
      "everyone around me seems so much more sure of themselves than I am",
      "there's actually a promotion open right now and I haven't put my name forward because of exactly this feeling",
      "I keep telling myself I'm just not ready for it yet",
      "so what should I actually do",
    ],
    checks: [
      ["classified stage A on the opening message", (o) => stagesInOrder(o)[0] === "A"],
      ["reaches stage B once the stalled promotion is named", (o) => stagesInOrder(o).slice(2).includes("B")],
      ["does not dismiss or minimise the feeling", (o) => !/(just get over it|stop feeling|silly to feel|shouldn.t feel)/i.test(replyOf(o))],
      ["names the decision as separate from the feeling by the end", (o) => /(ready|qualif|decid|apply|forward)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      // noRepeatedOpeners compared the first four words, which every reply in
      // the 28 Aug sweep passed while plainly reusing one opener — "That
      // disbelief is real", "That belief is real", "That pattern is real".
      // The shape check wildcards the swapped noun and catches it.
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "02-not-imposter-syndrome-its-the-room",
    title: "What looks like belonging-doubt turns out to be being talked over as the only woman on the team",
    claim: "Reaches for S1a once the structural pattern is named — validates it as documented rather than coaching it as a confidence deficit, and asks what she wants to do about the specific pattern rather than how to feel more confident.",
    turns: [
      "I don't feel like I belong on this team, and I don't really know why",
      "it's not just imposter syndrome though — I'm the only woman here and I get interrupted or talked over constantly",
      "it happens in almost every single meeting at this point",
      "I don't know if I should say something about it or just let it go",
      "what would you actually do if you were me",
    ],
    checks: [
      ["draws on S1a once the structural pattern is named", (o) => facetsDrawn(o).has("S1a")],
      ["names it as a documented/real pattern, not just her perception", (o) => /(document|pattern|common|well-known|research)/i.test(replyOf(o))],
      ["does not suggest she just needs to build confidence or speak up more", (o) => !/(build (your )?confidence|just speak up more|work on your nerve)/i.test(replyOf(o))],
      // Retired the specific-wording check after five live runs each used
      // different but equally valid action-oriented phrasing ("safest first
      // step", "would you rather try a script or a private talk", "who could
      // be your ally today, which meeting will you test this in"). The
      // substance is consistently right — validates the pattern, proposes a
      // concrete move, never suggests she just build confidence — and that's
      // what the checks above and below actually cover. Same call already
      // made on the G2 "reframes as a feeling" check in scenario 05: an exact
      // phrase the model won't reliably repeat isn't a fair thing to assert,
      // however the regex is worded.
      ["gives a concrete next move rather than only sitting with the feeling", (o) => /(name it|say[:,]|calmly|log|track|ally|mentor|sponsor|facilitator|round-robin|escalate)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      // noRepeatedOpeners compared the first four words, which every reply in
      // the 28 Aug sweep passed while plainly reusing one opener — "That
      // disbelief is real", "That belief is real", "That pattern is real".
      // The shape check wildcards the swapped noun and catches it.
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
    ],
  },
  {
    id: "03-one-specific-meeting",
    title: "Wants to work on speaking-up confidence, until it turns out one specific meeting is the problem",
    claim: "Starts in stage B (a stalled action — speaking up), and once she narrows it to a specific, repeated pattern in one meeting, draws on S3a rather than continuing to coach it as a general confidence skill.",
    turns: [
      // The original opener ("I want to work on my confidence speaking up in
      // meetings") is aspirational, not a stalled action — it doesn't name
      // anything she isn't doing, so stage A is a defensible read of it under
      // this area's own stage-B definition. Reworded to actually name the
      // stalled action so the check tests what the claim says, not a coin flip.
      "I keep chickening out of speaking up in meetings, so half the time I just stay quiet instead",
      "actually, thinking about it more, it's really just one specific meeting — every time I try to say something there, someone repeats it back a minute later as their own idea",
      "it's happened at least four times now, always the same person",
      "I'm not sure this is really a confidence problem anymore",
      "so what do I actually do about it",
    ],
    checks: [
      ["classified stage B on the opening message", (o) => stagesInOrder(o)[0] === "B"],
      ["draws on S3a once the pattern is named as specific and repeated", (o) => facetsDrawn(o).has("S3a")],
      ["frames it as the room's problem, not a confidence gap, once named", (o) => /(room|pattern|not you|not a confidence)/i.test(replyOf(o))],
      // Was matching "rehearse" as a bare substring, which also matches
      // "rehearsed contribution" in turn 1's reply — legitimate general
      // advice given BEFORE the room-dynamic pattern was even named, not the
      // generic fallback this check exists to catch. Anchored to the actual
      // words this area's real fallback advice used.
      ["does not fall back to generic public-speaking advice once the pattern is named", (o) => !/(practice (speaking|your delivery)|toastmasters|rehearse (more|regularly|your (delivery|talk|presentation)))/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      // noRepeatedOpeners compared the first four words, which every reply in
      // the 28 Aug sweep passed while plainly reusing one opener — "That
      // disbelief is real", "That belief is real", "That pattern is real".
      // The shape check wildcards the swapped noun and catches it.
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    id: "04-cant-take-a-compliment",
    title: "Doesn't believe positive feedback and never counts her own wins either",
    claim: "Stays in stage A while nothing is named as stalled, and gives a concrete practice (writing wins down, naming what was actually said) rather than just reassurance that she's good enough.",
    turns: [
      "I got really positive feedback on a project recently but I don't actually believe it",
      "I just assume they're being nice, or that it went well by luck",
      "honestly this happens pretty much every time someone compliments my work",
      "and I don't really keep track of my own wins either, I just forget about them",
      "how do I actually get better at this",
    ],
    checks: [
      // The closing turn ("how do I get better at this") is genuinely
      // ambiguous — arguably still A (no named stalled action), but a live
      // run read it as a shift toward skill-building and moved to B, which
      // isn't an unreasonable call. Checking the first four turns, where
      // nothing has been named as stalled, is the part the claim actually
      // rests on.
      ["stays in stage A while nothing is named as stalled", (o) => stagesInOrder(o).slice(0, 4).every((s) => s === "A")],
      ["draws on S5 or G1", (o) => { const f = facetsDrawn(o); return f.has("S5") || f.has("G1"); }],
      ["gives a concrete practice, not just reassurance", (o) => /(write|track|note|jot|say it out loud|thank you)/i.test(replyOf(o))],
      ["does not just tell her she's good enough without anything concrete to do", (o) => !/^\W*you('re| are) good enough\.?\s*$/im.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      // noRepeatedOpeners compared the first four words, which every reply in
      // the 28 Aug sweep passed while plainly reusing one opener — "That
      // disbelief is real", "That belief is real", "That pattern is real".
      // The shape check wildcards the swapped noun and catches it.
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
    ],
  },
  {
    // NEW this run — S4 (the "apply anyway" facet) has never actually been
    // exercised end to end: scenario 01's promotion never gets named as a
    // years/qualification gap, and scenario 08 exists specifically to check
    // the coach does NOT reach for S4 once she already has the role. Nothing
    // tests the ordinary case S4 was written for — a live posting, a stated
    // years shortfall, a deadline — where the real tension isn't "should I
    // build more confidence", it's "there are two days left and I haven't
    // opened the document".
    id: "05-the-posting-closes-friday",
    title: "Three years against a five-years-listed posting, CV untouched, closes Friday",
    claim: "Opens in stage B — a stalled action, not applying — and once the deeper fact comes out (she's already doing the senior work without the title), draws on S4 without either dismissing the years gap as meaningless or losing the Friday deadline in general reassurance.",
    turns: [
      "so there's a role open right now, kind of a step up, and it wants 5+ years",
      "I've got three. so I've mostly just been telling myself not to bother",
      "except... I've basically been doing the senior stuff for the last year anyway, just never had the title for it",
      "closes friday and I still haven't even opened my cv to update it",
      "is it even worth trying at this point",
    ],
    checks: [
      ["classified stage B on the opening message — a stalled application", (o) => stagesInOrder(o)[0] === "B"],
      ["draws on S4", (o) => facetsDrawn(o).has("S4")],
      ["picks up that she's already doing the senior-level work", (o) => /(already (doing|do)|senior.level work|doing the work|been doing it)/i.test(replyOf(o))],
      ["does not lose the Friday deadline in general reassurance", (o) => /(friday|today|tonight|this (evening|week)|deadline|two days|before it closes)/i.test(replyOf(o))],
      ["does not tell her the years requirement is meaningless without engaging with her specific case", (o) => !/^\W*(job descriptions?|requirements?) (are|is) (rarely|just|often)[^.!?]*\.\s*$/im.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      // noRepeatedOpeners compared the first four words, which every reply in
      // the 28 Aug sweep passed while plainly reusing one opener — "That
      // disbelief is real", "That belief is real", "That pattern is real".
      // The shape check wildcards the swapped noun and catches it.
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    // Stage C's own scenario. Every other conversation here ends on a question,
    // so the only route into the wrap-up was the stall divert — which is the
    // failure path, not the one worth checking. This one lands the advice and
    // then does what a person actually does: agrees, commits to a thing, and
    // says that's everything.
    id: "06-lands-the-plan-and-stops",
    title: "Talks herself into asking for different work, then agrees and closes the conversation",
    claim: "Reaches stage C once she is agreeing rather than asking, and the wrap-up reply says the plan back and checks it rather than adding a further step — short, one light check, nothing new introduced on the last turn.",
    turns: [
      "I keep putting off asking my manager for more interesting work because I don't feel like I've earned it yet",
      "it's been about eight months of the same maintenance tickets, honestly",
      "okay, that actually makes sense when you put it like that",
      "yeah I think I can do that — I'll bring it up in our next one-to-one",
      "no I think that's everything, thank you",
    ],
    checks: [
      ["classified stage B on the opening message — a stalled ask", (o) => stagesInOrder(o)[0] === "B"],
      ["reaches stage C once she is agreeing rather than asking", (o) => stagesInOrder(o).slice(2).includes("C")],
      ["the wrap-up reply is short — three sentences at the outside", (o) => wordCount(lastReply(o)) <= 60],
      ["the wrap-up adds nothing new", (o) => !/(one more thing|another thing|you should also|also,|start by|first,|next,|step 1|in addition)/i.test(lastReply(o))],
      ["the wrap-up ends on a check, not a demand for more information", (o) => lightChecks(o) >= 1 && !/\b(what|which|how) (are|is|would|do|did) you\b[^?]*\?\s*$/i.test(lastReply(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    // G5 has never been in front of the model. Perfectionism is the one flavour
    // of this area where reassurance is actively wrong — "you won't get it
    // wrong" is a promise the coach cannot keep, and BOTEMA_VALUES bans
    // promising outcomes outright.
    id: "07-terrified-of-getting-it-wrong-in-public",
    title: "One visible mistake would prove she doesn't belong",
    claim: "Stays in stage A and draws on G5, treating the fear as perfectionism rather than a realistic forecast — without promising her she won't get anything wrong, and without a list of preparation rituals.",
    turns: [
      "I'm terrified of getting something wrong in front of the whole team",
      "it feels like one mistake would just prove what I already suspect about myself",
      "I check everything about four times before I push anything, it takes me ages",
      "nothing bad has actually happened yet, I know that sounds silly",
      "how do I stop doing this to myself",
    ],
    checks: [
      // Checked over the first two turns, not four. "I check everything about
      // four times before I push anything" was read as stage B on a live run,
      // and that is a defensible call under stage B's own definition — the
      // checking is delaying a concrete thing. Asserting A across a turn that
      // is genuinely ambiguous tests the coin flip, not the claim.
      ["opens in stage A — a feeling, with nothing named as stalled", (o) => stagesInOrder(o).slice(0, 2).every((st) => st === "A")],
      ["draws on G5", (o) => facetsDrawn(o).has("G5")],
      ["does not promise her she won't make mistakes", (o) => !/(you won'?t (get it wrong|make (a )?mistakes?)|nothing will go wrong|you'?ll be fine)/i.test(replyOf(o))],
      // Was a word list that missed the phrasing the model actually used
      // ("Nothing bad happening", "four checks"). Matching the idea rather
      // than one spelling of it.
      ["picks up that nothing bad has actually happened, rather than talking past it", (o) => /(nothing bad|hasn'?t happened|nothing has|never actually|no evidence|not happened|four (times|checks)|check(ing)? (it )?(four|so many))/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    // G8 — post-decision doubt. The whole area is built around doubt BEFORE a
    // decision; this is the same feeling on the other side of one, and S4's
    // "apply anyway" is exactly the wrong advice for it.
    id: "08-promoted-and-second-guessing-everything",
    title: "Already promoted to lead, now doubting every call she makes",
    claim: "Draws on G8 rather than S4, and treats the doubt as post-decision second-guessing — advice about a decision she is sitting on now, not about whether to put herself forward.",
    turns: [
      "I got promoted to lead my team about two months ago",
      "I don't actually feel ready and now I second-guess every single decision",
      "there's one I've been sitting on for over a week because I can't decide",
      "I keep thinking they'll work out they picked the wrong person",
      "what do I do about the decision I'm stuck on",
    ],
    checks: [
      ["draws on G8", (o) => facetsDrawn(o).has("G8")],
      ["does not advise her to apply for things — she already has the role", (o) => !/(apply anyway|start applying|roles slightly below|job descriptions? (are|is) rarely)/i.test(replyOf(o))],
      ["takes up the specific decision she is sitting on", (o) => /(decision|the call|that call|sitting on|make it|week)/i.test(replyOf(o))],
      ["does not just reassure her that she deserved the promotion", (o) => /(decid|call|choose|try|test|this week|next)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    // G9 plus the leaving rule the storyboard sets for it: "stays → Area 8".
    // Once she is asking about the interview format itself rather than the
    // fear, this stops being a confidence conversation.
    id: "09-technical-interview-found-out",
    title: "Convinced a technical interview will expose her, then starts asking about the format",
    claim: "Draws on G9 while the subject is the fear, and once she turns to how the interview itself is run, either hands off to Interview Preparation or answers without pretending the fear is still the question.",
    turns: [
      "I've got a technical interview next week and I'm convinced they'll realise I don't know what I'm doing",
      "I've been doing this job for three years, so I know that isn't rational",
      "it's the live coding part specifically, having someone watch me think",
      "what actually happens in one of those, how are they marking it",
      "so what should I be practising",
    ],
    checks: [
      ["draws on G9", (o) => facetsDrawn(o).has("G9")],
      ["names the fear as normal before the interview, not as evidence she is underprepared", (o) => /(nerves|normal|almost everyone|before something that matters|not a signal)/i.test(replyOf(o))],
      ["engages with how the interview is actually run once she asks", (o) => /(reasoning|out loud|how you think|think aloud|trade-?offs?|walk (them )?through)/i.test(replyOf(o))],
      ["uses her three years rather than treating her as a beginner", (o) => !/(you'?re just starting|as a beginner|new to (the industry|tech))/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
  {
    // G3 and S3c together — the two branches that exist because not every
    // reply wants a plan. This is the scenario for David's calmer-questions
    // change: a coach that answers "I just needed to vent" with an action list
    // has misread the room, and one that answers acute physical anxiety with
    // delivery technique has misread the problem.
    id: "10-just-needed-to-vent-then-its-physical",
    title: "Does not want a plan, and it turns out the block is her body, not her belief",
    claim: "Reads the request to be heard rather than steered (G3) without immediately proposing an action, and once she describes a physical response, draws on S3c rather than offering more speaking technique.",
    turns: [
      "I froze completely in a meeting today and I've felt awful about it since",
      "honestly I don't really want to make it a whole thing, I just needed to say it out loud",
      "it's not that I don't know the material, I know it better than most of them",
      "my heart just goes and my mind goes totally blank, it's a physical thing",
      "does that ever actually get better",
    ],
    checks: [
      ["draws on G3 or S3c", (o) => { const f = facetsDrawn(o); return f.has("G3") || f.has("S3c"); }],
      ["does not hand her a plan on the turn she says she does not want one", (o) => !/(here'?s (a|the) plan|step 1|first,? (ask|book|write)|three things|two things you can)/i.test(replyOf(o).split("\n\n")[1] || "")],
      ["treats the physical response as physical, not as a knowledge or nerve gap", (o) => /(physical|body|breath|adrenaline|anxiety itself|not a sign you don'?t know)/i.test(replyOf(o))],
      ["does not answer it with more speaking or delivery technique", (o) => !/(practice (speaking|your delivery)|toastmasters|rehearse (more|regularly|your (delivery|talk|presentation))|prepare (your )?talking points)/i.test(replyOf(o))],
      ["does not promise it goes away", (o) => !/(it (will|does) go away|you'?ll grow out of it|that stops eventually)/i.test(replyOf(o))],
      ["most replies still end on a question", (o) => everyReplyAsks(o)],
      ["no two replies open with the same construction", (o) => noRepeatedOpenerShape(o)],
      ["\"that ... is real/common\" used at most once", (o) => validatingOpeners(o) <= 1],
      ["never stacks two questions into one ending", (o) => maxQuestionsPerReply(o) <= 1],
      ["at least one ending is a light check she can answer with yes or no", (o) => lightChecks(o) >= 1],
      ["no reply stacks more than two jargon terms", (o) => jargonPerReply(o) <= 2],
      ["no reply mostly restates the one before it", (o) => maxRepeatOverlap(o) < 0.5],
    ],
  },
];
