import pytest
from unittest.mock import patch
from app.auth.roles import get_role

def test_admin_email():
    with patch("app.auth.roles.Config") as cfg:
        cfg.ADMIN_EMAILS = ["admin@example.com"]
        assert get_role("admin@example.com") == "admin"

def test_regular_email():
    with patch("app.auth.roles.Config") as cfg:
        cfg.ADMIN_EMAILS = ["admin@example.com"]
        assert get_role("other@example.com") == "user"

def test_case_insensitive():
    with patch("app.auth.roles.Config") as cfg:
        cfg.ADMIN_EMAILS = ["admin@example.com"]
        assert get_role("ADMIN@EXAMPLE.COM") == "admin"
