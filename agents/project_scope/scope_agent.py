# agents/project_scope/scope_agent.py
import json
from typing import Dict, Any
import logging
import os
from core.base.base_agent import BaseAgent
from core.memory.event_store import EventStore
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

class ProjectScopeAgent(BaseAgent):
    """Agent responsible for generating a scoped project plan."""

    # Define the attribute at the class level so tests can patch it without
    # instantiating the LLM chain in `__init__`.
    chain: LLMChain | None = None
    def __init__(self, agent_id: str = None):
        super().__init__(
            agent_type='project_scope',
            stream_name='homeowner:intake_complete',
            group_name='scope_processors',
            agent_id=agent_id
        )
        self.event_store = EventStore()
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable must be set.")
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0.1)
        self.chain = LLMChain(llm=self.llm, prompt=self._create_scope_prompt())

    def _create_scope_prompt(self) -> ChatPromptTemplate:
        template = """
        As a senior construction project manager, create a detailed project scope from the following data.

        Intake Data: {intake_data}

        JSON Output Format:
        {{
            "project_title": "string",
            "work_breakdown": ["list of tasks"],
            "materials_list": ["list of materials"],
            "required_skills": ["list of contractor skills"],
            "estimated_duration_weeks": {{"min": "int", "max": "int"}},
            "complexity_level": "string ('low', 'medium', 'high')"
        }}
        """
        return ChatPromptTemplate.from_template(template)

    async def process_event(self, event_data: Dict[str, Any]) -> None:
        correlation_id = event_data.get('correlation_id')
        try:
            raw_data = json.loads(event_data.get('data', '{}'))
            project_id = raw_data.get('project_id')
            if not project_id:
                return

            self.logger.info(f"Generating scope for project {project_id}...")
            response = await self.chain.arun(intake_data=json.dumps(raw_data.get("extracted_data")))
            structured_scope = json.loads(response)

            await self.event_store.append_event({
                "event_type": "project:scope_generated", "aggregate_id": project_id,
                "event_data": structured_scope, "agent_id": self.agent_id, "correlation_id": correlation_id,
            })

            await self.event_publisher.publish(
                stream='homeowner:scope_complete', event_type='homeowner:scope_complete',
                data={"project_id": project_id, "structured_scope": structured_scope},
                correlation_id=correlation_id
            )
            self.logger.info(f"Project scope for {project_id} complete.")
        except Exception as e:
            self.logger.error(f"Scope generation failed: {e}", exc_info=True)
            await self.event_publisher.publish(
                stream='system:agent_errors', event_type='scope:generation_failed',
                data={"project_id": raw_data.get("project_id", "unknown"), "error": str(e)},
                correlation_id=correlation_id
            )
