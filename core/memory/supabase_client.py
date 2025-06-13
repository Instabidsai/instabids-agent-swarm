# core/memory/supabase_client.py
import os
import logging
from typing import Dict, Any, List, Optional
import httpx
import json

class SupabaseClient:
    """
    Simplified Supabase client for event store operations.
    """
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.supabase_url or not self.service_role_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        self.headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json"
        }
        self.logger = logging.getLogger(__name__)

    async def get_client(self):
        """Return the client instance - for compatibility with existing code."""
        return self

    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Insert a record into a Supabase table."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/{table}",
                    headers=self.headers,
                    json=data
                )
                response.raise_for_status()
                return response.json() if response.content else None
        except Exception as e:
            self.logger.error(f"Failed to insert into {table}: {e}", exc_info=True)
            return None

    async def select(self, table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Select records from a Supabase table."""
        try:
            url = f"{self.supabase_url}/rest/v1/{table}"
            params = {}
            if filters:
                for key, value in filters.items():
                    params[key] = f"eq.{value}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            self.logger.error(f"Failed to select from {table}: {e}", exc_info=True)
            return []
