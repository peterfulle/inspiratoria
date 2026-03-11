#!/usr/bin/env python
"""
Script para crear un usuario admin de prueba
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from companies.models import User, Company
from django.contrib.auth.hashers import make_password


def create_test_admin():
    """
    Crea un usuario admin de prueba con todos los permisos
    """
    print("=" * 60)
    print("CREACIÓN DE USUARIO ADMIN DE PRUEBA")
    print("=" * 60)
    print()
    
    # Verificar si ya existe por email o username
    email = "admin@test.com"
    username = "admintest"
    
    # Buscar por email o username
    user = None
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        print(f"⚠️  El usuario {email} ya existe.")
    elif User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        print(f"⚠️  El usuario {username} ya existe.")
    elif User.objects.filter(username="admin").exists():
        # Si existe "admin", usar otro username
        username = "admintest2"
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            print(f"⚠️  El usuario {username} ya existe.")
    
    if user:
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Rol: {user.role}")
        print()
        print("Actualizando usuario existente con permisos de superadmin...")
        
        # Actualizar usuario existente
        user.role = "superadmin"
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.is_onboarded = True
        user.set_password("admin123")
        user.save()
        print(f"✅ Usuario actualizado: {user.email}")
    else:
        # Crear nuevo usuario
        user = User.objects.create(
            username=username,
            email=email,
            full_name="Admin de Prueba",
            role="superadmin",
            is_superuser=True,
            is_staff=True,
            is_active=True,
            is_onboarded=True,
        )
        user.set_password("admin123")
        user.save()
        print(f"✅ Usuario creado exitosamente: {email}")
    
    print()
    print("📋 CREDENCIALES DEL USUARIO ADMIN:")
    print("-" * 60)
    print(f"   Email:    {user.email}")
    print(f"   Username: {user.username}")
    print(f"   Password: admin123")
    print(f"   Rol:      {user.get_role_display()}")
    print()
    
    print("🔐 PERMISOS HABILITADOS:")
    print("-" * 60)
    print(f"   ✓ can_manage_clients:    {user.can_manage_clients}")
    print(f"   ✓ can_manage_programs:   {user.can_manage_programs}")
    print(f"   ✓ can_manage_users:      {user.can_manage_users}")
    print(f"   ✓ can_manage_activities: {user.can_manage_activities}")
    print(f"   ✓ can_execute_matches:   {user.can_execute_matches}")
    print(f"   ✓ can_view_reports:      {user.can_view_reports}")
    print(f"   ✓ can_close_programs:    {user.can_close_programs}")
    print(f"   ✓ can_manage_alerts:     {user.can_manage_alerts}")
    print()
    
    print("🌐 ACCESO:")
    print("-" * 60)
    print("   Frontend:     http://localhost:3000/login")
    print("   Django Admin: http://localhost:8000/admin")
    print()
    
    print("=" * 60)
    print("✅ USUARIO ADMIN LISTO PARA USAR")
    print("=" * 60)


if __name__ == "__main__":
    create_test_admin()
