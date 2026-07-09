---
description: "Implementation guide for conversers - class structure, function implementation, Azure OpenAI integration, and context management patterns."
applyTo: ""
---

# Building Conversers: Implementation Guide

This guide covers the technical implementation of converser classes, functions, Azure OpenAI integration, and context management.

**Source**: Pattern extracted from Scout analyst and base classes (see `DesignHelp/scout/analyst.py` and `CONCEPTS.md`)

---

## Converser Class Structure

### Base Pattern

```python
from converser import Converser
from typing import List, Tuple, Optional

class DomainConverser(Converser):
    """
    Converser for [domain] analysis and discussion.
    
    Provides 8 specialized functions for exploring [domain entities]
    through structured conversation and function calling.
    """
    
    # Class attributes
    name = "[DomainName]"
    description = "A converser for [domain purpose]"
    context_type = DomainContext
    
    def __init__(self, context: DomainContext, user: User, api_client: APIClient):
        """
        Initialize the converser with context and dependencies.
        
        Args:
            context: Domain-specific context object
            user: User making requests
            api_client: Client for data access
        """
        super().__init__(
            name=self.name,
            domain="[domain]",
            system_prompt=self.instructions,
            tools=self.function_schemas,
            metadata=self.metadata
        )
        
        self.context = context
        self.user = user
        self.api_client = api_client
    
    @property
    def instructions(self) -> str:
        """Build the system prompt with conditional logic."""
        # See System Prompt Guide
        
    @property
    def functions(self) -> List[Function]:
        """Return all 8 function instances."""
        return [
            ShortDescription(self.context, self.api_client),
            DetailedAnalysis(self.context, self.api_client),
            AttributeEvaluation(self.context, self.api_client),
            Comparison(self.context, self.api_client),
            ContextualInformation(self.context, self.api_client),
            MetricLookup(self.context, self.api_client),
            Discovery(self.context, self.api_client),
            DomainKnowledge(self.context, self.api_client),
        ]
    
    @property
    def function_schemas(self) -> List[Dict]:
        """Convert functions to OpenAI schema format."""
        return [func.construct_schema() for func in self.functions]
    
    @property
    def initial_function_calls(self) -> List[Tuple[Function, dict]]:
        """
        Optional: Functions to call automatically when converser starts.
        
        Returns list of (function, parameters) tuples.
        """
        # Example: Auto-call short description on start
        return [
            (self.functions[0], {})  # ShortDescription, no params
        ]
    
    @property
    def metadata(self) -> dict:
        """Metadata about this converser."""
        return {
            "domain": "[domain]",
            "style": "[conversational style]",
            "purpose": "[primary purpose]",
            "version": "1.0"
        }
```

---

## Context Class

### Purpose

The context object holds:
- Current entity being discussed
- User's original query
- Conversation summary
- Selected attribute (if any)
- Any domain-specific state

### Pattern

```python
from pydantic import BaseModel
from typing import Optional

class DomainContext(BaseModel):
    """
    Context for domain conversations.
    
    Tracks the current state of the conversation including
    what entity is being discussed and what's been covered.
    """
    
    # Core context
    entity: Entity                    # The subject of discussion
    query: str                        # User's original query
    summary: str = ""                 # Conversation summary
    
    # Optional specifics
    attribute: Optional[Attribute] = None
    comparison_entity: Optional[Entity] = None
    
    # Domain-specific fields
    # Add whatever your domain needs

class Entity(BaseModel):
    """Represents a domain entity (movie, book, etc.)."""
    id: str
    name: str
    # Other entity fields

class Attribute(BaseModel):
    """Represents an attribute/quality that can be evaluated."""
    name: str
    display_name: str
    # Attribute-specific fields
```

---

## Function Implementation

### Base Function Class

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from enum import Enum

class Destination(Enum):
    TO_USER = "to_user"
    TO_ASSISTANT = "to_assistant"

class Function(ABC):
    """Base class for all converser functions."""
    
    def __init__(self, context: DomainContext, api_client: APIClient):
        self.context = context
        self.api_client = api_client
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Function name for OpenAI function calling."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """
        Description that tells OpenAI when to call this function.
        This is critical - be very specific.
        """
        pass
    
    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """
        JSON Schema for function parameters.
        
        Return empty dict if no parameters needed.
        """
        pass
    
    @property
    @abstractmethod
    def destination(self) -> Destination:
        """Whether this goes TO_USER or TO_ASSISTANT."""
        pass
    
    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """
        Execute the function with provided parameters.
        
        Returns:
            For TO_USER: Tuple of (tool_message, stream, final_message)
            For TO_ASSISTANT: String or dict of data
        """
        pass
    
    def construct_schema(self) -> Dict[str, Any]:
        """Convert function to OpenAI schema format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": self.parameters,
                    "required": list(self.parameters.keys()),
                    "additionalProperties": False
                }
            }
        }
```

### TO_USER Function Pattern (Description)

Functions that generate natural language via internal GPT call:

```python
class ShortDescription(Function):
    """Provides 1-2 sentence summary of entity."""
    
    @property
    def name(self) -> str:
        return "short_description"
    
    @property
    def description(self) -> str:
        return (
            "Gives a short summary of the entity. "
            "Call this when user mentions entity name or asks 'what is X'."
        )
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {}  # No parameters - uses context
    
    @property
    def destination(self) -> Destination:
        return Destination.TO_USER
    
    async def execute(self, **kwargs):
        """
        Execute the short description function.
        
        Returns tuple: (tool_message, generator, final_message)
        """
        # 1. Fetch entity data
        entity_data = await self.api_client.get_entity(
            self.context.entity.id
        )
        
        # 2. Build synthesis prompt
        synthesis_prompt = self._build_synthesis_prompt(entity_data)
        
        # 3. Call Azure OpenAI to generate description
        stream = await self._synthesize_text(synthesis_prompt)
        
        # 4. Return as tool message + stream
        tool_message = {
            "role": "tool",
            "content": f"Generating short description for {entity_data.name}"
        }
        
        return (tool_message, stream, None)
    
    def _build_synthesis_prompt(self, entity_data) -> str:
        """
        Build the prompt for synthesis.
        
        This is where you instruct GPT on what kind of description to write.
        """
        return (
            f"Your job is to provide a 1-2 sentence description of "
            f"{entity_data.name}. "
            f"\n\nHere is the data: {entity_data.to_dict()}"
            f"\n\nProvide a concise, engaging summary. "
            f"Use present tense. Be specific but brief."
        )
    
    async def _synthesize_text(self, prompt: str):
        """
        Call Azure OpenAI to synthesize natural language.
        
        Returns async generator that yields text chunks.
        """
        # Integration with Azure OpenAI
        # See Azure OpenAI section below
        pass
```

### TO_ASSISTANT Function Pattern

Functions that return raw data for main GPT to interpret:

```python
class MetricLookup(Function):
    """Returns specific metric value."""
    
    @property
    def name(self) -> str:
        return "metric_lookup"
    
    @property
    def description(self) -> str:
        return (
            "Returns the value of a specific metric. "
            "Call when user asks 'what is the [metric]' or 'how many [metric]'."
        )
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "metric_name": {
                "type": "string",
                "description": "Name of the metric to look up",
                "enum": ["rating", "count", "score", "rank"]  # Domain-specific
            }
        }
    
    @property
    def destination(self) -> Destination:
        return Destination.TO_ASSISTANT
    
    async def execute(self, metric_name: str, **kwargs) -> str:
        """
        Look up metric value and return as simple string.
        
        OpenAI will wrap this in natural language.
        """
        # Fetch metric
        value = await self.api_client.get_metric(
            entity_id=self.context.entity.id,
            metric=metric_name
        )
        
        # Return simple formatted string
        return f"The {metric_name} for {self.context.entity.name} is {value}"
```

---

## Azure OpenAI Integration

### Client Setup

```python
from openai import AzureOpenAI
import os

class AzureOpenAIClient:
    """Client for Azure OpenAI API."""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_KEY"),
            api_version="2024-02-15-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")  # e.g., "gpt-4"
    
    async def generate_response(
        self,
        messages: List[Dict],
        functions: List[Dict],
        temperature: float = 0.2,
        stream: bool = True
    ):
        """
        Generate response with function calling.
        
        Args:
            messages: Conversation history
            functions: Function schemas
            temperature: Creativity (0-2)
            stream: Whether to stream response
        """
        response = self.client.chat.completions.create(
            model=self.deployment,
            messages=messages,
            tools=functions,
            tool_choice="auto",
            temperature=temperature,
            stream=stream
        )
        
        if stream:
            return self._handle_stream(response)
        else:
            return response
    
    async def _handle_stream(self, response):
        """Handle streaming response."""
        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
            
            if chunk.choices[0].delta.tool_calls:
                yield chunk.choices[0].delta.tool_calls
```

### Message Flow

```python
class ConverserSession:
    """Manages a converser conversation session."""
    
    def __init__(self, converser: Converser, openai_client: AzureOpenAIClient):
        self.converser = converser
        self.openai = openai_client
        self.messages = []
    
    async def initialize(self):
        """Initialize conversation with system message."""
        # 1. Add system message
        self.messages.append({
            "role": "system",
            "content": self.converser.instructions
        })
        
        # 2. Execute initial function calls (if any)
        if self.converser.initial_function_calls:
            for func, params in self.converser.initial_function_calls:
                await self._execute_function(func, params)
    
    async def send_user_message(self, content: str):
        """Send user message and get response."""
        # 1. Add user message
        self.messages.append({
            "role": "user",
            "content": content
        })
        
        # 2. Generate response from Azure OpenAI
        response_stream = await self.openai.generate_response(
            messages=self.messages,
            functions=self.converser.function_schemas
        )
        
        # 3. Handle response (might include function calls)
        async for chunk in response_stream:
            if isinstance(chunk, str):
                # Text response - yield to user
                yield chunk
            elif hasattr(chunk, 'tool_calls'):
                # Function call - execute it
                for tool_call in chunk.tool_calls:
                    await self._execute_function_call(tool_call)
    
    async def _execute_function_call(self, tool_call):
        """Execute a function call from OpenAI."""
        # 1. Find function by name
        func = next(
            f for f in self.converser.functions 
            if f.name == tool_call.function.name
        )
        
        # 2. Parse parameters
        params = json.loads(tool_call.function.arguments)
        
        # 3. Execute function
        result = await func.execute(**params)
        
        # 4. Handle result based on destination
        if func.destination == Destination.TO_USER:
            # Stream directly to user
            tool_msg, stream, final = result
            
            # Add tool call to messages
            self.messages.append({
                "role": "assistant",
                "tool_calls": [tool_call]
            })
            
            # Add tool response
            self.messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_msg["content"]
            })
            
            # Stream to user
            async for chunk in stream:
                yield chunk
                
        elif func.destination == Destination.TO_ASSISTANT:
            # Add tool message and continue conversation
            self.messages.append({
                "role": "assistant",
                "tool_calls": [tool_call]
            })
            
            self.messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })
            
            # Get GPT to generate natural language
            next_response = await self.openai.generate_response(
                messages=self.messages,
                functions=self.converser.function_schemas
            )
            
            async for chunk in next_response:
                yield chunk
```

---

## Context Management

### Updating Context

```python
class ContextManager:
    """Manages context updates during conversation."""
    
    @staticmethod
    def update_for_entity_switch(
        context: DomainContext,
        new_entity: Entity
    ) -> DomainContext:
        """Update context when user switches to different entity."""
        return DomainContext(
            entity=new_entity,
            query=f"Tell me about {new_entity.name}",
            summary=f"Previously discussed {context.entity.name}. Now discussing {new_entity.name}.",
            attribute=None  # Reset attribute
        )
    
    @staticmethod
    def update_for_attribute(
        context: DomainContext,
        attribute: Attribute
    ) -> DomainContext:
        """Update context when user asks about specific attribute."""
        return context.copy(update={
            "attribute": attribute,
            "summary": context.summary + f" User asked about {attribute.display_name}."
        })
    
    @staticmethod
    def append_to_summary(
        context: DomainContext,
        new_info: str
    ) -> DomainContext:
        """Add information to conversation summary."""
        return context.copy(update={
            "summary": context.summary + " " + new_info
        })
```

---

## Best Practices

### Converser Class

✅ **Stateless functions**: Functions shouldn't store state  
✅ **Dependency injection**: Pass api_client, don't create internally  
✅ **Type hints**: Use types everywhere  
✅ **Clear abstractions**: Separate concerns (data, synthesis, presentation)

### Function Implementation

✅ **Single responsibility**: One function, one purpose  
✅ **Error handling**: Gracefully handle missing data  
✅ **Async all the way**: Use async/await for all I/O  
✅ **Rich synthesis prompts**: Give GPT complete context

### Azure OpenAI Usage

✅ **Stream responses**: Better UX, feels faster  
✅ **Low temperature**: 0.2-0.3 for consistency  
✅ **Proper error handling**: Catch API failures  
✅ **Token management**: Monitor usage

---

## Testing

### Unit Testing Functions

```python
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_short_description():
    # Setup
    context = DomainContext(entity=test_entity, query="test", summary="")
    api_client = AsyncMock()
    api_client.get_entity.return_value = test_entity_data
    
    # Create function
    func = ShortDescription(context, api_client)
    
    # Execute
    result = await func.execute()
    
    # Assert
    assert result is not None
    api_client.get_entity.assert_called_once()
```

### Integration Testing

```python
@pytest.mark.asyncio
async def test_converser_flow():
    # Setup converser
    converser = DomainConverser(context, user, api_client)
    session = ConverserSession(converser, openai_client)
    
    # Initialize
    await session.initialize()
    
    # Send message
    responses = []
    async for chunk in session.send_user_message("Tell me about X"):
        responses.append(chunk)
    
    # Assert function was called
    assert len(responses) > 0
```

---

## Navigation

**Back to**: [System Prompt Guide](building_conversers_system_prompt.instructions.md)  
**Start**: [Overview](building_conversers_overview.instructions.md)  
**See also**: [Functions Guide](building_conversers_functions.instructions.md)

---

## Summary

Implementation involves:
1. **Converser class** - Orchestrates everything
2. **Context class** - Tracks conversation state
3. **Function classes** - Implement the 8 functions
4. **Azure OpenAI** - Powers the AI
5. **Session management** - Handles message flow

The pattern is proven. Now adapt it for your domain.
