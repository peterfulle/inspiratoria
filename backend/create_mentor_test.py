#!/usr/bin/env python
"""Crea un usuario mentor de prueba sin borrar nada existente."""
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')
import django; django.setup()

from companies.models import Company, User
from django.utils import timezone
from datetime import timedelta

# Empresa de prueba (reutiliza si existe)
company, _ = Company.objects.get_or_create(
    slug="techcorp",
    defaults=dict(
        name="TechCorp Solutions", industry="Technology", company_size="51-200",
        plan="enterprise", status="active", max_users=500, max_programs=10,
        max_participants=500, onboarding_completed=True,
    ),
)

email = "mentor@test.com"
user, created = User.objects.get_or_create(
    email=email,
    defaults=dict(
        username="mentor_test",
        first_name="María",
        last_name="Mentora",
        role="mentor",
        company=company,
        is_active=True,
        is_account_activated=True,
        position="Senior Mentor",
        department="Mentoring",
    ),
)
if not created:
    user.role = "mentor"
    user.is_active = True
    user.is_account_activated = True
    user.company = company

# Generar OTP fresco válido por 30 minutos para login inmediato
user.otp_code = "1234"
user.otp_expires_at = timezone.now() + timedelta(minutes=30)
user.totp_enabled = False  # forzar flujo OTP por email
user.save()

# Refresh para asegurar portal_code
user.refresh_from_db()

print("=" * 60)
print(("CREADO" if created else "ACTUALIZADO") + f" mentor: {email}")
print(f"  Role        : {user.role}")
print(f"  Portal code : {user.portal_code}")
print(f"  OTP fijo    : 1234  (válido 30 min)")
print(f"  TOTP        : {'on' if user.totp_enabled else 'off'} (usa OTP por email)")
print(f"  Empresa     : {company.name} (slug={company.slug})")
print("=" * 60)
print()
print("ACCESO:")
print("  1) http://localhost:3000/login")
print(f"     email: {email}")
print(f"     OTP : 1234  (o pide reenvío y léelo de la DB)")
print(f"  2) Portal directo: http://localhost:3000/p/{user.portal_code}")
