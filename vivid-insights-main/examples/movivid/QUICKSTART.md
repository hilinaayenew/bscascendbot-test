# Movivid Quick Reference

Self-contained operations - no external framework needed.

## Setup

```bash
# 1. Add API keys to .env
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
OMDB_API_KEY=your_key
UNOGS_API_KEY=your_key

# 2. Install dependencies
pip install openai python-dotenv requests

# 3. Test
python tests/test_conversation.py
```

## Add Training Examples

### Manual (No tools needed)
```bash
nano wordalisations/filmsBiggerMeaning.csv
# Add: question;knowledge;answer
```

### Generated
```bash
cd scripts
python train_wordalisations.py filmsBiggerMeaning
```

See: [TRAINING_EXAMPLES.md](TRAINING_EXAMPLES.md)

## Test

```bash
python tests/test_conversation.py
```

## Add Films

Edit: `data/movivid_catalog_analyzed.json`

```json
{
  "Film Title": {
    "year": 1999,
    "movivid": {
      "themes": ["theme1", "theme2"],
      "life_situations": ["situation1"],
      "emotions": ["emotion1"],
      "personal_reflection": "4000+ char essay...",
      "philosophical_context": "4000+ char essay..."
    }
  }
}
```

## File Structure

```
movivid/
├── TRAINING_EXAMPLES.md       # Complete training guide
├── README.md                   # Full documentation
├── QUICKSTART.md               # This file
│
├── movivid.py                  # Main class
├── movivid_functions*.py       # Functions
├── *_wrapper.py                # API wrappers
│
├── wordalisations/             # Training CSVs
├── data/                       # Film catalog
├── scripts/                    # Utilities
└── tests/                      # Test script
```

## Common Tasks

### View training examples
```bash
cat wordalisations/filmsBiggerMeaning.csv
```

### Generate 5 examples
```bash
cd scripts
for i in {1..5}; do python train_wordalisations.py filmsBiggerMeaning; done
```

### Check CSV loaded
```bash
python -c "
from wordalisations_csv import WordalisationsCSV
csv = WordalisationsCSV('wordalisations')
print(f'{len(csv.get_examples(\"filmsBiggerMeaning\"))} examples')
"
```

### Backup before changes
```bash
cp -r wordalisations wordalisations.backup
```

## Voice Guidelines

- ✅ First-person: "I've spent time with..."
- ✅ Playful & empathetic
- ✅ 300-450 character answers
- ✅ End with question
- ❌ Academic or formal tone
- ❌ Long-winded (>500 chars)

## No External Dependencies

Everything needed is in this folder. Work independently!
