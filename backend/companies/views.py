from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
from asgiref.sync import sync_to_async

from .schemas import (
    CompanyCreateRequest,
    CompanyUpdateRequest,
    CompanyResponse,
    SuperAdminCreateRequest,
    UserResponse,
    OnboardingStep3Request,
    OnboardingCompleteResponse,
    InviteUserRequest,
    InvitationResponse,
    AcceptInvitationRequest,
    LoginRequest,
    LoginResponse,
    UserCreateRequest,
    UserUpdateRequest,
    UserListResponse,
    InspiratoriaAdminCreateRequest,
    RegisterCompanyRequest,
    RegisterStudioRequest,
    StudioRegistrationResponse,
    CreateStudioAccountRequest,
    StudioAccountResponse,
    AssignProgramRequest,
)
from .services import OnboardingService, AuthService
from .models import Company, User, OnboardingInvitation

router = APIRouter(prefix="/companies", tags=["Companies & Onboarding"])


# ============ ONBOARDING ENDPOINTS ============

@router.post("/onboarding/step1", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company_step1(payload: CompanyCreateRequest):
    """
    Step 1: Crear empresa
    """
    try:
        company = await sync_to_async(OnboardingService.create_company_step1)(
            name=payload.name,
            industry=payload.industry,
            company_size=payload.company_size,
            website=payload.website,
        )
        return CompanyResponse.model_validate(company)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/onboarding/step2/{company_id}", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_super_admin_step2(company_id: uuid.UUID, payload: SuperAdminCreateRequest):
    """
    Step 2: Crear super admin de la empresa
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    
    try:
        user = await sync_to_async(OnboardingService.create_super_admin_step2)(
            company=company,
            username=payload.username,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
            position=payload.position,
        )
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/onboarding/step3/{company_id}/{user_id}", response_model=OnboardingCompleteResponse)
async def complete_onboarding_step3(
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: OnboardingStep3Request
):
    """
    Step 3: Completar onboarding con configuración inicial
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (Company.DoesNotExist, User.DoesNotExist):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa o usuario no encontrado"
        )
    
    company, program = await sync_to_async(OnboardingService.complete_onboarding_step3)(
        company=company,
        user=user,
        primary_color=payload.primary_color,
        secondary_color=payload.secondary_color,
        initial_program_name=payload.initial_program_name,
        initial_program_description=payload.initial_program_description,
    )
    
    token = await sync_to_async(AuthService.generate_session_token)(user)
    
    next_steps = [
        "✅ Empresa creada exitosamente",
        "✅ Administrador configurado",
        "📊 Comienza invitando a tu equipo",
        "🎯 Crea tu primer programa de mentoring",
        "🤝 Agrega participantes (mentores y mentees)",
    ]
    
    return OnboardingCompleteResponse(
        company=CompanyResponse.model_validate(company),
        user=UserResponse.model_validate(user),
        token=token,
        next_steps=next_steps,
        message=f"¡Bienvenido a Inspiratoria, {user.full_name}! Tu empresa está lista."
    )


# ============ AUTHENTICATION ENDPOINTS ============

@router.post("/auth/register-company", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register_company(payload: RegisterCompanyRequest):
    """
    Registro de empresa + admin en un solo paso (Core self-registration)
    """
    try:
        company, user = await sync_to_async(OnboardingService.register_company)(
            account_type=payload.account_type,
            plan_tier=payload.plan_tier,
            company_name=payload.company_name,
            company_industry=payload.company_industry,
            company_size=payload.company_size,
            admin_name=payload.admin_name,
            admin_email=payload.admin_email,
            admin_phone=payload.admin_phone,
            password=payload.password,
        )

        token = await sync_to_async(AuthService.generate_session_token)(user)

        return LoginResponse(
            user=UserResponse.model_validate(user),
            company=CompanyResponse.model_validate(company),
            token=token,
            message=f"¡Cuenta creada exitosamente para {company.name}!"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/auth/register-studio", response_model=StudioRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_studio(payload: RegisterStudioRequest):
    """
    Registro de consulta Studio: crea empresa en DB con tipo 'studio'
    """
    try:
        company = await sync_to_async(OnboardingService.register_studio_inquiry)(
            nombre=payload.nombre,
            apellido=payload.apellido,
            cargo=payload.cargo or "",
            empresa=payload.empresa,
            email=payload.email,
            whatsapp=payload.whatsapp or "",
            idea=payload.idea or "",
        )

        return StudioRegistrationResponse(
            company=CompanyResponse.model_validate(company),
            message=f"¡Solicitud Studio registrada para {company.name}!"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/auth/register-inspiratoria-admin", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register_inspiratoria_admin(payload: InspiratoriaAdminCreateRequest):
    """
    Registro de administrador de Inspiratoria (sin empresa asociada)
    """
    try:
        user = await sync_to_async(OnboardingService.create_inspiratoria_admin)(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
            profile=payload.profile,
        )
        
        token = await sync_to_async(AuthService.generate_session_token)(user)
        
        return LoginResponse(
            user=UserResponse.model_validate(user),
            company=None,
            token=token,
            message=f"¡Bienvenido a Inspiratoria, {user.full_name}!"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """
    Login de usuario
    """
    user, error_code = await sync_to_async(AuthService.authenticate)(payload.username, payload.password)
    
    if error_code:
        error_messages = {
            'user_not_found': 'No existe una cuenta registrada con ese usuario o email.',
            'wrong_password': 'La contraseña ingresada es incorrecta.',
            'account_inactive': 'Esta cuenta ha sido desactivada. Contacta al administrador.',
            'server_error': 'Error interno del servidor. Intenta nuevamente.',
        }
        status_codes = {
            'user_not_found': status.HTTP_404_NOT_FOUND,
            'wrong_password': status.HTTP_401_UNAUTHORIZED,
            'account_inactive': status.HTTP_403_FORBIDDEN,
            'server_error': status.HTTP_500_INTERNAL_SERVER_ERROR,
        }
        raise HTTPException(
            status_code=status_codes.get(error_code, status.HTTP_401_UNAUTHORIZED),
            detail={
                'message': error_messages.get(error_code, 'Error de autenticación'),
                'code': error_code,
            }
        )
    
    token = await sync_to_async(AuthService.generate_session_token)(user)
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        company=CompanyResponse.model_validate(user.company) if user.company else None,
        token=token,
        message=f"Bienvenido de vuelta, {user.full_name}"
    )


# ============ USER INVITATION ENDPOINTS ============

@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(payload: InviteUserRequest, user_id: uuid.UUID):
    """
    Invitar nuevo usuario a la empresa
    Requiere: user_id del invitador en query param
    """
    try:
        user = await sync_to_async(User.objects.select_related('company').get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    try:
        invitation = await sync_to_async(OnboardingService.invite_user)(
            company=user.company,
            invited_by=user,
            email=payload.email,
            role=payload.role,
        )
        return InvitationResponse.model_validate(invitation)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/invitations/{company_id}", response_model=List[InvitationResponse])
async def list_invitations(company_id: uuid.UUID):
    """
    Listar invitaciones de una empresa
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    
    invitations = await sync_to_async(list)(
        OnboardingInvitation.objects.filter(company=company).order_by('-created_at')
    )
    return [InvitationResponse.model_validate(inv) for inv in invitations]


@router.post("/invitations/accept", response_model=LoginResponse)
async def accept_invitation(payload: AcceptInvitationRequest):
    """
    Aceptar invitación y crear cuenta
    """
    try:
        user, company = await sync_to_async(OnboardingService.accept_invitation)(
            token=payload.token,
            username=payload.username,
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
            position=payload.position,
        )
        
        token = await sync_to_async(AuthService.generate_session_token)(user)
        
        return LoginResponse(
            user=UserResponse.model_validate(user),
            company=CompanyResponse.model_validate(company),
            token=token,
            message=f"¡Bienvenido a {company.name}, {user.full_name}!"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ COMPANY MANAGEMENT ENDPOINTS ============

@router.get("/stats")
async def get_account_stats():
    """
    Estadísticas generales de cuentas para el dashboard
    """
    try:
        # Active accounts only (not pending)
        active_qs = Company.objects.exclude(status="pending")
        total_active = await sync_to_async(active_qs.count)()
        core_count = await sync_to_async(active_qs.filter(account_type="core").count)()
        studio_count = await sync_to_async(active_qs.filter(account_type="studio").count)()
        # Pending solicitudes
        pending_count = await sync_to_async(Company.objects.filter(status="pending").count)()
        total_users = await sync_to_async(User.objects.count)()
        
        return {
            "total_companies": total_active,
            "core": core_count,
            "studio": studio_count,
            "pending": pending_count,
            "total_users": total_users,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/solicitudes", response_model=List[CompanyResponse])
async def list_solicitudes():
    """
    Listar solicitudes pendientes (status=pending)
    """
    try:
        companies = await sync_to_async(list)(
            Company.objects.filter(status="pending").order_by('-created_at')
        )
        return [CompanyResponse.model_validate(c) for c in companies]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/solicitudes/{company_id}/approve", response_model=CompanyResponse)
async def approve_solicitud(company_id: uuid.UUID):
    """
    Aprobar una solicitud: cambia status de 'pending' a 'active'
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        if company.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta cuenta ya fue procesada"
            )
        
        def approve_sync():
            company.status = "active"
            company.is_enabled = True
            company.save()
            # Log the approval
            author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()
            from .models import AccountChangeLog
            AccountChangeLog.objects.create(
                company=company,
                changed_by=author,
                change_type="account_approved",
                field_changed="status",
                old_value="pending",
                new_value="active",
                description=f"Solicitud aprobada: {company.name}",
            )
        
        await sync_to_async(approve_sync)()
        return CompanyResponse.model_validate(company)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")


@router.delete("/solicitudes/{company_id}")
async def delete_solicitud(company_id: uuid.UUID):
    """
    Eliminar una solicitud pendiente
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        if company.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden eliminar solicitudes pendientes"
            )
        await sync_to_async(company.delete)()
        return {"message": "Solicitud eliminada"}
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")


# ============ STUDIO ACCOUNT CREATION ============

@router.post("/solicitudes/{company_id}/create-account")
async def create_studio_account(company_id: uuid.UUID, payload: CreateStudioAccountRequest):
    """
    Crear cuenta Studio: genera usuario admin, credenciales, hash de acceso.
    Cambia status de pending a active.
    """
    from .models import StudioAccount, AccountChangeLog
    import secrets
    import string
    
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        
        # Verificar que sea pendiente
        if company.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta cuenta ya fue procesada"
            )
        
        def create_account_sync():
            # Generar contraseña aleatoria segura (12 chars)
            alphabet = string.ascii_letters + string.digits + "!@#$%"
            password = ''.join(secrets.choice(alphabet) for _ in range(12))
            
            # Crear usuario admin para la empresa
            admin_user = User.objects.create_user(
                username=payload.admin_email,
                email=payload.admin_email,
                password=password,
                full_name=payload.admin_name,
                role="admin",
                company=company,
                position=payload.admin_position,
                phone=company.contact_phone or "",
                is_onboarded=True,
            )
            
            # Activar la empresa
            company.status = "active"
            company.is_enabled = True
            company.save()
            
            # Crear StudioAccount con hash y credenciales
            studio_account = StudioAccount.objects.create(
                company=company,
                admin_user=admin_user,
                generated_email=payload.admin_email,
                generated_password=password,  # Stored for reference
            )
            
            # Log the change
            author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()
            AccountChangeLog.objects.create(
                company=company,
                changed_by=author,
                change_type="account_created",
                field_changed="status",
                old_value="pending",
                new_value="active",
                description=f"Cuenta Studio creada para {company.name}. Admin: {payload.admin_name} ({payload.admin_email})",
            )
            
            return {
                "studio_account": studio_account,
                "password": password,
                "admin_user": admin_user,
            }
        
        result = await sync_to_async(create_account_sync)()
        sa = result["studio_account"]
        
        return {
            "id": str(sa.id),
            "company_id": str(company.id),
            "company_name": company.name,
            "access_hash": sa.access_hash,
            "generated_email": sa.generated_email,
            "generated_password": result["password"],
            "status": sa.status,
            "valid_from": sa.valid_from.isoformat() if sa.valid_from else None,
            "valid_until": sa.valid_until.isoformat() if sa.valid_until else None,
            "credentials_sent": sa.credentials_sent,
            "admin_user_id": str(result["admin_user"].id),
            "corp_id": company.corp_id,
            "account_type": company.account_type,
            "plan": company.plan,
            "created_at": sa.created_at.isoformat() if sa.created_at else None,
        }
        
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/studio-accounts/{company_id}")
async def get_studio_account(company_id: uuid.UUID):
    """
    Obtener datos de la cuenta Studio de una empresa
    """
    from .models import StudioAccount
    try:
        def get_sync():
            sa = StudioAccount.objects.select_related('company', 'admin_user').get(company_id=company_id)
            return {
                "id": str(sa.id),
                "company_id": str(sa.company.id),
                "company_name": sa.company.name,
                "access_hash": sa.access_hash,
                "generated_email": sa.generated_email,
                "status": sa.status,
                "valid_from": sa.valid_from.isoformat() if sa.valid_from else None,
                "valid_until": sa.valid_until.isoformat() if sa.valid_until else None,
                "credentials_sent": sa.credentials_sent,
                "credentials_sent_at": sa.credentials_sent_at.isoformat() if sa.credentials_sent_at else None,
                "admin_user_id": str(sa.admin_user.id) if sa.admin_user else None,
                "last_login": sa.last_login.isoformat() if sa.last_login else None,
                "login_count": sa.login_count,
                "corp_id": sa.company.corp_id,
                "account_type": sa.company.account_type,
                "plan": sa.company.plan,
                "company_status": sa.company.status,
                "created_at": sa.created_at.isoformat() if sa.created_at else None,
            }
        result = await sync_to_async(get_sync)()
        return result
    except Exception:
        raise HTTPException(status_code=404, detail="Cuenta Studio no encontrada")


# ============ PROGRAM ASSIGNMENT ============

@router.post("/programs/assign")
async def assign_program_to_company(payload: AssignProgramRequest):
    """
    Asignar un programa existente a una empresa.
    Solo si la empresa existe y está activa.
    """
    from programs.models import Program
    
    try:
        def assign_sync():
            company = Company.objects.get(id=payload.company_id)
            if company.status not in ["active", "trial"]:
                raise ValueError("La empresa debe estar activa para asignar programas")
            
            program = Program.objects.get(id=payload.program_id)
            
            # Verificar que no esté ya asignado
            if program.company_id == company.id:
                raise ValueError("Este programa ya está asignado a esta empresa")
            
            # Asignar
            program.company = company
            program.save()
            
            # Log
            author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()
            from .models import AccountChangeLog
            AccountChangeLog.objects.create(
                company=company,
                changed_by=author,
                change_type="info_update",
                field_changed="program_assigned",
                old_value="",
                new_value=program.name,
                description=f"Programa '{program.name}' asignado a {company.name}",
            )
            
            return {
                "message": f"Programa '{program.name}' asignado a '{company.name}'",
                "program_id": str(program.id),
                "program_name": program.name,
                "company_id": str(company.id),
                "company_name": company.name,
            }
        
        result = await sync_to_async(assign_sync)()
        return result
        
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    except Program.DoesNotExist:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/active-companies")
async def list_active_companies():
    """
    Listar empresas activas (para selector de asignación de programas)
    """
    try:
        companies = await sync_to_async(list)(
            Company.objects.filter(status__in=["active", "trial"]).order_by('name')
        )
        return [{"id": str(c.id), "name": c.name, "account_type": c.account_type, "plan": c.plan} for c in companies]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ STUDIO DASHBOARD DATA ============

@router.post("/studio/login")
async def studio_login(payload: LoginRequest):
    """
    Login específico para usuarios Studio.
    Retorna datos del usuario + info de su StudioAccount + hash.
    """
    from .models import StudioAccount
    from django.utils import timezone
    
    try:
        def do_login():
            try:
                user = User.objects.get(email=payload.email)
            except User.DoesNotExist:
                return None, "Credenciales incorrectas"
            
            if not user.check_password(payload.password):
                return None, "Credenciales incorrectas"
            
            if not user.company:
                return None, "Usuario sin empresa asignada"
            
            # Get studio account
            try:
                studio_account = StudioAccount.objects.get(company=user.company)
            except StudioAccount.DoesNotExist:
                return None, "No existe cuenta Studio para esta empresa"
            
            # Update login tracking
            studio_account.last_login = timezone.now()
            studio_account.login_count += 1
            studio_account.save()
            
            user.last_login_at = timezone.now()
            user.save(update_fields=["last_login_at"])
            
            # Generate token
            import secrets
            token = f"{user.id}:{secrets.token_hex(16)}"
            
            return {
                "token": token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "position": user.position,
                    "company_id": str(user.company.id),
                    "company_name": user.company.name,
                },
                "studio": {
                    "id": str(studio_account.id),
                    "access_hash": studio_account.access_hash,
                    "status": studio_account.status,
                    "valid_from": studio_account.valid_from.isoformat() if studio_account.valid_from else None,
                    "valid_until": studio_account.valid_until.isoformat() if studio_account.valid_until else None,
                    "login_count": studio_account.login_count,
                    "corp_id": user.company.corp_id,
                    "plan": user.company.plan,
                    "account_type": user.company.account_type,
                },
            }, None
        
        result, error = await sync_to_async(do_login)()
        
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/studio/dashboard/{access_hash}")
async def studio_dashboard_data(access_hash: str):
    """
    Obtener datos del dashboard Studio por hash de acceso.
    Retorna info de la empresa, cuenta, programas asignados.
    """
    from .models import StudioAccount
    from programs.models import Program
    
    try:
        def get_data():
            sa = StudioAccount.objects.select_related('company', 'admin_user').get(access_hash=access_hash)
            
            if not sa.is_valid:
                return None, "Cuenta Studio inactiva o expirada"
            
            company = sa.company
            programs = list(Program.objects.filter(company=company).order_by('-created_at'))
            
            return {
                "company": {
                    "id": str(company.id),
                    "name": company.name,
                    "corp_id": company.corp_id,
                    "account_type": company.account_type,
                    "plan": company.plan,
                    "status": company.status,
                    "contact_name": company.contact_name,
                    "contact_email": company.contact_email,
                    "contact_phone": company.contact_phone,
                    "max_users": company.max_users,
                    "max_programs": company.max_programs,
                    "max_participants": company.max_participants,
                    "created_at": company.created_at.isoformat(),
                },
                "studio_account": {
                    "id": str(sa.id),
                    "access_hash": sa.access_hash,
                    "status": sa.status,
                    "valid_from": sa.valid_from.isoformat() if sa.valid_from else None,
                    "valid_until": sa.valid_until.isoformat() if sa.valid_until else None,
                    "last_login": sa.last_login.isoformat() if sa.last_login else None,
                    "login_count": sa.login_count,
                },
                "programs": [{
                    "id": str(p.id),
                    "name": p.name,
                    "description": p.description,
                    "status": p.status,
                    "theme": p.theme,
                    "created_at": p.created_at.isoformat(),
                } for p in programs],
                "admin": {
                    "id": str(sa.admin_user.id) if sa.admin_user else None,
                    "full_name": sa.admin_user.full_name if sa.admin_user else None,
                    "email": sa.admin_user.email if sa.admin_user else None,
                    "position": sa.admin_user.position if sa.admin_user else None,
                },
            }, None
        
        result, error = await sync_to_async(get_data)()
        
        if error:
            raise HTTPException(status_code=403, detail=error)
        
        return result
        
    except StudioAccount.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta Studio no encontrada")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ CLIENT MANAGEMENT SYSTEM ============

from .models import AccountNote, AccountChangeLog


class NoteCreateRequest(BaseModel):
    content: str
    note_type: str = "general"
    is_pinned: bool = False


class AssignPMRequest(BaseModel):
    pm_id: Optional[str] = None  # UUID as string, null to unassign


class UpdateContractRequest(BaseModel):
    contract_start: Optional[str] = None
    contract_end: Optional[str] = None
    internal_notes: Optional[str] = None


class UpdateCompanyStatusRequest(BaseModel):
    status: str
    plan: Optional[str] = None


@router.get("/account/{company_id}/detail")
async def get_account_detail(company_id: uuid.UUID):
    """
    Detalle completo de una cuenta/cliente con PM, bitácora, changelog, suscripción
    """
    try:
        company = await sync_to_async(Company.objects.select_related('assigned_pm').get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def build_detail():
        # PM info
        pm_data = None
        if company.assigned_pm:
            pm_data = {
                "id": str(company.assigned_pm.id),
                "full_name": company.assigned_pm.full_name,
                "email": company.assigned_pm.email,
                "role": company.assigned_pm.role,
                "avatar_url": company.assigned_pm.avatar_url or "",
            }

        # Users count
        users_count = company.users.filter(is_active=True).count()

        # Programs count
        programs_count = 0
        try:
            from programs.models import Program
            programs_count = Program.objects.filter(company=company).count()
        except:
            pass

        # Notes count
        notes_count = AccountNote.objects.filter(company=company).count()
        pinned_count = AccountNote.objects.filter(company=company, is_pinned=True).count()

        # Changelog count
        changelog_count = AccountChangeLog.objects.filter(company=company).count()

        # Plan info
        plan_limits = company.get_plan_limits()
        plan_features = company.get_plan_features()

        return {
            "id": str(company.id),
            "name": company.name,
            "slug": company.slug,
            "corp_id": company.corp_id,
            "account_type": company.account_type,
            "status": company.status,
            "plan": company.plan,
            "is_enabled": company.is_enabled,
            "is_data_complete": company.is_data_complete,
            # Contact
            "contact_name": company.contact_name or "",
            "contact_email": company.contact_email or "",
            "contact_phone": company.contact_phone or "",
            "contact_position": company.contact_position or "",
            # Business
            "industry": company.industry or "",
            "company_size": company.company_size or "",
            "website": company.website or "",
            "description": company.description or "",
            "legal_name": company.legal_name or "",
            "rut": company.rut or "",
            "city": company.city or "",
            "region": company.region or "",
            "country": company.country or "",
            # Branding
            "primary_color": company.primary_color,
            "secondary_color": company.secondary_color,
            "logo_url": company.logo_url or "",
            # Contract
            "contract_start": str(company.contract_start) if company.contract_start else None,
            "contract_end": str(company.contract_end) if company.contract_end else None,
            "internal_notes": company.internal_notes or "",
            # PM
            "assigned_pm": pm_data,
            # Stats
            "users_count": users_count,
            "programs_count": programs_count,
            "notes_count": notes_count,
            "pinned_notes_count": pinned_count,
            "changelog_count": changelog_count,
            # Plan
            "plan_limits": plan_limits,
            "plan_features": plan_features,
            "max_users": company.max_users,
            "max_programs": company.max_programs,
            "max_participants": company.max_participants,
            # Timestamps
            "created_at": company.created_at.isoformat(),
            "updated_at": company.updated_at.isoformat(),
        }

    detail = await sync_to_async(build_detail)()
    return detail


@router.get("/account/{company_id}/bitacora")
async def get_bitacora(company_id: uuid.UUID):
    """
    Obtener bitácora completa de un cliente
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def get_notes():
        notes = AccountNote.objects.filter(company=company).select_related('author').order_by('-created_at')
        return [{
            "id": str(n.id),
            "content": n.content,
            "note_type": n.note_type,
            "is_pinned": n.is_pinned,
            "author": {
                "id": str(n.author.id),
                "full_name": n.author.full_name,
                "email": n.author.email,
            } if n.author else None,
            "created_at": n.created_at.isoformat(),
            "updated_at": n.updated_at.isoformat(),
        } for n in notes]

    notes = await sync_to_async(get_notes)()
    return notes


@router.post("/account/{company_id}/bitacora")
async def add_bitacora_note(company_id: uuid.UUID, payload: NoteCreateRequest):
    """
    Agregar nota a la bitácora de un cliente
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def create_note():
        # Use first admin as default author
        author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()
        note = AccountNote.objects.create(
            company=company,
            author=author,
            content=payload.content,
            note_type=payload.note_type,
            is_pinned=payload.is_pinned,
        )
        return {
            "id": str(note.id),
            "content": note.content,
            "note_type": note.note_type,
            "is_pinned": note.is_pinned,
            "author": {
                "id": str(author.id),
                "full_name": author.full_name,
                "email": author.email,
            } if author else None,
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat(),
        }

    note = await sync_to_async(create_note)()
    return note


@router.delete("/account/{company_id}/bitacora/{note_id}")
async def delete_bitacora_note(company_id: uuid.UUID, note_id: uuid.UUID):
    """
    Eliminar nota de la bitácora
    """
    try:
        note = await sync_to_async(AccountNote.objects.get)(id=note_id, company_id=company_id)
        await sync_to_async(note.delete)()
        return {"message": "Nota eliminada"}
    except AccountNote.DoesNotExist:
        raise HTTPException(status_code=404, detail="Nota no encontrada")


@router.patch("/account/{company_id}/bitacora/{note_id}/pin")
async def toggle_pin_note(company_id: uuid.UUID, note_id: uuid.UUID):
    """
    Fijar/desfijar nota en la bitácora
    """
    try:
        note = await sync_to_async(AccountNote.objects.get)(id=note_id, company_id=company_id)
        note.is_pinned = not note.is_pinned
        await sync_to_async(note.save)()
        return {"is_pinned": note.is_pinned}
    except AccountNote.DoesNotExist:
        raise HTTPException(status_code=404, detail="Nota no encontrada")


@router.get("/account/{company_id}/changelog")
async def get_changelog(company_id: uuid.UUID):
    """
    Obtener historial de cambios de un cliente
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def get_changes():
        changes = AccountChangeLog.objects.filter(company=company).select_related('changed_by').order_by('-created_at')
        return [{
            "id": str(c.id),
            "change_type": c.change_type,
            "field_changed": c.field_changed,
            "old_value": c.old_value,
            "new_value": c.new_value,
            "description": c.description,
            "changed_by": {
                "id": str(c.changed_by.id),
                "full_name": c.changed_by.full_name,
            } if c.changed_by else None,
            "created_at": c.created_at.isoformat(),
        } for c in changes]

    changes = await sync_to_async(get_changes)()
    return changes


@router.post("/account/{company_id}/assign-pm")
async def assign_pm(company_id: uuid.UUID, payload: AssignPMRequest):
    """
    Asignar o desasignar PM a una cuenta
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def do_assign():
        old_pm = company.assigned_pm
        old_pm_name = old_pm.full_name if old_pm else "Sin asignar"

        if payload.pm_id:
            try:
                new_pm = User.objects.get(id=payload.pm_id)
            except User.DoesNotExist:
                return None
            company.assigned_pm = new_pm
            new_pm_name = new_pm.full_name
        else:
            company.assigned_pm = None
            new_pm_name = "Sin asignar"

        company.save()

        # Log change
        author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()
        AccountChangeLog.objects.create(
            company=company,
            changed_by=author,
            change_type="pm_assign",
            field_changed="assigned_pm",
            old_value=old_pm_name,
            new_value=new_pm_name,
            description=f"PM cambiado de {old_pm_name} a {new_pm_name}",
        )

        pm_data = None
        if company.assigned_pm:
            pm_data = {
                "id": str(company.assigned_pm.id),
                "full_name": company.assigned_pm.full_name,
                "email": company.assigned_pm.email,
            }
        return {"assigned_pm": pm_data, "message": f"PM asignado: {new_pm_name}"}

    result = await sync_to_async(do_assign)()
    if result is None:
        raise HTTPException(status_code=404, detail="PM no encontrado")
    return result


@router.get("/pms")
async def list_pms():
    """
    Listar PMs disponibles (superadmin + inspiratoria_admin)
    """
    def get_pms():
        pms = User.objects.filter(
            role__in=["superadmin", "admin_root", "inspiratoria_admin"]
        ).order_by('full_name')
        return [{
            "id": str(p.id),
            "full_name": p.full_name,
            "email": p.email,
            "role": p.role,
            "avatar_url": p.avatar_url or "",
        } for p in pms]

    pms = await sync_to_async(get_pms)()
    return pms


@router.post("/account/{company_id}/status")
async def update_account_status(company_id: uuid.UUID, payload: UpdateCompanyStatusRequest):
    """
    Cambiar estado/plan de una cuenta con registro en changelog
    """
    valid_statuses = ["pending", "trial", "active", "suspended", "cancelled"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {valid_statuses}")

    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def update_status():
        old_status = company.status
        old_plan = company.plan
        author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()

        company.status = payload.status
        if payload.plan:
            company.plan = payload.plan
        company.save()

        # Log status change
        AccountChangeLog.objects.create(
            company=company,
            changed_by=author,
            change_type="status_change",
            field_changed="status",
            old_value=old_status,
            new_value=payload.status,
            description=f"Estado cambiado de {old_status} a {payload.status}",
        )

        if payload.plan and payload.plan != old_plan:
            AccountChangeLog.objects.create(
                company=company,
                changed_by=author,
                change_type="plan_change",
                field_changed="plan",
                old_value=old_plan,
                new_value=payload.plan,
                description=f"Plan cambiado de {old_plan} a {payload.plan}",
            )

        return {
            "status": company.status,
            "plan": company.plan,
            "is_enabled": company.is_enabled,
            "message": f"Estado actualizado a {company.status}",
        }

    result = await sync_to_async(update_status)()
    return result


@router.post("/account/{company_id}/contract")
async def update_contract(company_id: uuid.UUID, payload: UpdateContractRequest):
    """
    Actualizar datos de contrato
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    def do_update():
        from datetime import date as date_type
        author = User.objects.filter(role__in=["superadmin", "admin_root"]).first() or User.objects.filter(is_superuser=True).first()
        changes = []

        if payload.contract_start is not None:
            old_val = str(company.contract_start) if company.contract_start else "Sin definir"
            company.contract_start = payload.contract_start if payload.contract_start else None
            changes.append(("contract_start", old_val, payload.contract_start or "Sin definir"))

        if payload.contract_end is not None:
            old_val = str(company.contract_end) if company.contract_end else "Sin definir"
            company.contract_end = payload.contract_end if payload.contract_end else None
            changes.append(("contract_end", old_val, payload.contract_end or "Sin definir"))

        if payload.internal_notes is not None:
            company.internal_notes = payload.internal_notes

        company.save()

        for field, old_v, new_v in changes:
            AccountChangeLog.objects.create(
                company=company,
                changed_by=author,
                change_type="contract_update",
                field_changed=field,
                old_value=old_v,
                new_value=new_v,
                description=f"Contrato actualizado: {field}",
            )

        return {
            "contract_start": str(company.contract_start) if company.contract_start else None,
            "contract_end": str(company.contract_end) if company.contract_end else None,
            "internal_notes": company.internal_notes,
            "message": "Contrato actualizado",
        }

    result = await sync_to_async(do_update)()
    return result


@router.get("/", response_model=List[CompanyResponse])
async def list_companies(
    skip: int = 0,
    limit: int = 100,
    company_status: Optional[str] = None,
    account_type: Optional[str] = None
):
    """
    Listar todas las empresas (Admin Root only)
    Filtros: company_status, account_type (internal/core/studio)
    """
    from fastapi import status as http_status
    try:
        queryset = Company.objects.all()
        
        if company_status:
            queryset = queryset.filter(status=company_status)
        
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        
        companies = await sync_to_async(list)(
            queryset.order_by('-created_at')[skip:skip + limit]
        )
        return [CompanyResponse.model_validate(c) for c in companies]
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(payload: CompanyCreateRequest):
    """
    Crear nueva empresa (Admin Root only)
    """
    try:
        company = await sync_to_async(OnboardingService.create_company_step1)(
            name=payload.name,
            industry=payload.industry,
            company_size=payload.company_size,
            website=payload.website,
            account_type=payload.account_type or "core",
        )
        return CompanyResponse.model_validate(company)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: uuid.UUID):
    """
    Obtener información de la empresa
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        return CompanyResponse.model_validate(company)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: uuid.UUID, payload: dict):
    """
    Actualizar información de empresa (Admin Root only)
    Acepta cualquier campo de CompanyUpdateRequest
    """
    from fastapi import status as http_status
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        
        # Update only provided fields
        for field, value in payload.items():
            if value is not None and hasattr(company, field):
                setattr(company, field, value)
        
        await sync_to_async(company.save)()
        
        # Refresh from DB to get updated values
        await sync_to_async(company.refresh_from_db)()
        return CompanyResponse.model_validate(company)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(company_id: uuid.UUID):
    """
    Eliminar empresa y todos sus datos asociados (Admin Root only)
    PELIGRO: Esta acción es irreversible y eliminará:
    - La empresa
    - Todos los usuarios de la empresa
    - Todos los programas de la empresa
    - Todos los datos asociados
    """
    from fastapi import status as http_status
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
        company_name = company.name
        
        # Delete company (cascade will handle related objects)
        await sync_to_async(company.delete)()
        
        return None  # 204 No Content
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Error al eliminar la empresa: {str(e)}"
        )


@router.get("/{company_id}/users")
async def list_company_users(company_id: uuid.UUID):
    """
    Listar usuarios de una empresa
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    
    users = await sync_to_async(list)(
        User.objects.filter(company=company).order_by('full_name')
    )
    
    # Construir respuesta con información completa
    users_response = []
    for user in users:
        users_response.append({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "position": user.position or "",
            "is_active": user.is_active
        })
    
    return {"users": users_response}


# ============ USER MANAGEMENT ENDPOINTS (ADMIN ONLY) ============

@router.get("/users", response_model=List[UserListResponse])
async def list_all_users(
    company_id: Optional[uuid.UUID] = None,
    role: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Listar todos los usuarios (con filtros opcionales)
    """
    queryset = User.objects.all()
    
    if company_id:
        queryset = queryset.filter(company_id=company_id)
    
    if role:
        queryset = queryset.filter(role=role)
    
    users = await sync_to_async(list)(
        queryset.order_by('-created_at')[skip:skip + limit]
    )
    return [UserListResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID):
    """
    Obtener información de un usuario específico
    """
    try:
        user = await sync_to_async(User.objects.select_related('company').get)(id=user_id)
        return UserResponse.model_validate(user)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreateRequest):
    """
    Crear un nuevo usuario (requiere permisos de admin)
    """
    # Verificar si el username o email ya existen
    username_exists = await sync_to_async(User.objects.filter(username=payload.username).exists)()
    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    email_exists = await sync_to_async(User.objects.filter(email=payload.email).exists)()
    if email_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está en uso"
        )
    
    # Verificar que la empresa existe si se proporciona company_id
    company = None
    if payload.company_id:
        try:
            company = await sync_to_async(Company.objects.get)(id=payload.company_id)
        except Company.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
    
    # Crear usuario
    def create_user_sync():
        user = User.objects.create_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
            company=company,
            position=payload.position or "",
            department=payload.department or "",
            phone=payload.phone or "",
            is_onboarded=True
        )
        return user
    
    user = await sync_to_async(create_user_sync)()
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: uuid.UUID, payload: UserUpdateRequest):
    """
    Actualizar información de un usuario
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar campos proporcionados
    update_data = payload.model_dump(exclude_unset=True)
    
    def update_user_sync():
        for field, value in update_data.items():
            setattr(user, field, value)
        user.save()
        return user
    
    updated_user = await sync_to_async(update_user_sync)()
    return UserResponse.model_validate(updated_user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID):
    """
    Eliminar un usuario
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    await sync_to_async(user.delete)()


class PasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=8)


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: uuid.UUID, payload: PasswordResetRequest):
    """
    Resetear contraseña de un usuario (admin only)
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    def reset_password_sync():
        user.set_password(payload.new_password)
        user.save()
    
    await sync_to_async(reset_password_sync)()
    return {"message": "Contraseña actualizada exitosamente"}


@router.get("/users/stats/summary")
async def get_users_stats():
    """
    Obtener estadísticas generales de usuarios
    """
    def get_stats_sync():
        from django.db.models import Count
        
        total_users = User.objects.count()
        users_by_role = dict(User.objects.values_list('role').annotate(count=Count('role')))
        users_by_company = dict(User.objects.filter(company__isnull=False).values_list('company__name').annotate(count=Count('id')))
        onboarded_count = User.objects.filter(is_onboarded=True).count()
        
        return {
            "total_users": total_users,
            "users_by_role": users_by_role,
            "users_by_company": users_by_company,
            "onboarded_users": onboarded_count,
            "pending_onboarding": total_users - onboarded_count,
        }
    
    stats = await sync_to_async(get_stats_sync)()
    return stats


# ============ PLAN & BILLING ENDPOINTS ============

@router.get("/{company_id}/plan")
async def get_company_plan(company_id: uuid.UUID):
    """
    Obtener información del plan de una empresa
    Incluye: plan actual, límites, features, uso actual
    """
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    
    def get_plan_info_sync():
        plan_limits = company.check_plan_limits()
        plan_features = company.get_plan_features()
        
        return {
            "company_id": str(company.id),
            "company_name": company.name,
            "plan": company.plan,
            "status": company.status,
            "limits": plan_limits["limits"],
            "current_usage": plan_limits["current"],
            "exceeded": plan_limits["exceeded"],
            "suggest_upgrade": plan_limits["suggest_upgrade"],
            "next_plan": plan_limits["next_plan"],
            "features": plan_features,
            "pricing": {
                "trial": {"price": 0, "period": "14 días"},
                "starter": {"price": 3200, "period": "año", "monthly": 299},
                "growth": {"price": 9600, "period": "año", "monthly": 899},
                "enterprise": {"price": "custom", "period": "año"},
            },
        }
    
    plan_info = await sync_to_async(get_plan_info_sync)()
    return plan_info


@router.post("/{company_id}/plan/upgrade")
async def upgrade_company_plan(company_id: uuid.UUID, new_plan: str):
    """
    Actualizar plan de una empresa
    """
    if new_plan not in ["starter", "growth", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan no válido. Opciones: starter, growth, enterprise"
        )
    
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada"
        )
    
    def upgrade_plan_sync():
        old_plan = company.plan
        company.plan = new_plan
        company.status = "active"
        company.save()
        
        return {
            "success": True,
            "company_id": str(company.id),
            "old_plan": old_plan,
            "new_plan": new_plan,
            "new_limits": company.get_plan_limits(),
            "new_features": company.get_plan_features(),
            "message": f"Plan actualizado de {old_plan} a {new_plan}",
        }
    
    result = await sync_to_async(upgrade_plan_sync)()
    return result


@router.get("/plans/catalog")
async def get_plans_catalog():
    """
    Obtener catálogo de planes disponibles
    """
    return {
        "plans": [
            {
                "id": "trial",
                "name": "Trial",
                "description": "Prueba gratuita por 14 días",
                "price": 0,
                "period": "14 días",
                "limits": Company.PLAN_LIMITS["trial"],
                "features": Company.PLAN_FEATURES["trial"],
                "cta": "Comenzar gratis",
            },
            {
                "id": "starter",
                "name": "Starter",
                "description": "Empezar con Mentoría Profesional",
                "price": 3200,
                "monthly_price": 299,
                "period": "año",
                "limits": Company.PLAN_LIMITS["starter"],
                "features": Company.PLAN_FEATURES["starter"],
                "cta": "Seleccionar Starter",
                "popular": False,
            },
            {
                "id": "growth",
                "name": "Growth",
                "description": "Escalar Desarrollo de Talento",
                "price": 9600,
                "monthly_price": 899,
                "period": "año",
                "limits": Company.PLAN_LIMITS["growth"],
                "features": Company.PLAN_FEATURES["growth"],
                "cta": "Seleccionar Growth",
                "popular": True,  # Most popular
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Academia Corporativa Completa",
                "price": "custom",
                "period": "año",
                "limits": Company.PLAN_LIMITS["enterprise"],
                "features": Company.PLAN_FEATURES["enterprise"],
                "cta": "Contactar Ventas",
                "popular": False,
            },
        ],
        "comparison_features": [
            {"name": "Programas", "starter": "1", "growth": "3", "enterprise": "Ilimitado"},
            {"name": "Usuarios", "starter": "20", "growth": "80", "enterprise": "Ilimitado"},
            {"name": "Matching IA", "starter": "Básico", "growth": "Avanzado", "enterprise": "Custom"},
            {"name": "Dashboard", "starter": "Básico", "growth": "Avanzado", "enterprise": "Custom"},
            {"name": "API", "starter": "❌", "growth": "✅", "enterprise": "✅"},
            {"name": "SSO", "starter": "❌", "growth": "✅", "enterprise": "✅ + SAML"},
            {"name": "White-label", "starter": "❌", "growth": "Logo/Color", "enterprise": "Completo"},
            {"name": "Soporte", "starter": "Email 72hr", "growth": "24hr + AM", "enterprise": "24/7 + CSM"},
            {"name": "Integraciones", "starter": "Slack", "growth": "+ API", "enterprise": "Enterprise"},
        ],
    }

