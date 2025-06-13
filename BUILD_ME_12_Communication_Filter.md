# BUILD ME 12 - Agent 4 - Communication Filter

Instructions for Execution Agent: This document contains the complete and final code for the Communication Filter agent. Your task is to populate the existing files within the agents/communication_filter/ directory with the code provided below. DO NOT create new files or modify any logic.

## agents/communication_filter/filter_agent.py
```python
# agents/communication_filter/filter_agent.py

import json
import re
from typing import Dict, Any, List

from core.base.base_agent import BaseAgent
from core.memory.event_store import EventStore
from core.security.contact_filter import ContactProtectionFilter

class CommunicationFilterAgent(BaseAgent):
    """
    CRITICAL AGENT: This agent monitors all communication streams to detect
    and block any attempts to share contact information, protecting the core
    business model.
    """
    def __init__(self, agent_id: str = None):
        super().__init__(
            agent_type='communication_filter',
            stream_name='communication:filter',
            group_name='security_filters',
            agent_id=agent_id
        )
        self.contact_filter = ContactProtectionFilter()
        self.event_store = EventStore()

    async def process_event(self, event_data: Dict[str, Any]) -> None:
        """
        Processes a communication event, scans for violations, and takes action.
        """
        correlation_id = event_data.get('correlation_id')
        try:
            raw_data = json.loads(event_data.get('data', '{}'))
            content_to_scan = raw_data.get('content', '')
            user_id = raw_data.get('user_id')
            project_id = raw_data.get('project_id')
        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Could not parse event data for filtering: {e}")
            return

        self.logger.info(f"Scanning content for project {project_id} from user {user_id}.")

        violations = self.contact_filter.scan_content(content_to_scan)
        
        if any(violations.values()):
            self.logger.warning(f"VIOLATION DETECTED for project {project_id}. User: {user_id}.")
            
            # 1. Persist the violation event to the event store for audit
            await self.event_store.append_event({
                "stream_name": self.event_consumer.stream_name,
                "event_type": "security:contact_violation_detected",
                "aggregate_id": project_id or user_id,
                "event_data": {
                    "user_id": user_id,
                    "project_id": project_id,
                    "violations": violations
                },
                "agent_id": self.agent_id,
                "correlation_id": correlation_id,
            })

            # 2. Publish event to the dedicated violation stream for real-time action
            await self.event_publisher.publish(
                stream='security:contact_violations',
                event_type='security:contact_violation_detected',
                data={
                    "user_id": user_id,
                    "project_id": project_id,
                    "violation_details": violations,
                    "severity": "critical" # Any leak is critical
                },
                correlation_id=correlation_id
            )
        else:
            self.logger.info(f"Content for project {project_id} is clean.")
            # If clean, the message can proceed. In this architecture, that means
            # we simply don't raise a violation event. Another service would
            # handle routing the approved message.
```