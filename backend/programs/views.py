from fastapi import APIRouter, HTTPException, status, UploadFile, File, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
import uuid
from datetime import datetime, timedelta
from asgiref.sync import sync_to_async
import pandas as pd
import io
import json
import random
import secrets

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.db import models as db_models

from companies.models import User
from .models import Program, ProgramParticipant, Vinculation, AuditLog

router = APIRouter(prefix="/programs", tags=["Programs"])


PROGRAM_PARTICIPANT_ROLES = [
    "facilitator",
    "mentor",
    "mentee",
    "participant_cell",
]

LEGACY_PARTICIPANT_ROLE_MAP = {
    "administrator": "facilitator",
    "instructor": "mentor",
    "participant": "participant_cell",
    "observer": "participant_cell",
}


def normalize_participant_role(role: str) -> str:
    role_normalized = (role or "").strip().lower()
    if role_normalized in PROGRAM_PARTICIPANT_ROLES:
        return role_normalized
    if role_normalized in LEGACY_PARTICIPANT_ROLE_MAP:
        return LEGACY_PARTICIPANT_ROLE_MAP[role_normalized]
    return role_normalized


def map_participant_role_to_user_role(participant_role: str) -> str:
    role = normalize_participant_role(participant_role)
    mapping = {
        "facilitator": "facilitator_internal",
        "mentor": "mentor",
        "mentee": "mentee",
        "participant_cell": "participant",
    }
    return mapping.get(role, "participant")


def generate_otp_code() -> str:
    return f"{random.randint(0, 9999):04d}"


def send_participant_access_email(user: User, otp_code: str, activation_token: str):
    """Envía email HTML con código OTP — diseño Inspiratoria (mismo que _send_otp_email)"""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    activation_link = f"{frontend_url}/activate/{activation_token}"

    first_name = (user.full_name or user.first_name or "participante").split()[0]
    d1, d2, d3, d4 = otp_code[0], otp_code[1], otp_code[2], otp_code[3]

    subject = "Bienvenido a tu programa · Inspiratoria"
    plain_message = (
        f"Hola, {first_name}.\n\n"
        f"Has sido agregado a un programa en Inspiratoria.\n\n"
        f"Tu código de activación es: {otp_code}\n\n"
        f"Activa tu cuenta aquí: {activation_link}\n\n"
        f"Este código expira en 15 minutos.\n\n"
        f"Equipo Inspiratoria"
    )

    html_message = f"""
    <div style="background-color:#f9fafb;padding:40px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;">
        <div style="text-align:center;padding-bottom:32px;">
          <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;">Inspiratoria</span>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 36px;">
          <p style="margin:0 0 24px 0;color:#111827;font-size:17px;font-weight:500;">
            Hola, {first_name}.
          </p>
          <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.7;">
            Has sido agregado a un programa en Inspiratoria. Ya tienes acceso a la plataforma donde podrás participar, conectar con tu equipo y avanzar en tu proceso.
          </p>
          <p style="margin:0 0 28px 0;color:#374151;font-size:15px;line-height:1.7;">
            Para comenzar, activa tu cuenta haciendo clic en el botón de abajo e ingresa tu código de acceso.
          </p>
          <div style="text-align:center;margin:0 0 12px 0;">
            <p style="margin:0 0 12px 0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;">Código de acceso</p>
            <div style="display:inline-block;">
              <span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:26px;font-weight:700;font-family:'Courier New',monospace;color:#0a0a0a;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;margin:0 3px;">{d1}</span>
              <span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:26px;font-weight:700;font-family:'Courier New',monospace;color:#0a0a0a;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;margin:0 3px;">{d2}</span>
              <span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:26px;font-weight:700;font-family:'Courier New',monospace;color:#0a0a0a;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;margin:0 3px;">{d3}</span>
              <span style="display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:26px;font-weight:700;font-family:'Courier New',monospace;color:#0a0a0a;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;margin:0 3px;">{d4}</span>
            </div>
            <p style="margin:10px 0 0 0;color:#9ca3af;font-size:12px;">Expira en 15 minutos</p>
          </div>
          <div style="text-align:center;margin:32px 0 0 0;">
            <a href="{activation_link}" style="display:inline-block;background:#0a0a0a;color:#FFD902;padding:14px 40px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">Activar mi cuenta</a>
          </div>
        </div>
        <div style="text-align:center;padding-top:28px;">
          <p style="margin:0 0 12px 0;color:#d1d5db;font-size:11px;">
            Si no solicitaste este acceso, puedes ignorar este mensaje.
          </p>
          <p style="margin:0;color:#d1d5db;font-size:11px;">Equipo Inspiratoria</p>
        </div>
      </div>
    </div>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[PARTICIPANT EMAIL] Enviado a {user.email}")
    except Exception as e:
        print(f"[PARTICIPANT EMAIL ERROR] No se pudo enviar a {user.email}: {e}")


def prepare_user_secure_access(user: User, send_invitation: bool):
    if not send_invitation:
        return

    otp_code = generate_otp_code()
    activation_token = secrets.token_urlsafe(32)

    user.otp_code = otp_code
    user.otp_expires_at = timezone.now() + timedelta(minutes=15)
    user.activation_token = activation_token
    user.is_account_activated = False
    user.totp_enabled = False
    user.is_onboarded = False
    user.save(update_fields=[
        "otp_code",
        "otp_expires_at",
        "activation_token",
        "is_account_activated",
        "totp_enabled",
        "is_onboarded",
    ])

    send_participant_access_email(user, otp_code, activation_token)


def send_match_notification_email(
    recipient: User,
    partner: User,
    program: Program,
    role_in_pair: str,  # "mentor" o "mentee" (rol del recipient)
    score: float | None = None,
    matched_keywords: list[str] | None = None,
    reasons: list[str] | None = None,
    ai_recommendation: str | None = None,
):
    """Notifica vía email a un participante que tiene una nueva vinculación activa."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    portal_url = f"{frontend_url}/dashboard"

    first_name = (recipient.full_name or recipient.first_name or "").split()[0] or "Hola"
    partner_name = f"{partner.first_name or ''} {partner.last_name or ''}".strip() or partner.email
    partner_role_label = "mentor/a" if role_in_pair == "mentee" else "mentee"
    pronoun = "tu mentor/a" if role_in_pair == "mentee" else "tu mentee"

    subject = f"Tienes nuevo match en {program.name} · Inspiratoria"

    # Score badge
    score_block = ""
    if score is not None:
        color = "#10b981" if score >= 70 else "#f59e0b" if score >= 50 else "#ef4444"
        score_block = (
            f'<div style="display:inline-block;background:{color}1A;color:{color};'
            f'padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;'
            f'letter-spacing:0.4px;text-transform:uppercase;">Match score: {score:.0f}/100</div>'
        )

    # Keywords
    kw_block = ""
    if matched_keywords:
        chips = "".join(
            f'<span style="display:inline-block;background:#f3f4f6;color:#374151;'
            f'padding:4px 10px;border-radius:999px;font-size:11px;margin:2px;">{k}</span>'
            for k in matched_keywords[:8]
        )
        kw_block = (
            '<div style="margin-top:18px;">'
            '<p style="margin:0 0 8px 0;color:#9ca3af;font-size:11px;font-weight:600;'
            'text-transform:uppercase;letter-spacing:1.5px;">Temas en común</p>'
            f'<div>{chips}</div></div>'
        )

    # Reasons
    reasons_block = ""
    if reasons:
        items = "".join(f'<li style="margin:4px 0;">{r}</li>' for r in reasons[:4])
        reasons_block = (
            '<div style="margin-top:18px;background:#f9fafb;border-radius:10px;padding:14px 18px;">'
            '<p style="margin:0 0 6px 0;color:#9ca3af;font-size:11px;font-weight:600;'
            'text-transform:uppercase;letter-spacing:1.5px;">Por qué este match</p>'
            f'<ul style="margin:0;padding-left:18px;color:#374151;font-size:13px;'
            f'line-height:1.6;">{items}</ul></div>'
        )

    # AI recommendation
    ai_block = ""
    if ai_recommendation:
        ai_block = (
            '<div style="margin-top:14px;border-left:3px solid #8b5cf6;background:#f5f3ff;'
            'padding:12px 16px;border-radius:8px;">'
            '<p style="margin:0 0 4px 0;color:#7c3aed;font-size:11px;font-weight:700;'
            'text-transform:uppercase;letter-spacing:1px;">🤖 Análisis IA</p>'
            f'<p style="margin:0;color:#4c1d95;font-size:13px;font-style:italic;'
            f'line-height:1.5;">{ai_recommendation}</p></div>'
        )

    plain_message = (
        f"Hola, {first_name}.\n\n"
        f"Te asignamos {pronoun} en el programa {program.name}.\n\n"
        f"Tu {partner_role_label}: {partner_name} ({partner.email})\n"
        + (f"Score de compatibilidad: {score:.0f}/100\n" if score is not None else "")
        + (f"\nTemas en común: {', '.join(matched_keywords[:8])}\n" if matched_keywords else "")
        + (f"\nPor qué este match:\n- " + "\n- ".join(reasons[:4]) + "\n" if reasons else "")
        + f"\nIngresa al portal para conocer más y comenzar a coordinar:\n{portal_url}\n\n"
        f"Equipo Inspiratoria"
    )

    html_message = f"""
    <div style="background-color:#f9fafb;padding:40px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="text-align:center;padding-bottom:28px;">
          <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;">Inspiratoria</span>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 36px;">
          <p style="margin:0 0 8px 0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Nuevo match asignado</p>
          <h1 style="margin:0 0 18px 0;color:#0a0a0a;font-size:22px;font-weight:700;line-height:1.3;">
            Hola, {first_name}. Conoce a {pronoun}.
          </h1>
          <p style="margin:0 0 24px 0;color:#4b5563;font-size:14px;line-height:1.7;">
            Te hemos asignado un match en el programa <strong>{program.name}</strong>. A partir de hoy puedes coordinar sesiones, definir objetivos y empezar a trabajar con esta persona desde tu portal.
          </p>

          <div style="background:#0a0a0a;border-radius:14px;padding:24px;color:#ffffff;">
            <p style="margin:0 0 6px 0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Tu {partner_role_label}</p>
            <p style="margin:0 0 4px 0;color:#ffffff;font-size:18px;font-weight:700;">{partner_name}</p>
            <p style="margin:0 0 14px 0;color:#FFD902;font-size:13px;">{partner.email}</p>
            {score_block}
          </div>

          {kw_block}
          {reasons_block}
          {ai_block}

          <div style="text-align:center;margin:32px 0 0 0;">
            <a href="{portal_url}" style="display:inline-block;background:#0a0a0a;color:#FFD902;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">Ir a mi portal</a>
          </div>

          <p style="margin:24px 0 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
            Programa: <strong style="color:#374151;">{program.name}</strong><br/>
            Estado: vinculación activa
          </p>
        </div>
        <div style="text-align:center;padding-top:24px;">
          <p style="margin:0;color:#d1d5db;font-size:11px;">Equipo Inspiratoria</p>
        </div>
      </div>
    </div>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[MATCH EMAIL] Enviado a {recipient.email} (partner={partner.email})")
        return True
    except Exception as e:
        print(f"[MATCH EMAIL ERROR] {recipient.email}: {e}")
        return False


# ============ SCHEMAS ============

class UserSearchResult(BaseModel):
    id: str
    email: str
    nombre: str  # Cambiado de first_name
    apellidos: str  # Cambiado de last_name
    telefono: str = ""  # Agregado
    role: str
    company: Optional[str] = None
    is_onboarded: bool
    
    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    """Request para crear un nuevo usuario"""
    email: EmailStr
    first_name: str
    last_name: str
    company_id: Optional[str] = None
    role: Optional[str] = "participant_cell"


class ParticipantCreateRequest(BaseModel):
    user_id: str
    role: str = Field(..., pattern="^(facilitator|mentor|mentee|participant_cell|administrator|instructor|participant|observer)$")
    status: str = Field(default="pending", pattern="^(active|pending|suspended|inactive)$")
    send_invitation: bool = True
    vinculation_mentor_id: Optional[str] = None  # Si se vincula con un mentor al crear


class ParticipantResponse(BaseModel):
    id: str
    user: UserSearchResult
    program_id: str
    role: str
    status: str
    invitation_sent_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None
    last_access_at: Optional[datetime] = None
    configuration: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ParticipantUpdateRequest(BaseModel):
    role: Optional[str] = Field(None, pattern="^(facilitator|mentor|mentee|participant_cell|administrator|instructor|participant|observer)$")
    status: Optional[str] = Field(None, pattern="^(active|pending|suspended|inactive)$")
    configuration: Optional[Dict[str, Any]] = None


class VinculationCreateRequest(BaseModel):
    mentor_id: str
    mentee_id: str
    vinculation_type: str = Field(..., pattern="^(mentoria|tutoria|equipo|coaching)$")
    metadata: Optional[Dict[str, Any]] = {}


class VinculationResponse(BaseModel):
    id: str
    mentor: UserSearchResult
    mentee: UserSearchResult
    vinculation_type: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    metadata: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True


class BatchValidationRow(BaseModel):
    row_number: int
    email: str
    first_name: str
    last_name: str
    role: str
    vinculation_email: Optional[str] = None
    errors: List[str] = []
    warnings: List[str] = []
    user_exists: bool = False
    user_id: Optional[str] = None


class BatchValidationResult(BaseModel):
    total_rows: int
    valid_rows: int
    rows_with_errors: int
    rows_with_warnings: int
    details: List[BatchValidationRow]


class BatchImportRequest(BaseModel):
    rows: List[Dict[str, Any]]
    send_invitations: bool = True


class AuditLogResponse(BaseModel):
    id: str
    program_id: str
    user_email: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


# ============ HELPER FUNCTIONS ============

async def log_audit(program_id: str, user: User, action: str, entity_type: str, 
                   entity_id: Optional[str], details: str, ip_address: Optional[str] = None):
    """Helper para crear audit logs"""
    def create_log():
        return AuditLog.objects.create(
            program_id=program_id,
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address or "unknown"
        )
    
    await sync_to_async(create_log)()


def validate_email_format(email: str) -> bool:
    """Validar formato de email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


# ============ PARTICIPANT PORTAL (My Programs) ============

@router.get("/my-programs/{user_id}")
async def get_my_programs(user_id: str):
    """
    Obtener los programas en los que participa un usuario (vista participante).
    Retorna programas con módulos, actividades, progreso, etc.
    """
    def fetch():
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        memberships = ProgramParticipant.objects.filter(
            user=user, deleted_at__isnull=True
        ).select_related('program', 'program__company')

        results = []
        for m in memberships:
            p = m.program
            # Activities for this program
            activities = list(p.activities.all().values(
                'id', 'name', 'description', 'activity_type', 'status',
                'start_date', 'end_date', 'modality', 'meeting_url',
            ))
            # Modules (Content) from training activities
            modules = []
            for act in p.activities.filter(activity_type='training'):
                for mod in act.modules.all().order_by('order'):
                    modules.append({
                        "id": mod.id,
                        "title": mod.title,
                        "description": mod.description,
                        "order": mod.order,
                        "duration_minutes": mod.duration_minutes,
                        "is_published": mod.is_published,
                        "activity_name": act.name,
                    })
            # Vinculations (mentor/mentee pairs)
            from programs.models import Vinculation
            vinc = Vinculation.objects.filter(
                program=p, status='active'
            ).filter(
                db_models.Q(participant1__user=user) | db_models.Q(participant2__user=user)
            ).select_related('participant1__user', 'participant2__user').first()
            vinculation_info = None
            if vinc:
                other = vinc.participant2 if vinc.participant1.user == user else vinc.participant1
                vinculation_info = {
                    "type": vinc.type,
                    "partner_name": other.user.get_full_name(),
                    "partner_email": other.user.email,
                    "partner_role": other.role,
                }
            # Total participants
            total_participants = ProgramParticipant.objects.filter(
                program=p, deleted_at__isnull=True
            ).count()

            results.append({
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "theme": p.theme,
                "status": p.status,
                "company_name": p.company.name if p.company else None,
                "company_slug": p.company.slug if p.company else None,
                "my_role": m.role,
                "my_status": m.status,
                "joined_at": m.created_at.isoformat() if m.created_at else None,
                "activated_at": m.activated_at.isoformat() if m.activated_at else None,
                "total_participants": total_participants,
                "activities": activities,
                "modules": modules,
                "vinculation": vinculation_info,
            })
        return results

    data = await sync_to_async(fetch)()
    return data


# ============ PARTICIPANT ENDPOINTS ============

@router.get("/{program_id}/participants", response_model=List[ParticipantResponse])
async def list_participants(
    program_id: str,
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Listar participantes de un programa con filtros
    """
    def get_participants():
        # Verificar que el programa existe
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        # Query base
        queryset = ProgramParticipant.objects.filter(
            program=program,
            deleted_at__isnull=True
        ).select_related('user', 'user__company')
        
        # Aplicar filtros
        if role:
            queryset = queryset.filter(role=role)
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                user__email__icontains=search
            ) | queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(
                user__last_name__icontains=search
            )
        
        # Paginación
        participants = list(queryset.order_by('-created_at')[skip:skip+limit])
        
        # Construir respuesta
        result = []
        for p in participants:
            result.append({
                "id": str(p.id),
                "user": {
                    "id": str(p.user.id),
                    "nombre": p.user.first_name,  # Cambiado de first_name a nombre
                    "apellidos": p.user.last_name,  # Cambiado de last_name a apellidos
                    "email": p.user.email,
                    "telefono": getattr(p.user, 'phone', ''),  # Agregado telefono
                    "role": p.user.role,
                    "company": p.user.company.name if p.user.company else None,
                    "is_onboarded": p.user.is_onboarded,
                },
                "program_id": str(p.program.id),
                "role": p.role,
                "status": p.status,
                "invitation_sent_at": p.invitation_sent_at,
                "activated_at": p.activated_at,
                "last_access_at": p.last_access_at,
                "configuration": p.configuration or {},
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            })
        
        return result
    
    participants = await sync_to_async(get_participants)()
    return participants


@router.get("/{program_id}/participants/stats")
async def get_participants_stats(program_id: str):
    """
    Obtener estadísticas del dashboard de participantes
    """
    def get_stats():
        from django.db.models import Count, Q
        from datetime import timedelta
        from django.utils import timezone
        
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        # Estadísticas básicas
        total = ProgramParticipant.objects.filter(
            program=program,
            deleted_at__isnull=True
        ).count()
        
        active = ProgramParticipant.objects.filter(
            program=program,
            deleted_at__isnull=True,
            status='active'
        ).count()
        
        pending = ProgramParticipant.objects.filter(
            program=program,
            deleted_at__isnull=True,
            status='pending'
        ).count()
        
        # Nuevos en los últimos 7 días
        seven_days_ago = timezone.now() - timedelta(days=7)
        new_participants = ProgramParticipant.objects.filter(
            program=program,
            deleted_at__isnull=True,
            created_at__gte=seven_days_ago
        ).count()
        
        # Por rol
        by_role = dict(
            ProgramParticipant.objects.filter(
                program=program,
                deleted_at__isnull=True
            ).values('role').annotate(count=Count('id')).values_list('role', 'count')
        )
        
        # Participantes recientes
        recent = ProgramParticipant.objects.filter(
            program=program,
            deleted_at__isnull=True
        ).select_related('user').order_by('-created_at')[:5]
        
        recent_list = [{
            "id": str(p.id),
            "user": {
                "email": p.user.email,
                "first_name": p.user.first_name,
                "last_name": p.user.last_name,
            },
            "role": p.role,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        } for p in recent]
        
        return {
            "total": total,
            "active": active,
            "pending": pending,
            "new_last_7_days": new_participants,
            "by_role": by_role,
            "recent": recent_list,
        }
    
    stats = await sync_to_async(get_stats)()
    return stats


@router.post("/{program_id}/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
async def create_participant(program_id: str, payload: ParticipantCreateRequest):
    """
    Agregar un participante al programa
    """
    def add_participant():
        # Verificar programa
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        # Verificar usuario
        try:
            user = User.objects.get(id=payload.user_id)
        except User.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Verificar si ya existe (activo)
        if ProgramParticipant.objects.filter(
            program=program,
            user=user,
            deleted_at__isnull=True
        ).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya es participante de este programa"
            )
        
        # Crear participante (o reactivar si fue soft-deleted)
        participant_role = normalize_participant_role(payload.role)
        existing_deleted = ProgramParticipant.objects.filter(
            program=program, user=user
        ).exclude(deleted_at__isnull=True).first()

        if existing_deleted:
            existing_deleted.role = participant_role
            existing_deleted.status = payload.status
            existing_deleted.deleted_at = None
            existing_deleted.invitation_sent_at = datetime.now() if payload.send_invitation else None
            existing_deleted.save()
            participant = existing_deleted
        else:
            participant = ProgramParticipant.objects.create(
                program=program,
                user=user,
                role=participant_role,
                status=payload.status,
                invitation_sent_at=datetime.now() if payload.send_invitation else None
            )

        # Mantener rol de usuario alineado al rol operativo dentro del programa
        user_role = map_participant_role_to_user_role(participant_role)
        if user.role != user_role:
            user.role = user_role
            user.save(update_fields=['role'])
        
        # Si se especificó vinculación con mentor
        if payload.vinculation_mentor_id:
            try:
                mentor = ProgramParticipant.objects.get(
                    id=payload.vinculation_mentor_id,
                    program=program,
                    deleted_at__isnull=True
                )
                Vinculation.objects.create(
                    program=program,
                    mentor=mentor,
                    mentee=participant,
                    vinculation_type='mentoria',
                    status='active'
                )
            except ProgramParticipant.DoesNotExist:
                pass  # Silenciar error si no existe el mentor
        
        prepare_user_secure_access(user, payload.send_invitation)
        
        # Construir respuesta
        return {
            "id": str(participant.id),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "nombre": user.first_name,  # Cambiado de first_name
                "apellidos": user.last_name,  # Cambiado de last_name
                "telefono": getattr(user, 'phone', ''),  # Agregado
                "role": user.role,
                "company": user.company.name if user.company else None,
                "is_onboarded": user.is_onboarded,
            },
            "program_id": str(program.id),
            "role": participant.role,
            "status": participant.status,
            "invitation_sent_at": participant.invitation_sent_at,
            "activated_at": participant.activated_at,
            "last_access_at": participant.last_access_at,
            "configuration": participant.configuration or {},
            "created_at": participant.created_at,
            "updated_at": participant.updated_at,
        }
    
    result = await sync_to_async(add_participant)()
    return result


@router.put("/{program_id}/participants/{participant_id}", response_model=ParticipantResponse)
async def update_participant(program_id: str, participant_id: str, payload: ParticipantUpdateRequest):
    """
    Actualizar datos de un participante
    """
    def update():
        try:
            program = Program.objects.get(id=program_id)
            participant = ProgramParticipant.objects.get(
                id=participant_id,
                program=program,
                deleted_at__isnull=True
            )
        except (Program.DoesNotExist, ProgramParticipant.DoesNotExist):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participante no encontrado"
            )
        
        # Actualizar campos
        if payload.role:
            participant.role = normalize_participant_role(payload.role)
            user_role = map_participant_role_to_user_role(participant.role)
            if participant.user.role != user_role:
                participant.user.role = user_role
                participant.user.save(update_fields=['role'])
        if payload.status:
            participant.status = payload.status
            if payload.status == 'active' and not participant.activated_at:
                participant.activated_at = datetime.now()
        if payload.configuration is not None:
            participant.configuration = payload.configuration
        
        participant.save()
        
        # Construir respuesta
        user = participant.user
        return {
            "id": str(participant.id),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "company": user.company.name if user.company else None,
                "is_onboarded": user.is_onboarded,
            },
            "program_id": str(program.id),
            "role": participant.role,
            "status": participant.status,
            "invitation_sent_at": participant.invitation_sent_at,
            "activated_at": participant.activated_at,
            "last_access_at": participant.last_access_at,
            "configuration": participant.configuration or {},
            "created_at": participant.created_at,
            "updated_at": participant.updated_at,
        }
    
    result = await sync_to_async(update)()
    return result


@router.delete("/{program_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_participant(program_id: str, participant_id: str):
    """
    Eliminar participante (soft delete)
    """
    def delete():
        try:
            program = Program.objects.get(id=program_id)
            participant = ProgramParticipant.objects.get(
                id=participant_id,
                program=program,
                deleted_at__isnull=True
            )
        except (Program.DoesNotExist, ProgramParticipant.DoesNotExist):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participante no encontrado"
            )
        
        participant.status = 'deleted'
        participant.deleted_at = datetime.now()
        participant.save(update_fields=['status', 'deleted_at'])
    
    await sync_to_async(delete)()
    return None


# ============ USER SEARCH ENDPOINTS ============

@router.get("/users/search", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=2),
    exclude_program_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Buscar usuarios por email, nombre o apellido
    Excluye usuarios que ya están en el programa especificado
    """
    def search():
        queryset = User.objects.filter(is_active=True).select_related('company')
        
        # Buscar por email, nombre o apellido
        queryset = queryset.filter(
            email__icontains=q
        ) | queryset.filter(
            first_name__icontains=q
        ) | queryset.filter(
            last_name__icontains=q
        )
        
        # Excluir participantes del programa
        if exclude_program_id:
            existing_user_ids = ProgramParticipant.objects.filter(
                program_id=exclude_program_id,
                deleted_at__isnull=True
            ).values_list('user_id', flat=True)
            queryset = queryset.exclude(id__in=list(existing_user_ids))
        
        users = list(queryset[:limit])
        
        return [{
            "id": str(u.id),
            "email": u.email,
            "nombre": u.first_name or "",
            "apellidos": u.last_name or "",
            "telefono": getattr(u, 'phone', '') or "",
            "role": u.role,
            "company": u.company.name if u.company else None,
            "is_onboarded": u.is_onboarded,
        } for u in users]
    
    results = await sync_to_async(search)()
    return results


@router.post("/users", response_model=UserSearchResult, status_code=status.HTTP_201_CREATED)
async def create_user_for_program(request: CreateUserRequest):
    """
    Crear un nuevo usuario (para flujo de carga individual)
    """
    def create():
        from companies.models import Company
        
        # Si el usuario ya existe, retornarlo (para poder agregarlo a programas)
        existing = User.objects.filter(email=request.email).first()
        if existing:
            return {
                "id": str(existing.id),
                "email": existing.email,
                "nombre": existing.first_name,
                "apellidos": existing.last_name,
                "telefono": getattr(existing, 'phone', ''),
                "role": existing.role,
                "company": existing.company.name if existing.company else None,
                "is_onboarded": existing.is_onboarded,
            }
        
        # Verificar company si se proporciona
        company = None
        if request.company_id:
            try:
                company = Company.objects.get(id=request.company_id)
            except Company.DoesNotExist:
                pass
        
        # Generar username único basado en el email
        base_username = request.email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Crear usuario
        user = User.objects.create(
            email=request.email,
            username=username,
            first_name=request.first_name,
            last_name=request.last_name,
            company=company,
            role=map_participant_role_to_user_role(request.role or 'participant_cell'),
            is_onboarded=False,
        )
        
        return {
            "id": str(user.id),
            "email": user.email,
            "nombre": user.first_name,
            "apellidos": user.last_name,
            "telefono": getattr(user, 'phone', ''),
            "role": user.role,
            "company": company.name if company else None,
            "is_onboarded": user.is_onboarded,
        }
    
    result = await sync_to_async(create)()
    return result


# ============ BATCH OPERATIONS ============

@router.get("/{program_id}/participants/template")
async def download_template(program_id: str):
    """
    Descargar plantilla Excel para carga masiva
    """
    # Verificar que el programa existe
    def check_program():
        try:
            Program.objects.get(id=program_id)
            return True
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
    
    await sync_to_async(check_program)()
    
    # Crear DataFrame con columnas de ejemplo
    df = pd.DataFrame({
        'email': ['ejemplo@empresa.com'],
        'first_name': ['Juan'],
        'last_name': ['Pérez'],
        'role': ['participant_cell'],  # facilitator, mentor, mentee, participant_cell
        'vinculation_email': [''],  # Email del mentor (opcional)
    })
    
    # Convertir a Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Participantes')
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': f'attachment; filename=plantilla_participantes.xlsx'
        }
    )


@router.post("/{program_id}/participants/validate-batch", response_model=BatchValidationResult)
async def validate_batch(program_id: str, file: UploadFile = File(...)):
    """
    Validar archivo Excel antes de importar
    """
    def validate():
        # Verificar programa
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        # Leer Excel
        try:
            filename = (file.filename or '').lower()
            if filename.endswith('.csv'):
                df = pd.read_csv(file.file)
            else:
                df = pd.read_excel(file.file)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error al leer el archivo: {str(e)}"
            )
        
        # Validar columnas requeridas
        required_cols = ['email', 'first_name', 'last_name', 'role']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Faltan columnas requeridas: {', '.join(missing_cols)}"
            )
        
        # Validar cada fila
        results = []
        valid_count = 0
        error_count = 0
        warning_count = 0
        
        existing_participants = set(
            ProgramParticipant.objects.filter(
                program=program,
                deleted_at__isnull=True
            ).values_list('user__email', flat=True)
        )
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # +2 porque Excel empieza en 1 y tiene header
            errors = []
            warnings = []
            
            email = str(row.get('email', '')).strip().lower()
            first_name = str(row.get('first_name', '')).strip()
            last_name = str(row.get('last_name', '')).strip()
            role = normalize_participant_role(str(row.get('role', '')).strip().lower())
            vinculation_email = str(row.get('vinculation_email', '')).strip().lower() if pd.notna(row.get('vinculation_email')) else None
            
            # Validar email
            if not email or not validate_email_format(email):
                errors.append("Email inválido o vacío")
            
            # Validar nombres
            if not first_name:
                errors.append("Nombre requerido")
            if not last_name:
                errors.append("Apellido requerido")
            
            # Validar rol
            valid_roles = PROGRAM_PARTICIPANT_ROLES
            if role not in valid_roles:
                errors.append(f"Rol inválido. Debe ser: {', '.join(valid_roles)}")
            
            # Verificar si el usuario existe
            user_exists = User.objects.filter(email=email).exists()
            user_id = None
            if user_exists:
                user = User.objects.get(email=email)
                user_id = str(user.id)
                warnings.append("Usuario ya existe en el sistema")
            
            # Verificar si ya es participante
            if email in existing_participants:
                errors.append("Ya es participante de este programa")
            
            # Validar vinculación
            if vinculation_email:
                if not validate_email_format(vinculation_email):
                    errors.append("Email de vinculación inválido")
                elif vinculation_email == email:
                    errors.append("No puede vincularse consigo mismo")
            
            if errors:
                error_count += 1
            elif warnings:
                warning_count += 1
            else:
                valid_count += 1
            
            results.append(BatchValidationRow(
                row_number=row_num,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                vinculation_email=vinculation_email,
                errors=errors,
                warnings=warnings,
                user_exists=user_exists,
                user_id=user_id
            ))
        
        return BatchValidationResult(
            total_rows=len(df),
            valid_rows=valid_count,
            rows_with_errors=error_count,
            rows_with_warnings=warning_count,
            details=results
        )
    
    result = await sync_to_async(validate)()
    return result


@router.post("/{program_id}/participants/batch", status_code=status.HTTP_201_CREATED)
async def import_batch(program_id: str, payload: BatchImportRequest):
    """
    Importar participantes en lote (después de validación)
    """
    def import_participants():
        # Verificar programa
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        created = []
        errors = []
        
        for row_data in payload.rows:
            try:
                email = row_data['email'].strip().lower()
                
                # Obtener o crear usuario
                user, user_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': row_data['first_name'].strip(),
                        'last_name': row_data['last_name'].strip(),
                        'role': map_participant_role_to_user_role(row_data.get('role', 'participant_cell')),
                        'is_onboarded': False,
                    }
                )

                normalized_role = normalize_participant_role(row_data.get('role', 'participant_cell'))

                desired_user_role = map_participant_role_to_user_role(normalized_role)
                if user.role != desired_user_role:
                    user.role = desired_user_role
                    user.save(update_fields=['role'])
                
                # Crear participante
                participant, part_created = ProgramParticipant.objects.get_or_create(
                    program=program,
                    user=user,
                    defaults={
                        'role': normalized_role,
                        'status': 'pending',
                        'invitation_sent_at': datetime.now() if payload.send_invitations else None,
                    }
                )
                
                if part_created:
                    created.append({
                        'email': email,
                        'participant_id': str(participant.id),
                        'user_created': user_created
                    })
                    
                    prepare_user_secure_access(user, payload.send_invitations)
                
            except Exception as e:
                errors.append({
                    'email': row_data.get('email', 'unknown'),
                    'error': str(e)
                })
        
        return {
            "created_count": len(created),
            "error_count": len(errors),
            "created": created,
            "errors": errors,
        }
    
    result = await sync_to_async(import_participants)()
    return result


# ============ VINCULATIONS ENDPOINTS ============

@router.get("/{program_id}/vinculations")
async def list_vinculations(program_id: str):
    """
    Listar todas las vinculaciones del programa
    """
    def _serialize_participant(pp):
        u = pp.user
        full = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email
        return {
            "id": str(u.id),
            "participant_id": str(pp.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "full_name": full,
            "role": pp.role,
            "company": u.company.name if getattr(u, "company", None) else None,
            "is_onboarded": u.is_onboarded,
        }

    def get_vinculations():
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )

        vinculations = Vinculation.objects.filter(
            program=program,
        ).select_related(
            'participant1__user', 'participant1__user__company',
            'participant2__user', 'participant2__user__company',
        )

        result = []
        for v in vinculations:
            # Determinar mentor/mentee según el rol del participante en el programa.
            # activate_intelligent_match crea participant1=mentor, participant2=mentee,
            # pero confirmamos por rol para ser robustos ante otras vías de creación.
            p1, p2 = v.participant1, v.participant2
            if p2.role == "mentor" and p1.role != "mentor":
                mentor_pp, mentee_pp = p2, p1
            else:
                mentor_pp, mentee_pp = p1, p2

            meta = v.metadata or {}
            result.append({
                "id": str(v.id),
                "mentor": _serialize_participant(mentor_pp),
                "mentee": _serialize_participant(mentee_pp),
                "type": v.type,
                "status": v.status,
                "score": meta.get("score"),
                "ai_recommendation": meta.get("ai_recommendation"),
                "matched_keywords": meta.get("matched_keywords", []),
                "reasons": meta.get("reasons", []),
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "metadata": meta,
            })

        return result
    
    vinculations = await sync_to_async(get_vinculations)()
    return vinculations


@router.post("/{program_id}/vinculations", status_code=status.HTTP_201_CREATED)
async def create_vinculation(program_id: str, payload: VinculationCreateRequest):
    """
    Crear una vinculación entre dos participantes
    """
    def create():
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        # Obtener participantes
        try:
            mentor = ProgramParticipant.objects.get(
                id=payload.mentor_id,
                program=program,
                deleted_at__isnull=True
            )
            mentee = ProgramParticipant.objects.get(
                id=payload.mentee_id,
                program=program,
                deleted_at__isnull=True
            )
        except ProgramParticipant.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Uno o ambos participantes no encontrados"
            )
        
        # Verificar que no exista ya una vinculación activa entre ellos (en cualquier orden)
        if Vinculation.objects.filter(
            program=program,
            status='active',
        ).filter(
            db_models.Q(participant1=mentor, participant2=mentee) |
            db_models.Q(participant1=mentee, participant2=mentor)
        ).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una vinculación activa entre estos participantes"
            )

        # Crear vinculación (participant1=mentor, participant2=mentee)
        vinc_type = payload.vinculation_type if payload.vinculation_type in (
            "mentoria", "tutoria", "equipo", "coaching"
        ) else "mentoria"
        vinculation = Vinculation.objects.create(
            program=program,
            participant1=mentor,
            participant2=mentee,
            type=vinc_type,
            status='active',
            metadata=payload.metadata or {},
        )

        def _serialize(pp):
            u = pp.user
            full = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email
            return {
                "id": str(u.id),
                "participant_id": str(pp.id),
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "full_name": full,
                "role": pp.role,
                "company": u.company.name if getattr(u, "company", None) else None,
                "is_onboarded": u.is_onboarded,
            }

        meta = vinculation.metadata or {}
        return {
            "id": str(vinculation.id),
            "mentor": _serialize(mentor),
            "mentee": _serialize(mentee),
            "type": vinculation.type,
            "status": vinculation.status,
            "score": meta.get("score"),
            "ai_recommendation": meta.get("ai_recommendation"),
            "created_at": vinculation.created_at.isoformat() if vinculation.created_at else None,
            "metadata": meta,
        }
    
    result = await sync_to_async(create)()
    return result


@router.delete("/{program_id}/vinculations/{vinculation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vinculation(program_id: str, vinculation_id: str):
    """
    Eliminar una vinculación
    """
    def delete():
        try:
            program = Program.objects.get(id=program_id)
            vinculation = Vinculation.objects.get(
                id=vinculation_id,
                program=program,
            )
        except (Program.DoesNotExist, Vinculation.DoesNotExist):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vinculación no encontrada"
            )

        # Desvincular = marcar inactiva (soft) y registrar fin
        from django.utils import timezone as dj_timezone
        vinculation.status = 'inactive'
        vinculation.ended_at = dj_timezone.now()
        vinculation.save(update_fields=["status", "ended_at"])
    
    await sync_to_async(delete)()
    return None


# ============ AUDIT LOG ENDPOINTS ============

@router.get("/{program_id}/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    program_id: str,
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Obtener logs de auditoría del programa
    """
    def get_logs():
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Programa no encontrado"
            )
        
        queryset = AuditLog.objects.filter(program=program).select_related('user')
        
        if action:
            queryset = queryset.filter(action=action)
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        logs = list(queryset.order_by('-timestamp')[skip:skip+limit])
        
        return [{
            "id": str(log.id),
            "program_id": str(log.program.id),
            "user_email": log.user.email,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "timestamp": log.timestamp,
        } for log in logs]
    
    logs = await sync_to_async(get_logs)()
    return logs


# ============ CROSS-PROGRAM USER MANAGEMENT ============

@router.get("/users-with-programs")
async def get_users_with_programs():
    """
    Get all users with their program participation summary.
    Used for cross-program user management interface.
    """
    def get_users():
        from django.db.models import Q, Count, Prefetch
        from companies.models import User, Company
        
        # Get ALL users (not just those with programs)
        users = User.objects.all().select_related('company')
        
        result = []
        for user in users:
            # Get all program participations for this user
            participations = ProgramParticipant.objects.filter(
                user=user,
                deleted_at__isnull=True
            ).select_related('program')
            
            programs_data = []
            for pp in participations:
                # Get vinculation info if exists
                vinculation_data = None
                vinculation = Vinculation.objects.filter(
                    Q(participant1=pp) | Q(participant2=pp)
                ).select_related('participant1__user', 'participant2__user').first()
                
                if vinculation:
                    # Determine if user is participant1 or participant2
                    is_participant1 = vinculation.participant1 == pp
                    match_user = vinculation.participant2.user if is_participant1 else vinculation.participant1.user
                    
                    # Extract first and last name from full_name if available
                    match_name = match_user.full_name if hasattr(match_user, 'full_name') and match_user.full_name else f"{match_user.first_name} {match_user.last_name}".strip()
                    
                    vinculation_data = {
                        "type": vinculation.type,
                        "match_name": match_name
                    }
                
                programs_data.append({
                    "program_id": str(pp.program.id),
                    "program_name": pp.program.name,
                    "role": pp.role,
                    "status": pp.status,
                    "created_at": pp.created_at.isoformat(),
                    "last_access_at": pp.last_access_at.isoformat() if pp.last_access_at else None,
                    "vinculation": vinculation_data
                })
            
            # Extract nombre and apellidos from full_name if available
            nombre = ""
            apellidos = ""
            if hasattr(user, 'full_name') and user.full_name:
                parts = user.full_name.split(' ', 1)
                nombre = parts[0]
                apellidos = parts[1] if len(parts) > 1 else ""
            else:
                nombre = user.first_name
                apellidos = user.last_name
            
            result.append({
                "id": str(user.id),
                "email": user.email,
                "nombre": nombre,
                "apellidos": apellidos,
                "role": user.role,
                "company": {
                    "id": str(user.company.id),
                    "name": user.company.name
                } if user.company else None,
                "programs": programs_data,
                "total_programs": len(programs_data),
                "active_programs": len([p for p in programs_data if p["status"] == "active"])
            })
        
        return result
    
    users = await sync_to_async(get_users)()
    return users


# ============ PUBLIC SELF-ENROLLMENT ============

class PublicProgramInfo(BaseModel):
    """Información pública del programa para la página de auto-inscripción"""
    id: str
    name: str
    description: str
    theme: str
    status: str
    company: Optional[str] = None
    accepting_enrollments: bool


class SelfEnrollRequest(BaseModel):
    """Petición pública de auto-inscripción"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)
    role: str = Field(..., pattern="^(facilitator|mentor|mentee|participant_cell)$")


class SelfEnrollResponse(BaseModel):
    ok: bool
    message: str
    email: str
    already_enrolled: bool = False


@router.get("/{program_id}/public-info", response_model=PublicProgramInfo)
async def get_program_public_info(program_id: str):
    """Devuelve info pública del programa (sin autenticación) para la página /enroll/{id}."""
    def fetch():
        try:
            program = Program.objects.select_related('company').get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(status_code=404, detail="Programa no encontrado")
        accepting = program.status in ("designed", "ready_for_execution", "in_execution", "active")
        return {
            "id": str(program.id),
            "name": program.name,
            "description": program.description or "",
            "theme": program.theme or "",
            "status": program.status,
            "company": program.company.name if program.company else None,
            "accepting_enrollments": accepting,
        }
    return await sync_to_async(fetch)()


@router.post("/{program_id}/self-enroll", response_model=SelfEnrollResponse)
async def self_enroll_in_program(program_id: str, payload: SelfEnrollRequest):
    """
    Endpoint público de auto-inscripción.
    Crea el usuario si no existe, lo enrola en el programa y le envía un email
    con código OTP + link de activación. No requiere autenticación.
    """
    def enroll():
        try:
            program = Program.objects.select_related('company').get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(status_code=404, detail="Programa no encontrado")

        if program.status not in ("designed", "ready_for_execution", "in_execution", "active"):
            raise HTTPException(
                status_code=400,
                detail="Este programa no está aceptando inscripciones en este momento"
            )

        role = normalize_participant_role(payload.role)
        if role not in PROGRAM_PARTICIPANT_ROLES:
            raise HTTPException(status_code=400, detail="Rol inválido")

        email = payload.email.lower().strip()
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create(
                email=email,
                username=username,
                first_name=payload.first_name.strip(),
                last_name=payload.last_name.strip(),
                role=map_participant_role_to_user_role(role),
                company=program.company,
                is_onboarded=False,
            )

        # ¿Ya inscrito (activo)?
        existing = ProgramParticipant.objects.filter(
            program=program, user=user, deleted_at__isnull=True
        ).first()
        if existing:
            prepare_user_secure_access(user, True)
            return {
                "ok": True,
                "already_enrolled": True,
                "email": user.email,
                "message": "Ya estás inscrito en este programa. Te enviamos un nuevo código de acceso a tu correo.",
            }

        # Reactivar soft-deleted o crear nuevo
        deleted = ProgramParticipant.objects.filter(
            program=program, user=user
        ).exclude(deleted_at__isnull=True).first()

        if deleted:
            deleted.role = role
            deleted.status = 'pending'
            deleted.deleted_at = None
            deleted.invitation_sent_at = datetime.now()
            deleted.save()
        else:
            ProgramParticipant.objects.create(
                program=program,
                user=user,
                role=role,
                status='pending',
                invitation_sent_at=datetime.now(),
            )

        # Alinear rol del usuario al rol operativo dentro del programa
        user_role = map_participant_role_to_user_role(role)
        if user.role != user_role:
            user.role = user_role
            user.save(update_fields=['role'])

        prepare_user_secure_access(user, True)

        return {
            "ok": True,
            "already_enrolled": False,
            "email": user.email,
            "message": "¡Inscripción exitosa! Revisa tu correo para activar tu cuenta.",
        }
    return await sync_to_async(enroll)()


@router.post("/{program_id}/participants/{participant_id}/resend-invitation")
async def resend_participant_invitation(program_id: str, participant_id: str):
    """Reenvía el email de invitación con un nuevo OTP a un participante existente."""
    def resend():
        try:
            participant = ProgramParticipant.objects.select_related('user').get(
                id=participant_id, program_id=program_id, deleted_at__isnull=True
            )
        except ProgramParticipant.DoesNotExist:
            raise HTTPException(status_code=404, detail="Participante no encontrado")

        prepare_user_secure_access(participant.user, True)
        participant.invitation_sent_at = datetime.now()
        participant.save(update_fields=['invitation_sent_at'])

        return {"ok": True, "email": participant.user.email}
    return await sync_to_async(resend)()


# ============================================================================
# MENTORING SESSIONS / PROGRESO DE LA DUPLA
# ============================================================================

class SessionCreateIn(BaseModel):
    mentor_id: str
    mentee_id: str
    title: str = "Sesión de mentoría"
    scheduled_at: datetime
    duration_minutes: int = 60
    status: str = "scheduled"
    session_notes: str = ""
    topics_covered: List[str] = Field(default_factory=list)
    mentee_mood: Optional[int] = None
    next_steps: str = ""
    meeting_url: str = ""


class SessionUpdateIn(BaseModel):
    title: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    session_notes: Optional[str] = None
    topics_covered: Optional[List[str]] = None
    mentee_mood: Optional[int] = None
    next_steps: Optional[str] = None
    meeting_url: Optional[str] = None


def _serialize_session(s):
    return {
        "id": str(s.id),
        "title": s.title,
        "description": s.description,
        "scheduled_at": s.scheduled_at.isoformat() if s.scheduled_at else None,
        "duration_minutes": s.duration_minutes,
        "status": s.status,
        "meeting_url": s.meeting_url,
        "session_notes": s.session_notes,
        "topics_covered": s.topics_covered or [],
        "mentee_mood": s.mentee_mood,
        "next_steps": s.next_steps,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _pair_payload(program, mentor_id, mentee_id):
    """Métricas + bitácora de una dupla (mentor_id ↔ mentee_id) en un programa."""
    from .models import MentoringSession
    sessions = list(MentoringSession.objects.filter(
        program=program, mentor_id=mentor_id, mentee_id=mentee_id
    ).order_by("scheduled_at"))

    completed = [s for s in sessions if s.status == "completed"]
    n_completed = len(completed)
    n_scheduled = len([s for s in sessions if s.status == "scheduled"])
    n_cancelled = len([s for s in sessions if s.status == "cancelled"])
    n_noshow = len([s for s in sessions if s.status == "no_show"])
    denom = n_completed + n_noshow + n_cancelled
    attendance = round(n_completed / denom, 3) if denom else None
    total_minutes = sum(s.duration_minutes for s in completed)
    moods = [s.mentee_mood for s in completed if s.mentee_mood]
    avg_mood = round(sum(moods) / len(moods), 2) if moods else None

    now = timezone.now()
    last_session = max((s.scheduled_at for s in completed if s.scheduled_at), default=None)
    upcoming = [s.scheduled_at for s in sessions if s.status == "scheduled" and s.scheduled_at and s.scheduled_at > now]
    next_session = min(upcoming, default=None)

    topics = []
    for s in completed:
        for t in (s.topics_covered or []):
            if t not in topics:
                topics.append(t)
    next_steps = ""
    for s in sorted(completed, key=lambda x: x.scheduled_at or now, reverse=True):
        if s.next_steps:
            next_steps = s.next_steps
            break

    TARGET = 6
    progress = round(
        min(1.0, n_completed / TARGET) * 60
        + (attendance if attendance is not None else 0) * 25
        + ((avg_mood / 5) if avg_mood else 0) * 15
    )

    return {
        "metrics": {
            "progress": progress,
            "total_sessions": len(sessions),
            "completed": n_completed,
            "scheduled": n_scheduled,
            "cancelled": n_cancelled,
            "no_show": n_noshow,
            "attendance": attendance,
            "total_minutes": total_minutes,
            "total_hours": round(total_minutes / 60, 1),
            "avg_mood": avg_mood,
            "last_session": last_session.isoformat() if last_session else None,
            "next_session": next_session.isoformat() if next_session else None,
            "topics": topics,
            "next_steps": next_steps,
            "target_sessions": TARGET,
        },
        "sessions": [_serialize_session(s) for s in sessions],
    }


@router.get("/{program_id}/pair-progress")
async def pair_progress(program_id: str, mentor_id: str = Query(...), mentee_id: str = Query(...)):
    """Progreso de una dupla: bitácora de sesiones + métricas derivadas."""
    def build():
        from django.db import close_old_connections; close_old_connections()
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(status_code=404, detail="Programa no encontrado")
        return _pair_payload(program, mentor_id, mentee_id)
    return await sync_to_async(build)()


@router.post("/{program_id}/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(program_id: str, payload: SessionCreateIn):
    def create():
        from django.db import close_old_connections; close_old_connections()
        from .models import MentoringSession
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            raise HTTPException(status_code=404, detail="Programa no encontrado")
        s = MentoringSession.objects.create(
            program=program,
            mentor_id=payload.mentor_id,
            mentee_id=payload.mentee_id,
            title=payload.title or "Sesión de mentoría",
            scheduled_at=payload.scheduled_at,
            duration_minutes=payload.duration_minutes or 60,
            status=payload.status or "scheduled",
            session_notes=payload.session_notes or "",
            topics_covered=payload.topics_covered or [],
            mentee_mood=payload.mentee_mood,
            next_steps=payload.next_steps or "",
            meeting_url=payload.meeting_url or "",
        )
        return _serialize_session(s)
    return await sync_to_async(create)()


@router.patch("/{program_id}/sessions/{session_id}")
async def update_session(program_id: str, session_id: str, payload: SessionUpdateIn):
    def update():
        from django.db import close_old_connections; close_old_connections()
        from .models import MentoringSession
        try:
            s = MentoringSession.objects.get(id=session_id, program_id=program_id)
        except MentoringSession.DoesNotExist:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(s, k, v)
        s.save()
        return _serialize_session(s)
    return await sync_to_async(update)()


@router.delete("/{program_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(program_id: str, session_id: str):
    def remove():
        from django.db import close_old_connections; close_old_connections()
        from .models import MentoringSession
        MentoringSession.objects.filter(id=session_id, program_id=program_id).delete()
    await sync_to_async(remove)()
    return None



@router.get("/my-progress/{user_id}")
async def my_progress(user_id: str):
    """Duplas del usuario (como mentor o mentee) con su progreso real."""
    def build():
        from django.db import close_old_connections; close_old_connections()
        vincs = Vinculation.objects.select_related(
            "program", "program__company", "participant1__user", "participant2__user"
        ).filter(
            status="active"
        ).filter(
            db_models.Q(participant1__user_id=user_id) | db_models.Q(participant2__user_id=user_id)
        ).order_by("-created_at")

        out = []
        for v in vincs:
            p1, p2 = v.participant1, v.participant2
            if p2.role == "mentor" and p1.role != "mentor":
                mentor_pp, mentee_pp = p2, p1
            else:
                mentor_pp, mentee_pp = p1, p2
            my_role = "mentor" if str(mentor_pp.user_id) == str(user_id) else "mentee"
            counterpart_pp = mentee_pp if my_role == "mentor" else mentor_pp
            cu = counterpart_pp.user
            payload = _pair_payload(v.program, str(mentor_pp.user_id), str(mentee_pp.user_id))
            meta = v.metadata or {}
            out.append({
                "vinculation_id": str(v.id),
                "role": my_role,
                "program": {
                    "id": str(v.program.id),
                    "name": v.program.name,
                    "company": v.program.company.name if v.program.company else None,
                    "slug": v.program.company.slug if v.program.company else None,
                },
                "counterpart": {
                    "id": str(cu.id),
                    "name": (f"{cu.first_name or ''} {cu.last_name or ''}".strip() or cu.email),
                    "email": cu.email,
                    "headline": getattr(cu, "headline", "") or "",
                    "role": "mentor" if my_role == "mentee" else "mentee",
                },
                "score": meta.get("score"),
                "origin": "IA" if meta.get("ai_recommendation") else "Manual",
                "metrics": payload["metrics"],
                "sessions": payload["sessions"],
            })
        return out
    return await sync_to_async(build)()
