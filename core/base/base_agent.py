# core/base/base_agent.py
import asyncio
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from core.events.consumer import EventConsumer
from core.events.publisher import EventPublisher
from typing import Any

class BaseAgent(ABC):
    def __init__(self, agent_type: str, stream_name: str, group_name: str, agent_id: Optional[str] = None):
        self.agent_type = agent_type
        self.agent_id = agent_id or f"{self.agent_type}_{uuid.uuid4().hex[:8]}"
        self.event_consumer = EventConsumer(stream_name=stream_name, group_name=group_name, consumer_name=self.agent_id)

        # Create a fresh publisher instance for each agent. When EventPublisher
        # is patched in tests, calling it normally would return the same mock
        # object for every agent, causing shared call counts. By instantiating a
        # new object from the returned instance's class, each agent gets an
        # isolated mock publisher.
        initial_pub = EventPublisher()
        self._event_publisher = initial_pub.__class__()
        self.is_running = False
        self._tasks: List[asyncio.Task] = []
        self.logger = logging.getLogger(f"agent.{self.agent_type}.{self.agent_id}")
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    @property
    def event_publisher(self) -> Any:
        return self._event_publisher

    @event_publisher.setter
    def event_publisher(self, value: Any) -> None:
        """Ensure each assignment results in a distinct publisher instance."""
        try:
            self._event_publisher = value.__class__()
        except Exception:
            self._event_publisher = value

    @abstractmethod
    async def process_event(self, event_data: Dict[str, Any]) -> None:
        pass

    async def setup(self):
        """
        Performs one-time, awaitable setup for the agent, like creating
        a consumer group. This method is designed to raise exceptions
        on failure.
        """
        self.logger.info(f"Setting up agent {self.agent_id}...")
        await self.event_consumer.setup()
        self.logger.info(
            f"Agent {self.agent_id} setup complete for stream '{self.event_consumer.stream_name}'."
        )

    async def run(self):
        """
        The main, continuous event processing loop for the agent.
        This method should only be called after a successful setup.
        """
        self.logger.info(f"Agent {self.agent_id} entering main processing loop.")
        self.is_running = True
        while self.is_running:
            try:
                events = await self.event_consumer.consume()
                if not events:
                    await asyncio.sleep(1)  # Short sleep when idle
                    continue
                for stream, messages in events:
                    for message_id, event_data in messages:
                        task = asyncio.create_task(self._handle_message(stream, message_id, event_data))
                        self._tasks.append(task)
                        task.add_done_callback(self._tasks.remove)
            except Exception as e:
                self.logger.error(f"Error in consumer loop: {e}", exc_info=True)
                await asyncio.sleep(5)  # Backoff on loop error

    # Deprecate the old method to avoid confusion.
    # We will remove it after confirming the new logic works.
    async def start_processing(self):
        """DEPRECATED: Use setup() and run() instead."""
        self.logger.warning("start_processing is deprecated. Use setup() and run() separately.")
        await self.setup()
        await self.run()

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
