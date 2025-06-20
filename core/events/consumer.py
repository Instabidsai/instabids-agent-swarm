# core/events/consumer.py
import redis.asyncio as redis
import redis.exceptions  # Import exceptions from main redis module
import os
import logging
from typing import Optional

class EventConsumer:
    def __init__(self, stream_name: str, group_name: str, consumer_name: str, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        if not self.redis_url:
            raise ValueError("REDIS_URL environment variable not set.")
        # Fix for DigitalOcean managed Redis TLS connection
        self.redis_client = redis.from_url(self.redis_url, ssl_cert_reqs=None)
        self.stream_name = stream_name
        self.group_name = group_name
        self.consumer_name = consumer_name
        self.logger = logging.getLogger(f"consumer.{consumer_name}")

    async def setup(self) -> None:
        try:
            await self.redis_client.xgroup_create(self.stream_name, self.group_name, id='0', mkstream=True)
            self.logger.info(f"Consumer group '{self.group_name}' ready for stream '{self.stream_name}'.")
        except redis.exceptions.ResponseError as e:  # Use redis.exceptions instead of redis.asyncio.exceptions
            if "BUSYGROUP" not in str(e):
                self.logger.error(f"Error creating consumer group: {e}", exc_info=True)
                raise

    async def consume(self, count: int = 10, block: int = 2000):
        try:
            return await self.redis_client.xreadgroup(
                self.group_name, self.consumer_name, {self.stream_name: '>'}, count=count, block=block
            )
        except Exception as e:
            self.logger.error(f"Error consuming events from stream {self.stream_name}: {e}", exc_info=True)
            return None

    async def acknowledge(self, stream: str, message_id: str) -> None:
        await self.redis_client.xack(stream, self.group_name, message_id)

    async def close(self) -> None:
        await self.redis_client.close()
