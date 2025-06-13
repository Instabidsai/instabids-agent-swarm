# BUILD ME 7 - Core Infrastructure

Instructions for Execution Agent: This document contains the complete and final code for the core/ module. Your task is to populate the existing files within the core/ directory with the code provided below. DO NOT create new files or modify any logic.

## core/base/base_agent.py
```python
# core/base/base_agent.py
import asyncio
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from core.events.consumer import EventConsumer
from core.events.publisher import EventPublisher

class BaseAgent(ABC):
    def __init__(self, agent_type: str, stream_name: str, group_name: str, agent_id: Optional[str] = None):
        self.agent_type = agent_type
        self.agent_id = agent_id or f"{self.agent_type}_{uuid.uuid4().hex[:8]}"
        self.event_consumer = EventConsumer(stream_name=stream_name, group_name=group_name, consumer_name=self.agent_id)
        self.event_publisher = EventPublisher()
        self.is_running = False
        self._tasks: List[asyncio.Task] = []
        self.logger = logging.getLogger(f"agent.{self.agent_type}.{self.agent_id}")
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    @abstractmethod
    async def process_event(self, event_data: Dict[str, Any]) -> None:
        pass

    async def start_processing(self) -> None:
        self.logger.info(f"Agent {self.agent_id} starting on stream '{self.event_consumer.stream_name}'.")
        await self.event_consumer.setup()
        self.is_running = True
        while self.is_running:
            try:
                events = await self.event_consumer.consume()
                if not events:
                    await asyncio.sleep(1)
                    continue
                for stream, messages in events:
                    for message_id, event_data in messages:
                        task = asyncio.create_task(self._handle_message(stream, message_id, event_data))
                        self._tasks.append(task)
                        task.add_done_callback(self._tasks.remove)
            except Exception as e:
                self.logger.error(f"Agent loop error for {self.agent_id}: {e}", exc_info=True)
                await asyncio.sleep(5)

    async def _handle_message(self, stream: bytes, message_id: bytes, event_data: Dict[bytes, bytes]) -> None:
        decoded_stream = stream.decode('utf-8')
        decoded_message_id = message_id.decode('utf-8')
        try:
            decoded_event_data = {k.decode('utf-8'): v.decode('utf-8') for k, v in event_data.items()}
            await self.process_event(decoded_event_data)
            await self.event_consumer.acknowledge(decoded_stream, decoded_message_id)
            self.logger.debug(f"Processed message {decoded_message_id}.")
        except Exception as e:
            self.logger.error(f"Failed to process message {decoded_message_id}: {e}", exc_info=True)

    async def graceful_shutdown(self) -> None:
        self.logger.info(f"Shutting down agent {self.agent_id}...")
        self.is_running = False
        if self._tasks:
            await asyncio.wait(self._tasks, timeout=5.0)
        await self.event_consumer.close()
        await self.event_publisher.close()
        self.logger.info(f"Agent {self.agent_id} shut down.")
```

## core/events/publisher.py
```python
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
            self.__class__._client = redis.from_url(self.redis_url)
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
```

## core/events/consumer.py
```python
# core/events/consumer.py
import redis.asyncio as redis
import os
import logging
from typing import Optional

class EventConsumer:
    def __init__(self, stream_name: str, group_name: str, consumer_name: str, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        if not self.redis_url:
            raise ValueError("REDIS_URL environment variable not set.")
        self.redis_client = redis.from_url(self.redis_url)
        self.stream_name = stream_name
        self.group_name = group_name
        self.consumer_name = consumer_name
        self.logger = logging.getLogger(f"consumer.{consumer_name}")

    async def setup(self) -> None:
        try:
            await self.redis_client.xgroup_create(self.stream_name, self.group_name, id='0', mkstream=True)
            self.logger.info(f"Consumer group '{self.group_name}' ready for stream '{self.stream_name}'.")
        except redis.exceptions.ResponseError as e:
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
```

## core/memory/event_store.py
```python
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
```

## core/security/contact_filter.py
```python
# core/security/contact_filter.py
import re
from typing import Dict, List

class ContactProtectionFilter:
    PHONE_PATTERNS = [
        re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'),
        re.compile(r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}'),
        re.compile(r'\b\d{10}\b'),
        re.compile(r'\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'),
    ]
    EMAIL_PATTERNS = [
        re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        re.compile(r'\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\s*\[\s*dot\s*\]\s*[A-Z|a-z]{2,}', re.IGNORECASE)
    ]
    INTENT_PATTERNS = [
        re.compile(r'\b(call|text|email|contact|reach)\s+me\b', re.IGNORECASE),
        re.compile(r'\bmy\s+(number|phone|cell|email)\b', re.IGNORECASE),
        re.compile(r'\b(whatsapp|telegram|signal)\b', re.IGNORECASE)
    ]

    def scan_content(self, content: str) -> Dict[str, List[str]]:
        violations: Dict[str, List[str]] = {"phones": [], "emails": [], "intent": []}
        for pattern in self.PHONE_PATTERNS:
            violations["phones"].extend(pattern.findall(content))
        for pattern in self.EMAIL_PATTERNS:
            violations["emails"].extend(pattern.findall(content))
        for pattern in self.INTENT_PATTERNS:
            violations["intent"].extend(pattern.findall(content))
        return violations

    def scrub_content(self, content: str) -> str:
        scrubbed_content = content
        all_patterns = self.PHONE_PATTERNS + self.EMAIL_PATTERNS
        for pattern in all_patterns:
            scrubbed_content = pattern.sub("[FILTERED]", scrubbed_content)
        return scrubbed_content
```