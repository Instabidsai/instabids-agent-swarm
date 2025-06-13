# agents/ui_generator/ui_agent.py
import json
from typing import Dict, Any
from core.base.base_agent import BaseAgent

class UIGeneratorAgent(BaseAgent):
    """
    Listens to system-wide events and pushes formatted updates to a dedicated Redis stream,
    which a frontend WebSocket server would consume to provide real-time UI updates.
    """
    def __init__(self, agent_id: str = None):
        super().__init__(
            agent_type='ui_generator',
            stream_name='ui:updates', # Consumes events from a dedicated UI update stream
            group_name='ui_generators',
            agent_id=agent_id
        )

    async def process_event(self, event_data: Dict[str, Any]) -> None:
        """
        This agent's primary role is to listen to events from other agents and
        re-publish them in a format suitable for the frontend. For simplicity,
        we'll just log the action. In a real system, this would involve transforming
        the event into a standardized UI state object.
        """
        event_type = event_data.get('event_type')
        raw_data = json.loads(event_data.get('data', '{}'))
        project_id = raw_data.get('project_id')

        self.logger.info(f"UI-Generator received event '{event_type}' for project '{project_id}'. A real-time update would be pushed to the UI.")
        # Example of re-publishing to a project-specific websocket channel
        # await self.event_publisher.publish(
        #     stream=f"ws:project:{project_id}",
        #     event_type="ui:state_change",
        #     data={"event": event_type, "details": raw_data}
        # )
