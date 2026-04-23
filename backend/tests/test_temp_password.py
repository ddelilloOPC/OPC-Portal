import pytest
from unittest.mock import patch, MagicMock
from app.auth.passwords import hash_password, verify_password

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(must_change=False):
    return {
        "id": "user-1",
        "full_name": "Test User",
        "email": "user@example.com",
        "password_hash": hash_password("OldPass1"),
        "role": "user",
        "status": "approved",
        "auth_provider": "local",
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
        "approved_at": None,
        "approved_by": None,
        "last_login_at": None,
        "must_change_password": must_change,
    }


# ---------------------------------------------------------------------------
# Admin: set temporary password
# ---------------------------------------------------------------------------

class TestSetTempPassword:
    def test_admin_can_set_temp_password(self, client, admin_session):
        user = _make_user()
        with patch("app.services.users.service.get_by_id", return_value=user), \
             patch("app.services.users.service.set_temp_password", return_value={**user, "must_change_password": True}) as mock_set:
            res = client.post(
                f"/api/admin/users/{user['id']}/set-temp-password",
                json={"password": "TempPass1", "confirm_password": "TempPass1"},
            )
            assert res.status_code == 200
            mock_set.assert_called_once()
            # Verify that the hash passed to set_temp_password is NOT plain text
            stored_hash = mock_set.call_args[0][1]
            assert stored_hash != "TempPass1"
            assert verify_password("TempPass1", stored_hash)

    def test_temp_password_not_plain_text(self, client, admin_session):
        user = _make_user()
        captured = {}

        def fake_set(uid, pw_hash):
            captured["hash"] = pw_hash
            return {**user, "must_change_password": True}

        with patch("app.services.users.service.get_by_id", return_value=user), \
             patch("app.services.users.service.set_temp_password", side_effect=fake_set):
            client.post(
                f"/api/admin/users/{user['id']}/set-temp-password",
                json={"password": "TempPass1", "confirm_password": "TempPass1"},
            )
        assert captured["hash"] != "TempPass1"
        assert verify_password("TempPass1", captured["hash"])

    def test_non_admin_cannot_set_temp_password(self, client, user_session):
        res = client.post(
            "/api/admin/users/user-1/set-temp-password",
            json={"password": "TempPass1", "confirm_password": "TempPass1"},
        )
        assert res.status_code == 403

    def test_mismatched_passwords_rejected(self, client, admin_session):
        res = client.post(
            "/api/admin/users/user-1/set-temp-password",
            json={"password": "TempPass1", "confirm_password": "WrongPass1"},
        )
        assert res.status_code == 422

    def test_too_short_password_rejected(self, client, admin_session):
        res = client.post(
            "/api/admin/users/user-1/set-temp-password",
            json={"password": "abc", "confirm_password": "abc"},
        )
        assert res.status_code == 422

    def test_weak_password_no_digit_rejected(self, client, admin_session):
        res = client.post(
            "/api/admin/users/user-1/set-temp-password",
            json={"password": "NoDigitPass", "confirm_password": "NoDigitPass"},
        )
        assert res.status_code == 422

    def test_user_not_found(self, client, admin_session):
        with patch("app.services.users.service.get_by_id", return_value=None):
            res = client.post(
                "/api/admin/users/nonexistent/set-temp-password",
                json={"password": "TempPass1", "confirm_password": "TempPass1"},
            )
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Login: mustChangePassword flag
# ---------------------------------------------------------------------------

class TestLoginMustChangePassword:
    def test_login_sets_must_change_flag_in_response(self, client):
        user = _make_user(must_change=True)
        with patch("app.services.users.service.get_by_email", return_value=user), \
             patch("app.services.users.service.update_last_login"):
            res = client.post("/auth/local/login", json={"email": "user@example.com", "password": "OldPass1"})
        assert res.status_code == 200
        data = res.get_json()
        assert data["mustChangePassword"] is True

    def test_login_normal_user_no_flag(self, client):
        user = _make_user(must_change=False)
        with patch("app.services.users.service.get_by_email", return_value=user), \
             patch("app.services.users.service.update_last_login"):
            res = client.post("/auth/local/login", json={"email": "user@example.com", "password": "OldPass1"})
        assert res.status_code == 200
        data = res.get_json()
        assert data.get("mustChangePassword") is False


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

class TestChangePassword:
    def _login(self, client):
        with client.session_transaction() as sess:
            sess["user"] = {
                "email": "user@example.com",
                "name": "Test User",
                "role": "user",
                "auth_provider": "local",
                "mustChangePassword": True,
            }

    def test_unauthenticated_cannot_change_password(self, client):
        res = client.post("/auth/local/change-password", json={
            "current_password": "OldPass1",
            "new_password": "NewPass1",
            "confirm_password": "NewPass1",
        })
        assert res.status_code == 401

    def test_successful_password_change_clears_flag(self, client):
        self._login(client)
        user = _make_user(must_change=True)
        updated_user = {**user, "must_change_password": False}
        with patch("app.services.users.service.get_by_email", return_value=user), \
             patch("app.services.users.service.change_password", return_value=updated_user) as mock_cp:
            res = client.post("/auth/local/change-password", json={
                "current_password": "OldPass1",
                "new_password": "NewPass2",
                "confirm_password": "NewPass2",
            })
        assert res.status_code == 200
        mock_cp.assert_called_once()
        # Verify session flag is cleared
        with client.session_transaction() as sess:
            assert sess["user"]["mustChangePassword"] is False

    def test_wrong_current_password_rejected(self, client):
        self._login(client)
        user = _make_user()
        with patch("app.services.users.service.get_by_email", return_value=user):
            res = client.post("/auth/local/change-password", json={
                "current_password": "WrongPass1",
                "new_password": "NewPass2",
                "confirm_password": "NewPass2",
            })
        assert res.status_code == 400

    def test_same_password_as_current_rejected(self, client):
        self._login(client)
        user = _make_user()
        with patch("app.services.users.service.get_by_email", return_value=user):
            res = client.post("/auth/local/change-password", json={
                "current_password": "OldPass1",
                "new_password": "OldPass1",
                "confirm_password": "OldPass1",
            })
        assert res.status_code == 422

    def test_mismatched_new_passwords_rejected(self, client):
        self._login(client)
        user = _make_user()
        with patch("app.services.users.service.get_by_email", return_value=user):
            res = client.post("/auth/local/change-password", json={
                "current_password": "OldPass1",
                "new_password": "NewPass2",
                "confirm_password": "DifferentPass2",
            })
        assert res.status_code == 422

    def test_missing_fields_rejected(self, client):
        self._login(client)
        res = client.post("/auth/local/change-password", json={
            "current_password": "OldPass1",
        })
        assert res.status_code == 400

    def test_weak_new_password_rejected(self, client):
        self._login(client)
        user = _make_user()
        with patch("app.services.users.service.get_by_email", return_value=user):
            res = client.post("/auth/local/change-password", json={
                "current_password": "OldPass1",
                "new_password": "short",
                "confirm_password": "short",
            })
        assert res.status_code == 422

    def test_new_password_hash_stored_securely(self, client):
        self._login(client)
        user = _make_user(must_change=True)
        captured = {}

        def fake_change(uid, new_hash):
            captured["hash"] = new_hash
            return {**user, "must_change_password": False}

        with patch("app.services.users.service.get_by_email", return_value=user), \
             patch("app.services.users.service.change_password", side_effect=fake_change):
            client.post("/auth/local/change-password", json={
                "current_password": "OldPass1",
                "new_password": "NewPass2",
                "confirm_password": "NewPass2",
            })

        assert captured["hash"] != "NewPass2"
        assert verify_password("NewPass2", captured["hash"])
