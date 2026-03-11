#!/usr/bin/env python
"""
Script simple para generar URL de LinkedIn OAuth
"""

import os
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv(backend_dir / '.env')

# Verificar credenciales
client_id = os.getenv('LINKEDIN_CLIENT_ID')
client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')

print("\n" + "="*70)
print("🔍 VERIFICACIÓN DE CREDENCIALES")
print("="*70)
print(f"CLIENT_ID: {client_id}")
print(f"CLIENT_SECRET: {'*' * 20 if client_secret else 'NO CONFIGURADO'}")
print(f"GEMINI_API_KEY: {'Configurado ✅' if os.getenv('GEMINI_API_KEY') else 'NO CONFIGURADO'}")

if not client_id or not client_secret:
    print("\n❌ ERROR: Credenciales de LinkedIn no configuradas")
    sys.exit(1)

print("\n" + "="*70)
print("🔗 GENERANDO URL DE AUTORIZACIÓN")
print("="*70)

# Construir URL manualmente
from urllib.parse import urlencode

params = {
    'response_type': 'code',
    'client_id': client_id,
    'redirect_uri': 'http://localhost:3000/onboarding/linkedin-callback',
    'state': 'test_invitation_token',
    'scope': 'profile email openid'  # Scopes básicos de OpenID Connect
}

auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"

print(f"\n✅ URL generada exitosamente:\n")
print(f"{auth_url}\n")
print("="*70)
print("📋 INSTRUCCIONES:")
print("="*70)
print("1. Copia la URL de arriba")
print("2. Ábrela en tu navegador")
print("3. Autoriza la aplicación")
print("4. LinkedIn te redirigirá a: http://localhost:3000/onboarding/linkedin-callback")
print("5. Copia el parámetro 'code=' de la URL de redirección")
print("="*70 + "\n")
