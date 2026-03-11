#!/bin/bash
cd /Users/peterfulle/Desktop/Inspiratoria/backend
exec /Users/peterfulle/Desktop/Inspiratoria/.venv/bin/python -m uvicorn mentorloop_clone.asgi:application --host 0.0.0.0 --port 8001 --reload
