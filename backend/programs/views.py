from fastapi import APIRouter, HTTPException, status, UploadFile, File, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
import uuid
from datetime import datetime
from asgiref.sync import sync_to_async
import pandas as pd
import io
import json

from companies.models import User
from .models import Program, ProgramParticipant, Vinculation, AuditLog

router = APIRouter(prefix="/programs", tags=["Programs"])


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


class ParticipantCreateRequest(BaseModel):
    user_id: str
    role: str = Field(..., pattern="^(administrator|instructor|participant|observer)$")
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
    role: Optional[str] = Field(None, pattern="^(administrator|instructor|participant|observer)$")
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
        
        # Verificar si ya existe
        if ProgramParticipant.objects.filter(
            program=program,
            user=user,
            deleted_at__isnull=True
        ).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya es participante de este programa"
            )
        
        # Crear participante
        participant = ProgramParticipant.objects.create(
            program=program,
            user=user,
            role=payload.role,
            status=payload.status,
            invitation_sent_at=datetime.now() if payload.send_invitation else None
        )
        
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
        
        # TODO: Enviar invitación por email si send_invitation=True
        
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
            participant.role = payload.role
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
        
        participant.is_deleted = True
        participant.status = 'deleted'
        participant.save()
    
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
            "first_name": u.first_name,
            "last_name": u.last_name,
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
        
        # Verificar si el email ya existe
        if User.objects.filter(email=request.email).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un usuario con este email"
            )
        
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
            username=username,  # Username único generado
            first_name=request.first_name,
            last_name=request.last_name,
            company=company,
            role='participant',  # Rol por defecto
            is_onboarded=False,
        )
        
        return {
            "id": str(user.id),
            "email": user.email,
            "nombre": user.first_name,  # Mapear a 'nombre'
            "apellidos": user.last_name,  # Mapear a 'apellidos'
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
        'role': ['participant'],  # administrator, instructor, participant, observer
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
            role = str(row.get('role', '')).strip().lower()
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
            valid_roles = ['administrator', 'instructor', 'participant', 'observer']
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
                        'role': 'participant',
                        'is_onboarded': False,
                    }
                )
                
                # Crear participante
                participant, part_created = ProgramParticipant.objects.get_or_create(
                    program=program,
                    user=user,
                    defaults={
                        'role': row_data['role'],
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
                    
                    # TODO: Enviar invitación si send_invitations=True
                
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

@router.get("/{program_id}/vinculations", response_model=List[VinculationResponse])
async def list_vinculations(program_id: str):
    """
    Listar todas las vinculaciones del programa
    """
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
            deleted_at__isnull=True
        ).select_related('mentor__user', 'mentee__user')
        
        result = []
        for v in vinculations:
            result.append({
                "id": str(v.id),
                "mentor": {
                    "id": str(v.mentor.user.id),
                    "email": v.mentor.user.email,
                    "first_name": v.mentor.user.first_name,
                    "last_name": v.mentor.user.last_name,
                    "role": v.mentor.user.role,
                    "company": v.mentor.user.company.name if v.mentor.user.company else None,
                    "is_onboarded": v.mentor.user.is_onboarded,
                },
                "mentee": {
                    "id": str(v.mentee.user.id),
                    "email": v.mentee.user.email,
                    "first_name": v.mentee.user.first_name,
                    "last_name": v.mentee.user.last_name,
                    "role": v.mentee.user.role,
                    "company": v.mentee.user.company.name if v.mentee.user.company else None,
                    "is_onboarded": v.mentee.user.is_onboarded,
                },
                "vinculation_type": v.vinculation_type,
                "status": v.status,
                "start_date": v.start_date,
                "end_date": v.end_date,
                "metadata": v.metadata or {},
            })
        
        return result
    
    vinculations = await sync_to_async(get_vinculations)()
    return vinculations


@router.post("/{program_id}/vinculations", response_model=VinculationResponse, status_code=status.HTTP_201_CREATED)
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
        
        # Verificar que no exista ya una vinculación activa
        if Vinculation.objects.filter(
            program=program,
            mentor=mentor,
            mentee=mentee,
            status='active',
            deleted_at__isnull=True
        ).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una vinculación activa entre estos participantes"
            )
        
        # Crear vinculación
        vinculation = Vinculation.objects.create(
            program=program,
            mentor=mentor,
            mentee=mentee,
            vinculation_type=payload.vinculation_type,
            status='active',
            start_date=datetime.now(),
            metadata=payload.metadata or {}
        )
        
        return {
            "id": str(vinculation.id),
            "mentor": {
                "id": str(mentor.user.id),
                "email": mentor.user.email,
                "first_name": mentor.user.first_name,
                "last_name": mentor.user.last_name,
                "role": mentor.user.role,
                "company": mentor.user.company.name if mentor.user.company else None,
                "is_onboarded": mentor.user.is_onboarded,
            },
            "mentee": {
                "id": str(mentee.user.id),
                "email": mentee.user.email,
                "first_name": mentee.user.first_name,
                "last_name": mentee.user.last_name,
                "role": mentee.user.role,
                "company": mentee.user.company.name if mentee.user.company else None,
                "is_onboarded": mentee.user.is_onboarded,
            },
            "vinculation_type": vinculation.vinculation_type,
            "status": vinculation.status,
            "start_date": vinculation.start_date,
            "end_date": vinculation.end_date,
            "metadata": vinculation.metadata or {},
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
                deleted_at__isnull=True
            )
        except (Program.DoesNotExist, Vinculation.DoesNotExist):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vinculación no encontrada"
            )
        
        vinculation.is_deleted = True
        vinculation.status = 'inactive'
        vinculation.end_date = datetime.now()
        vinculation.save()
    
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
