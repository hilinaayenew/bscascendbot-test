# Vivid-AI Conversers

A framework for building domain-specific conversational agents ("conversers") with deep expertise, personality, and few-shot training.

## What are Conversers?

Conversers are specialized conversational agents designed for natural dialogue within specific domains. Unlike task-execution agents, conversers:
- Focus on **dialogue quality** over tool execution
- Have **deep domain expertise** in one subject area
- Maintain a **consistent persona** via system prompts
- Use **CSV-based few-shot training** for response consistency
- Provide **entertainment, education, or insight** through conversation

## Project Structure

This repository contains three main components:

### 1. **vivid-creator Agent** (`.github/instructions/`)

An agent mode that guides developers through building new conversers. Complete documentation includes:

- `building_conversers_overview.instructions.md` - 8-step development methodology
- `building_conversers_functions.instructions.md` - Function types and patterns
- `building_conversers_implementation.instructions.md` - Class structure and Azure OpenAI integration
- `building_conversers_system_prompt.instructions.md` - Writing effective routing logic
- `building_conversers_wordalisations.instructions.md` - CSV training workflow

**Invoke**: Use "vivid-creator" mode in your AI assistant

### 2. **Framework** (`framework/`)

Reusable components for building conversers:

- `converser.py` - Base `Converser` class with 4 function types
- `api_wrapper.py` - Base class for external API integrations
- `wordalisations_csv.py` - CSV adapter for few-shot training examples

**See**: [framework/README.md](framework/README.md)

### 3. **Movivid Example** (`examples/movivid/`)

Complete, standalone movie converser demonstrating the framework:

- Helps users find films that resonate with their life situations
- First-person voice ("I've spent time with this film...")
- 30 curated philosophical films with essays
- CSV-based training for consistent responses
- Hybrid catalog + API approach (OMDb + uNoGS)

**See**: [examples/movivid/README.md](examples/movivid/README.md)

## Quick Start

### For Developers: Build Your Own Converser

1. **Study the example**:
   ```bash
   cd examples/movivid
   python tests/test_conversation.py
   ```

2. **Read the methodology**:
   - Start: `.github/instructions/building_conversers_overview.instructions.md`
   - Deep dive: Other `building_conversers_*.instructions.md` files

3. **Use vivid-creator**:
   - Invoke "vivid-creator" agent mode
   - Follow 8-step guided process

4. **Copy Movivid as template**:
   - Use Movivid's structure for your domain
   - Replace film data with your domain knowledge
   - Adapt functions to your use case

### For Users: Try Movivid

```bash
# 1. Setup environment
cd examples/movivid
cp ../../.env.example .env
# Add your API keys to .env

# 2. Install dependencies
pip install openai python-dotenv requests

# 3. Run test conversation
python tests/test_conversation.py
```

## Core Concepts

### Research Mode

For teams that want to build bots in a research-first way, see [docs/RESEARCH_MODE_BOT_BUILDING.md](docs/RESEARCH_MODE_BOT_BUILDING.md).

This guide is focused on prototype creation, rapid iteration, and using Claude agents as design collaborators rather than deployment.

### Four Function Types

Every converser uses these function types:

1. **CHANGE_CONTEXT**: Updates converser state (current_entities, user_profile)
2. **WORDALISE**: Generates conversational responses using few-shot training
3. **INSTRUCTIONS**: Explains how the converser works
4. **ENGAGE**: Proactively prompts user interaction

### CSV-Based Few-Shot Training

WORDALISE functions use CSV files with exemplar responses:

```csv
question;knowledge;answer
Tell me about X;"[domain knowledge]";Here's my take on X...
```

**Benefits**:
- Consistent converser voice across responses
- Teach by example, not just instructions
- Easy to review and edit training examples
- Generate new examples with GPT assistance

### Context Tracking

Three components maintained throughout conversation:

1. **current_entities**: What we're discussing (e.g., current films)
2. **user_profile**: User's situation, preferences, context
3. **conversation_history**: Full dialogue (inherited from base class)

### 8-Step Methodology

1. System Prompt Setup - Define persona and goals
2. Data API Discovery - Test APIs, build wrappers
3. InternetToText Functions - Fill knowledge gaps (optional)
4. Function Breakdown - Design 6-12 functions
5. Wordalisations Training - Create CSV examples (ESSENTIAL)
6. Implementation - Build converser class
7. Routing Logic - Write IF-THEN rules
8. Testing & Refinement - Validate and iterate

**Note**: Steps 4-8 often iterate, but function design comes first

## Documentation

- **Quick Reference**: `framework/README.md` - Framework components
- **Complete Example**: `examples/movivid/README.md` - Working implementation
- **Methodology**: `.github/instructions/building_conversers_overview.instructions.md`
- **Training Guide**: `.github/instructions/building_conversers_wordalisations.instructions.md`
- **Case Study**: `.github/instructions/movivid.instructions.md` - Movivid development story

Additional docs in `docs/`:
- `STEP2_DATA_API_DISCOVERY.md` - API exploration guide
- `UNOGS_ACTIVATION.md` - Netflix API setup
- `WORDALISE_ARCHITECTURE.md` - Technical deep dive

## Requirements

- Python 3.11+
- Azure OpenAI API key
- Domain-specific API keys (varies by converser)

## Environment Setup

```bash
# Copy example and add your keys
cp .env.example .env

# Required for framework:
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here

# Required for Movivid:
OMDB_API_KEY=your_key_here
UNOGS_API_KEY=your_key_here
```

## Philosophy

Conversers are designed for **quality dialogue** in specific domains. They:
- Speak with personality and expertise
- Use few-shot training to maintain voice
- Track context for coherent multi-turn conversations
- Provide insight and engagement, not just information

Think: Domain expert + consistent persona + conversational flow

## License

MIT License - See LICENSE file

## Contributing

1. Build a converser in your domain using the framework
2. Document your process and learnings
3. Share challenges and improvements to methodology
4. Help refine the 8-step process

This framework is evolving - we learn by building!

---

**Get Started**: Read [framework/README.md](framework/README.md) and explore [examples/movivid/](examples/movivid/)

**Build Something**: Invoke "vivid-creator" agent mode and create your domain's converser
