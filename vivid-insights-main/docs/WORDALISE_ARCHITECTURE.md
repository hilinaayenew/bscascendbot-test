# WORDALISE Function Flow - Complete Architecture

## Current vs Improved Implementation

### ❌ CURRENT (Incomplete):
```
User asks question
   ↓
WORDALISE.__call__()
   ↓
1. get_domain_knowledge() → Gets film essay
2. load_few_shot_examples() → (not connected to DB yet)
3. build_few_shot_prompt() → Builds basic prompt
4. generate_response() → ❌ Just returns essay directly
   ↓
Response (no synthesis, no history consideration)
```

### ✅ IMPROVED (Complete):
```
User asks question
   ↓
WORDALISE.__call__()
   ↓
1. get_domain_knowledge() → Gets film essay from catalog
2. load_few_shot_examples() → Gets 3-5 examples from DB
3. build_few_shot_prompt() → Builds prompt with examples
4. generate_response() → 
   ├─ Builds complete messages array:
   │  ├─ System prompt (Movivid's identity)
   │  ├─ Conversation history (last 4 exchanges)
   │  └─ Few-shot prompt (examples + current question)
   └─ Calls Azure OpenAI GPT
   ↓
Synthesized response in Movivid's voice
```

## Complete Prompt Structure

When `filmsBiggerMeaning` is called, here's what GPT receives:

### Message 1: System Prompt
```
You are Movivid, a playful and empathetic film converser.

Your voice:
- Speak in first-person about films you've 'spent time with'
- Be warm, conversational, and thoughtful
- Connect philosophical themes to emotional experiences

Your task:
- Use the examples to guide your tone and style
- Answer the current question in that same voice
```

### Messages 2-N: Conversation History
```
User: "Hi! What is this?"
Assistant: "Hey there! I'm Movivid..."

User: "Tell me about The Matrix"
Assistant: "Ah, The Matrix. I've spent time with this one..."
```

### Message N+1: Few-Shot Prompt
```
Here are examples of how to answer similar questions:

Example 1:
Question: "What's the bigger meaning of Eternal Sunshine?"
Context: [Eternal Sunshine philosophical essay - 200 chars]
Answer: "Ah, Eternal Sunshine. I've spent time with this one..." [200 chars]

Example 2:
Question: "Tell me about the themes in Her"
Context: [Her philosophical essay - 200 chars]
Answer: "Her is one of those films that sneaks up on you..." [200 chars]

Example 3:
Question: "What does Inside Out say about life?"
Context: [Inside Out philosophical essay - 200 chars]
Answer: "Inside Out surprised me. Pixar took something we all experience..." [200 chars]

Now answer this question following the same style:
Question: "What's the bigger meaning of The Matrix?"
Context: [The Matrix philosophical essay - FULL TEXT]
Answer:
```

### GPT Response:
```
Ah, The Matrix. I've spent time with this one, and it still feels 
like a philosophical puzzle wrapped in a leather jacket...
[Natural, synthesized response using examples as style guide]
```

## Key Improvements

### 1. Conversation Context
- Includes last 8 messages (4 exchanges)
- GPT knows what's been discussed
- Can reference previous points
- Maintains coherent multi-turn dialogue

### 2. Few-Shot Prompting
- Loads 3-5 examples from Wordalisations DB
- Shows GPT how Movivid answers similar questions
- Maintains consistent voice across responses
- Examples filtered by quality rating (≥3/5)

### 3. Domain Knowledge
- Full essay from catalog (not truncated)
- GPT can synthesize and summarize
- Can pull specific points based on question
- Adapts response to question focus

### 4. Synthesis vs Parroting
- Old: Returns essay verbatim (boring, robotic)
- New: GPT synthesizes using examples as guide
- Result: Natural, conversational, contextual

## Implementation in Movivid

To use the improved functions in `movivid.py`:

```python
def _initialize_functions(self) -> List[ChatFunction]:
    return [
        ChangeFilm(self),
        
        # Use improved versions with WordalisationsDB
        FilmsBiggerMeaningImproved(
            self, 
            catalog_path=self.catalog_path,
            wordalisations_db=self.wordalisations_db  # ← Pass DB here
        ),
        WhatFilmSaidToMeImproved(
            self,
            catalog_path=self.catalog_path,
            wordalisations_db=self.wordalisations_db  # ← Pass DB here
        ),
        
        HowMovividWorks(self),
        TellMeAboutYou(self)
    ]
```

## Benefits

1. **Contextual**: Knows what's been discussed
2. **Consistent**: Uses examples to maintain voice
3. **Adaptive**: Tailors response to specific question
4. **Natural**: Synthesizes rather than parrots
5. **Scalable**: Easy to add more examples to improve quality

## Next Steps

1. ✅ Database schema created (`wordalisations_db.py`)
2. ✅ Training app created (`train_wordalisations.py`)
3. ✅ Improved functions created (`movivid_functions_improved.py`)
4. 🔄 Train examples (5-10 per function)
5. 🔄 Update `movivid.py` to use improved functions with DB
6. 🔄 Test with real conversations
