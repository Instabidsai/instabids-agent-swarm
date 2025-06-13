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

