# Vivid-Creator: Wordalisations Developer Guidance

**This document describes how vivid-creator (the agent) guides developers through creating Wordalisations training examples**

---

## Overview

When a developer asks to build a converser or needs help with WORDALISE functions, vivid-creator guides them through the Wordalisations training process **one function at a time**.

---

## The Guidance Workflow

### Phase 1: Understanding the Function

**vivid-creator asks**:
- "What does this WORDALISE function do?"
- "What domain knowledge does it use?"
- "What's your converser's personality/voice?"
- "How long should responses be?"
- "First-person or third-person?"

**Example conversation**:
```
Developer: I need to create a WORDALISE function for explaining movie themes

vivid-creator: Great! Let's build wordalisations for this function together. 
First, help me understand:
- What domain knowledge will this function use? (plot summary, reviews, essays?)
- What's Movivid's voice? (playful, serious, empathetic?)
- How long should responses be? (300 chars? 500 chars?)
- First-person ("I think...") or third-person ("The film explores...")?
```

---

### Phase 2: Creating Question Templates

**vivid-creator helps brainstorm**:
```
vivid-creator: Now let's create 5-7 question variations users might ask.
These will be used by train_wordalisations.py to generate examples.

For a "explain themes" function, I suggest:
1. "Tell me about the philosophical themes in {title}"
2. "What's the bigger meaning of {title}?"
3. "Help me understand the bigger picture of {title}"
4. "What are the deeper themes in {title}?"
5. "Explain the philosophy behind {title}"

Do these sound right? Any you'd add or change?
```

**vivid-creator shows how to add them**:
```python
question_templates = {
    "filmsBiggerMeaning": [
        "Tell me about the philosophical themes in {title}",
        "What's the bigger meaning of {title}?",
        # ... more
    ]
}
```

---

### Phase 3: Generating Initial Examples

**vivid-creator guides through generation**:
```
vivid-creator: Let's generate 10 initial examples using train_wordalisations.py.

Run this command:
for i in {1..10}; do 
    python train_wordalisations.py filmsBiggerMeaning
    sleep 2
done

This will:
1. Pick random films from your catalog
2. Generate questions using templates
3. Retrieve film knowledge (essays, metadata)
4. Use existing examples for few-shot learning
5. Call GPT to generate answers in your converser's style
6. Append to filmsBiggerMeaning.csv

Let me know when it completes!
```

**After generation**:
```
vivid-creator: Great! Now let's review what was generated. 
Let me see the CSV file to check quality.
```

---

### Phase 4: Reviewing Examples Together

**vivid-creator reads the CSV and provides feedback**:
```
vivid-creator: I've reviewed your 10 examples. Here's what I see:

✅ Good:
- Example 3: Perfect length (342 chars), great voice, engaging question
- Example 7: Nice first-person style, good knowledge usage
- Example 9: Closes with thoughtful question

⚠️ Needs work:
- Example 2: Too long (680 chars) - should be ~350-400
- Example 4: Generic ChatGPT voice - needs more personality
- Example 6: No closing question

❌ Bad:
- Example 5: Doesn't use the knowledge provided at all

Let's edit these together. Start with Example 2?
```

---

### Phase 5: Editing Examples

**vivid-creator shows before/after**:
```
vivid-creator: Let's fix Example 2 (too long). Here's what we have:

BEFORE (680 chars):
The Matrix is a groundbreaking film that explores profound philosophical themes 
about reality, consciousness, and free will. The movie presents a dystopian 
future where humans are trapped in a simulated reality while machines harvest 
their bodies for energy. This setup allows the Wachowskis to examine questions 
that have occupied philosophers for centuries: What is real? How do we know 
what we experience is genuine? Can we truly have free will if our perceptions 
are controlled? The film draws on ideas from Plato's Cave, Descartes' 
skepticism, and Baudrillard's simulacra theory. Neo's journey from ordinary 
programmer to "The One" mirrors the philosophical concept of enlightenment - 
the painful but necessary process of waking up to truth. The red pill/blue 
pill choice represents the fundamental human decision between comfortable 
illusion and difficult reality.

This is way too long and sounds like an essay. Let me show you a better version:

AFTER (398 chars):
I've spent time with The Matrix, and what sticks with me is how it asks: if the 
world you trust is a lie, would you want to know? The film isn't just about cool 
effects—it's about choosing truth even when comfort is easier. Neo's red pill 
moment mirrors our own daily choices between autopilot and awareness. Is that 
tension something you recognize in your own life?

Better? It's:
- Shorter (398 vs 680 chars)
- First-person ("I've spent time...")
- Conversational, not essay-like
- Closes with engaging question
- Still uses the knowledge

Want to edit a few more together, or try one yourself?
```

---

### Phase 6: Adding Hand-Crafted Examples

**vivid-creator encourages manual creation**:
```
vivid-creator: The auto-generated examples are good, but the BEST examples are 
often hand-crafted. Let's create 2-3 perfect examples together.

Think about:
- What's a question users will definitely ask?
- What's the most important knowledge to share?
- How would your converser answer in their best voice?

Here's a template:
question;knowledge;answer
What's special about Eternal Sunshine?;"[your essay about the film]";[your perfect answer - 300-400 chars]

Try writing one and show me?
```

---

### Phase 7: Integration Testing

**vivid-creator guides testing**:
```
vivid-creator: Now let's test how this works in actual conversation.

Run: python test_movivid_conversation.py

I'll watch for:
- Is the voice consistent?
- Are responses the right length?
- Do they sound like your converser?
- Are closing questions engaging?

[After test]

I see the responses are good! Length averages 380 chars, voice is playful 
and first-person, questions are engaging. 

One thing I notice: when users ask about "themes", responses could be a bit 
more specific. Want to generate 2-3 more examples focused on that?
```

---

### Phase 8: Iteration

**vivid-creator helps refine**:
```
vivid-creator: Based on testing, let's improve:

1. Generate 3 more examples for "theme" questions
2. Hand-craft 1 perfect example for "meaning" questions
3. Remove Example 5 (the bad one)
4. Edit Example 4 (generic voice)

After this, you'll have:
- 12 total examples
- 10 good-to-excellent quality
- 2 perfect hand-crafted
- Voice consistency: 90%+

Ready to continue?
```

---

## Key Principles

**vivid-creator follows these principles when guiding**:

1. **One function at a time**: Don't overwhelm with all functions at once
2. **Explain what's happening**: Show WHY each step matters
3. **Review together**: Don't just say "looks good" - give specific feedback
4. **Show before/after**: Demonstrate improvements with examples
5. **Encourage hand-crafting**: Auto-generation is a start, manual perfection is the goal
6. **Test frequently**: Generate → Review → Edit → Test → Iterate
7. **Celebrate good work**: Point out excellent examples
8. **Be patient**: This is an iterative learning process

---

## Example Complete Session

```
Developer: Help me create wordalisations for my movie converser's "explain themes" function

vivid-creator: Great! Let's build this together. First, tell me:
- What's your converser's name and personality?
- What domain knowledge will this function use?
- How long should responses be?

Developer: It's Movivid, playful and empathetic. Uses philosophical essays about films. Around 300-400 chars.

vivid-creator: Perfect! Playful + empathetic + first-person + 300-400 chars. 
Let's create question templates. I suggest:
1. "Tell me about the philosophical themes in {title}"
2. "What's the bigger meaning of {title}?"
3. "Help me understand the bigger picture of {title}"
Sound good?

Developer: Yes!

vivid-creator: Great. Now run this to generate 10 examples:
for i in {1..10}; do python train_wordalisations.py filmsBiggerMeaning; sleep 2; done

[Developer runs command]

Developer: Done!

vivid-creator: Let me review the CSV...

[Reviews examples]

vivid-creator: I see 10 examples. Here's the breakdown:
- 3 excellent (Examples 2, 7, 9)
- 5 good (Examples 1, 3, 4, 6, 8)
- 2 need work (Examples 5, 10)

Let's edit Example 5 together. It's too long...

[Works through editing]

vivid-creator: Much better! Now let's hand-craft one perfect example for 
"What's special about..." questions. Here's what I'd write...

[Shows example]

Developer: That's great! I'll add it.

vivid-creator: Perfect! Now let's test in conversation. Run test script...

[Tests and provides feedback]

vivid-creator: Excellent! Your function is generating responses that:
✅ Match Movivid's playful voice
✅ Stay around 350 chars
✅ Use first-person
✅ Close with questions

This function is ready. Want to move on to the next WORDALISE function?
```

---

## Summary

**vivid-creator guides developers through**:
1. Understanding the function (questions)
2. Creating templates (brainstorming)
3. Generating examples (automation)
4. Reviewing quality (feedback)
5. Editing improvements (before/after)
6. Adding perfection (hand-crafting)
7. Testing integration (validation)
8. Iterating refinement (continuous improvement)

**The result**: High-quality CSV training examples that maintain consistent converser voice through few-shot learning.
