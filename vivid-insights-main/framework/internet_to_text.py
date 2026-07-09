"""
Internet-to-Text Templates for Conversers

Two approaches for using web research in conversers:

1. PREPROCESSING (Static): Build knowledge database BEFORE converser runs
   - Example: film_theme_analyzer.py generates essays stored in catalog
   - Use when: Quality over real-time, curated domain, stable knowledge
   
2. DYNAMIC (Runtime): Fetch information DURING conversation
   - Example: search_current_events(), get_latest_reviews()
   - Use when: Real-time data needed, user queries unpredictable

This file provides templates for both approaches using three core patterns:
- RESEARCH: Web search to gather information
- CATEGORISE: Extract structured data from unstructured text
- SUMMARISE: Condense information into conversational format
"""

import os
from typing import Dict, List, Any, Optional
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()


# =============================================================================
# PATTERN 1: RESEARCH - Web Search to Gather Information
# =============================================================================

class InternetResearch:
    """
    Template for web research functionality.
    
    Use this to:
    - Search web for domain-specific information
    - Gather multiple sources on a topic
    - Retrieve current/dynamic information
    
    Example uses:
    - Preprocessing: Research film themes, gather reviews
    - Dynamic: Search current events, latest articles
    """
    
    def __init__(self):
        """Initialize Azure OpenAI client with web search capability."""
        self.client = AzureOpenAI(
            api_key=os.getenv('AZURE_OPENAI_API_KEY'),
            api_version=os.getenv('AZURE_OPENAI_API_VERSION', '2024-02-15-preview'),
            azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT')
        )
        self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
    
    def research_topic(
        self,
        topic: str,
        context: Optional[str] = None,
        focus: Optional[str] = None
    ) -> str:
        """
        Research a topic using web search.
        
        Args:
            topic: What to research (e.g., "The Matrix themes")
            context: Additional context for the search
            focus: What aspect to focus on (e.g., "philosophical analysis")
            
        Returns:
            Raw research text from web sources
            
        Example (Preprocessing):
            research = InternetResearch()
            raw_text = research.research_topic(
                topic="The Matrix 1999",
                focus="philosophical themes and symbolism"
            )
            # Save to database for later use
        
        Example (Dynamic):
            research = InternetResearch()
            raw_text = research.research_topic(
                topic=f"latest reviews of {user_film}",
                focus="critical reception"
            )
            # Use immediately in conversation
        """
        
        prompt_parts = [f"Research: {topic}"]
        if context:
            prompt_parts.append(f"Context: {context}")
        if focus:
            prompt_parts.append(f"Focus on: {focus}")
        
        prompt = "\n".join(prompt_parts)
        
        # Use web search grounding (if available in your Azure OpenAI deployment)
        response = self.client.chat.completions.create(
            model=self.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a research assistant. Search the web and provide comprehensive information on the requested topic."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        return response.choices[0].message.content


# =============================================================================
# PATTERN 2: CATEGORISE - Extract Structured Data from Unstructured Text
# =============================================================================

class InternetCategorise:
    """
    Template for extracting structured data from web research.
    
    Use this to:
    - Parse unstructured text into categories
    - Extract specific attributes
    - Normalize data format
    
    Example uses:
    - Preprocessing: Extract themes, emotions, situations from research
    - Dynamic: Parse search results into structured format
    """
    
    def __init__(self):
        """Initialize Azure OpenAI client."""
        self.client = AzureOpenAI(
            api_key=os.getenv('AZURE_OPENAI_API_KEY'),
            api_version=os.getenv('AZURE_OPENAI_API_VERSION', '2024-02-15-preview'),
            azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT')
        )
        self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
    
    def categorise_text(
        self,
        text: str,
        categories: List[str],
        output_format: str = "json"
    ) -> Dict[str, Any]:
        """
        Extract structured data from unstructured text.
        
        Args:
            text: Raw text to categorise
            categories: List of categories to extract (e.g., ["themes", "emotions"])
            output_format: Output format (json, list, dict)
            
        Returns:
            Structured data dictionary
            
        Example (Preprocessing):
            categoriser = InternetCategorise()
            structured = categoriser.categorise_text(
                text=raw_research_text,
                categories=["themes", "life_situations", "emotions"]
            )
            # Save structured data to catalog
        
        Example (Dynamic):
            categoriser = InternetCategorise()
            structured = categoriser.categorise_text(
                text=search_results,
                categories=["rating", "sentiment", "key_points"]
            )
            # Use in immediate response
        """
        
        categories_str = ", ".join(categories)
        
        prompt = f"""Extract the following categories from this text: {categories_str}

Text:
{text}

Return as JSON with these keys: {categories_str}"""
        
        response = self.client.chat.completions.create(
            model=self.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": f"You are a data extraction assistant. Extract structured {output_format} from unstructured text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=1500,
            temperature=0.1,
            response_format={"type": "json_object"} if output_format == "json" else None
        )
        
        if output_format == "json":
            import json
            return json.loads(response.choices[0].message.content)
        else:
            return {"content": response.choices[0].message.content}


# =============================================================================
# PATTERN 3: SUMMARISE - Condense Information into Conversational Format
# =============================================================================

class InternetSummarise:
    """
    Template for creating conversational summaries from research.
    
    Use this to:
    - Condense long research into digestible form
    - Adapt tone to converser's voice
    - Create essays or reflections
    
    Example uses:
    - Preprocessing: Create philosophical essays from research
    - Dynamic: Summarize search results in converser's voice
    """
    
    def __init__(self, converser_voice: Optional[str] = None):
        """
        Initialize Azure OpenAI client.
        
        Args:
            converser_voice: Description of converser's voice (optional)
                Example: "first-person, warm, philosophical"
        """
        self.client = AzureOpenAI(
            api_key=os.getenv('AZURE_OPENAI_API_KEY'),
            api_version=os.getenv('AZURE_OPENAI_API_VERSION', '2024-02-15-preview'),
            azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT')
        )
        self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
        self.converser_voice = converser_voice or "neutral, informative"
    
    def summarise_in_voice(
        self,
        content: str,
        format_type: str = "essay",
        max_length: int = 4000
    ) -> str:
        """
        Create a summary in the converser's voice.
        
        Args:
            content: Content to summarise
            format_type: Type of summary ("essay", "reflection", "analysis", "brief")
            max_length: Maximum character length
            
        Returns:
            Conversational summary string
            
        Example (Preprocessing):
            summariser = InternetSummarise(converser_voice="first-person, reflective")
            essay = summariser.summarise_in_voice(
                content=research_text,
                format_type="philosophical_essay",
                max_length=4000
            )
            # Save to catalog for later use
        
        Example (Dynamic):
            summariser = InternetSummarise(converser_voice="casual, friendly")
            brief = summariser.summarise_in_voice(
                content=latest_news,
                format_type="brief",
                max_length=500
            )
            # Return in conversation
        """
        
        format_instructions = {
            "essay": "Write a thoughtful essay (3-4 paragraphs)",
            "reflection": "Write a personal reflection",
            "analysis": "Provide analytical summary",
            "brief": "Create a brief, conversational summary"
        }
        
        instruction = format_instructions.get(format_type, format_instructions["brief"])
        
        prompt = f"""{instruction} about this content in this voice: {self.converser_voice}

Maximum length: {max_length} characters

Content:
{content}"""
        
        response = self.client.chat.completions.create(
            model=self.deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": f"You are a writer creating content in this specific voice: {self.converser_voice}. {instruction}."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=max_length // 2,  # Rough token estimate
            temperature=0.7
        )
        
        return response.choices[0].message.content


# =============================================================================
# USAGE EXAMPLES
# =============================================================================

def example_preprocessing_workflow():
    """
    Example: Preprocessing workflow (Movivid-style)
    
    Build knowledge database BEFORE converser runs.
    """
    # 1. RESEARCH film themes
    researcher = InternetResearch()
    research_text = researcher.research_topic(
        topic="The Matrix 1999",
        focus="philosophical themes, symbolism, cultural impact"
    )
    
    # 2. CATEGORISE into structured data
    categoriser = InternetCategorise()
    structured_data = categoriser.categorise_text(
        text=research_text,
        categories=["themes", "life_situations", "emotions", "key_insights"]
    )
    
    # 3. SUMMARISE into converser's voice
    summariser = InternetSummarise(converser_voice="first-person, warm, philosophical")
    
    philosophical_essay = summariser.summarise_in_voice(
        content=research_text,
        format_type="essay",
        max_length=4000
    )
    
    personal_reflection = summariser.summarise_in_voice(
        content=research_text,
        format_type="reflection",
        max_length=4000
    )
    
    # 4. Save to catalog
    catalog_entry = {
        "title": "The Matrix",
        "year": 1999,
        "movivid": {
            **structured_data,
            "philosophical_context": philosophical_essay,
            "personal_reflection": personal_reflection
        }
    }
    
    print("Preprocessing complete! Catalog entry created.")
    return catalog_entry


def example_dynamic_workflow(user_query: str):
    """
    Example: Dynamic workflow (runtime)
    
    Fetch and process information DURING conversation.
    """
    # 1. RESEARCH based on user query
    researcher = InternetResearch()
    research_text = researcher.research_topic(
        topic=user_query,
        context="User is asking about recent developments"
    )
    
    # 2. CATEGORISE relevant information
    categoriser = InternetCategorise()
    key_points = categoriser.categorise_text(
        text=research_text,
        categories=["main_points", "sources", "date"]
    )
    
    # 3. SUMMARISE for immediate response
    summariser = InternetSummarise(converser_voice="casual, helpful")
    response = summariser.summarise_in_voice(
        content=research_text,
        format_type="brief",
        max_length=500
    )
    
    return response


# =============================================================================
# DECISION GUIDE: When to Use Which Approach
# =============================================================================

"""
PREPROCESSING (Static) - Build database first
✅ Use when:
- Domain is well-defined and curated
- Quality > real-time freshness
- Content needs deep analysis
- Want to review/edit before use
- Conversational voice requires careful tuning

Example domains:
- Philosophy, literature, classic films
- Historical events, biographies
- Art analysis, music theory

DYNAMIC (Runtime) - Fetch during conversation
✅ Use when:
- Need real-time/current information
- User queries are unpredictable
- Domain is vast and ever-changing
- Freshness > careful curation
- Quick responses acceptable

Example domains:
- News, current events, trends
- Stock prices, weather, sports scores
- User-specific lookups (addresses, menus)
- Discovery/exploration of new content
"""
