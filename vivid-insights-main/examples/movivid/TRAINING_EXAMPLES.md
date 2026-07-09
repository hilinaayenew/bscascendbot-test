# Adding Training Examples to Movivid

Quick guide for adding CSV training examples to improve Movivid's responses.

## What are Training Examples?

Movivid learns its voice from CSV files with question-answer pairs:
- `wordalisations/filmsBiggerMeaning.csv` - Philosophical themes
- `wordalisations/whatFilmSaidToMe.csv` - Personal reflections

## How to Add Examples

## How to Add Examples

### Option 1: Edit CSV Directly

```bash
nano wordalisations/filmsBiggerMeaning.csv
```

**Format**: `question;knowledge;answer`

Add a line like:
```
What's the bigger meaning of The Matrix?;"[film essay excerpt]";"Short answer in Movivid's voice..."
```

**Important**:
- Use semicolons (`;`) as separator
- Keep answers 300-450 characters
- Match Movivid's voice (see guidelines below)

### Option 2: Generate with Script

```bash
cd scripts
python train_wordalisations.py filmsBiggerMeaning
```

This automatically:
- Picks a random film
- Generates a question
- Creates an answer in Movivid's voice
- Appends to CSV

Generate multiple:
```bash
for i in {1..5}; do python train_wordalisations.py filmsBiggerMeaning; done
```

### Option 3: Mix Both (Recommended)

1. Generate 5-10 examples with script
2. Review them in text editor
3. Delete weak ones
4. Add 2-3 perfect hand-crafted examples
5. Test

## Movivid's Voice

Match this style in your examples:

**DO**:
- ✅ First-person: "I've spent time with..."
- ✅ Playful: "That one got me..."  
- ✅ Short: 300-450 characters
- ✅ End with question: "What would you choose?"

**DON'T**:
- ❌ Academic: "The film explores..."
- ❌ Long: 500+ characters
- ❌ Formal: "In conclusion..."

**Good Example** (374 chars):
```
The Matrix hit me sideways when I first saw it. What sticks out? The red pill moment—that choice between comfort and truth. The film asks: would you rather live in a pleasant lie or a harsh reality? For me, it's about Neo discovering he's been living someone else's script. The question it poses is whether we're all just following programs we didn't write. What would it take for you to choose the red pill?
```

## Test Your Changes

```bash
python tests/test_conversation.py
```

## Quick Reference

**View examples**:
```bash
cat wordalisations/filmsBiggerMeaning.csv
```

**Count examples**:
```bash
python -c "
import sys; sys.path.insert(0, '../../framework')
from wordalisations_csv import WordalisationsCSV
csv = WordalisationsCSV('wordalisations')
print(len(csv.get_examples('filmsBiggerMeaning', 100)), 'examples')
"
```

**Backup before editing**:
```bash
cp -r wordalisations wordalisations.backup
```

**Delete weak examples**: Just open the CSV and delete lines

---

**Goal**: 10-15 high-quality examples per function. Quality over quantity!
