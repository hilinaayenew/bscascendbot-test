---
description: "Instructions for UnogsWrapper - the Netflix catalog API wrapper. Use when integrating uNoGS API for Netflix film search, availability checking, and catalog filtering with Movivid or other applications."
applyTo: "**/unogs_wrapper.py"
---

# UnogsWrapper - Netflix Catalog API Integration

## Overview

`unogs_wrapper.py` provides a Python wrapper for the **uNoGS API** (unofficial Netflix online Global Search) via RapidAPI. It enables querying the Netflix catalog to find films, check availability, and retrieve Netflix-specific metadata.

**Key Purpose**: Determine which films are currently available on Netflix for Movivid's curated catalog.

---

## Architecture

### Class Structure

```
APIWrapper (base class)
    ↓
UnogsWrapper (Netflix catalog)
    ↓
Methods: search, filter, check availability
```

### Core Components

**1. UnogsWrapper Class**
- Inherits from `APIWrapper` for request handling and retry logic
- Manages RapidAPI authentication headers
- Provides Netflix-specific query methods

**2. Factory Function**
- `create_unogs_wrapper()` - Instantiates with environment variables

**3. Key Methods**
- `search_movies()` - Search Netflix catalog
- `get_top_movies()` - Get highest-rated films
- `get_movie_by_imdb_id()` - Find film by IMDb ID
- `is_on_netflix()` - Check availability by region
- `get_available_countries()` - See where film is available

---

## Setup and Authentication

### 1. RapidAPI Subscription

**Required**: Active subscription to uNoGS API on RapidAPI

**Steps to activate**:
1. Go to https://rapidapi.com/unogs/api/unogs/
2. Sign up or log in to RapidAPI
3. Choose a subscription plan:
   - **Basic**: 100 requests/day
   - **Pro**: 500+ requests/day (recommended for development)
   - **Ultra/Mega**: Higher limits for production
4. Subscribe and confirm API key

### 2. Environment Variables

Add to `.env` file:
```bash
# uNoGS API Configuration (Netflix catalog data via RapidAPI)
# Requires active RapidAPI subscription to unogs-unogs-v1
UNOGS_RAPIDAPI_KEY=your_rapidapi_key_here
UNOGS_RAPIDAPI_HOST=unogs-unogs-v1.p.rapidapi.com
```

### 3. Test Connection

```python
from unogs_wrapper import create_unogs_wrapper

unogs = create_unogs_wrapper()

if unogs.test_connection():
    print("✓ Connected to uNoGS API")
else:
    print("✗ Connection failed - check subscription")
```

---

## Usage Patterns

### Pattern 1: Get Top-Rated Films for Movivid

**Use case**: Build initial "Movivid 100" catalog

```python
from unogs_wrapper import create_unogs_wrapper

unogs = create_unogs_wrapper()

# Get top 20 movies with high ratings from 2000 onwards
top_movies = unogs.get_top_movies(
    limit=20,
    rating_min=7.5,
    year_min=2000,
    country="78"  # US Netflix
)

for movie in top_movies:
    print(f"{movie['title']} ({movie['year']}) - {movie['rating']}/10")
    print(f"  IMDb ID: {movie['imdb_id']}")
    print(f"  Netflix ID: {movie['netflix_id']}")
```

### Pattern 2: Search by Genre

**Use case**: Find films in specific genres for thematic curation

```python
# Get top dramas
dramas = unogs.get_movies_by_genre(
    genre="Drama",
    limit=10,
    rating_min=7.0
)

# Get psychological thrillers
thrillers = unogs.get_movies_by_genre(
    genre="Thriller",
    limit=10,
    rating_min=7.0
)
```

### Pattern 3: Check Netflix Availability

**Use case**: Verify if a film is still on Netflix before recommending

```python
# Check if specific film is on Netflix
imdb_id = "tt0133093"  # The Matrix

if unogs.is_on_netflix(imdb_id, country="78"):
    print("✓ Available on US Netflix")
    
    # Get full details
    movie = unogs.get_movie_by_imdb_id(imdb_id)
    print(f"Title: {movie['title']}")
    print(f"Year: {movie['year']}")
    print(f"Rating: {movie['rating']}")
else:
    print("✗ Not currently on Netflix")
```

### Pattern 4: Search by Title or Actor

**Use case**: Find specific films or films by a director/actor

```python
# Search for films by director
spielberg_films = unogs.search_movies(
    query="Steven Spielberg",
    limit=10,
    order_by="rating"
)

# Search for specific title
matrix_results = unogs.search_movies(
    query="Matrix",
    limit=5
)
```

### Pattern 5: Filter by Multiple Criteria

**Use case**: Find films matching specific requirements

```python
# Get recent high-rated sci-fi films
scifi_gems = unogs.search_movies(
    genre="Sci-Fi",
    year_min=2010,
    year_max=2024,
    rating_min=7.5,
    limit=15,
    order_by="rating",
    country_list="78"  # US
)
```

---

## Data API Integration for Movivid

### Combined Workflow: uNoGS + OMDb

**Step 1**: Get films from uNoGS (Netflix availability)
```python
from unogs_wrapper import create_unogs_wrapper
from omdb_wrapper import create_omdb_wrapper

unogs = create_unogs_wrapper()
omdb = create_omdb_wrapper()

# Get top Netflix films
netflix_films = unogs.get_top_movies(limit=20, rating_min=7.0)
```

**Step 2**: Enrich with OMDb data (detailed info)
```python
movivid_catalog = []

for film in netflix_films:
    imdb_id = film['imdb_id']
    
    # Get detailed film info from OMDb
    omdb_data = omdb.get_movie_details(imdb_id)
    
    # Combine data
    movivid_entry = {
        "imdb_id": imdb_id,
        "netflix_id": film['netflix_id'],
        "title": omdb_data['Title'],
        "year": omdb_data['Year'],
        "director": omdb_data['Director'],
        "genre": omdb_data['Genre'],
        "plot": omdb_data['Plot'],
        "ratings": omdb.get_all_ratings(imdb_id),
        "on_netflix": True,
        "netflix_countries": ["US"],  # Can get full list with get_available_countries
        # Add Movivid thematic data later
        "themes": [],
        "life_situations": [],
        "movivid_learned": ""
    }
    
    movivid_catalog.append(movivid_entry)

# Save catalog
import json
with open('movivid_catalog.json', 'w') as f:
    json.dump(movivid_catalog, f, indent=2)
```

**Step 3**: Add thematic preprocessing (manual or GPT-assisted)
```python
# For each film in catalog, add:
# - Themes (identity, loss, purpose, etc.)
# - Life situations (grief, isolation, career change, etc.)
# - Emotions (hope, confusion, empowerment, etc.)
# - What Movivid learned (first-person insight)
# - Spoiler-free summary
```

---

## Response Data Structure

### Movie Object from uNoGS

```json
{
  "netflix_id": "70142441",
  "title": "The Shawshank Redemption",
  "year": "1994",
  "rating": "9.3",
  "synopsis": "Two imprisoned men bond over...",
  "image": "https://...",
  "imdb_id": "tt0111161",
  "type": "movie",
  "runtime": "142",
  "poster": "...",
  "top250": "1",
  "top250tv": "0",
  "genre_ids": ["18"],  // Drama
  "directors": ["Frank Darabont"],
  "actors": ["Tim Robbins", "Morgan Freeman"]
}
```

### Key Fields

- **netflix_id**: Netflix internal ID
- **imdb_id**: IMDb ID (use with OMDb)
- **rating**: IMDb rating (0-10)
- **year**: Release year
- **genre_ids**: Numeric genre codes
- **runtime**: Length in minutes
- **top250**: Top 250 ranking (if applicable)

---

## API Limits and Best Practices

### Rate Limits
- **Basic plan**: 100 requests/day
- **Pro plan**: 500 requests/day
- **Response time**: Usually < 2 seconds

### Best Practices

✅ **Cache results**: Store catalog locally, refresh weekly/monthly  
✅ **Batch queries**: Get all needed films in one session  
✅ **Check limits**: Monitor request count via `get_stats()`  
✅ **Handle errors**: Use try/except for all API calls  
✅ **Test first**: Always test connection before bulk operations

❌ **Don't**: Query same film repeatedly  
❌ **Don't**: Make unnecessary calls (cache everything)  
❌ **Don't**: Exceed rate limits (implement backoff)

### Caching Strategy

```python
import json
from datetime import datetime, timedelta

class NetflixCatalogCache:
    """Cache Netflix catalog data to minimize API calls."""
    
    def __init__(self, cache_file='netflix_cache.json', ttl_days=7):
        self.cache_file = cache_file
        self.ttl = timedelta(days=ttl_days)
        self.cache = self._load_cache()
    
    def _load_cache(self):
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {"updated": None, "films": []}
    
    def _save_cache(self):
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
    
    def is_stale(self):
        if not self.cache.get("updated"):
            return True
        
        updated = datetime.fromisoformat(self.cache["updated"])
        return datetime.now() - updated > self.ttl
    
    def get_films(self):
        if self.is_stale():
            return None
        return self.cache["films"]
    
    def update(self, films):
        self.cache = {
            "updated": datetime.now().isoformat(),
            "films": films
        }
        self._save_cache()
```

---

## Error Handling

### Common Errors

**1. Subscription Not Active**
```
Error: "You are not subscribed to this API"
Solution: Activate RapidAPI subscription
```

**2. Invalid API Key**
```
Error: 401 Unauthorized
Solution: Check UNOGS_RAPIDAPI_KEY in .env
```

**3. Rate Limit Exceeded**
```
Error: 429 Too Many Requests
Solution: Wait or upgrade plan
```

**4. No Results Found**
```
Returns: Empty list []
Solution: Normal - film not on Netflix or wrong search params
```

### Error Handling Pattern

```python
try:
    movies = unogs.get_top_movies(limit=20)
    if not movies:
        print("No results found - check search parameters")
    else:
        # Process movies
        pass
except Exception as e:
    print(f"API error: {e}")
    # Fall back to cached data
    movies = load_cached_catalog()
```

---

## Testing

### Unit Test Example

```python
import unittest
from unogs_wrapper import create_unogs_wrapper

class TestUnogsWrapper(unittest.TestCase):
    def setUp(self):
        self.unogs = create_unogs_wrapper()
    
    def test_connection(self):
        """Test API connection"""
        self.assertTrue(self.unogs.test_connection())
    
    def test_get_top_movies(self):
        """Test retrieving top movies"""
        movies = self.unogs.get_top_movies(limit=5)
        self.assertIsInstance(movies, list)
        self.assertGreater(len(movies), 0)
        
        # Check required fields
        movie = movies[0]
        self.assertIn('title', movie)
        self.assertIn('imdb_id', movie)
        self.assertIn('netflix_id', movie)
    
    def test_search_by_title(self):
        """Test title search"""
        results = self.unogs.search_movies(query="Inception")
        self.assertIsInstance(results, list)
    
    def test_is_on_netflix(self):
        """Test availability check"""
        # Use a likely-to-be-available film
        result = self.unogs.is_on_netflix("tt0111161")  # Shawshank
        self.assertIsInstance(result, bool)
```

---

## Integration with Movivid

### Use Cases in Movivid

1. **Initial Catalog Building**
   - Get top 100 films from Netflix
   - Filter by rating and themes
   - Create base catalog for preprocessing

2. **Regular Updates**
   - Weekly/monthly sync to check availability
   - Add new releases
   - Remove films no longer on Netflix

3. **User Queries**
   - Verify film is still available before recommending
   - Show Netflix regions where film is available
   - Suggest alternatives if film removed

4. **Discovery Functions**
   - Find similar films by genre
   - Discover new additions
   - Filter by multiple criteria

### Example Movivid Function

```python
class RecommendFilmForLifeSituation(ChatFunction):
    """Recommend film based on user's life situation."""
    
    async def execute(self, situation: str):
        # 1. Search Movivid catalog for matching themes
        matches = search_catalog_by_situation(situation)
        
        # 2. Check which are still on Netflix
        available = []
        for film in matches:
            if self.unogs.is_on_netflix(film['imdb_id']):
                available.append(film)
        
        # 3. Return top recommendation
        if available:
            return format_recommendation(available[0], situation)
        else:
            return "Let me find an alternative..."
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check API usage stats
- Verify catalog freshness
- Test connection

**Monthly**:
- Refresh full catalog
- Update film availability
- Check for deprecated films

**Quarterly**:
- Review subscription plan
- Audit cache size
- Update genre mappings

### Monitoring

```python
# Check API health
stats = unogs.get_stats()
print(f"Requests today: {stats['total_requests']}")
print(f"Success rate: {stats['success_rate']}%")

if stats['success_rate'] < 95:
    print("⚠️ High error rate - check API status")
```

---

## Summary

**UnogsWrapper** provides Netflix catalog access for Movivid, enabling:
- ✅ Top film discovery
- ✅ Availability checking
- ✅ Genre filtering
- ✅ IMDb ID linking (with OMDb)
- ✅ Regional availability tracking

**Key workflow**: uNoGS (Netflix catalog) + OMDb (film details) + Manual curation (themes) = Movivid catalog

**Next step**: Use this wrapper to build the initial 20-film prototype catalog.
