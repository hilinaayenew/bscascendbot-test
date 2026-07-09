"""
OMDBWrapper - API wrapper for OMDb API (http://www.omdbapi.com/)

Provides access to:
- Film search
- Movie ratings and details  
- Plot summaries and cast information

Note: Requires free API key from http://www.omdbapi.com/apikey.aspx
"""

from api_wrapper import APIWrapper, APIWrapperError
from typing import Optional, Dict, Any, List


class OMDBWrapper(APIWrapper):
    """
    OMDb API wrapper for accessing movie information.
    
    Provides methods to search films, get ratings, and retrieve details.
    Uses the OMDb API at http://www.omdbapi.com/
    
    Get a free API key at: http://www.omdbapi.com/apikey.aspx
    """
    
    def __init__(self, api_key: str):
        """
        Initialize OMDb API wrapper.
        
        Args:
            api_key: OMDb API key (required - get free key at omdbapi.com)
        """
        super().__init__(
            name="OMDBWrapper",
            base_url="http://www.omdbapi.com",
            api_key=None,  # OMDb uses query param, not header
            timeout=30,
            retry_attempts=3
        )
        # Store API key for query params
        self._api_key = api_key
    
    def test_connection(self) -> bool:
        """
        Test the OMDb API connection.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            result = self.search_movies("Matrix")
            return len(result) > 0
        except Exception:
            return False
    
    def search_movies(
        self,
        query: str,
        year: Optional[int] = None,
        media_type: str = "movie"
    ) -> List[Dict[str, Any]]:
        """
        Search for movies by title.
        
        Args:
            query: Search query (movie title)
            year: Optional year filter
            media_type: Type of media (movie, series, episode)
            
        Returns:
            List of movie results with imdbID, Title, Year, Type
            
        Example:
            results = imdb.search_movies("The Matrix")
            for movie in results:
                print(f"{movie['Title']} ({movie['Year']})")
        """
        params = {
            "apikey": self._api_key,
            "s": query,
            "type": media_type
        }
        
        if year:
            params["y"] = year
        
        try:
            response = self.get("/", params=params)
            if response.get("Response") == "True":
                return response.get("Search", [])
            else:
                print(f"Search failed: {response.get('Error', 'Unknown error')}")
                return []
        except APIWrapperError as e:
            print(f"Search failed: {e}")
            return []
    
    def get_movie_details(self, imdb_id: str, full_plot: bool = False) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a movie.
        
        Args:
            imdb_id: IMDb ID (e.g., "tt0133093" for The Matrix)
            full_plot: If True, returns full plot instead of short version
            
        Returns:
            Dictionary with movie details including:
            - Title, Year, imdbRating, Plot
            - Director, Actors, Genre
            - Runtime, Awards
            
        Example:
            details = imdb.get_movie_details("tt0133093")
            print(f"{details['Title']} - Rating: {details['imdbRating']}/10")
        """
        params = {
            "apikey": self._api_key,
            "i": imdb_id,
            "plot": "full" if full_plot else "short"
        }
        
        try:
            response = self.get("/", params=params)
            if response.get("Response") == "True":
                return response
            else:
                print(f"Failed to get movie details: {response.get('Error', 'Unknown error')}")
                return None
        except APIWrapperError as e:
            print(f"Failed to get movie details: {e}")
            return None
    
    def get_rating(self, imdb_id: str) -> Optional[float]:
        """
        Get the IMDb rating for a movie.
        
        Args:
            imdb_id: IMDb ID (e.g., "tt0133093")
            
        Returns:
            Rating as float (0-10) or None if not found
            
        Example:
            rating = imdb.get_rating("tt0133093")
            print(f"Rating: {rating}/10")
        """
        details = self.get_movie_details(imdb_id)
        if details and details.get("imdbRating") != "N/A":
            try:
                return float(details.get("imdbRating"))
            except (ValueError, TypeError):
                return None
        return None
    
    def get_all_ratings(self, imdb_id: str) -> Dict[str, Any]:
        """
        Get ratings from multiple sources (IMDb, Rotten Tomatoes, Metacritic).
        
        Args:
            imdb_id: IMDb ID (e.g., "tt0133093")
            
        Returns:
            Dictionary with ratings from different sources
            
        Example:
            ratings = imdb.get_all_ratings("tt0133093")
            for source in ratings['Ratings']:
                print(f"{source['Source']}: {source['Value']}")
        """
        details = self.get_movie_details(imdb_id)
        if details:
            return {
                "imdbRating": details.get("imdbRating"),
                "imdbVotes": details.get("imdbVotes"),
                "Metascore": details.get("Metascore"),
                "Ratings": details.get("Ratings", [])
            }
        return {}
    
    def find_movie_id(self, title: str, year: Optional[int] = None) -> Optional[str]:
        """
        Convenience method to find IMDb ID by title.
        
        Args:
            title: Movie title
            year: Optional year to narrow results
            
        Returns:
            IMDb ID string or None if not found
            
        Example:
            movie_id = imdb.find_movie_id("The Matrix", year=1999)
            details = imdb.get_movie_details(movie_id)
        """
        results = self.search_movies(title, year=year)
        if results:
            return results[0].get("imdbID")
        return None
    
    def get_movie_summary(self, title: str, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Get a complete summary of a movie by title.
        
        Args:
            title: Movie title
            year: Optional year filter
            
        Returns:
            Dictionary with full details including plot and ratings
            
        Example:
            summary = imdb.get_movie_summary("The Matrix", year=1999)
            print(f"{summary['Title']} ({summary['Year']})")
            print(f"Rating: {summary['imdbRating']}/10")
            print(f"Plot: {summary['Plot']}")
        """
        movie_id = self.find_movie_id(title, year)
        if not movie_id:
            return None
        
        details = self.get_movie_details(movie_id, full_plot=True)
        return details


# Factory function
def create_omdb_wrapper(api_key: Optional[str] = None) -> OMDBWrapper:
    """
    Create and return a new OMDBWrapper instance.
    
    Args:
        api_key: OMDb API key (if None, reads from OMDB_API_KEY environment variable)
                Get free key at http://www.omdbapi.com/apikey.aspx
    
    Returns:
        Configured OMDBWrapper instance
    
    Raises:
        ValueError: If no API key provided and OMDB_API_KEY not in environment
    """
    if api_key is None:
        import os
        api_key = os.getenv('OMDB_API_KEY')
        if api_key is None:
            raise ValueError(
                "OMDB_API_KEY not found in environment. "
                "Please set it in .env file or pass as argument."
            )
    
    return OMDBWrapper(api_key=api_key)


# Example usage
if __name__ == "__main__":
    import sys
    
    # Check for API key
    if len(sys.argv) > 1:
        api_key = sys.argv[1]
    else:
        print("Usage: python omdb_wrapper.py YOUR_API_KEY")
        print("\nGet a free API key at: http://www.omdbapi.com/apikey.aspx")
        print("\nTesting with placeholder key...")
        api_key = "YOUR_API_KEY"
    
    # Create wrapper
    omdb = create_omdb_wrapper(api_key)
    
    print("="*70)
    print("OMDB API WRAPPER - Example Usage")
    print("="*70)
    
    print("\nNOTE: You need a valid API key from omdbapi.com")
    print("Usage: python imdb_wrapper.py YOUR_API_KEY")
    
    # Only run tests if we have a real API key
    if api_key != "YOUR_API_KEY":
        # Search for movies
        print("\n1. Searching for 'The Matrix'...")
        results = omdb.search_movies("The Matrix")
        for movie in results[:3]:
            print(f"   - {movie.get('Title')} ({movie.get('Year')}) - ID: {movie.get('imdbID')}")
        
        # Get movie details
        if results:
            movie_id = results[0].get('imdbID')
            print(f"\n2. Getting details for {movie_id}...")
            details = omdb.get_movie_details(movie_id)
            if details:
                print(f"   Title: {details.get('Title')}")
                print(f"   Year: {details.get('Year')}")
                print(f"   Director: {details.get('Director')}")
                print(f"   Rating: {details.get('imdbRating')}/10")
                print(f"   Plot: {details.get('Plot', 'N/A')[:100]}...")
                print(f"   Genre: {details.get('Genre')}")
                print(f"   Actors: {details.get('Actors')}")
            
            # Get all ratings
            print(f"\n3. Getting all ratings for {movie_id}...")
            ratings = omdb.get_all_ratings(movie_id)
            print(f"   IMDb: {ratings.get('imdbRating')}/10 ({ratings.get('imdbVotes')} votes)")
            print(f"   Metascore: {ratings.get('Metascore')}")
            for rating in ratings.get('Ratings', []):
                print(f"   {rating['Source']}: {rating['Value']}")
        
        # Get movie summary by title
        print("\n4. Getting summary for '2001: A Space Odyssey'...")
        summary = omdb.get_movie_summary("2001: A Space Odyssey", year=1968)
        if summary:
            print(f"   {summary.get('Title')} ({summary.get('Year')})")
            print(f"   Rating: {summary.get('imdbRating')}/10")
            print(f"   Plot: {summary.get('Plot')[:150]}...")
        
        # Stats
        print("\n5. API Statistics:")
        stats = omdb.get_stats()
        print(f"   Total requests: {stats['total_requests']}")
        print(f"   Errors: {stats['errors']}")
        print(f"   Success rate: {stats['success_rate']:.1f}%")
