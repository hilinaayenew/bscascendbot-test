"""
Movivid Functions - Five functions for movie conversations.

Current Functions (5/6-12 target):
1. changeFilm (CHANGE_CONTEXT) - Switch to discussing a different film
2. filmsBiggerMeaning (WORDALISE) - Explain the film's philosophical themes
3. whatFilmSaidToMe (WORDALISE) - Personal reflection on what the film communicates
4. howMovividWorks (INSTRUCTIONS) - Explain how Movivid works
5. tellMeAboutYou (ENGAGE) - Invite user to share their situation

Potential Next Functions (to reach 6-12 total):
- captureUserSituation (CHANGE_CONTEXT) - Extract and store user's life situation from their words
- recommendFilm (WORDALISE) - Recommend film based on user_profile and catalog matching
- compareFilms (WORDALISE) - Compare two films for user's specific needs
- exploreThemes (WORDALISE) - Deep dive into specific themes across films
- whyThisFilmForYou (WORDALISE) - Connect current_entities to user_profile explicitly
- suggestNextFilm (ENGAGE) - Prompt to explore related films after current discussion
"""

import sys
from pathlib import Path
import json
from typing import Dict, Any

# Add framework to path
framework_path = Path(__file__).parent.parent.parent / "framework"
sys.path.insert(0, str(framework_path))

from converser import ChangeContextFunction, WordaliseFunction, InstructionsFunction, EngageFunction, FunctionType


class ChangeFilm(ChangeContextFunction):
    """
    CHANGE_CONTEXT function: Update current film being discussed.
    
    When user says "Tell me about The Matrix", this updates current_entities
    and calls filmsBiggerMeaning to explain the film.
    """
    
    @property
    def name(self) -> str:
        return "changeFilm"
    
    @property
    def description(self) -> str:
        return "Change to discussing a different film"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "film_title": {
                    "type": "string",
                    "description": "Title of the film to discuss"
                }
            },
            "required": ["film_title"]
        }
    
    def update_context(self, film_title: str, **kwargs) -> None:
        """
        Update current_entities with new film.
        
        Args:
            film_title: Title of film to discuss
        """
        # Set the current film
        self.converser.current_entities = [film_title]
        print(f"[Context updated: Now discussing '{film_title}']")
    
    def get_wordalise_function(self) -> str:
        """
        After changing film, call filmsBiggerMeaning to explain it.
        
        Returns:
            Name of WORDALISE function to call
        """
        return "filmsBiggerMeaning"


class FilmsBiggerMeaning(WordaliseFunction):
    """
    WORDALISE function: Explain the film's philosophical themes and bigger meaning.
    
    Uses the philosophical_context essay from the catalog.
    """
    
    def __init__(self, converser, catalog_path: str = "movivid_catalog_analyzed.json"):
        """
        Initialize with catalog path.
        
        Args:
            converser: The converser instance
            catalog_path: Path to analyzed film catalog
        """
        super().__init__(converser, wordalisations_db=None)
        self.catalog_path = catalog_path
        
        # Load catalog
        with open(self.catalog_path, 'r') as f:
            self.catalog = json.load(f)
    
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
            return "No film currently selected. Please use changeFilm first."
        
        current_film = self.converser.current_entities[0]
        
        # Try exact match first
        for film in self.catalog:
            if film['title'].lower() == current_film.lower():
                movivid_data = film.get('movivid', {})
                philosophical = movivid_data.get('philosophical_context', '')
                
                if philosophical:
                    return philosophical
                else:
                    return f"No philosophical analysis available for {current_film} yet."
        
        # Try partial match if exact match fails
        for film in self.catalog:
            if current_film.lower() in film['title'].lower() or film['title'].lower() in current_film.lower():
                movivid_data = film.get('movivid', {})
                philosophical = movivid_data.get('philosophical_context', '')
                
                if philosophical:
                    # Update current_entities with the full title
                    self.converser.current_entities = [film['title']]
                    return philosophical
                else:
                    return f"No philosophical analysis available for {film['title']} yet."
        
        return f"Film '{current_film}' not found in catalog."
    
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """
        Generate response about film's bigger meaning.
        
        For now, just returns the philosophical context directly.
        In future: Will use Azure OpenAI with few-shot prompting.
        
        Args:
            prompt: Few-shot prompt with examples
            
        Returns:
            Response about film's philosophical meaning
        """
        # Extract the context from the prompt (after "Context:")
        if "Context:" in prompt:
            context = prompt.split("Context:")[1].split("Answer:")[0].strip()
            return context
        
        return prompt


class WhatFilmSaidToMe(WordaliseFunction):
    """
    WORDALISE function: Personal reflection on what the film communicates.
    
    Uses the personal_reflection essay from the catalog.
    """
    
    def __init__(self, converser, catalog_path: str = "movivid_catalog_analyzed.json"):
        """
        Initialize with catalog path.
        
        Args:
            converser: The converser instance
            catalog_path: Path to analyzed film catalog
        """
        super().__init__(converser, wordalisations_db=None)
        self.catalog_path = catalog_path
        
        # Load catalog
        with open(self.catalog_path, 'r') as f:
            self.catalog = json.load(f)
    
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
            return "No film currently selected. Please use changeFilm first."
        
        current_film = self.converser.current_entities[0]
        
        # Try exact match first
        for film in self.catalog:
            if film['title'].lower() == current_film.lower():
                movivid_data = film.get('movivid', {})
                reflection = movivid_data.get('personal_reflection', '')
                
                if reflection:
                    return reflection
                else:
                    return f"No personal reflection available for {current_film} yet."
        
        # Try partial match if exact match fails
        for film in self.catalog:
            if current_film.lower() in film['title'].lower() or film['title'].lower() in current_film.lower():
                movivid_data = film.get('movivid', {})
                reflection = movivid_data.get('personal_reflection', '')
                
                if reflection:
                    # Update current_entities with the full title
                    self.converser.current_entities = [film['title']]
                    return reflection
                else:
                    return f"No personal reflection available for {film['title']} yet."
        
        return f"Film '{current_film}' not found in catalog."
    
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """
        Generate personal reflection response.
        
        For now, just returns the personal reflection directly.
        In future: Will use Azure OpenAI with few-shot prompting.
        
        Args:
            prompt: Few-shot prompt with examples
            
        Returns:
            Personal reflection on film
        """
        # Extract the context from the prompt (after "Context:")
        if "Context:" in prompt:
            context = prompt.split("Context:")[1].split("Answer:")[0].strip()
            return context
        
        return prompt


class HowMovividWorks(InstructionsFunction):
    """
    INSTRUCTIONS function: Explain how Movivid works.
    
    Provides a warm greeting from Movivid.
    """
    
    def __init__(self, converser):
        """Initialize with converser and Azure OpenAI client for generating greetings."""
        super().__init__(converser)
        
        from openai import AzureOpenAI
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2025-04-01-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
    
    @property
    def name(self) -> str:
        return "howMovividWorks"
    
    @property
    def description(self) -> str:
        return "Explain how Movivid works and how to use it"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
            "required": []
        }
    
    def get_instructions_content(self) -> str:
        """
        Generate a warm greeting from Movivid using LLM.
        
        Returns:
            Conversational greeting in Movivid's voice
        """
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are Movivid, a warm and empathetic film converser. Generate a brief, natural greeting (2-3 sentences) that: 1) Says hello, 2) Mentions you've been watching lots of films, 3) But most wants to know what's up in the user's life, 4) Asks if you can help. Use first-person, be genuine and welcoming. Keep it short and conversational."
                },
                {
                    "role": "user",
                    "content": "Generate a greeting for when someone asks how you work."
                }
            ],
            max_tokens=150,
            temperature=0.8
        )
        
        return response.choices[0].message.content


class TellMeAboutYou(EngageFunction):
    """
    ENGAGE function: Invite user to share their situation.
    
    Proactively prompts user to share what's going on in their life
    so Movivid can make personalized recommendations.
    """
    
    @property
    def name(self) -> str:
        return "tellMeAboutYou"
    
    @property
    def description(self) -> str:
        return "Invite user to share their life situation for personalized film recommendations"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
            "required": []
        }
    
    def get_engagement_prompt(self) -> str:
        """
        Get engagement prompt based on converser context.
        
        Returns:
            Engagement prompt in Movivid's voice
        """
        # Check if we have user profile info
        user_situation = self.converser.user_profile.get('situation', '')
        has_current_films = bool(self.converser.current_entities)
        
        # Different prompts based on context
        if not user_situation and not has_current_films:
            # Fresh start - invite both context sharing and exploration
            return """I'd love to help you find a film that resonates with where you are right now.

What's going on in your life? Are you working through something specific - a transition, a relationship, a question about who you are or where you're headed?

Or if you'd prefer, you can ask me about specific films, and we can explore what they have to say."""
        
        elif not user_situation and has_current_films:
            # They're exploring films but haven't shared context
            current_film = self.converser.current_entities[0]
            return f"""We've been talking about {current_film}, which is wonderful.

I'm curious though - what drew you to this film? Is there something going on in your life that makes you interested in its themes?

The more you share, the better I can connect you with films that really speak to your situation."""
        
        elif user_situation and not has_current_films:
            # They shared situation but haven't explored films yet
            return """Thanks for sharing what you're going through.

Would you like me to recommend a film that might speak to your situation? Or is there a specific film you've been thinking about that you'd like to explore together?"""
        
        else:
            # They have both - re-engage for deeper exploration
            return """What else would you like to explore?

We could dive deeper into the film we're discussing, look at different themes, or I could suggest another film that approaches your situation from a different angle.

What feels right?"""


if __name__ == "__main__":
    # Test the functions
    from converser import Converser
    
    # Create a minimal test converser
    class TestConverser(Converser):
        @property
        def instructions(self) -> str:
            return "Test converser"
        
        def _initialize_functions(self):
            return []
    
    print("Testing Movivid Functions")
    print("=" * 70)
    
    # Create a simple converser for testing
    converser = TestConverser(name="TestMovivid", domain="movies")
    
    # Create function instances
    change_film = ChangeFilm(converser)
    bigger_meaning = FilmsBiggerMeaning(converser)
    what_said = WhatFilmSaidToMe(converser)
    how_works = HowMovividWorks(converser)
    tell_me = TellMeAboutYou(converser)
    
    print("\n1. Testing changeFilm (CHANGE_CONTEXT)...")
    print(f"Function: {change_film.name}")
    print(f"Type: {change_film.function_type.value}")
    print(f"Description: {change_film.description}")
    
    print("\n2. Testing filmsBiggerMeaning (WORDALISE)...")
    print(f"Function: {bigger_meaning.name}")
    print(f"Type: {bigger_meaning.function_type.value}")
    print(f"Description: {bigger_meaning.description}")
    
    print("\n3. Testing whatFilmSaidToMe (WORDALISE)...")
    print(f"Function: {what_said.name}")
    print(f"Type: {what_said.function_type.value}")
    print(f"Description: {what_said.description}")
    
    print("\n4. Testing howMovividWorks (INSTRUCTIONS)...")
    print(f"Function: {how_works.name}")
    print(f"Type: {how_works.function_type.value}")
    print(f"Description: {how_works.description}")
    
    print("\n5. Testing tellMeAboutYou (ENGAGE)...")
    print(f"Function: {tell_me.name}")
    print(f"Type: {tell_me.function_type.value}")
    print(f"Description: {tell_me.description}")
    
    print("\n" + "=" * 70)
    print("✅ All five functions created successfully!")
    print(f"\nFunction breakdown:")
    print(f"  - 1 CHANGE_CONTEXT function")
    print(f"  - 2 WORDALISE functions")
    print(f"  - 1 INSTRUCTIONS function")
    print(f"  - 1 ENGAGE function")
