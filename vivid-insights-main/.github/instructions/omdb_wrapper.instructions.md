---
description: "Instructions for OMDBWrapper - the movie database API wrapper. Use when integrating IMDb/OMDb API for film search, ratings, and details with Movivid or other applications."
applyTo: "**/omdb_wrapper.py"
---

# OMDBWrapper - Movie Database API Wrapper

**OMDBWrapper** provides structured access to the OMDb API (Open Movie Database) for searching films, getting ratings, and retrieving movie details.

## API Information

**Service**: OMDb API (http://www.omdbapi.com/)  
**API Key**: Free key required - get at http://www.omdbapi.com/apikey.aspx  
**Base URL**: `http://www.omdbapi.com`  
**Inherits from**: `APIWrapper` (base class in `api_wrapper.py`)

## Core Methods

### Search Movies

```python
search_movies(query: str, year: Optional[int] = None, media_type: str = "movie") -> List[Dict]
```

Search for movies by title. Returns list of results with `imdbID`, `Title`, `Year`, `Type`.

**Example**:
```python
results = imdb.search_movies("The Matrix")
for movie in results:
    print(f"{movie['Title']} ({movie['Year']}) - ID: {movie['imdbID']}")
```

### Get Movie Details

```python
get_movie_details(imdb_id: str, full_plot: bool = False) -> Optional[Dict]
```

Get full details for a specific movie by IMDb ID. Returns dictionary with:
- `Title`, `Year`, `Director`, `Actors`
- `imdbRating`, `imdbVotes`, `Metascore`
- `Plot`, `Genre`, `Runtime`, `Awards`

**Example**:
```python
details = omdb.get_movie_details("tt0133093")  # The Matrix
print(f"{details['Title']} - {details['imdbRating']}/10")
print(f"Plot: {details['Plot']}")
```

### Get Rating

```python
get_rating(imdb_id: str) -> Optional[float]
```

Quick method to get just the IMDb rating (0-10).

**Example**:
```python
rating = omdb.get_rating("tt0133093")
print(f"Rating: {rating}/10")
```

### Get All Ratings

```python
get_all_ratings(imdb_id: str) -> Dict[str, Any]
```

Get ratings from multiple sources (IMDb, Rotten Tomatoes, Metacritic).

**Example**:
```python
ratings = omdb.get_all_ratings("tt0133093")
print(f"IMDb: {ratings['imdbRating']}/10")
for source in ratings['Ratings']:
    print(f"{source['Source']}: {source['Value']}")
```

### Find Movie ID

```python
find_movie_id(title: str, year: Optional[int] = None) -> Optional[str]
```

Convenience method to get IMDb ID from title.

**Example**:
```python
movie_id = omdb.find_movie_id("The Matrix", year=1999)
# Returns: "tt0133093"
```

### Get Movie Summary

```python
get_movie_summary(title: str, year: Optional[int] = None) -> Optional[Dict]
```

One-step method: search by title and return full details.

**Example**:
```python
summary = omdb.get_movie_summary("2001: A Space Odyssey", year=1968)
print(f"{summary['Title']} - {summary['imdbRating']}/10")
print(summary['Plot'])
```

## Usage Pattern

### Basic Setup

```python
from omdb_wrapper import create_omdb_wrapper

# Initialize with API key
omdb = create_omdb_wrapper(api_key="YOUR_API_KEY")
```

### Search and Details Workflow

```python
# 1. Search for a movie
results = omdb.search_movies("Blade Runner")

# 2. Get the first result's ID
if results:
    movie_id = results[0]['imdbID']
    
    # 3. Get full details
    details = omdb.get_movie_details(movie_id)
    
    print(f"{details['Title']} ({details['Year']})")
    print(f"Director: {details['Director']}")
    print(f"Rating: {details['imdbRating']}/10")
    print(f"Plot: {details['Plot']}")
```

### Quick Summary by Title

```python
# One-step: title to full details
summary = omdb.get_movie_summary("The Shawshank Redemption", year=1994)

if summary:
    print(f"{summary['Title']}")
    print(f"Rating: {summary['imdbRating']}/10")
    print(f"Actors: {summary['Actors']}")
    print(f"Plot: {summary['Plot']}")
```

## Integration with Movivid

Movivid can use OMDBWrapper to enrich movie conversations:

```python
from movivid import create_movivid
from omdb_wrapper import create_omdb_wrapper

# Setup
movivid = create_movivid()
omdb = create_omdb_wrapper(api_key="YOUR_API_KEY")

# User asks about a film
user_query = "Tell me about The Matrix"

# 1. Extract movie title from query
# 2. Get details from IMDb
details = omdb.get_movie_summary("The Matrix", year=1999)

# 3. Build context for Movivid
context = f"""
Movie: {details['Title']} ({details['Year']})
Director: {details['Director']}
Rating: {details['imdbRating']}/10
Plot: {details['Plot']}
Genre: {details['Genre']}
"""

# 4. Add to conversation with enriched context
movivid.add_to_history("user", f"{user_query}\n\nContext: {context}")

# 5. Get Movivid's philosophical analysis via AI...
```

## API Response Structure

### Search Results

```python
[
    {
        "Title": "The Matrix",
        "Year": "1999",
        "imdbID": "tt0133093",
        "Type": "movie",
        "Poster": "https://..."
    },
    ...
]
```

### Movie Details

```python
{
    "Title": "The Matrix",
    "Year": "1999",
    "Rated": "R",
    "Released": "31 Mar 1999",
    "Runtime": "136 min",
    "Genre": "Action, Sci-Fi",
    "Director": "Lana Wachowski, Lilly Wachowski",
    "Writer": "Lilly Wachowski, Lana Wachowski",
    "Actors": "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss",
    "Plot": "...",
    "Language": "English",
    "Country": "United States, Australia",
    "Awards": "Won 4 Oscars. 42 wins & 52 nominations total",
    "Poster": "https://...",
    "Ratings": [
        {"Source": "Internet Movie Database", "Value": "8.7/10"},
        {"Source": "Rotten Tomatoes", "Value": "88%"},
        {"Source": "Metacritic", "Value": "73/100"}
    ],
    "Metascore": "73",
    "imdbRating": "8.7",
    "imdbVotes": "1,900,000",
    "imdbID": "tt0133093",
    "Type": "movie",
    "Response": "True"
}
```

## Error Handling

The wrapper handles errors gracefully:

```python
# Returns empty list if search fails
results = omdb.search_movies("NonexistentMovie123456")
# results = []

# Returns None if details not found
details = omdb.get_movie_details("invalid_id")
# details = None

# Always check for None/empty
if details:
    print(details['Title'])
else:
    print("Movie not found")
```

## API Statistics

Track API usage:

```python
stats = omdb.get_stats()
print(f"Total requests: {stats['total_requests']}")
print(f"Errors: {stats['errors']}")
print(f"Success rate: {stats['success_rate']:.1f}%")
```

## Testing

### Basic Connection Test

```python
if omdb.test_connection():
    print("✓ API connection working")
else:
    print("✗ API connection failed")
```

### Full Test Script

```bash
# Get API key from http://www.omdbapi.com/apikey.aspx
python omdb_wrapper.py YOUR_API_KEY
```

## Rate Limiting

OMDb API has rate limits based on your plan:
- **Free tier**: 1,000 requests/day
- **Patreon tier**: 100,000 requests/day

The wrapper includes retry logic (3 attempts with exponential backoff).

## Extending OMDBWrapper

Add custom methods for specific use cases:

```python
class EnhancedOMDBWrapper(OMDBWrapper):
    def get_philosophical_films(self, limit: int = 10) -> List[Dict]:
        """Search for films with philosophical themes."""
        keywords = ["meaning", "existence", "consciousness", "reality"]
        results = []
        for keyword in keywords:
            results.extend(self.search_movies(keyword))
        return results[:limit]
    
    def compare_ratings(self, title1: str, title2: str) -> Dict:
        """Compare ratings of two films."""
        film1 = self.get_movie_summary(title1)
        film2 = self.get_movie_summary(title2)
        
        return {
            film1['Title']: film1['imdbRating'],
            film2['Title']: film2['imdbRating']
        }
```

## Common Use Cases

### 1. Movie Recommendation Enrichment

Get details for recommended films:

```python
recommendations = ["The Matrix", "Blade Runner", "2001: A Space Odyssey"]

for title in recommendations:
    summary = omdb.get_movie_summary(title)
    if summary:
        print(f"{summary['Title']} - {summary['imdbRating']}/10")
```

### 2. Rating Comparison

Compare multiple films:

```python
films = ["tt0133093", "tt0083658", "tt0062622"]  # Matrix, Blade Runner, 2001
ratings = [omdb.get_rating(film_id) for film_id in films]
print(f"Average rating: {sum(ratings) / len(ratings):.1f}/10")
```

### 3. Director Filmography

Search by director (requires filtering):

```python
results = omdb.search_movies("Kubrick")
# Filter and analyze results...
```

## Troubleshooting

### Invalid API Key

```
Error: Request failed... 401 Unauthorized
```

Solution: Check your API key at http://www.omdbapi.com/

### Rate Limit Exceeded

```
Error: Request failed... 429 Too Many Requests
```

Solution: Upgrade your OMDb plan or wait until daily limit resets.

### Movie Not Found

```python
results = omdb.search_movies("VeryObscureFilm")
# results = []
```

Try alternative titles, years, or check spelling.

## Reference Files

- **Base class**: `api_wrapper.py` - Generic API wrapper infrastructure
- **Converser integration**: `movivid.py` - Movie converser that can use OMDBWrapper
- **Documentation**: Official OMDb docs at http://www.omdbapi.com/

## Maintaining OMDBWrapper

When maintaining or extending:

1. **Preserve OMDb API compatibility** - Don't break existing method signatures
2. **Handle API changes** - OMDb may add/remove fields
3. **Test with real API calls** - Use your API key for testing
4. **Cache responses** - Consider adding caching for frequently accessed movies
5. **Monitor rate limits** - Track usage to stay within limits

OMDBWrapper is designed to integrate cleanly with Movivid and other conversers that need movie data.
