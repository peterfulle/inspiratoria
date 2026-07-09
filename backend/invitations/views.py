"""
Endpoints FastAPI para el sistema de invitaciones y onboarding.
Incluye OAuth LinkedIn + Gemini AI processing.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
from datetime import datetime
import secrets
from asgiref.sync import sync_to_async

from .models import PendingInvitation, OnboardingProgress
from .linkedin_service import linkedin_service
from .ai_service import neuralmorphic_service
from companies.models import User, Company
from programs.models import Program, Participant


# Router
router = APIRouter(prefix="/invitations", tags=["invitations"])


# ============================================================================
# SCHEMAS (Pydantic Models)
# ============================================================================

class InviteParticipantRequest(BaseModel):
    """Request para invitar a un nuevo participante"""
    email: EmailStr
    role: str  # 'mentor' o 'mentee'
    program_id: int
    personal_message: Optional[str] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['mentor', 'mentee']:
            raise ValueError('Rol debe ser "mentor" o "mentee"')
        return v


class InviteParticipantResponse(BaseModel):
    """Response al crear una invitación"""
    success: bool
    invitation_id: int
    token: str
    expires_at: datetime
    message: str


class ValidateInvitationRequest(BaseModel):
    """Request para validar un token de invitación"""
    token: str


class ValidateInvitationResponse(BaseModel):
    """Response de validación de invitación"""
    valid: bool
    email: str
    role: str
    company_name: str
    program_name: str
    personal_message: Optional[str]
    expires_at: datetime


class CreateAccountRequest(BaseModel):
    """Request para crear cuenta en paso 2 del onboarding"""
    token: str
    password: str
    confirm_password: str
    full_name: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Las contraseñas no coinciden')
        return v


class LinkedInAuthRequest(BaseModel):
    """Request con código de LinkedIn OAuth"""
    token: str  # Token de invitación
    code: str   # Código de LinkedIn OAuth


class LinkedInAuthResponse(BaseModel):
    """Response con datos extraídos de LinkedIn"""
    success: bool
    profile_data: Dict[str, Any]
    ai_suggestions: Dict[str, Any]


class CompleteOnboardingRequest(BaseModel):
    """Request final para completar onboarding"""
    token: str
    profile_data: Dict[str, Any]
    preferences: Dict[str, Any]


class CompleteOnboardingResponse(BaseModel):
    """Response al completar onboarding"""
    success: bool
    user_id: int
    participant_id: int
    message: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

@sync_to_async
def get_invitation_by_token(token: str) -> PendingInvitation:
    """Obtiene invitación por token y valida que sea válida"""
    try:
        invitation = PendingInvitation.objects.select_related('company', 'program', 'invited_by').get(token=token)
        if not invitation.is_valid():
            raise HTTPException(
                status_code=400,
                detail="La invitación ha expirado o ya fue utilizada"
            )
        return invitation
    except PendingInvitation.DoesNotExist:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")


@sync_to_async
def check_user_exists(email: str) -> bool:
    """Verifica si existe un usuario con el email dado"""
    return User.objects.filter(email=email).exists()


@sync_to_async
def create_user_account(email: str, password: str, full_name: str, company, role: str):
    """Crea una cuenta de usuario"""
    return User.objects.create_user(
        email=email,
        password=password,
        full_name=full_name,
        company=company,
        role=role
    )


@sync_to_async
def get_or_create_progress(invitation, defaults=None):
    """Obtiene o crea el progreso de onboarding"""
    return OnboardingProgress.objects.get_or_create(
        invitation=invitation,
        defaults=defaults or {}
    )


@sync_to_async
def update_progress(progress):
    """Actualiza el progreso de onboarding"""
    progress.save()
    return progress


@sync_to_async
def get_progress_by_invitation(invitation):
    """Obtiene el progreso por invitación"""
    return OnboardingProgress.objects.get(invitation=invitation)


@sync_to_async
def get_program_by_id(program_id: int):
    """Obtiene un programa por ID"""
    return Program.objects.get(id=program_id)


@sync_to_async
def get_company_by_id(company_id: int):
    """Obtiene una empresa por ID"""
    return Company.objects.get(id=company_id)


@sync_to_async
def get_user_by_id(user_id: int):
    """Obtiene un usuario por ID"""
    return User.objects.get(id=user_id)


@sync_to_async
def check_pending_invitation_exists(email: str, status: str):
    """Verifica si existe una invitación pendiente"""
    return PendingInvitation.objects.filter(email=email, status=status).exists()


@sync_to_async
def get_existing_invitation(email: str, status: str, program):
    """Obtiene invitación existente si hay una"""
    return PendingInvitation.objects.filter(
        email=email,
        status=status,
        program=program
    ).first()


@sync_to_async
def create_pending_invitation(email: str, role: str, company, program, invited_by, personal_message: str = ""):
    """Crea una nueva invitación pendiente"""
    return PendingInvitation.objects.create(
        email=email,
        role=role,
        company=company,
        program=program,
        invited_by=invited_by,
        personal_message=personal_message
    )


@sync_to_async
def create_participant(user, role: str, company, profile_data: dict):
    """Crea un participante"""
    return Participant.objects.create(
        user=user,
        role=role,
        company=company,
        **profile_data
    )


@sync_to_async
def mark_invitation_accepted(invitation):
    """Marca una invitación como aceptada"""
    invitation.mark_as_accepted()
    return invitation


@sync_to_async
def advance_progress_step(progress, step):
    """Avanza el progreso a un paso específico"""
    progress.advance_step(step)
    return progress


def send_invitation_email(invitation: PendingInvitation):
    """Envía email de invitación (mock por ahora)"""
    # TODO: Implementar envío real de email
    onboarding_url = f"http://localhost:3000/onboarding?token={invitation.token}"
    print(f"""
    ========================================
    INVITACIÓN ENVIADA
    ========================================
    Para: {invitation.email}
    Rol: {invitation.role}
    Programa: {invitation.program.name}
    Link: {onboarding_url}
    Expira: {invitation.expires_at}
    ========================================
    """)


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/invite", response_model=InviteParticipantResponse)
async def invite_participant(
    request: InviteParticipantRequest,
    background_tasks: BackgroundTasks,
    # TODO: Add authentication dependency
    # current_user: User = Depends(get_current_user)
):
    """
    Crea una invitación para un nuevo participante.
    El admin usa este endpoint para invitar mentores/mentees.
    """
    
    # NOTA: este endpoint está roto independientemente de la autenticación —
    # get_program_by_id/get_company_by_id/get_user_by_id hacen `.objects.get(id=<int>)`
    # contra modelos cuyo PK real es UUID (companies.Company, companies.User) o
    # contra un `Program`/`Participant` legacy con esquema propio, incompatible
    # con el `Program` (UUID) que usa el resto de la app. `company_id = 1` /
    # `invited_by_id = 1` nunca matchean un UUID real → esto tira excepción en
    # cualquier llamada real. No lo reescribí a fondo (es un arreglo de
    # feature, no de seguridad) pero tampoco tiene sentido "asegurar" código
    # que no ejecuta — dejar documentado para una reparación aparte.
    try:
        # Validar que el programa existe
        program = await get_program_by_id(request.program_id)

        # TODO: Validar que el usuario actual tiene permisos
        # TODO: Obtener company_id del usuario actual
        company_id = 1  # Hardcoded por ahora (SQM)
        invited_by_id = 1  # Hardcoded por ahora

        company = await get_company_by_id(company_id)
        invited_by = await get_user_by_id(invited_by_id)
        
        # Verificar si ya existe una invitación pendiente para este email
        existing = await get_existing_invitation(request.email, 'pending', program)
        
        if existing and existing.is_valid():
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una invitación pendiente para {request.email}"
            )
        
        # Crear invitación
        invitation = await create_pending_invitation(
            email=request.email,
            role=request.role,
            company=company,
            program=program,
            invited_by=invited_by,
            personal_message=request.personal_message
        )
        
        # Enviar email en background
        background_tasks.add_task(send_invitation_email, invitation)
        
        return InviteParticipantResponse(
            success=True,
            invitation_id=invitation.id,
            token=invitation.token,
            expires_at=invitation.expires_at,
            message=f"Invitación enviada a {request.email}"
        )
        
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate", response_model=ValidateInvitationResponse)
async def validate_invitation(request: ValidateInvitationRequest):
    """
    Valida un token de invitación.
    Primer paso del onboarding: validar que el link es válido.
    """
    try:
        invitation = await get_invitation_by_token(request.token)
        
        return ValidateInvitationResponse(
            valid=True,
            email=invitation.email,
            role=invitation.role,
            company_name=invitation.company.name,
            program_name=invitation.program.name,
            personal_message=invitation.personal_message or "",
            expires_at=invitation.expires_at
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/create-account")
async def create_account(request: CreateAccountRequest):
    """
    Crea la cuenta de usuario (paso 2 del onboarding).
    Crea el User pero aún no el Participant.
    """
    
    invitation = await get_invitation_by_token(request.token)
    
    # Verificar que el email coincide
    # (En caso de que el usuario cambie el email en el form)
    if request.full_name:
        # TODO: Actualizar email si es necesario
        pass
    
    # Verificar que no existe un usuario con este email
    if await check_user_exists(invitation.email):
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario con este email"
        )
    
    # Crear usuario
    user = await create_user_account(
        email=invitation.email,
        password=request.password,
        full_name=request.full_name,
        company=invitation.company,
        role=invitation.role  # mentor/mentee
    )
    
    # Crear o actualizar progreso de onboarding
    progress, created = await get_or_create_progress(
        invitation=invitation,
        defaults={'current_step': 'linkedin'}
    )
    progress.custom_data['user_id'] = user.id
    progress.current_step = 'linkedin'
    await update_progress(progress)
    
    return {
        "success": True,
        "message": "Cuenta creada exitosamente",
        "user_id": user.id,
        "next_step": "linkedin"
    }


@router.get("/linkedin/auth-url")
async def get_linkedin_auth_url(token: str):
    """
    Genera URL de autorización de LinkedIn.
    El frontend redirige al usuario a esta URL.
    """
    
    # Validar invitación
    invitation = await get_invitation_by_token(token)
    
    # Usar el token de invitación como state para seguridad
    auth_url = linkedin_service.get_authorization_url(state=token)
    
    return {
        "auth_url": auth_url,
        "state": token
    }


@router.post("/linkedin/callback", response_model=LinkedInAuthResponse)
async def linkedin_callback(request: LinkedInAuthRequest):
    """
    Callback de LinkedIn OAuth.
    Recibe el código, obtiene access token, obtiene perfil,
    y usa Gemini para extraer datos estructurados.
    """
    
    invitation = await get_invitation_by_token(request.token)
    
    # Intercambiar código por access token
    access_token = linkedin_service.exchange_code_for_token(request.code)
    if not access_token:
        raise HTTPException(
            status_code=400,
            detail="Error al obtener token de LinkedIn"
        )
    
    # Obtener datos del perfil
    linkedin_data = linkedin_service.get_profile_data(access_token)
    if not linkedin_data:
        raise HTTPException(
            status_code=400,
            detail="Error al obtener perfil de LinkedIn"
        )
    
    # Usar Gemini para extraer y estructurar datos
    extracted_profile = neuralmorphic_service.extract_profile_from_linkedin(
        linkedin_data=linkedin_data,
        role=invitation.role
    )
    
    # Generar sugerencias adicionales con IA
    ai_suggestions = {}
    if invitation.role == 'mentee':
        ai_suggestions['suggested_goals'] = neuralmorphic_service.suggest_goals_for_mentee(
            extracted_profile
        )
    
    # Guardar en progreso de onboarding
    progress = await get_progress_by_invitation(invitation)
    progress.linkedin_data = linkedin_data
    progress.extracted_profile = extracted_profile
    progress.current_step = 'profile'
    await update_progress(progress)
    
    return LinkedInAuthResponse(
        success=True,
        profile_data=extracted_profile,
        ai_suggestions=ai_suggestions
    )


@router.post("/skip-linkedin")
async def skip_linkedin(token: str):
    """
    Permite omitir la importación de LinkedIn.
    El usuario completará su perfil manualmente.
    """
    
    invitation = await get_invitation_by_token(token)
    
    # Actualizar progreso
    progress = await get_progress_by_invitation(invitation)
    progress.current_step = 'profile'
    await update_progress(progress)
    
    return {
        "success": True,
        "message": "LinkedIn omitido",
        "next_step": "profile"
    }


@router.post("/complete", response_model=CompleteOnboardingResponse)
async def complete_onboarding(request: CompleteOnboardingRequest):
    """
    Completa el proceso de onboarding.
    Crea el Participant con todos los datos finales.
    """
    
    invitation = await get_invitation_by_token(request.token)
    progress = await get_progress_by_invitation(invitation)
    
    # Obtener el usuario creado en paso 2
    user_id = progress.custom_data.get('user_id')
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Usuario no encontrado. Debes completar el paso de crear cuenta primero."
        )
    
    user = await get_user_by_id(user_id)
    
    # Crear Participant con todos los datos
    participant = await create_participant(
        user=user,
        role=invitation.role,
        company=invitation.company,
        profile_data={
            'program': invitation.program,
            'full_name': request.profile_data.get('full_name', user.full_name),
            'headline': request.profile_data.get('headline', ''),
            'bio': request.profile_data.get('bio', ''),
            'skills': request.profile_data.get('skills', []),
            'goals': request.profile_data.get('goals', []),
            'availability_hours': request.profile_data.get('availability_hours', 4),
            **request.preferences
        }
    )
    
    # Marcar invitación como aceptada
    await mark_invitation_accepted(invitation)
    
    # Marcar onboarding como completado
    await advance_progress_step(progress, 'completed')
    
    return CompleteOnboardingResponse(
        success=True,
        user_id=user.id,
        participant_id=participant.id,
        message="¡Onboarding completado exitosamente! Bienvenido/a."
    )


@router.get("/progress/{token}")
async def get_onboarding_progress(token: str):
    """
    Obtiene el progreso actual del onboarding.
    Útil para permitir que el usuario continue donde lo dejó.
    """
    
    invitation = await get_invitation_by_token(token)
    
    try:
        progress = await get_progress_by_invitation(invitation)
        
        return {
            "current_step": progress.current_step,
            "has_linkedin_data": bool(progress.linkedin_data),
            "extracted_profile": progress.extracted_profile,
            "custom_data": progress.custom_data
        }
    except OnboardingProgress.DoesNotExist:
        return {
            "current_step": "validation",
            "has_linkedin_data": False,
            "extracted_profile": None,
            "custom_data": {}
        }
