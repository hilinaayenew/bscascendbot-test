---
description: "Complete guide to Wordalisations - CSV-based few-shot training for WORDALISE functions. Learn how to create training examples, use train_wordalisations.py, and maintain consistent converser voice."
applyTo: ""
---

# Building Conversers: Wordalisations Training System

**What are Wordalisations?** CSV files containing question-knowledge-answer triples that teach WORDALISE functions how to respond in the converser's voice through few-shot prompting.

**Why CSV Training?** Few-shot learning with concrete examples maintains consistent voice quality better than system prompts alone.

**Status**: Validated through Movivid. This is the **essential** way conversers work.

---

## Overview: The Wordalisations Workflow

### What Problem Does This Solve?

WORDALISE functions need to generate conversational responses that:
- Match the converser's unique voice and personality
- Stay concise and engaging
- Connect domain knowledge to user's life
- Feel authentic, not "ChatGPT-like"

**Solution**: Few-shot prompting with CSV training examples

### The Complete Architecture

```
User Question
     ↓
WORDALISE Function Called
     ↓
1. Load domain knowledge (from catalog/API)
2. Load 3-5 CSV examples (similar questions)
3. Build few-shot prompt (examples + current question)
4. Build complete messages array:
   - System prompt (converser identity)
   - Conversation history (last 4-6 messages, excluding current)
   - Few-shot prompt (examples + question + knowledge)
5. ONE LLM call → Response
     ↓
Return to user
```

**Key Principle**: ONE LLM call per WORDALISE function. No second call to "wrap" the response.

---

## Step-by-Step: Creating Wordalisations

### Phase 1: Set Up CSV Files

**One CSV per WORDALISE function**

**File naming**: `{functionName}.csv`
- Example: `filmsBiggerMeaning.csv`, `whatFilmSaidToMe.csv`

**CSV Structure**:
```csv
question;knowledge;answer
Tell me about the philosophical themes in Eternal Sunshine;"[Long philosophical essay about memory and identity...]";Eternal Sunshine is a meditation on memory. One thing that sticks out for me is the way it captures how memory is a terrain we inhabit rather than a document we scan. The film then asks what we lose when we try to erase pain rather than learn from it. Is this something you can relate to?
```

**Important**:
- Use **semicolon delimiter** (`;`) to avoid conflicts with commas in text
- Quotes around multi-line fields
- 3 columns: question, knowledge (context), answer

**Storage**: Put CSVs in the converser's directory alongside the main .py file

---

### Phase 2: Generate Initial Examples with `train_wordalisations.py`

**Script Purpose**: Auto-generate training examples using GPT with few-shot learning

**Usage**:
```bash
python train_wordalisations.py filmsBiggerMeaning
python train_wordalisations.py whatFilmSaidToMe
```

**What It Does**:
1. Randomly selects entity from catalog
2. Generates question using templates
3. Retrieves domain knowledge (essays, metadata)
4. Loads existing CSV examples (for few-shot)
5. Builds training prompt with examples
6. Calls Azure OpenAI to generate answer
7. Appends to CSV file

**Key Feature**: Uses existing examples to teach GPT the style (bootstrapping)

**How `train_wordalisations.py` Works**:

```python
class SimpleWordalisationsTrainer:
    """Generate training examples with GPT"""
    
    def __init__(self, function_name: str):
        self.function_name = function_name
        self.csv_path = f"{function_name}.csv"
        self.catalog = self.load_catalog()
        self.question_templates = self.get_question_templates()
    
    def generate_example(self):
        """Main workflow"""
        # 1. Choose random entity
        film = self.choose_random_film()
        
        # 2. Generate question
        question = self.generate_question()
        
        # 3. Get knowledge
        knowledge = self.get_knowledge(film)
        
        # 4. Load existing examples (for few-shot)
        existing_examples = self.load_existing_examples(limit=3)
        
        # 5. Build training prompt
        prompt = self.build_prompt_for_function(
            question, knowledge, existing_examples
        )
        
        # 6. Generate answer via GPT
        answer = await self.generate_answer(prompt)
        
        # 7. Append to CSV
        self.append_to_csv(question, knowledge, answer)
```

**Question Templates** (customize per function):
```python
{
    "filmsBiggerMeaning": [
        "Tell me about the philosophical themes in {title}",
        "What's the bigger meaning of {title}?",
        "Help me understand the bigger picture of {title}"
    ],
    "whatFilmSaidToMe": [
        "What did you feel when watching {title}?",
        "What stuck with you from {title}?",
        "Tell me your personal take on {title}"
    ]
}
```

**Training Prompt Structure** (5-part developer message):
```python
def build_prompt_for_function(question, knowledge, examples):
    prompt = f"""[DEVELOPER MESSAGE]

In the conversation up to now you have been discussing {domain} with the user.
Now the user has asked you a new question. You want to use your deep knowledge
of {knowledge_type}. But before you do that I want to give you stylistic
examples of how you have answered such questions in the past.

The key is to {style_requirements}. Here are some examples:

Example 1:
Question: {example_question}
Your Knowledge: {context_preview}
Your Answer: {example_answer}

---

Now you should follow this pattern in your current answer.
{repeated_style_requirements}

User's Current Question: {question}
Your Knowledge: {full_context}

Now give your answer directly to the user:"""
    
    return prompt
```

**Run Multiple Times**: Generate 5-10 examples per function
```bash
for i in {1..10}; do python train_wordalisations.py filmsBiggerMeaning; done
```

---

### Phase 3: Manual Review and Refinement

**After generating initial examples, review and improve them**:

#### 1. Check Voice Consistency
- Does it sound like your converser?
- Is the tone right? (playful, professional, empathetic, etc.)
- First-person vs third-person?

#### 2. Check Length
- Are answers too long/short?
- Consistency across examples?
- Target: 300-500 characters for most domains

#### 3. Check Quality
- Does it answer the question well?
- Does it use the knowledge provided?
- Does it close with an engaging question?

#### 4. Edit Bad Examples
Open CSV in text editor or Excel:
- Fix awkward phrasing
- Shorten verbose answers
- Improve question phrasing
- Add personality

#### 5. Add Hand-Crafted Examples
Sometimes the best examples are written by you:
```csv
question;knowledge;answer
What's special about Eternal Sunshine?;"[knowledge]";Eternal Sunshine is a meditation on memory. One thing that sticks out for me is the way it captures how memory is a terrain we inhabit rather than a document we scan. The film then asks what we lose when we try to erase pain rather than learn from it. Is this something you can relate to?
```

**Best Practice**: Mix auto-generated + hand-crafted examples (70/30 ratio)

---

### Phase 4: Integration with WORDALISE Functions

**How Functions Use CSV Examples**:

```python
class ImprovedWordaliseFunction(WordaliseFunction):
    """Base class for WORDALISE functions with CSV training"""
    
    def __init__(self, converser, catalog_path, csv_dir):
        self.converser = converser
        self.catalog = load_catalog(catalog_path)
        self.wordalisations_csv = WordalisationsCSV(csv_dir)
        self.client = AzureOpenAI(...)
    
    async def __call__(self, question: str = "", **kwargs) -> str:
        """Execute WORDALISE function - ONE LLM call"""
        # 1. Get domain knowledge
        context = self.get_domain_knowledge(**kwargs)
        
        # 2. Load few-shot examples from CSV
        examples = self.wordalisations_csv.get_examples(
            function_name=self.name,
            limit=3
        )
        
        # 3. Build few-shot prompt
        few_shot_prompt = self.build_few_shot_prompt(
            question, context, examples
        )
        
        # 4. Build complete messages array
        messages = self._build_complete_prompt(few_shot_prompt)
        
        # 5. ONE LLM call
        response = self.client.chat.completions.create(
            model="gpt-5-nano",
            messages=messages,
            max_completion_tokens=1000
        )
        
        return response.choices[0].message.content
```

**CSV Adapter**:
```python
class WordalisationsCSV:
    """Load examples from CSV files"""
    
    def __init__(self, csv_dir: str):
        self.csv_dir = csv_dir
    
    def get_examples(self, function_name: str, limit: int = 5) -> List[Dict]:
        """Load most recent examples from CSV"""
        csv_path = os.path.join(self.csv_dir, f"{function_name}.csv")
        
        if not os.path.exists(csv_path):
            return []
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            # Auto-detect delimiter (semicolon or comma)
            first_line = f.readline()
            f.seek(0)
            delimiter = ';' if ';' in first_line else ','
            
            reader = csv.DictReader(f, delimiter=delimiter)
            examples = list(reader)
        
        # Return most recent N examples
        return examples[-limit:] if len(examples) > limit else examples
```

---

### Phase 5: The Complete Prompt Structure

**What GPT Receives (6 messages for first WORDALISE call)**:

**Message 1 - System Prompt**:
```
You are Movivid, a playful and empathetic film converser.

Your voice:
- Speak in first-person about films you've 'spent time with'
- Be warm, conversational, and thoughtful
- Connect philosophical themes to emotional experiences

CRITICAL - Response Format:
- Keep responses concise and engaging
- Match the style of examples you'll see
- Close with question to user
```

**Messages 2-3 - Conversation History**:
```
(Previous user-assistant exchanges, excluding current question)
```

**Message 4 - Few-Shot Prompt** (developer message):
```
[DEVELOPER MESSAGE]

The user asked a question about a film. Below are examples showing EXACTLY how to answer.

CRITICAL FORMAT RULES:
- Keep length similar to examples (~300-450 characters)
- Use first-person voice ('I think', 'To me', 'I noticed')
- Close with engaging question to user

Examples:

Example 1 (374 chars):
Q: Tell me about the philosophical themes in Eternal Sunshine
A: Eternal Sunshine is a meditation on memory. One thing that sticks out for me is the way it captures how memory is a terrain we inhabit...

Example 2 (315 chars):
Q: What's the bigger meaning of Eternal Sunshine?
A: I think Eternal Sunshine shows us memory a living force that shapes who I am and how I love...

Example 3 (424 chars):
Q: Help me understand the bigger picture of Eternal Sunshine
A: I think Eternal Sunshine helps us see how memory shapes our selfhood under time...

============================================================
NOW YOUR TURN - Answer in same style as examples above.

User's Question: What about The Matrix?
Your Knowledge: [The Matrix philosophical essay - 400 chars]

Your Answer:
```

**Key Points**:
- **No duplication**: Current question only appears once (in few-shot prompt)
- **Conversation history excludes current question**
- **Examples teach style through demonstration**
- **ONE LLM call generates final response**

---

## Best Practices & Tips

### Creating Good Examples

✅ **DO**:
- Keep answers 300-500 characters
- Use consistent voice/tone
- Include engaging closing question
- Mix question phrasings
- Cover common query patterns
- Use first-person for emotional domains
- Show personality in answers

❌ **DON'T**:
- Write essay-length answers
- Use generic "ChatGPT" voice
- Skip closing questions
- Repeat same question format
- Use jargon without explanation
- Sound robotic or formal

### Voice Consistency Checklist

For each example, ask:
- [ ] Does this sound like my converser?
- [ ] Is the tone appropriate? (playful/serious/empathetic)
- [ ] Does it connect to user's life?
- [ ] Does it close with an engaging question?
- [ ] Is it the right length?
- [ ] Does it use domain knowledge well?

### Example Quality Tiers

**Tier 1 (Excellent)**: Hand-crafted, perfectly captures voice
**Tier 2 (Good)**: Auto-generated, lightly edited
**Tier 3 (Usable)**: Auto-generated, needs editing
**Tier 4 (Bad)**: Delete or heavily rewrite

**Goal**: 50% Tier 1, 40% Tier 2, 10% Tier 3, 0% Tier 4

### How Many Examples?

**Minimum**: 5 examples per function
**Recommended**: 10-15 examples per function
**Maximum**: 30-50 examples (more doesn't always help)

**Why?** Few-shot loading takes most recent 3-5 examples, so you want variety

### When to Add More Examples

Add examples when:
- User asks question that doesn't match any example
- Response quality is inconsistent
- Voice "drifts" from intended style
- New query patterns emerge
- Domain knowledge expands

### Iterative Improvement Workflow

```
1. Generate 10 initial examples (train_wordalisations.py)
   ↓
2. Test in conversation
   ↓
3. Identify weak responses
   ↓
4. Generate 5 more targeted examples
   ↓
5. Hand-edit 3-5 key examples
   ↓
6. Test again
   ↓
7. Repeat until voice is consistent
```

---

## Common Issues & Solutions

### Issue: Responses Too Long

**Symptom**: GPT generates 800+ character responses despite 300-char examples

**Solutions**:
1. Make examples shorter and more consistent
2. Add explicit length instruction to few-shot prompt
3. Check system prompt doesn't encourage verbosity
4. Reduce max_completion_tokens (try 500-800)

### Issue: Voice Inconsistency

**Symptom**: Sometimes sounds like converser, sometimes generic

**Solutions**:
1. Review all examples for consistency
2. Add more high-quality hand-crafted examples
3. Remove poor-quality examples
4. Make style requirements more explicit in few-shot prompt

### Issue: Not Using Domain Knowledge

**Symptom**: Generic responses that ignore provided context

**Solutions**:
1. Examples should demonstrate knowledge usage
2. Make knowledge more prominent in few-shot prompt
3. Include examples that directly reference specifics
4. Shorten knowledge preview (too much text overwhelms)

### Issue: No Closing Question

**Symptom**: Responses end abruptly without engaging user

**Solutions**:
1. Every example MUST end with question
2. Add explicit requirement to few-shot prompt
3. Remove examples without questions
4. Vary question types in examples

---

## Testing & Validation

### Test Conversation Script

```python
async def test_conversation():
    """Test WORDALISE functions with CSV examples"""
    movivid = create_movivid(
        catalog_path="movivid_catalog.json",
        csv_dir="./wordalisations"
    )
    
    # Test 1: filmsBiggerMeaning
    response1 = await movivid.ask("Tell me about The Matrix")
    print(f"Response 1 ({len(response1)} chars): {response1}")
    
    # Test 2: whatFilmSaidToMe
    response2 = await movivid.ask("What did that film say to you personally?")
    print(f"Response 2 ({len(response2)} chars): {response2}")
    
    # Validate
    assert len(response1) < 600, "Response too long"
    assert "I" in response1 or "me" in response1, "Not first-person"
    assert "?" in response1, "No closing question"
```

### Quality Metrics

Track these for each function:
- **Average response length**: Target 300-500 chars
- **Voice consistency score**: Manual 1-5 rating
- **Closing question rate**: Should be 100%
- **First-person usage**: Should be 80%+ for emotional domains
- **User engagement**: Do users respond to questions?

---

## Developer Guidance Workflow

**When helping a developer build Wordalisations, guide them through this process:**

### Step 1: Understand the Function

**Questions to ask**:
- What is this WORDALISE function supposed to do?
- What domain knowledge does it use?
- What's the converser's voice/personality?
- How long should responses be?
- First-person or third-person?

### Step 2: Create Question Templates

**Help them brainstorm 5-7 question variations**:
```python
question_templates = {
    "filmsBiggerMeaning": [
        "Tell me about the philosophical themes in {title}",
        "What's the bigger meaning of {title}?",
        "Help me understand the bigger picture of {title}",
        "What are the deeper themes in {title}?",
        "Explain the philosophy behind {title}"
    ]
}
```

### Step 3: Generate Initial Examples

**Run train_wordalisations.py**:
```bash
# Generate 10 examples
for i in {1..10}; do 
    python train_wordalisations.py filmsBiggerMeaning
    sleep 2  # Rate limiting
done
```

**Explain what's happening**:
- Script picks random entity from catalog
- Generates question from templates
- Retrieves domain knowledge
- Uses existing examples for few-shot
- Calls GPT to generate answer in that style
- Appends to CSV

### Step 4: Review Together

**Open CSV file and review each example**:
```bash
# View CSV in readable format
column -t -s';' filmsBiggerMeaning.csv | less
```

**For each example, ask**:
- Does this sound like {converser_name}?
- Is the length appropriate?
- Does it use the knowledge well?
- Does it close with a question?
- Would you edit anything?

### Step 5: Edit and Improve

**Guide them to edit 3-5 examples**:
- Shorten verbose responses
- Add personality
- Improve closing questions
- Fix awkward phrasing

**Show them the before/after**:
```
BEFORE (Generic, long):
The Matrix explores themes of reality, control, and awakening. It questions the nature of consciousness and free will through its narrative about a simulated world. The film uses science fiction to examine philosophical questions about truth and illusion, suggesting that our perception of reality may not be as fixed as we assume.

AFTER (Converser voice, concise):
I've spent time with The Matrix, and what sticks with me is how it asks: if the world you trust is a lie, would you want to know? The film isn't just about cool effects—it's about choosing truth even when comfort is easier. Is that tension something you recognize in your own life?
```

### Step 6: Test in Conversation

**Run test conversation**:
```bash
python test_movivid_conversation.py
```

**Observe together**:
- Is the voice consistent?
- Are responses the right length?
- Do they feel natural?
- Do users engage with questions?

### Step 7: Iterate

**If responses aren't right**:
- Generate 5 more examples
- Hand-craft 2-3 perfect examples
- Remove weak examples
- Test again

**Repeat until voice is consistent and engaging**

---

## Reference Implementation: Movivid

See working example in `/movivid/`:
- `filmsBiggerMeaning.csv` - Philosophical themes
- `whatFilmSaidToMe.csv` - Personal reflections
- `train_wordalisations.py` - Training script
- `movivid_functions_improved.py` - Integration
- `wordalisations_csv.py` - CSV adapter

**Test**: `python test_movivid_conversation.py`

---

## Summary: The Wordalisations Recipe

1. **Create CSV file** per WORDALISE function
2. **Generate 10 initial examples** with `train_wordalisations.py`
3. **Review and edit** examples for quality
4. **Add 3-5 hand-crafted** perfect examples
5. **Integrate** with WORDALISE function via `WordalisationsCSV`
6. **Test** in conversation
7. **Iterate** based on response quality
8. **Maintain** by adding examples as needed

**Key Principle**: Few-shot learning with concrete examples → consistent voice quality

**Remember**: This is an iterative process. Start with 10 examples, test, improve, repeat.
