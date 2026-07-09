"""
Base APIWrapper class for external API integrations.

An APIWrapper provides a structured interface to external APIs with:
- Configuration management (base URL, API keys, headers)
- Request handling with error management
- Response parsing and validation
- Rate limiting and retry logic
"""

import requests
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
import time


class APIWrapper(ABC):
    """
    Base class for all API wrapper implementations.
    
    APIWrappers provide structured access to external APIs with
    consistent error handling, configuration, and response parsing.
    """
    
    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        retry_attempts: int = 3,
        retry_delay: float = 1.0
    ):
        """
        Initialize an API wrapper.
        
        Args:
            name: The wrapper's identifier (e.g., "IMDBWrapper")
            base_url: Base URL for API requests
            api_key: Optional API key for authentication
            headers: Optional default headers for requests
            timeout: Request timeout in seconds
            retry_attempts: Number of retry attempts for failed requests
            retry_delay: Delay between retries in seconds
        """
        self.name = name
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        
        # Build default headers
        self.headers = headers or {}
        if api_key and 'Authorization' not in self.headers:
            self.headers['Authorization'] = f'Bearer {api_key}'
        
        # Request statistics
        self.request_count = 0
        self.error_count = 0
        
    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Make an HTTP request with retry logic.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Query parameters
            data: Request body data
            headers: Additional headers (merged with default headers)
            
        Returns:
            Parsed JSON response
            
        Raises:
            requests.RequestException: On request failure after retries
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = {**self.headers, **(headers or {})}
        
        for attempt in range(self.retry_attempts):
            try:
                self.request_count += 1
                
                response = requests.request(
                    method=method,
                    url=url,
                    params=params,
                    json=data,
                    headers=request_headers,
                    timeout=self.timeout
                )
                
                response.raise_for_status()
                
                # Return parsed JSON or empty dict
                return response.json() if response.content else {}
                
            except requests.RequestException as e:
                self.error_count += 1
                
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                else:
                    raise APIWrapperError(
                        f"Request failed after {self.retry_attempts} attempts: {str(e)}"
                    )
    
    def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make a GET request."""
        return self._make_request('GET', endpoint, params=params, headers=headers)
    
    def post(
        self,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make a POST request."""
        return self._make_request('POST', endpoint, params=params, data=data, headers=headers)
    
    def get_stats(self) -> Dict[str, int]:
        """Return request statistics."""
        return {
            "total_requests": self.request_count,
            "errors": self.error_count,
            "success_rate": (
                (self.request_count - self.error_count) / self.request_count * 100
                if self.request_count > 0 else 0.0
            )
        }
    
    @abstractmethod
    def test_connection(self) -> bool:
        """
        Test the API connection.
        
        Returns:
            True if connection successful, False otherwise
        """
        pass
    
    def __repr__(self) -> str:
        return f"APIWrapper(name='{self.name}', base_url='{self.base_url}')"


class APIWrapperError(Exception):
    """Custom exception for API wrapper errors."""
    pass
