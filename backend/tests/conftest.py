import pytest
from unittest.mock import patch

@pytest.fixture
def app():
    from app import create_app
    cfg = {
        "TESTING": True, "SECRET_KEY": "test", "SESSION_TYPE": "filesystem",
        "MICROSOFT_CLIENT_ID": "id", "MICROSOFT_TENANT_ID": "tenant",
        "MICROSOFT_CLIENT_SECRET": "secret",
        "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=t;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net",
        "AZURE_STORAGE_CONTAINER": "portal-data", "AZURE_STORAGE_BLOB_NAME": "links.json",
        "ADMIN_EMAILS": ["admin@example.com"], "REDIRECT_URI": "http://localhost:5000/auth/callback",
        "SERVER_NAME": "localhost",
    }
    with patch("app.auth.microsoft.init_oauth"):
        app = create_app(cfg)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_session(client):
    with client.session_transaction() as sess:
        sess["user"] = {"email": "admin@example.com", "name": "Admin", "role": "admin"}

@pytest.fixture
def user_session(client):
    with client.session_transaction() as sess:
        sess["user"] = {"email": "user@example.com", "name": "User", "role": "user"}
