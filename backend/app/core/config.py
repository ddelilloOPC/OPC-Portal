import os
from dotenv import load_dotenv
load_dotenv()
_REQUIRED = ["MICROSOFT_CLIENT_ID","MICROSOFT_TENANT_ID","MICROSOFT_CLIENT_SECRET","AZURE_STORAGE_CONNECTION_STRING","SECRET_KEY"]
def validate_env():
    missing = [k for k in _REQUIRED if not os.getenv(k)]
    if missing:
        raise RuntimeError("Missing env vars: " + ", ".join(missing))
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SESSION_TYPE = "filesystem"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("FLASK_ENV") == "production"
    MICROSOFT_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID", "")
    MICROSOFT_TENANT_ID = os.environ.get("MICROSOFT_TENANT_ID", "")
    MICROSOFT_CLIENT_SECRET = os.environ.get("MICROSOFT_CLIENT_SECRET", "")
    AZURE_STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "")
    AZURE_STORAGE_CONTAINER = os.environ.get("AZURE_STORAGE_CONTAINER", "portal-data")
    AZURE_STORAGE_BLOB_NAME = os.environ.get("AZURE_STORAGE_BLOB_NAME", "links.json")
    ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    REDIRECT_URI = os.environ.get("REDIRECT_URI", "http://localhost:5000/auth/callback")
