from flask import Blueprint, jsonify, request, session
from app.auth.decorators import admin_required
from app.auth.utils import json_error
from app.services.users import service as user_service

admin_bp = Blueprint("admin_api", __name__, url_prefix="/api/admin")


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = [user_service.safe_user(u) for u in user_service.get_all_users()]
    return jsonify({"users": users})


@admin_bp.route("/users/<user_id>/approve", methods=["POST"])
@admin_required
def approve_user(user_id):
    admin_email = session["user"]["email"]
    updated = user_service.update_status(user_id, "approved", approved_by=admin_email)
    if not updated:
        return json_error("User not found", 404)
    return jsonify(user_service.safe_user(updated))


@admin_bp.route("/users/<user_id>/reject", methods=["POST"])
@admin_required
def reject_user(user_id):
    updated = user_service.update_status(user_id, "rejected")
    if not updated:
        return json_error("User not found", 404)
    return jsonify(user_service.safe_user(updated))


@admin_bp.route("/users/<user_id>", methods=["PATCH"])
@admin_required
def update_user(user_id):
    body = request.get_json(silent=True) or {}
    role = body.get("role")
    if role not in ("admin", "user"):
        return json_error("Invalid role. Must be 'admin' or 'user'.", 422)
    updated = user_service.update_role(user_id, role)
    if not updated:
        return json_error("User not found", 404)
    return jsonify(user_service.safe_user(updated))
