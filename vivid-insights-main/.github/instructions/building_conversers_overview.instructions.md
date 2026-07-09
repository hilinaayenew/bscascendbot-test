---
description: "Overview of the vivid-AI converser architecture - core concepts, 7-step development process, and 6-12 function pattern. Start here when building new domain-specific conversers."
applyTo: ""
---

# Building Conversers: Architecture Overview

This guide introduces the vivid-AI converser architecture - a systematic approach to building domain-specific conversational agents with structured function calling capabilities.

**Source Pattern**: This architecture is derived from the Twelve Earpiece football analyst system (see `DesignHelp/CONCEPTS.md` and `DesignHelp/scout/`), generalized for any domain.

**Status**: This is version 1.0 of the methodology, being validated through building Movivid. Expect iterative refinement as we learn.

---

## What is a Converser?

A **converser** is a specialized conversational AI agent designed for deep, interactive dialogue within a specific domain (movies, books, restaurants, products, etc.).
6-12 specialized functions** for data retrieval and analysis
- Use **structured function calling** via Azure OpenAI
- Combine **Data API + InternetToText** for comprehensive knowledge
- Maintain **domain context** throughout conversations
- Generate **rich, data-backed responses** through function composition
- Cache summaries in **Wordalisations database** for efficiency
- Follow **predictable behavioral patterns** defined in system prompts

### Converser vs Simple Chat

| Simple Chat | Converser |
|-------------|-----------|
| One system prompt | System prompt + 6-12 functions |
| No structure | Structured function calling |
| Generic responses | Data API + web search |
| No domain context | Rich context management |
| No caching | Wordalisations database|
| Generic responses | Data-backed analysis |
| No domain context | Rich context management |
| Limited capabilities | Composable function patterns |

---

## Core Architecture Components

### 1. Data API Wrapper

The **Data API** provides structured domain data:
- Movie details (OMDb API)
- Player statistics (Twelve Data API)
- Book information (Google Books API)
- Product data (Amazon/Shopify APIs)
- etc.

**Pattern**:
```python
class DomainAPIWrapper(APIWrapper):
    """Wraps external API for domain-specific data"""
    
    def get_entity(self, entity_id: str) -> Entity:
        """Fetch entity details"""
    
    def search_entities(self, query: str) -> List[Entity]:
        """Search for entities"""
    
    def get_metrics(self, entity_id: str) -> Dict:
        """Get specific metrics/stats"""
```

**Discovery Phase**: Before building functions, thoroughly explore what the API provides.

### 2. InternetToText Functions

**InternetToText** enriches Data API with web search:
- Recent news/reviews
- Critical analysis
- User opinions
- Context not in structured data

**Pattern**:
```python
class SearchInternetAndSummarize(ChatFunction):
    """
    Searches web, summarizes results for GPT.
    Destination: TO_ASSISTANT
    """
    async def __call__(self, query: str) -> str:
        # 1. Check Wordalisations cache
        # 2. Search web if not cached
        # 3. Extract and synthesize
        # 4. Store in database
        # 5. Return summary to assistant
```

### 3. Wordalisations Database

**Wordalisations** cache generated summaries:
- Semantic similarity search (find similar queries)
- Source tracking (URL citations)
- Staleness detection (refresh old content)
- Performance optimization (avoid redundant searches)

**Schema**:
```sql
CREATE TABLE wordalisations (
    id TEXT PRIMARY KEY,
    query TEXT,
    query_embedding BLOB,
    summary TEXT,
    sources JSON,
    domain TEXT,
    created_at TIMESTAMP
);
```

### 4. System Prompt (Instructions)

The **system prompt** defines:
- The converser's identity and role
- **Conditional function calling logic** ("If user asks X → call function Y")
- Parallel function calling patterns
- Error handling and clarification strategies
- Context awareness rules

**Example structure**:
```
You are the [Domain] Converser...

The user asked: '{query}'
Previous conversation: '{summary}'

Function calling rules:
- If user mentions entity name → call short_description
- If user asks about attribute X → call attribute_analysis AND visualization in parallel
- If user asks detailed question → call detailed_analysis
- If user asks comparison → call comparison_function
- If user asks about recent news → call internet_search
...
```

The system prompt **IS the routing layer** - it tells GPT when to call which functions.

### 5. Context

The **context** represents what entity or scenario is being discussed:

```python
class DomainContext:
    entity: Entity           # The main subject (movie, book, etc.)
    query: str              # User's original query
    summary: str            # Conversation summary so far
    attribute: Optional[Attribute]  # Specific aspect being discussed
```

Context flows through all functions and informs:
- Which data to fetch
- How to interpret queries
- When to switch entities

### 6. Functions (The Flexible Function Pattern)

Each converser has **6-12 specialized functions** (not fixed at 8):
- Number depends on domain complexity
- Scout has ~14 functions for football
- Simpler domains may need only 6-8

**Typical function types**:

1. **Entity Summary** (TO_USER) - Quick overview
2. **Detailed Analysis** (TO_USER) - Deep dive
3. **Attribute Evaluation** (TO_USER) - Analyze specific characteristic  
4. **Comparison** (TO_USER) - Compare entities
5. **Contextual Information** (TO_ASSISTANT) - Related metadata
6. **Metric Lookup** (TO_ASSISTANT) - Precise data point
7. **Discovery** (TO_ASSISTANT) - Find similar entities
8. **Domain Knowledge** (TO_ASSISTANT) - General questions
9. **Internet Search** (TO_ASSISTANT) - Web enrichment
10-12. **Domain-specific** as needed

**Function Destinations**:
- `TO_USER`: Generates complete natural language, streams to user
- `TO_ASSISTANT`: Returns raw data for AI to interpret

### 7. Message Flow

```
User Query
    ↓
System Prompt + Context
    ↓
Azure OpenAI decides which function(s) to call
    ↓
Function(s) execute (possibly in parallel)
    ↓
Results returned (TO_USER or TO_ASSISTANT)
    ↓
Response streamed to user
```

---

## Development Process: 7 Steps

Building a converser follows this systematic 7-step process:

### Step 1: System Prompt Setup (Identity & Goals)
**Goal**: Define converser persona before technical details

**Process**:
- Establish domain expertise and focus
- Define conversational style and tone
  - **Tip**: For personal/emotional domains, use **first-person "experienced" language** 
  - Example: "What I got from this film..." vs. "The film explores..."
- Define **interaction pattern**:
  - Does converser ask about user's situation first? (Movivid: asks about life → recommends)
  - Or does user query specific entities? (Scout: user asks about player → analyzes)
- Set boundaries (in/out of scope)
- Draft initial system prompt

**Output**: System prompt draft (refined in Step 6)

**Questions**: What domain? What style? What purpose? What interaction pattern? What boundaries?

**Example (Movivid)**: Playful, first-person, asks about user's life BEFORE recommending films

### Step 2: Data API Discovery (Foundation)
**Goal**: Understand available structured data

**⚠️ CRITICAL: Test actual API responses early. Don't assume field names or data quality.**

**Process**:
1. **API Exploration**:
   - Identify available APIs (often need 2+)
   - Catalog API (discovery): Lists available entities
   - Enrichment API (quality): Detailed metadata
   - Example: uNoGS (Netflix catalog) + OMDb (IMDb ratings)

2. **Response Inspection**:
   - Run test queries, inspect actual JSON
   - Verify field names (`imdb_id` vs `imdbID`?)
   - Check data quality (is "rating" reliable?)
   - Document discrepancies

3. **API Wrapper Creation**:
   - Build classes inheriting from `APIWrapper`
   - Factory functions with optional api_key (read from env)
   - Implement `test_connection()` method
   - Add rate limiting if needed
   - Use client-side filtering when API limits exist

4. **Curated vs. API-Driven Decision**:
   - **Curated**: Quality-focused domains (life counseling, education)
   - **API-Driven**: Discovery/search, large catalogs, freshness
   - **Hybrid**: Curate seed list, enrich with API, allow discovery

5. **Gap Documentation**:
   - Create STEP2_DATA_API_DISCOVERY.md
   - List what APIs provide (✅)
   - List what's missing (❌)
   - Identify InternetToText needs (🌐)

**Output**: 
- API wrapper class(es) + factory functions
- STEP2_DATA_API_DISCOVERY.md documenting capabilities/gaps
- Test catalog (JSON or validated queries)
- Clear list for Step 3 (InternetToText)

**Key Learning**: Do this BEFORE designing functions. Functions need data foundation.

### Step 3: InternetToText Functions (Knowledge Enrichment)
**Goal**: Add web research for data gaps - choose between TWO approaches

#### Understanding the Two Approaches

**APPROACH 1: PREPROCESSING (Static Knowledge Database)**
- **When**: Build knowledge database BEFORE converser runs
- **Pattern**: Research → Categorise → Summarise → Save to catalog
- **Use when**: Quality > real-time, curated domain, deep analysis needed
- **Example**: Movivid preprocessed 30 films to create 4000-char philosophical essays
- **Tools**: `film_theme_analyzer.py` → Creates essays stored in `movivid_catalog_analyzed.json`

**Workflow**:
1. RESEARCH: Web search to gather raw information
2. CATEGORISE: Extract structured data (themes, emotions, situations)
3. SUMMARISE: Create essays in converser's voice
4. SAVE: Store in catalog for later use
5. CONVERSER: Reads from catalog during conversation

**When to use preprocessing**:
- ✅ Domain is well-defined and curated (classic films, philosophy, literature)
- ✅ Content needs deep thoughtful analysis
- ✅ You want to review/edit before use
- ✅ Quality and voice consistency are critical
- ✅ Knowledge is relatively stable (not changing daily)

**APPROACH 2: DYNAMIC (Runtime Functions)**
- **When**: Fetch information DURING conversation
- **Pattern**: User query → Research → Categorise → Summarise → Respond
- **Use when**: Need real-time/current information
- **Example**: News converser fetching latest articles, weather updates, stock prices
- **Tools**: Functions converser can call (like CHANGE_CONTEXT functions)

**Workflow**:
1. USER asks question
2. CONVERSER calls InternetToText function
3. RESEARCH: Web search for current information
4. CATEGORISE: Extract relevant data
5. SUMMARISE: Format in converser's voice
6. RETURN: Use in immediate response

**When to use dynamic**:
- ✅ Need real-time/current information (news, weather, scores)
- ✅ User queries are unpredictable
- ✅ Domain is vast and ever-changing
- ✅ Freshness > careful curation
- ✅ Quick responses acceptable

#### Templates Available

See `framework/internet_to_text.py` for three core patterns:

1. **InternetResearch**: Web search to gather information
2. **InternetCategorise**: Extract structured data from unstructured text
3. **InternetSummarise**: Condense into converser's voice

#### Movivid Example (Preprocessing)

**Problem**: APIs (OMDb, uNoGS) provide metadata but NO philosophical analysis or personal reflections

**Solution**: Preprocessing pipeline
1. `film_theme_analyzer.py` → Research film themes via web
2. Extract themes, life_situations, emotions
3. Generate two essays per film:
   - `philosophical_context` (4000 chars)
   - `personal_reflection` (4000 chars)
4. Save to `movivid_catalog_analyzed.json`
5. Movivid reads essays during conversation

**Result**: High-quality, curated knowledge reviewed and edited before use

#### Decision Guide

**Choose PREPROCESSING if**:
- Domain has 20-100 core entities to cover
- Each entity needs deep analysis (1000+ words)
- You want to review quality before converser uses it
- Knowledge is relatively stable
- User counseling/guidance (quality critical)

**Choose DYNAMIC if**:
- Domain is vast (millions of entities)
- Need current/fresh information
- User queries are unpredictable
- Quick facts acceptable
- Discovery/exploration use case

**Skip InternetToText if**:
- Data API provides sufficient information
- No need for analysis or context beyond metadata
- Converser focused on structured data only

**Output**: Either preprocessing scripts OR dynamic function specs (or skip entirely)

### Step 4: Function Breakdown (6-12 Functions)
**Goal**: Design functions based on data + conversation needs

**⚠️ Do this BEFORE Wordalisations**: You need to know WHAT functions exist before creating training examples.

- Create 6-12 functions (adapt to domain)
- Four function types:
  - **CHANGE_CONTEXT** (2-4): Update state
  - **WORDALISE** (3-6): Generate responses using CSV training
  - **INSTRUCTIONS** (1-2): Explain how converser works
  - **ENGAGE** (1-2): Prompt user interaction
- Define parameters and schemas for each function
- Plan which CHANGE_CONTEXT calls which WORDALISE

**Output**: Complete function specifications

**Function types**: See `building_conversers_functions.instructions.md` for complete patterns

### Step 5: Wordalisations Training (CSV Few-Shot Examples)
**Goal**: Create training examples for WORDALISE functions (from Step 4)

**⭐ CRITICAL**: This is the ESSENTIAL way conversers maintain voice quality. See detailed guide: `building_conversers_wordalisations.instructions.md`

**Quick Summary**:
- Take each WORDALISE function from Step 4
- Create CSV file per function (question, knowledge, answer)
- Generate 10+ examples using `train_wordalisations.py`
- Review and edit for voice consistency
- Add 3-5 hand-crafted perfect examples
- Functions load 3-5 examples for few-shot prompting
- ONE LLM call per function (examples → response)

**Output**: CSV files with 10-15 training examples per WORDALISE function

**Benefits**: Consistent voice, concise responses, authentic personality

**See**: `building_conversers_wordalisations.instructions.md` for complete workflow

**Note**: Steps 4-8 often iterate, but function design comes first

### Step 6: Implementation
**Goal**: Build the converser class

- Create converser class inheriting from `Converser`
- Implement each function type properly
- Set up Azure OpenAI integration for WORDALISE functions
- Track context (current_entities, user_profile, conversation_history)

**Output**: Working converser implementation

**See**: `building_conversers_implementation.instructions.md` for complete guide

### Step 7: Function Calling Mechanism (Routing Logic)
**Goal**: Write conditional logic in system prompt

- Create "If user asks X → call function Y" rules
- Define parallel calling patterns ("call A AND B in parallel")
- Handle edge cases and ambiguity
- Update system prompt with explicit routing

**Output**: Complete system prompt with routing logic

**Remember**: System prompt IS the routing layer (like Movivid's `instructions` property)

**See**: `building_conversers_system_prompt.instructions.md` for complete guide

### Step 8: Testing & Refinement
**Goal**: Validate and iterate

- Unit test each function
- Integration test routing logic
- Validate conversation flows
- Test parallel function calls
- Refine based on real usage

**Output**: Production-ready converser

**Iterate**: Build → Test → Learn → Improve → Repeat

---

## Development Philosophy

**Bottom-Up**: Start with data (Step 2), then design functions (Step 5)  
**Data-First**: Functions need data foundation, explore API before architecting  
**Iterative**: This is version 1.0, expect refinement through practice  
**Learning**: Building Movivid will validate and improve this process

---

## Key Patterns from Football Analyst

The football analyst architecture provides proven patterns:

| Football Pattern | General Pattern |
|------------------|-----------------|
| Player entity | Domain entity |
| Scout Analyst | Domain Converser |
| PlayerQualityDescription | AttributeEvaluationFunction |
| ShortDescription | EntitySummaryFunction |
| Competition/Season context | Domain context object |
| Function calling in instructions | Conditional logic in system prompt |
| TO_USER descriptions | Synthesized natural language |
| TO_ASSISTANT functions | Raw data for AI interpretation |

---

## Azure OpenAI Integration

Conversers use Azure OpenAI's function calling:

**Function Definition**:
```python
{
    "type": "function",
    "function": {
        "name": "function_name",
        "description": "When to call this function",
        "parameters": {
            "type": "object",
            "properties": {...},
            "required": [...]
        }
    }
}
```

**API Call Structure**:
```python
{
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query},
        {"role": "assistant", "tool_calls": [...]},
        {"role": "tool", "content": "...", "tool_call_id": "..."}
    ],
    "tools": [function_schemas],
    "tool_choice": "auto"
}
```

---

## Design Principles

### DO:
✅ **Data API First**: Explore APIs before designing functions (Step 2)  
✅ **Single Responsibility**: Each function does one thing well  
✅ **Clear Conditions**: System prompt has explicit "if/then" logic  
✅ **Parallel Calling**: Call independent functions simultaneously  
✅ **Cache Summaries**: Use Wordalisations DB for efficiency  
✅ **Rich Context**: Pass full context to all functions  
✅ **Data-Backed**: Always fetch data before generating text  
✅ **Error Gracefully**: Handle missing data, ambiguity, edge cases  
✅ **Iterate**: Build, test, learn, refine, repeat

### DON'T:
❌ **Skip API Discovery**: Can't design functions without knowing data  
❌ **Overuse InternetToText**: Data API first, web search for gaps  
❌ **Overload Functions**: One function, one purpose  
❌ **Guess Without Data**: Always call functions first  
❌ **Vague Conditions**: Be specific in system prompt routing  
❌ **Skip Context**: Functions need full context to work  
❌ **Ignore Errors**: Always handle missing/invalid data  
❌ **Assume Fixed Pattern**: Adapt 6-12 functions to your domain

---

## Example Domains

This architecture works for any domain with:
- **Data API** (structured entity data)
- **Entities** (movies, books, products, locations)
- **Attributes** (rating, quality, features)  
- **Metrics** (scores, quantities, rankings)
- **Relationships** (similar items, comparisons)
- **Context** (time, place, category)
- **Web enrichment** needs (reviews, news, analysis)

**Potential conversers**:
- Movie discussion (OMDb + reviews/analysis)
- Book analysis (Google Books + critical reviews)
- Restaurant recommendations (Yelp API + recent reviews)
- Product evaluation (Amazon API + expert reviews)
- Travel planning (TripAdvisor + current events)
- Music analysis (Spotify + cultural context)

---

## Navigation

**Continue to**:
- [Functions Guide](building_conversers_functions.instructions.md) - The flexible function pattern (6-12 functions)
- [System Prompt Guide](building_conversers_system_prompt.instructions.md) - Conditional logic patterns
- [Implementation Guide](building_conversers_implementation.instructions.md) - Building the converser class
- [**Wordalisations Training Guide**](building_conversers_wordalisations.instructions.md) - CSV few-shot training ⭐

**Related**:
- [conversers.instructions.md](conversers.instructions.md) - Framework architecture
- [movivid.instructions.md](movivid.instructions.md) - Movie converser example (complete)

---

## Getting Started

**Ready to build?**

1. Read this overview completely
2. Study the function pattern in the [Functions Guide](building_conversers_functions.instructions.md)
3. **Essential**: Read [Wordalisations Training Guide](building_conversers_wordalisations.instructions.md)
4. Follow the 7-step process systematically:
   - Step 1: System prompt setup
   - Step 2: Data API discovery (**critical**)
   - Step 3: InternetToText functions
   - Step 4: Wordalisations training (**essential**)
   - Step 5: Function breakdown (6-12 functions)
   - Step 6: Routing logic in system prompt
   - Step 7: Testing & refinement

**Remember**: This is version 1.0 of the methodology. We're learning by building Movivid. Expect the process to evolve.

The architecture is proven - the football analyst system demonstrates it works at scale. Now we adapt it for your domain.
