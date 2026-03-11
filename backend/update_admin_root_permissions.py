#!/usr/bin/env python
"""
Script para actualizar permisos de usuarios Admin Root (superadmin)
según el SOP operativo de Inspiratoria.

Este script otorga todos los permisos a usuarios con rol 'superadmin'
o que tengan is_superuser=True.
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from companies.models import User


def update_admin_root_permissions():
    """
    Actualiza permisos para todos los usuarios superadmin
    """
    # Buscar todos los superadmin
    superadmins = User.objects.filter(role="superadmin") | User.objects.filter(is_superuser=True)
    
    count = 0
    for user in superadmins:
        # Otorgar todos los permisos del Admin Root
        user.can_manage_clients = True
        user.can_manage_programs = True
        user.can_manage_users = True
        user.can_manage_activities = True
        user.can_execute_matches = True
        user.can_view_reports = True
        user.can_close_programs = True
        user.can_manage_alerts = True
        user.save()
        count += 1
        print(f"✓ Permisos actualizados para: {user.email} ({user.full_name})")
    
    print(f"\n✅ Total de usuarios actualizados: {count}")
    print("\nPermisos otorgados:")
    print("  • can_manage_clients - Setup: crear/habilitar clientes")
    print("  • can_manage_programs - Diseño: crear/configurar programas")
    print("  • can_manage_users - Usuarios: cargar/asignar roles")
    print("  • can_manage_activities - Ejecución: gestionar actividades")
    print("  • can_execute_matches - Ejecución: ejecutar y validar matches")
    print("  • can_view_reports - Cierre: ver dashboards y reportes")
    print("  • can_close_programs - Cierre: cerrar programas")
    print("  • can_manage_alerts - Seguimiento: gestionar alertas")


def create_admin_root_if_not_exists():
    """
    Crea un usuario Admin Root por defecto si no existe ninguno
    """
    existing_superadmins = User.objects.filter(role="superadmin") | User.objects.filter(is_superuser=True)
    
    if not existing_superadmins.exists():
        print("\n⚠️  No se encontraron usuarios superadmin.")
        print("Creando usuario Admin Root por defecto...")
        
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@inspiratoria.com",
            password="admin123",  # Cambiar en producción
            full_name="Admin Root",
            role="superadmin"
        )
        
        # Los permisos se otorgan automáticamente en el método save()
        print(f"✅ Usuario Admin Root creado: {admin.email}")
        print("   Username: admin")
        print("   Password: admin123")
        print("   ⚠️  IMPORTANTE: Cambiar la contraseña en producción")
    else:
        print(f"\n✓ Se encontraron {existing_superadmins.count()} usuarios superadmin existentes")


if __name__ == "__main__":
    print("=" * 60)
    print("ACTUALIZACIÓN DE PERMISOS ADMIN ROOT")
    print("=" * 60)
    print()
    
    create_admin_root_if_not_exists()
    print()
    update_admin_root_permissions()
    
    print()
    print("=" * 60)
    print("PROCESO COMPLETADO")
    print("=" * 60)
