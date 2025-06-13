# tests/integration/test_event_flows.py
import pytest
import json
from unittest.mock import patch, AsyncMock
from agents.homeowner_intake.intake_agent import HomeownerIntakeAgent
from agents.project_scope.scope_agent import ProjectScopeAgent

@pytest.mark.asyncio
async def test_intake_to_scope_flow():
    with patch('core.events.publisher.EventPublisher') as MockPublisher, \
         patch('core.memory.event_store.EventStore') as MockEventStore, \
         patch('agents.homeowner_intake.nlp_processor.NLPProcessor') as MockNLP, \
         patch('agents.project_scope.scope_agent.ProjectScopeAgent.chain') as MockScopeChain:

        # --- Setup Agents with Mocks ---
        intake_agent = HomeownerIntakeAgent()
        intake_agent.event_publisher, intake_agent.event_store, intake_agent.nlp_processor = MockPublisher(), MockEventStore(), MockNLP()
        intake_agent.event_publisher.publish, intake_agent.event_store.append_event, intake_agent.nlp_processor.extract_project_info = AsyncMock(), AsyncMock(), AsyncMock(return_value={"project_type": "test"})

        scope_agent = ProjectScopeAgent()
        scope_agent.event_publisher, scope_agent.event_store, scope_agent.chain = MockPublisher(), MockEventStore(), MockScopeChain
        scope_agent.event_publisher.publish, scope_agent.event_store.append_event, scope_agent.chain.arun = AsyncMock(), AsyncMock(), AsyncMock(return_value='{"work_breakdown": ["task 1"]}')

        # --- Simulate Flow ---
        initial_event = {'data': '{"project_id": "flow_test_123", "contact_info": {"email": "test@test.com", "first_name": "Flow", "last_name": "Test", "zip_code": "12345", "city": "Test", "state": "TS"}, "project_details": {"raw_description": "flow test"}}'}
        await intake_agent.process_event(initial_event)

        intake_agent.event_publisher.publish.assert_called_once()
        published_call_args = intake_agent.event_publisher.publish.call_args.kwargs

        intake_complete_event = {'data': json.dumps(published_call_args['data']), 'correlation_id': published_call_args['correlation_id']}
        await scope_agent.process_event(intake_complete_event)

        # --- Assert Final Outcome ---
        scope_agent.event_publisher.publish.assert_called_once()
        scope_publish_args = scope_agent.event_publisher.publish.call_args.kwargs
        assert scope_publish_args['stream'] == 'homeowner:scope_complete'
        assert scope_publish_args['data']['project_id'] == 'flow_test_123'

