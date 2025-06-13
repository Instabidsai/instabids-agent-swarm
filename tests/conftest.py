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

