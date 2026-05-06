#!/usr/bin/env python
"""Crea/enriquece mentores y mentees de prueba con perfiles ricos para validar el matching inteligente."""
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

company, _ = Company.objects.get_or_create(
    slug="techcorp",
    defaults=dict(
        name="TechCorp Solutions", industry="Technology", company_size="51-200",
        plan="enterprise", status="active", max_users=500, max_programs=10,
        max_participants=500, onboarding_completed=True,
    ),
)

# ─────────────── MENTORES ───────────────
MENTORS = [
    dict(
        email="mentor@test.com",
        username="mentor_test",
        full_name="María Mentora",
        first_name="María", last_name="Mentora",
        gender="female",
        phone="+56 9 1234 5678",
        personal_email="maria.mentora@gmail.com",
        linkedin_url="https://www.linkedin.com/in/maria-mentora",
        avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Maria%20Mentora&backgroundColor=6366f1",
        position="Senior Engineering Manager",
        department="Engineering",
        headline="Engineering leader · 12 años escalando equipos de producto",
        presentation=("Lidero equipos de ingeniería desde hace más de una década. "
                      "Mi foco es ayudar a ingenieros a crecer hacia roles de liderazgo "
                      "técnico, mejorar su comunicación con stakeholders y tomar mejores "
                      "decisiones bajo incertidumbre."),
        bio="Especialista en liderazgo técnico y desarrollo de carrera para ingenieros.",
        skills=["Python", "Liderazgo de equipos", "Arquitectura cloud", "Coaching ejecutivo", "Negociación"],
        mentor_topics=["Liderazgo técnico", "Crecimiento de carrera", "Comunicación efectiva",
                       "Toma de decisiones", "Gestión del tiempo"],
        mentor_objectives=["Acelerar promoción a Senior", "Construir red profesional",
                           "Mejorar habilidades de comunicación"],
        mentor_style=["Coaching", "Pregunta socrática", "Feedback directo"],
        experience_level="senior",
        experience_area=["Backend", "Cloud", "Liderazgo", "Engineering Management"],
        mentee_preference=["Ingenieros mid-level", "Personas en transición a liderazgo"],
        mentee_outcomes=["Promoción", "Visibilidad", "Confianza en decisiones"],
        session_structure=["Agenda compartida", "Check-in inicial", "Acuerdos al final"],
    ),
    dict(
        email="mentor2@test.com",
        username="mentor_marketing",
        full_name="Diego Marketing",
        first_name="Diego", last_name="Marketing",
        gender="male",
        phone="+56 9 8765 4321",
        personal_email="diego.marketing@gmail.com",
        linkedin_url="https://www.linkedin.com/in/diego-marketing",
        avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Diego%20Marketing&backgroundColor=10b981",
        position="Head of Growth",
        department="Marketing",
        headline="Growth & Marketing — 10 años en SaaS B2B",
        presentation=("Construyo motores de growth basados en datos. He liderado "
                      "estrategias de adquisición, retención y monetización en empresas "
                      "SaaS B2B de distintas etapas."),
        bio="Apasionado por el growth basado en datos.",
        skills=["Growth marketing", "SEO", "Analytics", "Estrategia de producto"],
        mentor_topics=["Growth", "Analytics", "Estrategia comercial", "Branding"],
        mentor_objectives=["Subir métricas de adquisición", "Diseñar funnels"],
        mentor_style=["Mentoring directo", "Sesiones estructuradas"],
        experience_level="senior",
        experience_area=["Marketing", "Growth", "Producto"],
        mentee_preference=["Marketers", "Founders early stage"],
        mentee_outcomes=["Plan de growth", "Métricas de tracción"],
        session_structure=["Objetivo claro por sesión", "Revisión de métricas", "Plan de acción"],
    ),
]

# ─────────────── MENTEES ───────────────
MENTEES = [
    dict(
        email="mentee1@test.com", username="mentee_ana",
        full_name="Ana Junior",
        first_name="Ana", last_name="Junior",
        gender="female",
        phone="+56 9 2222 3333",
        personal_email="ana.junior@gmail.com",
        linkedin_url="https://www.linkedin.com/in/ana-junior",
        avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Ana%20Junior&backgroundColor=f59e0b",
        position="Software Engineer",
        department="Engineering",
        headline="Backend dev — buscando crecer hacia liderazgo técnico",
        presentation=("Soy ingeniera de software con 3 años de experiencia construyendo "
                      "APIs en Python/Django. Quiero crecer hacia un rol de liderazgo "
                      "técnico y mejorar cómo me comunico con stakeholders no técnicos."),
        bio="Quiero aprender a liderar proyectos y comunicarme mejor con stakeholders.",
        skills=["Python", "Django", "PostgreSQL"],
        experience_level="mid",
        experience_area=["Backend", "APIs"],
        mentee_goals=["Promoción a Senior", "Liderar un proyecto técnico",
                      "Mejorar comunicación con producto"],
        mentee_interests=["Liderazgo técnico", "Arquitectura cloud", "Coaching"],
        mentee_challenges=["Gestión del tiempo", "Negociación de prioridades",
                           "Hablar en reuniones ejecutivas"],
        mentee_expectations=["Acelerar promoción", "Construir red profesional",
                             "Tener feedback honesto"],
        preferred_mentor_style=["Coaching", "Feedback directo", "Pregunta socrática"],
        session_format_preference=["Videollamada quincenal", "Agenda compartida"],
    ),
    dict(
        email="mentee2@test.com", username="mentee_juan",
        full_name="Juan Marketer",
        first_name="Juan", last_name="Marketer",
        gender="male",
        phone="+56 9 4444 5555",
        personal_email="juan.marketer@gmail.com",
        linkedin_url="https://www.linkedin.com/in/juan-marketer",
        avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Juan%20Marketer&backgroundColor=ef4444",
        position="Marketing Specialist",
        department="Marketing",
        headline="Especialista de marketing buscando dar el salto a growth",
        presentation=("Llevo 2 años en marketing de contenido y SEO. Quiero migrar a un "
                      "rol de growth marketing y aprender a tomar decisiones basado en "
                      "datos y experimentos."),
        bio="Quiero mejorar mi capacidad analítica y construir funnels de growth efectivos.",
        skills=["Content marketing", "SEO básico", "Email"],
        experience_level="junior",
        experience_area=["Marketing", "Contenido"],
        mentee_goals=["Aprender growth", "Dominar analytics"],
        mentee_interests=["Growth marketing", "SEO", "Funnels", "Estrategia comercial"],
        mentee_challenges=["Análisis de métricas", "Priorización de canales"],
        mentee_expectations=["Plan de carrera", "Construir red profesional", "Subir métricas"],
        preferred_mentor_style=["Mentoring directo", "Sesiones estructuradas"],
        session_format_preference=["Sesión semanal", "Revisión de métricas"],
    ),
    dict(
        email="mentee3@test.com", username="mentee_sara",
        full_name="Sara Designer",
        first_name="Sara", last_name="Designer",
        gender="female",
        phone="+56 9 6666 7777",
        personal_email="sara.designer@gmail.com",
        linkedin_url="https://www.linkedin.com/in/sara-designer",
        avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Sara%20Designer&backgroundColor=8b5cf6",
        position="Product Designer",
        department="Design",
        headline="Diseñadora — interesada en producto y liderazgo creativo",
        presentation=("Diseñadora de producto con 4 años de experiencia. Estoy en un "
                      "punto de inflexión: decidir si seguir como IC senior o dar el "
                      "paso a un rol de liderazgo de diseño."),
        bio="Estoy explorando si quiero seguir IC o pasar a un rol de liderazgo.",
        skills=["Figma", "Investigación de usuario", "Prototipado"],
        experience_level="mid",
        experience_area=["Diseño", "Producto"],
        mentee_goals=["Decidir camino IC vs lead", "Mejorar presentación a ejecutivos"],
        mentee_interests=["Liderazgo", "Comunicación efectiva", "Toma de decisiones"],
        mentee_challenges=["Hablar en reuniones ejecutivas", "Gestión del tiempo"],
        mentee_expectations=["Claridad de carrera", "Confianza", "Tener feedback honesto"],
        preferred_mentor_style=["Coaching", "Pregunta socrática"],
        session_format_preference=["Sesión quincenal", "Conversación abierta"],
    ),
]


def upsert(role: str, data: dict) -> User:
    email = data.pop("email")
    user, created = User.objects.get_or_create(
        email=email,
        defaults=dict(
            username=data.get("username", email.split("@")[0]),
            role=role, company=company, is_active=True,
            is_account_activated=True,
        ),
    )
    for k, v in data.items():
        setattr(user, k, v)
    user.role = role
    user.is_active = True
    user.is_account_activated = True
    user.company = company
    if role == "mentor":
        user.mentor_profile_step = 4
    else:
        user.mentee_profile_step = 4
    # Set fixed OTP for easy login during tests
    user.otp_code = "1234"
    user.otp_expires_at = timezone.now() + timedelta(hours=24)
    user.totp_enabled = False
    user.save()
    user.refresh_from_db()
    print(f"  {'CREATED' if created else 'UPDATED'} {role}: {user.email} | portal={user.portal_code}")
    return user


print("=" * 70)
print("Seeding mentors with rich profiles…")
print("=" * 70)
for m in MENTORS:
    upsert("mentor", dict(m))

print()
print("Seeding mentees with rich profiles…")
print("=" * 70)
for e in MENTEES:
    upsert("mentee", dict(e))

print()
print("=" * 70)
print("DONE. All test users have OTP=1234 (24h validity)")
print(f"Login any of them at http://localhost:3000/login")
print("=" * 70)
