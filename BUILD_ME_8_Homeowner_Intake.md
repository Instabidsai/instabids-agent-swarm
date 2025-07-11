# BUILD ME 8 - Agent 2 - Homeowner Intake

Instructions for Execution Agent: This document contains the complete and final code for the Homeowner Intake agent. Your task is to populate the existing files within the agents/homeowner_intake/ directory with the code provided below. DO NOT create new files or modify any logic.

## agents/homeowner_intake/intake_agent.py
```python
# agents/homeowner_intake/intake_agent.py
import json
from typing import Dict, Any
from pydantic import ValidationError
from core.base.base_agent import BaseAgent
from core.security.contact_filter import ContactProtectionFilter
from agents.homeowner_intake.nlp_processor import NLPProcessor
from core.memory.event_store import EventStore
from core.events.schemas import IntakePayload

class HomeownerIntakeAgent(BaseAgent):
    def __init__(self, agent_id: str = None):
        super().__init__(
            agent_type='homeowner_intake',
            stream_name='homeowner:project_submitted',
            group_name='intake_processors',
            agent_id=agent_id
        )
        self.contact_filter = ContactProtectionFilter()
        self.nlp_processor = NLPProcessor()
        self.event_store = EventStore()

    async def process_event(self, event_data: Dict[str, Any]) -> None:
        correlation_id = event_data.get('correlation_id')
        try:
            payload = IntakePayload(**json.loads(event_data.get('data', '{}')))
        except ValidationError as e:
            self.logger.error(f"Invalid intake payload: {e}")
            return

        self.logger.info(f"Processing project submission {payload.project_id}...")

        description = payload.project_details.raw_description
        violations = self.contact_filter.scan_content(description)

        if any(violations.values()):
            self.logger.warning(f"Contact violation detected in project {payload.project_id}.")
            await self.event_publisher.publish(
                stream='security:contact_violations',
                event_type='security:contact_violation_detected',
                data={"user_id": payload.contact_info.email, "project_id": payload.project_id, "violations": violations},
                correlation_id=correlation_id
            )
            payload.project_details.raw_description = self.contact_filter.scrub_content(description)

        extracted_data = await self.nlp_processor.extract_project_info(payload.project_details.raw_description)

        await self.event_store.append_event({
            "event_id": event_data.get('event_id'),
            "stream_name": self.event_consumer.stream_name,
            "event_type": "homeowner:project_submitted",
            "aggregate_id": payload.project_id,
            "event_data": payload.model_dump_json(),
            "agent_id": self.agent_id,
            "correlation_id": correlation_id,
            "timestamp": event_data.get('timestamp')
        })

        await self.event_publisher.publish(
            stream='homeowner:intake_complete',
            event_type='homeowner:intake_complete',
            data={"project_id": payload.project_id, "extracted_data": extracted_data},
            correlation_id=correlation_id
        )
        self.logger.info(f"Project {payload.project_id} intake complete.")
```

## agents/homeowner_intake/nlp_processor.py
```python
# agents/homeowner_intake/nlp_processor.py
import os
import logging
from typing import Dict, Any
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import json

class NLPProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable must be set.")
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0.0)
        self.chain = LLMChain(llm=self.llm, prompt=self._create_prompt_template())

    def _create_prompt_template(self) -> ChatPromptTemplate:
        template = """
        Analyze the following project description and extract the information in a structured JSON format.

        Description: "{description}"

        JSON Output Format:
        {{
          "project_type": "string",
          "requirements": ["list of key requirements"],
          "materials": ["list of materials mentioned"],
          "budget": "string or null",
          "timeline": "string or null",
          "unclear_points": ["list of questions for clarification"]
        }}
        """
        return ChatPromptTemplate.from_template(template)

    async def extract_project_info(self, description: str) -> Dict[str, Any]:
        self.logger.info("Extracting project info...")
        try:
            response = await self.chain.arun(description=description)
            return json.loads(response)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to decode LLM response: {response}. Error: {e}")
            return {"unclear_points": ["Could not fully understand the project details."]}
        except Exception as e:
            self.logger.error(f"NLP processing error: {e}", exc_info=True)
            raise
```