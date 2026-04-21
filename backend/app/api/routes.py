from flask import Blueprint, jsonify, request, session
from pydantic import ValidationError
from app.auth.decorators import admin_required, login_required
from app.auth.utils import json_error
from app.schemas.link import LinkCreateSchema, LinkUpdateSchema, LinkStatusSchema
from app.services.links import service as link_service

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.route("/me")
def me():
    user = session.get("user")
    if not user:
        return json_error("Unauthorized", 401)
    return jsonify(user)

@api_bp.route("/links", methods=["GET"])
@login_required
def list_links():
    user = session.get("user")
    if user and user.get("role") == "admin":
        links = link_service.get_all_links()
    else:
        links = link_service.get_active_links()
    return jsonify({"links": links})

@api_bp.route("/links", methods=["POST"])
@admin_required
def create_link():
    body = request.get_json(silent=True) or {}
    try:
        schema = LinkCreateSchema(**body)
    except ValidationError as e:
        return json_error(str(e), 422)
    link = link_service.create_link(schema.model_dump())
    return jsonify(link), 201

@api_bp.route("/links/<link_id>", methods=["PUT"])
@admin_required
def update_link(link_id):
    body = request.get_json(silent=True) or {}
    try:
        schema = LinkUpdateSchema(**body)
    except ValidationError as e:
        return json_error(str(e), 422)
    updated = link_service.update_link(link_id, schema.model_dump(exclude_none=True))
    if not updated:
        return json_error("Link not found", 404)
    return jsonify(updated)

@api_bp.route("/links/<link_id>", methods=["DELETE"])
@admin_required
def delete_link(link_id):
    if not link_service.delete_link(link_id):
        return json_error("Link not found", 404)
    return "", 204

@api_bp.route("/links/<link_id>/status", methods=["PATCH"])
@admin_required
def patch_link_status(link_id):
    body = request.get_json(silent=True) or {}
    try:
        schema = LinkStatusSchema(**body)
    except ValidationError as e:
        return json_error(str(e), 422)
    updated = link_service.patch_link_status(link_id, schema.isActive)
    if not updated:
        return json_error("Link not found", 404)
    return jsonify(updated)
