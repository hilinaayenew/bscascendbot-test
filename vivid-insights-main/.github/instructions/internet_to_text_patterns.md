# InternetToText Function Patterns

**Purpose**: Structured approaches for web search + GPT analysis in Step 3 of converser development.

## Function Subtypes

### 1. InternetResearch
**Purpose**: Deep research into a subject, returns long-form explanatory text

**Characteristics**:
- Very specific, task-oriented prompts
- 4-5 prompts per research task
- Returns comprehensive analysis
- Output: Long-form text (500-1000 tokens)

**Development Process**:
- Interview user to understand research needs
- Collaboratively develop 4-5 specific prompts
- Each prompt targets different aspect of subject
- Prompts are domain-specific, not generic

**Example Use Cases**:
- Thematic analysis of films
- Musical genre interpretation
- Book literary analysis
- Historical context research

---

### 2. InternetCategorise
**Purpose**: Takes research and categorizes different aspects

**Characteristics**:
- Receives research input (from InternetResearch or other source)
- Extracts and categorizes key aspects
- Returns multiple categories
- Output: Structured data (lists, taxonomies)

**Development Process**:
- Define category schemas
- Specify extraction rules
- Handle multi-category assignments

**Example Use Cases**:
- Extract themes from film analysis
- Categorize life situations
- Tag emotional content
- Classify suitable contexts

---

### 3. InternetSummary
**Purpose**: Synthesizes research into conversational context for the converser to use

**Characteristics**:
- Takes research essays as input
- Synthesizes into first-person narrative
- Written AS the converser (using "I")
- Returns personal, reflective essays
- Output: First-person narrative (500-800 words)

**Development Process**:
- Determine what types of summaries converser needs
- Define tone and voice for each summary type
- Create prompts that blend research with persona
- Write from converser's perspective

**Example Use Cases**:
- Personal reflection essays (converser's experience)
- Intellectual context essays (converser's analysis)
- Background narratives for conversation
- Domain-specific insights in converser's voice

**Movivid Example** (2 summaries per film):
1. **Personal Essay**: Pretends Personal Impact Research observations were Movivid's own experiences. Explains how the film helped her think about situations she's been in. Personal and reflective.
2. **Philosophical Essay**: Discusses how the film made Movivid think about psychology, philosophy, and culture. Gives references and explores deep connections.

---

## Step 3 Process

When building InternetToText functions for a converser:

1. **Identify Research Needs**
   - What gaps exist in Data API?
   - What enrichment is needed?
   - What context helps conversation?

2. **Choose Function Subtypes**
   - InternetResearch for deep analysis
   - InternetCategorise for structured extraction
   - InternetSummary for conversational context
   - Others as patterns emerge

3. **Develop Specific Prompts** (for InternetResearch)
   - Collaborate with user
   - Create 4-5 task-specific prompts
   - Focus on different aspects
   - Make prompts very explicit

4. **Define Category Schemas** (for InternetCategorise)
   - What categories to extract?
   - What format to return?
   - How to handle multiple categories?

5. **Test and Refine**
   - Run on sample data
   - Validate outputs
   - Adjust prompts/schemas

---

## Notes

- This pattern emerged from Movivid development
- More subtypes will be identified as we build more conversers
- Each converser may use different combinations of subtypes
- Prompts are always domain-specific, never generic

**Status**: Pattern v1.0 - will evolve with practice
