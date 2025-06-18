# This update modifies the existing HomeownerIntakeAgent to make it multimodal.
#
# Key Changes:
# - The agent now subscribes to the new Redis streams for vision and audio transcripts.
# - It maintains a more complex internal state that stores both what the user says and what the AI "sees".
# - The prompt sent to the LLM is enhanced to include this visual context, allowing it to have
#   a much more grounded and intelligent conversation.

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
    """Processes homeowner project submissions and conversations, now with multimodal capabilities."""

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
        # In-memory context store for active conversations
        self.conversation_contexts = {}

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

    async def start_processing(self):
        """Main event processing loop, now consuming from multiple streams."""
        while self.is_running:
            try:
                # Consume events from original text-based streams AND new media streams
                events = await self.consume_events([
                    "homeowner:project_submitted",
                    "homeowner:conversation_message",
                    "ai:vision_analysis_results",       # NEW
                    "ai:speech_to_text_transcripts"   # NEW
                ])

                if events:
                    for stream, messages in events:
                        for message_id, fields in messages:
                            await self.process_single_event(fields)
                            # Acknowledge the message
                            await self.redis.xack(stream.decode(), self.consumer_group, message_id)

            except Exception as e:
                await self.handle_error(e)
                await asyncio.sleep(5)  # Back off on errors

    async def process_single_event(self, event: dict):
        """Route event to the correct handler based on its type."""
        project_id = event.get("project_id")
        if not project_id:
            return

        # Initialize context if it doesn't exist
        if project_id not in self.conversation_contexts:
            self.conversation_contexts[project_id] = {
                "transcript_history": [],
                "vision_history": [],
                "last_update": asyncio.get_event_loop().time()
            }
        
        context = self.conversation_contexts[project_id]
        context['last_update'] = asyncio.get_event_loop().time()

        event_type = event.get("event_type", event.get(b'event_type', b'unknown').decode())

        if "vision_analysis_results" in event_type:
            context['vision_history'].append(json.loads(event.get('data', '{}')).get('analysis'))
            # Keep history from getting too large
            context['vision_history'] = context['vision_history'][-10:]
        elif "speech_to_text_transcripts" in event_type:
            transcript = json.loads(event.get('data', '{}')).get('transcript')
            context['transcript_history'].append(f"User said: {transcript}")
            context['transcript_history'] = context['transcript_history'][-20:]
            # A final transcript marks a good time to generate a response
            await self.generate_multimodal_response(project_id, context)
        # ... (handle other event types like initial submission)

    async def generate_multimodal_response(self, project_id: str, context: dict):
        """Generate a response using both visual and audio context."""
        
        conversation_log = "\n".join(context['transcript_history'])
        visual_summary = "Visual observations from the last minute: " + "; ".join(filter(None, context['vision_history']))

        multimodal_prompt = f"""
        You are an expert home renovation consultant having a live video call with a homeowner.
        Your goal is to understand their project needs. You have access to what they are saying and what you are "seeing" through their camera.

        Conversation History (what was said):
        {conversation_log}

        Visual Context (what you are seeing right now):
        {visual_summary}

        Based on BOTH the conversation and the visual context, provide a short, helpful, and relevant response or ask a clarifying question.
        For example, if the user says "this is the problem area" and you see a water stain, you should mention the water stain.
        """

        try:
            response_text = await self.nlp_processor.generate_response(multimodal_prompt)

            # Publish the AI's response to be sent back to the user
            await self.event_publisher.publish(
                "ai:agent_response",
                {"project_id": project_id, "text_response": response_text}
            )

            context['transcript_history'].append(f"AI said: {response_text}")

        except Exception as e:
            await self.handle_error(e, project_id=project_id)
