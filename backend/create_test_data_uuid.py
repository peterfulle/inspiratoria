import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')
django.setup()

from companies.models import Company, User
from programs.models import Program

# Crear admin de Inspiratoria
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@test.com',
        'full_name': 'Administrador Inspiratoria',
        'role': 'inspiratoria_admin',
        'is_onboarded': True,
    }
)
if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print(f"✅ Admin creado: {admin_user.username}")
else:
    print(f"✅ Admin ya existe: {admin_user.username}")

# Crear algunas empresas de prueba
companies_data = [
    {
        'name': 'Nvidia',
        'slug': 'nvidia',
        'industry': 'Tech',
        'company_size': '1-10 empleados',
        'website': 'http://localhost:3000/dashboard',
        'country': 'Chile',
    },
    {
        'name': 'Emara',
        'slug': 'emara',
        'industry': 'moda',
        'company_size': '10-50 empleados',
        'website': 'https://emara.com',
        'country': 'Chile',
    },
    {
        'name': 'Editorial Libros SpA',
        'slug': 'editorial-libros',
        'industry': 'Educación',
        'company_size': '50-100 empleados',
        'website': 'https://editoriallibros.com',
        'country': 'Chile',
    }
]

for company_data in companies_data:
    company, created = Company.objects.get_or_create(
        slug=company_data['slug'],
        defaults=company_data
    )
    if created:
        print(f"✅ Empresa creada: {company.name} (ID: {company.id})")
        
        # Crear un programa de prueba para cada empresa
        program = Program.objects.create(
            name=f"Programa {company.name}",
            description=f"Programa de mentoring para {company.name}",
            theme="demo",
            status="designed",
            company=company
        )
        print(f"   📋 Programa creado: {program.name} (ID: {program.id})")
    else:
        print(f"✅ Empresa ya existe: {company.name} (ID: {company.id})")

print("\n✨ Datos de prueba creados exitosamente!")
print(f"\n🔑 Login: admin@test.com / admin123")
