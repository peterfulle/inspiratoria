"""
Google Meet — genera la videollamada de cada sesión de mentoría vía la Google
Calendar API (el link de Meet se pide como "conferenceData" de un evento).

El evento se crea en el calendario de UNA cuenta de Google fija de Inspiratoria
(no cada mentor conecta la suya). El mentor y el mentee se agregan como
"attendees" del evento, así también les queda en su propio Google Calendar si
usan Gmail — más allá del email de confirmación que ya manda la plataforma.

Requiere estas variables de entorno (ver backend/.env.example):
  GOOGLE_OAUTH_CLIENT_ID
  GOOGLE_OAUTH_CLIENT_SECRET
  GOOGLE_OAUTH_REFRESH_TOKEN
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

import requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_REFRESH_TOKEN = os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", "")

TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
CALENDAR_EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


class GoogleMeetError(Exception):
    pass


def is_configured() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN)


def _get_access_token() -> str:
    """Cambia el refresh_token de larga duración por un access_token de 1h."""
    resp = requests.post(
        TOKEN_ENDPOINT,
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": GOOGLE_REFRESH_TOKEN,
            "grant_type": "refresh_token",
        },
        timeout=15,
    )
    if resp.status_code != 200:
        raise GoogleMeetError(f"No se pudo refrescar el token de Google ({resp.status_code}): {resp.text}")
    return resp.json()["access_token"]


def create_meet_event(
    title: str,
    description: str,
    start: datetime,
    duration_minutes: int,
    attendee_emails: List[str],
) -> Optional[str]:
    """
    Crea el evento en Calendar con videollamada de Meet y devuelve el link
    (`hangoutLink`). Si Google no está configurado o la llamada falla, devuelve
    None en vez de lanzar — una sesión se puede crear igual sin videollamada
    automática, no debe bloquear el flujo del mentor.
    """
    if not is_configured():
        return None

    try:
        access_token = _get_access_token()
        end = start + timedelta(minutes=duration_minutes)
        body = {
            "summary": title,
            "description": description,
            "start": {"dateTime": start.isoformat()},
            "end": {"dateTime": end.isoformat()},
            "attendees": [{"email": email} for email in attendee_emails if email],
            "conferenceData": {
                "createRequest": {
                    "requestId": uuid.uuid4().hex,
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }
        resp = requests.post(
            CALENDAR_EVENTS_ENDPOINT,
            params={"conferenceDataVersion": 1, "sendUpdates": "all"},
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            json=body,
            timeout=15,
        )
        if resp.status_code not in (200, 201):
            print(f"Error creando evento de Google Meet: {resp.status_code} - {resp.text}")
            return None
        return resp.json().get("hangoutLink")
    except Exception as e:
        print(f"Error generando videollamada de Google Meet: {str(e)}")
        return None
