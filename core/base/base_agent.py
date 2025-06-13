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
