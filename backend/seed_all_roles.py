#!/usr/bin/env python
"""
Script para poblar la base de datos con usuarios de todos los roles
y datos de prueba completos
"""
import os
import sys
from pathlib import Path

# Setup
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / '.env')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')

import django
django.setup()

from companies.models import Company, User
from programs.models import Program, Participant, Match, Milestone
from django.db import transaction
from datetime import date, timedelta

print("\n" + "="*70)
print("🌱 POBLANDO BASE DE DATOS CON TODOS LOS ROLES")
print("="*70)

@transaction.atomic
def seed_all_data():
    # Limpiar datos existentes
    print("\n🗑️  Limpiando datos existentes...")
    User.objects.all().delete()
    Company.objects.all().delete()
    Program.objects.all().delete()
    
    # PASO 1: Crear Empresa
    print("\n🏢 Creando empresa de prueba...")
    company = Company.objects.create(
        name="TechCorp Solutions",
        slug="techcorp",
        industry="Technology",
        company_size="51-200",
        website="https://techcorp.example.com",
        plan="enterprise",
        status="active",
        max_users=500,
        max_programs=10,
        max_participants=500,
        onboarding_completed=True
    )
    print(f"   ✅ Empresa creada: {company.name}")
    
    # PASO 2: Crear Usuarios con todos los roles
    print("\n👥 Creando usuarios con todos los roles...")
    
    users_data = [
        # SUPERADMIN - Admin de Inspiratoria
        {
            "username": "superadmin",
            "email": "superadmin@inspiratoria.com",
            "password": "admin123",
            "full_name": "Super Admin Inspiratoria",
            "role": "superadmin",
            "company": None,
            "is_staff": True,
            "is_superuser": True,
            "position": "CEO",
        },
        # CLIENT - Contraparte en la empresa
        {
            "username": "client",
            "email": "client@techcorp.com",
            "password": "client123",
            "full_name": "María García",
            "role": "client",
            "company": company,
            "position": "HR Director",
            "department": "Human Resources",
        },
        # ADMIN - Admin interno de la empresa
        {
            "username": "admin",
            "email": "admin@techcorp.com",
            "password": "admin123",
            "full_name": "Carlos Rodríguez",
            "role": "admin",
            "company": company,
            "is_staff": True,
            "position": "System Administrator",
            "department": "IT",
        },
        # FACILITATOR INTERNAL
        {
            "username": "facilitator",
            "email": "facilitator@techcorp.com",
            "password": "facilitator123",
            "full_name": "Ana Martínez",
            "role": "facilitator_internal",
            "company": company,
            "position": "Learning & Development Manager",
            "department": "Human Resources",
        },
        # FACILITATOR INSPIRATORIA
        {
            "username": "facilitator_insp",
            "email": "facilitator@inspiratoria.com",
            "password": "facilitator123",
            "full_name": "Laura Sánchez",
            "role": "facilitator_inspiratoria",
            "company": None,
            "position": "Senior Facilitator",
        },
        # MENTOR
        {
            "username": "mentor",
            "email": "mentor@techcorp.com",
            "password": "mentor123",
            "full_name": "Pedro López",
            "role": "mentor",
            "company": company,
            "position": "Senior Software Architect",
            "department": "Engineering",
        },
        # MENTEE
        {
            "username": "mentee",
            "email": "mentee@techcorp.com",
            "password": "mentee123",
            "full_name": "Sofia Fernández",
            "role": "mentee",
            "company": company,
            "position": "Junior Developer",
            "department": "Engineering",
        },
    ]
    
    created_users = {}
    for user_data in users_data:
        password = user_data.pop('password')
        role = user_data['role']
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        user.is_onboarded = True
        user.save()
        created_users[role] = user
        print(f"   ✅ {role.upper()}: {user.full_name} ({user.username}/{password})")
    
    # PASO 3: Crear Programa
    print("\n📋 Creando programa de mentoría...")
    program = Program.objects.create(
        name="Tech Leadership Program 2024",
        description="Programa de desarrollo de liderazgo tecnológico",
        theme="Leadership & Technology",
        status="active"
    )
    print(f"   ✅ Programa creado: {program.name}")
    
    # PASO 4: Crear Participantes (usando el modelo antiguo para compatibilidad)
    print("\n👤 Creando participantes en el programa...")
    
    # Crear mentores
    mentor_participants = []
    mentors_data = [
        {
            "full_name": "Pedro López",
            "role": "mentor",
            "headline": "Senior Software Architect con 10+ años de experiencia",
            "goals": ["coaching", "liderazgo técnico"],
            "skills": ["arquitectura", "liderazgo", "python", "cloud"],
        },
        {
            "full_name": "Roberto Díaz",
            "role": "mentor",
            "headline": "Engineering Manager",
            "goals": ["mentoría", "desarrollo de equipos"],
            "skills": ["gestión", "agile", "comunicación"],
        },
    ]
    
    for data in mentors_data:
        participant = Participant.objects.create(program=program, **data)
        mentor_participants.append(participant)
        print(f"   ✅ Mentor: {participant.full_name}")
    
    # Crear mentees
    mentee_participants = []
    mentees_data = [
        {
            "full_name": "Sofia Fernández",
            "role": "mentee",
            "headline": "Junior Developer",
            "goals": ["liderazgo técnico", "arquitectura"],
            "skills": ["python", "javascript"],
        },
        {
            "full_name": "Javier Torres",
            "role": "mentee",
            "headline": "Mid-Level Developer",
            "goals": ["gestión de equipos", "agile"],
            "skills": ["desarrollo", "testing"],
        },
    ]
    
    for data in mentees_data:
        participant = Participant.objects.create(program=program, **data)
        mentee_participants.append(participant)
        print(f"   ✅ Mentee: {participant.full_name}")
    
    # PASO 5: Crear Matches
    print("\n🔗 Creando matches...")
    matches = []
    for mentor in mentor_participants:
        for mentee in mentee_participants:
            match = Match.objects.create(
                program=program,
                mentor=mentor,
                mentee=mentee,
                score=85.5,
                status="active"
            )
            matches.append(match)
            print(f"   ✅ Match: {mentor.full_name} ↔ {mentee.full_name}")
    
    # PASO 6: Crear Milestones para el primer match
    print("\n🎯 Creando milestones...")
    if matches:
        first_match = matches[0]
        milestones_data = [
            {
                "title": "Primera sesión de introducción",
                "status": "done",
                "due_date": date.today() - timedelta(days=7),
                "order": 1,
            },
            {
                "title": "Definir objetivos del trimestre",
                "status": "in_progress",
                "due_date": date.today() + timedelta(days=7),
                "order": 2,
            },
            {
                "title": "Revisión de progreso técnico",
                "status": "not_started",
                "due_date": date.today() + timedelta(days=30),
                "order": 3,
            },
        ]
        
        for data in milestones_data:
            milestone = Milestone.objects.create(match=first_match, **data)
            print(f"   ✅ Milestone: {milestone.title} ({milestone.status})")
    
    print("\n" + "="*70)
    print("✅ BASE DE DATOS POBLADA EXITOSAMENTE")
    print("="*70)
    print("\n📋 CREDENCIALES DE ACCESO:")
    print("\n   🔐 SUPERADMIN:")
    print("      Usuario: superadmin / Contraseña: admin123")
    print("\n   👔 CLIENT:")
    print("      Usuario: client / Contraseña: client123")
    print("\n   🔧 ADMIN:")
    print("      Usuario: admin / Contraseña: admin123")
    print("\n   👨‍🏫 FACILITATOR INTERNAL:")
    print("      Usuario: facilitator / Contraseña: facilitator123")
    print("\n   👩‍🏫 FACILITATOR INSPIRATORIA:")
    print("      Usuario: facilitator_insp / Contraseña: facilitator123")
    print("\n   🎓 MENTOR:")
    print("      Usuario: mentor / Contraseña: mentor123")
    print("\n   📚 MENTEE:")
    print("      Usuario: mentee / Contraseña: mentee123")
    print("\n" + "="*70)
    print("🌐 Accede a: http://localhost:3000/login")
    print("="*70 + "\n")

if __name__ == "__main__":
    try:
        seed_all_data()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
