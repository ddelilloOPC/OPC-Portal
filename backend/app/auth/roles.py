from app.core.config import Config

def get_role(email: str) -> str:
    if email.lower() in Config.ADMIN_EMAILS:
        return "admin"
    return "user"
