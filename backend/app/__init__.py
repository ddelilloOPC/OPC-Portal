from pathlib import Path
from flask import Flask, send_from_directory
from flask_session import Session
from app.core.config import Config
from app.auth.microsoft import auth_bp, init_oauth
from app.auth.local import local_bp
from app.api.routes import api_bp
from app.api.admin import admin_bp


def create_app(test_config=None):
    dist = Path(__file__).parent / 'static' / 'dist'

    # Disable Flask built-in static serving (static_url_path=None).
    # We handle /assets/* explicitly so the dist/assets/ sub-folder is
    # mapped correctly and not flattened into dist/ root.
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    Session(app)
    init_oauth(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(local_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(admin_bp)
    _register_frontend_routes(app, dist)
    return app


def _register_frontend_routes(app, dist: Path):
    assets_dir = dist / 'assets'

    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        # Vite outputs JS/CSS into dist/assets/ — serve from there.
        return send_from_directory(str(assets_dir), filename)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def spa_index(path):
        # Serve real files (e.g. favicon, manifest) that exist in dist/.
        candidate = dist / path if path else None
        if candidate and candidate.is_file():
            return send_from_directory(str(dist), path)
        # Fall back to index.html so React Router handles the route.
        index = dist / 'index.html'
        if index.exists():
            return send_from_directory(str(dist), 'index.html')
        return 'OPC Portal backend - run frontend with: npm run dev', 200
