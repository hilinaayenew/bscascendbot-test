"""
Base Converser Framework for vivid-AI conversational agents.

A Converser is a domain-specific conversational agent with:
- Context tracking (entities, user profile, conversation history)
- Four function types: CHANGE_CONTEXT, WORDALISE, INSTRUCTIONS, ENGAGE
- Routing logic via instructions property
- Few-shot prompting via Wordalisations Database
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional, Dict, Any, List, Tuple, Callable
import json


class FunctionType(Enum):
    """
    Four function types for conversers.
    
    CHANGE_CONTEXT: Updates converser state (current_entities, user_profile),
                    then calls a WORDALISE function to respond.
    
    WORDALISE: Generates conversational response using current context,
               domain knowledge, and few-shot examples.
    
    INSTRUCTIONS: Explains how the converser works (meta-function).
                  Provides guidance on what questions to ask, how to interact.
    
    ENGAGE: Prompts user to share information or ask questions.
            Proactively invites user participation and context sharing.
    """
    CHANGE_CONTEXT = "change_context"
    WORDALISE = "wordalise"
    INSTRUCTIONS = "instructions"
    ENGAGE = "engage"


class ChatFunction(ABC):
    """
    Base class for all converser functions.
    
    Functions can be either CHANGE_CONTEXT or WORDALISE type.
    Each function has a name, description, and parameter schema for OpenAI.
    """
    
    @property
    @abstractmethod
    def function_type(self) -> FunctionType:
        """Return function type: CHANGE_CONTEXT, WORDALISE, INSTRUCTIONS, or ENGAGE."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Function name for OpenAI function calling."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what this function does."""
        pass
    
    @property
    def parameters(self) -> Dict[str, Any]:
        """
        OpenAI function parameters schema.
        Override in subclass to define specific parameters.
        """
        return {
            "type": "object",
            "properties": {},
            "required": []
        }
    
    def construct_schema(self) -> Dict[str, Any]:
        """Convert function to OpenAI function calling schema."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }
    
    @abstractmethod
    async def __call__(self, **kwargs) -> Any:
        """
        Execute the function.
        
        CHANGE_CONTEXT functions:
        - Update converser context
        - Call appropriate WORDALISE function
        - Return WORDALISE response
        
        WORDALISE functions:
        - Access current context
        - Retrieve domain knowledge
        - Load few-shot examples
        - Generate response
        - Return natural language answer
        """
        pass


class ChangeContextFunction(ChatFunction):
    """
    Base class for CHANGE_CONTEXT functions.
    
    These functions update converser state (current_entities, user_profile),
    then trigger a WORDALISE function to generate response.
    """
    
    @property
    def function_type(self) -> FunctionType:
        return FunctionType.CHANGE_CONTEXT
    
    def __init__(self, converser: "Converser"):
        """
        Initialize with reference to converser for context access.
        
        Args:
            converser: The converser instance (for accessing/updating context)
        """
        self.converser = converser
    
    @abstractmethod
    def update_context(self, **kwargs) -> None:
        """
        Update converser context based on user input.
        
        Should update one or more of:
        - self.converser.current_entities
        - self.converser.user_profile
        """
        pass
    
    @abstractmethod
    def get_wordalise_function(self) -> str:
        """
        Return name of WORDALISE function to call after context update.
        
        Returns:
            Name of WORDALISE function (e.g., 'explain_entity')
        """
        pass
    
    async def __call__(self, **kwargs) -> Dict[str, Any]:
        """
        Execute CHANGE_CONTEXT function.
        
        1. Update context
        2. Get WORDALISE function name
        3. Call that WORDALISE function
        4. Return response
        """
        # Update context
        self.update_context(**kwargs)
        
        # Get WORDALISE function to call
        wordalise_name = self.get_wordalise_function()
        
        # Find and call the WORDALISE function
        wordalise_func = self.converser.get_function_by_name(wordalise_name)
        if wordalise_func is None:
            return {
                "error": f"WORDALISE function '{wordalise_name}' not found"
            }
        
        # Call WORDALISE with updated context
        return await wordalise_func(**kwargs)


class WordaliseFunction(ChatFunction):
    """
    Base class for WORDALISE functions.
    
    These functions generate conversational responses using:
    - Current context (entities, user profile, history)
    - Domain knowledge (from API/catalog)
    - Few-shot examples (from Wordalisations DB)
    """
    
    @property
    def function_type(self) -> FunctionType:
        return FunctionType.WORDALISE
    
    def __init__(
        self,
        converser: "Converser",
        wordalisations_db: Optional[Any] = None
    ):
        """
        Initialize with converser and optional Wordalisations DB.
        
        Args:
            converser: The converser instance (for context access)
            wordalisations_db: Database of few-shot examples
        """
        self.converser = converser
        self.wordalisations_db = wordalisations_db
    
    @abstractmethod
    def get_domain_knowledge(self, **kwargs) -> str:
        """
        Retrieve domain knowledge for current entities.
        
        Should use:
        - self.converser.current_entities to know what to retrieve
        - Data API or domain catalog to get entity data
        
        Returns:
            Context text (metadata, essays, etc.)
        """
        pass
    
    def load_few_shot_examples(self, question: str, limit: int = 3) -> List[Dict[str, str]]:
        """
        Load few-shot examples from Wordalisations DB.
        
        Args:
            question: User's question
            limit: Number of examples to retrieve
            
        Returns:
            List of {question, context, answer} example dicts
        """
        if self.wordalisations_db is None:
            return []
        
        # Get examples for this function
        # (Implementation depends on Wordalisations DB interface)
        try:
            return self.wordalisations_db.get_examples(
                function_name=self.name,
                limit=limit
            )
        except Exception as e:
            print(f"Warning: Could not load examples: {e}")
            return []
    
    def build_few_shot_prompt(
        self,
        question: str,
        context: str,
        examples: List[Dict[str, str]]
    ) -> str:
        """
        Build few-shot prompt with developer message format.
        
        CRITICAL PATTERN: WORDALISE functions should structure prompts as:
        
        1. **Developer Message** - Explains context and style requirements
           - What's the conversation context?
           - What knowledge will be used?
           - What style/format is expected?
           
        2. **Few-Shot Examples** - Shows how to answer
           - Question examples
           - Knowledge used (truncated preview)
           - Exemplar answers in converser's voice
           
        3. **Repeated Instructions** - Reinforces style for current answer
           - Reminds about format (e.g., "2-3 short sentences")
           - Reminds about style (e.g., "first person, close with question")
           - Reminds about engagement approach
           
        4. **Current Question & Knowledge** - The actual request
           - User's current question
           - Full domain knowledge (not truncated)
           
        5. **Request for Answer** - Clear call to action
           - "Now give your answer directly to the user..."
        
        This prompt will be sent as the FINAL USER MESSAGE in a conversation that includes:
        - System prompt (converser identity)
        - Conversation history (previous exchanges)
        - This few-shot prompt (developer message + examples + current question)
        
        Args:
            question: User's current question
            context: Domain knowledge for current entities (full text from catalog)
            examples: Few-shot examples from database
            
        Returns:
            Structured prompt with developer instructions and examples
            
        Example Format:
            [DEVELOPER MESSAGE]
            
            In the conversation up to now you have been discussing {domain}. 
            Now the user has asked you a new question. You want to use your 
            deep knowledge of {knowledge_type}. But before you do that I want 
            to give you stylistic examples of how you have answered such 
            questions in the past.
            
            The key is to {style_requirements}. Here are some examples:
            
            Example 1:
            Question: {example_question}
            Your Knowledge: {example_context_preview}
            Your Answer: {example_answer}
            
            ---
            
            Now you should follow this pattern in your current answer.
            {repeated_instructions}
            
            User's Current Question: {question}
            Your Knowledge: {full_context}
            
            Now give your answer directly to the user:
        """
        prompt_parts = []
        
        if examples:
            prompt_parts.append("Here are examples of how to answer similar questions:\n")
            
            for i, ex in enumerate(examples, 1):
                prompt_parts.append(f"Example {i}:")
                prompt_parts.append(f"Question: {ex['question']}")
                prompt_parts.append(f"Context: {ex['context'][:200]}...")  # Truncate for brevity
                prompt_parts.append(f"Answer: {ex['answer'][:200]}...\n")  # Truncate for brevity
        
        prompt_parts.append("Now answer this question following the same style:")
        prompt_parts.append(f"Question: {question}")
        prompt_parts.append(f"Context: {context}")  # Full context (not truncated)
        prompt_parts.append("Answer:")
        
        return "\n".join(prompt_parts)
    
    @abstractmethod
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """
        Generate response using LLM with complete context.
        
        CRITICAL: This method should build a complete message array including:
        1. System prompt (converser's identity and voice guidelines)
        2. Conversation history (self.converser.conversation_history)
        3. Few-shot prompt (the 'prompt' parameter with examples)
        
        Then call Azure OpenAI (or other LLM) to synthesize a response that:
        - Uses the examples to guide tone and style
        - References conversation history for context
        - Synthesizes domain knowledge naturally
        - Maintains converser's voice
        
        Args:
            prompt: Few-shot prompt with examples + question (from build_few_shot_prompt)
            **kwargs: Additional parameters
            
        Returns:
            Synthesized natural language response in converser's voice
            
        Example implementation:
            messages = [
                {"role": "system", "content": "You are {converser}..."},
                *self.converser.conversation_history[-8:],  # Last 4 exchanges
                {"role": "user", "content": prompt}
            ]
            response = await openai_client.chat.completions.create(
                model="gpt-5-nano",
                messages=messages
            )
            return response.choices[0].message.content
        """
        pass
    
    async def __call__(self, question: str = "", **kwargs) -> str:
        """
        Execute WORDALISE function.
        
        1. Get domain knowledge for current entities
        2. Load few-shot examples
        3. Build few-shot prompt
        4. Generate response
        5. Return answer
        """
        # Get domain knowledge
        context = self.get_domain_knowledge(**kwargs)
        
        # Load few-shot examples
        examples = self.load_few_shot_examples(question)
        
        # Build few-shot prompt
        prompt = self.build_few_shot_prompt(question, context, examples)
        
        # Generate response
        response = await self.generate_response(prompt, **kwargs)
        
        return response


class InstructionsFunction(ChatFunction):
    """
    Base class for INSTRUCTIONS functions.
    
    These functions explain how the converser works - meta-information
    about interaction patterns, what questions to ask, what the converser can do.
    """
    
    @property
    def function_type(self) -> FunctionType:
        return FunctionType.INSTRUCTIONS
    
    def __init__(self, converser: "Converser"):
        """
        Initialize with reference to converser.
        
        Args:
            converser: The converser instance
        """
        self.converser = converser
    
    @abstractmethod
    def get_instructions_content(self) -> str:
        """
        Get the instructions/guidance content.
        
        Should return explanation of:
        - What this converser does
        - How to interact with it
        - What questions to ask
        - Example interaction patterns
        
        Returns:
            Instructions text in converser's voice
        """
        pass
    
    async def __call__(self, **kwargs) -> str:
        """
        Execute INSTRUCTIONS function.
        
        Returns instructions about how to use the converser.
        """
        return self.get_instructions_content()


class EngageFunction(ChatFunction):
    """
    Base class for ENGAGE functions.
    
    These functions proactively prompt user to share information or ask questions.
    Used to invite participation, gather context, encourage interaction.
    """
    
    @property
    def function_type(self) -> FunctionType:
        return FunctionType.ENGAGE
    
    def __init__(self, converser: "Converser"):
        """
        Initialize with reference to converser.
        
        Args:
            converser: The converser instance (for context awareness)
        """
        self.converser = converser
    
    @abstractmethod
    def get_engagement_prompt(self) -> str:
        """
        Get the engagement prompt.
        
        Should return a prompt that:
        - Invites user to share context
        - Encourages specific types of questions
        - Opens conversation naturally
        - Reflects converser's personality
        
        May use self.converser context to personalize:
        - If no current_entities: Invite entity exploration
        - If no user_profile: Ask about user's situation
        - If conversation stalled: Re-engage with new angle
        
        Returns:
            Engagement prompt in converser's voice
        """
        pass
    
    async def __call__(self, **kwargs) -> str:
        """
        Execute ENGAGE function.
        
        Returns engagement prompt to invite user participation.
        """
        return self.get_engagement_prompt()


class Converser(ABC):
    """
    Base class for all vivid-AI conversers.
    
    A converser maintains:
    - Context (current entities, user profile, conversation history)
    - Functions (CHANGE_CONTEXT, WORDALISE, INSTRUCTIONS, ENGAGE)
    - Routing logic (instructions property)
    
    Subclasses implement domain-specific:
    - System prompt (instructions property)
    - Function initialization (_initialize_functions)
    - Context structure (current_entities, user_profile)
    """
    
    def __init__(
        self,
        name: str,
        domain: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize converser.
        
        Args:
            name: Converser identifier (e.g., "Movivid")
            domain: Subject domain (e.g., "movies")
            metadata: Additional config (style, purpose, focus)
        """
        self.name = name
        self.domain = domain
        self.metadata = metadata or {}
        
        # Context: Three components (Step 4)
        self.current_entities: List[Any] = []  # Domain entities being discussed
        self.user_profile: Dict[str, Any] = {  # User's situation/preferences
            "situation": "",
            "preferences": [],
            "context": ""
        }
        self.conversation_history: List[Dict[str, str]] = []  # Full dialogue
        
        # Functions (initialized by subclass)
        self._functions: List[ChatFunction] = []
    
    @property
    @abstractmethod
    def instructions(self) -> str:
        """
        System prompt with routing logic (Step 7).
        
        This IS the routing layer - defines when to call which function.
        
        Should include:
        1. Identity and purpose
        2. Context awareness (current entities, user profile)
        3. IF-THEN routing rules for each function
        4. Error handling
        5. General guidelines
        
        Returns:
            System prompt string with routing logic
        """
        pass
    
    @abstractmethod
    def _initialize_functions(self) -> List[ChatFunction]:
        """
        Initialize the 6-12 function instances (Step 5).
        
        Should create:
        - 2-4 CHANGE_CONTEXT functions
        - 3-6 WORDALISE functions
        - 1-2 INSTRUCTIONS functions
        - 1-2 ENGAGE functions
        
        Returns:
            List of function instances
        """
        pass
    
    @property
    def functions(self) -> List[ChatFunction]:
        """Return all function instances."""
        if not self._functions:
            self._functions = self._initialize_functions()
        return self._functions
    
    @property
    def function_schemas(self) -> List[Dict[str, Any]]:
        """Convert functions to OpenAI function calling schema."""
        return [func.construct_schema() for func in self.functions]
    
    def get_function_by_name(self, name: str) -> Optional[ChatFunction]:
        """
        Get function instance by name.
        
        Args:
            name: Function name
            
        Returns:
            Function instance or None if not found
        """
        for func in self.functions:
            if func.name == name:
                return func
        return None
    
    @property
    def initial_function_calls(self) -> List[Tuple[ChatFunction, dict]]:
        """
        Functions called automatically on converser start.
        
        Usually empty for conversers (unlike analysts which may auto-fetch data).
        
        Returns:
            List of (function, params) tuples
        """
        return []
    
    # Context management methods
    
    def add_to_history(self, role: str, content: str) -> None:
        """
        Add message to conversation history.
        
        Args:
            role: "user" or "assistant"
            content: Message content
        """
        self.conversation_history.append({
            "role": role,
            "content": content
        })
    
    def reset_conversation(self) -> None:
        """Clear conversation history."""
        self.conversation_history = []
    
    def reset_context(self) -> None:
        """Reset all context (entities, profile, history)."""
        self.current_entities = []
        self.user_profile = {
            "situation": "",
            "preferences": [],
            "context": ""
        }
        self.conversation_history = []
    
    def get_context_summary(self) -> str:
        """
        Get human-readable summary of current context.
        
        Returns:
            Context summary string
        """
        summary_parts = [
            f"Converser: {self.name} ({self.domain})",
            f"Current entities: {self.current_entities if self.current_entities else 'None'}",
            f"User situation: {self.user_profile.get('situation', 'Not captured')}",
            f"Conversation turns: {len(self.conversation_history)}"
        ]
        return "\n".join(summary_parts)
    
    def __repr__(self) -> str:
        return f"Converser(name='{self.name}', domain='{self.domain}', functions={len(self.functions)})"
    
    def describe(self) -> str:
        """
        Return human-readable description.
        
        Returns:
            Description string
        """
        style = self.metadata.get("style", "engaging")
        purpose = self.metadata.get("purpose", "conversation")
        
        return (
            f"{self.name} - A {style} converser specializing in {self.domain} "
            f"for {purpose}. Has {len(self.functions)} functions available."
        )


# Example implementation stub (to be filled in by domain-specific converser)

class ExampleChangeContext(ChangeContextFunction):
    """
    Example CHANGE_CONTEXT function.
    
    Replace with domain-specific implementations like:
    - UpdateCurrentEntity
    - CaptureUserSituation
    - SwitchEntity
    - AddEntityPreference
    """
    
    @property
    def name(self) -> str:
        return "update_entity_context"
    
    @property
    def description(self) -> str:
        return "Update current entity being discussed"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "entity_name": {
                    "type": "string",
                    "description": "Name of entity to discuss"
                }
            },
            "required": ["entity_name"]
        }
    
    def update_context(self, entity_name: str, **kwargs) -> None:
        """Update current_entities with new entity."""
        self.converser.current_entities = [entity_name]
    
    def get_wordalise_function(self) -> str:
        """Call explain_entity after updating entity."""
        return "explain_entity"


class ExampleWordalise(WordaliseFunction):
    """
    Example WORDALISE function.
    
    Replace with domain-specific implementations like:
    - ExplainEntity
    - ExplainRelevance
    - CompareEntities
    - RecommendBasedOnContext
    - AnswerDomainQuestion
    """
    
    @property
    def name(self) -> str:
        return "explain_entity"
    
    @property
    def description(self) -> str:
        return "Explain current entity in converser's voice"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "User's question about entity"
                }
            },
            "required": ["question"]
        }
    
    def get_domain_knowledge(self, **kwargs) -> str:
        """
        Retrieve entity data from API/catalog.
        
        Should use self.converser.current_entities to know what to retrieve.
        """
        if not self.converser.current_entities:
            return "No entity currently selected."
        
        entity = self.converser.current_entities[0]
        # In real implementation: fetch from API/catalog
        return f"[Domain knowledge about {entity} would go here]"
    
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """
        Generate response using LLM.
        
        In real implementation: call Azure OpenAI or similar.
        """
        # Placeholder - in real implementation, call LLM
        return f"[Generated response based on prompt would go here]\n\nPrompt was:\n{prompt[:200]}..."


class ExampleConverser(Converser):
    """
    Example converser implementation.
    
    Replace with domain-specific converser like Movivid.
    """
    
    @property
    def instructions(self) -> str:
        """System prompt with routing logic."""
        lines = [
            f"You are {self.name}, a conversational agent specialized in {self.domain}.",
            "You help users by having engaging conversations.",
            "",
            "You have functions available. Here's when to call each:",
            "",
            "- If user mentions an entity name, call update_entity_context",
            "- If user asks about current entity, call explain_entity",
            "",
            "Always call functions rather than answering from memory.",
        ]
        return " ".join(lines)
    
    def _initialize_functions(self) -> List[ChatFunction]:
        """Initialize function instances."""
        return [
            ExampleChangeContext(self),
            ExampleWordalise(self, wordalisations_db=None)
        ]


# Factory function for creating conversers

def create_example_converser() -> ExampleConverser:
    """
    Create example converser instance.
    
    Replace with domain-specific factory like create_movivid().
    """
    return ExampleConverser(
        name="ExampleConverser",
        domain="example",
        metadata={
            "style": "friendly",
            "purpose": "demonstration"
        }
    )


if __name__ == "__main__":
    # Test basic framework
    converser = create_example_converser()
    print(converser.describe())
    print("\nFunctions:")
    for func in converser.functions:
        print(f"  - {func.name} ({func.function_type.value}): {func.description}")
    print("\nContext:")
    print(converser.get_context_summary())
