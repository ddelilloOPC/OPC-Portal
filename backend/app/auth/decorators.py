from functools import wraps
from flask import session
from .utils import json_error


def _resolve_live_claims(session_user: dict):
    
    from app.services.users import service as user_service
    stored = user_service.get_by_email(session_user["email"])
    if not stored:
        return session_user.get("role", "user"), "approved"
    live_role = stored["role"]
    live_status = stored.get("status", "approved")
    if session_user.get("role") != live_role or session_user.get("status") != live_status:
        session["user"] = {**session_user, "role": live_role, "status": live_status}
    return live_role, live_status


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        session_user = session.get("user")
        if not session_user:
            return json_error("Unauthorized", 401)
        _, live_status = _resolve_live_claims(session_user)
        if live_status != "approved":
            return json_error("Access denied. Your account is not approved.", 403)
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        session_user = session.get("user")
        if not session_user:
            return json_error("Unauthorized", 401)
        live_role, live_status = _resolve_live_claims(session_user)
        if live_status != "approved":
            return json_error("Access denied. Your account is not approved.", 403)
        if live_role != "admin":
            return json_error("Forbidden", 403)
        return f(*args, **kwargs)
    return decorated
