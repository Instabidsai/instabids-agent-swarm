# BUILD ME 11 - Complete Test Suite

Instructions for Execution Agent: This document contains the complete and final code for the tests/ module. Your task is to populate the existing files within the tests/ directory with the code provided below. DO NOT create new files or modify any logic.

## tests/conftest.py
```python
# tests/conftest.py
import pytest
import os

@pytest.fixture(scope="session", autouse=True)
def set_test_environment():
    """Set environment variables for the test session."""
    os.environ["OPENAI_API_KEY"] = "test_key_not_used_in_mocked_tests"
    os.environ["REDIS_URL"] = "redis://localhost:6379"
    os.environ["SUPABASE_URL"] = "http://localhost:54323"
    os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test_key"
```

## tests/agent_specific/test_intake_agent.py
```python
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
```

## tests/security/test_contact_leakage.py
```python
# tests/security/test_contact_leakage.py
import pytest
from core.security.contact_filter import ContactProtectionFilter

@pytest.fixture
def contact_filter():
    return ContactProtectionFilter()

@pytest.mark.parametrize("content, expected_violation", [
    ("call me at 555-867-5309", True),
    ("my email is test@example.com", True),
    ("I need a new roof", False),
    ("reach out to test AT example DOT com", True)
])
def test_contact_detection(contact_filter, content, expected_violation):
    violations = contact_filter.scan_content(content)
    has_violation = any(violations.values())
    assert has_violation == expected_violation
```

## tests/integration/test_event_flows.py
```python
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
```