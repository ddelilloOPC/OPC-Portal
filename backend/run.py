# Entry point.
#
# Dev (Flask dev server):
#   python run.py
#
# Production / local test with uvicorn:
#   uvicorn run:app --reload --port 5000
#
# `app` is an ASGI wrapper around Flask (WSGI) via asgiref.WsgiToAsgi.
from asgiref.wsgi import WsgiToAsgi
from app import create_app
from app.core.config import validate_env

validate_env()

_flask_app = create_app()
app = WsgiToAsgi(_flask_app)  # ASGI callable for uvicorn

if __name__ == '__main__':
    # Plain Flask dev server when running `python run.py` directly
    _flask_app.run(host='0.0.0.0', port=5000, debug=True)
