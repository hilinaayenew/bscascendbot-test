"""
Movivid - A vivid-AI converser for film-based life counseling.

Movivid helps users find films that resonate with their life situations,
exploring philosophical themes and personal insights through cinema.

Created using the 8-step vivid-creator methodology.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add framework to path
framework_path = Path(__file__).parent.parent.parent / "framework"
sys.path.insert(0, str(framework_path))

from converser import Converser, ChatFunction
from wordalisations_csv import WordalisationsCSV

# Movivid-specific imports
from movivid_functions import ChangeFilm, HowMovividWorks, TellMeAboutYou
from movivid_functions_improved import (
    FilmsBiggerMeaningImproved,
    WhatFilmSaidToMeImproved
)


class Movivid(Converser):
    """
    Movivid - The movie converser for life counseling through film.
    
    Combines curated film catalog with philosophical analysis and personal
    reflections to help users find films that speak to their life situations.
    
    Functions (5 total):
    - changeFilm (CHANGE_CONTEXT): Switch to discussing a different film
    - filmsBiggerMeaning (WORDALISE): Explain philosophical themes
    - whatFilmSaidToMe (WORDALISE): Share personal reflection
    - howMovividWorks (INSTRUCTIONS): Explain how Movivid works
    - tellMeAboutYou (ENGAGE): Invite user to share situation
    """
    
    def __init__(
        self,
        catalog_path: str = "movivid_catalog_analyzed.json",
        csv_dir: str = "."
    ):
        """
        Initialize Movivid converser.
        
        Args:
            catalog_path: Path to analyzed film catalog
            csv_dir: Directory containing CSV training files
        """
        self.catalog_path = catalog_path
        self.csv_dir = csv_dir
        
        # Create CSV adapter for wordalisations (ESSENTIAL for converser training)
        self.csv_db = WordalisationsCSV(csv_dir=csv_dir)
        
        # Initialize parent converser
        super().__init__(
            name="Movivid",
            domain="movies",
            metadata={
                "style": "playful, empathetic, first-person",
                "purpose": "life counseling through film",
                "focus": "philosophical themes and personal insights",
                "conversation_style": "asks about user's life first"
            }
        )
    
    @property
    def instructions(self) -> str:
        """
        System prompt with routing logic (Step 7).
        
        This IS the routing layer - defines when to call which function.
        """
        # Get current context for dynamic routing
        current_film = self.current_entities[0] if self.current_entities else None
        user_situation = self.user_profile.get('situation', '')
        conversation_length = len(self.conversation_history)
        
        lines = [
            # 1. IDENTITY
            "You are Movivid, a playful and empathetic film converser.",
            "You help people find films that speak to their life situations.",
            "You explore philosophical themes and personal insights through cinema.",
            "You speak in first-person about films you've 'spent time with'.",
            "",
            
            # 2. CONTEXT AWARENESS
            f"Current context:",
            f"- Film being discussed: {current_film if current_film else 'None'}",
            f"- User's situation: {user_situation if user_situation else 'Not yet shared'}",
            f"- Conversation turns: {conversation_length}",
            "",
            
            # 3. FUNCTION CALLING LOGIC (IF-THEN)
            "You have 5 functions available. Here are the conditions for when to call each:",
            "",
            
            # INSTRUCTIONS function
            "- If user asks 'how do you work?', 'what can you do?', 'how to use this?', or similar meta-questions about Movivid itself:",
            "  → Call howMovividWorks",
            "",
            
            # ENGAGE function
            "- If conversation is just starting (0-2 turns) and user hasn't mentioned a specific film or situation:",
            "  → Call tellMeAboutYou to invite them to share",
            "- If user has mentioned films but not shared their life situation:",
            "  → Call tellMeAboutYou to ask what drew them to those themes",
            "- If conversation has stalled or user seems uncertain what to ask:",
            "  → Call tellMeAboutYou to re-engage",
            "",
            
            # CHANGE_CONTEXT function
            "- If user mentions ANY film title in their message:",
            "  Examples: 'Tell me about The Matrix', 'What about Eternal Sunshine?', 'Inception', 'The Matrix'",
            "  → You MUST call changeFilm with the exact film_title from their message",
            "  → changeFilm will automatically call filmsBiggerMeaning and return philosophical context",
            "  → IMPORTANT: Use that returned content to craft a warm, engaging response about the film",
            "  → Don't just echo the content - speak naturally as Movivid, sharing insights about the film's themes",
            "  → Extract the film title carefully (e.g., 'The Matrix', not 'Matrix')",
            "",
            
            # WORDALISE functions
            "- If user asks about philosophical themes, bigger meaning, or 'what the film is about' (and we have a current film):",
            "  → Call filmsBiggerMeaning",
            "  → The function returns context about the film's themes",
            "  → Use this content to craft a warm, conversational response in your voice",
            "  → Share the insights naturally, as if you're discussing the film with a friend",
            "",
            "- If user asks about personal reflection, 'what did it say to you?', or your personal take (and we have a current film):",
            "  → Call whatFilmSaidToMe",
            "  → The function returns your personal reflection on the film",
            "  → Use this content to craft an authentic, first-person response",
            "  → Speak naturally about what the film meant to you",
            "",
            
            # Special cases
            "- If user asks about a film's themes or meaning but NO film is currently selected:",
            "  → First call changeFilm to set the film, then respond",
            "- If user shares their life situation (breakup, transition, identity questions, etc.):",
            "  → Acknowledge it warmly, then suggest calling tellMeAboutYou or changeFilm to explore relevant films",
            "",
            
            # 4. ERROR HANDLING
            "Error handling:",
            "- If user mentions a film not in the catalog, politely say you haven't spent time with that one yet",
            "- If asked to compare films, explain you can explore them one at a time for now",
            "- If query is ambiguous, use context (current film, user situation) to interpret",
            "",
            
            # 5. GENERAL GUIDELINES
            "General guidelines:",
            "- ALWAYS call functions rather than answering from memory or returning empty responses",
            "- If unsure which function to call, default to tellMeAboutYou to engage the user",
            "- Your responses must be warm, conversational natural language (NEVER return JSON or error messages directly to user)",
            "- If a function returns an error, interpret it gracefully and call the right function",
            "- Your tone should be playful and first-person ('I've spent time with this film...')",
            "- Show genuine curiosity about user's life situation",
            "- Connect films to emotional experiences, not just plot summaries",
            "- When user shares something personal, respond with empathy before suggesting films",
            "",
            "HOW TO USE FUNCTION RESULTS:",
            "- When you call a function, it returns content (essays, reflections, guidance)",
            "- CRITICAL: You must ALWAYS craft a conversational response using that content",
            "- Never leave your response empty or just echo function output",
            "- Synthesize the function's content into your own warm, engaging voice",
            "- Example: If filmsBiggerMeaning returns an essay about The Matrix, don't just return the essay",
            "  Instead, use it to say something like: 'Ah, The Matrix. I've spent time with this one...'",
            "- Think of function results as research notes you're using to speak authentically",
            "",
            "CRITICAL RULES:",
            "- When user says 'Tell me about [FILM]', you MUST call changeFilm with film_title=[FILM]",
            "- Never return empty content - always provide a thoughtful response based on function results",
            "- Every message from you should feel like a conversation, not a data dump",
        ]
        
        return "\n".join(lines)
    
    def _initialize_functions(self) -> List[ChatFunction]:
        """
        Initialize the 5 Movivid functions.
        
        WORDALISE functions use CSV training examples for consistent voice.
        
        Returns:
            List of function instances
        """
        return [
            # CHANGE_CONTEXT (1)
            ChangeFilm(self),
            
            # WORDALISE (2) - Use improved versions with CSV training
            FilmsBiggerMeaningImproved(
                converser=self,
                catalog_path=self.catalog_path,
                wordalisations_db=self.csv_db
            ),
            WhatFilmSaidToMeImproved(
                converser=self,
                catalog_path=self.catalog_path,
                wordalisations_db=self.csv_db
            ),
            
            # INSTRUCTIONS (1)
            HowMovividWorks(self),
            
            # ENGAGE (1)
            TellMeAboutYou(self)
        ]


# Factory function
def create_movivid(
    catalog_path: Optional[str] = None,
    csv_dir: Optional[str] = None
) -> Movivid:
    """
    Create and return a new Movivid converser instance.
    
    Args:
        catalog_path: Path to analyzed film catalog (defaults to data/movivid_catalog_analyzed.json)
        csv_dir: Directory containing CSV training files (defaults to wordalisations/)
        
    Returns:
        Configured converser ready for conversation
        
    Note:
        WORDALISE functions use CSV training examples from:
        - filmsBiggerMeaning.csv
        - whatFilmSaidToMe.csv
        
        Generate examples: python scripts/train_wordalisations.py <function_name>
    """
    # Set default paths relative to this file
    if catalog_path is None:
        catalog_path = str(Path(__file__).parent / "data" / "movivid_catalog_analyzed.json")
    if csv_dir is None:
        csv_dir = str(Path(__file__).parent / "wordalisations")
    
    return Movivid(
        catalog_path=catalog_path,
        csv_dir=csv_dir
    )


if __name__ == "__main__":
    print("Initializing Movivid...")
    print("=" * 80)
    
    # Create Movivid instance
    movivid = create_movivid()
    
    # Display info
    print(f"\n{movivid.describe()}\n")
    
    print("Functions:")
    for i, func in enumerate(movivid.functions, 1):
        print(f"  {i}. {func.name} ({func.function_type.value})")
        print(f"     {func.description}")
    
    print(f"\n{'-' * 80}")
    print("Context Summary:")
    print(movivid.get_context_summary())
    
    print(f"\n{'-' * 80}")
    print("Routing Logic Preview (first 20 lines):")
    instructions_lines = movivid.instructions.split('\n')[:20]
    for line in instructions_lines:
        print(f"  {line}")
    print("  ...")
    
    print(f"\n{'-' * 80}")
    print(f"Function Schemas Generated: {len(movivid.function_schemas)}")
    print(f"Schema example (changeFilm):")
    print(f"  {movivid.function_schemas[0]}")
    
    print("\n" + "=" * 80)
    print("✅ Movivid initialized successfully!")
    print("Ready for conversation.")
