#!/usr/bin/env python
"""
Script para probar el flujo completo de LinkedIn OAuth + Gemini AI
"""

import sys
from pathlib import Path

# Setup
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / '.env')

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')

import django
django.setup()

from invitations.linkedin_service import linkedin_service
from invitations.ai_service import neuralmorphic_service
import json

# El código que obtuvimos de LinkedIn
LINKEDIN_CODE = "AQRRNd-C6C1F_RETxQzxcnG6GJFknfdaB7VVyZSwz9N6YaC8za3FNsmT3CVomtUTRkffb04cjpj-Wma5zrNaOkA_kn-lwOd6LYqB00ffBBwOAyWJhC7XiOgrPpCwbNIII2TP_XTJNoMKypPtS9oWYiIV5JLC3VZJ7NoRpVSZsg8e_v6a0HgO_0UlnT3fNFJrvmVB7cusFDK45Izy46M"

print("\n" + "="*70)
print("🧪 PRUEBA COMPLETA: LinkedIn OAuth + Gemini AI")
print("="*70)

# PASO 1: Intercambiar código por access token
print("\n📍 PASO 1: Intercambiando código por access token...")
access_token = linkedin_service.exchange_code_for_token(LINKEDIN_CODE)

if not access_token:
    print("❌ Error: No se pudo obtener el access token")
    print("   Posible causa: El código ya expiró (duran ~10 minutos)")
    print("   Solución: Genera un nuevo código abriendo la URL de autorización")
    sys.exit(1)

print(f"✅ Access token obtenido: {access_token[:30]}...")

# PASO 2: Obtener perfil de LinkedIn
print("\n📍 PASO 2: Obteniendo perfil de LinkedIn...")
profile_data = linkedin_service.get_profile_data(access_token)

if not profile_data:
    print("❌ Error: No se pudo obtener el perfil")
    sys.exit(1)

print("✅ Perfil obtenido:")
print(json.dumps(profile_data, indent=2))

# PASO 3: Procesar con Gemini AI (Neuralmorphic)
print("\n📍 PASO 3: Procesando perfil con Gemini AI (Neuralmorphic)...")
print("   Rol: MENTOR")

extracted_profile = neuralmorphic_service.extract_profile_from_linkedin(
    linkedin_data=profile_data,
    role='mentor'
)

print("✅ Perfil extraído por IA:")
print(json.dumps(extracted_profile, indent=2))

# PASO 4: Generar sugerencias adicionales
print("\n📍 PASO 4: Generando descripción mejorada con IA...")
enhanced_bio = neuralmorphic_service.enhance_profile_description(
    profile_data=extracted_profile,
    role='mentor'
)

print("✅ Biografía mejorada:")
print(enhanced_bio)

# RESUMEN
print("\n" + "="*70)
print("✅ ¡PRUEBA COMPLETADA EXITOSAMENTE!")
print("="*70)
print("\n📊 RESUMEN DEL PERFIL:")
print("-" * 70)
print(f"Nombre:       {extracted_profile.get('full_name', 'N/A')}")
print(f"Headline:     {extracted_profile.get('headline', 'N/A')}")
print(f"Industria:    {extracted_profile.get('industry', 'N/A')}")
print(f"Experiencia:  {extracted_profile.get('experience_years', 0)} años")
print(f"Skills:       {len(extracted_profile.get('skills', []))} detectados")
print(f"              {', '.join(extracted_profile.get('skills', [])[:5])}")

if extracted_profile.get('expertise_areas'):
    print(f"Expertise:    {', '.join(extracted_profile.get('expertise_areas', [])[:3])}")

print("\n" + "="*70)
print("🎉 El sistema de LinkedIn OAuth + Gemini AI está funcionando perfectamente")
print("="*70 + "\n")
