from flask import Blueprint, redirect, session
from authlib.integrations.flask_client import OAuth
from app.core.config import Config
from .roles import get_role
from app.services.users import service as user_service

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
oauth = OAuth()

def init_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name="microsoft",
        client_id=Config.MICROSOFT_CLIENT_ID,
        client_secret=Config.MICROSOFT_CLIENT_SECRET,
        server_metadata_url=(
            "https://login.microsoftonline.com/" + Config.MICROSOFT_TENANT_ID
            + "/v2.0/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile", "token_endpoint_auth_method": "client_secret_post"},
    )

@auth_bp.route("/login")
def login():
    return oauth.microsoft.authorize_redirect(Config.REDIRECT_URI)

@auth_bp.route("/callback")
def callback():
    token = oauth.microsoft.authorize_access_token()
    userinfo = token.get("userinfo") or oauth.microsoft.userinfo()
    email = (userinfo.get("email") or userinfo.get("preferred_username") or "").lower()
    name = userinfo.get("name") or email
    stored = user_service.upsert_microsoft_user(name, email)
    role = get_role(email)
    session["user"] = {
        "email": email,
        "name": name,
        "role": role,
        "auth_provider": "microsoft",
    }
    session.permanent = True
    return redirect("/")

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(Config.AZURE_POST_LOGOUT_REDIRECT_URI)
