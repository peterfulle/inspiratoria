#!/usr/bin/env python
"""Script para limpiar TODA la base de datos manteniendo solo usuarios admin y superadmin"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from django.contrib.auth import get_user_model
from companies.models import Company, OnboardingInvitation
from programs.models import (
    Program, Participant, Match, Goal, KeyResult, GoalUpdate, 
    Sentiment, Notification, ProgramParticipant, Vinculation,
    Activity, Content, Survey, Alert, Milestone, ChatMessage, AuditLog
)
from invitations.models import PendingInvitation, OnboardingProgress

User = get_user_model()

print("=" * 60)
print("LIMPIEZA COMPLETA DE BASE DE DATOS")
print("=" * 60)

# Encontrar usuarios admin
admin_users = User.objects.filter(role__in=['superadmin', 'admin'])
print(f"\n✅ Usuarios admin encontrados ({admin_users.count()}):")
for u in admin_users:
    print(f"   • {u.email} - {u.role}")

# Mostrar estado actual
print("\n📊 ESTADO ACTUAL:")
print(f"  • Usuarios: {User.objects.count()}")
print(f"  • Compañías: {Company.objects.count()}")
print(f"  • Programas: {Program.objects.count()}")
print(f"  • Participantes Programa: {ProgramParticipant.objects.count()}")
print(f"  • Vinculaciones: {Vinculation.objects.count()}")
print(f"  • Participants: {Participant.objects.count()}")
print(f"  • Matches: {Match.objects.count()}")
print(f"  • Activities: {Activity.objects.count()}")
print(f"  • Goals: {Goal.objects.count()}")
print(f"  • Invitaciones Pendientes: {PendingInvitation.objects.count()}")

# Confirmar
print(f"\n⚠️  ¿Estás seguro de que quieres eliminar TODOS los datos?")
print(f"   Solo se mantendrán {admin_users.count()} usuarios admin/superadmin")
response = input("\n   Escribe 'SI ELIMINAR TODO' para confirmar: ")

if response.strip().upper() != "SI ELIMINAR TODO":
    print("\n❌ Operación cancelada")
    exit(0)

print("\n🗑️  Eliminando datos...")

# Eliminar en orden (respetando dependencias)
deleted_counts = {}

# 1. Eliminar datos de programas y actividades
deleted_counts['Goal Updates'] = GoalUpdate.objects.all().delete()[0]
deleted_counts['Key Results'] = KeyResult.objects.all().delete()[0]
deleted_counts['Goals'] = Goal.objects.all().delete()[0]
deleted_counts['Sentiments'] = Sentiment.objects.all().delete()[0]
deleted_counts['Notificaciones'] = Notification.objects.all().delete()[0]
deleted_counts['Chat Messages'] = ChatMessage.objects.all().delete()[0]
deleted_counts['Matches'] = Match.objects.all().delete()[0]
deleted_counts['Participants'] = Participant.objects.all().delete()[0]
deleted_counts['Milestones'] = Milestone.objects.all().delete()[0]
deleted_counts['Alerts'] = Alert.objects.all().delete()[0]
deleted_counts['Surveys'] = Survey.objects.all().delete()[0]
deleted_counts['Contents'] = Content.objects.all().delete()[0]
deleted_counts['Activities'] = Activity.objects.all().delete()[0]

# 2. Eliminar vinculaciones
deleted_counts['Vinculaciones'] = Vinculation.objects.all().delete()[0]

# 3. Eliminar participantes de programas
deleted_counts['Participantes Programa'] = ProgramParticipant.objects.all().delete()[0]

# 4. Eliminar programas
deleted_counts['Programas'] = Program.objects.all().delete()[0]

# 5. Eliminar invitaciones
deleted_counts['Invitaciones Pendientes'] = PendingInvitation.objects.all().delete()[0]
deleted_counts['Invitaciones Onboarding'] = OnboardingInvitation.objects.all().delete()[0]
deleted_counts['Onboarding Progress'] = OnboardingProgress.objects.all().delete()[0]

# 6. Eliminar compañías
deleted_counts['Compañías'] = Company.objects.all().delete()[0]

# 7. Eliminar todos los usuarios excepto admin/superadmin
admin_ids = list(admin_users.values_list('id', flat=True))
users_to_delete = User.objects.exclude(id__in=admin_ids)
deleted_counts['Usuarios (no admin)'] = users_to_delete.delete()[0]

# 8. Eliminar audit logs
deleted_counts['Audit Logs'] = AuditLog.objects.all().delete()[0]

print("\n✅ DATOS ELIMINADOS:")
for model, count in deleted_counts.items():
    if count > 0:
        print(f"  • {model}: {count} registros")

# Verificar estado final
print("\n📊 ESTADO FINAL:")
remaining_users = User.objects.all()
print(f"  • Usuarios: {remaining_users.count()}")
for u in remaining_users:
    print(f"      - {u.email} ({u.role})")
print(f"  • Compañías: {Company.objects.count()}")
print(f"  • Programas: {Program.objects.count()}")
print(f"  • Participantes Programa: {ProgramParticipant.objects.count()}")
print(f"  • Vinculaciones: {Vinculation.objects.count()}")
print(f"  • Participants: {Participant.objects.count()}")
print(f"  • Matches: {Match.objects.count()}")
print(f"  • Activities: {Activity.objects.count()}")
print(f"  • Goals: {Goal.objects.count()}")
print(f"  • Invitaciones Pendientes: {PendingInvitation.objects.count()}")

print("\n" + "=" * 60)
print("✨ Base de datos limpia - Solo permanecen usuarios admin/superadmin")
print("=" * 60)
