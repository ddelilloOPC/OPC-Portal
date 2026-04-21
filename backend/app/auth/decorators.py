from functools import wraps
from flask import session
from .utils import json_error

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("user"):
            return json_error("Unauthorized", 401)
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = session.get("user")
        if not user:
            return json_error("Unauthorized", 401)
        if user.get("role") != "admin":
            return json_error("Forbidden", 403)
        return f(*args, **kwargs)
    return decorated
