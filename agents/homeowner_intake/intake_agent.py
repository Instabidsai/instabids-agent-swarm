# This update fixes the HomeownerIntakeAgent to work with the base agent framework
# 
# Key Changes:
# - Removed the custom start_processing() method that was calling non-existent consume_events()
# - Use the base class start_processing() which properly handles single stream consumption
# - Simplified to focus on core project submission processing
# - Removed multimodal features that were breaking the agent

from core.base.base_agent import BaseAgent
from core.events.publisher import EventPublisher
from agents.homeowner_intake.nlp_processor import NLPProcessor
from core.security.contact_filter import ContactProtectionFilter
from core.memory.event_store import EventStore
from core.events.schemas import IntakePayload
from pydantic import ValidationError
import asyncio
import json

class HomeownerIntakeAgent(BaseAgent):
    """Processes homeowner project submissions."""

    def __init__(self, agent_id: str | None = None):
        super().__init__(
            agent_type="homeowner_intake",
            stream_name="homeowner:project_submitted",
            group_name="intake_processors",
            agent_id=agent_id,
        )
        self.nlp_processor = NLPProcessor()
        self.contact_filter = ContactProtectionFilter()
        self.event_store = EventStore()
        self.event_publisher = EventPublisher()

    async def process_event(self, event_data: dict) -> None:
        """Handle a single project submission event."""
        correlation_id = event_data.get("correlation_id")
        try:
            payload = IntakePayload(**json.loads(event_data.get("data", "{}")))
        except ValidationError as e:
            self.logger.error(f"Invalid intake payload: {e}")
            return

        self.logger.info(f"Processing project submission {payload.project_id}...")

        description = payload.project_details.raw_description
        violations = self.contact_filter.scan_content(description)

        if any(violations.values()):
            self.logger.warning(
                    f"Contact violation detected in project {payload.project_id}."
                )
            await self.event_publisher.publish(
                stream="security:contact_violations",
                event_type="security:contact_violation_detected",
                data={
                    "user_id": payload.contact_info.email,
                    "project_id": payload.project_id,
                    "violations": violations,
                },
                correlation_id=correlation_id,
            )
            payload.project_details.raw_description = self.contact_filter.scrub_content(
                description
            )

        extracted_data = await self.nlp_processor.extract_project_info(
            payload.project_details.raw_description
        )

        await self.event_store.append_event(
            {
                "event_id": event_data.get("event_id"),
                "stream_name": self.event_consumer.stream_name,
                "event_type": "homeowner:project_submitted",
                "aggregate_id": payload.project_id,
                "event_data": payload.model_dump_json(),
                "agent_id": self.agent_id,
                "correlation_id": correlation_id,
                "timestamp": event_data.get("timestamp"),
            }
        )

        await self.event_publisher.publish(
            stream="homeowner:intake_complete",
            event_type="homeowner:intake_complete",
            data={"project_id": payload.project_id, "extracted_data": extracted_data},
            correlation_id=correlation_id,
        )

        self.logger.info(f"Project {payload.project_id} intake complete.")
