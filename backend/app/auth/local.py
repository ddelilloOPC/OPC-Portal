import re
from flask import Blueprint, request, session, jsonify
from app.services.users import service as user_service
from app.auth.passwords import hash_password, verify_password
from app.auth.utils import json_error

local_bp = Blueprint("local_auth", __name__, url_prefix="/auth/local")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_registration(data: dict):
    errors: dict = {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm = data.get("confirm_password") or ""

    if not full_name:
        errors["full_name"] = "Full name is required."
    if not email:
        errors["email"] = "Email is required."
    elif not _EMAIL_RE.match(email):
        errors["email"] = "Invalid email address."
    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    elif not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        errors["password"] = "Password must contain at least one letter and one digit."
    if password and confirm != password:
        errors["confirm_password"] = "Passwords do not match."

    return full_name, email, password, errors


@local_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    full_name, email, password, errors = _validate_registration(data)

    if errors:
        return jsonify({"errors": errors}), 422

    if user_service.get_by_email(email):
        return jsonify({"errors": {"email": "An account with this email already exists."}}), 409

    pw_hash = hash_password(password)
    user_service.create_user(full_name, email, pw_hash)
    return jsonify({"message": "Registration successful. Your account is pending approval."}), 201


@local_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return json_error("Email and password are required.", 400)

    user = user_service.get_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        return json_error("Invalid email or password.", 401)

    if user["status"] == "pending":
        return json_error("Your account is pending approval.", 403)

    if user["status"] != "approved":
        return json_error("Your account has been deactivated.", 403)

    user_service.update_last_login(email)
    must_change = bool(user.get("must_change_password"))
    session["user"] = {
        "email": user["email"],
        "name": user["full_name"],
        "role": user["role"],
        "auth_provider": "local",
        "mustChangePassword": must_change,
    }
    session.permanent = True
    return jsonify({**user_service.safe_user(user), "mustChangePassword": must_change})


@local_bp.route("/change-password", methods=["POST"])
def change_password():
    session_user = session.get("user")
    if not session_user:
        return json_error("Unauthorized", 401)

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""
    confirm = data.get("confirm_password") or ""

    if not current_password or not new_password or not confirm:
        return json_error("All fields are required.", 400)

    if len(new_password) < 8:
        return json_error("Password must be at least 8 characters.", 422)
    if not re.search(r"[A-Za-z]", new_password) or not re.search(r"\d", new_password):
        return json_error("Password must contain at least one letter and one digit.", 422)
    if new_password != confirm:
        return json_error("Passwords do not match.", 422)

    user = user_service.get_by_email(session_user["email"])
    if not user:
        return json_error("User not found.", 404)

    if not verify_password(current_password, user["password_hash"]):
        return json_error("Current password is incorrect.", 400)

    if verify_password(new_password, user["password_hash"]):
        return json_error("New password must differ from the current password.", 422)

    new_hash = hash_password(new_password)
    updated = user_service.change_password(user["id"], new_hash)

    # Clear the force-change flag from the session
    session["user"] = {**session["user"], "mustChangePassword": False}
    return jsonify(user_service.safe_user(updated))
