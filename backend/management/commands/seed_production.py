#!/usr/bin/env python
"""
Management command para poblar la base de datos de producción
con datos de demostración seguros.
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")

import django
django.setup()

from django.core.management import call_command

if __name__ == "__main__":
    print("🚀 Poblando base de datos de producción...")
    print("=" * 60)
    
    # Ejecutar migraciones primero
    print("\n📦 Aplicando migraciones...")
    call_command('migrate', '--noinput')
    
    # Ejecutar seed_demo
    print("\n🌱 Poblando datos de demostración...")
    call_command('seed_demo')
    
    print("\n" + "=" * 60)
    print("✅ Base de datos poblada exitosamente!")
    print("\n📊 Ahora puedes:")
    print("   - Visitar tu sitio en Render")
    print("   - Hacer login con: admin / admin123")
    print("   - Ver el dashboard con datos de prueba")
