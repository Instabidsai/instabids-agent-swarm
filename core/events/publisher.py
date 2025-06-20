# core/events/publisher.py
import redis.asyncio as redis
import json
import uuid
from datetime import datetime
import os
import logging
from typing import Optional

class EventPublisher:
    _client: Optional[redis.Redis] = None

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        if not self.redis_url:
            raise ValueError("REDIS_URL environment variable not set.")
        self.logger = logging.getLogger(__name__)

    async def _get_client(self) -> redis.Redis:
        if self.__class__._client is None:
            self.logger.info("Initializing Redis connection for publisher.")
            # Fix for DigitalOcean managed Redis TLS connection
            self.__class__._client = redis.from_url(self.redis_url, ssl_cert_reqs=None)
        return self.__class__._client

    async def publish(self, stream: str, event_type: str, data: dict, correlation_id: Optional[str] = None) -> str:
        client = await self._get_client()
        event_id = str(uuid.uuid4())
        event_payload = {
            'event_id': event_id,
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'correlation_id': correlation_id or event_id,
            'data': json.dumps(data)
        }
        try:
            message_id = await client.xadd(stream, event_payload)
            self.logger.debug(f"Published event {event_id} to stream {stream}")
            return message_id.decode()
        except Exception as e:
            self.logger.error(f"Failed to publish to stream {stream}: {e}", exc_info=True)
            raise

    async def close(self) -> None:
        if self.__class__._client:
            await self.__class__._client.close()
            self.__class__._client = None
            self.logger.info("Redis publisher connection closed.")
