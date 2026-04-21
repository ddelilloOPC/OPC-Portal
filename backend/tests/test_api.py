import pytest
from unittest.mock import patch

SAMPLE = {"id": "abc-123", "title": "Test", "description": "", "href": "https://example.com",
          "category": "Apps", "isActive": True, "order": 0,
          "createdAt": "2026-01-01T00:00:00+00:00", "updatedAt": "2026-01-01T00:00:00+00:00"}

def test_me_unauthenticated(client):
    assert client.get("/api/me").status_code == 401

def test_me_authenticated(client, user_session):
    res = client.get("/api/me")
    assert res.status_code == 200
    assert res.get_json()["role"] == "user"

def test_me_admin(client, admin_session):
    assert client.get("/api/me").get_json()["role"] == "admin"

@patch("app.services.links.service.get_active_links", return_value=[SAMPLE])
def test_list_links_user(mock_g, client, user_session):
    assert client.get("/api/links").status_code == 200

def test_list_links_unauthenticated(client):
    assert client.get("/api/links").status_code == 401

def test_create_link_forbidden_for_user(client, user_session):
    res = client.post("/api/links", json={"title": "X", "href": "https://x.com", "category": "Apps"})
    assert res.status_code == 403

@patch("app.services.links.service.create_link", return_value=SAMPLE)
def test_create_link_admin(mock_c, client, admin_session):
    res = client.post("/api/links", json={"title": "Test", "href": "https://example.com", "category": "Apps"})
    assert res.status_code == 201

def test_create_link_invalid(client, admin_session):
    res = client.post("/api/links", json={"title": "", "href": "bad", "category": ""})
    assert res.status_code == 422

def test_delete_user_forbidden(client, user_session):
    assert client.delete("/api/links/abc-123").status_code == 403

@patch("app.services.links.service.delete_link", return_value=True)
def test_delete_admin(mock_d, client, admin_session):
    assert client.delete("/api/links/abc-123").status_code == 204

@patch("app.services.links.service.patch_link_status", return_value={**SAMPLE, "isActive": False})
def test_patch_status(mock_p, client, admin_session):
    res = client.patch("/api/links/abc-123/status", json={"isActive": False})
    assert res.status_code == 200
    assert res.get_json()["isActive"] is False
