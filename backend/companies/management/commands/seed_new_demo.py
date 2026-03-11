from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from companies.models import Company, User
from programs.models import Program, Participant, Match
import random


class Command(BaseCommand):
    help = "Seed the database with demo data for the new multi-role system"

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding database with demo data...")

        # 1. Crear empresa demo
        company, created = Company.objects.get_or_create(
            slug="inspiratoria-demo",
            defaults={
                "name": "Inspiratoria Demo",
                "industry": "Tecnología",
                "company_size": "51-200",
                "website": "https://inspiratoria.com",
                "plan": "growth",
                "status": "active",
                "max_users": 500,
                "max_programs": 5,
                "max_participants": 500,
                "onboarding_completed": True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f"✅ Empresa creada: {company.name}"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️  Empresa ya existía: {company.name}"))

        # 2. Crear usuarios con los 7 roles
        users_data = [
            {
                "username": "admin",
                "email": "admin@inspiratoria.com",
                "password": "admin123",
                "full_name": "Administrador General",
                "role": "admin",
                "position": "Director de RRHH",
                "department": "Recursos Humanos"
            },
            {
                "username": "cliente1",
                "email": "cliente@empresa.com",
                "password": "cliente123",
                "full_name": "Ana García",
                "role": "client",
                "position": "Gerente General",
                "department": "Dirección"
            },
            {
                "username": "facilitador1",
                "email": "facilitador@empresa.com",
                "password": "facilitador123",
                "full_name": "Carlos Rodríguez",
                "role": "facilitator_internal",
                "position": "Facilitador Senior",
                "department": "Desarrollo Organizacional"
            },
            {
                "username": "mentor1",
                "email": "mentor1@empresa.com",
                "password": "mentor123",
                "full_name": "Laura Martínez",
                "role": "mentor",
                "position": "Líder Técnico",
                "department": "Tecnología"
            },
            {
                "username": "mentee1",
                "email": "mentee1@empresa.com",
                "password": "mentee123",
                "full_name": "Diego Silva",
                "role": "mentee",
                "position": "Developer Junior",
                "department": "Tecnología"
            },
        ]

        created_users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data["username"],
                defaults={
                    "email": user_data["email"],
                    "password": make_password(user_data["password"]),
                    "full_name": user_data["full_name"],
                    "role": user_data["role"],
                    "position": user_data.get("position", ""),
                    "department": user_data.get("department", ""),
                    "company": company,
                    "is_onboarded": True,
                    "is_staff": user_data["role"] in ["admin", "superadmin"],
                    "is_superuser": user_data["role"] == "admin",
                    "is_active": True,
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Usuario creado: {user.username} ({user.get_role_display()})"))
                created_users.append(user)
            else:
                self.stdout.write(self.style.WARNING(f"⚠️  Usuario ya existía: {user.username}"))

        # 3. Crear programas de mentoring
        programs_data = [
            {
                "name": "Programa de Liderazgo 2025",
                "description": "Desarrollo de habilidades de liderazgo para managers emergentes",
                "theme": "Liderazgo",
                "status": "active",
            },
            {
                "name": "Mentoring Técnico",
                "description": "Acompañamiento técnico para desarrolladores junior",
                "theme": "Tecnología",
                "status": "active",
            },
            {
                "name": "Diversidad e Inclusión",
                "description": "Programa de mentoring para promover la diversidad en la organización",
                "theme": "Diversidad",
                "status": "active",
            },
        ]

        programs = []
        for program_data in programs_data:
            program, created = Program.objects.get_or_create(
                name=program_data["name"],
                defaults=program_data
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Programa creado: {program.name}"))
            programs.append(program)

        # 4. Crear participantes (mentores y mentees)
        mentors_data = [
            {
                "full_name": "Laura Martínez",
                "headline": "Líder Técnico con 10+ años de experiencia",
                "skills": ["Python", "Django", "Leadership", "Arquitectura de Software"],
                "goals": ["Desarrollar nuevos líderes", "Compartir conocimiento técnico"],
            },
            {
                "full_name": "Roberto Chen",
                "headline": "Engineering Manager especializado en equipos remotos",
                "skills": ["Gestión de equipos", "Agile", "DevOps", "Comunicación"],
                "goals": ["Formar futuros managers", "Mejorar cultura de feedback"],
            },
            {
                "full_name": "María Fernández",
                "headline": "Product Owner con background técnico",
                "skills": ["Product Management", "UX/UI", "Data Analysis", "Stakeholder Management"],
                "goals": ["Guiar transiciones de carrera", "Desarrollar visión de producto"],
            },
        ]

        mentees_data = [
            {
                "full_name": "Diego Silva",
                "headline": "Developer Junior buscando crecer en backend",
                "goals": ["Mejorar habilidades en Python", "Aprender arquitectura", "Desarrollar soft skills"],
                "skills": ["JavaScript", "React", "Git", "SQL"],
            },
            {
                "full_name": "Camila Torres",
                "headline": "Analista de datos explorando product management",
                "goals": ["Transición a Product Owner", "Aprender metodologías ágiles", "Mejorar comunicación"],
                "skills": ["SQL", "Excel", "Power BI", "Python básico"],
            },
            {
                "full_name": "Andrés Muñoz",
                "headline": "Developer buscando asumir rol de liderazgo",
                "goals": ["Desarrollar habilidades de liderazgo", "Gestión de proyectos", "Mentoría a juniors"],
                "skills": ["Java", "Spring", "Microservicios", "Kubernetes"],
            },
        ]

        mentors = []
        mentees = []

        # Crear mentores
        for program in programs[:2]:  # Solo primeros 2 programas
            for mentor_data in mentors_data:
                participant, created = Participant.objects.get_or_create(
                    program=program,
                    full_name=mentor_data["full_name"],
                    role="mentor",
                    defaults={
                        "headline": mentor_data["headline"],
                        "skills": mentor_data["skills"],
                        "goals": mentor_data["goals"],
                        "availability_hours": random.randint(2, 4),
                    }
                )
                
                if created:
                    mentors.append(participant)

        # Crear mentees
        for program in programs[:2]:
            for mentee_data in mentees_data:
                participant, created = Participant.objects.get_or_create(
                    program=program,
                    full_name=mentee_data["full_name"],
                    role="mentee",
                    defaults={
                        "headline": mentee_data["headline"],
                        "skills": mentee_data["skills"],
                        "goals": mentee_data["goals"],
                        "availability_hours": random.randint(2, 3),
                    }
                )
                
                if created:
                    mentees.append(participant)

        self.stdout.write(self.style.SUCCESS(f"✅ {len(mentors)} mentores creados"))
        self.stdout.write(self.style.SUCCESS(f"✅ {len(mentees)} mentees creados"))

        # 5. Crear algunos matches
        matches_created = 0
        for program in programs[:2]:
            program_mentors = Participant.objects.filter(program=program, role="mentor")
            program_mentees = Participant.objects.filter(program=program, role="mentee")
            
            for mentee in program_mentees[:2]:  # Solo primeros 2 mentees
                if program_mentors.exists():
                    mentor = random.choice(program_mentors)
                    match, created = Match.objects.get_or_create(
                        program=program,
                        mentor=mentor,
                        mentee=mentee,
                        defaults={
                            "score": round(random.uniform(75, 95), 2),
                            "status": "active",
                        }
                    )
                    
                    if created:
                        matches_created += 1

        self.stdout.write(self.style.SUCCESS(f"✅ {matches_created} matches creados"))

        # Resumen
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS("🎉 DATABASE SEEDED SUCCESSFULLY!"))
        self.stdout.write("="*50)
        self.stdout.write(f"\n📊 Resumen:")
        self.stdout.write(f"  • Empresa: {company.name}")
        self.stdout.write(f"  • Usuarios: {User.objects.filter(company=company).count()}")
        self.stdout.write(f"  • Programas: {Program.objects.count()}")
        self.stdout.write(f"  • Participantes: {Participant.objects.count()}")
        self.stdout.write(f"  • Matches: {Match.objects.count()}")
        self.stdout.write(f"\n🔐 Credenciales:")
        self.stdout.write(f"  • Admin: admin / admin123")
        self.stdout.write(f"  • Cliente: cliente1 / cliente123")
        self.stdout.write(f"  • Facilitador: facilitador1 / facilitador123")
        self.stdout.write(f"  • Mentor: mentor1 / mentor123")
        self.stdout.write(f"  • Mentee: mentee1 / mentee123")
        self.stdout.write(f"\n🚀 Ready to go!\n")
