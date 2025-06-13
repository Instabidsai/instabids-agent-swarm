# core/memory/event_store.py
from core.memory.supabase_client import SupabaseClient
from typing import Dict, Any, List, Optional
import logging
import json

class EventStore:
    def __init__(self):
        self.db_client = SupabaseClient()
        self.logger = logging.getLogger(__name__)

    async def append_event(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            if 'event_data' in event_data and isinstance(event_data['event_data'], dict):
                event_data['event_data'] = json.dumps(event_data['event_data'])
            return await self.db_client.insert('event_store', event_data)
        except Exception as e:
            self.logger.error(f"Failed to append event to store: {e}", exc_info=True)
            return None

    async def get_events_for_aggregate(self, aggregate_id: str) -> List[Dict[str, Any]]:
        try:
            client = await self.db_client.get_client()
            response = await client.table('event_store').select('*').eq('aggregate_id', aggregate_id).order('timestamp', desc=False).execute()
            return response.data or []
        except Exception as e:
            self.logger.error(f"Failed to get events for aggregate {aggregate_id}: {e}", exc_info=True)
            return []
