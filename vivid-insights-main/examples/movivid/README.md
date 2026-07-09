# Movivid - Movie Converser Example

A complete, standalone example of a converser built with the vivid-AI framework. Movivid helps users find films that speak to their life situations through philosophical and emotional analysis.

**🎯 Self-Contained**: This folder contains everything you need to run, test, and improve Movivid. No external framework or vivid-creator agent required. All training, data, and scripts are included.

## What is Movivid?

Movivid is a conversational agent that:
- Asks about your life situation first (breakups, transitions, identity questions)
- Recommends films based on emotional and philosophical themes
- Provides first-person reflections on films
- Engages in thoughtful dialogue about movies and meaning

**Philosophy**: "I've spent time with these films..." - Movivid speaks as someone who has personal relationships with movies.

## Quick Start

### 1. Setup Environment

```bash
# Copy .env.example from root and add your API keys
cp ../../.env .env

# Required API keys:
# - AZURE_OPENAI_API_KEY
# - AZURE_OPENAI_ENDPOINT  
# - OMDB_API_KEY (get from http://www.omdbapi.com/)
# - UNOGS_API_KEY (get from RapidAPI - uNoGS Netflix API)
```

### 2. Install Dependencies

```bash
pip install openai python-dotenv requests
```

### 3. Run Test Conversation

```bash
python tests/test_conversation.py
```

## Project Structure

```
movivid/
├── README.md                          # This file
├── movivid.py                         # Main converser class
├── movivid_functions.py               # Basic functions (CHANGE_CONTEXT, INSTRUCTIONS, ENGAGE)
├── movivid_functions_improved.py      # WORDALISE functions with CSV training
├── omdb_wrapper.py                    # OMDb API wrapper (IMDb data)
├── unogs_wrapper.py                   # uNoGS API wrapper (Netflix catalog)
│
├── wordalisations/                    # CSV training examples
│   ├── filmsBiggerMeaning.csv        # Philosophical themes function training
│   └── whatFilmSaidToMe.csv          # Personal reflections function training
│
├── data/                              # Domain knowledge
│   └── movivid_catalog_analyzed.json # 30 films with essays and metadata
│
├── scripts/                           # Utilities
│   ├── train_wordalisations.py       # Generate training examples
│   ├── film_theme_analyzer.py        # Preprocess film essays
│   └── build_catalog.py              # Build film catalog
│
└── tests/
    └── test_conversation.py          # Test conversation script
```

## Key Features

### 1. CSV-Based Few-Shot Training

WORDALISE functions use CSV files with question-knowledge-answer triples:

```csv
question;knowledge;answer
Tell me about Eternal Sunshine;"[essay]";Eternal Sunshine is a meditation on memory. One thing that sticks out for me is...
```

Load examples dynamically:
```python
examples = csv_adapter.get_examples("filmsBiggerMeaning", limit=3)
```

### 2. Hybrid Catalog Approach

- **Curated**: 30 philosophical films with complete essays
- **API-enriched**: OMDb (ratings) + uNoGS (Netflix availability)
- **Extensible**: Can discover films beyond catalog

### 3. Context Tracking

```python
converser.current_entities = ["Eternal Sunshine of the Spotless Mind"]
converser.user_profile = {
    "situation": "processing a breakup",
    "preferences": ["philosophical themes", "emotional depth"]
}
```

### 4. Five Functions

**CHANGE_CONTEXT**:
- `changeFilm` - Updates current film being discussed

**WORDALISE** (conversational responses):
- `filmsBiggerMeaning` - Explains philosophical themes
- `whatFilmSaidToMe` - Shares personal reflections

**INSTRUCTIONS**:
- `howMovividWorks` - Explains how to use Movivid

**ENGAGE**:
- `tellMeAboutYou` - Context-aware engagement prompts

## Training New Examples

**Movivid is self-contained**: You can add and improve training examples without any external tools or frameworks. Everything you need is in this folder.

### Quick Start

**Option 1: Manual editing** (no tools needed):
```bash
# Edit CSV files directly
nano wordalisations/filmsBiggerMeaning.csv

# Format: question;knowledge;answer
# Add your example at the end, save, test
```

**Option 2: Generate with script**:
```bash
cd scripts
python train_wordalisations.py filmsBiggerMeaning
```

**Option 3: Mixed approach** (recommended):
1. Generate 5-10 examples with script
2. Review and edit in text editor
3. Add 2-3 hand-crafted perfect examples
4. Test in conversation
5. Iterate

### How It Works

The training script:
1. Picks a random film from catalog
2. Generates question from templates
3. Retrieves film essay
4. Uses existing CSV examples for few-shot learning
5. Calls GPT to generate answer in Movivid's voice
6. Appends to CSV file

**See [TRAINING_EXAMPLES.md](TRAINING_EXAMPLES.md) for complete guide** including:
- Manual editing workflow
- Voice guidelines (first-person, 300-450 chars)
- CSV format details
- Testing procedures
- Common issues and fixes

**Goal**: 10-15 high-quality examples per function. Quality over quantity!

## Film Catalog

30 curated philosophical films with complete analysis:

**Themes covered**:
- Memory & identity (Eternal Sunshine, Memento)
- Reality & perception (The Matrix, Inception)
- Consciousness (Her, Ex Machina)
- Emotion & growth (Inside Out, Moonlight)
- And more...

**Each film includes**:
- `philosophical_context` - 4000+ char essay on themes
- `personal_reflection` - 4000+ char first-person reflection
- Metadata: year, director, ratings, themes, life situations, emotions

## API Integration

### OMDb API
Get film ratings and details:
```python
from omdb_wrapper import create_omdb_wrapper
omdb = create_omdb_wrapper()
film = omdb.get_film_by_title("The Matrix")
```

### uNoGS API
Search Netflix catalog:
```python
from unogs_wrapper import create_unogs_wrapper
unogs = create_unogs_wrapper()
results = unogs.search_films_by_title("Eternal Sunshine")
```

## Testing

```bash
# Run conversation test
python tests/test_conversation.py

# Check output in: ../../.temp/test_transcripts/
```

**Test conversation includes**:
1. "Hi! What is this?" → Explains Movivid
2. "Tell me about The Matrix" → Philosophical analysis
3. "What did that film say to you personally?" → Personal reflection
4. "What about Eternal Sunshine?" → Switches films

## Customization

### Add Your Own Films

1. Add entry to `data/movivid_catalog_analyzed.json`
2. Include essays: `philosophical_context` and `personal_reflection`
3. Add metadata: themes, life_situations, emotions

### Create New WORDALISE Functions

1. Add function class in `movivid_functions_improved.py`
2. Create CSV file: `wordalisations/{functionName}.csv`
3. Generate training examples: `scripts/train_wordalisations.py`
4. Add to `_initialize_functions()` in `movivid.py`
5. Update routing in `instructions` property

### Modify Voice/Style

Edit CSV examples to change Movivid's personality:
- Make more serious → Remove playful language
- Make more technical → Add film theory terminology
- Make shorter → Reduce example character counts

## Architecture

**One LLM call per WORDALISE function**:

```
User Question
     ↓
WORDALISE Function
     ↓
1. Get domain knowledge (film essays)
2. Load 3 CSV examples
3. Build few-shot prompt
4. Build messages array:
   - System prompt (Movivid identity)
   - Conversation history (last 4-6 messages)
   - Few-shot prompt (examples + question)
5. ONE OpenAI call → Response
     ↓
Return to user
```

**No second call to "wrap" responses** - WORDALISE returns final answer directly.

## Troubleshooting

### "No examples found"
- Check CSV files exist in `wordalisations/`
- Run `train_wordalisations.py` to generate examples

### "Film not found"
- Check film title spelling
- Film might not be in catalog
- Try searching by year: "The Matrix 1999"

### "API key error"
- Verify `.env` file has correct keys
- Test connection: `omdb.test_connection()`

### Responses too long/short
- Edit CSV examples to desired length
- Examples teach GPT the target format

## See Also

- **Framework**: `../../framework/` - Reusable base classes
- **Documentation**: `../../.github/instructions/` - Complete guides
- **vivid-creator**: Agent mode for building conversers

## License

See root LICENSE file
