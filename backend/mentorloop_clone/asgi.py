from __future__ import annotations

import os

from django.core.asgi import get_asgi_application
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")

django_asgi_app = get_asgi_application()

from api.routes import api_app  # noqa: E402  pylint: disable=wrong-import-position
from api.socketio_server import socket_app  # noqa: E402  pylint: disable=wrong-import-position

# Ensure static/avatars directory exists
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(STATIC_DIR, "avatars"), exist_ok=True)

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

# Aplicación principal con rutas montadas
application = Starlette(
    routes=[
        Mount("/socket.io", app=socket_app),  # WebSocket para chat
        Mount("/api", app=api_app),  # API FastAPI
        Mount("/static", app=StaticFiles(directory=STATIC_DIR), name="static"),  # Static files (avatars, etc.)
        Mount("/", app=django_asgi_app),  # Django ASGI sin WSGI wrapper
    ],
    middleware=middleware,
)
