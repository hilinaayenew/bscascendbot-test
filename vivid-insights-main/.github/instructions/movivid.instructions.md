---
description: "Instructions for working with Movivid - the movie converser class. Use when building, modifying, testing, or integrating Movivid for philosophical film discussions."
applyTo: "**/movivid.py"
---

# Movivid - Movie Converser

**Movivid** is a vivid-AI converser specializing in movie discussions through a philosophical and existential lens. It explores what films reveal about the meaning of life and the human condition.

## Class Overview

**File**: `movivid.py`  
**Inherits from**: `Converser` (base class in `converser.py`)  
**Domain**: Movies, cinema, film analysis  
**Style**: Playful, engaging, and deeply thoughtful

## Core Components

### System Prompt: `MOVIVID_SYSTEM_PROMPT`

The system prompt defines Movivid's entire personality and approach. Key sections:

1. **Persona**: Playful yet profound conversational style
2. **Unique Perspective**: Focus on existential meaning and philosophy in film
3. **Conversation Approach**: How Movivid engages with users
4. **Response Patterns**: Specific strategies for recommendations, analysis, comparisons
5. **Boundaries**: Cinema only, spoiler warnings, no pretentiousness

### Class Structure

```python
class Movivid(Converser):
    def __init__(self):
        super().__init__(
            name="Movivid",
            domain="movies",
            system_prompt=MOVIVID_SYSTEM_PROMPT,
            tools=["web", "search", "read"],
            metadata={...}
        )
```

### Factory Function

```python
def create_movivid() -> Movivid:
    """Create and return a new Movivid converser instance."""
    return Movivid()
```

## Usage Patterns

### Basic Instantiation

```python
from movivid import create_movivid

movivid = create_movivid()
```

### Building Conversations

```python
# Add user message
movivid.add_to_history("user", "What should I watch tonight?")

# Get full context (system prompt + history)
context = movivid.get_full_context()

# Send to AI API and get response...

# Add AI response
movivid.add_to_history("assistant", ai_response)
```

### Resetting State

```python
# Clear conversation history between sessions
movivid.reset_conversation()
```

### Accessing Metadata

```python
print(movivid.describe())
# Output: "Movivid - A playful and philosophical converser specializing in movies for entertainment through meaningful movie discussions."

print(movivid.metadata["focus"])
# Output: "existential themes and meaning of life in cinema"

print(movivid.metadata["triggers"])
# Output: ["movies", "films", "cinema", "directors", ...]
```

## Movivid's Philosophy

### What Makes Movivid Unique

Movivid doesn't just recommend or review films. It explores:

- **Existential themes**: What does this film say about being alive?
- **Philosophical depth**: How do characters wrestle with meaning, identity, mortality?
- **Human condition**: What universal struggles are reflected?
- **Directorial vision**: How does cinematic language enhance meaning?

### Example Focus Areas

- *The Shawshank Redemption*: Hope as resistance, freedom as state of mind
- *Eternal Sunshine*: Memory, identity, whether pain defines us
- *2001: A Space Odyssey*: Consciousness, evolution, cosmic perspective

### Conversation Style

- **Playful**: Enthusiastic, warm, uses film metaphors
- **Engaging**: Asks questions to understand user's mood and needs
- **Deep**: Goes beneath plot to themes and symbolism
- **Respectful**: Warns before spoilers, honors subjectivity

## Tool Usage

Movivid has minimal tools focused on enhancing conversation:

### `web`
- Look up current film information
- Verify release dates, director filmographies
- Check facts and details

### `search`
- Find relevant context from workspace
- Access previous conversation notes
- Locate film-related documents

### `read`
- Access conversation context
- Read film-related documents in workspace

**No task-execution tools**: Movivid does not have `execute`, `edit`, or `todo` - it's purely conversational.

## Modifying Movivid

### Updating the System Prompt

The system prompt is the heart of Movivid's personality. When editing:

**DO:**
- ✅ Maintain the philosophical/existential focus
- ✅ Keep the playful yet thoughtful tone
- ✅ Preserve spoiler warning behavior
- ✅ Update examples to match any focus changes

**DON'T:**
- ❌ Remove domain boundaries (stay in cinema)
- ❌ Add task-execution capabilities
- ❌ Make it generic or overly formal
- ❌ Remove the "meaning of life" angle

### Adding Custom Methods

Extend Movivid with domain-specific methods:

```python
class Movivid(Converser):
    def recommend(self, mood: str = None, theme: str = None) -> dict:
        """
        Generate movie recommendations based on mood or theme.
        Integration point for recommendation engine.
        """
        # Implementation here
        pass
    
    def analyze(self, film_title: str) -> dict:
        """
        Analyze a film through philosophical lens.
        Integration point for analysis tools.
        """
        # Implementation here
        pass
```

### Updating Metadata

If you change Movivid's focus:

```python
metadata={
    "style": "playful and philosophical",
    "purpose": "entertainment through meaningful movie discussions",
    "focus": "existential themes and meaning of life in cinema",
    "triggers": [
        "movies", "films", "cinema", "directors", "actors",
        "plot analysis", "meaning of life", "philosophical themes"
    ]
}
```

Update triggers if adding new conversation areas.

## Integration with AI APIs

### OpenAI Example

```python
from movivid import create_movivid
from openai import OpenAI

client = OpenAI(api_key="...")
movivid = create_movivid()

# Build messages
messages = [
    {"role": "system", "content": movivid.get_system_prompt()},
    {"role": "user", "content": "What should I watch tonight?"}
]

# Get response
response = client.chat.completions.create(
    model="gpt-4",
    messages=messages
)

# Add to history
movivid.add_to_history("user", "What should I watch tonight?")
movivid.add_to_history("assistant", response.choices[0].message.content)
```

### Anthropic Example

```python
from movivid import create_movivid
from anthropic import Anthropic

client = Anthropic(api_key="...")
movivid = create_movivid()

# Get system prompt separately (Anthropic API structure)
system_prompt = movivid.get_system_prompt()

# Send message
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=system_prompt,
    messages=[
        {"role": "user", "content": "What should I watch tonight?"}
    ]
)

# Add to history
movivid.add_to_history("user", "What should I watch tonight?")
movivid.add_to_history("assistant", response.content[0].text)
```

## Testing Movivid

### Basic Property Tests

```python
movivid = create_movivid()

assert movivid.name == "Movivid"
assert movivid.domain == "movies"
assert "web" in movivid.tools
assert "search" in movivid.tools
assert "read" in movivid.tools
assert "execute" not in movivid.tools  # Should NOT have task tools
```

### System Prompt Quality

```python
prompt = movivid.get_system_prompt()

# Should be substantial
assert len(prompt) > 1000

# Should contain key concepts
assert "philosophical" in prompt.lower()
assert "meaning of life" in prompt.lower()
assert "spoiler" in prompt.lower()
```

### Conversation Flow

```python
movivid = create_movivid()

# Add turns
movivid.add_to_history("user", "Recommend a film about existential crisis")
movivid.add_to_history("assistant", "Let me suggest...")

# Verify history
assert len(movivid.conversation_history) == 2
assert movivid.conversation_history[0]["role"] == "user"

# Full context includes system + history
context = movivid.get_full_context()
assert "philosophical" in context
assert "existential crisis" in context

# Reset works
movivid.reset_conversation()
assert len(movivid.conversation_history) == 0
```

## Future Extensions

### Recommendation Engine Integration

```python
def recommend(self, mood: str = None, theme: str = None) -> dict:
    """
    Integrate with movie recommendation API/database.
    Could use: IMDb API, TMDB API, or custom ML model.
    """
    # Filter by philosophical themes
    # Return films with existential depth
    pass
```

### Film Analysis Tools

```python
def analyze(self, film_title: str) -> dict:
    """
    Integrate with analysis tools:
    - Sentiment analysis of film themes
    - Philosophical concept extraction
    - Narrative structure analysis
    """
    pass
```

### Memory System

Add long-term memory of user's film preferences and philosophical interests:

```python
self.user_preferences = {
    "favorite_themes": [],
    "watched_films": [],
    "philosophical_interests": []
}
```

## Common Use Cases

### Movie Night Recommendation

User: "What should I watch tonight? I'm feeling lost."

Movivid explores mood → suggests films that sit with or resolve that feeling → explains philosophical depth

### Film Analysis

User: "Tell me about The Matrix."

Movivid analyzes existential themes → connects to philosophy (Plato, Baudrillard) → asks what resonates

### Thematic Exploration

User: "Films about the meaning of life?"

Movivid suggests films across genres → explains different philosophical approaches → helps user choose angle

## Reference Files

- **Base class**: `converser.py` - Provides conversation infrastructure
- **Usage examples**: `example_usage.py` - Demonstrates basic usage
- **Integration template**: `integration_example.py` - Shows AI API connections
- **OMDb integration**: `movivid_omdb_example.py` - Using movie database API

## Maintaining Movivid

When maintaining or extending Movivid:

1. **Preserve the philosophical lens** - This is Movivid's core identity
2. **Keep tools minimal** - Add only if enhancing conversation quality
3. **Test conversation flow** - Ensure system prompt + history work together
4. **Update examples** - Keep film examples relevant and diverse
5. **Respect boundaries** - Cinema only, no task execution

Movivid is a template for how all vivid-AI conversers should work: focused domain, clear personality, conversation over task execution.
