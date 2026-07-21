"""
Autorización de UNA SOLA VEZ para que Inspiratoria pueda crear videollamadas
de Google Meet (vía Calendar API) en nombre de una cuenta de Google fija.

CÓMO USARLO:
  1. En Google Cloud Console (proyecto app-inspiratoria-501718):
     - Habilitar "Google Calendar API".
     - "APIs & Services" > "OAuth consent screen": completar nombre/soporte,
       agregar el scope "https://www.googleapis.com/auth/calendar.events",
       y agregar a plataforma@inspiratoria.org como test user (si es External).
     - "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth
       client ID" > tipo "Desktop app". Copiar el Client ID y Client Secret.

  2. Exportar esas dos variables en tu shell (NO las pegues en el chat):
       export GOOGLE_OAUTH_CLIENT_ID="..."
       export GOOGLE_OAUTH_CLIENT_SECRET="..."

  3. Correr este script:
       cd backend && python scripts/google_oauth_setup.py

  4. Se abre el navegador. Iniciá sesión como plataforma@inspiratoria.org y
     aceptá el permiso de Calendar.

  5. El script imprime el refresh_token EN TU TERMINAL. Copiá esas 3
     variables (client id, client secret, refresh token) a:
       - backend/.env (para desarrollo local)
       - Render > inspiratoria-backend > Environment (para producción)
     Nunca las pegues en un chat ni las subas a git.
"""

import http.server
import os
import secrets
import sys
import urllib.parse
import webbrowser

import requests

CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")
REDIRECT_PORT = 8765
REDIRECT_URI = f"http://localhost:{REDIRECT_PORT}"
SCOPE = "https://www.googleapis.com/auth/calendar.events"

_captured_code = {}


class _CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        _captured_code["code"] = params.get("code", [None])[0]
        _captured_code["state"] = params.get("state", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            "<html><body><h2>Listo — ya podés cerrar esta pestaña y volver a la terminal.</h2></body></html>".encode()
        )

    def log_message(self, fmt, *args):
        pass  # silencia el log default por request


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en el entorno.")
        sys.exit(1)

    state = secrets.token_urlsafe(16)
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",  # fuerza a devolver refresh_token también en re-autorizaciones
        "state": state,
    })

    print(f"Abriendo el navegador para autorizar como plataforma@inspiratoria.org...\n{auth_url}\n")
    webbrowser.open(auth_url)

    server = http.server.HTTPServer(("localhost", REDIRECT_PORT), _CallbackHandler)
    server.handle_request()  # atiende un solo request y sigue

    code = _captured_code.get("code")
    if not code or _captured_code.get("state") != state:
        print("No se recibió el código de autorización (o el 'state' no coincide). Probá de nuevo.")
        sys.exit(1)

    token_resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if token_resp.status_code != 200:
        print(f"Error cambiando el código por tokens: {token_resp.status_code} {token_resp.text}")
        sys.exit(1)

    tokens = token_resp.json()
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        print(
            "Google no devolvió refresh_token (puede pasar si ya habías autorizado antes). "
            "Revocá el acceso en https://myaccount.google.com/permissions y volvé a correr este script."
        )
        sys.exit(1)

    print("\n¡Listo! Guardá esto en backend/.env y en Render (Environment), NO lo compartas:\n")
    print(f"GOOGLE_OAUTH_CLIENT_ID={CLIENT_ID}")
    print(f"GOOGLE_OAUTH_CLIENT_SECRET={CLIENT_SECRET}")
    print(f"GOOGLE_OAUTH_REFRESH_TOKEN={refresh_token}")


if __name__ == "__main__":
    main()
