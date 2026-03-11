import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from companies.models import Company, User
import uuid

# Obtener la empresa SQM
try:
    sqm = Company.objects.get(name="sqm")
    print(f"✅ Empresa encontrada: {sqm.name} (ID: {sqm.id})")
    
    # Crear usuarios de prueba
    users_data = [
        {
            "email": "maria.garcia@sqm.com",
            "full_name": "María García",
            "role": "client",
            "position": "Gerente de RRHH",
            "phone": "+56912345678"
        },
        {
            "email": "juan.perez@sqm.com",
            "full_name": "Juan Pérez",
            "role": "admin",
            "position": "Director de Operaciones",
            "phone": "+56912345679"
        },
        {
            "email": "ana.martinez@sqm.com",
            "full_name": "Ana Martínez",
            "role": "facilitator_internal",
            "position": "Coordinadora de Programas",
            "phone": "+56912345680"
        },
        {
            "email": "carlos.lopez@sqm.com",
            "full_name": "Carlos López",
            "role": "mentor",
            "position": "Senior Manager",
            "phone": "+56912345681"
        },
        {
            "email": "laura.sanchez@sqm.com",
            "full_name": "Laura Sánchez",
            "role": "mentee",
            "position": "Analista Junior",
            "phone": "+56912345682"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        # Verificar si el usuario ya existe
        existing = User.objects.filter(email=user_data["email"]).first()
        if existing:
            print(f"⚠️  Usuario ya existe: {user_data['email']}")
            continue
        
        # Crear usuario
        user = User.objects.create(
            username=user_data["email"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            position=user_data.get("position", ""),
            phone=user_data.get("phone", ""),
            company=sqm,
            is_active=True
        )
        user.set_password("inspiratoria123")  # Contraseña por defecto
        user.save()
        created_users.append(user)
        print(f"✅ Usuario creado: {user.full_name} ({user.email}) - {user.role}")
    
    print(f"\n📊 Resumen:")
    print(f"   Total usuarios creados: {len(created_users)}")
    print(f"   Total usuarios en {sqm.name}: {User.objects.filter(company=sqm).count()}")
    
except Company.DoesNotExist:
    print("❌ Empresa 'sqm' no encontrada")
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
