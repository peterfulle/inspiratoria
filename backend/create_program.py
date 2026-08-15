#!/usr/bin/env python
"""Script para crear un programa real de Inspiratoria"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from programs.models import Program

print("=" * 70)
print("CREAR PROGRAMA DE INSPIRATORIA")
print("=" * 70)

# Datos del programa
program_data = {
    "name": "Programa de Mentoría Ejecutiva 2025",
    "description": """
Programa de mentoría diseñado para desarrollar el liderazgo y las habilidades 
estratégicas de ejecutivos y gerentes de alto potencial.

Objetivos del programa:
• Desarrollar competencias de liderazgo ejecutivo
• Fortalecer la toma de decisiones estratégicas
• Mejorar habilidades de gestión de equipos
• Impulsar el desarrollo de carrera profesional
• Crear una red de contactos profesionales

Duración: 6 meses
Frecuencia de sesiones: Bi-semanal (cada 2 semanas)
Formato: Sesiones 1-1 de 60 minutos
Metodología: Coaching ejecutivo, establecimiento de OKRs, y seguimiento continuo

Áreas de enfoque:
1. Liderazgo estratégico
2. Gestión del cambio
3. Comunicación ejecutiva
4. Toma de decisiones
5. Inteligencia emocional
6. Desarrollo de equipos de alto rendimiento
    """.strip(),
    "theme": "Liderazgo Ejecutivo",
    "status": "active"
}

print("\n📋 DATOS DEL PROGRAMA:")
print(f"\n  Nombre: {program_data['name']}")
print(f"  Tema: {program_data['theme']}")
print(f"  Estado: {program_data['status']}")
print(f"\n  Descripción:\n")
for line in program_data['description'].split('\n'):
    print(f"    {line}")

# Confirmar
print("\n" + "=" * 70)
response = input("\n¿Crear este programa? (SI/no): ")

if response.strip().upper() in ["", "SI", "S", "YES", "Y"]:
    print("\n🚀 Creando programa...")
    
    program = Program.objects.create(**program_data)
    
    print(f"\n✅ ¡Programa creado exitosamente!")
    print(f"\n   ID: {program.id}")
    print(f"   Nombre: {program.name}")
    print(f"   Tema: {program.theme}")
    print(f"   Estado: {program.status}")
    print(f"   Creado: {program.created_at.strftime('%d/%m/%Y %H:%M')}")
    
    print("\n" + "=" * 70)
    print("✨ El programa está listo para agregar participantes")
    print("=" * 70)
else:
    print("\n❌ Operación cancelada")
