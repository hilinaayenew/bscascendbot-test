"""
uNoGS API Wrapper for Netflix Catalog Access

This module provides a Python wrapper for the uNoGS (unofficial Netflix online 
Global Search) API via RapidAPI. It enables querying the Netflix catalog, 
searching for films, and retrieving Netflix-specific metadata.

API Documentation: https://rapidapi.com/unogs/api/unogs/
"""

import os
import requests
from typing import Dict, List, Optional, Any
from api_wrapper import APIWrapper


class UnogsWrapper(APIWrapper):
    """
    Wrapper for uNoGS API (Netflix catalog data via RapidAPI).
    
    Provides methods to:
    - Search Netflix catalog
    - Get top-rated films
    - Filter by genre, year, rating
    - Check Netflix availability by region
    
    Requires active RapidAPI subscription to unogs-unogs-v1.
    """
    
    def __init__(
        self, 
        rapidapi_key: str,
        rapidapi_host: str = "unogs-unogs-v1.p.rapidapi.com",
        timeout: int = 10,
        retry_attempts: int = 3
    ):
        """
        Initialize uNoGS API wrapper.
        
        Args:
            rapidapi_key: RapidAPI key for uNoGS
            rapidapi_host: RapidAPI host (default: unogs-unogs-v1.p.rapidapi.com)
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts for failed requests
        """
        super().__init__(
            name="uNoGS",
            base_url="https://unogs-unogs-v1.p.rapidapi.com",
            api_key=rapidapi_key,
            timeout=timeout,
            retry_attempts=retry_attempts
        )
        self.rapidapi_host = rapidapi_host
        
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for RapidAPI requests."""
        return {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.rapidapi_host
        }
    
    def test_connection(self) -> bool:
        """
        Test connection to uNoGS API.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            # Try to get a single movie to test connection
            response = self.get(
                "/search/titles",
                params={"type": "movie", "limit": 1},
                headers=self._get_headers()
            )
            return response.get("total", 0) >= 0
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False
    
    def search_movies(
        self, 
        query: Optional[str] = None,
        limit: int = 20,
        order_by: str = "rating",
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        rating_min: Optional[float] = None,
        genre: Optional[str] = None,
        country_list: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for movies in Netflix catalog.
        
        Args:
            query: Search query string (title, actor, director)
            limit: Maximum number of results (default: 20)
            order_by: Sort by 'rating', 'date', 'title' (default: rating)
            year_min: Minimum release year
            year_max: Maximum release year
            rating_min: Minimum IMDb rating (0-10)
            genre: Genre filter (Drama, Comedy, Action, etc.)
            country_list: Netflix region codes (e.g., "78" for US)
        
        Returns:
            List of movie dictionaries with Netflix metadata
        """
        params = {
            "type": "movie",
            "limit": limit,
            "order_by": order_by
        }
        
        if query:
            params["query"] = query
        if year_min:
            params["start_year"] = year_min
        if year_max:
            params["end_year"] = year_max
        if rating_min:
            params["start_rating"] = rating_min
        if genre:
            params["genre"] = genre
        if country_list:
            params["country_list"] = country_list
        
        try:
            response = self.get(
                "/search/titles",
                params=params,
                headers=self._get_headers()
            )
            return response.get("results", [])
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def get_top_movies(
        self, 
        limit: int = 20,
        rating_min: float = 7.0,
        year_min: int = 2000,
        country: str = "78"  # US by default
    ) -> List[Dict[str, Any]]:
        """
        Get top-rated movies from Netflix catalog.
        
        Note: uNoGS API may not support all filtering simultaneously.
        This method fetches movies and filters them client-side if needed.
        
        Args:
            limit: Number of movies to return (default: 20)
            rating_min: Minimum IMDb rating (default: 7.0)
            year_min: Minimum release year (default: 2000)
            country: Netflix region code (default: 78 = US)
        
        Returns:
            List of top-rated movie dictionaries
        """
        # Fetch more movies than needed to account for filtering
        fetch_limit = limit * 3
        
        # Try with minimal parameters first
        params = {
            "type": "movie",
            "limit": fetch_limit
        }
        
        try:
            response = self.get(
                "/search/titles",
                params=params,
                headers=self._get_headers()
            )
            results = response.get("results", [])
            
            # Filter client-side for rating and year
            filtered = []
            for movie in results:
                try:
                    # Parse rating (might be string or number)
                    rating = float(movie.get('rating', 0))
                    year = int(movie.get('year', 0))
                    
                    # Filter by criteria
                    if rating >= rating_min and year >= year_min:
                        filtered.append(movie)
                        
                    if len(filtered) >= limit:
                        break
                except (ValueError, TypeError):
                    continue
            
            # Sort by rating (descending)
            filtered.sort(key=lambda x: float(x.get('rating', 0)), reverse=True)
            
            return filtered[:limit]
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def get_movie_by_netflix_id(self, netflix_id: str) -> Optional[Dict[str, Any]]:
        """
        Get movie details by Netflix ID.
        
        Args:
            netflix_id: Netflix internal ID
        
        Returns:
            Movie dictionary or None if not found
        """
        try:
            response = self.get(
                f"/title/details",
                params={"netflix_id": netflix_id},
                headers=self._get_headers()
            )
            return response
        except Exception as e:
            print(f"Failed to get movie by Netflix ID {netflix_id}: {e}")
            return None
    
    def get_movie_by_imdb_id(self, imdb_id: str) -> Optional[Dict[str, Any]]:
        """
        Get movie details by IMDb ID.
        
        Args:
            imdb_id: IMDb ID (e.g., "tt0133093")
        
        Returns:
            Movie dictionary with Netflix data or None if not found
        """
        # Search by IMDb ID
        results = self.search_movies(query=imdb_id, limit=1)
        return results[0] if results else None
    
    def get_movies_by_genre(
        self, 
        genre: str, 
        limit: int = 20,
        rating_min: float = 6.0
    ) -> List[Dict[str, Any]]:
        """
        Get movies by genre from Netflix catalog.
        
        Args:
            genre: Genre name (Drama, Comedy, Action, Thriller, etc.)
            limit: Maximum number of results
            rating_min: Minimum IMDb rating
        
        Returns:
            List of movies in the specified genre
        """
        return self.search_movies(
            genre=genre,
            limit=limit,
            rating_min=rating_min,
            order_by="rating"
        )
    
    def get_new_releases(
        self, 
        limit: int = 20,
        days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get recently added movies to Netflix.
        
        Args:
            limit: Maximum number of results
            days_back: How many days back to search (default: 30)
        
        Returns:
            List of recently added movies
        """
        return self.search_movies(
            limit=limit,
            order_by="date"
        )
    
    def is_on_netflix(
        self, 
        imdb_id: str, 
        country: str = "78"
    ) -> bool:
        """
        Check if a movie is available on Netflix in specified region.
        
        Args:
            imdb_id: IMDb ID
            country: Netflix region code (default: 78 = US)
        
        Returns:
            True if available on Netflix, False otherwise
        """
        results = self.search_movies(
            query=imdb_id,
            country_list=country,
            limit=1
        )
        return len(results) > 0
    
    def get_available_countries(self, netflix_id: str) -> List[str]:
        """
        Get list of countries where a movie is available on Netflix.
        
        Args:
            netflix_id: Netflix internal ID
        
        Returns:
            List of country codes
        """
        try:
            response = self.get(
                f"/title/countries",
                params={"netflix_id": netflix_id},
                headers=self._get_headers()
            )
            return response.get("countries", [])
        except Exception as e:
            print(f"Failed to get countries for Netflix ID {netflix_id}: {e}")
            return []


def create_unogs_wrapper(rapidapi_key: Optional[str] = None) -> UnogsWrapper:
    """
    Factory function to create UnogsWrapper instance.
    
    Args:
        rapidapi_key: RapidAPI key (if None, reads from environment)
    
    Returns:
        Configured UnogsWrapper instance
    """
    if rapidapi_key is None:
        rapidapi_key = os.getenv('UNOGS_RAPIDAPI_KEY')
        if rapidapi_key is None:
            raise ValueError(
                "UNOGS_RAPIDAPI_KEY not found in environment. "
                "Please set it in .env file or pass as argument."
            )
    
    rapidapi_host = os.getenv(
        'UNOGS_RAPIDAPI_HOST', 
        'unogs-unogs-v1.p.rapidapi.com'
    )
    
    return UnogsWrapper(
        rapidapi_key=rapidapi_key,
        rapidapi_host=rapidapi_host
    )


# Example usage
if __name__ == "__main__":
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Create wrapper
    unogs = create_unogs_wrapper()
    
    print("Testing uNoGS API Connection...")
    print("="*60)
    
    # Test connection
    if unogs.test_connection():
        print("✓ Connection successful!")
        
        # Get top 20 movies
        print("\nTop 20 Movies on Netflix:")
        print("-"*60)
        top_movies = unogs.get_top_movies(limit=20)
        
        for i, movie in enumerate(top_movies, 1):
            title = movie.get('title', 'Unknown')
            year = movie.get('year', 'N/A')
            rating = movie.get('rating', 'N/A')
            imdb_id = movie.get('imdb_id', 'N/A')
            
            print(f"{i}. {title} ({year}) - Rating: {rating} - IMDb: {imdb_id}")
        
        # Get API usage stats
        stats = unogs.get_stats()
        print(f"\nAPI Usage:")
        print(f"  Requests: {stats['total_requests']}")
        print(f"  Success rate: {stats['success_rate']:.0f}%")
        
    else:
        print("✗ Connection failed!")
        print("\nPossible reasons:")
        print("1. RapidAPI subscription not active")
        print("2. Invalid API key")
        print("3. Network issues")
        print("\nTo activate:")
        print("1. Go to https://rapidapi.com/unogs/api/unogs/")
        print("2. Subscribe to a plan (Basic or Pro)")
        print("3. Confirm API key is correct in .env file")
