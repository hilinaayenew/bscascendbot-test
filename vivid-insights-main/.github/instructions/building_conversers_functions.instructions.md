---
description: "Deep dive into the 8-function pattern for conversers - function types, destinations, schemas, and when to use each function type."
applyTo: ""
---

# Building Conversers: The 8-Function Pattern

Every converser has **8 specialized functions** that enable structured, data-backed conversations. This guide explains each function type, when to use it, and how to design it.

**Source**: Pattern extracted from football Scout analyst (see `DesignHelp/scout/descriptions/`)

---

## The 8-Function Framework

Each converser implements these 8 function types:

1. **Entity Summary** - Quick overview
2. **Detailed Analysis** - Deep dive
3. **Attribute Evaluation** - Specific characteristic analysis
4. **Comparison** - Compare to similar entities
5. **Contextual Information** - Metadata and facts
6. **Metric Lookup** - Precise data points
7. **Discovery** - Find similar/related entities
8. **Knowledge** - Domain-general information

---

## Function Anatomy

### Core Components

Every function has:

```python
class Function:
    name: str                    # Function identifier
    description: str             # When to call this function
    parameters: Dict[str, Any]   # Input schema
    destination: Destination     # TO_USER or TO_ASSISTANT
    
    async def __call__(**kwargs):
        # Function implementation
```

### Destination Types

**`Destination.TO_USER`**
- Function generates complete natural language response
- Response is synthesized by calling Azure OpenAI internally
- Streams directly to user
- Use when: You want rich, formatted, context-aware text

**`Destination.TO_ASSISTANT`**
- Function returns raw data
- Data becomes a `tool` message sent back to Azure OpenAI
- OpenAI generates natural language from the data
- Use when: Simple data that OpenAI can easily interpret

### Function Schema

Functions define their parameters using JSON Schema:

```python
@property
def parameters(self) -> Dict[str, Any]:
    return {
        "parameter_name": {
            "type": "string",
            "description": "What this parameter means",
            "enum": ["option1", "option2"]  # Optional
        },
        "another_parameter": {
            "type": "number",
            "description": "Numeric parameter"
        }
    }
```

This tells Azure OpenAI:
- What parameters the function needs
- What types they should be
- How to extract them from user queries

---

## Function Type 1: Entity Summary

**Purpose**: Provide quick 1-2 sentence overview of the entity

**When to call**: 
- User mentions entity name
- User asks "what is X?"
- Start of conversation about new entity

**Example (from football)**:
```
Name: short_description
Description: "Gives a short summary of the player's age, position, and team"
Destination: TO_USER
```

**Pattern**:
1. Fetch basic entity metadata
2. Build synthesis prompt: "Provide 1-2 sentence summary of..."
3. Call Azure OpenAI to generate concise description
4. Stream to user

**Key characteristics**:
- Always TO_USER (needs natural language synthesis)
- No parameters (uses context)
- Called frequently as entry point
- Fast execution (minimal data)

---

## Function Type 2: Detailed Analysis

**Purpose**: Comprehensive analysis of the entity

**When to call**:
- User asks for summary, overview, or "tell me more"
- After entity summary, if user wants depth
- User asks open-ended analytical question

**Example (from football)**:
```
Name: player_summary_description
Description: "Comprehensive summary of player's performance"
Destination: TO_USER
```

**Pattern**:
1. Fetch comprehensive entity data
2. Process/analyze data
3. Build detailed synthesis prompt
4. Generate multi-paragraph analysis
5. Stream to user

**Key characteristics**:
- TO_USER (complex synthesis needed)
- May have optional parameters (focus area)
- Longer execution time
- Rich, structured output

---

## Function Type 3: Attribute Evaluation

**Purpose**: Analyze specific characteristic or quality of entity

**When to call**:
- User asks about specific attribute: "How's the X?"
- User wants to evaluate one aspect
- User uses domain-specific attribute terms

**Example (from football)**:
```
Name: player_quality_description
Description: "Describes player's performance in a specific quality"
Parameters: {quality: enum of qualities}
Destination: TO_USER
```

**Pattern**:
1. Parse which attribute is being asked about
2. Fetch metrics related to that attribute
3. Synthesize attribute-specific analysis
4. Optional: Generate visualizations
5. Stream rich description

**Key characteristics**:
- **Requires parameter** (which attribute)
- TO_USER (needs specialized synthesis)
- Often called in parallel with other functions
- May include data visualizations

---

## Function Type 4: Comparison

**Purpose**: Compare entity to similar entities or provide comparative context

**When to call**:
- User asks "compared to others..."
- User wants to know if entity is good/bad/average
- User asks about ranking or percentiles

**Example (from football)**:
```
Name: find_similar_players
Description: "Find players similar to current player"
Destination: TO_USER
```

**Pattern**:
1. Identify comparison criteria
2. Fetch similar entities or comparative metrics
3. Calculate similarities/differences
4. Generate comparison narrative
5. Stream results

**Key characteristics**:
- May be TO_USER or TO_ASSISTANT depending on complexity
- May require parameters (comparison dimension)
- Often generates lists or rankings

---

## Function Type 5: Contextual Information

**Purpose**: Provide metadata, background, or related facts

**When to call**:
- User asks "when", "where", "who"
- User wants biographical/historical context
- User asks about relationships or affiliations

**Example (from football)**:
```
Name: get_player_info
Description: "General information like age, height, team"
Destination: TO_ASSISTANT (or TO_USER for rich context)
```

**Pattern**:
1. Fetch contextual metadata
2. Structure the information
3. Either:
   - Return raw data (TO_ASSISTANT)
   - Synthesize narrative (TO_USER)

**Key characteristics**:
- Flexible destination based on complexity
- Often no parameters needed
- Quick execution
- Factual rather than analytical

---

## Function Type 6: Metric Lookup

**Purpose**: Return specific numeric or precise data point

**When to call**:
- User asks for specific number/metric
- User wants exact value
- User asks "how many", "what's the value of"

**Example (from football)**:
```
Name: give_specific_metric_value
Description: "Returns value of a specific metric"
Parameters: {metric_name: string}
Destination: TO_ASSISTANT
```

**Pattern**:
1. Parse metric name from query
2. Fetch specific data point
3. Return raw value or simple formatted string
4. Let OpenAI wrap it in natural language

**Key characteristics**:
- Usually TO_ASSISTANT (simple data)
- Requires parameter (which metric)
- Very fast execution
- Minimal processing

---

## Function Type 7: Discovery/Search

**Purpose**: Find entities matching criteria or similar to current entity

**When to call**:
- User asks to find similar items
- User wants recommendations
- User searches with criteria

**Example (from football)**:
```
Name: find_similar_players
Description: "Search for players matching criteria"
Parameters: {criteria: object}
Destination: TO_USER
```

**Pattern**:
1. Parse search/similarity criteria
2. Query database or API
3. Rank/filter results
4. Format as list or narrative
5. Stream results

**Key characteristics**:
- TO_USER (needs formatting and ranking)
- Complex parameters (search criteria)
- May return multiple entities
- Often includes explanations of matches

---

## Function Type 8: Domain Knowledge

**Purpose**: Answer general questions about the domain, not specific entity

**When to call**:
- User asks "what is X?" (domain concept)
- User asks "how does Y work?"
- User asks about methodology or definitions

**Example (from football)**:
```
Name: explain_data_analysis
Description: "Explains how metrics work, platform capabilities"
Destination: TO_ASSISTANT (usually)
```

**Pattern**:
1. Identify domain concept being asked about
2. Fetch explanation from knowledge base
3. Return explanation (can be pre-written)
4. OpenAI formats naturally

**Key characteristics**:
- TO_ASSISTANT (straightforward explanations)
- May not need entity context
- Often references documentation
- Educational rather than analytical

---

## Parallel Function Calling

Functions can be called **in parallel** when they fetch independent data:

### When to Use Parallel Calls

✅ **DO call in parallel**:
- Attribute evaluation + contextual visualization
- Multiple independent metrics
- Summary + comparison data

❌ **DON'T call in parallel**:
- Functions with dependencies (one needs output of another)
- Functions that modify state
- Functions with shared resources

### Pattern in System Prompt

```
"If user asks about attribute X, call attribute_evaluation 
 AND contextual_information in parallel"
```

Azure OpenAI handles parallel execution automatically.

---

## Function Composition Patterns

### Pattern 1: Entry → Detail
```
User mentions entity
  → Call Entity Summary
  → User asks for more
  → Call Detailed Analysis
```

### Pattern 2: Analysis + Context
```
User asks about attribute
  → Call Attribute Evaluation (parallel with)
  → Call Contextual Information
```

### Pattern 3: Lookup + Explanation
```
User asks for metric
  → Call Metric Lookup (parallel with)
  → Call Domain Knowledge (if concept unclear)
```

### Pattern 4: Search + Comparison
```
User searches for entities
  → Call Discovery
  → User picks one
  → Call Entity Summary
  → Call Comparison
```

---

## Designing Your 8 Functions

### Step 1: Map User Intents

List common user questions:
- "What is X?"
- "Tell me about X"
- "How good is X's Y?"
- "Compare X to Z"
- ...

### Step 2: Assign to Function Types

Match each intent to one of the 8 function types:
- "What is X?" → Entity Summary
- "Tell me about X" → Detailed Analysis
- "How good is X's Y?" → Attribute Evaluation
- ...

### Step 3: Define Parameters

Determine what information the function needs:
- Entity (from context)
- Attribute name (for attribute evaluation)
- Metric name (for metric lookup)
- Search criteria (for discovery)

### Step 4: Choose Destination

Decide TO_USER or TO_ASSISTANT:
- Complex synthesis → TO_USER
- Simple data → TO_ASSISTANT
- User-facing polish matters → TO_USER
- Raw data sufficient → TO_ASSISTANT

### Step 5: Design Implementation

Plan the function's internal logic:
1. What data to fetch
2. What processing to do
3. What synthesis prompt to use (if TO_USER)
4. What visualizations to include (optional)

---

## Best Practices

### Function Design

✅ **Clear naming**: Name matches purpose  
✅ **Focused scope**: One responsibility  
✅ **Rich descriptions**: Help OpenAI know when to call  
✅ **Appropriate destination**: Match complexity to destination  
✅ **Complete parameters**: All needed info specified  

❌ **Vague names**: "process_data", "handle_query"  
❌ **Multi-purpose**: One function doing many things  
❌ **Weak descriptions**: "Does stuff with entity"  
❌ **Wrong destination**: Complex synthesis via TO_ASSISTANT  
❌ **Missing parameters**: Function can't determine what to do

### Parameter Design

✅ **Use enums**: When options are fixed  
✅ **Clear descriptions**: Help extraction from user query  
✅ **Required parameters**: Mark what's essential  
✅ **Type safety**: Specify types clearly

❌ **Free-form text**: When enum would work  
❌ **Ambiguous names**: "value", "data", "input"  
❌ **Optional everything**: Forces ambiguity  
❌ **Type confusion**: Number as string, etc.

---

## Navigation

**Back to**: [Overview](building_conversers_overview.instructions.md)  
**Next**: [System Prompt Guide](building_conversers_system_prompt.instructions.md)  
**Also see**: [Implementation Guide](building_conversers_implementation.instructions.md)

---

## Summary

The 8-function pattern provides:
- **Structure**: Predictable function types
- **Flexibility**: Each domain customizes functions
- **Composability**: Functions work together
- **Scalability**: Pattern proven at scale
- **Clarity**: Clear purpose for each function

Design your 8 functions carefully - they define what your converser can do.
