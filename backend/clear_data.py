#!/usr/bin/env python
"""Script para limpiar todos los datos de prueba de la base de datos"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from programs.models import Program, Participant, Match, Goal, KeyResult, GoalUpdate, Sentiment, Notification

print("=" * 60)
print("LIMPIEZA DE BASE DE DATOS")
print("=" * 60)

# Mostrar estado actual
print("\n📊 ESTADO ACTUAL:")
print(f"  • Programas: {Program.objects.count()}")
print(f"  • Participantes: {Participant.objects.count()}")
print(f"  • Matches: {Match.objects.count()}")
print(f"  • Goals: {Goal.objects.count()}")
print(f"  • Key Results: {KeyResult.objects.count()}")
print(f"  • Goal Updates: {GoalUpdate.objects.count()}")
print(f"  • Sentiments: {Sentiment.objects.count()}")
print(f"  • Notificaciones: {Notification.objects.count()}")

# Confirmar
print("\n⚠️  ¿Estás seguro de que quieres eliminar TODOS los datos?")
print("   (Las invitaciones, usuarios y compañías NO se eliminarán)")
response = input("\n   Escribe 'SI' para confirmar: ")

if response.strip().upper() != "SI":
    print("\n❌ Operación cancelada")
    exit(0)

print("\n🗑️  Eliminando datos...")

# Eliminar en orden (respetando dependencias)
deleted_counts = {}

deleted_counts['Goal Updates'] = GoalUpdate.objects.all().delete()[0]
deleted_counts['Key Results'] = KeyResult.objects.all().delete()[0]
deleted_counts['Goals'] = Goal.objects.all().delete()[0]
deleted_counts['Sentiments'] = Sentiment.objects.all().delete()[0]
deleted_counts['Notificaciones'] = Notification.objects.all().delete()[0]
deleted_counts['Matches'] = Match.objects.all().delete()[0]
deleted_counts['Participantes'] = Participant.objects.all().delete()[0]
deleted_counts['Programas'] = Program.objects.all().delete()[0]

print("\n✅ DATOS ELIMINADOS:")
for model, count in deleted_counts.items():
    if count > 0:
        print(f"  • {model}: {count} registros")

# Verificar estado final
print("\n📊 ESTADO FINAL:")
print(f"  • Programas: {Program.objects.count()}")
print(f"  • Participantes: {Participant.objects.count()}")
print(f"  • Matches: {Match.objects.count()}")
print(f"  • Goals: {Goal.objects.count()}")
print(f"  • Key Results: {KeyResult.objects.count()}")
print(f"  • Goal Updates: {GoalUpdate.objects.count()}")
print(f"  • Sentiments: {Sentiment.objects.count()}")
print(f"  • Notificaciones: {Notification.objects.count()}")

print("\n" + "=" * 60)
print("✨ Base de datos limpia y lista para nuevos datos")
print("=" * 60)
