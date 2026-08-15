#!/usr/bin/env python
"""
Script para generar datos de prueba para Activities y Alerts
"""

import os
import django
from datetime import datetime, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from programs.models import Program, Activity, Alert, Participant
from django.utils import timezone


def create_sample_activities():
    """Crea actividades de ejemplo"""
    print("Creando actividades de ejemplo...")
    
    # Obtener programas existentes
    programs = list(Program.objects.all()[:3])
    
    if not programs:
        print("⚠️  No hay programas en la base de datos.")
        return
    
    activities_data = [
        {
            "name": "Kick-off: Programa de Mentoring",
            "description": "Sesión de inauguración del programa de mentoring 2025",
            "activity_type": "event",
            "event_category": "meeting",
            "status": "scheduled",
            "program": programs[0],
            "start_date": timezone.now() + timedelta(days=7),
            "end_date": timezone.now() + timedelta(days=7, hours=2),
            "modality": "hybrid",
            "requires_satisfaction_survey": True,
            "provides_participation_certificate": True,
        },
        {
            "name": "Entrenamiento: Habilidades de Mentoring",
            "description": "Capacitación en técnicas de mentoring efectivo para mentores",
            "activity_type": "training",
            "training_category": "mentors",
            "status": "scheduled",
            "program": programs[0],
            "start_date": timezone.now() + timedelta(days=14),
            "has_modules": True,
            "requires_module_survey": True,
            "provides_certification": True,
        },
        {
            "name": "Workshop: Establecimiento de Objetivos",
            "description": "Taller práctico sobre definición de objetivos SMART",
            "activity_type": "event",
            "event_category": "workshop",
            "status": "completed",
            "program": programs[0],
            "start_date": timezone.now() - timedelta(days=7),
            "end_date": timezone.now() - timedelta(days=7, hours=-2),
            "modality": "online",
            "confirmed_count": 25,
            "attendance_count": 22,
            "invitations_sent": True,
        },
    ]
    
    if len(programs) > 1:
        activities_data.extend([
            {
                "name": "Charla: Liderazgo Transformador",
                "description": "Conferencia sobre liderazgo en la era digital",
                "activity_type": "event",
                "event_category": "talk",
                "status": "scheduled",
                "program": programs[1],
                "start_date": timezone.now() + timedelta(days=21),
                "modality": "in_person",
                "requires_satisfaction_survey": True,
            },
            {
                "name": "Entrenamiento: Gestión del Tiempo",
                "description": "Módulo sobre técnicas de productividad y gestión del tiempo",
                "activity_type": "training",
                "training_category": "mentees",
                "status": "scheduled",
                "program": programs[1],
                "has_modules": True,
                "requires_module_survey": True,
            },
        ])
    
    created_count = 0
    for activity_data in activities_data:
        activity, created = Activity.objects.get_or_create(
            name=activity_data["name"],
            program=activity_data["program"],
            defaults=activity_data
        )
        if created:
            created_count += 1
            print(f"  ✓ Creada: {activity.name}")
    
    print(f"\n✅ Actividades creadas: {created_count}/{len(activities_data)}")
    return Activity.objects.count()


def create_sample_alerts():
    """Crea alertas de ejemplo"""
    print("\nCreando alertas de ejemplo...")
    
    # Obtener programas y actividades
    programs = list(Program.objects.all()[:2])
    activities = list(Activity.objects.all()[:3])
    
    if not programs:
        print("⚠️  No hay programas en la base de datos.")
        return
    
    alerts_data = [
        {
            "program": programs[0],
            "activity": activities[0] if activities else None,
            "alert_type": "activity_delayed",
            "description": "La actividad 'Kick-off' está programada pero falta confirmar facilitadores",
            "status": "active",
        },
        {
            "program": programs[0],
            "activity": activities[1] if len(activities) > 1 else None,
            "alert_type": "low_confirmation",
            "description": "Solo el 45% de los participantes han confirmado asistencia",
            "status": "in_progress",
            "action_taken": "Enviados recordatorios por email a participantes pendientes",
        },
        {
            "program": programs[0],
            "alert_type": "pending_surveys",
            "description": "15 encuestas de satisfacción pendientes de responder",
            "status": "active",
        },
    ]
    
    if len(programs) > 1:
        alerts_data.extend([
            {
                "program": programs[1],
                "alert_type": "match_pending",
                "description": "5 participantes sin asignar mentor",
                "status": "active",
            },
            {
                "program": programs[1],
                "activity": activities[2] if len(activities) > 2 else None,
                "alert_type": "low_attendance",
                "description": "Tasa de asistencia del 55% en la última sesión",
                "status": "resolved",
                "action_taken": "Reprogramada sesión de recuperación y enviados materiales grabados",
            },
        ])
    
    created_count = 0
    for alert_data in alerts_data:
        alert, created = Alert.objects.get_or_create(
            program=alert_data["program"],
            alert_type=alert_data["alert_type"],
            description=alert_data["description"],
            defaults=alert_data
        )
        if created:
            created_count += 1
            print(f"  ✓ Creada: {alert.get_alert_type_display()}")
    
    print(f"\n✅ Alertas creadas: {created_count}/{len(alerts_data)}")
    return Alert.objects.count()


if __name__ == "__main__":
    print("=" * 60)
    print("GENERACIÓN DE DATOS DE PRUEBA")
    print("=" * 60)
    print()
    
    total_activities = create_sample_activities()
    total_alerts = create_sample_alerts()
    
    print()
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"Total Actividades: {total_activities}")
    print(f"Total Alertas: {total_alerts}")
    print()
    print("✅ Datos de prueba generados exitosamente!")
    print("=" * 60)
