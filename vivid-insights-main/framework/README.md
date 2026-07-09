# Converser Framework

Reusable components for building domain-specific conversational agents ("conversers").

## Components

### `converser.py`
Base `Converser` class that all conversers inherit from.

**Key features**:
- Context tracking (`current_entities`, `user_profile`, `conversation_history`)
- Four function types (CHANGE_CONTEXT, WORDALISE, INSTRUCTIONS, ENGAGE)
- Abstract base classes for each function type
- Azure OpenAI integration

**Usage**:
```python
from framework.converser import Converser, WordaliseFunction

class MyConverser(Converser):
    @property
    def instructions(self) -> str:
        return "You are MyConverser..."
    
    def _initialize_functions(self) -> List[ChatFunction]:
        return [...]
```

### `api_wrapper.py`
Base `APIWrapper` class for external API integrations.

**Key features**:
- Test connection method
- Error handling
- Rate limiting patterns
- Environment variable loading

**Usage**:
```python
from framework.api_wrapper import APIWrapper

class MyAPIWrapper(APIWrapper):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.example.com"
    
    def test_connection(self) -> bool:
        # Test API connectivity
        pass
```

### `wordalisations_csv.py`
CSV adapter for loading few-shot training examples.

**Key features**:
- Automatic delimiter detection (semicolon or comma)
- Multi-line field support
- Most recent N examples retrieval
- Usage reporting

**Usage**:
```python
from framework.wordalisations_csv import WordalisationsCSV

csv_adapter = WordalisationsCSV(csv_dir="./wordalisations")
examples = csv_adapter.get_examples("functionName", limit=3)
```

### `internet_to_text.py`
Templates for web research and knowledge enrichment.

**Two approaches**:

**1. PREPROCESSING (Static)** - Build database before converser runs
- Pattern: Research → Categorise → Summarise → Save
- Use when: Quality critical, curated domain, deep analysis needed
- Example: Movivid preprocessed films to create philosophical essays

**2. DYNAMIC (Runtime)** - Fetch during conversation
- Pattern: User query → Research → Categorise → Summarise → Respond
- Use when: Need real-time data, unpredictable queries
- Example: News converser fetching latest articles

**Three core patterns**:
```python
from framework.internet_to_text import (
    InternetResearch,      # Web search
    InternetCategorise,    # Extract structured data
    InternetSummarise      # Create conversational summaries
)

# Preprocessing workflow
researcher = InternetResearch()
raw = researcher.research_topic("The Matrix", focus="philosophy")

categoriser = InternetCategorise()
structured = categoriser.categorise_text(raw, ["themes", "emotions"])

summariser = InternetSummarise(converser_voice="first-person, warm")
essay = summariser.summarise_in_voice(raw, format_type="essay")
```

**See**: Complete examples and decision guide in `internet_to_text.py`

## Integration

To build a converser using this framework:

1. Create a converser class inheriting from `Converser`
2. Create API wrapper(s) inheriting from `APIWrapper`
3. Implement WORDALISE functions using `WordaliseFunction` base class
4. Create CSV training files for each WORDALISE function
5. Define routing logic in `instructions` property
6. Test and iterate

## See Also

- **Documentation**: `.github/instructions/building_conversers_*.instructions.md`
- **Example**: `examples/movivid/` - Complete working implementation
- **Guide**: Read the Wordalisations training guide for CSV creation workflow

## Requirements

- Python 3.11+
- Azure OpenAI API key
- Domain-specific API keys (as needed)

## License

See root LICENSE file
