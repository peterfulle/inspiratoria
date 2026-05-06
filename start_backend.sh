#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/backend"
exec "$DIR/.venv/bin/python" -m uvicorn mentorloop_clone.asgi:application --host 0.0.0.0 --port 8001 --reload
