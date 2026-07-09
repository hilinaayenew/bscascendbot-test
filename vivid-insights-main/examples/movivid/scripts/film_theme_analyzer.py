"""
Film Theme Analyzer using Azure OpenAI with Web Search

Automatically generates thematic metadata for Movivid catalog:
- Themes (identity, loss, purpose, etc.)
- Life situations (grief, career change, isolation, etc.)
- Philosophical focus (core meaning)
- Movivid's learned insights (first-person reflections)
"""

import os
import json
from typing import Dict, List, Any, Optional
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()


class FilmThemeAnalyzer:
    """
    Analyzes films using GPT with web search to extract themes,
    life situations, and philosophical insights for Movivid.
    """
    
    def __init__(self):
        """Initialize Azure OpenAI client."""
        self.client = AzureOpenAI(
            api_key=os.getenv('AZURE_OPENAI_API_KEY'),
            api_version=os.getenv('AZURE_OPENAI_API_VERSION', '2024-02-15-preview'),
            azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT')
        )
        self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
    
    def analyze_film(
        self, 
        title: str, 
        year: str, 
        director: str,
        plot: str,
        imdb_rating: str
    ) -> Dict[str, Any]:
        """
        Analyze a film to extract thematic metadata for Movivid.
        
        Args:
            title: Film title
            year: Release year
            director: Director name
            plot: Film plot summary
            imdb_rating: IMDb rating
            
        Returns:
            Dictionary with themes, life_situations, philosophical_focus, movivid_learned
        """
        
        prompt = f"""You are analyzing the film "{title}" ({year}) directed by {director} for Movivid - a life counseling converser that recommends films to help people navigate life challenges.

Film Plot: {plot}
IMDb Rating: {imdb_rating}/10

Please analyze this film and provide:

1. **Themes** (3-6 keywords): Universal philosophical themes explored in the film
   Examples: identity, loss, purpose, freedom, connection, grief, rebellion, meaning, isolation, growth, acceptance, family, love, time, memory, choice, destiny, mortality, hope

2. **Life Situations** (3-5 keywords): Specific life challenges or situations where this film could help someone
   Examples: career_change, relationship_ending, loss_of_parent, feeling_stuck, questioning_identity, facing_mortality, empty_nest, midlife_crisis, loneliness, burnout, grief, isolation, finding_purpose, major_decision

3. **Emotions** (3-5 keywords): Primary emotional experiences in the film
   Examples: hope, confusion, empowerment, despair, joy, nostalgia, anxiety, peace, anger, wonder, melancholy, liberation

4. **Philosophical Focus** (2-3 sentences): The core philosophical question or meaning the film explores

5. **Movivid's Learned** (2-3 sentences, FIRST-PERSON): Write as Movivid reflecting on personal takeaway from the film
   Use language like: "What I got from this film was...", "For me, this film showed...", "I found myself thinking about..."
   Be warm, personal, and reflective - like sharing wisdom with a friend

6. **Spoiler-Free Summary** (2-3 sentences): A brief summary that doesn't reveal plot twists, suitable for conversation

7. **Character Journey** (1-2 sentences): The main character's emotional/philosophical arc

8. **Suitable For** (2-4 contexts): When would you recommend this film to someone?
   Examples: "questioning_life_direction", "processing_grief", "relationship_difficulties", "finding_purpose", "facing_change", "dealing_with_loss", "feeling_isolated", "seeking_meaning"

Please search the web for critical analyses, philosophical discussions, and thematic interpretations of this film to inform your response.

Return your analysis in this EXACT JSON format:
{{
  "themes": ["theme1", "theme2", "theme3"],
  "life_situations": ["situation1", "situation2"],
  "emotions": ["emotion1", "emotion2"],
  "philosophical_focus": "...",
  "movivid_learned": "...",
  "spoiler_free_summary": "...",
  "character_journey": "...",
  "suitable_for": ["context1", "context2"]
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a film analyst specializing in philosophical themes and life meaning. You provide thoughtful, empathetic analysis of how films can help people navigate life challenges."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_completion_tokens=1000
            )
            
            # Extract and parse JSON from response
            content = response.choices[0].message.content
            
            # Find JSON in response (may be wrapped in markdown)
            start = content.find('{')
            end = content.rfind('}') + 1
            
            if start != -1 and end > start:
                json_str = content[start:end]
                result = json.loads(json_str)
                return result
            else:
                print(f"Warning: Could not parse JSON from response for {title}")
                return self._get_default_structure()
                
        except Exception as e:
            print(f"Error analyzing {title}: {e}")
            return self._get_default_structure()
    
    def _get_default_structure(self) -> Dict[str, Any]:
        """Return default empty structure if analysis fails."""
        return {
            "themes": [],
            "life_situations": [],
            "emotions": [],
            "philosophical_focus": "",
            "movivid_learned": "",
            "spoiler_free_summary": "",
            "character_journey": "",
            "suitable_for": []
        }


def analyze_catalog(input_file: str = "movivid_catalog_curated.json", output_file: str = "movivid_catalog_analyzed.json"):
    """
    Analyze all films in catalog and save enriched version.
    
    Args:
        input_file: Path to input catalog JSON
        output_file: Path to save analyzed catalog
    """
    print("Film Theme Analyzer for Movivid")
    print("=" * 70)
    
    # Load catalog
    with open(input_file, 'r') as f:
        catalog = json.load(f)
    
    print(f"\nLoaded {len(catalog)} films from {input_file}")
    print("\nAnalyzing films with Azure OpenAI + Web Search...")
    print("=" * 70)
    
    analyzer = FilmThemeAnalyzer()
    
    for i, film in enumerate(catalog, 1):
        title = film.get('title', 'Unknown')
        year = film.get('year', 'N/A')
        director = film.get('director', 'N/A')
        plot = film.get('plot', 'N/A')
        imdb_rating = film.get('ratings', {}).get('imdb', 'N/A')
        
        print(f"\n[{i}/{len(catalog)}] Analyzing: {title} ({year})")
        print(f"   Director: {director}")
        print(f"   IMDb: {imdb_rating}/10")
        
        # Analyze film
        analysis = analyzer.analyze_film(title, year, director, plot, imdb_rating)
        
        # Update movivid section
        film['movivid'] = {
            "themes": analysis['themes'],
            "life_situations": analysis['life_situations'],
            "emotions": analysis['emotions'],
            "philosophical_focus": analysis['philosophical_focus'],
            "movivid_learned": analysis['movivid_learned'],
            "spoiler_free_summary": analysis['spoiler_free_summary'],
            "character_journey": analysis['character_journey'],
            "suitable_for": analysis['suitable_for'],
            "spoiler_policy": "spoiler_free"
        }
        
        # Show results
        print(f"   ✅ Themes: {', '.join(analysis['themes'][:3])}")
        print(f"   ✅ Life Situations: {', '.join(analysis['life_situations'][:2])}")
        print(f"   ✅ Philosophical Focus: {analysis['philosophical_focus'][:60]}...")
    
    # Save analyzed catalog
    with open(output_file, 'w') as f:
        json.dump(catalog, f, indent=2)
    
    print(f"\n{'=' * 70}")
    print(f"✅ Analysis Complete!")
    print(f"💾 Saved to: {output_file}")
    print(f"{'=' * 70}")
    
    # Show summary statistics
    print("\n📊 Analysis Summary:")
    all_themes = set()
    all_situations = set()
    for film in catalog:
        all_themes.update(film['movivid']['themes'])
        all_situations.update(film['movivid']['life_situations'])
    
    print(f"   Total unique themes: {len(all_themes)}")
    print(f"   Total unique life situations: {len(all_situations)}")
    print(f"\n   Common themes: {', '.join(list(all_themes)[:10])}")
    print(f"   Common situations: {', '.join(list(all_situations)[:10])}")


if __name__ == "__main__":
    analyze_catalog()
