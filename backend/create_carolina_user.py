#!/usr/bin/env python
"""
Script para crear usuario carolina
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from companies.models import User, Company
from django.contrib.auth.hashers import make_password


def create_carolina_user():
    """
    Crea un usuario carolina con permisos de admin
    """
    print("=" * 60)
    print("CREACIÓN DE USUARIO CAROLINA")
    print("=" * 60)
    print()
    
    email = "carolina@test.com"
    username = "carolina"
    password = "carolina"
    
    # Verificar si ya existe
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        print(f"⚠️  El usuario {email} ya existe. Actualizando...")
        user.set_password(password)
        user.role = "ADMIN"
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print("✅ Usuario actualizado exitosamente")
    elif User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        print(f"⚠️  El usuario {username} ya existe. Actualizando...")
        user.email = email
        user.set_password(password)
        user.role = "ADMIN"
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print("✅ Usuario actualizado exitosamente")
    else:
        # Crear nuevo usuario
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            role="ADMIN",
            first_name="Carolina",
            last_name="Test",
            is_active=True,
            is_staff=True,
            is_superuser=True
        )
        print("✅ Usuario creado exitosamente")
    
    print()
    print("=" * 60)
    print("CREDENCIALES DE ACCESO")
    print("=" * 60)
    print(f"Email:    {user.email}")
    print(f"Username: {user.username}")
    print(f"Password: {password}")
    print(f"Rol:      {user.role}")
    print("=" * 60)
    print()
    print("✅ Ahora puedes iniciar sesión en:")
    print("   https://stylishly-metaphrastic-hiram.ngrok-free.dev")
    print()


if __name__ == "__main__":
    create_carolina_user()
