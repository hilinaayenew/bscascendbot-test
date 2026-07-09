"""
Build Movivid Catalog - Prototype with Top 20 Netflix Films

This script fetches the top 20 rated films from Netflix (via uNoGS API),
enriches them with detailed information from OMDb API, and creates the
initial Movivid catalog for thematic preprocessing.
"""

import os
import json
from datetime import datetime
from dotenv import load_dotenv
from unogs_wrapper import create_unogs_wrapper
from omdb_wrapper import create_omdb_wrapper

load_dotenv()


def build_movivid_catalog(num_films=20):
    """
    Build the Movivid catalog with top Netflix films.
    
    Args:
        num_films: Number of films to include (default: 20)
    
    Returns:
        List of film dictionaries ready for thematic preprocessing
    """
    print(f"Building Movivid Catalog with {num_films} films...")
    print("="*70)
    
    # Initialize API wrappers
    print("\n1. Initializing API connections...")
    try:
        unogs = create_unogs_wrapper()
        omdb = create_omdb_wrapper()
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("\nMake sure your .env file contains:")
        print("  UNOGS_RAPIDAPI_KEY=your_key_here")
        print("  OMDB_API_KEY=your_key_here")
        return None
    
    # Test connections
    print("   Testing uNoGS connection...")
    if not unogs.test_connection():
        print("   ❌ uNoGS connection failed!")
        print("   Please activate your RapidAPI subscription.")
        print("   See UNOGS_ACTIVATION.md for instructions.")
        return None
    print("   ✅ uNoGS connected")
    
    print("   Testing OMDb connection...")
    if not omdb.test_connection():
        print("   ❌ OMDb connection failed!")
        print("   Check your OMDB_API_KEY in .env")
        return None
    print("   ✅ OMDb connected")
    
    # Get top films from Netflix
    print(f"\n2. Fetching films from Netflix...")
    # Start with broader criteria since many new films lack ratings
    netflix_films = unogs.get_top_movies(
        limit=num_films,
        rating_min=0.0,      # Accept all ratings initially
        year_min=1990,       # Modern enough for relatability
        country="78"         # US Netflix
    )
    
    if not netflix_films:
        print("   ❌ No films found. Check uNoGS API status.")
        return None
    
    print(f"   ✅ Found {len(netflix_films)} films on Netflix")
    
    # Build catalog by enriching with OMDb data
    print("\n3. Enriching with OMDb data...")
    catalog = []
    
    for i, film in enumerate(netflix_films, 1):
        imdb_id = film.get('imdb_id')
        title = film.get('title', 'Unknown')
        
        print(f"   [{i}/{len(netflix_films)}] Processing: {title}...")
        
        if not imdb_id:
            print(f"      ⚠️  No IMDb ID, skipping")
            continue
        
        try:
            # Get detailed info from OMDb
            omdb_data = omdb.get_movie_details(imdb_id)
            ratings = omdb.get_all_ratings(imdb_id)
            
            # Create catalog entry
            entry = {
                # Identifiers
                "imdb_id": imdb_id,
                "netflix_id": film.get('netflix_id'),
                
                # Basic info (from OMDb)
                "title": omdb_data.get('Title', title),
                "year": omdb_data.get('Year', film.get('year')),
                "director": omdb_data.get('Director', 'Unknown'),
                "genre": omdb_data.get('Genre', 'Unknown'),
                "runtime": omdb_data.get('Runtime', 'Unknown'),
                "rated": omdb_data.get('Rated', 'Not Rated'),
                
                # Plot and actors
                "plot": omdb_data.get('Plot', ''),
                "actors": omdb_data.get('Actors', ''),
                "writer": omdb_data.get('Writer', ''),
                
                # Ratings
                "ratings": {
                    "imdb": ratings.get('imdb_rating', 'N/A'),
                    "rotten_tomatoes": next(
                        (r['Value'] for r in ratings.get('Ratings', []) 
                         if r['Source'] == 'Rotten Tomatoes'), 
                        'N/A'
                    ),
                    "metacritic": next(
                        (r['Value'] for r in ratings.get('Ratings', []) 
                         if r['Source'] == 'Metacritic'), 
                        'N/A'
                    )
                },
                
                # Netflix info
                "netflix": {
                    "available": True,
                    "countries": ["US"],
                    "netflix_url": f"https://www.netflix.com/title/{film.get('netflix_id')}"
                },
                
                # Movivid-specific (to be filled in during preprocessing)
                "movivid": {
                    "themes": [],
                    "life_situations": [],
                    "emotions": [],
                    "philosophical_focus": "",
                    "movivid_learned": "",
                    "spoiler_free_summary": "",
                    "character_journey": "",
                    "suitable_for": [],
                    "spoiler_policy": "spoiler_free"  # default
                },
                
                # Metadata
                "added_to_catalog": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "source": "uNoGS + OMDb"
            }
            
            catalog.append(entry)
            print(f"      ✅ Added to catalog")
            
        except Exception as e:
            print(f"      ❌ Error: {e}")
            continue
    
    print(f"\n4. Catalog complete: {len(catalog)} films processed")
    
    return catalog


def save_catalog(catalog, filename='movivid_catalog_prototype.json'):
    """Save catalog to JSON file."""
    with open(filename, 'w') as f:
        json.dump(catalog, f, indent=2)
    print(f"\n✅ Catalog saved to: {filename}")


def print_catalog_summary(catalog):
    """Print summary of catalog."""
    print("\n" + "="*70)
    print("MOVIVID CATALOG PROTOTYPE")
    print("="*70)
    
    for i, film in enumerate(catalog, 1):
        print(f"\n{i}. {film['title']} ({film['year']})")
        print(f"   Director: {film['director']}")
        print(f"   Genre: {film['genre']}")
        print(f"   IMDb: {film['ratings']['imdb']}/10")
        print(f"   Plot: {film['plot'][:100]}...")
        print(f"   IMDb ID: {film['imdb_id']}")
    
    print("\n" + "="*70)
    print(f"Total films in catalog: {len(catalog)}")
    print("\nNext steps:")
    print("1. Review the films in movivid_catalog_prototype.json")
    print("2. Begin thematic preprocessing (add themes, life_situations, etc.)")
    print("3. Write Movivid's learnings for each film")
    print("4. Test with Movivid functions")
    print("="*70)


if __name__ == "__main__":
    # Build catalog
    catalog = build_movivid_catalog(num_films=20)
    
    if catalog:
        # Save to file
        save_catalog(catalog)
        
        # Print summary
        print_catalog_summary(catalog)
        
        # Print API usage stats
        print("\nAPI Usage Statistics:")
        print("-"*70)
        
        from unogs_wrapper import create_unogs_wrapper
        from omdb_wrapper import create_omdb_wrapper
        
        unogs = create_unogs_wrapper()
        omdb = create_omdb_wrapper()
        
        unogs_stats = unogs.get_stats()
        omdb_stats = omdb.get_stats()
        
        print(f"uNoGS: {unogs_stats['total_requests']} requests, "
              f"{unogs_stats['success_rate']:.0f}% success")
        print(f"OMDb:  {omdb_stats['total_requests']} requests, "
              f"{omdb_stats['success_rate']:.0f}% success")
    else:
        print("\n❌ Catalog build failed. Check errors above.")
