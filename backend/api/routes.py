from __future__ import annotations

import os
from typing import Optional, List
import django

# Django setup MUST happen before importing any Django models/views
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mentorloop_clone.settings")
django.setup()

from django.db import IntegrityError
from django.db import models as django_models
from fastapi import FastAPI, HTTPException
from fastapi.routing import APIRouter
from pydantic import BaseModel

from api.schemas import (
    MatchOut,
    ParticipantIn,
    ParticipantOut,
    ProgramIn,
    ProgramOut,
    SmartMatchRequest,
    SentimentIn,
    SentimentOut,
    NotificationIn,
    NotificationOut,
    NotificationBroadcast,
    NotificationMarkRead,
    GoalIn,
    GoalOut,
    GoalUpdateIn,
    GoalUpdateOut,
    KeyResultUpdateIn,
    KeyResultOut,
    AIRecommendationRequest,
    AIRecommendationOut,
    AIAnalysisRequest,
    AIAnalysisOut,
    AIMatchHealthRequest,
    AIMatchHealthOut,
    UserOut,
    UserIn,
    UserUpdateIn,
    ProgramTemplateIn,
    ProgramTemplateOut,
)
from programs.models import Match, Participant, Program, Sentiment, Notification, Goal, KeyResult, GoalUpdate
from programs.services.matching import create_match_with_score
from programs.services.intelligent_matching import intelligent_match, score_pair
from programs.ai_service import GeminiAIService

# Import companies router
from companies.views import router as companies_router
# Import programs router
from programs.views import router as programs_router

router = APIRouter()

# Include companies/onboarding routes
router.include_router(companies_router)
# Include programs routes
router.include_router(programs_router)


# ═══════════════════════════════════════════════════════════════════
# PROGRAM TEMPLATES CRUD — shared across all users
# ═══════════════════════════════════════════════════════════════════

def _slugify(text: str) -> str:
    import re
    slug = text.lower().strip()
    slug = re.sub(r'[áàäâ]', 'a', slug)
    slug = re.sub(r'[éèëê]', 'e', slug)
    slug = re.sub(r'[íìïî]', 'i', slug)
    slug = re.sub(r'[óòöô]', 'o', slug)
    slug = re.sub(r'[úùüû]', 'u', slug)
    slug = re.sub(r'[ñ]', 'n', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'programa'


@router.get("/program-templates", response_model=List[ProgramTemplateOut])
def list_program_templates():
    from programs.models import ProgramTemplate
    templates = ProgramTemplate.objects.all()
    return [
        {
            "id": str(t.id),
            "slug": t.slug,
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "duration": t.duration,
            "status": t.status,
            "modules": t.modules or [],
            "milestones": t.milestones or [],
            "tags": t.tags or [],
            "mentorRequirements": t.mentor_requirements or {},
            "menteeRequirements": t.mentee_requirements or {},
            "matchingRules": t.matching_rules or {},
            "sessionRules": t.session_rules or {},
            "createdAt": t.created_at.strftime("%Y-%m-%d"),
            "updatedAt": t.updated_at.strftime("%Y-%m-%d"),
            "createdBy": t.created_by.email if t.created_by else None,
        }
        for t in templates
    ]


@router.post("/program-templates", response_model=ProgramTemplateOut, status_code=201)
def create_program_template(data: ProgramTemplateIn):
    from programs.models import ProgramTemplate
    import time

    slug = data.slug or _slugify(data.name)
    # Ensure unique slug
    base_slug = slug
    counter = 1
    while ProgramTemplate.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    t = ProgramTemplate.objects.create(
        slug=slug,
        name=data.name,
        description=data.description or "",
        category=data.category or "leadership",
        duration=data.duration or "",
        status=data.status or "draft",
        modules=data.modules or [],
        milestones=data.milestones or [],
        tags=data.tags or [],
        mentor_requirements=data.mentorRequirements or {},
        mentee_requirements=data.menteeRequirements or {},
        matching_rules=data.matchingRules or {},
        session_rules=data.sessionRules or {},
    )
    return {
        "id": str(t.id),
        "slug": t.slug,
        "name": t.name,
        "description": t.description,
        "category": t.category,
        "duration": t.duration,
        "status": t.status,
        "modules": t.modules or [],
        "milestones": t.milestones or [],
        "tags": t.tags or [],
        "mentorRequirements": t.mentor_requirements or {},
        "menteeRequirements": t.mentee_requirements or {},
        "matchingRules": t.matching_rules or {},
        "sessionRules": t.session_rules or {},
        "createdAt": t.created_at.strftime("%Y-%m-%d"),
        "updatedAt": t.updated_at.strftime("%Y-%m-%d"),
        "createdBy": None,
    }


@router.put("/program-templates/{template_id}", response_model=ProgramTemplateOut)
def update_program_template(template_id: str, data: ProgramTemplateIn):
    from programs.models import ProgramTemplate
    try:
        t = ProgramTemplate.objects.get(id=template_id)
    except ProgramTemplate.DoesNotExist:
        raise HTTPException(status_code=404, detail="Template no encontrado")

    t.name = data.name
    t.description = data.description or ""
    t.category = data.category or t.category
    t.duration = data.duration or ""
    t.status = data.status or t.status
    t.modules = data.modules or []
    t.milestones = data.milestones or []
    t.tags = data.tags or []
    t.mentor_requirements = data.mentorRequirements or {}
    t.mentee_requirements = data.menteeRequirements or {}
    t.matching_rules = data.matchingRules or {}
    t.session_rules = data.sessionRules or {}

    if data.slug and data.slug != t.slug:
        t.slug = data.slug

    t.save()
    return {
        "id": str(t.id),
        "slug": t.slug,
        "name": t.name,
        "description": t.description,
        "category": t.category,
        "duration": t.duration,
        "status": t.status,
        "modules": t.modules or [],
        "milestones": t.milestones or [],
        "tags": t.tags or [],
        "mentorRequirements": t.mentor_requirements or {},
        "menteeRequirements": t.mentee_requirements or {},
        "matchingRules": t.matching_rules or {},
        "sessionRules": t.session_rules or {},
        "createdAt": t.created_at.strftime("%Y-%m-%d"),
        "updatedAt": t.updated_at.strftime("%Y-%m-%d"),
        "createdBy": t.created_by.email if t.created_by else None,
    }


@router.delete("/program-templates/{template_id}", status_code=204)
def delete_program_template(template_id: str):
    from programs.models import ProgramTemplate
    try:
        t = ProgramTemplate.objects.get(id=template_id)
    except ProgramTemplate.DoesNotExist:
        raise HTTPException(status_code=404, detail="Template no encontrado")
    t.delete()
    return None


@router.post("/program-templates/{template_id}/duplicate", response_model=ProgramTemplateOut, status_code=201)
def duplicate_program_template(template_id: str):
    from programs.models import ProgramTemplate
    try:
        t = ProgramTemplate.objects.get(id=template_id)
    except ProgramTemplate.DoesNotExist:
        raise HTTPException(status_code=404, detail="Template no encontrado")

    new_name = f"{t.name} (Copia)"
    new_slug = _slugify(new_name)
    base_slug = new_slug
    counter = 1
    while ProgramTemplate.objects.filter(slug=new_slug).exists():
        new_slug = f"{base_slug}-{counter}"
        counter += 1

    dup = ProgramTemplate.objects.create(
        slug=new_slug,
        name=new_name,
        description=t.description,
        category=t.category,
        duration=t.duration,
        status="draft",
        modules=t.modules,
        milestones=t.milestones,
        tags=t.tags,
        mentor_requirements=t.mentor_requirements,
        mentee_requirements=t.mentee_requirements,
        matching_rules=t.matching_rules,
        session_rules=t.session_rules,
    )
    return {
        "id": str(dup.id),
        "slug": dup.slug,
        "name": dup.name,
        "description": dup.description,
        "category": dup.category,
        "duration": dup.duration,
        "status": dup.status,
        "modules": dup.modules or [],
        "milestones": dup.milestones or [],
        "tags": dup.tags or [],
        "mentorRequirements": dup.mentor_requirements or {},
        "menteeRequirements": dup.mentee_requirements or {},
        "matchingRules": dup.matching_rules or {},
        "sessionRules": dup.session_rules or {},
        "createdAt": dup.created_at.strftime("%Y-%m-%d"),
        "updatedAt": dup.updated_at.strftime("%Y-%m-%d"),
        "createdBy": None,
    }


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/programs", response_model=List[ProgramOut])
def list_programs(company_id: Optional[str] = None) -> List[dict]:
    from programs.models import Activity, ProgramParticipant
    
    # Filtrar por company_id si se proporciona
    if company_id:
        programs = Program.objects.select_related('company').filter(company_id=company_id)
    else:
        programs = Program.objects.select_related('company').all()
    
    result = []
    
    for p in programs:
        # Obtener actividades del programa
        activities = Activity.objects.filter(program=p)
        activities_data = [
            {
                "id": str(a.id),
                "type": a.activity_type,
                "name": a.name,
                "description": a.description,
                "status": a.status,
                "start_date": str(a.start_date) if a.start_date else None,
                "modality": a.modality,
                "meeting_url": a.meeting_url,
                "location_address": a.location_address,
            }
            for a in activities
        ]
        
        # Count participants
        participants_count = ProgramParticipant.objects.filter(
            program=p,
            deleted_at__isnull=True
        ).count()
        
        result.append({
            "id": str(p.id),
            "name": p.name,
            "description": p.description or "",
            "theme": p.theme or "General",
            "company_id": str(p.company_id) if p.company_id else None,
            "company": {
                "id": str(p.company.id),
                "name": p.company.name,
                "slug": p.company.slug,
            } if p.company else None,
            "status": p.status,
            "activities": activities_data,
            "activities_count": len(activities_data),
            "participants_count": participants_count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })
    
    return result


# ═══════════════════════════════════════════════════════════════════
# EMAIL NOTIFICATION HELPER
# ═══════════════════════════════════════════════════════════════════

def _send_program_assignment_email(company, program):
    """Send email to company's contact when a program is assigned."""
    from django.core.mail import send_mail
    from django.conf import settings

    # Find company email: contact_email > studio account email
    recipient = getattr(company, 'contact_email', '') or ''
    if not recipient:
        # Try studio account generated_email
        try:
            from companies.models import StudioAccount
            sa = StudioAccount.objects.filter(company=company).first()
            if sa:
                recipient = sa.generated_email
        except Exception:
            pass

    if not recipient:
        print(f"[EMAIL] No email found for company {company.name} — skipping notification")
        return

    subject = f"Nuevo programa asignado: {program.name}"
    message = (
        f"Hola {company.name},\n\n"
        f"Se te ha asignado un nuevo programa de mentoría en Inspiratoria.\n\n"
        f"📋 Programa: {program.name}\n"
        f"📝 Descripción: {program.description or 'Sin descripción'}\n"
        f"🏷️ Tema: {program.theme or 'General'}\n\n"
        f"Ingresa a tu panel de control para ver los detalles y comenzar.\n\n"
        f"— Equipo Inspiratoria"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )
        print(f"[EMAIL] Notification sent to {recipient} for program '{program.name}'")
    except Exception as e:
        print(f"[EMAIL] Error sending email: {e}")


@router.post("/programs", response_model=ProgramOut, status_code=201)
def create_program(payload: ProgramIn) -> dict:
    from companies.models import Company
    from programs.models import Activity
    import uuid
    
    # Debug logging
    print(f"[DEBUG] Payload recibido: {payload}")
    print(f"[DEBUG] company_id del payload: {payload.company_id}")
    print(f"[DEBUG] activities del payload: {payload.activities}")
    
    # Get company if provided
    company = None
    if payload.company_id:
        try:
            company_uuid = uuid.UUID(str(payload.company_id))
            print(f"[DEBUG] Buscando company con UUID: {company_uuid}")
            company = Company.objects.get(id=company_uuid)
            print(f"[DEBUG] Company encontrada: {company.name} (ID: {company.id})")
        except (Company.DoesNotExist, ValueError) as e:
            print(f"[ERROR] Company no encontrada: {e}")
            raise HTTPException(status_code=404, detail=f"Company not found: {str(e)}")
    
    print(f"[DEBUG] Creando programa con company: {company}")
    program = Program.objects.create(
        name=payload.name,
        description=payload.description or "",
        theme=payload.theme or "General",
        company=company,
        status=payload.status or "designed",
    )
    
    # Crear actividades si fueron enviadas
    if payload.activities:
        print(f"[DEBUG] Creando {len(payload.activities)} actividades")
        for act_data in payload.activities:
            activity = Activity.objects.create(
                program=program,
                name=act_data.get('name', ''),
                description=act_data.get('description', ''),
                activity_type=act_data.get('type', 'event'),
                training_category=act_data.get('category') if act_data.get('type') == 'training' else None,
                event_category=act_data.get('category') if act_data.get('type') == 'event' else None,
                modality=act_data.get('modality'),
                status='created',
            )
            print(f"[DEBUG] Actividad creada: {activity.name} (ID: {activity.id})")
    
    print(f"[DEBUG] Programa creado - ID: {program.id}, company_id: {program.company_id}")
    
    # ─── SEND EMAIL NOTIFICATION ───
    if company:
        _send_program_assignment_email(company, program)
    
    # Obtener actividades creadas
    activities = Activity.objects.filter(program=program)
    activities_data = [
        {
            "id": str(a.id),
            "type": a.activity_type,
            "name": a.name,
            "description": a.description,
            "status": a.status,
        }
        for a in activities
    ]
    
    response_data = {
        "id": str(program.id),
        "name": program.name,
        "description": program.description or "",
        "theme": program.theme or "General",
        "company_id": str(program.company_id) if program.company_id else None,
        "company": {
            "id": str(program.company.id),
            "name": program.company.name,
            "slug": program.company.slug,
        } if program.company else None,
        "status": program.status,
        "activities": activities_data,
        "activities_count": len(activities_data),
    }
    
    print(f"[DEBUG] Response data: {response_data}")
    return response_data


@router.get("/programs/{program_id}", response_model=ProgramOut)
def get_program(program_id: str) -> dict:
    from programs.models import Activity, Content, ProgramParticipant
    import uuid
    
    try:
        program = Program.objects.select_related('company').get(id=uuid.UUID(program_id))
        
        # Obtener actividades del programa
        activities = Activity.objects.filter(program=program)
        activities_data = []
        
        for a in activities:
            # Obtener módulos (Content) asociados a esta actividad
            modules = Content.objects.filter(activity=a).order_by('order')
            modules_data = [
                {
                    "id": m.id,
                    "title": m.title,
                    "description": m.description or "",
                    "order": m.order,
                    "duration_minutes": 60,
                    "requires_evaluation": False,
                    "minimum_score": 70,
                    "is_published": m.is_published,
                    "materials_url": m.materials_url or "",
                }
                for m in modules
            ]
            
            # Determinar categoría unificada
            category = "mentoria"
            if a.activity_type == "training" and a.training_category:
                category = a.training_category
            elif a.activity_type == "event" and a.event_category:
                category = a.event_category
            
            activity_data = {
                "id": a.id,
                "type": a.activity_type,
                "name": a.name,
                "description": a.description or "",
                "category": category,
                "status": a.status,
                "start_date": a.start_date.isoformat() if a.start_date else None,
                "end_date": a.end_date.isoformat() if a.end_date else None,
                "modality": a.modality or "online",
                "target_role": a.target_role or "both",
                "is_mandatory": a.has_modules,
                "is_certificate_issued": a.provides_certification or a.provides_participation_certificate,
                "meeting_url": a.meeting_url or "",
                "location_address": a.location_address or "",
                "capacity": None,
                "modules": modules_data,
                "confirmed_count": a.confirmed_count,
                "attendance_count": a.attendance_count,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            activities_data.append(activity_data)
        
        # Count participants
        participants_count = ProgramParticipant.objects.filter(
            program=program, deleted_at__isnull=True
        ).count()
        
        return {
            "id": str(program.id),
            "name": program.name,
            "description": program.description or "",
            "theme": program.theme or "General",
            "company_id": str(program.company_id) if program.company_id else None,
            "company": {
                "id": str(program.company.id),
                "name": program.company.name,
                "slug": program.company.slug,
            } if program.company else None,
            "status": program.status,
            "activities": activities_data,
            "activities_count": len(activities_data),
            "participants_count": participants_count,
            "requires_certification": program.requires_certification,
            "created_at": program.created_at.isoformat() if program.created_at else None,
            "updated_at": program.updated_at.isoformat() if program.updated_at else None,
        }
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc


@router.put("/programs/{program_id}", response_model=ProgramOut)
def update_program(program_id: str, payload: ProgramIn) -> dict:
    import uuid
    try:
        program = Program.objects.select_related('company').get(id=uuid.UUID(program_id))
        program.name = payload.name
        program.description = payload.description or ""
        program.theme = payload.theme or "General"
        program.save()
        return {
            "id": str(program.id),
            "name": program.name,
            "description": program.description or "",
            "theme": program.theme or "General",
            "company_id": str(program.company_id) if program.company_id else None,
            "company": {
                "id": str(program.company.id),
                "name": program.company.name,
                "slug": program.company.slug,
            } if program.company else None,
            "status": program.status,
        }
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc


class ProgramPatchIn(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    requires_certification: Optional[bool] = None


@router.patch("/programs/{program_id}")
def patch_program(program_id: str, payload: ProgramPatchIn) -> dict:
    """
    Actualización parcial de un programa (PM console).
    """
    import uuid
    try:
        program = Program.objects.select_related('company').get(id=uuid.UUID(program_id))
        if payload.name is not None:
            program.name = payload.name
        if payload.description is not None:
            program.description = payload.description
        if payload.theme is not None:
            program.theme = payload.theme
        if payload.requires_certification is not None:
            program.requires_certification = payload.requires_certification
        program.save()
        return {
            "id": str(program.id),
            "name": program.name,
            "description": program.description or "",
            "theme": program.theme or "General",
            "status": program.status,
            "requires_certification": program.requires_certification,
            "updated_at": program.updated_at.isoformat() if program.updated_at else None,
        }
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc


@router.patch("/programs/{program_id}/status")
def update_program_status(program_id: str, status: str) -> dict:
    """
    Cambiar el estado de un programa.
    Estados válidos (modernos): designed, ready_for_execution, in_execution, under_review, closed
    Estados legacy soportados: draft, active, paused, completed
    """
    import uuid
    valid_statuses = [
        "designed", "ready_for_execution", "in_execution", "under_review", "closed",
        "draft", "active", "paused", "completed",
    ]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Estado inválido. Debe ser uno de: {', '.join(valid_statuses)}"
        )
    
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
        program.status = status
        program.save()
        return {
            "success": True,
            "program_id": str(program.id),
            "status": program.status,
            "message": f"Programa actualizado a estado: {status}"
        }
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc


@router.post("/programs/{program_id}/launch")
def launch_program(program_id: str) -> dict:
    """
    Lanzar un programa: valida que esté completo y cambia su estado a 'launched'
    """
    from programs.models import Activity, Content
    import uuid
    try:
        program = Program.objects.select_related('company').get(id=uuid.UUID(program_id))
        
        # Validaciones
        issues = []
        
        if not program.name or not program.description:
            issues.append("Información general incompleta")
        
        if not program.company_id:
            issues.append("No hay empresa asignada al programa")
        
        # Contar actividades
        activities = Activity.objects.filter(program=program)
        trainings = activities.filter(activity_type="training")
        events = activities.filter(activity_type="event")
        
        if trainings.count() == 0 and events.count() == 0:
            issues.append("No hay actividades ni entrenamientos configurados")
        
        # Validar que entrenamientos tengan módulos
        for training in trainings:
            modules = Content.objects.filter(activity=training)
            if modules.count() == 0:
                issues.append(f"El entrenamiento '{training.name}' no tiene módulos configurados")
        
        if issues:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "El programa no está completo para ser lanzado",
                    "issues": issues
                }
            )
        
        # Si todo está bien, lanzar el programa
        program.status = "launched"
        program.save()
        
        return {
            "success": True,
            "program_id": program.id,
            "status": program.status,
            "message": "Programa lanzado exitosamente",
            "stats": {
                "trainings": trainings.count(),
                "events": events.count(),
                "total_activities": activities.count()
            }
        }
        
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc


@router.delete("/programs/{program_id}", status_code=204)
def delete_program(program_id: str):
    """
    Eliminar un programa (soft delete cambiando a status=deleted)
    """
    import uuid
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
        # Soft delete
        program.status = "deleted"
        program.save()
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc


@router.get("/programs/{program_id}/participants")
def get_program_participants(program_id: str):
    """
    Obtener todos los participantes de un programa específico
    """
    from accounts.models import User
    from programs.models import ProgramParticipant
    import uuid
    
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
        participants = ProgramParticipant.objects.filter(program=program).select_related('user')
        
        result = []
        for p in participants:
            user = p.user
            result.append({
                "id": str(p.id),
                "user": {
                    "id": str(user.id),
                    "nombre": user.first_name,
                    "apellidos": user.last_name,
                    "full_name": getattr(user, 'full_name', '') or f"{user.first_name} {user.last_name}".strip(),
                    "email": user.email,
                    "telefono": getattr(user, 'phone', ''),
                    "avatar_url": getattr(user, 'avatar_url', '') or '',
                    "headline": getattr(user, 'headline', '') or '',
                },
                "role": p.role or "participant",
                "status": p.status or "pending",
                "invitation_sent_at": p.invitation_sent_at.isoformat() if p.invitation_sent_at else None,
                "activated_at": p.activated_at.isoformat() if p.activated_at else None,
                "created_at": p.created_at.isoformat() if hasattr(p, 'created_at') and p.created_at else None,
            })
        
        return result
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")


@router.get("/programs/users/search")
def search_users_for_program(
    q: str,
    exclude_program_id: Optional[str] = None
):
    """
    Buscar usuarios por nombre o email (para agregar a programas)
    - q: Término de búsqueda (mínimo 2 caracteres)
    - exclude_program_id: Excluir usuarios que ya están en este programa
    """
    from accounts.models import User
    from programs.models import ProgramParticipant
    from django.db.models import Q
    import uuid
    
    if len(q) < 2:
        return []
    
    # Buscar usuarios por nombre o email
    users = User.objects.filter(
        Q(first_name__icontains=q) | 
        Q(last_name__icontains=q) | 
        Q(email__icontains=q)
    )
    
    # Excluir usuarios que ya están en el programa
    if exclude_program_id:
        try:
            program_uuid = uuid.UUID(exclude_program_id)
            # Obtener IDs de usuarios ya en el programa
            existing_user_ids = ProgramParticipant.objects.filter(
                program_id=program_uuid
            ).values_list('user_id', flat=True)
            users = users.exclude(id__in=existing_user_ids)
        except (ValueError, Program.DoesNotExist):
            pass
    
    # Limitar resultados
    users = users[:20]
    
    return [
        {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": getattr(user, 'role', 'participant'),
            "company": getattr(user, 'company', ''),
            "is_onboarded": getattr(user, 'is_onboarded', True),
        }
        for user in users
    ]


@router.post("/programs/{program_id}/participants", status_code=201)
def add_participant_to_program(program_id: str, payload: dict):
    """
    Agregar un participante a un programa
    """
    from accounts.models import User
    from programs.models import ProgramParticipant
    import uuid
    
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
        user = User.objects.get(id=uuid.UUID(payload.get('user_id')))
        
        # Verificar si ya existe
        existing = ProgramParticipant.objects.filter(
            program=program,
            user=user
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="El usuario ya está en este programa")
        
        # Crear participante
        normalized_role = (payload.get('role') or 'participant_cell').strip().lower()
        legacy_map = {
            'administrator': 'facilitator',
            'instructor': 'mentor',
            'participant': 'participant_cell',
            'observer': 'participant_cell',
        }
        normalized_role = legacy_map.get(normalized_role, normalized_role)

        participant = ProgramParticipant.objects.create(
            program=program,
            user=user,
            role=normalized_role,
            status=payload.get('status', 'pending')
        )
        
        return {
            "id": str(participant.id),
            "user": {
                "id": str(user.id),
                "nombre": user.first_name,
                "apellidos": user.last_name,
                "email": user.email,
            },
            "role": participant.role,
            "status": participant.status,
            "message": "Participante agregado exitosamente"
        }
        
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")


@router.delete("/programs/{program_id}/participants/{participant_id}", status_code=204)
def remove_participant_from_program(program_id: str, participant_id: str):
    """
    Eliminar un participante de un programa (soft delete)
    """
    from programs.models import ProgramParticipant
    from datetime import datetime
    import uuid
    
    try:
        participant = ProgramParticipant.objects.get(
            id=participant_id,
            program_id=uuid.UUID(program_id),
            deleted_at__isnull=True
        )
        participant.status = 'deleted'
        participant.deleted_at = datetime.now()
        participant.save(update_fields=['status', 'deleted_at'])
    except ProgramParticipant.DoesNotExist:
        raise HTTPException(status_code=404, detail="Participant not found")


class CreateUserRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str = 'participant_cell'


@router.post("/programs/users", status_code=201)
async def create_user_for_program(request: CreateUserRequest):
    """
    Crear un nuevo usuario (para luego agregarlo a un programa)
    """
    from accounts.models import User
    from asgiref.sync import sync_to_async
    
    def create_user_sync():
        # Verificar si el email ya existe
        if User.objects.filter(email=request.email).exists():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Crear usuario
        user = User.objects.create(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            username=request.email,  # Usar email como username
            role='participant' if request.role == 'participant_cell' else request.role,
        )
        
        return {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "message": "Usuario creado exitosamente"
        }
    
    return await sync_to_async(create_user_sync)()


@router.get("/participants", response_model=List[ParticipantOut])
def list_participants(
    program_id: Optional[int] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    skills: Optional[str] = None,
) -> List[Participant]:
    """
    Listar participantes con filtros avanzados
    - program_id: Filtrar por programa
    - role: Filtrar por rol (mentor/mentee)
    - search: Búsqueda en nombre y headline
    - skills: Búsqueda en skills (separados por coma)
    """
    query = Participant.objects.select_related("program").all()
    
    if program_id:
        query = query.filter(program_id=program_id)
    
    if role:
        query = query.filter(role=role)
    
    if search:
        from django.db.models import Q
        query = query.filter(
            Q(full_name__icontains=search) | Q(headline__icontains=search)
        )
    
    if skills:
        # Filter by skills in JSON field
        skill_list = [s.strip() for s in skills.split(",")]
        for skill in skill_list:
            query = query.filter(skills__icontains=skill)
    
    return list(query)


@router.get("/participants/{participant_id}", response_model=ParticipantOut)
def get_participant(participant_id: int) -> Participant:
    try:
        return Participant.objects.select_related("program").get(id=participant_id)
    except Participant.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Participant not found") from exc


@router.post("/participants", response_model=ParticipantOut, status_code=201)
def create_participant(payload: ParticipantIn) -> Participant:
    try:
        participant = Participant.objects.create(
            program_id=payload.program_id,
            full_name=payload.full_name,
            role=payload.role,
            headline=payload.headline or "",
            goals=payload.goals,
            skills=payload.skills,
            availability_hours=payload.availability_hours,
        )
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return participant


@router.put("/participants/{participant_id}", response_model=ParticipantOut)
def update_participant(participant_id: int, payload: ParticipantIn) -> Participant:
    try:
        participant = Participant.objects.get(id=participant_id)
        participant.program_id = payload.program_id
        participant.full_name = payload.full_name
        participant.role = payload.role
        participant.headline = payload.headline or ""
        participant.goals = payload.goals
        participant.skills = payload.skills
        participant.availability_hours = payload.availability_hours
        participant.save()
        return participant
    except Participant.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Participant not found") from exc


@router.delete("/participants/{participant_id}", status_code=204)
def delete_participant(participant_id: int):
    try:
        participant = Participant.objects.get(id=participant_id)
        participant.delete()
    except Participant.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Participant not found") from exc


@router.post("/participants/bulk-import")
def bulk_import_participants(data: dict) -> dict:
    """
    Importa múltiples participantes desde CSV/Excel.
    Valida y crea todos los registros en una transacción.
    """
    program_id = data.get("program_id")
    participants_data = data.get("participants", [])
    
    if not program_id:
        raise HTTPException(status_code=400, detail="program_id is required")
    
    if not participants_data:
        raise HTTPException(status_code=400, detail="No participants data provided")
    
    try:
        # Verify program exists
        program = Program.objects.get(id=program_id)
        
        created = []
        errors = []
        
        for idx, p_data in enumerate(participants_data):
            try:
                # Validate required fields
                if not p_data.get("full_name"):
                    errors.append(f"Row {idx + 1}: full_name is required")
                    continue
                
                if not p_data.get("role") or p_data["role"] not in ["mentor", "mentee"]:
                    errors.append(f"Row {idx + 1}: role must be 'mentor' or 'mentee'")
                    continue
                
                # Create participant
                participant = Participant.objects.create(
                    program=program,
                    full_name=p_data["full_name"],
                    role=p_data["role"],
                    headline=p_data.get("headline", ""),
                    skills=p_data.get("skills", []),
                    goals=p_data.get("goals", []),
                    availability_hours=p_data.get("availability_hours", 2),
                    timezone=p_data.get("timezone", "UTC"),
                )
                created.append({
                    "id": participant.id,
                    "full_name": participant.full_name,
                    "role": participant.role,
                })
            except Exception as e:
                errors.append(f"Row {idx + 1}: {str(e)}")
        
        return {
            "status": "success",
            "created": len(created),
            "errors": len(errors),
            "total": len(participants_data),
            "participants": created,
            "error_details": errors if errors else None,
        }
        
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing participants: {str(e)}")


@router.get("/matches")
def list_matches() -> list[dict]:
    """
    Lista todos los matches con información completa de mentor y mentee.
    """
    matches = Match.objects.select_related(
        "mentor",
        "mentee",
        "mentor__program",
        "mentee__program",
        "program",
    ).all()
    
    result = []
    for match in matches:
        # Serialize mentor
        mentor_skills = []
        if hasattr(match.mentor, 'skills') and match.mentor.skills:
            if isinstance(match.mentor.skills, str):
                mentor_skills = [s.strip() for s in match.mentor.skills.split(',') if s.strip()]
            elif isinstance(match.mentor.skills, list):
                mentor_skills = match.mentor.skills
        
        mentor_name = match.mentor.full_name if match.mentor else "Unknown Mentor"
        
        # Serialize mentee
        mentee_goals = []
        if hasattr(match.mentee, 'goals') and match.mentee.goals:
            if isinstance(match.mentee.goals, str):
                mentee_goals = [g.strip() for g in match.mentee.goals.split(',') if g.strip()]
            elif isinstance(match.mentee.goals, list):
                mentee_goals = match.mentee.goals
        
        mentee_name = match.mentee.full_name if match.mentee else "Unknown Mentee"
        
        # Get program name - try program first, then mentor.program
        program_name = match.program.name if match.program else (match.mentor.program.name if match.mentor.program else "N/A")
        
        result.append({
            "id": str(match.id),
            "mentor": {
                "id": str(match.mentor.id),
                "name": mentor_name,
                "full_name": mentor_name,
                "title": getattr(match.mentor, 'headline', '') or "Mentor",
                "headline": getattr(match.mentor, 'headline', '') or "Mentor",
                "skills": mentor_skills,
                "availability_hours": getattr(match.mentor, 'availability_hours', 2),
                "experience_years": getattr(match.mentor, 'experience_years', 5),
            },
            "mentee": {
                "id": str(match.mentee.id),
                "name": mentee_name,
                "full_name": mentee_name,
                "title": getattr(match.mentee, 'headline', '') or "Mentee",
                "headline": getattr(match.mentee, 'headline', '') or "Mentee",
                "goals": mentee_goals,
                "availability_hours": getattr(match.mentee, 'availability_hours', 2),
                "current_level": getattr(match.mentee, 'current_level', 'junior'),
            },
            "program_id": str(match.mentor.program.id) if match.mentor.program else None,
            "program_name": program_name,
            "score": float(match.score) * 10,  # Convert 0-10 scale to 0-100
            "compatibility_score": float(match.score) * 10,
            "status": match.status,
            "created_at": match.created_at.isoformat() if hasattr(match, 'created_at') else None,
        })
    
    return result


@router.post("/matches/smart", response_model=MatchOut, status_code=201)
def smart_match(payload: SmartMatchRequest) -> Match:
    try:
        match = create_match_with_score(
            program_id=payload.program_id,
            mentor_id=payload.mentor_id,
            mentee_id=payload.mentee_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return match


@router.post("/sentiment", response_model=SentimentOut, status_code=201)
def create_sentiment(payload: SentimentIn) -> Sentiment:
    try:
        match = Match.objects.get(id=payload.match_id)
    except Match.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Match not found") from exc
    
    sentiment = Sentiment.objects.create(
        match=match,
        rating=payload.rating,
        comment=payload.comment,
    )
    return sentiment


@router.get("/sentiment/match/{match_id}", response_model=List[SentimentOut])
def get_match_sentiments(match_id: int) -> List[Sentiment]:
    return list(Sentiment.objects.filter(match_id=match_id))


@router.get("/sentiment", response_model=List[SentimentOut])
def get_all_sentiments() -> List[Sentiment]:
    return list(Sentiment.objects.all())


# ============= NOTIFICATIONS ENDPOINTS =============

@router.get("/notifications/user/{user_id}")
def get_user_notifications(user_id: str, unread_only: bool = False) -> list:
    """Obtener notificaciones de un usuario"""
    import uuid
    from companies.models import User
    
    # Try to convert to UUID, if fails try to find user by ID
    try:
        recipient_uuid = uuid.UUID(user_id)
    except ValueError:
        try:
            user = User.objects.get(id=user_id)
            recipient_uuid = user.id
        except User.DoesNotExist:
            return []
    
    query = Notification.objects.filter(recipient_id=recipient_uuid)
    if unread_only:
        query = query.filter(is_read=False)
    notifications = list(query.select_related("sender", "match", "milestone")[:50])
    
    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "recipient_id": str(n.recipient_id),
            "sender_id": str(n.sender_id) if n.sender_id else None,
            "sender_name": (n.sender.full_name or n.sender.email) if n.sender else None,
            "notification_type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
            "match_id": n.match_id,
            "milestone_id": n.milestone_id,
        })
    return result


@router.post("/notifications", response_model=NotificationOut, status_code=201)
def create_notification(payload: NotificationIn) -> Notification:
    """Crear una nueva notificación"""
    notification = Notification.objects.create(
        recipient_id=payload.recipient_id,
        notification_type=payload.notification_type,
        title=payload.title,
        message=payload.message,
        link=payload.link,
        match_id=payload.match_id,
        milestone_id=payload.milestone_id,
    )
    return notification


@router.post("/notifications/broadcast", status_code=201)
def broadcast_notification(payload: NotificationBroadcast) -> dict:
    """Enviar notificación a todos los usuarios internos de Inspiratoria"""
    from companies.models import User

    INTERNAL_ROLES = [
        "superadmin", "admin_root", "inspiratoria_admin", "admin",
        "coordinator", "facilitator_internal", "facilitator_inspiratoria",
    ]
    internal_users = User.objects.filter(role__in=INTERNAL_ROLES, is_active=True)
    created = []
    for user in internal_users:
        n = Notification.objects.create(
            recipient_id=user.id,
            sender_id=payload.sender_id,
            notification_type=payload.notification_type,
            title=payload.title,
            message=payload.message,
            link=payload.link,
        )
        created.append(n.id)
    return {"status": "sent", "recipients": len(created), "notification_ids": created}


@router.post("/notifications/mark-read")
def mark_notifications_read(payload: NotificationMarkRead) -> dict[str, str]:
    """Marcar notificaciones como leídas"""
    Notification.objects.filter(id__in=payload.notification_ids).update(is_read=True)
    return {"status": "success", "updated": len(payload.notification_ids)}


@router.get("/notifications/unread-count/{user_id}")
def get_unread_count(user_id: str) -> dict[str, int]:
    """Obtener cantidad de notificaciones no leídas"""
    count = Notification.objects.filter(recipient_id=user_id, is_read=False).count()
    return {"unread_count": count}


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int) -> dict[str, str]:
    """Eliminar una notificación"""
    try:
        notification = Notification.objects.get(id=notification_id)
        notification.delete()
        return {"status": "deleted"}
    except Notification.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Notification not found") from exc


# ============= GOALS & OKRs ENDPOINTS =============

@router.get("/goals/match/{match_id}", response_model=List[GoalOut])
def get_match_goals(match_id: int) -> List[Goal]:
    """Obtener todos los goals de un match"""
    goals = Goal.objects.filter(match_id=match_id).prefetch_related("key_results")
    return list(goals)


@router.post("/goals", response_model=GoalOut, status_code=201)
def create_goal(payload: GoalIn) -> Goal:
    """Crear un nuevo goal con key results"""
    try:
        from datetime import datetime
        
        goal = Goal.objects.create(
            match_id=payload.match_id,
            title=payload.title,
            description=payload.description,
            goal_type=payload.goal_type,
            priority=payload.priority,
            specific=payload.specific,
            measurable=payload.measurable,
            achievable=payload.achievable,
            relevant=payload.relevant,
            time_bound=datetime.strptime(payload.time_bound, "%Y-%m-%d").date(),
            created_by_id=1,  # TODO: Get from auth
        )
        
        # Crear key results
        for kr_data in payload.key_results:
            KeyResult.objects.create(
                goal=goal,
                description=kr_data.description,
                target_value=kr_data.target_value,
                current_value=kr_data.current_value,
                unit=kr_data.unit,
            )
        
        return goal
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/goals/{goal_id}/progress")
def update_goal_progress(goal_id: int, payload: GoalUpdateIn) -> dict[str, str]:
    """Actualizar progreso de un goal"""
    try:
        goal = Goal.objects.get(id=goal_id)
        
        # Crear registro de actualización
        GoalUpdate.objects.create(
            goal=goal,
            user_id=payload.user_id,
            note=payload.note,
            progress_before=goal.progress_percentage,
            progress_after=payload.progress_after,
        )
        
        # Actualizar goal
        goal.progress_percentage = payload.progress_after
        
        # Actualizar status automáticamente
        if payload.progress_after == 100:
            goal.status = "completed"
        elif payload.progress_after > 0:
            goal.status = "in_progress"
        
        goal.save()
        
        return {"status": "updated", "progress": payload.progress_after}
    except Goal.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Goal not found") from exc


@router.put("/key-results/{kr_id}")
def update_key_result(kr_id: int, payload: KeyResultUpdateIn) -> KeyResultOut:
    """Actualizar un key result"""
    try:
        kr = KeyResult.objects.get(id=kr_id)
        kr.current_value = payload.current_value
        kr.completed = payload.completed
        kr.save()
        
        # Recalcular progreso del goal
        goal = kr.goal
        key_results = goal.key_results.all()
        if key_results:
            total_progress = sum(kr.progress_percentage for kr in key_results)
            goal.progress_percentage = int(total_progress / len(key_results))
            goal.save()
        
        return kr
    except KeyResult.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Key Result not found") from exc


@router.get("/goals/{goal_id}/updates", response_model=List[GoalUpdateOut])
def get_goal_updates(goal_id: int) -> List[GoalUpdate]:
    """Obtener historial de actualizaciones de un goal"""
    return list(GoalUpdate.objects.filter(goal_id=goal_id))


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int) -> dict[str, str]:
    """Eliminar un goal"""
    try:
        goal = Goal.objects.get(id=goal_id)
        goal.delete()
        return {"status": "deleted"}
    except Goal.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Goal not found") from exc


# ============================================
# AI / Neuramorphic Endpoints
# ============================================

@router.post("/ai/recommendations", response_model=AIRecommendationOut)
def get_ai_goal_recommendations(payload: AIRecommendationRequest):
    """Genera recomendaciones de goals usando Neuramorphic AI"""
    try:
        participant = Participant.objects.get(id=payload.participant_id)
        
        # Obtener goals actuales del participante
        current_goals = []
        if payload.match_id:
            match = Match.objects.get(id=payload.match_id)
            goals = Goal.objects.filter(match=match)
            current_goals = [
                {
                    "title": g.title,
                    "description": g.description,
                    "status": g.status,
                }
                for g in goals
            ]
        
        # Preparar datos del perfil (skills es JSONField, puede ser lista o string)
        if isinstance(participant.skills, list):
            skills = participant.skills
        elif isinstance(participant.skills, str):
            skills = participant.skills.split(",") if participant.skills else []
        else:
            skills = []
        
        # Obtener goals del participante como "intereses"
        participant_goals = participant.goals if isinstance(participant.goals, list) else []
        interests = [g.get("description", g) if isinstance(g, dict) else str(g) for g in participant_goals]
        
        # Llamar a Neuramorphic AI
        recommendations = GeminiAIService.generate_goal_recommendations(
            participant_skills=[s.strip() if isinstance(s, str) else str(s) for s in skills],
            participant_interests=interests[:5] if interests else ["desarrollo profesional", "crecimiento de carrera"],
            participant_role=participant.role,
            current_goals=current_goals
        )
        
        return {"recommendations": recommendations}
    
    except Participant.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Participant not found") from exc
    except Match.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Match not found") from exc
    except Exception as exc:
        print(f"AI Error: {str(exc)}")  # Debug
        import traceback
        traceback.print_exc()  # Debug
        raise HTTPException(status_code=500, detail=f"AI service error: {str(exc)}") from exc


@router.post("/ai/analyze-goal", response_model=AIAnalysisOut)
def analyze_goal_with_ai(payload: AIAnalysisRequest):
    """Analiza un goal usando Neuramorphic AI para detectar sentiment y riesgos"""
    try:
        goal = Goal.objects.get(id=payload.goal_id)
        
        # Obtener historial de updates
        updates = GoalUpdate.objects.filter(goal=goal).order_by("created_at")
        updates_history = [
            {
                "created_at": u.created_at.isoformat(),
                "note": u.note,
                "progress_before": u.progress_before,
                "progress_after": u.progress_after,
            }
            for u in updates
        ]
        
        # Análisis de sentimiento con Neuramorphic AI
        sentiment_analysis = GeminiAIService.analyze_goal_sentiment(
            goal_title=goal.title,
            goal_description=goal.description,
            updates_history=updates_history
        )
        
        # Generar alertas predictivas
        predictive_alerts = GeminiAIService.generate_predictive_alerts(
            goal_data={
                "title": goal.title,
                "status": goal.status,
                "priority": goal.priority,
            },
            progress_percentage=goal.progress_percentage,
            days_remaining=goal.days_remaining
        )
        
        return {
            **sentiment_analysis,
            "predictive_alerts": predictive_alerts
        }
    
    except Goal.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Goal not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(exc)}") from exc


@router.post("/ai/match-health", response_model=AIMatchHealthOut)
def analyze_match_health(payload: AIMatchHealthRequest):
    """Analiza la salud de un match usando Neuramorphic AI"""
    try:
        match = Match.objects.get(id=payload.match_id)
        
        # Obtener datos del match
        goals = Goal.objects.filter(match=match)
        
        # TODO: Obtener mensajes del chat cuando tengamos el modelo Chat
        chat_messages = []  # Placeholder
        
        # TODO: Calcular frecuencia de sesiones desde el calendario
        session_frequency = 0  # Placeholder
        
        match_data = {
            "score": match.score,
            "created_at": match.created_at.isoformat(),
            "status": match.status,
        }
        
        goals_data = [
            {
                "title": g.title,
                "status": g.status,
                "progress": g.progress_percentage,
            }
            for g in goals
        ]
        
        # Análisis con Neuramorphic AI
        health_analysis = GeminiAIService.analyze_match_health(
            match_data=match_data,
            chat_messages=chat_messages,
            goals=goals_data,
            session_frequency=session_frequency
        )
        
        return health_analysis
    
    except Match.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Match not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(exc)}") from exc


@router.post("/ai/generate-program")
def generate_program_with_ai(payload: dict):
    """Genera contenido de programa usando Neuramorphic AI con contexto de Inspiratoria"""
    try:
        name = payload.get("name", "")
        theme = payload.get("theme", "")
        current_data = payload.get("current_data", {})
        context = payload.get("context", "")  # Memoria contextual de pasos previos
        
        if not name or not theme:
            raise HTTPException(status_code=400, detail="Name and theme are required")
        
        # Contexto adicional si existe
        context_info = f"\n\nContexto previo del programa:\n{context}" if context else ""
        
        # Generar descripción con AI - PROMPT MEJORADO PARA INSPIRATORIA
        prompt = f"""Eres un experto en diseño de programas de mentoría corporativa de Inspiratoria, líder en América Latina en transformación ejecutiva a través de mentoría personalizada.

Inspiratoria se caracteriza por:
- Enfoque en resultados medibles y transformación real
- Mentoría ejecutiva de alto impacto con mentores certificados
- Metodología basada en neurociencia del aprendizaje y coaching ontológico
- Programas diseñados para aceleración de carrera y desarrollo de liderazgo

Genera una descripción POTENTE y profesional para este programa de mentoría:

Nombre del programa: {name}
Tema principal: {theme}{context_info}

La descripción debe ser:
1. INSPIRADORA: Que transmita transformación y resultados extraordinarios
2. ESPECÍFICA: Mencionar beneficios concretos y diferenciadores de Inspiratoria
3. PROFESIONAL: Lenguaje ejecutivo de alto nivel
4. RESULTADOS: Enfocada en el impacto y ROI para la organización
5. EXTENSIÓN: 2-3 párrafos potentes (150-200 palabras)

Incluye elementos como: metodología probada, mentores certificados, herramientas de evaluación, seguimiento personalizado, resultados medibles.

Responde SOLO con la descripción, sin títulos ni etiquetas."""

        description = GeminiAIService._call_gemini(prompt, temperature=0.7) or ""
        
        # Guardar contexto para próximos pasos
        new_context = f"Programa '{name}' sobre {theme}. Descripción generada enfocada en: {description[:100]}..."
        
        # Generar objetivos
        objectives_prompt = f"""Genera 5 objetivos SMART de alto impacto para un programa de mentoría ejecutiva de Inspiratoria sobre "{theme}".

Cada objetivo debe ser:
- ESPECÍFICO: Claro y sin ambigüedades
- MEDIBLE: Con métricas o KPIs concretos (%, números, plazos)
- ALCANZABLE: Realista pero ambicioso
- RELEVANTE: Alineado con desarrollo ejecutivo
- TEMPORAL: Con plazos definidos (ej: "en 6 meses", "al finalizar el programa")

Ejemplos de objetivos potentes:
- "Lograr el ascenso del 60% de participantes a posiciones de liderazgo senior dentro de 12 meses"
- "Incrementar en 40% la efectividad en toma de decisiones estratégicas medida por evaluaciones 360°"
- "Desarrollar 3 proyectos de innovación con impacto medible en resultados de negocio"

Responde SOLO con los 5 objetivos, uno por línea, sin numeración ni viñetas."""

        objectives_text = GeminiAIService._call_gemini(objectives_prompt, temperature=0.6) or ""
        objectives = [obj.strip() for obj in objectives_text.split("\n") if obj.strip() and len(obj.strip()) > 20][:5]
        
        # Sugerir áreas de enfoque
        focus_prompt = f"""Lista las 5 áreas de enfoque más estratégicas para un programa ejecutivo de Inspiratoria sobre "{theme}".

Usa terminología de liderazgo ejecutivo como: "Visión Estratégica", "Gestión de Cambio", "Liderazgo Transformacional", "Inteligencia Emocional", "Toma de Decisiones Complejas".

Responde SOLO con las áreas, una por línea, sin numeración. Términos profesionales de 2-4 palabras."""

        focus_text = GeminiAIService._call_gemini(focus_prompt, temperature=0.5) or ""
        focus_areas = [area.strip() for area in focus_text.split("\n") if area.strip() and len(area.strip()) > 3][:5]
        
        # Sugerir metodologías
        methodology_prompt = f"""Lista 4 metodologías o herramientas premium que Inspiratoria usa en programas de "{theme}".

Incluye metodologías como: "Sesiones 1:1 con mentor certificado", "Evaluaciones 360° basadas en competencias", "Plan de desarrollo personalizado", "Herramientas de neurociencia aplicada", "Assessment de liderazgo", "Coaching ontológico".

Responde SOLO con las metodologías, una por línea, sin numeración."""

        methodology_text = GeminiAIService._call_gemini(methodology_prompt, temperature=0.5) or ""
        methodology = [m.strip() for m in methodology_text.split("\n") if m.strip() and len(m.strip()) > 5][:4]
        
        return {
            "description": description.strip(),
            "objectives": objectives,
            "focus_areas": focus_areas,
            "methodology": methodology,
            "context": new_context,  # Devolver contexto actualizado
            "ai_generated": True
        }
        
    except Exception as exc:
        print(f"AI Generation Error: {str(exc)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI generation error: {str(exc)}") from exc


@router.post("/ai/generate-objectives")
def generate_objectives_with_ai(payload: dict):
    """Genera objetivos SMART usando Neuramorphic AI basados en un contexto específico"""
    try:
        name = payload.get("name", "")
        theme = payload.get("theme", "")
        description = payload.get("description", "")
        user_prompt = payload.get("prompt", "")
        context = payload.get("context", "")  # Memoria del Step 1
        
        if not name or not theme:
            raise HTTPException(status_code=400, detail="Name and theme are required")
        
        # Construir prompt contextual CON memoria de Inspiratoria
        context_parts = [f"Programa de Inspiratoria: {name}", f"Tema principal: {theme}"]
        
        if context:
            context_parts.append(f"Contexto del programa: {context}")
        
        if description:
            context_parts.append(f"Descripción: {description[:200]}...")
        
        if user_prompt:
            context_parts.append(f"\n🎯 CONTEXTO ESPECÍFICO DEL USUARIO:\n{user_prompt}")
        
        full_prompt = f"""Eres un experto en diseño de programas de mentoría ejecutiva de Inspiratoria, especializado en crear objetivos SMART de alto impacto.

{chr(10).join(context_parts)}

Genera 5 objetivos SMART extraordinarios que reflejen la excelencia de Inspiratoria:

Criterios SMART para cada objetivo:
✓ ESPECÍFICO: Claro y sin ambigüedades sobre QUÉ se logrará
✓ MEDIBLE: Con KPIs concretos (porcentajes, números, evaluaciones)
✓ ALCANZABLE: Desafiante pero realista para ejecutivos
✓ RELEVANTE: Alineado con desarrollo de liderazgo y resultados de negocio
✓ TEMPORAL: Con plazos claros (ej: "en 6 meses", "al finalizar", "durante el programa")

Ejemplos de objetivos de alto impacto:
- "Incrementar en 45% la capacidad de toma de decisiones estratégicas, medida por evaluaciones 360° y feedback de superiores directos"
- "Lograr la promoción del 65% de participantes a roles de mayor responsabilidad dentro de 12 meses post-programa"
- "Desarrollar 2 iniciativas estratégicas que generen impacto medible en resultados de negocio (revenue, eficiencia o innovación)"
- "Aumentar en 50% el nivel de influencia y liderazgo percibido por equipos, medido por encuestas pre y post programa"
- "Construir un plan de desarrollo de carrera personalizado con 5 hitos alcanzables en 18 meses"

Responde SOLO con los 5 objetivos, uno por línea, sin numeración, viñetas ni formato adicional."""

        objectives_text = GeminiAIService._call_gemini(full_prompt, temperature=0.6) or ""
        
        # Procesar y limpiar objetivos
        objectives = []
        for line in objectives_text.split("\n"):
            cleaned = line.strip()
            # Remover numeración o viñetas si las hay
            cleaned = cleaned.lstrip("0123456789.-•*) ")
            if cleaned and len(cleaned) > 20:  # Mínimo 20 caracteres para ser válido
                objectives.append(cleaned)
        
        # Asegurar que tenemos exactamente 5 objetivos
        objectives = objectives[:5]
        
        # Actualizar contexto para futuros pasos
        new_context = f"{context}\nObjetivos generados: {len(objectives)} objetivos SMART enfocados en: {user_prompt[:80] if user_prompt else theme}"
        # Si no tenemos suficientes, generar algunos por defecto de Inspiratoria
        while len(objectives) < 5:
            default_objectives = [
                f"Incrementar en 40% las competencias de liderazgo en {theme.lower()}, medidas por evaluaciones 360° pre y post programa",
                f"Lograr que el 75% de los participantes sean promovidos o asuman mayores responsabilidades dentro de 12 meses",
                f"Desarrollar 3 proyectos estratégicos de alto impacto con resultados medibles en el negocio durante el programa",
                f"Aumentar en 50% la efectividad en gestión de equipos y toma de decisiones complejas según feedback de stakeholders",
                f"Construir un plan de desarrollo personalizado con 5 hitos profesionales alcanzables en los próximos 18 meses"
            ]
            if len(objectives) < 5:
                objectives.append(default_objectives[len(objectives)])
        
        return {
            "objectives": objectives,
            "context": new_context,  # Devolver contexto actualizado
            "ai_generated": True
        }
        
    except Exception as exc:
        print(f"AI Objectives Error: {str(exc)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI generation error: {str(exc)}") from exc


@router.post("/ai/generate-methodology")
def generate_methodology_with_ai(payload: dict):
    """Genera metodologías y áreas de enfoque usando AI con contexto de Inspiratoria"""
    try:
        name = payload.get("name", "")
        theme = payload.get("theme", "")
        description = payload.get("description", "")
        objectives = payload.get("objectives", [])
        context = payload.get("context", "")
        
        if not name or not theme:
            raise HTTPException(status_code=400, detail="Name and theme are required")
        
        # Contexto acumulado
        context_info = f"\n\nContexto acumulado:\n{context}" if context else ""
        objectives_summary = f"\n\nObjetivos del programa:\n" + "\n".join([f"- {obj}" for obj in objectives[:3]]) if objectives else ""
        
        # Generar metodologías con AI
        methodology_prompt = f"""Eres un experto en diseño de programas ejecutivos de Inspiratoria.

Programa: {name}
Tema: {theme}
Descripción: {description[:200]}...{context_info}{objectives_summary}

Selecciona las 4-6 metodologías MÁS EFECTIVAS de esta lista para este programa específico de Inspiratoria:

METODOLOGÍAS DISPONIBLES:
- Coaching ejecutivo
- Establecimiento de OKRs
- Design Thinking
- Metodologías Ágiles
- Feedback 360°
- Shadowing
- Proyectos prácticos
- Casos de estudio

Criterios de selección:
✓ Alineadas con el tema "{theme}"
✓ Que apoyen los objetivos del programa
✓ Metodologías premium de Inspiratoria
✓ Combinación de teoría y práctica
✓ Apropiadas para ejecutivos

Responde SOLO con las metodologías seleccionadas, una por línea, exactamente como aparecen en la lista (sin números ni viñetas).
Incluye entre 4 y 6 metodologías."""

        methodology_text = GeminiAIService._call_gemini(methodology_prompt, temperature=0.5) or ""
        
        # Limpiar y validar metodologías
        valid_methodologies = [
            "Coaching ejecutivo", "Establecimiento de OKRs", "Design Thinking",
            "Metodologías Ágiles", "Feedback 360°", "Shadowing",
            "Proyectos prácticos", "Casos de estudio"
        ]
        
        selected_methodologies = []
        for line in methodology_text.split("\n"):
            cleaned = line.strip().lstrip("0123456789.-•*) ")
            # Buscar coincidencias flexibles
            for valid in valid_methodologies:
                if valid.lower() in cleaned.lower() and valid not in selected_methodologies:
                    selected_methodologies.append(valid)
                    break
        
        # Si no hay suficientes, agregar por defecto según tema
        if len(selected_methodologies) < 4:
            default_by_theme = {
                "Liderazgo Ejecutivo": ["Coaching ejecutivo", "Feedback 360°", "Casos de estudio", "Proyectos prácticos"],
                "Desarrollo de Carrera": ["Coaching ejecutivo", "Establecimiento de OKRs", "Shadowing", "Proyectos prácticos"],
                "Habilidades Técnicas": ["Proyectos prácticos", "Casos de estudio", "Metodologías Ágiles", "Design Thinking"],
                "Innovación y Transformación": ["Design Thinking", "Metodologías Ágiles", "Proyectos prácticos", "Casos de estudio"]
            }
            defaults = default_by_theme.get(theme, ["Coaching ejecutivo", "Feedback 360°", "Proyectos prácticos", "Casos de estudio"])
            for method in defaults:
                if method not in selected_methodologies:
                    selected_methodologies.append(method)
                if len(selected_methodologies) >= 6:
                    break
        
        # Generar áreas de enfoque
        focus_prompt = f"""Eres un experto en diseño de programas ejecutivos de Inspiratoria.

Programa: {name}
Tema: {theme}
Descripción: {description[:200]}...{context_info}{objectives_summary}

Selecciona las 5-7 áreas de enfoque MÁS RELEVANTES de esta lista para este programa:

ÁREAS DISPONIBLES:
- Liderazgo estratégico
- Gestión del cambio
- Comunicación ejecutiva
- Toma de decisiones
- Inteligencia emocional
- Desarrollo de equipos
- Innovación
- Gestión de conflictos
- Pensamiento crítico
- Negociación

Criterios de selección:
✓ Directamente relacionadas con "{theme}"
✓ Que soporten los objetivos del programa
✓ Competencias ejecutivas clave
✓ Balance entre hard y soft skills
✓ Impacto medible en resultados

Responde SOLO con las áreas seleccionadas, una por línea, exactamente como aparecen en la lista (sin números ni viñetas).
Incluye entre 5 y 7 áreas."""

        focus_text = GeminiAIService._call_gemini(focus_prompt, temperature=0.5) or ""
        
        # Limpiar y validar áreas
        valid_focus_areas = [
            "Liderazgo estratégico", "Gestión del cambio", "Comunicación ejecutiva",
            "Toma de decisiones", "Inteligencia emocional", "Desarrollo de equipos",
            "Innovación", "Gestión de conflictos", "Pensamiento crítico", "Negociación"
        ]
        
        selected_focus = []
        for line in focus_text.split("\n"):
            cleaned = line.strip().lstrip("0123456789.-•*) ")
            for valid in valid_focus_areas:
                if valid.lower() in cleaned.lower() and valid not in selected_focus:
                    selected_focus.append(valid)
                    break
        
        # Si no hay suficientes, agregar por defecto
        if len(selected_focus) < 5:
            default_focus_by_theme = {
                "Liderazgo Ejecutivo": ["Liderazgo estratégico", "Toma de decisiones", "Comunicación ejecutiva", "Gestión del cambio", "Desarrollo de equipos"],
                "Desarrollo de Carrera": ["Comunicación ejecutiva", "Inteligencia emocional", "Negociación", "Pensamiento crítico", "Desarrollo de equipos"],
                "Habilidades Técnicas": ["Pensamiento crítico", "Innovación", "Toma de decisiones", "Gestión de conflictos", "Comunicación ejecutiva"],
                "Innovación y Transformación": ["Innovación", "Gestión del cambio", "Pensamiento crítico", "Liderazgo estratégico", "Toma de decisiones"]
            }
            defaults = default_focus_by_theme.get(theme, ["Liderazgo estratégico", "Comunicación ejecutiva", "Toma de decisiones", "Inteligencia emocional", "Desarrollo de equipos"])
            for area in defaults:
                if area not in selected_focus:
                    selected_focus.append(area)
                if len(selected_focus) >= 7:
                    break
        
        # Actualizar contexto
        new_context = f"{context}\nMetodologías seleccionadas: {', '.join(selected_methodologies[:3])}... Áreas de enfoque: {', '.join(selected_focus[:3])}..."
        
        return {
            "methodology": selected_methodologies[:6],
            "focus_areas": selected_focus[:7],
            "context": new_context,
            "ai_generated": True
        }
        
    except Exception as exc:
        print(f"AI Methodology Error: {str(exc)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI generation error: {str(exc)}") from exc


# ============= DASHBOARD STATISTICS ENDPOINTS =============

@router.get("/stats/dashboard")
def get_dashboard_stats() -> dict:
    """
    Obtener estadísticas generales del dashboard
    """
    from django.db.models import Count, Avg, Q
    from datetime import datetime, timedelta
    
    # Estadísticas básicas
    total_programs = Program.objects.count()
    active_programs = Program.objects.filter(status="active").count()
    total_participants = Participant.objects.count()
    total_matches = Match.objects.count()
    active_matches = Match.objects.filter(status="active").count()
    completed_matches = Match.objects.filter(status="completed").count()
    
    # Promedio de score
    avg_score = Match.objects.aggregate(avg=Avg("score"))["avg"] or 0
    
    # Participantes por rol
    mentors_count = Participant.objects.filter(role="mentor").count()
    mentees_count = Participant.objects.filter(role="mentee").count()
    
    # Matches por status
    pending_matches = Match.objects.filter(status="pending").count()
    
    # Goals statistics
    total_goals = Goal.objects.count()
    completed_goals = Goal.objects.filter(status="completed").count()
    in_progress_goals = Goal.objects.filter(status="in_progress").count()
    
    # Sentimientos
    recent_sentiments = Sentiment.objects.order_by("-recorded_at")[:10]
    avg_sentiment = Sentiment.objects.aggregate(avg=Avg("score"))["avg"] or 0
    
    # Actividad reciente (últimos 30 días)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_matches = Match.objects.filter(created_at__gte=thirty_days_ago).count()
    recent_goals = Goal.objects.filter(created_at__gte=thirty_days_ago).count()
    
    return {
        "programs": {
            "total": total_programs,
            "active": active_programs,
            "draft": Program.objects.filter(status="draft").count(),
            "paused": Program.objects.filter(status="paused").count(),
            "completed": Program.objects.filter(status="completed").count(),
        },
        "participants": {
            "total": total_participants,
            "mentors": mentors_count,
            "mentees": mentees_count,
        },
        "matches": {
            "total": total_matches,
            "active": active_matches,
            "completed": completed_matches,
            "pending": pending_matches,
            "avg_score": round(float(avg_score), 2),
            "recent_30_days": recent_matches,
        },
        "goals": {
            "total": total_goals,
            "completed": completed_goals,
            "in_progress": in_progress_goals,
            "not_started": Goal.objects.filter(status="not_started").count(),
            "recent_30_days": recent_goals,
        },
        "sentiment": {
            "average": round(float(avg_sentiment), 2),
            "total_ratings": Sentiment.objects.count(),
        },
        "engagement": {
            "participation_rate": round((active_matches / total_participants * 100) if total_participants > 0 else 0, 2),
            "completion_rate": round((completed_matches / total_matches * 100) if total_matches > 0 else 0, 2),
            "goal_completion_rate": round((completed_goals / total_goals * 100) if total_goals > 0 else 0, 2),
        }
    }


@router.get("/stats/programs/{program_id}")
def get_program_stats(program_id: str) -> dict:
    """
    Estadísticas detalladas de un programa específico
    """
    from django.db.models import Avg, Count
    import uuid
    
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
    except Program.DoesNotExist as exc:
        raise HTTPException(status_code=404, detail="Program not found") from exc
    
    participants = Participant.objects.filter(program=program)
    matches = Match.objects.filter(program=program)
    
    return {
        "program_id": program.id,
        "program_name": program.name,
        "participants": {
            "total": participants.count(),
            "mentors": participants.filter(role="mentor").count(),
            "mentees": participants.filter(role="mentee").count(),
        },
        "matches": {
            "total": matches.count(),
            "active": matches.filter(status="active").count(),
            "completed": matches.filter(status="completed").count(),
            "avg_score": round(float(matches.aggregate(avg=Avg("score"))["avg"] or 0), 2),
        }
    }


@router.get("/stats/timeline")
def get_timeline_stats(days: int = 30) -> dict:
    """
    Estadísticas de timeline para gráficos temporales
    """
    from datetime import datetime, timedelta
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Matches por día
    matches_timeline = (
        Match.objects
        .filter(created_at__gte=start_date)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    
    # Goals por día
    goals_timeline = (
        Goal.objects
        .filter(created_at__gte=start_date)
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    
    return {
        "matches": [
            {
                "date": item["date"].isoformat(),
                "count": item["count"]
            }
            for item in matches_timeline
        ],
        "goals": [
            {
                "date": item["date"].isoformat(),
                "count": item["count"]
            }
            for item in goals_timeline
        ]
    }


# ==========================================
# AI-POWERED MATCHING SUGGESTIONS
# ==========================================

@router.post("/ai/match-suggestions")
def generate_ai_match_suggestions(data: dict) -> list[dict]:
    """
    Genera sugerencias de matching usando IA avanzada.
    Analiza skills, goals, disponibilidad y compatibilidad.
    """
    program_id = data.get("program_id")
    
    if not program_id:
        raise HTTPException(status_code=400, detail="program_id is required")
    
    try:
        # Get program
        program = Program.objects.get(id=program_id)
        
        # Get mentors and mentees from this program
        mentors = list(Participant.objects.filter(
            program=program,
            role="mentor"
        ).select_related('program'))
        
        mentees = list(Participant.objects.filter(
            program=program,
            role="mentee"
        ).select_related('program'))
        
        print(f"🔍 DEBUG Matching:")
        print(f"  Program ID: {program_id}")
        print(f"  Program: {program.name}")
        print(f"  Mentors found: {len(mentors)}")
        print(f"  Mentees found: {len(mentees)}")
        for mentor in mentors:
            print(f"    - Mentor: {mentor.full_name} (ID: {mentor.id})")
        for mentee in mentees:
            print(f"    - Mentee: {mentee.full_name} (ID: {mentee.id})")
        
        if not mentors or not mentees:
            print(f"  ❌ No matches possible: mentors={len(mentors)}, mentees={len(mentees)}")
            return []
        
        # Generate match suggestions with AI scoring
        suggestions = []
        
        for mentee in mentees:
            for mentor in mentors:
                # Calculate AI-powered compatibility score
                score = calculate_ai_compatibility_score(mentor, mentee)
                
                print(f"  📊 Score: {mentor.full_name} <-> {mentee.full_name} = {score}")
                
                # Only include high-potential matches (score >= 50)
                if score >= 50:
                    # Get mentor skills
                    mentor_skills = []
                    if hasattr(mentor, 'skills') and mentor.skills:
                        if isinstance(mentor.skills, str):
                            mentor_skills = [s.strip() for s in mentor.skills.split(',') if s.strip()]
                        elif isinstance(mentor.skills, list):
                            mentor_skills = mentor.skills
                    
                    # Get mentee goals - try from goals field first, then from Goals table
                    mentee_goals = []
                    if hasattr(mentee, 'goals') and mentee.goals:
                        if isinstance(mentee.goals, str):
                            mentee_goals = [g.strip() for g in mentee.goals.split(',') if g.strip()]
                        elif isinstance(mentee.goals, list):
                            mentee_goals = mentee.goals
                    else:
                        # Fallback: try to get from Goal objects
                        try:
                            goals_objs = Goal.objects.filter(match__mentee=mentee)[:5]
                            mentee_goals = [g.title for g in goals_objs if hasattr(g, 'title')]
                        except:
                            mentee_goals = []
                    
                    # Get mentor and mentee full info
                    mentor_name = mentor.full_name if mentor else "Unknown Mentor"
                    mentee_name = mentee.full_name if mentee else "Unknown Mentee"
                    
                    suggestions.append({
                        "id": f"suggestion-{mentor.id}-{mentee.id}",
                        "mentor": {
                            "id": str(mentor.id),
                            "name": mentor_name,
                            "full_name": mentor_name,
                            "title": getattr(mentor, 'headline', '') or "Mentor",
                            "headline": getattr(mentor, 'headline', '') or "Mentor",
                            "skills": mentor_skills[:5] if mentor_skills else ["Leadership", "Communication"],
                            "availability_hours": getattr(mentor, 'availability_hours', 2),
                            "experience_years": getattr(mentor, 'experience_years', 5),
                        },
                        "mentee": {
                            "id": str(mentee.id),
                            "name": mentee_name,
                            "full_name": mentee_name,
                            "title": getattr(mentee, 'headline', '') or "Mentee",
                            "headline": getattr(mentee, 'headline', '') or "Mentee",
                            "goals": mentee_goals if mentee_goals else ["Professional Growth", "Skill Development"],
                            "availability_hours": getattr(mentee, 'availability_hours', 2),
                            "current_level": getattr(mentee, 'current_level', 'junior'),
                        },
                        "program_id": str(program.id),
                        "program_name": program.name,
                        "score": score,
                        "compatibility_score": score,
                        "status": "pending",
                    })
        
        # Sort by score descending
        suggestions.sort(key=lambda x: x['score'], reverse=True)
        
        # Return top 10 suggestions
        return suggestions[:10]
        
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Error generating suggestions: {str(e)}")
        print(error_traceback)
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")


def calculate_ai_compatibility_score(mentor: Participant, mentee: Participant) -> int:
    """
    Calcula un score de compatibilidad avanzado usando múltiples factores.
    Score range: 0-100
    """
    score = 50  # Base score
    
    # Factor 1: Skills vs Goals alignment (max +25 points)
    mentor_skills = []
    if hasattr(mentor, 'skills') and mentor.skills:
        if isinstance(mentor.skills, str):
            mentor_skills = [s.strip().lower() for s in mentor.skills.split(',') if s.strip()]
        elif isinstance(mentor.skills, list):
            mentor_skills = [s.lower() for s in mentor.skills]
    
    # Get mentee goals from goals field or Goal objects
    mentee_goals = []
    if hasattr(mentee, 'goals') and mentee.goals:
        if isinstance(mentee.goals, str):
            mentee_goals = [g.strip().lower() for g in mentee.goals.split(',') if g.strip()]
        elif isinstance(mentee.goals, list):
            mentee_goals = [g.lower() for g in mentee.goals]
    else:
        # Fallback: try Goal objects
        try:
            goals_objs = Goal.objects.filter(match__mentee=mentee)[:10]
            mentee_goals = [g.title.lower() for g in goals_objs if hasattr(g, 'title')]
        except:
            pass
    
    # Check skill-goal overlap
    skill_matches = 0
    if mentor_skills and mentee_goals:
        for goal in mentee_goals:
            for skill in mentor_skills:
                if skill in goal or goal in skill:
                    skill_matches += 1
                    break
        
        skill_alignment = min(25, (skill_matches / len(mentee_goals)) * 25)
        score += skill_alignment
    elif mentor_skills:
        # If no goals but has skills, give partial credit
        score += 10
    
    # Factor 2: Availability compatibility (max +15 points)
    mentor_hours = getattr(mentor, 'availability_hours', 2)
    mentee_hours = getattr(mentee, 'availability_hours', 2)
    
    if mentor_hours >= mentee_hours and mentor_hours >= 2:
        score += 15
    elif mentor_hours >= 1:
        score += 8
    
    # Factor 3: Experience level match (max +10 points)
    mentor_exp = getattr(mentor, 'experience_years', 5)
    mentee_level = getattr(mentee, 'current_level', 'junior').lower()
    
    if mentee_level == 'junior' and mentor_exp >= 5:
        score += 10
    elif mentee_level == 'mid' and mentor_exp >= 3:
        score += 8
    elif mentee_level == 'senior' and mentor_exp >= 7:
        score += 10
    else:
        score += 5
    
    # Ensure score is within range
    return min(100, max(0, int(score)))


# ═══════════════════════════════════════════════════════════════════
# INTELLIGENT MATCHING — operates on User profile data
# ═══════════════════════════════════════════════════════════════════

class IntelligentMatchRequest(BaseModel):
    program_id: Optional[str] = None
    company_id: Optional[str] = None
    mentor_id: Optional[str] = None
    mentee_id: Optional[str] = None
    top_k: int = 10
    min_score: float = 0.0
    use_ai: bool = False  # If True and GEMINI_API_KEY is set, enrich top results with AI rationale


@router.post("/matches/intelligent")
def intelligent_match_endpoint(payload: IntelligentMatchRequest) -> dict:
    """
    Smart mentor↔mentee matching based on rich User profile data:
    skills, mentor_topics, mentor_style, experience level/area, mentor_objectives,
    mentee_goals, mentee_interests, mentee_challenges, mentee_expectations,
    preferred_mentor_style, headline / position / department.

    Returns ranked suggestions with explainable per-dimension breakdown,
    matched keywords, human-readable reasons, and (optionally) Gemini rationale.
    """
    try:
        result = intelligent_match(
            program_id=payload.program_id,
            company_id=payload.company_id,
            mentor_id=payload.mentor_id,
            mentee_id=payload.mentee_id,
            top_k=max(1, min(50, payload.top_k)),
            min_score=max(0.0, min(100.0, payload.min_score)),
            use_ai=payload.use_ai,
        )
        return result
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Intelligent matching failed: {exc}")


@router.get("/matches/intelligent/score")
def intelligent_match_score(mentor_id: str, mentee_id: str) -> dict:
    """Score a single (mentor, mentee) pair on demand."""
    from companies.models import User as _User
    try:
        mentor = _User.objects.get(id=mentor_id, role="mentor")
        mentee = _User.objects.get(id=mentee_id, role="mentee")
    except _User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Mentor or mentee not found")
    return score_pair(mentor, mentee)


@router.post("/matches/{match_id}/approve")
def approve_match_suggestion(match_id: str) -> dict:
    """
    Aprueba una sugerencia de matching y crea el match en la base de datos.
    """
    try:
        # Parse the suggestion ID format: "suggestion-{mentor_id}-{mentee_id}"
        if not match_id.startswith("suggestion-"):
            raise HTTPException(status_code=400, detail="Invalid suggestion ID format")
        
        parts = match_id.split("-")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid suggestion ID format")
        
        mentor_id = parts[1]
        mentee_id = parts[2]
        
        # Get participants
        mentor = Participant.objects.get(id=mentor_id, role="mentor")
        mentee = Participant.objects.get(id=mentee_id, role="mentee")
        
        # Check if match already exists
        existing_match = Match.objects.filter(
            mentor=mentor,
            mentee=mentee
        ).first()
        
        if existing_match:
            return {
                "status": "already_exists",
                "match_id": str(existing_match.id),
                "message": "Match already exists"
            }
        
        # Create new match
        score = calculate_ai_compatibility_score(mentor, mentee)
        new_match = create_match_with_score(mentor, mentee, score / 10.0)  # Convert to 0-10 scale
        
        return {
            "status": "approved",
            "match_id": str(new_match.id),
            "message": "Match created successfully",
            "score": score
        }
        
    except Participant.DoesNotExist:
        raise HTTPException(status_code=404, detail="Participant not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving match: {str(e)}")


# ==================== ACTIVITIES ROUTES ====================
from programs.models import Activity

@router.get("/activities")
def list_activities(program_id: Optional[int] = None) -> List[dict]:
    """
    Lista todas las actividades o las de un programa específico
    """
    try:
        if program_id:
            activities = Activity.objects.filter(program_id=program_id).select_related('program')
        else:
            activities = Activity.objects.all().select_related('program')
        
        return [
            {
                "id": str(activity.id),
                "name": activity.name,
                "description": activity.description,
                "activity_type": activity.activity_type,
                "status": activity.status,
                "start_date": activity.start_date.isoformat() if activity.start_date else None,
                "end_date": activity.end_date.isoformat() if activity.end_date else None,
                "program": {
                    "id": str(activity.program.id),
                    "name": activity.program.name,
                },
                "confirmed_count": activity.confirmed_count,
                "attendance_count": activity.attendance_count,
                "invitations_sent": activity.invitations_sent,
            }
            for activity in activities
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading activities: {str(e)}")


@router.post("/activities", status_code=201)
def create_activity(
    program_id: str,
    name: str,
    description: str = "",
    activity_type: str = "event",
    training_category: Optional[str] = None,
    event_category: Optional[str] = None,
    modality: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    target_role: Optional[str] = None,
    has_modules: bool = False,
    requires_module_survey: bool = False,
    provides_certification: bool = False,
    requires_satisfaction_survey: bool = False,
    provides_participation_certificate: bool = False,
    meeting_url: Optional[str] = None,
    location_address: Optional[str] = None,
) -> dict:
    """
    Crea una nueva actividad con todos los campos necesarios
    Genera automáticamente URL de Google Meet para modalidad online
    """
    from datetime import datetime
    import uuid
    
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
        
        # Parse dates if provided
        parsed_start_date = None
        parsed_end_date = None
        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing start_date: {e}")
        
        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing end_date: {e}")
        
        # Generar URL de Google Meet automáticamente para modalidad online
        final_meeting_url = meeting_url
        if modality in ["online", "hybrid"] and not meeting_url:
            # Generar un ID único para la reunión
            meet_id = str(uuid.uuid4())[:12].replace('-', '')
            final_meeting_url = f"https://meet.google.com/{meet_id[:3]}-{meet_id[3:7]}-{meet_id[7:10]}"
        
        activity = Activity.objects.create(
            program=program,
            name=name,
            description=description,
            activity_type=activity_type,
            training_category=training_category if activity_type == "training" else None,
            event_category=event_category if activity_type == "event" else None,
            modality=modality,
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            target_role=target_role or "",
            has_modules=has_modules,
            requires_module_survey=requires_module_survey,
            provides_certification=provides_certification,
            requires_satisfaction_survey=requires_satisfaction_survey,
            provides_participation_certificate=provides_participation_certificate,
            meeting_url=final_meeting_url,
            location_address=location_address,
            status="scheduled" if parsed_start_date else "created",
        )
        
        return {
            "id": str(activity.id),
            "name": activity.name,
            "description": activity.description,
            "activity_type": activity.activity_type,
            "start_date": activity.start_date.isoformat() if activity.start_date else None,
            "end_date": activity.end_date.isoformat() if activity.end_date else None,
            "status": activity.status,
            "modality": activity.modality,
            "meeting_url": activity.meeting_url,
            "location_address": activity.location_address,
            "message": "Activity created successfully"
        }
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")


@router.post("/activities/create", status_code=201)
def create_activity_with_modules(payload: dict) -> dict:
    """
    Crea una nueva actividad con módulos de contenido (para entrenamientos)
    Acepta JSON body con estructura completa incluyendo módulos y configuración
    """
    from datetime import datetime
    from programs.models import Content
    import uuid
    
    try:
        program_id = payload.get("program_id")
        if not program_id:
            raise HTTPException(status_code=400, detail="program_id is required")
        
        program = Program.objects.get(id=program_id)
        
        # Parse dates if provided
        parsed_start_date = None
        parsed_end_date = None
        start_date = payload.get("start_date")
        end_date = payload.get("end_date")
        
        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing start_date: {e}")
        
        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing end_date: {e}")
        
        # Generar URL de Google Meet automáticamente para modalidad online
        modality = payload.get("modality")
        meeting_url = payload.get("meeting_url")
        final_meeting_url = meeting_url
        
        if modality in ["online", "hybrid"] and not meeting_url:
            meet_id = str(uuid.uuid4())[:12].replace('-', '')
            final_meeting_url = f"https://meet.google.com/{meet_id[:3]}-{meet_id[3:7]}-{meet_id[7:10]}"
        
        # Determinar la categoría según el tipo de actividad
        activity_type = payload.get("type", "event")  # Cambié de activity_type a type
        category = payload.get("category", "mentoria")
        
        training_category = None
        event_category = None
        
        if activity_type == "training":
            training_category = category
        else:
            event_category = category
        
        # Mapear is_mandatory y is_certificate_issued a los campos del modelo
        is_mandatory = payload.get("is_mandatory", False)
        is_certificate_issued = payload.get("is_certificate_issued", False)
        
        # Crear la actividad
        activity = Activity.objects.create(
            program=program,
            name=payload.get("name", ""),
            description=payload.get("description", ""),
            activity_type=activity_type,
            training_category=training_category,
            event_category=event_category,
            modality=modality,
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            target_role=payload.get("target_role", ""),
            has_modules=is_mandatory or len(payload.get("modules", [])) > 0,  # Si tiene módulos o es obligatorio
            requires_module_survey=payload.get("requires_module_survey", False),
            provides_certification=is_certificate_issued if activity_type == "training" else False,
            requires_satisfaction_survey=payload.get("requires_satisfaction_survey", False),
            provides_participation_certificate=is_certificate_issued if activity_type == "event" else False,
            meeting_url=final_meeting_url,
            location_address=payload.get("location_address"),
            status="scheduled" if parsed_start_date else "created",
        )
        
        # Procesar módulos si existen
        modules = payload.get("modules", [])
        created_modules = []
        
        if modules:
            for module_data in modules:
                # Parse module dates if provided
                module_start_date = None
                module_end_date = None
                
                if module_data.get("start_date"):
                    try:
                        module_start_date = datetime.fromisoformat(module_data["start_date"].replace('Z', '+00:00'))
                    except Exception as e:
                        print(f"Error parsing module start_date: {e}")
                
                if module_data.get("end_date"):
                    try:
                        module_end_date = datetime.fromisoformat(module_data["end_date"].replace('Z', '+00:00'))
                    except Exception as e:
                        print(f"Error parsing module end_date: {e}")
                
                content = Content.objects.create(
                    activity=activity,
                    title=module_data.get("title", ""),
                    description=module_data.get("description", ""),
                    order=module_data.get("order", 1),
                    materials_url=module_data.get("materials_url", ""),
                    duration_minutes=module_data.get("duration_minutes", 60),
                    requires_evaluation=module_data.get("requires_evaluation", False),
                    minimum_score=module_data.get("minimum_score", 70),
                    start_date=module_start_date,
                    end_date=module_end_date,
                    is_published=True,
                )
                created_modules.append({
                    "id": str(content.id),
                    "title": content.title,
                    "description": content.description,
                    "order": content.order,
                    "duration_minutes": content.duration_minutes,
                    "requires_evaluation": content.requires_evaluation,
                    "minimum_score": content.minimum_score,
                    "start_date": content.start_date.isoformat() if content.start_date else None,
                    "end_date": content.end_date.isoformat() if content.end_date else None,
                })
        
        # Guardar configuración de entrenamiento si existe
        training_config = payload.get("training_config", {})
        if training_config:
            # Aquí podrías guardar la configuración en campos adicionales del modelo Activity
            # o en un modelo relacionado TrainingConfig si lo implementas
            pass
        
        return {
            "id": str(activity.id),
            "name": activity.name,
            "description": activity.description,
            "activity_type": activity.activity_type,
            "start_date": activity.start_date.isoformat() if activity.start_date else None,
            "end_date": activity.end_date.isoformat() if activity.end_date else None,
            "status": activity.status,
            "modality": activity.modality,
            "meeting_url": activity.meeting_url,
            "location_address": activity.location_address,
            "modules_created": len(created_modules),
            "modules": created_modules,
            "message": f"Activity created successfully with {len(created_modules)} modules"
        }
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")
    except Exception as e:
        import traceback
        print(f"Error creating activity with modules: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")


@router.delete("/activities/{activity_id}", status_code=204)
def delete_activity(activity_id: int):
    """
    Elimina una actividad y todos sus módulos asociados
    """
    from programs.models import Activity, Content
    
    try:
        activity = Activity.objects.get(id=activity_id)
        
        # Eliminar módulos asociados primero
        Content.objects.filter(activity=activity).delete()
        
        # Eliminar la actividad
        activity.delete()
        
        return None
    except Activity.DoesNotExist:
        raise HTTPException(status_code=404, detail="Activity not found")
    except Exception as e:
        import traceback
        print(f"Error deleting activity: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error deleting activity: {str(e)}")


@router.put("/activities/{activity_id}", status_code=200)
def update_activity(activity_id: int, payload: dict) -> dict:
    """
    Actualiza una actividad existente con sus módulos
    """
    from datetime import datetime
    from programs.models import Activity, Content
    import uuid
    
    try:
        activity = Activity.objects.get(id=activity_id)
        
        # Parse dates if provided
        parsed_start_date = None
        parsed_end_date = None
        start_date = payload.get("start_date")
        end_date = payload.get("end_date")
        
        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing start_date: {e}")
        
        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing end_date: {e}")
        
        # Generar URL de Google Meet automáticamente para modalidad online si no existe
        modality = payload.get("modality", activity.modality)
        meeting_url = payload.get("meeting_url", activity.meeting_url)
        
        if modality in ["online", "hybrid"] and not meeting_url:
            meet_id = str(uuid.uuid4())[:12].replace('-', '')
            meeting_url = f"https://meet.google.com/{meet_id[:3]}-{meet_id[3:7]}-{meet_id[7:10]}"
        
        # Determinar la categoría según el tipo de actividad
        activity_type = payload.get("type", activity.activity_type)
        category = payload.get("category", "mentoria")
        
        training_category = None
        event_category = None
        
        if activity_type == "training":
            training_category = category
        else:
            event_category = category
        
        # Mapear is_mandatory y is_certificate_issued
        is_mandatory = payload.get("is_mandatory", activity.has_modules)
        is_certificate_issued = payload.get("is_certificate_issued", activity.provides_certification)
        
        # Actualizar la actividad
        activity.name = payload.get("name", activity.name)
        activity.description = payload.get("description", activity.description)
        activity.activity_type = activity_type
        activity.training_category = training_category
        activity.event_category = event_category
        activity.modality = modality
        activity.start_date = parsed_start_date if parsed_start_date else activity.start_date
        activity.end_date = parsed_end_date if parsed_end_date else activity.end_date
        activity.target_role = payload.get("target_role", activity.target_role)
        activity.has_modules = is_mandatory or len(payload.get("modules", [])) > 0
        activity.provides_certification = is_certificate_issued if activity_type == "training" else activity.provides_certification
        activity.provides_participation_certificate = is_certificate_issued if activity_type == "event" else activity.provides_participation_certificate
        activity.meeting_url = meeting_url
        activity.location_address = payload.get("location_address", activity.location_address)
        activity.status = "scheduled" if activity.start_date else "created"
        activity.save()
        
        # Eliminar módulos existentes y crear nuevos
        Content.objects.filter(activity=activity).delete()
        
        modules = payload.get("modules", [])
        created_modules = []
        
        if modules:
            for module_data in modules:
                # Parse module dates if provided
                module_start_date = None
                module_end_date = None
                
                if module_data.get("start_date"):
                    try:
                        module_start_date = datetime.fromisoformat(module_data["start_date"].replace('Z', '+00:00'))
                    except Exception as e:
                        print(f"Error parsing module start_date: {e}")
                
                if module_data.get("end_date"):
                    try:
                        module_end_date = datetime.fromisoformat(module_data["end_date"].replace('Z', '+00:00'))
                    except Exception as e:
                        print(f"Error parsing module end_date: {e}")
                
                content = Content.objects.create(
                    activity=activity,
                    title=module_data.get("title", ""),
                    description=module_data.get("description", ""),
                    order=module_data.get("order", 1),
                    materials_url=module_data.get("materials_url", ""),
                    duration_minutes=module_data.get("duration_minutes", 60),
                    requires_evaluation=module_data.get("requires_evaluation", False),
                    minimum_score=module_data.get("minimum_score", 70),
                    start_date=module_start_date,
                    end_date=module_end_date,
                    is_published=True,
                )
                created_modules.append({
                    "id": str(content.id),
                    "title": content.title,
                    "description": content.description,
                    "order": content.order,
                    "duration_minutes": content.duration_minutes,
                    "requires_evaluation": content.requires_evaluation,
                    "minimum_score": content.minimum_score,
                    "start_date": content.start_date.isoformat() if content.start_date else None,
                    "end_date": content.end_date.isoformat() if content.end_date else None,
                })
        
        return {
            "id": str(activity.id),
            "name": activity.name,
            "description": activity.description,
            "activity_type": activity.activity_type,
            "start_date": activity.start_date.isoformat() if activity.start_date else None,
            "end_date": activity.end_date.isoformat() if activity.end_date else None,
            "status": activity.status,
            "modality": activity.modality,
            "meeting_url": activity.meeting_url,
            "location_address": activity.location_address,
            "modules_updated": len(created_modules),
            "modules": created_modules,
            "message": f"Activity updated successfully with {len(created_modules)} modules"
        }
    except Activity.DoesNotExist:
        raise HTTPException(status_code=404, detail="Activity not found")
    except Exception as e:
        import traceback
        print(f"Error updating activity: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating activity: {str(e)}")


# ==================== MODULES/CONTENT ROUTES ====================

@router.post("/activities/{activity_id}/modules", status_code=201)
def create_module(activity_id: int, payload: dict) -> dict:
    """
    Crea un nuevo módulo para una actividad de entrenamiento
    """
    from datetime import datetime
    from programs.models import Activity, Content
    
    try:
        activity = Activity.objects.get(id=activity_id)
        
        # Parse module dates if provided
        module_start_date = None
        module_end_date = None
        
        if payload.get("start_date"):
            try:
                module_start_date = datetime.fromisoformat(payload["start_date"].replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing module start_date: {e}")
        
        if payload.get("end_date"):
            try:
                module_end_date = datetime.fromisoformat(payload["end_date"].replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing module end_date: {e}")
        
        # Obtener el siguiente order disponible
        max_order = Content.objects.filter(activity=activity).aggregate(django_models.Max('order'))['order__max'] or 0
        order = payload.get("order", max_order + 1)
        
        content = Content.objects.create(
            activity=activity,
            title=payload.get("title", ""),
            description=payload.get("description", ""),
            order=order,
            materials_url=payload.get("materials_url", ""),
            duration_minutes=payload.get("duration_minutes", 60),
            requires_evaluation=payload.get("requires_evaluation", False),
            minimum_score=payload.get("minimum_score", 70),
            start_date=module_start_date,
            end_date=module_end_date,
            is_published=payload.get("is_published", False),
        )
        
        return {
            "id": content.id,
            "title": content.title,
            "description": content.description,
            "order": content.order,
            "duration_minutes": content.duration_minutes,
            "requires_evaluation": content.requires_evaluation,
            "minimum_score": content.minimum_score,
            "start_date": content.start_date.isoformat() if content.start_date else None,
            "end_date": content.end_date.isoformat() if content.end_date else None,
            "is_published": content.is_published,
            "materials_url": content.materials_url,
            "message": "Module created successfully"
        }
    except Activity.DoesNotExist:
        raise HTTPException(status_code=404, detail="Activity not found")
    except Exception as e:
        import traceback
        print(f"Error creating module: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating module: {str(e)}")


@router.put("/modules/{module_id}", status_code=200)
def update_module(module_id: int, payload: dict) -> dict:
    """
    Actualiza un módulo existente
    """
    from datetime import datetime
    from programs.models import Content
    
    try:
        content = Content.objects.get(id=module_id)
        
        # Parse module dates if provided
        if payload.get("start_date"):
            try:
                content.start_date = datetime.fromisoformat(payload["start_date"].replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing module start_date: {e}")
        
        if payload.get("end_date"):
            try:
                content.end_date = datetime.fromisoformat(payload["end_date"].replace('Z', '+00:00'))
            except Exception as e:
                print(f"Error parsing module end_date: {e}")
        
        # Actualizar campos
        content.title = payload.get("title", content.title)
        content.description = payload.get("description", content.description)
        content.duration_minutes = payload.get("duration_minutes", content.duration_minutes)
        content.requires_evaluation = payload.get("requires_evaluation", content.requires_evaluation)
        content.minimum_score = payload.get("minimum_score", content.minimum_score)
        content.materials_url = payload.get("materials_url", content.materials_url)
        content.is_published = payload.get("is_published", content.is_published)
        
        if "order" in payload:
            content.order = payload["order"]
        
        content.save()
        
        return {
            "id": content.id,
            "title": content.title,
            "description": content.description,
            "order": content.order,
            "duration_minutes": content.duration_minutes,
            "requires_evaluation": content.requires_evaluation,
            "minimum_score": content.minimum_score,
            "start_date": content.start_date.isoformat() if content.start_date else None,
            "end_date": content.end_date.isoformat() if content.end_date else None,
            "is_published": content.is_published,
            "materials_url": content.materials_url,
            "message": "Module updated successfully"
        }
    except Content.DoesNotExist:
        raise HTTPException(status_code=404, detail="Module not found")
    except Exception as e:
        import traceback
        print(f"Error updating module: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating module: {str(e)}")


@router.delete("/modules/{module_id}", status_code=204)
def delete_module(module_id: int):
    """
    Elimina un módulo
    """
    from programs.models import Content
    
    try:
        content = Content.objects.get(id=module_id)
        content.delete()
        return None
    except Content.DoesNotExist:
        raise HTTPException(status_code=404, detail="Module not found")
    except Exception as e:
        import traceback
        print(f"Error deleting module: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error deleting module: {str(e)}")


# ==================== ALERTS ROUTES ====================
from programs.models import Alert

@router.get("/alerts")
def list_alerts(
    program_id: Optional[int] = None,
    status: Optional[str] = None,
) -> List[dict]:
    """
    Lista todas las alertas con filtros opcionales
    """
    try:
        alerts = Alert.objects.all().select_related('program', 'activity', 'resolved_by')
        
        if program_id:
            alerts = alerts.filter(program_id=program_id)
        
        if status:
            alerts = alerts.filter(status=status)
        
        return [
            {
                "id": str(alert.id),
                "program": {
                    "id": str(alert.program.id),
                    "name": alert.program.name,
                },
                "activity": {
                    "id": str(alert.activity.id),
                    "name": alert.activity.name,
                } if alert.activity else None,
                "alert_type": alert.alert_type,
                "description": alert.description,
                "status": alert.status,
                "action_taken": alert.action_taken,
                "created_at": alert.created_at.isoformat(),
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
            }
            for alert in alerts
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading alerts: {str(e)}")


@router.post("/alerts", status_code=201)
def create_alert(
    program_id: str,
    alert_type: str,
    description: str,
    activity_id: Optional[int] = None,
) -> dict:
    """
    Crea una nueva alerta
    """
    import uuid
    try:
        program = Program.objects.get(id=uuid.UUID(program_id))
        
        alert_data = {
            "program": program,
            "alert_type": alert_type,
            "description": description,
        }
        
        if activity_id:
            activity = Activity.objects.get(id=activity_id)
            alert_data["activity"] = activity
        
        alert = Alert.objects.create(**alert_data)
        
        return {
            "id": str(alert.id),
            "message": "Alert created successfully"
        }
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Program not found")
    except Activity.DoesNotExist:
        raise HTTPException(status_code=404, detail="Activity not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")


@router.patch("/alerts/{alert_id}")
def update_alert_status(
    alert_id: int,
    status: str,
    action_taken: Optional[str] = None,
) -> dict:
    """
    Actualiza el estado de una alerta
    """
    try:
        alert = Alert.objects.get(id=alert_id)
        alert.status = status
        
        if action_taken:
            alert.action_taken = action_taken
        
        if status == "resolved":
            from django.utils import timezone
            alert.resolved_at = timezone.now()
        
        alert.save()
        
        return {
            "id": str(alert.id),
            "status": alert.status,
            "message": "Alert updated successfully"
        }
    except Alert.DoesNotExist:
        raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating alert: {str(e)}")


@router.delete("/clear-all-data")
def clear_all_data():
    """
    ⚠️ DANGER ZONE ⚠️
    Elimina TODOS los datos de la base de datos.
    Útil para desarrollo y testing.
    """
    try:
        from companies.models import Company, User
        from programs.models import (
            Program, Participant, Match, Activity,
            Sentiment, Notification, Goal, KeyResult, GoalUpdate,
            Alert
        )
        from invitations.models import PendingInvitation
        from django.contrib.sessions.models import Session as DjangoSession
        from django.contrib.admin.models import LogEntry
        
        # Eliminar todos los datos en orden para evitar problemas de foreign keys
        deleted_counts = {}
        
        # Django admin logs
        try:
            deleted_counts['LogEntry'] = LogEntry.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['LogEntry'] = f"Error: {str(e)}"
        
        # Django sessions
        try:
            deleted_counts['DjangoSession'] = DjangoSession.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['DjangoSession'] = f"Error: {str(e)}"
        
        # Invitaciones pendientes (contiene emails!)
        try:
            deleted_counts['PendingInvitation'] = PendingInvitation.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['PendingInvitation'] = f"Error: {str(e)}"
        
        # Relaciones dependientes primero
        try:
            deleted_counts['GoalUpdate'] = GoalUpdate.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['GoalUpdate'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['KeyResult'] = KeyResult.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['KeyResult'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Goal'] = Goal.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Goal'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Sentiment'] = Sentiment.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Sentiment'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Notification'] = Notification.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Notification'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Alert'] = Alert.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Alert'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Match'] = Match.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Match'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Activity'] = Activity.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Activity'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Participant'] = Participant.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Participant'] = f"Error: {str(e)}"
        
        try:
            deleted_counts['Program'] = Program.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Program'] = f"Error: {str(e)}"
        
        # Usuarios custom
        try:
            deleted_counts['CompanyUser'] = User.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['CompanyUser'] = f"Error: {str(e)}"
        
        # Empresas
        try:
            deleted_counts['Company'] = Company.objects.all().delete()[0]
        except Exception as e:
            deleted_counts['Company'] = f"Error: {str(e)}"
        
        # Contar solo los números (no errores)
        total = sum(v for v in deleted_counts.values() if isinstance(v, int))
        
        return {
            "message": "✅ Proceso de eliminación completado",
            "deleted": deleted_counts,
            "total": total,
            "status": "success"
        }
    except Exception as e:
        import traceback
        error_detail = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "type": type(e).__name__
        }
        raise HTTPException(status_code=500, detail=error_detail)


# ============================================
# USER MANAGEMENT ENDPOINTS
# ============================================

@router.get("/users", response_model=List[UserOut])
def list_users():
    """Lista todos los usuarios del sistema con sus permisos"""
    from companies.models import User
    
    # Obtener todos los usuarios
    users = User.objects.all().order_by('-date_joined')
    
    result = []
    for user in users:
        result.append({
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "nombre": user.first_name or user.full_name.split(' ')[0] if user.full_name else user.first_name,
            "apellidos": user.last_name or (' '.join(user.full_name.split(' ')[1:]) if user.full_name else user.last_name),
            "telefono": getattr(user, 'phone', '') or '',
            "role": user.role,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "company": user.company.name if user.company else None,
            "is_onboarded": user.is_onboarded,
            "can_manage_clients": user.can_manage_clients,
            "can_manage_programs": user.can_manage_programs,
            "can_manage_users": user.can_manage_users,
            "can_manage_activities": user.can_manage_activities,
            "can_execute_matches": user.can_execute_matches,
            "can_view_reports": user.can_view_reports,
            "can_close_programs": user.can_close_programs,
        })
    
    return result


@router.post("/users", response_model=UserOut)
def create_user(user_data: UserIn):
    """Crea un nuevo usuario en el sistema"""
    from companies.models import User
    
    # Verificar si el usuario ya existe
    if User.objects.filter(username=user_data.username).exists():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    
    if User.objects.filter(email=user_data.email).exists():
        raise HTTPException(status_code=400, detail="El email ya existe")
    
    try:
        # Determinar permisos según rol
        role_permissions = {
            "admin_root": {
                "is_staff": True,
                "is_superuser": True,
                "can_manage_clients": True,
                "can_manage_programs": True,
                "can_manage_users": True,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": True,
            },
            "superadmin": {
                "is_staff": True,
                "is_superuser": True,
                "can_manage_clients": True,
                "can_manage_programs": True,
                "can_manage_users": True,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": True,
            },
            "inspiratoria_admin": {
                "is_staff": True,
                "is_superuser": False,
                "can_manage_clients": True,
                "can_manage_programs": True,
                "can_manage_users": True,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": False,
            },
            "admin": {
                "is_staff": True,
                "is_superuser": False,
                "can_manage_clients": False,
                "can_manage_programs": True,
                "can_manage_users": False,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": False,
            },
            "coordinator": {
                "is_staff": False,
                "is_superuser": False,
                "can_manage_clients": False,
                "can_manage_programs": False,
                "can_manage_users": False,
                "can_manage_activities": True,
                "can_execute_matches": False,
                "can_view_reports": True,
                "can_close_programs": False,
            }
        }
        
        permissions = role_permissions.get(user_data.role, {
            "is_staff": False,
            "is_superuser": False,
            "can_manage_clients": False,
            "can_manage_programs": False,
            "can_manage_users": False,
            "can_manage_activities": False,
            "can_execute_matches": False,
            "can_view_reports": False,
            "can_close_programs": False,
        })
        
        # Crear el usuario con el modelo companies.User
        user = User.objects.create_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.nombre,
            last_name=user_data.apellidos,
            full_name=f"{user_data.nombre} {user_data.apellidos}",
            role=user_data.role,
            is_staff=permissions["is_staff"],
            is_superuser=permissions["is_superuser"],
            can_manage_clients=permissions["can_manage_clients"],
            can_manage_programs=permissions["can_manage_programs"],
            can_manage_users=permissions["can_manage_users"],
            can_manage_activities=permissions["can_manage_activities"],
            can_execute_matches=permissions["can_execute_matches"],
            can_view_reports=permissions["can_view_reports"],
            can_close_programs=permissions["can_close_programs"],
        )
        
        return {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "nombre": user.first_name,
            "apellidos": user.last_name,
            "telefono": getattr(user, 'phone', '') or '',
            "role": user.role,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "company": user.company.name if user.company else None,
            "is_onboarded": user.is_onboarded,
            "can_manage_clients": user.can_manage_clients,
            "can_manage_programs": user.can_manage_programs,
            "can_manage_users": user.can_manage_users,
            "can_manage_activities": user.can_manage_activities,
            "can_execute_matches": user.can_execute_matches,
            "can_view_reports": user.can_view_reports,
            "can_close_programs": user.can_close_programs,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {str(e)}")


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: str, user_data: UserUpdateIn):
    """Actualiza un usuario existente"""
    from companies.models import User
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Actualizar campos básicos
    if user_data.nombre is not None:
        user.first_name = user_data.nombre
    if user_data.apellidos is not None:
        user.last_name = user_data.apellidos
    if user_data.telefono is not None:
        user.phone = user_data.telefono
    if user_data.email is not None:
        # Verificar que el email no esté en uso por otro usuario
        if User.objects.filter(email=user_data.email).exclude(id=user_id).exists():
            raise HTTPException(status_code=400, detail="El email ya está en uso")
        user.email = user_data.email
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    # Actualizar rol si se proporciona
    if user_data.role is not None:
        user.role = user_data.role
        
        # Actualizar permisos según el rol
        role_permissions = {
            "admin_root": {
                "is_staff": True,
                "is_superuser": True,
                "can_manage_clients": True,
                "can_manage_programs": True,
                "can_manage_users": True,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": True,
            },
            "superadmin": {
                "is_staff": True,
                "is_superuser": True,
                "can_manage_clients": True,
                "can_manage_programs": True,
                "can_manage_users": True,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": True,
            },
            "inspiratoria_admin": {
                "is_staff": True,
                "is_superuser": False,
                "can_manage_clients": True,
                "can_manage_programs": True,
                "can_manage_users": True,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": False,
            },
            "admin": {
                "is_staff": True,
                "is_superuser": False,
                "can_manage_clients": False,
                "can_manage_programs": True,
                "can_manage_users": False,
                "can_manage_activities": True,
                "can_execute_matches": True,
                "can_view_reports": True,
                "can_close_programs": False,
            },
            "coordinator": {
                "is_staff": False,
                "is_superuser": False,
                "can_manage_clients": False,
                "can_manage_programs": False,
                "can_manage_users": False,
                "can_manage_activities": True,
                "can_execute_matches": False,
                "can_view_reports": True,
                "can_close_programs": False,
            }
        }
        
        permissions = role_permissions.get(user_data.role, {})
        
        if permissions:
            user.is_staff = permissions["is_staff"]
            user.is_superuser = permissions["is_superuser"]
            user.can_manage_clients = permissions["can_manage_clients"]
            user.can_manage_programs = permissions["can_manage_programs"]
            user.can_manage_users = permissions["can_manage_users"]
            user.can_manage_activities = permissions["can_manage_activities"]
            user.can_execute_matches = permissions["can_execute_matches"]
            user.can_view_reports = permissions["can_view_reports"]
            user.can_close_programs = permissions["can_close_programs"]
    
    # Actualizar full_name
    user.full_name = f"{user.first_name} {user.last_name}"
    user.save()
    
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "nombre": user.first_name,
        "apellidos": user.last_name,
        "telefono": getattr(user, 'phone', '') or '',
        "role": user.role,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "company": user.company.name if user.company else None,
        "is_onboarded": user.is_onboarded,
        "can_manage_clients": user.can_manage_clients,
        "can_manage_programs": user.can_manage_programs,
        "can_manage_users": user.can_manage_users,
        "can_manage_activities": user.can_manage_activities,
        "can_execute_matches": user.can_execute_matches,
        "can_view_reports": user.can_view_reports,
        "can_close_programs": user.can_close_programs,
    }


@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    """Elimina un usuario del sistema"""
    from companies.models import User
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir eliminar el último superusuario
    if user.is_superuser and User.objects.filter(is_superuser=True).count() == 1:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar el último superusuario del sistema"
        )
    
    username = user.username
    user.delete()
    
    return {"message": f"Usuario {username} eliminado exitosamente"}


# Import invitation router
from invitations.views import router as invitations_router

api_app = FastAPI(title="Mentoring Platform API", version="0.1.0")

from starlette.middleware.cors import CORSMiddleware
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers (Starlette already mounts this app at /api)
api_app.include_router(router)
api_app.include_router(invitations_router)
