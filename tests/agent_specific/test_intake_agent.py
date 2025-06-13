# tests/agent_specific/test_intake_agent.py
import pytest
from unittest.mock import AsyncMock, patch
from agents.homeowner_intake.intake_agent import HomeownerIntakeAgent

@pytest.fixture
def intake_agent():
    with patch('core.events.publisher.EventPublisher') as MockPublisher, \
         patch('core.memory.event_store.EventStore') as MockEventStore, \
         patch('agents.homeowner_intake.nlp_processor.NLPProcessor') as MockNLPProcessor:

        agent = HomeownerIntakeAgent()
        agent.event_publisher = MockPublisher()
        agent.event_store = MockEventStore()
        agent.nlp_processor = MockNLPProcessor()
        agent.event_publisher.publish = AsyncMock()
        agent.event_store.append_event = AsyncMock()
        agent.nlp_processor.extract_project_info = AsyncMock(return_value={"project_type": "test"})
        yield agent

@pytest.mark.asyncio
async def test_intake_processes_valid_event(intake_agent):
    event_data = {'data': '{"project_id": "proj_123", "contact_info": {"email": "test@test.com", "first_name": "John", "last_name": "Doe", "zip_code": "12345", "city": "Test", "state": "TS"}, "project_details": {"raw_description": "remodel my kitchen"}}'}
    await intake_agent.process_event(event_data)
    intake_agent.nlp_processor.extract_project_info.assert_called_once()
    intake_agent.event_store.append_event.assert_called_once()
    intake_agent.event_publisher.publish.assert_called_once()
    assert intake_agent.event_publisher.publish.call_args.kwargs['stream'] == 'homeowner:intake_complete'

