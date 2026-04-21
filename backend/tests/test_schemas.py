import pytest
from pydantic import ValidationError
from app.schemas.link import LinkCreateSchema, LinkStatusSchema

def test_valid_link():
    s = LinkCreateSchema(title="Outlook", href="https://outlook.office.com", category="Applications")
    assert s.title == "Outlook"
    assert s.isActive is True

def test_blank_title_rejected():
    with pytest.raises(ValidationError):
        LinkCreateSchema(title="  ", href="https://example.com", category="Apps")

def test_invalid_url_rejected():
    with pytest.raises(ValidationError):
        LinkCreateSchema(title="Test", href="not-a-url", category="Apps")

def test_status_schema():
    assert LinkStatusSchema(isActive=False).isActive is False
