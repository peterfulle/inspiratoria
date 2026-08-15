#!/usr/bin/env python3
"""
Script rápido para generar invitaciones de prueba.
Uso: cd backend && python generate_invitation.py <email> <rol> [programa_id]
"""

import sys
import os
import django

# Setup Django - Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)  # Change to backend directory
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')
django.setup()

from invitations.models import PendingInvitation
from companies.models import Company, User
from programs.models import Program
from datetime import datetime, timedelta

def generate_invitation(email, role='mentor', program_id=None):
    """Genera una invitación de prueba"""
    
    # Validar rol
    if role not in ['mentor', 'mentee']:
        print(f"❌ Rol inválido: {role}. Usa 'mentor' o 'mentee'")
        return
    
    # Obtener datos necesarios
    try:
        company = Company.objects.first()
        if not company:
            print("❌ No hay empresas en la base de datos. Crea una primero.")
            return
        
        if program_id:
            program = Program.objects.get(id=program_id)
        else:
            program = Program.objects.first()
            if not program:
                print("❌ No hay programas en la base de datos. Crea uno primero.")
                return
        
        admin = User.objects.filter(role='admin').first()
        if not admin:
            print("❌ No hay usuarios admin. Crea uno primero.")
            return
        
    except Program.DoesNotExist:
        print(f"❌ Programa con ID {program_id} no existe")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Verificar si ya existe invitación pendiente
    existing = PendingInvitation.objects.filter(
        email=email,
        status='pending'
    ).first()
    
    if existing:
        print(f"⚠️  Ya existe invitación pendiente para {email}")
        print(f"📧 Email: {existing.email}")
        print(f"👤 Rol: {existing.role}")
        print(f"🏢 Empresa: {existing.company.name}")
        print(f"📚 Programa: {existing.program.name}")
        print(f"🔑 Token: {existing.token}")
        print(f"⏰ Expira: {existing.expires_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"\n🔗 URL: http://localhost:3000/onboarding?token={existing.token}")
        return
    
    # Crear invitación
    try:
        invitation = PendingInvitation.objects.create(
            email=email,
            company=company,
            role=role,
            program=program,
            invited_by=admin
        )
        
        print("\n✅ ¡Invitación creada exitosamente!\n")
        print("=" * 70)
        print(f"📧 Email: {invitation.email}")
        print(f"👤 Rol: {invitation.role}")
        print(f"🏢 Empresa: {invitation.company.name}")
        print(f"📚 Programa: {invitation.program.name}")
        print(f"👨‍💼 Invitado por: {invitation.invited_by.full_name}")
        print(f"🔑 Token: {invitation.token}")
        print(f"⏰ Expira: {invitation.expires_at.strftime('%Y-%m-%d %H:%M')}")
        print("=" * 70)
        print(f"\n🔗 URL de Onboarding:\n")
        print(f"   http://localhost:3000/onboarding?token={invitation.token}")
        print("\n📋 Copia este enlace y ábrelo en tu navegador para iniciar el onboarding.")
        print("💡 Tip: Usa modo incógnito o un navegador diferente para simular un usuario nuevo.\n")
        
    except Exception as e:
        print(f"❌ Error al crear invitación: {e}")

def list_invitations():
    """Lista todas las invitaciones pendientes"""
    invitations = PendingInvitation.objects.filter(status='pending').order_by('-created_at')
    
    if not invitations:
        print("📭 No hay invitaciones pendientes")
        return
    
    print(f"\n📬 Invitaciones Pendientes ({invitations.count()})\n")
    print("=" * 100)
    
    for inv in invitations:
        status = "⏰ EXPIRADA" if inv.expires_at < datetime.now(inv.expires_at.tzinfo) else "✅ VÁLIDA"
        print(f"{status} | {inv.email:30} | {inv.role:10} | {inv.program.name:20} | Token: {inv.token[:8]}...")
    
    print("=" * 100)
    print(f"\n💡 Para ver el URL completo de una invitación, ejecuta:")
    print(f"   python generate_invitation.py <email>\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("📋 Uso:")
        print("  python generate_invitation.py <email> [rol] [programa_id]")
        print("\nEjemplos:")
        print("  python generate_invitation.py mentor@ejemplo.com mentor")
        print("  python generate_invitation.py mentee@ejemplo.com mentee 1")
        print("\n📜 Listar invitaciones pendientes:")
        print("  python generate_invitation.py --list")
        sys.exit(1)
    
    if sys.argv[1] == '--list':
        list_invitations()
    else:
        email = sys.argv[1]
        role = sys.argv[2] if len(sys.argv) > 2 else 'mentor'
        program_id = int(sys.argv[3]) if len(sys.argv) > 3 else None
        
        generate_invitation(email, role, program_id)
