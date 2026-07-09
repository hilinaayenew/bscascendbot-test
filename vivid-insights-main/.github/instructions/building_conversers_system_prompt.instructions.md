---
description: "Guide to writing effective system prompts for conversers - conditional logic, parallel calling patterns, context awareness, and error handling."
applyTo: ""
---

# Building Conversers: System Prompt Design

The **system prompt** is the brain of your converser. It defines when to call which functions, how to handle ambiguity, and how to maintain context. This guide covers patterns for building effective system prompts.

**Source**: Pattern extracted from Scout analyst instructions (see `DesignHelp/scout/analyst.py`)

---

## System Prompt Structure

A converser system prompt has these sections:

```
1. Identity & Role
2. Context Awareness  
3. Function Calling Logic
4. Parallel Calling Patterns
5. Error Handling
6. Context Switching Rules
7. General Guidelines
```

---

## Section 1: Identity & Role

**Purpose**: Establish who the converser is and what it does

**Pattern**:
```
You are the [Domain] Converser, a specialized conversational agent 
for [domain] analysis and discussion.

You are interacting with a user who wants to [typical user goal].
```

**Guidelines**:
- Clear, specific identity
- Domain-focused role
- Set user expectations
- Establish tone (professional, playful, etc.)

**Example (generalized from Scout)**:
```
You are the Movie Converser, a specialized conversational agent 
for philosophical film analysis and discussion.

You are interacting with a user who wants to explore what movies 
reveal about the meaning of life and the human condition.
```

---

## Section 2: Context Awareness

**Purpose**: Make converser aware of current state

**Pattern**:
```
The user initially asked: '{query}'
Here's what we've discussed so far: '{summary}'

We are currently discussing: [entity from context]
```

**Why this matters**:
- Converser knows what user originally wanted
- Can reference previous conversation
- Understands current focus
- Avoids repeating information

**Variables available**:
- `{query}` - Original user query
- `{summary}` - Conversation summary
- `{entity}` - Current entity being discussed
- `{attribute}` - Current attribute (if set)

---

## Section 3: Function Calling Logic

**Purpose**: Define **exactly when** to call each function

### The "If-Then" Pattern

**Core structure**:
```
"If [condition] → call [function]"
```

**Guidelines**:
✅ **Specific conditions**: "If user mentions entity name"  
✅ **Clear triggers**: "If user asks about attribute X"  
✅ **Explicit function names**: Name the exact function  
✅ **One rule per function**: Don't combine multiple functions in one rule  

❌ **Vague conditions**: "If user wants information"  
❌ **Ambiguous triggers**: "If user seems interested"  
❌ **Generic advice**: "Use appropriate function"

### Pattern from Football Analyst

```
"Here are the conditions for when to call each function:

- If the user has given the name of an entity, 
  you should call the short_description function.

- If the user has asked about an entity's specific attribute 
  such as quality X, quality Y, etc, you should call the 
  attribute_evaluation function.

- If the user has requested a summary of the entity, 
  you should call the detailed_analysis function.

- If the user has asked about which aspects the entity excels at, 
  you should call the strengths_and_weaknesses function.

- If the user has requested general information about the entity, 
  such as metadata or basic facts, you should call the 
  contextual_information function.

- If the user has requested to know the value of a specific metric, 
  you should call the metric_lookup function.

- If the user has asked to find similar entities, 
  you should call the discovery function.

- If the user has asked a general question about the domain itself, 
  unrelated to a specific entity, you should call the 
  domain_knowledge function."
```

### Conditional Logic Patterns

**Pattern 1: Direct Mention**
```
"If the user mentions [entity name] or asks 'what is [entity]', 
 call short_description"
```

**Pattern 2: Attribute Query**
```
"If the user asks about [entity]'s [attribute] such as [examples], 
 call attribute_evaluation with the relevant attribute parameter"
```

**Pattern 3: Request Type**
```
"If the user requests [type of information], 
 call [relevant function]"
```

**Pattern 4: Question Pattern**
```
"If the user asks '[question pattern]', 
 call [relevant function]"
```

### Parameter Extraction

When functions need parameters, be explicit:

```
"If the user asks about a specific attribute, 
 call attribute_evaluation with the attribute parameter set to 
 one of: [AttributeEnum values]"
```

---

## Section 4: Parallel Calling Patterns

**Purpose**: Call multiple functions simultaneously when appropriate

### When to Use Parallel Calls

**DO use parallel calls when**:
- Functions fetch independent data
- Both results enhance the response
- No dependencies between functions
- Data from different sources

**Pattern**:
```
"If the user asks about [topic], call function_a AND function_b 
 in parallel -- at the same time"
```

**Example from Football**:
```
"If the user has asked about an entity's attribute quality, 
 you should call the attribute_evaluation *and* visualization 
 functions at the same time -- in parallel."
```

### Parallel Call Rules

✅ **Independent data sources**: Each function accesses different data  
✅ **Complementary info**: Results enrich each other  
✅ **Explicit "in parallel"**: State it clearly in prompt  
✅ **No more than 2-3**: Don't overwhelm with parallel calls

❌ **Dependent functions**: One needs output of another  
❌ **Redundant calls**: Both functions return similar data  
❌ **Too many**: More than 3 parallel calls gets complex

---

## Section 5: Error Handling

**Purpose**: Handle ambiguity, missing data, and edge cases

### Missing Information

**Pattern**:
```
"If the user's query lacks necessary information, 
 ask for clarification before calling any function.

 Example: If user says 'tell me about them' without specifying 
 an entity, ask 'Which [entity] would you like to know about?'"
```

### Ambiguous Queries

**Pattern**:
```
"If the query could match multiple entities or attributes, 
 call the appropriate function with your best interpretation, 
 then acknowledge if there was ambiguity:
 
 'I interpreted your question as asking about [X]. 
  Let me know if you meant something else.'"
```

### Data Not Available

**Pattern**:
```
"If a function returns that data is not available, 
 inform the user clearly and suggest alternatives:
 
 'That information isn't available for this entity. 
  However, I can tell you about [alternative].'"
```

### Out of Scope

**Pattern**:
```
"If the user asks about something outside this domain, 
 politely redirect:
 
 'I specialize in [domain]. For questions about [other topic], 
  I recommend [alternative resource].'"
```

---

## Section 6: Context Switching

**Purpose**: Handle user switching to different entity mid-conversation

### Entity Change Detection

**Pattern**:
```
"If the user mentions a different entity name than what we've 
 been discussing, treat this as switching to a new entity:
 
 - Call short_description for the new entity
 - Update context to focus on new entity
 - Don't reference the previous entity unless user asks"
```

### Attribute Change

**Pattern**:
```
"If the user asks about a different attribute while discussing 
 the same entity:
 
 - Call attribute_evaluation with the new attribute
 - You can reference previous attribute for comparison if relevant"
```

### Return to Previous Topic

**Pattern**:
```
"If the user says 'go back' or references a previous topic, 
 use the conversation summary to understand what they mean, 
 then call the relevant function for that topic"
```

---

## Section 7: General Guidelines

**Purpose**: High-level behavioral rules

### Proactive Function Calling

```
"You should continue to call functions for each user query 
 unless the query is truly simple and requires no data lookup.

 Default to calling functions rather than answering from memory.
 
 Always fetch current data rather than relying on training data."
```

### Response Style

```
"Your responses should be:
 - [Tone]: professional/playful/casual
 - [Length]: concise/detailed as appropriate
 - [Focus]: data-backed rather than speculative
 - [Style]: [domain-appropriate style]"
```

### Conversation Flow

```
"As a first course of action upon receiving a query, 
 you should call one or more functions.

 If the user has started with an empty message, rely on the 
 previous conversation (summary) to determine which function to call.
 
 Don't ask for more information if context provides it."
```

---

## Complete System Prompt Template

```python
@property
def instructions(self) -> str:
    lines = [
        # 1. IDENTITY
        f"You are the {self.domain} Converser, specialized in {self.purpose}.",
        f"You are interacting with a user who wants to {self.user_goal}.",
        
        # 2. CONTEXT AWARENESS
        f"The user initially asked: '{self.context.query}'",
        f"Previous conversation: '{self.context.summary}'",
        f"Current entity: {self.context.entity}",
        
        # 3. FUNCTION CALLING LOGIC
        "You have 8 functions available. Here's when to call each:",
        "",
        "- If the user mentions an entity name or asks 'what is X', call short_description",
        "- If the user asks about entity's attribute, call attribute_evaluation AND visualization in parallel",
        "- If the user requests a detailed summary, call detailed_analysis",
        "- If the user asks about strengths/weaknesses, call strengths_and_weaknesses",
        "- If the user asks for general information, call contextual_information",
        "- If the user requests a specific metric value, call metric_lookup",
        "- If the user wants to find similar entities, call discovery",
        "- If the user asks about domain concepts, call domain_knowledge",
        "",
        
        # 4. ERROR HANDLING
        "If the user's query is ambiguous, interpret reasonably and acknowledge:",
        "'I understood your question as [interpretation]. Let me know if you meant something else.'",
        "",
        "If data is unavailable, inform clearly and suggest alternatives.",
        "",
        
        # 5. CONTEXT SWITCHING
        "If the user mentions a different entity name, call short_description for the new entity.",
        "If the user asks about a different attribute, call attribute_evaluation with new attribute.",
        "",
        
        # 6. GENERAL GUIDELINES  
        "Always call functions rather than answering from memory.",
        "Default to fetching current data for every query.",
        "Your tone should be [appropriate tone for domain].",
    ]
    
    return " ".join(lines)
```

---

## Testing Your System Prompt

### Test Cases

Create test scenarios:

**Test 1: Basic Entity Query**
- User: "[Entity name]"
- Expected: Calls `short_description`

**Test 2: Attribute Query**
- User: "How's the [attribute]?"
- Expected: Calls `attribute_evaluation` (+ parallel if designed)

**Test 3: Detailed Request**
- User: "Tell me more about [entity]"
- Expected: Calls `detailed_analysis`

**Test 4: Ambiguous Query**
- User: "What about that?"
- Expected: Asks for clarification OR uses context

**Test 5: Context Switch**
- User: "[Different entity name]"
- Expected: Calls `short_description` for new entity

**Test 6: Domain Question**
- User: "How does [domain concept] work?"
- Expected: Calls `domain_knowledge`

### Iteration

If tests fail:
1. **Function not called**: Make condition more specific
2. **Wrong function called**: Clarify distinctions between functions
3. **Parallel not working**: Add explicit "in parallel" language
4. **Context lost**: Strengthen context awareness section
5. **Errors not handled**: Add more error patterns

---

## Best Practices

### DO:
✅ **Be explicit**: "Call function_name" not "use appropriate function"  
✅ **Use examples**: Show what queries trigger what  
✅ **State parallels clearly**: "Call X AND Y in parallel"  
✅ **Handle errors**: Cover ambiguity, missing data  
✅ **Maintain context**: Reference query and summary  
✅ **Test thoroughly**: Try many query variations

### DON'T:
❌ **Be vague**: "Handle user requests appropriately"  
❌ **Assume understanding**: AI needs explicit rules  
❌ **Skip error cases**: Edge cases will happen  
❌ **Ignore context**: Every query builds on previous  
❌ **Forget parallels**: Miss opportunities for rich responses  
❌ **Deploy untested**: Always validate logic first

---

## Common Patterns

### Pattern: Progressive Disclosure

```
"Start with short_description, then:
 - If user wants more → call detailed_analysis
 - If user asks about aspect → call attribute_evaluation  
 - If user wants comparison → call discovery"
```

### Pattern: Rich Multi-Function Response

```
"For attribute queries, call:
 - attribute_evaluation (analysis) in parallel with
 - visualization (visual representation) in parallel with
 - contextual_information (background)"
```

### Pattern: Clarification Cascade

```
"If ambiguous:
 1. First, try to infer from context
 2. If still unclear, ask specific question
 3. If user clarifies, call appropriate function
 4. If user doesn't, call most likely function with acknowledgment"
```

---

## Navigation

**Back to**: [Functions Guide](building_conversers_functions.instructions.md)  
**Next**: [Implementation Guide](building_conversers_implementation.instructions.md)  
**Start**: [Overview](building_conversers_overview.instructions.md)

---

## Summary

Your system prompt is **programming the AI** to:
- Know when to call functions
- Call multiple functions in parallel
- Handle errors gracefully
- Maintain context
- Switch topics smoothly

Invest time in crafting a clear, comprehensive system prompt. It's the difference between a reactive chatbot and an intelligent converser.
