import uuid
from datetime import datetime, timezone
from app.services.storage.blob import read_named_blob, write_named_blob
from app.core.config import Config


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read() -> list:
    return read_named_blob(Config.USERS_BLOB_NAME).get("users", [])


def _write(users: list) -> None:
    write_named_blob(Config.USERS_BLOB_NAME, {"users": users})


def get_all_users() -> list:
    return _read()


def get_by_email(email: str) -> dict | None:
    return next((u for u in _read() if u["email"] == email.lower()), None)


def get_by_id(user_id: str) -> dict | None:
    return next((u for u in _read() if u["id"] == user_id), None)


def create_user(full_name: str, email: str, password_hash: str) -> dict:
    users = _read()
    user = {
        "id": str(uuid.uuid4()),
        "full_name": full_name,
        "email": email.lower(),
        "password_hash": password_hash,
        "role": "user",
        "status": "pending",
        "auth_provider": "local",
        "created_at": _now(),
        "updated_at": _now(),
        "approved_at": None,
        "approved_by": None,
        "last_login_at": None,
    }
    users.append(user)
    _write(users)
    return user


def update_status(user_id: str, status: str, approved_by: str | None = None) -> dict | None:
    users = _read()
    for u in users:
        if u["id"] == user_id:
            u["status"] = status
            u["updated_at"] = _now()
            if status == "approved":
                u["approved_at"] = _now()
                u["approved_by"] = approved_by
            _write(users)
            return u
    return None


def update_role(user_id: str, role: str) -> dict | None:
    users = _read()
    for u in users:
        if u["id"] == user_id:
            u["role"] = role
            u["updated_at"] = _now()
            _write(users)
            return u
    return None


def update_last_login(email: str) -> None:
    users = _read()
    for u in users:
        if u["email"] == email.lower():
            u["last_login_at"] = _now()
            _write(users)
            return


def set_temp_password(user_id: str, password_hash: str) -> dict | None:
    users = _read()
    for u in users:
        if u["id"] == user_id:
            u["password_hash"] = password_hash
            u["must_change_password"] = True
            u["updated_at"] = _now()
            _write(users)
            return u
    return None


def change_password(user_id: str, new_hash: str) -> dict | None:
    users = _read()
    for u in users:
        if u["id"] == user_id:
            u["password_hash"] = new_hash
            u["must_change_password"] = False
            u["updated_at"] = _now()
            _write(users)
            return u
    return None


def upsert_microsoft_user(full_name: str, email: str) -> dict:
    users = _read()
    existing = next((u for u in users if u["email"] == email.lower()), None)
    if existing:
        changed = False
        if existing.get("auth_provider") != "microsoft":
            existing["auth_provider"] = "microsoft"
            changed = True
        existing["last_login_at"] = _now()
        if changed:
            existing["updated_at"] = _now()
        _write(users)
        return existing
    from app.auth.roles import get_role
    user = {
        "id": str(uuid.uuid4()),
        "full_name": full_name,
        "email": email.lower(),
        "password_hash": None,
        "role": get_role(email.lower()),
        "status": "approved",
        "auth_provider": "microsoft",
        "created_at": _now(),
        "updated_at": _now(),
        "approved_at": _now(),
        "approved_by": "microsoft_sso",
        "last_login_at": _now(),
    }
    users.append(user)
    _write(users)
    return user


def safe_user(user: dict) -> dict:
    result = {k: v for k, v in user.items() if k != "password_hash"}
    result.setdefault("auth_provider", "local")
    return result
