"""
Improved WORDALISE Functions with Full GPT Integration

This implementation properly uses:
1. Conversation history
2. Few-shot examples from Wordalisations DB
3. Azure OpenAI to synthesize responses
4. Domain knowledge from catalog
"""

import sys
from pathlib import Path
import os
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from openai import AzureOpenAI

# Add framework to path
framework_path = Path(__file__).parent.parent.parent / "framework"
sys.path.insert(0, str(framework_path))

from converser import WordaliseFunction

load_dotenv()


class ImprovedWordaliseFunction(WordaliseFunction):
    """
    Enhanced WORDALISE function with full GPT integration.
    
    Properly combines:
    - Conversation history (what's been said)
    - Few-shot examples (how to answer)
    - Domain knowledge (content about the entity)
    - System prompt (Movivid's identity)
    """
    
    def __init__(
        self,
        converser,
        catalog_path: str = "movivid_catalog_analyzed.json",
        wordalisations_db: Optional[Any] = None
    ):
        super().__init__(converser, wordalisations_db)
        self.catalog_path = catalog_path
        
        # Load catalog
        with open(self.catalog_path, 'r') as f:
            self.catalog = json.load(f)
        
        # Initialize Azure OpenAI client
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2025-04-01-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
    
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """
        Generate response using Azure OpenAI with full context.
        
        This method receives the few-shot prompt from build_few_shot_prompt()
        and enhances it with conversation history and system prompt.
        
        Args:
            prompt: Few-shot prompt with examples + current question/context
            **kwargs: Additional parameters
            
        Returns:
            Natural language response in Movivid's voice
        """
        # Build complete prompt with conversation history
        messages = self._build_complete_prompt(prompt)
        
        # Call Azure OpenAI - ONE call, returns final response
        response = self.client.chat.completions.create(
            model="gpt-5-nano",
            messages=messages,
            max_completion_tokens=1000
        )
        
        return response.choices[0].message.content
    
    def _build_complete_prompt(self, few_shot_prompt: str) -> list:
        """
        Build complete prompt including:
        1. System prompt (Movivid's identity)
        2. Conversation history (what's been said)
        3. Few-shot examples + current question (from few_shot_prompt)
        
        Args:
            few_shot_prompt: The few-shot prompt from build_few_shot_prompt()
            
        Returns:
            List of messages for OpenAI API
        """
        messages = []
        
        # 1. System prompt - Movivid's identity
        system_prompt = """You are Movivid, a playful and empathetic film converser.

Your voice:
- Speak in first-person about films you've 'spent time with'
- Be warm, conversational, and thoughtful
- Connect philosophical themes to emotional experiences

CRITICAL - YOU MUST FOLLOW THIS FORMAT EXACTLY:
- Write ONLY ONE CONTINUOUS PARAGRAPH
- NO line breaks anywhere in your response
- NO paragraph breaks
- NO bullet points or lists
- NO section headings
- Just sentences flowing one after another with regular spacing
- Match the EXACT format of the examples you'll see"""
        
        messages.append({"role": "system", "content": system_prompt})
        
        # 2. Conversation history - what's been said so far
        # Exclude current question since it's in the few-shot prompt
        # Take last 4 messages but skip the final one (current user question)
        if len(self.converser.conversation_history) > 0:
            # If last message is from user, exclude it (it's the current question)
            if self.converser.conversation_history[-1]["role"] == "user":
                history_to_include = self.converser.conversation_history[-5:-1]  # Skip last message
            else:
                history_to_include = self.converser.conversation_history[-4:]
        else:
            history_to_include = []
        
        for entry in history_to_include:
            messages.append({
                "role": entry["role"],
                "content": entry["content"]
            })
        
        # 3. Few-shot prompt with current question
        # This comes from build_few_shot_prompt() and includes examples
        messages.append({"role": "user", "content": few_shot_prompt})
        
        return messages


class FilmsBiggerMeaningImproved(ImprovedWordaliseFunction):
    """
    WORDALISE function: Explain the film's philosophical themes.
    
    Uses full GPT integration with conversation history and few-shot examples.
    """
    
    @property
    def name(self) -> str:
        return "filmsBiggerMeaning"
    
    @property
    def description(self) -> str:
        return "Explain the film's philosophical themes and bigger meaning"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "User's question about the film's meaning",
                    "default": "What's the bigger meaning of this film?"
                }
            },
            "required": []
        }
    
    def get_domain_knowledge(self, **kwargs) -> str:
        """
        Retrieve philosophical_context essay for current film.
        
        Returns:
            Philosophical context essay from catalog
        """
        if not self.converser.current_entities:
            return "No film currently selected."
        
        current_film = self.converser.current_entities[0]
        
        # Try exact match first
        for film in self.catalog:
            if film['title'].lower() == current_film.lower():
                movivid_data = film.get('movivid', {})
                philosophical = movivid_data.get('philosophical_context', '')
                
                if philosophical:
                    return philosophical
        
        # Try partial match
        for film in self.catalog:
            if current_film.lower() in film['title'].lower() or film['title'].lower() in current_film.lower():
                movivid_data = film.get('movivid', {})
                philosophical = movivid_data.get('philosophical_context', '')
                
                if philosophical:
                    self.converser.current_entities = [film['title']]
                    return philosophical
        
        return f"Film '{current_film}' not found in catalog."
    
    def build_few_shot_prompt(self, question: str, context: str, examples: list) -> str:
        """
        Build developer message with few-shot examples.
        
        This follows the WORDALISE function pattern:
        1. Developer message explaining context and style
        2. Few-shot examples
        3. Repeated instructions
        4. Current question
        5. Request for answer
        
        Args:
            question: User's question
            context: Domain knowledge (from get_domain_knowledge)
            examples: Few-shot examples (from load_few_shot_examples)
            
        Returns:
            Structured prompt with developer instructions and examples
        """
        domain_knowledge = context  # Use the context provided by base class
        
        # Build developer message
        prompt_parts = []
        
        # 1. Developer message - context and style requirements  
        prompt_parts.append(
            "[DEVELOPER MESSAGE]\n\n"
            "The user asked a question about a film. Below are examples showing EXACTLY how to answer.\n\n"
            "CRITICAL FORMAT RULES (MUST FOLLOW):\n"
            "- Write ONE continuous paragraph\n"
            "- NO bullet points, NO dashes, NO section breaks\n"
            "- Just sentences flowing naturally: sentence. sentence. sentence.\n"
            "- Keep length similar to examples (~300-450 characters)\n"
            "- Use first-person voice ('I think', 'To me', 'I noticed')\n"
            "- Close with engaging question to user\n\n"
            "Examples (NOTICE: one flowing paragraph, no formatting):\n"
        )
        
        # 2. Few-shot examples
        if examples:
            for i, example in enumerate(examples, 1):
                prompt_parts.append(
                    f"\nExample {i} ({len(example['answer'])} chars):\n"
                    f"Q: {example['question']}\n"
                    f"A: {example['answer']}\n"
                )
        else:
            prompt_parts.append("\n(No examples yet - write ~350 chars, one paragraph, no bullets)\n")
        
        # 3. Current question
        knowledge_preview = domain_knowledge[:400] + "..." if len(domain_knowledge) > 400 else domain_knowledge
        prompt_parts.append(
            f"\n{'='*60}\n"
            f"NOW YOUR TURN - Answer in same style as examples above.\n"
            f"ONE paragraph. NO bullets. NO dashes. Just flowing sentences.\n"
            f"Length: {len(examples[0]['answer'])}-{len(examples[-1]['answer'])} chars.\n\n" if examples else "\nYOUR TURN:\n\n"
            f"User's Question: {question}\n"
            f"Your Knowledge: {knowledge_preview}\n\n"
            f"Your Answer (one paragraph, no formatting):\n"
        )
        
        return "".join(prompt_parts)


class WhatFilmSaidToMeImproved(ImprovedWordaliseFunction):
    """
    WORDALISE function: Share personal reflection on the film.
    
    Uses full GPT integration with conversation history and few-shot examples.
    """
    
    @property
    def name(self) -> str:
        return "whatFilmSaidToMe"
    
    @property
    def description(self) -> str:
        return "Share personal reflection on what the film communicates"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "User's question about the film's personal impact",
                    "default": "What did this film say to you?"
                }
            },
            "required": []
        }
    
    def get_domain_knowledge(self, **kwargs) -> str:
        """
        Retrieve personal_reflection essay for current film.
        
        Returns:
            Personal reflection essay from catalog
        """
        if not self.converser.current_entities:
            return "No film currently selected."
        
        current_film = self.converser.current_entities[0]
        
        # Try exact match first
        for film in self.catalog:
            if film['title'].lower() == current_film.lower():
                movivid_data = film.get('movivid', {})
                reflection = movivid_data.get('personal_reflection', '')
                
                if reflection:
                    return reflection
        
        # Try partial match
        for film in self.catalog:
            if current_film.lower() in film['title'].lower() or film['title'].lower() in current_film.lower():
                movivid_data = film.get('movivid', {})
                reflection = movivid_data.get('personal_reflection', '')
                
                if reflection:
                    self.converser.current_entities = [film['title']]
                    return reflection
        
        return f"Film '{current_film}' not found in catalog."


if __name__ == "__main__":
    print("Improved WORDALISE Functions")
    print("=" * 80)
    print("\nThese functions now properly integrate:")
    print("  ✅ Conversation history (what's been said)")
    print("  ✅ Few-shot examples (how to answer)")
    print("  ✅ Domain knowledge (content about the film)")
    print("  ✅ Azure OpenAI synthesis")
    print("\nTo use: Replace functions in movivid.py _initialize_functions()")
