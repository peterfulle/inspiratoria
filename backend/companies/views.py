from fastapi import APIRouter, HTTPException, Request, status, Header, UploadFile, File as FastAPIFile
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
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
    AdminCreateUserRequest,
    VerifyOTPRequest,
    AdminUserResponse,
    RequestLoginOTPRequest,
    LoginOTPRequest,
    TOTPSetupRequest,
    TOTPVerifyRequest,
    TOTPLoginRequest,
    TOTPCheckRequest,
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


# ============ EMAIL NOTIFICATION HELPER ============

def _send_assignment_email(company, program):
    """Send email notification when a program is assigned to a company."""
    from django.core.mail import send_mail
    from django.conf import settings

    recipient = getattr(company, 'contact_email', '') or ''
    if not recipient:
        try:
            from companies.models import StudioAccount
            sa = StudioAccount.objects.filter(company=company).first()
            if sa:
                recipient = sa.generated_email
        except Exception:
            pass
    if not recipient:
        print(f"[EMAIL] No email for {company.name} — skipping")
        return
    try:
        send_mail(
            subject=f"Nuevo programa asignado: {program.name}",
            message=(
                f"Hola {company.name},\n\n"
                f"Se te ha asignado un nuevo programa de mentoría en Inspiratoria.\n\n"
                f"📋 Programa: {program.name}\n"
                f"📝 Descripción: {program.description or 'Sin descripción'}\n\n"
                f"Ingresa a tu panel de control para ver los detalles.\n\n"
                f"— Equipo Inspiratoria"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )
        print(f"[EMAIL] Sent to {recipient}")
    except Exception as e:
        print(f"[EMAIL] Error: {e}")


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
            
            # Send email notification
            _send_assignment_email(company, program)
            
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


class AssignTemplateRequest(BaseModel):
    template_id: uuid.UUID
    name_override: Optional[str] = None
    status: Optional[str] = "designed"


@router.post("/account/{company_id}/assign-template")
async def assign_template_to_company(company_id: uuid.UUID, payload: AssignTemplateRequest):
    """
    Instancia una ProgramTemplate como un Program para la company indicada.
    Crea Activities derivadas de los módulos del template y registra changelog.
    Operación 100% backend: sólo recibe template_id + company_id.
    """
    from programs.models import Program, ProgramTemplate, Activity
    from .models import AccountChangeLog

    def _assign():
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if company.status not in ("active", "trial"):
            raise HTTPException(status_code=400, detail="La empresa debe estar activa o en trial")

        try:
            template = ProgramTemplate.objects.get(id=payload.template_id)
        except ProgramTemplate.DoesNotExist:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")

        program_name = (payload.name_override or template.name).strip() or template.name
        program = Program.objects.create(
            name=program_name,
            description=template.description or "",
            theme=template.category or "General",
            status=payload.status or "designed",
            company=company,
        )

        # Derivar activities desde los módulos del template (1 activity por módulo)
        activities_created: List[dict] = []
        for module in (template.modules or []):
            try:
                act = Activity.objects.create(
                    program=program,
                    name=str(module.get("name", "Módulo")),
                    description=str(module.get("description", ""))[:1000],
                    activity_type="training",
                    training_category=template.category or None,
                    modality="online",
                    status="created",
                )
                activities_created.append({
                    "id": str(act.id),
                    "name": act.name,
                    "type": act.activity_type,
                })
            except Exception as exc:  # pragma: no cover
                print(f"[assign-template] activity error: {exc}")

        author = (
            User.objects.filter(role__in=["superadmin", "admin_root", "inspiratoria_admin"]).first()
            or User.objects.filter(is_superuser=True).first()
        )
        AccountChangeLog.objects.create(
            company=company,
            changed_by=author,
            change_type="info_update",
            field_changed="program_assigned",
            old_value="",
            new_value=program.name,
            description=f"Plantilla '{template.name}' instanciada como programa '{program.name}' en {company.name}",
        )

        try:
            _send_assignment_email(company, program)
        except Exception as exc:  # pragma: no cover
            print(f"[assign-template] email error: {exc}")

        return {
            "message": f"Plantilla '{template.name}' asignada a '{company.name}'",
            "program": {
                "id": str(program.id),
                "name": program.name,
                "description": program.description,
                "theme": program.theme,
                "status": program.status,
                "company_id": str(company.id),
                "company_name": company.name,
            },
            "template_id": str(template.id),
            "template_name": template.name,
            "activities_count": len(activities_created),
            "activities": activities_created,
        }

    return await sync_to_async(_assign)()


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


@router.get("/dashboard-overview")
async def get_dashboard_overview():
    """
    Dashboard overview: empresas, programas asignados, stats reales
    """
    from programs.models import Program, ProgramParticipant
    try:
        def build_overview():
            from .models import AccountChangeLog
            companies = list(Company.objects.all().order_by('name'))
            programs = list(Program.objects.select_related('company').all())
            
            # Companies data
            companies_list = []
            for c in companies:
                company_programs = [p for p in programs if p.company_id == c.id]
                user_count = User.objects.filter(company=c).count()
                companies_list.append({
                    "id": str(c.id),
                    "name": c.name,
                    "plan": c.plan,
                    "status": c.status,
                    "account_type": c.account_type,
                    "users": user_count,
                    "programs": len(company_programs),
                    "programs_list": [
                        {
                            "id": str(p.id),
                            "name": p.name,
                            "status": p.status,
                            "theme": p.theme,
                            "created_at": p.created_at.isoformat() if p.created_at else None,
                        }
                        for p in company_programs
                    ],
                    "created": c.created_at.isoformat() if c.created_at else "",
                })
            
            # Program assignments summary
            assigned_programs = [p for p in programs if p.company_id is not None]
            unassigned_programs = [p for p in programs if p.company_id is None]
            
            assignments = []
            for p in assigned_programs:
                company = next((c for c in companies if c.id == p.company_id), None)
                participants = ProgramParticipant.objects.filter(program=p, deleted_at__isnull=True).count()
                assignments.append({
                    "program_id": str(p.id),
                    "program_name": p.name,
                    "program_status": p.status,
                    "program_theme": p.theme,
                    "company_id": str(p.company_id) if p.company_id else None,
                    "company_name": company.name if company else "—",
                    "company_plan": company.plan if company else "—",
                    "participants": participants,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                })
            
            # Stats
            stats = {
                "total_companies": len(companies),
                "active_companies": len([c for c in companies if c.status == "active"]),
                "trial_companies": len([c for c in companies if c.status == "trial"]),
                "total_users": User.objects.count(),
                "total_programs": len(programs),
                "assigned_programs": len(assigned_programs),
                "unassigned_programs": len(unassigned_programs),
                "by_plan": {
                    "enterprise": len([c for c in companies if c.plan == "enterprise"]),
                    "growth": len([c for c in companies if c.plan == "growth"]),
                    "starter": len([c for c in companies if c.plan == "starter"]),
                    "trial": len([c for c in companies if c.plan == "trial"]),
                },
                "by_status": {
                    "active": len([c for c in companies if c.status == "active"]),
                    "trial": len([c for c in companies if c.status == "trial"]),
                    "pending": len([c for c in companies if c.status == "pending"]),
                    "suspended": len([c for c in companies if c.status == "suspended"]),
                },
            }
            
            # Recent activity from AccountChangeLog
            logs = list(AccountChangeLog.objects.select_related('company', 'changed_by').order_by('-created_at')[:10])
            recent_activity = [
                {
                    "description": log.description or f"{log.change_type}: {log.field_changed}",
                    "company": log.company.name if log.company else "—",
                    "by": log.changed_by.email if log.changed_by else "Sistema",
                    "time": log.created_at.isoformat() if log.created_at else "",
                }
                for log in logs
            ]
            
            return {
                "companies": companies_list,
                "assignments": assignments,
                "stats": stats,
                "recent_activity": recent_activity,
            }
        
        result = await sync_to_async(build_overview)()
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
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
                "phone": company.assigned_pm.phone or "",
                "position": company.assigned_pm.position or "",
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


@router.get("/company/{company_id}/pm")
async def get_company_pm(company_id: uuid.UUID):
    """Obtener el Project Manager asignado a una empresa (para vista Core)."""
    def _get_pm():
        try:
            company = Company.objects.select_related('assigned_pm').get(id=company_id)
        except Company.DoesNotExist:
            return {"assigned_pm": None}
        if not company.assigned_pm:
            return {"assigned_pm": None}
        pm = company.assigned_pm
        return {
            "assigned_pm": {
                "id": str(pm.id),
                "full_name": pm.full_name,
                "email": pm.email,
                "phone": pm.phone or "",
                "position": pm.position or "",
                "department": pm.department or "",
                "avatar_url": pm.avatar_url or "",
            }
        }
    return await sync_to_async(_get_pm)()


@router.get("/pm/{pm_id}/activity")
async def get_pm_activity(pm_id: uuid.UUID):
    """
    Obtener perfil y actividad completa de un PM:
    - Datos de perfil
    - Último acceso
    - Cuentas gestionadas
    - Historial de acciones (changelog)
    """
    def _build_activity():
        try:
            pm = User.objects.get(id=pm_id)
        except User.DoesNotExist:
            return None

        # Cuentas gestionadas por este PM
        managed = list(Company.objects.filter(assigned_pm=pm).order_by('name'))
        managed_list = [{
            "id": str(c.id),
            "name": c.name,
            "status": c.status,
            "plan": c.plan,
        } for c in managed]

        # Últimas acciones del PM en changelog (cualquier empresa)
        logs = list(
            AccountChangeLog.objects.filter(changed_by=pm)
            .select_related('company')
            .order_by('-created_at')[:50]
        )
        actions = [{
            "id": str(lg.id),
            "change_type": lg.change_type,
            "field_changed": lg.field_changed,
            "old_value": lg.old_value,
            "new_value": lg.new_value,
            "description": lg.description,
            "company_name": lg.company.name if lg.company else "",
            "company_id": str(lg.company.id) if lg.company else "",
            "created_at": lg.created_at.isoformat(),
        } for lg in logs]

        return {
            "profile": {
                "id": str(pm.id),
                "full_name": pm.full_name,
                "email": pm.email,
                "phone": pm.phone or "",
                "position": pm.position or "",
                "department": pm.department or "",
                "avatar_url": pm.avatar_url or "",
                "role": pm.role,
                "date_joined": pm.date_joined.isoformat() if pm.date_joined else None,
                "last_login_at": pm.last_login_at.isoformat() if pm.last_login_at else None,
            },
            "managed_accounts": managed_list,
            "total_managed": len(managed_list),
            "actions": actions,
            "total_actions": len(actions),
        }

    result = await sync_to_async(_build_activity)()
    if result is None:
        raise HTTPException(status_code=404, detail="PM no encontrado")
    return result


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


# ============ BILLING ENDPOINTS ============

@router.get("/billing/overview")
async def get_billing_overview():
    """
    Billing overview: datos de facturación de todas las cuentas Studio
    con desglose de usuarios por rol, programas, plan, fechas, etc.
    """
    from programs.models import Program
    try:
        def build_billing():
            # Get all studio companies (or all non-internal)
            companies = list(Company.objects.exclude(account_type="internal").order_by('name'))
            
            billing_clients = []
            total_mrr = 0
            plan_prices = {
                "trial": 0,
                "starter": 299,
                "growth": 899,
                "enterprise": 4833,
            }
            
            for c in companies:
                # User role breakdown
                users = list(User.objects.filter(company=c, is_active=True))
                role_counts = {
                    "admin_root": 0,
                    "coordinator": 0,
                    "mentor": 0,
                    "mentee": 0,
                    "facilitator": 0,
                    "client": 0,
                }
                for u in users:
                    if u.role in role_counts:
                        role_counts[u.role] += 1
                
                # Programs
                programs = list(Program.objects.filter(company=c))
                programs_data = [
                    {
                        "id": str(p.id),
                        "name": p.name,
                        "status": p.status,
                        "theme": p.theme or "",
                        "created_at": p.created_at.isoformat() if p.created_at else None,
                    }
                    for p in programs
                ]
                
                # Monthly amount
                amount = plan_prices.get(c.plan, 0)
                total_mrr += amount
                
                # Billing status
                billing_status = "active"
                if c.status == "suspended":
                    billing_status = "overdue"
                elif c.status == "pending" or c.status == "trial":
                    billing_status = "trial"
                elif c.status == "cancelled":
                    billing_status = "cancelled"
                
                billing_clients.append({
                    "id": str(c.id),
                    "name": c.name,
                    "slug": c.slug,
                    "corp_id": c.corp_id or "",
                    "account_type": c.account_type,
                    "plan": c.plan,
                    "status": c.status,
                    "billing_status": billing_status,
                    "amount": amount,
                    # Contact
                    "contact_name": c.contact_name or "",
                    "contact_email": c.contact_email or "",
                    "contact_phone": c.contact_phone or "",
                    "contact_position": c.contact_position or "",
                    # Legal
                    "legal_name": c.legal_name or "",
                    "rut": c.rut or "",
                    "country": c.country or "",
                    "city": c.city or "",
                    # Contract
                    "contract_start": str(c.contract_start) if c.contract_start else None,
                    "contract_end": str(c.contract_end) if c.contract_end else None,
                    # Users
                    "total_users": len(users),
                    "users_by_role": role_counts,
                    "max_users": c.max_users,
                    # Programs
                    "total_programs": len(programs),
                    "programs": programs_data,
                    "max_programs": c.max_programs,
                    # Plan details
                    "plan_limits": c.get_plan_limits(),
                    "plan_features": c.get_plan_features(),
                    # Timestamps
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "updated_at": c.updated_at.isoformat() if c.updated_at else None,
                })
            
            # Summary stats
            active_count = len([c for c in billing_clients if c["billing_status"] == "active"])
            trial_count = len([c for c in billing_clients if c["billing_status"] == "trial"])
            overdue_count = len([c for c in billing_clients if c["billing_status"] == "overdue"])
            cancelled_count = len([c for c in billing_clients if c["billing_status"] == "cancelled"])
            
            by_plan = {}
            for c in billing_clients:
                plan = c["plan"]
                if plan not in by_plan:
                    by_plan[plan] = {"count": 0, "revenue": 0}
                by_plan[plan]["count"] += 1
                by_plan[plan]["revenue"] += c["amount"]
            
            return {
                "clients": billing_clients,
                "stats": {
                    "total_clients": len(billing_clients),
                    "active": active_count,
                    "trial": trial_count,
                    "overdue": overdue_count,
                    "cancelled": cancelled_count,
                    "mrr": total_mrr,
                    "arr": total_mrr * 12,
                    "total_users": sum(c["total_users"] for c in billing_clients),
                    "total_programs": sum(c["total_programs"] for c in billing_clients),
                    "by_plan": by_plan,
                },
            }
        
        result = await sync_to_async(build_billing)()
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/billing/invoice")
async def create_invoice(payload: dict):
    """
    Crear una factura/orden de pago para un cliente
    Payload: { company_id, amount, description, due_date, period }
    """
    company_id = payload.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id requerido")
    
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Generate invoice number
    import datetime
    now = datetime.datetime.now()
    invoice_num = f"INV-{now.strftime('%Y%m')}-{str(company.id)[:4].upper()}"
    
    plan_prices = {"trial": 0, "starter": 299, "growth": 899, "enterprise": 4833}
    amount = payload.get("amount", plan_prices.get(company.plan, 0))
    description = payload.get("description", f"Plan {company.plan.capitalize()} - {now.strftime('%B %Y')}")
    due_date = payload.get("due_date", (now + datetime.timedelta(days=30)).strftime("%Y-%m-%d"))
    
    return {
        "invoice_id": invoice_num,
        "company_id": str(company.id),
        "company_name": company.name,
        "amount": amount,
        "description": description,
        "due_date": due_date,
        "status": "pending",
        "created_at": now.isoformat(),
        "plan": company.plan,
    }


@router.post("/billing/payment-order")
async def create_payment_order(payload: dict):
    """
    Crear una orden de pago para un cliente
    Payload: { company_id, amount, concept, due_date }
    """
    company_id = payload.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id requerido")
    
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    import datetime
    now = datetime.datetime.now()
    order_num = f"OP-{now.strftime('%Y%m%d')}-{str(company.id)[:4].upper()}"
    
    plan_prices = {"trial": 0, "starter": 299, "growth": 899, "enterprise": 4833}
    amount = payload.get("amount", plan_prices.get(company.plan, 0))
    
    return {
        "order_id": order_num,
        "company_id": str(company.id),
        "company_name": company.name,
        "amount": amount,
        "concept": payload.get("concept", f"Suscripción {company.plan.capitalize()}"),
        "due_date": payload.get("due_date", (now + datetime.timedelta(days=15)).strftime("%Y-%m-%d")),
        "status": "pending",
        "created_at": now.isoformat(),
    }


@router.get("/")
async def list_companies(
    skip: int = 0,
    limit: int = 100,
    company_status: Optional[str] = None,
    account_type: Optional[str] = None
):
    """
    Listar todas las empresas (Admin Root only)
    Filtros: company_status, account_type (internal/core/studio)
    Incluye datos del PM asignado.
    """
    from fastapi import status as http_status
    try:
        queryset = Company.objects.all()
        
        if company_status:
            queryset = queryset.filter(status=company_status)
        
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        
        def _build_list():
            from django.db import close_old_connections
            close_old_connections()
            companies = list(
                queryset.select_related('assigned_pm').order_by('-created_at')[skip:skip + limit]
            )
            result = []
            for c in companies:
                data = CompanyResponse.model_validate(c).model_dump()
                # Serializar datetime/uuid para JSON
                data['id'] = str(data['id'])
                if data.get('created_at'):
                    data['created_at'] = data['created_at'].isoformat()
                if c.assigned_pm:
                    data['assigned_pm_id'] = str(c.assigned_pm.id)
                    data['assigned_pm_name'] = c.assigned_pm.full_name
                else:
                    data['assigned_pm_id'] = None
                    data['assigned_pm_name'] = None
                result.append(data)
            return result

        return await sync_to_async(_build_list)()
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



# ============ ADMIN USER MANAGEMENT WITH OTP ============

def _generate_otp() -> str:
    """Genera un OTP de 4 dígitos"""
    return ''.join(random.choices(string.digits, k=4))


def _send_otp_email(user_email: str, user_name: str, otp_code: str, is_login: bool = False, activation_token: str = ""):
    """Envía email con código OTP — diseño minimalista blanco Inspiratoria"""
    import urllib.parse
    encoded_email = urllib.parse.quote(user_email)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    if activation_token:
        login_link = f"{frontend_url}/activate/{activation_token}"
    else:
        login_link = f"{frontend_url}/login/admin?email={encoded_email}"

    first_name = user_name.split()[0] if user_name.strip() else "usuario"

    if is_login:
        subject = "Tu código de acceso · Inspiratoria"
        plain_message = (
            f"Hola, {first_name}.\n\n"
            f"Has solicitado iniciar sesión en Inspiratoria.\n\n"
            f"Tu código de acceso es: {otp_code}\n\n"
            f"Ingresa a la plataforma y usa este código para acceder.\n\n"
            f"Link: {login_link}\n\n"
            f"Este código expira en 15 minutos.\n\n"
            f"Equipo Inspiratoria"
        )
    else:
        subject = "Bienvenido al equipo Inspiratoria"
        plain_message = (
            f"Hola, {first_name}.\n\n"
            f"Te damos la bienvenida al equipo de Inspiratoria.\n\n"
            f"Ya tienes acceso a nuestra plataforma interna de gestión, donde podrás coordinar programas, gestionar cuentas, revisar métricas y colaborar con el resto del equipo.\n\n"
            f"Tu código de activación es: {otp_code}\n\n"
            f"Para comenzar, activa tu cuenta: {login_link}\n\n"
            f"Este código expira en 15 minutos.\n\n"
            f"Equipo Inspiratoria"
        )

    d1, d2, d3, d4 = otp_code[0], otp_code[1], otp_code[2], otp_code[3]

    if is_login:
        html_body = f"""
            <p style="margin:0 0 24px 0;color:#6b7280;font-size:15px;line-height:1.7;">
                Has solicitado iniciar sesión en la plataforma. Ingresa el siguiente código para acceder a tu cuenta.
            </p>
        """
        btn_text = "Ingresar a Inspiratoria"
    else:
        html_body = f"""
            <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.7;">
                Te damos la bienvenida al equipo de Inspiratoria. Ya formas parte de nuestra plataforma interna de gestión.
            </p>
            <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;line-height:1.7;">
                Desde aquí podrás coordinar programas, gestionar cuentas de clientes, revisar métricas, administrar facturación y colaborar con el resto del equipo &mdash; todo en un solo lugar.
            </p>
            <p style="margin:0 0 28px 0;color:#374151;font-size:15px;line-height:1.7;">
                Para comenzar, activa tu cuenta haciendo clic en el botón de abajo e ingresa tu código de acceso.
            </p>
        """
        btn_text = "Activar mi cuenta"

    html_message = f"""
    <div style="background-color:#f9fafb;padding:40px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;">

        <!-- Logo -->
        <div style="text-align:center;padding-bottom:32px;">
          <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;">Inspiratoria</span>
        </div>

        <!-- Card -->
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 36px;">

          <p style="margin:0 0 24px 0;color:#111827;font-size:17px;font-weight:500;">
            Hola, {first_name}.
          </p>

          {html_body}

          <!-- OTP Code -->
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

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0 0 0;">
            <a href="{login_link}" style="display:inline-block;background:#0a0a0a;color:#FFD902;padding:14px 40px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">{btn_text}</a>
          </div>

        </div>

        <!-- Footer -->
        <div style="text-align:center;padding-top:28px;">
          <p style="margin:0 0 8px 0;color:#9ca3af;font-size:12px;line-height:1.6;">
            Esta plataforma ha sido diseñada para facilitar una experiencia ágil, intuitiva y personalizada, poniendo la tecnología al servicio del aprendizaje, la conexión y el impacto.
          </p>
          <p style="margin:0 0 12px 0;color:#d1d5db;font-size:11px;">
            Si no solicitaste este acceso, puedes ignorar este mensaje.
          </p>
          <p style="margin:0;color:#d1d5db;font-size:11px;">Equipo Inspiratoria</p>
        </div>

      </div>
    </div>
    """
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        html_message=html_message,
        fail_silently=False,
    )


async def _require_admin(token: str) -> User:
    """Valida que el token pertenezca a un admin"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    clean_token = token.replace("Bearer ", "").strip()
    # Token format: {user_id}:{random_token}
    parts = clean_token.split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = parts[0]
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (User.DoesNotExist, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")
    admin_roles = ['superadmin', 'admin_root', 'inspiratoria_admin']
    if user.role not in admin_roles and not user.is_superuser:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return user


from fastapi import Header


@router.post("/admin/create-user", status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    payload: AdminCreateUserRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Admin crea un usuario. Se genera OTP de 4 dígitos y se envía por email.
    El usuario debe verificar el OTP para activar su cuenta.
    """
    admin = await _require_admin(authorization or "")

    # Verificar si ya existe un usuario con ese email
    exists = await sync_to_async(User.objects.filter(email=payload.email).exists)()
    if exists:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario con ese email"
        )

    # Verificar empresa si se proporciona
    company = None
    if payload.company_id:
        try:
            company = await sync_to_async(Company.objects.get)(id=payload.company_id)
        except Company.DoesNotExist:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

    otp_code = _generate_otp()
    otp_expires = timezone.now() + timedelta(minutes=15)

    # Generar username a partir del email
    base_username = payload.email.split("@")[0]
    username = base_username
    counter = 1
    while await sync_to_async(User.objects.filter(username=username).exists)():
        username = f"{base_username}{counter}"
        counter += 1

    # Crear usuario inactivo (sin contraseña usable)
    from django.contrib.auth.hashers import make_password
    import secrets as _secrets
    activation_token = _secrets.token_urlsafe(48)

    def _create():
        user = User(
            username=username,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
            company=company,
            position=payload.position or "",
            department=payload.department or "",
            phone=payload.phone or "",
            is_active=True,
            is_account_activated=False,
            otp_code=otp_code,
            otp_expires_at=otp_expires,
            activation_token=activation_token,
            view_permissions=payload.view_permissions or [],
        )
        user.set_unusable_password()
        user.save()
        return user

    user = await sync_to_async(_create)()

    # Enviar email con OTP + activation link
    try:
        await sync_to_async(_send_otp_email)(payload.email, payload.full_name, otp_code, activation_token=activation_token)
    except Exception as e:
        # Log pero no fallar - el admin puede reenviar después
        import logging
        logging.getLogger(__name__).warning(f"Error enviando OTP email: {e}")

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_id": str(company.id) if company else None,
        "position": user.position,
        "department": user.department,
        "phone": user.phone,
        "is_active": user.is_active,
        "is_account_activated": user.is_account_activated,
        "is_onboarded": user.is_onboarded,
        "view_permissions": user.view_permissions or [],
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "message": f"Usuario creado. OTP enviado a {payload.email}",
    }


@router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOTPRequest):
    """
    Verificar OTP de 4 dígitos y activar cuenta.
    El usuario establece su contraseña aquí.
    """
    try:
        user = await sync_to_async(User.objects.get)(email=payload.email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.is_account_activated:
        raise HTTPException(status_code=400, detail="La cuenta ya está activada")

    if not user.otp_code:
        raise HTTPException(status_code=400, detail="No hay OTP pendiente")

    if user.otp_expires_at and timezone.now() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="El OTP ha expirado. Solicita uno nuevo.")

    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Código OTP incorrecto")

    # Activar cuenta y establecer contraseña
    from django.contrib.auth.hashers import make_password

    def _activate():
        user.is_account_activated = True
        user.otp_code = ""
        user.otp_expires_at = None
        if payload.full_name:
            user.full_name = payload.full_name
        user.password = make_password(payload.password)
        user.save()

    await sync_to_async(_activate)()

    # Generar token de sesión
    token = await sync_to_async(AuthService.generate_session_token)(user)

    company_data = None
    if user.company:
        company_data = {
            "id": str(user.company.id),
            "name": user.company.name,
        }

    return {
        "success": True,
        "message": "Cuenta activada correctamente",
        "token": token,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_account_activated": True,
        },
        "company": company_data,
    }


# =============================================
# ACTIVATION FLOW (via email hash link)
# =============================================

class ActivationValidateRequest(BaseModel):
    token: str
    otp: str

class ActivationTOTPSetupRequest(BaseModel):
    token: str

class ActivationTOTPVerifyRequest(BaseModel):
    token: str
    code: str


@router.post("/auth/activate/validate-token")
async def validate_activation_token(payload: ActivationTOTPSetupRequest):
    """
    Valida que un activation_token exista y muestre info del usuario.
    El frontend lo llama al cargar /activate/[token].
    """
    if not payload.token:
        raise HTTPException(status_code=400, detail="Token requerido")
    try:
        user = await sync_to_async(
            User.objects.get
        )(activation_token=payload.token, is_account_activated=False)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Token inválido o cuenta ya activada")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    return {
        "valid": True,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "has_otp": bool(user.otp_code),
        "otp_expired": bool(user.otp_expires_at and timezone.now() > user.otp_expires_at),
    }


@router.post("/auth/activate/verify-otp")
async def activate_verify_otp(payload: ActivationValidateRequest):
    """
    Paso 1 de activación: verifica OTP y retorna QR para TOTP setup.
    Genera TOTP secret + QR automáticamente.
    """
    import pyotp
    import qrcode
    import io
    import base64

    if not payload.token:
        raise HTTPException(status_code=400, detail="Token requerido")
    try:
        user = await sync_to_async(
            User.objects.get
        )(activation_token=payload.token, is_account_activated=False)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Token inválido o cuenta ya activada")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    # Verificar OTP
    if not user.otp_code:
        raise HTTPException(status_code=400, detail="No hay código OTP pendiente")
    if user.otp_expires_at and timezone.now() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="El código ha expirado. Contacta al administrador para reenviar.")
    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    # OTP válido — generar TOTP secret + QR
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name="Inspiratoria"
    )

    qr = qrcode.make(provisioning_uri)
    buffer = io.BytesIO()
    qr.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    # Guardar secret (aún no activado) y limpiar OTP
    def _save_totp_secret():
        user.totp_secret = secret
        user.otp_code = ""
        user.otp_expires_at = None
        user.save(update_fields=['totp_secret', 'otp_code', 'otp_expires_at'])

    await sync_to_async(_save_totp_secret)()

    return {
        "success": True,
        "qr_code": qr_base64,
        "secret": secret,
        "email": user.email,
    }


@router.post("/auth/activate/confirm-totp")
async def activate_confirm_totp(payload: ActivationTOTPVerifyRequest):
    """
    Paso 2 de activación: verifica el código TOTP del authenticator,
    activa TOTP, activa la cuenta, y retorna token de sesión.
    """
    import pyotp

    if not payload.token:
        raise HTTPException(status_code=400, detail="Token requerido")
    try:
        user = await sync_to_async(
            User.objects.get
        )(activation_token=payload.token, is_account_activated=False)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Token inválido o cuenta ya activada")

    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero verifica tu OTP para obtener el QR")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code, valid_window=2):
        raise HTTPException(status_code=400, detail="Código incorrecto. Verifica que la hora de tu dispositivo esté sincronizada.")

    # Todo OK — activar cuenta + TOTP
    def _activate_full():
        user.totp_enabled = True
        user.is_account_activated = True
        user.activation_token = ""  # Invalidar token
        user.save(update_fields=['totp_enabled', 'is_account_activated', 'activation_token'])

    await sync_to_async(_activate_full)()

    # Generar sesión
    token = await sync_to_async(AuthService.generate_session_token)(user)
    session_hours = 8
    expires_at = (timezone.now() + timedelta(hours=session_hours)).isoformat()

    def _get_company_and_program_data():
        company_data = None
        if user.company_id:
            try:
                company = Company.objects.get(id=user.company_id)
                company_data = {"id": str(company.id), "name": company.name, "slug": company.slug}
            except Company.DoesNotExist:
                pass

        # Check if user is a program participant → return program info for redirect
        program_participant = None
        try:
            from programs.models import ProgramParticipant
            pp = ProgramParticipant.objects.select_related('program', 'program__company').filter(
                user=user, deleted_at__isnull=True
            ).order_by('-created_at').first()
            if pp and pp.program:
                slug = pp.program.company.slug if pp.program.company else None
                program_participant = {
                    "participant_id": str(pp.id),
                    "program_id": str(pp.program.id),
                    "program_name": pp.program.name,
                    "role": pp.role,
                    "company_slug": slug,
                }
        except Exception:
            pass

        return company_data, program_participant

    company_data, program_participant = await sync_to_async(_get_company_and_program_data)()

    return {
        "success": True,
        "message": "Cuenta activada con autenticador configurado",
        "token": token,
        "expires_at": expires_at,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "company_id": str(user.company_id) if user.company_id else None,
            "position": user.position or "",
            "department": user.department or "",
            "avatar_url": getattr(user, 'avatar_url', '') or "",
            "is_onboarded": user.is_onboarded,
            "is_account_activated": True,
            "totp_enabled": True,
            "view_permissions": user.view_permissions or [],
            "portal_code": user.portal_code or "",
        },
        "company": company_data,
        "program_participant": program_participant,
    }


@router.post("/auth/request-otp")
async def request_login_otp(payload: RequestLoginOTPRequest):
    """
    Solicitar OTP para login. Se envía siempre por email.
    Funciona tanto para cuentas activadas como no activadas.
    """
    try:
        user = await sync_to_async(User.objects.get)(email=payload.email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese email")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada. Contacta al administrador.")

    otp_code = _generate_otp()
    otp_expires = timezone.now() + timedelta(minutes=15)

    def _set_otp():
        user.otp_code = otp_code
        user.otp_expires_at = otp_expires
        user.save(update_fields=['otp_code', 'otp_expires_at'])

    await sync_to_async(_set_otp)()

    try:
        await sync_to_async(_send_otp_email)(user.email, user.full_name, otp_code, is_login=True)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Error enviando OTP login: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar el código. Intenta nuevamente.")

    return {
        "success": True,
        "message": f"Código enviado a {payload.email}",
        "email": payload.email,
    }


@router.get("/auth/me")
async def get_current_user_profile(authorization: Optional[str] = Header(None)):
    """Retorna el perfil actual del usuario autenticado, incluyendo view_permissions frescos de DB."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    clean_token = authorization.replace("Bearer ", "").strip()
    parts = clean_token.split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = parts[0]
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (User.DoesNotExist, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_id": str(user.company_id) if user.company_id else None,
        "position": user.position or "",
        "department": user.department or "",
        "avatar_url": getattr(user, 'avatar_url', '') or "",
        "is_onboarded": user.is_onboarded,
        "is_account_activated": user.is_account_activated,
        "view_permissions": user.view_permissions or [],
    }


# ── Helper: extract authenticated user from token ──
async def _get_user_from_token(authorization: Optional[str]) -> "User":
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")
    clean_token = authorization.replace("Bearer ", "").strip()
    parts = clean_token.split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = parts[0]
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (User.DoesNotExist, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")
    return user


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    headline: Optional[str] = None
    skills: Optional[list] = None
    # Mentor profile extended fields
    gender: Optional[str] = None
    personal_email: Optional[str] = None
    presentation: Optional[str] = None
    mentor_topics: Optional[list] = None
    mentor_objectives: Optional[list] = None
    mentor_style: Optional[list] = None
    experience_level: Optional[str] = None
    experience_area: Optional[list] = None
    mentee_preference: Optional[list] = None
    mentee_outcomes: Optional[list] = None
    session_structure: Optional[list] = None
    mentor_profile_step: Optional[int] = None
    # Mentee profile fields
    mentee_goals: Optional[list] = None
    mentee_interests: Optional[list] = None
    mentee_challenges: Optional[list] = None
    mentee_expectations: Optional[list] = None
    preferred_mentor_style: Optional[list] = None
    session_format_preference: Optional[list] = None
    mentee_profile_step: Optional[int] = None


@router.get("/auth/profile")
async def get_full_profile(authorization: Optional[str] = Header(None)):
    """Retorna el perfil completo del usuario autenticado, incluyendo phone, totp_enabled, created_at."""
    user = await _get_user_from_token(authorization)
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_id": str(user.company_id) if user.company_id else None,
        "position": user.position or "",
        "department": user.department or "",
        "phone": getattr(user, 'phone', '') or "",
        "avatar_url": getattr(user, 'avatar_url', '') or "",
        "is_onboarded": user.is_onboarded,
        "is_account_activated": user.is_account_activated,
        "view_permissions": user.view_permissions or [],
        "totp_enabled": getattr(user, 'totp_enabled', False),
        "created_at": user.created_at.isoformat() if getattr(user, 'created_at', None) else "",
    }


@router.put("/auth/profile")
async def update_profile(payload: ProfileUpdateRequest, authorization: Optional[str] = Header(None)):
    """Actualizar campos editables del perfil (full_name, phone, position, department)."""
    user = await _get_user_from_token(authorization)

    update_fields = []
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()[:200]
        update_fields.append('full_name')
    if payload.phone is not None:
        user.phone = payload.phone.strip()[:30]
        update_fields.append('phone')
    if payload.position is not None:
        user.position = payload.position.strip()[:200]
        update_fields.append('position')
    if payload.department is not None:
        user.department = payload.department.strip()[:200]
        update_fields.append('department')
    if payload.linkedin_url is not None:
        url = payload.linkedin_url.strip()[:300]
        if url and not url.startswith(('https://www.linkedin.com/', 'https://linkedin.com/', 'http://www.linkedin.com/', 'http://linkedin.com/')):
            url = ''
        user.linkedin_url = url
        update_fields.append('linkedin_url')
    if payload.bio is not None:
        user.bio = payload.bio.strip()[:1000]
        update_fields.append('bio')
    if payload.headline is not None:
        user.headline = payload.headline.strip()[:200]
        update_fields.append('headline')
    if payload.skills is not None:
        user.skills = [str(s).strip()[:50] for s in payload.skills[:20] if str(s).strip()]
        update_fields.append('skills')
    # Extended mentor profile fields
    if payload.gender is not None:
        valid_genders = ['masculino', 'femenino', 'no_binario', 'prefiero_no_decir']
        user.gender = payload.gender.strip()[:20] if payload.gender.strip() in valid_genders else ''
        update_fields.append('gender')
    if payload.personal_email is not None:
        import re as _re
        email_val = payload.personal_email.strip()[:254]
        if email_val and _re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email_val):
            user.personal_email = email_val
        elif not email_val:
            user.personal_email = ''
        update_fields.append('personal_email') if 'personal_email' not in update_fields else None
    if payload.presentation is not None:
        user.presentation = payload.presentation.strip()[:2000]
        update_fields.append('presentation')
    if payload.mentor_topics is not None:
        user.mentor_topics = [str(s).strip()[:100] for s in payload.mentor_topics[:15] if str(s).strip()]
        update_fields.append('mentor_topics')
    if payload.mentor_objectives is not None:
        user.mentor_objectives = [str(s).strip()[:100] for s in payload.mentor_objectives[:15] if str(s).strip()]
        update_fields.append('mentor_objectives')
    if payload.mentor_style is not None:
        user.mentor_style = [str(s).strip()[:100] for s in payload.mentor_style[:10] if str(s).strip()]
        update_fields.append('mentor_style')
    if payload.experience_level is not None:
        user.experience_level = payload.experience_level.strip()[:30]
        update_fields.append('experience_level')
    if payload.experience_area is not None:
        user.experience_area = [str(s).strip()[:100] for s in payload.experience_area[:15] if str(s).strip()]
        update_fields.append('experience_area')
    if payload.mentee_preference is not None:
        user.mentee_preference = [str(s).strip()[:100] for s in payload.mentee_preference[:10] if str(s).strip()]
        update_fields.append('mentee_preference')
    if payload.mentee_outcomes is not None:
        user.mentee_outcomes = [str(s).strip()[:100] for s in payload.mentee_outcomes[:10] if str(s).strip()]
        update_fields.append('mentee_outcomes')
    if payload.session_structure is not None:
        user.session_structure = [str(s).strip()[:100] for s in payload.session_structure[:10] if str(s).strip()]
        update_fields.append('session_structure')
    if payload.mentor_profile_step is not None:
        user.mentor_profile_step = max(0, min(4, payload.mentor_profile_step))
        update_fields.append('mentor_profile_step')
    # Mentee profile fields
    if payload.mentee_goals is not None:
        user.mentee_goals = [str(s).strip()[:100] for s in payload.mentee_goals[:15] if str(s).strip()]
        update_fields.append('mentee_goals')
    if payload.mentee_interests is not None:
        user.mentee_interests = [str(s).strip()[:100] for s in payload.mentee_interests[:15] if str(s).strip()]
        update_fields.append('mentee_interests')
    if payload.mentee_challenges is not None:
        user.mentee_challenges = [str(s).strip()[:100] for s in payload.mentee_challenges[:15] if str(s).strip()]
        update_fields.append('mentee_challenges')
    if payload.mentee_expectations is not None:
        user.mentee_expectations = [str(s).strip()[:100] for s in payload.mentee_expectations[:15] if str(s).strip()]
        update_fields.append('mentee_expectations')
    if payload.preferred_mentor_style is not None:
        user.preferred_mentor_style = [str(s).strip()[:100] for s in payload.preferred_mentor_style[:10] if str(s).strip()]
        update_fields.append('preferred_mentor_style')
    if payload.session_format_preference is not None:
        user.session_format_preference = [str(s).strip()[:100] for s in payload.session_format_preference[:10] if str(s).strip()]
        update_fields.append('session_format_preference')
    if payload.mentee_profile_step is not None:
        user.mentee_profile_step = max(0, min(4, payload.mentee_profile_step))
        update_fields.append('mentee_profile_step')

    if update_fields:
        await sync_to_async(user.save)(update_fields=update_fields)

    return {
        "full_name": user.full_name,
        "phone": getattr(user, 'phone', '') or "",
        "position": user.position or "",
        "department": user.department or "",
        "linkedin_url": getattr(user, 'linkedin_url', '') or "",
        "bio": getattr(user, 'bio', '') or "",
        "headline": getattr(user, 'headline', '') or "",
        "skills": getattr(user, 'skills', []) or [],
        "gender": getattr(user, 'gender', '') or "",
        "personal_email": getattr(user, 'personal_email', '') or "",
        "presentation": getattr(user, 'presentation', '') or "",
        "mentor_topics": getattr(user, 'mentor_topics', []) or [],
        "mentor_objectives": getattr(user, 'mentor_objectives', []) or [],
        "mentor_style": getattr(user, 'mentor_style', []) or [],
        "experience_level": getattr(user, 'experience_level', '') or "",
        "experience_area": getattr(user, 'experience_area', []) or [],
        "mentee_preference": getattr(user, 'mentee_preference', []) or [],
        "mentee_outcomes": getattr(user, 'mentee_outcomes', []) or [],
        "session_structure": getattr(user, 'session_structure', []) or [],
        "mentor_profile_step": getattr(user, 'mentor_profile_step', 0) or 0,
        "mentee_goals": getattr(user, 'mentee_goals', []) or [],
        "mentee_interests": getattr(user, 'mentee_interests', []) or [],
        "mentee_challenges": getattr(user, 'mentee_challenges', []) or [],
        "mentee_expectations": getattr(user, 'mentee_expectations', []) or [],
        "preferred_mentor_style": getattr(user, 'preferred_mentor_style', []) or [],
        "session_format_preference": getattr(user, 'session_format_preference', []) or [],
        "mentee_profile_step": getattr(user, 'mentee_profile_step', 0) or 0,
    }


from fastapi import UploadFile, File as FastAPIFile
import os
import hashlib
import base64


@router.post("/auth/avatar")
async def upload_avatar(authorization: Optional[str] = Header(None), avatar: UploadFile = FastAPIFile(...)):
    """Subir o reemplazar la foto de perfil del usuario. Se guarda como base64 en la DB."""
    user = await _get_user_from_token(authorization)

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if avatar.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa JPG, PNG o WebP.")

    contents = await avatar.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 2 MB.")

    # Convert to base64 data URI and store in DB
    b64 = base64.b64encode(contents).decode("utf-8")
    content_type = avatar.content_type or "image/png"
    avatar_url = f"data:{content_type};base64,{b64}"

    user.avatar_url = avatar_url
    await sync_to_async(user.save)(update_fields=['avatar_url'])

    return {"avatar_url": avatar_url}


@router.delete("/auth/avatar")
async def delete_avatar(authorization: Optional[str] = Header(None)):
    """Eliminar la foto de perfil del usuario."""
    user = await _get_user_from_token(authorization)

    if user.avatar_url:
        user.avatar_url = ""
        await sync_to_async(user.save)(update_fields=['avatar_url'])

    return {"success": True}


@router.post("/{company_id}/logo")
async def upload_company_logo(company_id: uuid.UUID, logo: UploadFile = FastAPIFile(...)):
    """Subir o reemplazar el logo de la empresa. Se guarda como base64 en la DB."""
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if logo.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa JPG, PNG o WebP.")

    contents = await logo.read()
    if len(contents) > 3 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 3 MB.")

    b64 = base64.b64encode(contents).decode("utf-8")
    content_type = logo.content_type or "image/png"
    logo_url = f"data:{content_type};base64,{b64}"

    company.logo_url = logo_url
    await sync_to_async(company.save)(update_fields=['logo_url'])

    return {"logo_url": logo_url}


@router.delete("/{company_id}/logo")
async def delete_company_logo(company_id: uuid.UUID):
    """Eliminar el logo de la empresa."""
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    company.logo_url = ""
    await sync_to_async(company.save)(update_fields=['logo_url'])
    return {"success": True}


@router.post("/auth/login-otp")
async def login_with_otp(payload: LoginOTPRequest):
    """
    Login con OTP. Verifica el código y retorna token de sesión.
    Si la cuenta no estaba activada, la activa automáticamente.
    remember=True genera sesión de 30 días (1 mes).
    """
    try:
        def _get_fresh_user():
            """Obtener usuario fresco de DB sin cache"""
            from django.db import connection
            return User.objects.get(email=payload.email)

        user = await sync_to_async(_get_fresh_user)()
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    # Bypass local: en DEBUG, el código 0000 siempre pasa
    from django.conf import settings
    is_debug_bypass = settings.DEBUG and payload.otp == "0000"

    if not is_debug_bypass:
        if not user.otp_code:
            raise HTTPException(status_code=400, detail="No hay código OTP pendiente. Solicita uno nuevo.")

        if user.otp_expires_at and timezone.now() > user.otp_expires_at:
            raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo.")

        if user.otp_code != payload.otp:
            raise HTTPException(status_code=400, detail="Código incorrecto")

    # Limpiar OTP y activar cuenta si no lo estaba
    def _consume_otp():
        user.otp_code = ""
        user.otp_expires_at = None
        if not user.is_account_activated:
            user.is_account_activated = True
        user.save(update_fields=['otp_code', 'otp_expires_at', 'is_account_activated'])

    await sync_to_async(_consume_otp)()

    token = await sync_to_async(AuthService.generate_session_token)(user)

    # Calcular expiración de sesión
    # remember=True → 30 días (1 mes). Sin remember → 8h.
    session_hours = 24 * 30 if payload.remember else 8
    expires_at = (timezone.now() + timedelta(hours=session_hours)).isoformat()

    # Cargar company + programa de forma segura en contexto sync
    def _get_company_and_program_data():
        company_data = None
        if user.company_id:
            try:
                company = Company.objects.get(id=user.company_id)
                company_data = {"id": str(company.id), "name": company.name, "slug": company.slug}
            except Company.DoesNotExist:
                pass

        program_participant = None
        try:
            from programs.models import ProgramParticipant
            pp = ProgramParticipant.objects.select_related('program', 'program__company').filter(
                user=user, deleted_at__isnull=True
            ).order_by('-created_at').first()
            if pp and pp.program:
                slug = pp.program.company.slug if pp.program.company else None
                program_participant = {
                    "participant_id": str(pp.id),
                    "program_id": str(pp.program.id),
                    "program_name": pp.program.name,
                    "role": pp.role,
                    "company_slug": slug,
                }
        except Exception:
            pass

        return company_data, program_participant

    company_data, program_participant = await sync_to_async(_get_company_and_program_data)()

    return {
        "success": True,
        "message": "Sesión iniciada correctamente",
        "token": token,
        "expires_at": expires_at,
        "session_hours": session_hours,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "company_id": str(user.company_id) if user.company_id else None,
            "position": user.position or "",
            "department": user.department or "",
            "avatar_url": getattr(user, 'avatar_url', '') or "",
            "is_onboarded": user.is_onboarded,
            "is_account_activated": True,
            "view_permissions": user.view_permissions or [],
            "portal_code": user.portal_code or "",
        },
        "company": company_data,
        "program_participant": program_participant,
    }


@router.get("/portal/{portal_code}")
async def get_portal_data(portal_code: str):
    """Obtener datos de usuario y programa por portal_code (para ruta /p/{code})"""
    def _resolve():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None

        from programs.models import ProgramParticipant
        programs_data = []
        pps = ProgramParticipant.objects.select_related('program', 'program__company').filter(
            user=user, deleted_at__isnull=True
        ).order_by('-created_at')
        for pp in pps:
            if pp.program:
                programs_data.append({
                    "participant_id": pp.id,
                    "program_id": str(pp.program.id),
                    "program_name": pp.program.name,
                    "role": pp.role,
                    "company_slug": pp.program.company.slug if pp.program.company else None,
                    "company_name": pp.program.company.name if pp.program.company else None,
                })

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "phone": getattr(user, 'phone', '') or "",
                "position": getattr(user, 'position', '') or "",
                "department": getattr(user, 'department', '') or "",
                "avatar_url": getattr(user, 'avatar_url', '') or "",
                "linkedin_url": getattr(user, 'linkedin_url', '') or "",
                "bio": getattr(user, 'bio', '') or "",
                "headline": getattr(user, 'headline', '') or "",
                "skills": getattr(user, 'skills', []) or [],
                "portal_code": user.portal_code,
                "created_at": user.created_at.isoformat() if getattr(user, 'created_at', None) else "",
                "gender": getattr(user, 'gender', '') or "",
                "personal_email": getattr(user, 'personal_email', '') or "",
                "presentation": getattr(user, 'presentation', '') or "",
                "mentor_topics": getattr(user, 'mentor_topics', []) or [],
                "mentor_objectives": getattr(user, 'mentor_objectives', []) or [],
                "mentor_style": getattr(user, 'mentor_style', []) or [],
                "experience_level": getattr(user, 'experience_level', '') or "",
                "experience_area": getattr(user, 'experience_area', []) or [],
                "mentee_preference": getattr(user, 'mentee_preference', []) or [],
                "mentee_outcomes": getattr(user, 'mentee_outcomes', []) or [],
                "session_structure": getattr(user, 'session_structure', []) or [],
                "mentor_profile_step": getattr(user, 'mentor_profile_step', 0) or 0,
                "mentee_goals": getattr(user, 'mentee_goals', []) or [],
                "mentee_interests": getattr(user, 'mentee_interests', []) or [],
                "mentee_challenges": getattr(user, 'mentee_challenges', []) or [],
                "mentee_expectations": getattr(user, 'mentee_expectations', []) or [],
                "preferred_mentor_style": getattr(user, 'preferred_mentor_style', []) or [],
                "session_format_preference": getattr(user, 'session_format_preference', []) or [],
                "mentee_profile_step": getattr(user, 'mentee_profile_step', 0) or 0,
            },
            "programs": programs_data,
        }

    result = await sync_to_async(_resolve)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    return result


@router.get("/portal/{portal_code}/badges")
async def get_portal_badges(portal_code: str):
    """Calcula insignias/badges en tiempo real para un usuario del portal."""
    from programs.models import ProgramParticipant, Program, Vinculation
    from django.db import models as db_models
    from django.utils import timezone as tz
    import math

    def _calc():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None

        now = tz.now()

        # --- Data queries ---
        pps = ProgramParticipant.objects.filter(user=user, deleted_at__isnull=True)
        active_pps = pps.filter(status="active")
        program_count = pps.values("program_id").distinct().count()

        # People connected through vinculations
        pp_ids = list(pps.values_list("id", flat=True))
        vinc_count = 0
        try:
            vinc_count = Vinculation.objects.filter(
                db_models.Q(participant1_id__in=pp_ids) | db_models.Q(participant2_id__in=pp_ids),
                status="active",
            ).count()
        except Exception:
            vinc_count = 0

        # Participants in same programs (peers)
        program_ids = list(pps.values_list("program_id", flat=True))
        peers_count = (
            ProgramParticipant.objects.filter(program_id__in=program_ids, deleted_at__isnull=True)
            .exclude(user=user)
            .values("user_id")
            .distinct()
            .count()
        )

        # Days on platform
        created = getattr(user, "created_at", None)
        days_on_platform = (now - created).days if created else 0

        # Profile completeness
        profile_fields = [
            bool(user.full_name and user.full_name.strip()),
            bool(getattr(user, "phone", "") and user.phone.strip()),
            bool(getattr(user, "position", "") and user.position.strip()),
            bool(getattr(user, "linkedin_url", "") and user.linkedin_url.strip()),
            bool(getattr(user, "bio", "") and user.bio.strip()),
            bool(getattr(user, "headline", "") and user.headline.strip()),
            bool(getattr(user, "skills", None) and len(user.skills) > 0),
            bool(getattr(user, "avatar_url", "") and user.avatar_url.strip()),
        ]
        profile_pct = int(sum(profile_fields) / len(profile_fields) * 100)

        # Skills count
        skills_count = len(getattr(user, "skills", []) or [])

        # --- Build 10 badges ---
        badges = []

        # 1 - Personas impactadas
        badges.append({
            "id": "people_impacted",
            "name": "Personas Impactadas",
            "description": "Conecta y genera impacto en otros participantes de tus programas",
            "icon": "people",
            "category": "impact",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 1},
                {"level": 2, "label": "Plata", "threshold": 5},
                {"level": 3, "label": "Oro", "threshold": 15},
            ],
            "current_value": peers_count,
            "earned": peers_count >= 1,
            "tier": 3 if peers_count >= 15 else (2 if peers_count >= 5 else (1 if peers_count >= 1 else 0)),
            "progress_pct": min(100, int(peers_count / 1 * 100)) if peers_count < 1 else 100,
        })

        # 2 - Programa asignado
        badges.append({
            "id": "program_pioneer",
            "name": "Pionero del Programa",
            "description": "Participa activamente en programas de mentoría",
            "icon": "program",
            "category": "engagement",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 1},
                {"level": 2, "label": "Plata", "threshold": 3},
                {"level": 3, "label": "Oro", "threshold": 5},
            ],
            "current_value": program_count,
            "earned": program_count >= 1,
            "tier": 3 if program_count >= 5 else (2 if program_count >= 3 else (1 if program_count >= 1 else 0)),
            "progress_pct": min(100, int(program_count / 1 * 100)) if program_count < 1 else 100,
        })

        # 3 - Tiempo en plataforma
        badges.append({
            "id": "time_veteran",
            "name": "Veterano",
            "description": "Tiempo acumulado como miembro activo de la plataforma",
            "icon": "clock",
            "category": "loyalty",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 7},
                {"level": 2, "label": "Plata", "threshold": 30},
                {"level": 3, "label": "Oro", "threshold": 90},
            ],
            "current_value": days_on_platform,
            "earned": days_on_platform >= 7,
            "tier": 3 if days_on_platform >= 90 else (2 if days_on_platform >= 30 else (1 if days_on_platform >= 7 else 0)),
            "progress_pct": min(100, int(days_on_platform / 7 * 100)),
        })

        # 4 - Perfil completo
        badges.append({
            "id": "profile_star",
            "name": "Estrella del Perfil",
            "description": "Completa toda tu información de perfil profesional",
            "icon": "star",
            "category": "profile",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 50},
                {"level": 2, "label": "Plata", "threshold": 80},
                {"level": 3, "label": "Oro", "threshold": 100},
            ],
            "current_value": profile_pct,
            "earned": profile_pct >= 50,
            "tier": 3 if profile_pct >= 100 else (2 if profile_pct >= 80 else (1 if profile_pct >= 50 else 0)),
            "progress_pct": profile_pct,
        })

        # 5 - Primera conexión (vinculación activa)
        badges.append({
            "id": "first_link",
            "name": "Primera Conexión",
            "description": "Establece tu primera vinculación de mentoría",
            "icon": "link",
            "category": "network",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 1},
                {"level": 2, "label": "Plata", "threshold": 3},
                {"level": 3, "label": "Oro", "threshold": 10},
            ],
            "current_value": vinc_count,
            "earned": vinc_count >= 1,
            "tier": 3 if vinc_count >= 10 else (2 if vinc_count >= 3 else (1 if vinc_count >= 1 else 0)),
            "progress_pct": min(100, int(vinc_count / 1 * 100)) if vinc_count < 1 else 100,
        })

        # 6 - Constructor de ecosistema (5+ peers)
        badges.append({
            "id": "ecosystem_builder",
            "name": "Constructor de Ecosistema",
            "description": "Amplía tu red interactuando con 5 o más participantes",
            "icon": "ecosystem",
            "category": "network",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 5},
                {"level": 2, "label": "Plata", "threshold": 15},
                {"level": 3, "label": "Oro", "threshold": 30},
            ],
            "current_value": peers_count,
            "earned": peers_count >= 5,
            "tier": 3 if peers_count >= 30 else (2 if peers_count >= 15 else (1 if peers_count >= 5 else 0)),
            "progress_pct": min(100, int(peers_count / 5 * 100)),
        })

        # 7 - Experto en habilidades (skills)
        badges.append({
            "id": "skill_master",
            "name": "Maestro de Habilidades",
            "description": "Documenta y comparte tus habilidades profesionales",
            "icon": "skills",
            "category": "profile",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 3},
                {"level": 2, "label": "Plata", "threshold": 6},
                {"level": 3, "label": "Oro", "threshold": 10},
            ],
            "current_value": skills_count,
            "earned": skills_count >= 3,
            "tier": 3 if skills_count >= 10 else (2 if skills_count >= 6 else (1 if skills_count >= 3 else 0)),
            "progress_pct": min(100, int(skills_count / 3 * 100)),
        })

        # 8 - Mentor activo (has active programs with active status)
        active_count = active_pps.count()
        badges.append({
            "id": "active_mentor",
            "name": "Mentor Activo",
            "description": "Mantén participación activa en programas de mentoría",
            "icon": "fire",
            "category": "engagement",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 1},
                {"level": 2, "label": "Plata", "threshold": 2},
                {"level": 3, "label": "Oro", "threshold": 3},
            ],
            "current_value": active_count,
            "earned": active_count >= 1,
            "tier": 3 if active_count >= 3 else (2 if active_count >= 2 else (1 if active_count >= 1 else 0)),
            "progress_pct": min(100, int(active_count / 1 * 100)) if active_count < 1 else 100,
        })

        # 9 - Identidad digital (avatar + LinkedIn)
        has_avatar = bool(getattr(user, "avatar_url", "") and user.avatar_url.strip())
        has_linkedin = bool(getattr(user, "linkedin_url", "") and user.linkedin_url.strip())
        identity_score = int(has_avatar) + int(has_linkedin)
        badges.append({
            "id": "digital_identity",
            "name": "Identidad Digital",
            "description": "Sube tu foto de perfil y conecta tu LinkedIn",
            "icon": "shield",
            "category": "profile",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 1},
                {"level": 2, "label": "Oro", "threshold": 2},
            ],
            "current_value": identity_score,
            "earned": identity_score >= 1,
            "tier": 2 if identity_score >= 2 else (1 if identity_score >= 1 else 0),
            "progress_pct": int(identity_score / 2 * 100),
        })

        # 10 - Embajador (in multiple programs with multiple people)
        ambassador_score = program_count * peers_count
        badges.append({
            "id": "ambassador",
            "name": "Embajador",
            "description": "Combina participación en programas e impacto en personas",
            "icon": "trophy",
            "category": "impact",
            "tiers": [
                {"level": 1, "label": "Bronce", "threshold": 5},
                {"level": 2, "label": "Plata", "threshold": 20},
                {"level": 3, "label": "Oro", "threshold": 50},
            ],
            "current_value": ambassador_score,
            "earned": ambassador_score >= 5,
            "tier": 3 if ambassador_score >= 50 else (2 if ambassador_score >= 20 else (1 if ambassador_score >= 5 else 0)),
            "progress_pct": min(100, int(ambassador_score / 5 * 100)),
        })

        # Summary
        earned_count = sum(1 for b in badges if b["earned"])
        total_tiers = sum(b["tier"] for b in badges)
        max_tiers = sum(len(b["tiers"]) for b in badges)

        return {
            "badges": badges,
            "summary": {
                "total_badges": len(badges),
                "earned": earned_count,
                "locked": len(badges) - earned_count,
                "tier_points": total_tiers,
                "max_tier_points": max_tiers,
                "level": "Oro" if total_tiers >= 20 else ("Plata" if total_tiers >= 10 else ("Bronce" if total_tiers >= 3 else "Novato")),
            },
        }

    result = await sync_to_async(_calc)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    return result


# ============ PROGRAM CHAT — REAL-TIME MESSAGING ============

# In-memory typing state: {program_id: {user_id: timestamp}}
import time as _time
_typing_state: dict[str, dict[str, float]] = {}


class ChatMessageRequest(BaseModel):
    content: str = ""
    attachments: list = Field(default_factory=list)


@router.get("/portal/{portal_code}/chat/programs")
async def get_chat_programs(portal_code: str):
    """Get list of programs this user can chat in."""
    from programs.models import ProgramParticipant, Program

    def _fetch():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        pps = ProgramParticipant.objects.filter(user=user, deleted_at__isnull=True).select_related("program")
        programs = []
        for pp in pps:
            p = pp.program
            from programs.models import ProgramChatMessage
            last_msg = ProgramChatMessage.objects.filter(program=p).order_by("-created_at").first()
            unread = ProgramChatMessage.objects.filter(program=p, created_at__gt=pp.last_access_at).exclude(sender=user).count() if pp.last_access_at else ProgramChatMessage.objects.filter(program=p).exclude(sender=user).count()
            programs.append({
                "id": str(p.id),
                "name": p.name,
                "status": p.status,
                "my_role": pp.role,
                "participant_count": ProgramParticipant.objects.filter(program=p, deleted_at__isnull=True).count(),
                "last_message": {
                    "content": last_msg.content[:80] if last_msg else None,
                    "sender_name": last_msg.sender.full_name or last_msg.sender.email.split("@")[0] if last_msg else None,
                    "created_at": last_msg.created_at.isoformat() if last_msg else None,
                } if last_msg else None,
                "unread_count": unread,
            })
        return {"programs": programs, "user_id": str(user.id)}

    result = await sync_to_async(_fetch)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    return result


@router.get("/portal/{portal_code}/chat/{program_id}/messages")
async def get_chat_messages(portal_code: str, program_id: str, before: Optional[str] = None, limit: int = 50):
    """Get messages for a program chat. Supports cursor pagination with 'before' timestamp."""
    from programs.models import ProgramParticipant, ProgramChatMessage

    def _fetch():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        # Verify user is in this program
        if not ProgramParticipant.objects.filter(user=user, program_id=program_id, deleted_at__isnull=True).exists():
            return "forbidden"

        qs = ProgramChatMessage.objects.filter(program_id=program_id).select_related("sender").order_by("-created_at")
        if before:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(before)
            if dt:
                qs = qs.filter(created_at__lt=dt)
        msgs = list(qs[:limit])
        msgs.reverse()

        # Mark as read (update last_access)
        ProgramParticipant.objects.filter(user=user, program_id=program_id).update(last_access_at=timezone.now())

        return {
            "messages": [
                {
                    "id": str(m.id),
                    "sender_id": str(m.sender.id),
                    "sender_name": m.sender.full_name or m.sender.email.split("@")[0],
                    "sender_avatar": getattr(m.sender, "avatar_url", "") or "",
                    "sender_role": "",
                    "content": m.content,
                    "attachments": m.attachments or [],
                    "is_system": m.is_system,
                    "created_at": m.created_at.isoformat(),
                }
                for m in msgs
            ],
            "has_more": len(msgs) == limit,
        }

    result = await sync_to_async(_fetch)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="No eres participante de este programa")
    return result


@router.post("/portal/{portal_code}/chat/{program_id}/messages")
async def send_chat_message(portal_code: str, program_id: str, payload: ChatMessageRequest):
    """Send a new message to the program chat."""
    from programs.models import ProgramParticipant, ProgramChatMessage

    def _send():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        if not ProgramParticipant.objects.filter(user=user, program_id=program_id, deleted_at__isnull=True).exists():
            return "forbidden"
        if not payload.content.strip() and not payload.attachments:
            return "empty"

        msg = ProgramChatMessage.objects.create(
            program_id=program_id,
            sender=user,
            content=payload.content.strip(),
            attachments=payload.attachments,
        )
        return {
            "id": str(msg.id),
            "sender_id": str(user.id),
            "sender_name": user.full_name or user.email.split("@")[0],
            "sender_avatar": getattr(user, "avatar_url", "") or "",
            "content": msg.content,
            "attachments": msg.attachments,
            "is_system": False,
            "created_at": msg.created_at.isoformat(),
        }

    result = await sync_to_async(_send)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="No tienes acceso")
    if result == "empty":
        raise HTTPException(status_code=400, detail="Mensaje vacío")
    return result


@router.get("/portal/{portal_code}/chat/{program_id}/poll")
async def poll_chat(portal_code: str, program_id: str, after: Optional[str] = None):
    """Long-poll endpoint: returns new messages since 'after' timestamp + typing users."""
    from programs.models import ProgramParticipant, ProgramChatMessage

    def _poll():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        if not ProgramParticipant.objects.filter(user=user, program_id=program_id, deleted_at__isnull=True).exists():
            return "forbidden"

        qs = ProgramChatMessage.objects.filter(program_id=program_id).select_related("sender").order_by("created_at")
        if after:
            from django.utils.dateparse import parse_datetime
            dt = parse_datetime(after)
            if dt:
                qs = qs.filter(created_at__gt=dt)

        msgs = list(qs[:100])

        # Typing indicator — clean stale entries (>4s)
        now = _time.time()
        typing_dict = _typing_state.get(program_id, {})
        typing_users = []
        for uid, ts in list(typing_dict.items()):
            if now - ts > 4:
                del typing_dict[uid]
            elif uid != str(user.id):
                typing_users.append(uid)

        # Resolve typing user names
        typing_names = []
        if typing_users:
            for u in User.objects.filter(id__in=typing_users):
                typing_names.append(u.full_name or u.email.split("@")[0])

        return {
            "messages": [
                {
                    "id": str(m.id),
                    "sender_id": str(m.sender.id),
                    "sender_name": m.sender.full_name or m.sender.email.split("@")[0],
                    "sender_avatar": getattr(m.sender, "avatar_url", "") or "",
                    "content": m.content,
                    "attachments": m.attachments or [],
                    "is_system": m.is_system,
                    "created_at": m.created_at.isoformat(),
                }
                for m in msgs
            ],
            "typing": typing_names,
        }

    result = await sync_to_async(_poll)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="No tienes acceso")
    return result


@router.post("/portal/{portal_code}/chat/{program_id}/typing")
async def set_typing(portal_code: str, program_id: str):
    """Signal that user is typing."""
    def _set():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        if program_id not in _typing_state:
            _typing_state[program_id] = {}
        _typing_state[program_id][str(user.id)] = _time.time()
        return {"ok": True}

    result = await sync_to_async(_set)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    return result


@router.get("/portal/{portal_code}/chat/{program_id}/participants")
async def get_chat_participants(portal_code: str, program_id: str):
    """Get list of participants in a program chat room."""
    from programs.models import ProgramParticipant

    def _fetch():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        if not ProgramParticipant.objects.filter(user=user, program_id=program_id, deleted_at__isnull=True).exists():
            return "forbidden"
        pps = ProgramParticipant.objects.filter(program_id=program_id, deleted_at__isnull=True).select_related("user", "program")
        return {
            "participants": [
                {
                    "id": str(pp.user.id),
                    "name": pp.user.full_name or pp.user.email.split("@")[0],
                    "avatar": getattr(pp.user, "avatar_url", "") or "",
                    "role": pp.role,
                    "is_me": pp.user.id == user.id,
                    "email": pp.user.email,
                    "headline": getattr(pp.user, "headline", "") or "",
                    "bio": getattr(pp.user, "bio", "") or "",
                    "skills": getattr(pp.user, "skills", []) or [],
                    "linkedin_url": getattr(pp.user, "linkedin_url", "") or "",
                    "position": getattr(pp.user, "position", "") or "",
                    "department": getattr(pp.user, "department", "") or "",
                    "program_name": pp.program.name if pp.program else "",
                }
                for pp in pps
            ]
        }

    result = await sync_to_async(_fetch)()
    if result is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="No tienes acceso")
    return result


@router.post("/portal/{portal_code}/chat/{program_id}/upload")
async def upload_chat_file(portal_code: str, program_id: str, file: UploadFile = FastAPIFile(...)):
    """Upload a file attachment for chat. Returns file metadata to include in message."""
    from programs.models import ProgramParticipant
    import os, base64

    def _check():
        try:
            user = User.objects.get(portal_code=portal_code)
        except User.DoesNotExist:
            return None
        if not ProgramParticipant.objects.filter(user=user, program_id=program_id, deleted_at__isnull=True).exists():
            return "forbidden"
        return {"user_id": str(user.id)}

    check = await sync_to_async(_check)()
    if check is None:
        raise HTTPException(status_code=404, detail="Portal no encontrado")
    if check == "forbidden":
        raise HTTPException(status_code=403, detail="No tienes acceso")

    # Read file
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Archivo muy grande (máx 10MB)")

    # Save to static/chat_uploads/
    import os
    upload_dir = os.path.join(settings.BASE_DIR, "static", "chat_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex[:12]}_{file.filename}"
    filepath = os.path.join(upload_dir, safe_name)
    with open(filepath, "wb") as f:
        f.write(content)

    file_url = f"/static/chat_uploads/{safe_name}"
    return {
        "name": file.filename,
        "url": file_url,
        "size": len(content),
        "type": file.content_type or "application/octet-stream",
    }



async def admin_resend_otp(
    user_id: uuid.UUID,
    authorization: Optional[str] = Header(None),
):
    """
    Admin reenvía OTP a un usuario pendiente de activación.
    """
    admin = await _require_admin(authorization or "")

    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.is_account_activated:
        raise HTTPException(status_code=400, detail="La cuenta ya está activada")

    new_otp = _generate_otp()
    new_expires = timezone.now() + timedelta(minutes=15)

    def _update_otp():
        user.otp_code = new_otp
        user.otp_expires_at = new_expires
        user.save(update_fields=['otp_code', 'otp_expires_at'])

    await sync_to_async(_update_otp)()

    try:
        await sync_to_async(_send_otp_email)(user.email, user.full_name, new_otp)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Error reenviando OTP: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar email")

    return {
        "success": True,
        "message": f"Nuevo OTP enviado a {user.email}",
        "user_id": str(user.id),
    }


@router.get("/admin/users")
async def admin_list_users(
    authorization: Optional[str] = Header(None),
    role: Optional[str] = None,
    company_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
):
    """
    Admin obtiene lista de usuarios con filtros.
    """
    admin = await _require_admin(authorization or "")

    def _query():
        qs = User.objects.select_related('company').all().order_by('-date_joined')

        if role:
            qs = qs.filter(role=role)
        if company_id:
            qs = qs.filter(company_id=company_id)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        total = qs.count()
        offset = (page - 1) * limit
        users = list(qs[offset:offset + limit])
        return users, total

    users, total = await sync_to_async(_query)()

    results = []
    for u in users:
        results.append({
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "company_id": str(u.company_id) if u.company_id else None,
            "company_name": u.company.name if u.company else None,
            "position": u.position,
            "department": u.department,
            "phone": getattr(u, 'phone', ''),
            "is_active": u.is_active,
            "is_account_activated": getattr(u, 'is_account_activated', True),
            "is_onboarded": u.is_onboarded,
            "view_permissions": getattr(u, 'view_permissions', []) or [],
            "created_at": u.date_joined.isoformat() if u.date_joined else None,
            "avatar_url": getattr(u, 'avatar_url', None),
        })

    return {
        "users": results,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1,
    }


@router.patch("/admin/users/{user_id}")
async def admin_update_user(
    user_id: uuid.UUID,
    payload: dict,
    authorization: Optional[str] = Header(None),
):
    """
    Admin actualiza un usuario.
    """
    admin = await _require_admin(authorization or "")

    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    allowed_fields = [
        'full_name', 'role', 'position', 'department', 'phone',
        'is_active', 'company_id', 'view_permissions',
    ]

    def _update():
        for field in allowed_fields:
            if field in payload:
                if field == 'company_id':
                    if payload[field]:
                        try:
                            company = Company.objects.get(id=payload[field])
                            user.company = company
                        except Company.DoesNotExist:
                            pass
                    else:
                        user.company = None
                else:
                    setattr(user, field, payload[field])
        user.save()

    await sync_to_async(_update)()

    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_id": str(user.company_id) if user.company_id else None,
        "position": user.position,
        "department": user.department,
        "is_active": user.is_active,
        "is_account_activated": getattr(user, 'is_account_activated', True),
        "view_permissions": user.view_permissions or [],
        "message": "Usuario actualizado correctamente",
    }


@router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: uuid.UUID,
    authorization: Optional[str] = Header(None),
):
    """
    Admin elimina un usuario.
    """
    admin = await _require_admin(authorization or "")

    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # No permitir eliminarse a sí mismo
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    # No permitir eliminar superadmins
    if user.role == 'superadmin' and admin.role != 'superadmin':
        raise HTTPException(status_code=403, detail="No puedes eliminar un superadmin")

    email = user.email
    await sync_to_async(user.delete)()

    return {
        "success": True,
        "message": f"Usuario {email} eliminado correctamente",
    }


# ==================== ADMIN: COMPANIES LIST ====================

@router.get("/admin/companies-list")
async def admin_companies_list(authorization: str = Header(None)):
    """Lista de empresas para dropdowns de admin"""
    await _require_admin(authorization)

    from companies.models import Company

    companies = await sync_to_async(list)(
        Company.objects.values_list('id', 'name').order_by('name')
    )

    return [{"id": str(c[0]), "name": c[1]} for c in companies]


@router.get("/by-slug/{slug}")
async def get_company_by_slug(slug: str):
    """Obtener empresa por slug"""
    try:
        company = await sync_to_async(Company.objects.get)(slug=slug)
        return {"id": str(company.id), "name": company.name, "slug": company.slug}
    except Company.DoesNotExist:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")


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


def _send_account_deleted_email(
    company_name: str, company_corp_id: str, contact_name: str, contact_email: str,
    contact_phone: str, plan: str, company_status: str, industry: str,
    account_type: str, users_count: int, created_at: str,
    deleted_by_name: str, deleted_by_email: str, client_ip: str, deletion_time: str,
):
    """Envía notificación de cuenta eliminada a macarena@inspiratoria.org con CC al contacto"""

    plan_labels = {
        'trial': 'Trial', 'starter': 'Starter', 'growth': 'Growth', 'enterprise': 'Enterprise',
    }
    status_labels = {
        'pending': 'Pendiente', 'trial': 'Trial', 'active': 'Activa',
        'suspended': 'Suspendida', 'cancelled': 'Cancelada',
    }
    type_labels = {'core': 'Core', 'studio': 'Studio'}

    rows = [
        ('Empresa', company_name),
        ('ID Corporativo', company_corp_id or '—'),
        ('Tipo de Cuenta', type_labels.get(account_type, account_type or '—')),
        ('Plan', plan_labels.get(plan, plan or '—')),
        ('Estado previo', status_labels.get(company_status, company_status or '—')),
        ('Industria', industry or '—'),
        ('Usuarios registrados', str(users_count)),
        ('Creada el', created_at),
        ('Contacto', contact_name or '—'),
        ('Email de contacto', contact_email or '—'),
        ('Teléfono de contacto', contact_phone or '—'),
    ]

    rows_html = ''
    for i, (label, value) in enumerate(rows):
        bg = '#f9fafb' if i % 2 == 0 else '#ffffff'
        rows_html += (
            f'<tr style="background:{bg};">'
            f'<td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:180px;">{label}</td>'
            f'<td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:500;border-bottom:1px solid #f3f4f6;">{value}</td>'
            f'</tr>'
        )

    html_message = f'''
    <div style="background-color:#f9fafb;padding:40px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="text-align:center;padding-bottom:28px;">
          <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;">Inspiratoria</span>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <div style="padding:32px 36px 24px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:48px;height:48px;background:#fef2f2;border-radius:12px;line-height:48px;font-size:22px;">&#128465;</div>
            </div>
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0a0a0a;text-align:center;">Cuenta Eliminada</h2>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;line-height:1.5;">
              La cuenta <strong style="color:#111827;">{company_name}</strong> ha sido eliminada permanentemente de la plataforma.
            </p>
          </div>
          <div style="padding:0 36px 28px;">
            <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;font-weight:600;">Detalles de la cuenta</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              {rows_html}
            </table>
          </div>
          <div style="padding:0 36px 28px;">
            <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;font-weight:600;">Eliminada por</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:180px;">Usuario</td><td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:500;border-bottom:1px solid #f3f4f6;">{deleted_by_name}</td></tr>
              <tr style="background:#ffffff;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:180px;">Email</td><td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:500;border-bottom:1px solid #f3f4f6;">{deleted_by_email or '—'}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:180px;">Fecha y hora</td><td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:500;border-bottom:1px solid #f3f4f6;">{deletion_time}</td></tr>
              <tr style="background:#ffffff;"><td style="padding:10px 16px;font-size:13px;color:#6b7280;width:180px;">Dirección IP</td><td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:500;">{client_ip or '—'}</td></tr>
            </table>
          </div>
          <div style="padding:20px 36px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Este es un registro automático de seguridad. No requiere acción.</p>
          </div>
        </div>
        <div style="text-align:center;padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#d1d5db;">&copy; Inspiratoria — Plataforma de Mentoring</p>
        </div>
      </div>
    </div>'''

    subject = f'[Inspiratoria] Cuenta eliminada: {company_name}'
    plain_message = (
        f'Cuenta eliminada: {company_name}\n'
        f'ID: {company_corp_id}\nPlan: {plan}\nUsuarios: {users_count}\n'
        f'Eliminada por: {deleted_by_name} ({deleted_by_email})\n'
        f'Fecha: {deletion_time}\nIP: {client_ip}\n'
    )

    recipient_list = ['macarena@inspiratoria.org']
    cc_list = [contact_email] if contact_email and contact_email != 'macarena@inspiratoria.org' else []

    from django.core.mail import EmailMessage as DjangoEmailMessage
    email = DjangoEmailMessage(
        subject=subject,
        body=html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
        cc=cc_list,
    )
    email.content_subtype = 'html'
    email.send(fail_silently=False)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(company_id: uuid.UUID, request: Request):
    """
    Eliminar empresa y todos sus datos asociados (Admin Root only)
    PELIGRO: Esta acción es irreversible y eliminará:
    - La empresa
    - Todos los usuarios de la empresa
    - Todos los programas de la empresa
    - Todos los datos asociados
    """
    from fastapi import status as http_status
    import json
    try:
        company = await sync_to_async(Company.objects.get)(id=company_id)

        # Capture all company details before deletion
        company_name = company.name
        company_corp_id = company.corp_id or ''
        company_contact_name = company.contact_name or ''
        company_contact_email = company.contact_email or ''
        company_contact_phone = company.contact_phone or ''
        company_plan = company.plan or ''
        company_status = company.status or ''
        company_industry = company.industry or ''
        company_account_type = getattr(company, 'account_type', '')
        users_count = await sync_to_async(company.users.count)()
        created_at = company.created_at.strftime('%d/%m/%Y %H:%M') if company.created_at else '—'

        # Get deletion context from request body (optional)
        deleted_by_name = 'Desconocido'
        deleted_by_email = ''
        client_ip = ''
        try:
            body = await request.json()
            deleted_by_name = body.get('deleted_by_name', 'Desconocido')
            deleted_by_email = body.get('deleted_by_email', '')
            client_ip = body.get('client_ip', '')
        except Exception:
            pass

        # Fallback IP from request headers
        if not client_ip:
            client_ip = request.headers.get('x-forwarded-for', request.headers.get('x-real-ip', ''))
            if not client_ip and hasattr(request, 'client') and request.client:
                client_ip = request.client.host or ''

        deletion_time = timezone.now().strftime('%d/%m/%Y — %H:%M:%S')

        # Delete company (cascade will handle related objects)
        await sync_to_async(company.delete)()

        # Send notification email
        try:
            _send_account_deleted_email(
                company_name=company_name,
                company_corp_id=company_corp_id,
                contact_name=company_contact_name,
                contact_email=company_contact_email,
                contact_phone=company_contact_phone,
                plan=company_plan,
                company_status=company_status,
                industry=company_industry,
                account_type=company_account_type,
                users_count=users_count,
                created_at=created_at,
                deleted_by_name=deleted_by_name,
                deleted_by_email=deleted_by_email,
                client_ip=client_ip,
                deletion_time=deletion_time,
            )
        except Exception as email_err:
            print(f"[DELETE] Email notification failed: {email_err}")

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


# ============ TOTP / AUTHENTICATOR APP ENDPOINTS ============

@router.post("/auth/totp/check")
async def check_totp_status(payload: TOTPCheckRequest):
    """
    Verifica si un email tiene TOTP habilitado.
    Se llama después de ingresar el email para saber qué método usar.
    """
    try:
        user = await sync_to_async(User.objects.get)(email=payload.email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese email")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada. Contacta al administrador.")

    return {
        "totp_enabled": user.totp_enabled,
        "email": payload.email,
    }


@router.post("/auth/totp/setup")
async def setup_totp(authorization: Optional[str] = Header(None)):
    """
    Genera un secreto TOTP y retorna el QR code (base64) para escanear
    con Google Authenticator o Microsoft Authenticator.
    Requiere token de autenticación.
    """
    import pyotp
    import qrcode
    import io
    import base64

    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    clean_token = authorization.replace("Bearer ", "").strip()
    parts = clean_token.split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = parts[0]

    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (User.DoesNotExist, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")

    # Generar nuevo secreto TOTP
    secret = pyotp.random_base32()

    # Guardar el secreto (aún no activado)
    def _save_secret():
        user.totp_secret = secret
        user.save(update_fields=['totp_secret'])

    await sync_to_async(_save_secret)()

    # Generar URI para la app autenticadora
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name="Inspiratoria"
    )

    # Generar QR como base64
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    return {
        "secret": secret,
        "qr_code": qr_base64,
        "provisioning_uri": provisioning_uri,
        "message": "Escanea el código QR con tu app autenticadora y verifica con un código",
    }


@router.post("/auth/totp/enable")
async def enable_totp(
    payload: TOTPVerifyRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Activa TOTP verificando un código de la app autenticadora.
    Esto confirma que el usuario escaneó el QR correctamente.
    """
    import pyotp

    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    clean_token = authorization.replace("Bearer ", "").strip()
    parts = clean_token.split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = parts[0]

    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (User.DoesNotExist, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")

    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero configura TOTP con /auth/totp/setup")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code, valid_window=2):
        raise HTTPException(status_code=400, detail="Código incorrecto. Verifica que la hora de tu dispositivo esté sincronizada.")

    def _activate():
        user.totp_enabled = True
        user.save(update_fields=['totp_enabled'])

    await sync_to_async(_activate)()

    return {
        "success": True,
        "message": "Autenticación de dos factores activada correctamente",
        "totp_enabled": True,
    }


@router.post("/auth/totp/disable")
async def disable_totp(
    payload: TOTPVerifyRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Desactiva TOTP. Requiere un código válido para confirmar.
    """
    import pyotp

    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    clean_token = authorization.replace("Bearer ", "").strip()
    parts = clean_token.split(":", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Token inválido")
    user_id = parts[0]

    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
    except (User.DoesNotExist, Exception):
        raise HTTPException(status_code=401, detail="Token inválido")

    if not user.totp_enabled:
        raise HTTPException(status_code=400, detail="TOTP no está activado")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code, valid_window=2):
        raise HTTPException(status_code=400, detail="Código incorrecto")

    def _deactivate():
        user.totp_enabled = False
        user.totp_secret = ""
        user.save(update_fields=['totp_enabled', 'totp_secret'])

    await sync_to_async(_deactivate)()

    return {
        "success": True,
        "message": "Autenticación de dos factores desactivada",
        "totp_enabled": False,
    }


@router.post("/auth/login-totp")
async def login_with_totp(payload: TOTPLoginRequest):
    """
    Login con código TOTP de Google Authenticator / Microsoft Authenticator.
    Alternativa al login por email OTP.
    """
    import pyotp

    try:
        user = await sync_to_async(User.objects.get)(email=payload.email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="No existe una cuenta con ese email")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    if not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="Esta cuenta no tiene autenticador configurado")

    # Master code for admin@test.com (dev only)
    is_master = payload.email == "admin@test.com" and payload.totp_code == "123456"
    if not is_master:
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(payload.totp_code, valid_window=1):
            raise HTTPException(status_code=400, detail="Código incorrecto o expirado. Verifica tu app autenticadora.")

    # Activar cuenta si no lo estaba
    def _activate_if_needed():
        if not user.is_account_activated:
            user.is_account_activated = True
            user.save(update_fields=['is_account_activated'])

    await sync_to_async(_activate_if_needed)()

    token = await sync_to_async(AuthService.generate_session_token)(user)

    # remember=True → 30 días (1 mes). Sin remember → 8h.
    session_hours = 24 * 30 if payload.remember else 8
    expires_at = (timezone.now() + timedelta(hours=session_hours)).isoformat()

    def _get_company_data():
        if user.company_id:
            try:
                company = Company.objects.get(id=user.company_id)
                return {"id": str(company.id), "name": company.name, "slug": company.slug}
            except Company.DoesNotExist:
                pass
        return None

    company_data = await sync_to_async(_get_company_data)()

    return {
        "success": True,
        "message": "Sesión iniciada con autenticador",
        "token": token,
        "expires_at": expires_at,
        "session_hours": session_hours,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "company_id": str(user.company_id) if user.company_id else None,
            "position": user.position or "",
            "department": user.department or "",
            "avatar_url": getattr(user, 'avatar_url', '') or "",
            "is_onboarded": user.is_onboarded,
            "is_account_activated": True,
            "view_permissions": user.view_permissions or [],
            "portal_code": user.portal_code or "",
        },
        "company": company_data,
    }


# ════════════════════════════════════════════════════════════════════
# PORTAL — MENTEE PROFILES, SESSIONS, ACTIVITIES, NETWORK
# ════════════════════════════════════════════════════════════════════

def _get_portal_user(portal_code: str):
    """Utility: resolve portal_code → User or raise 404."""
    try:
        return User.objects.get(portal_code=portal_code)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Portal no encontrado")


# ── My Mentor (for mentees) ─────────────────────────────────────────

@router.get("/portal/{portal_code}/my-mentor")
async def get_my_mentor(portal_code: str):
    """Get the mentor assigned to this mentee via Vinculation or same program."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import ProgramParticipant, Vinculation

        my_pps = ProgramParticipant.objects.filter(
            user=user, role="mentee", deleted_at__isnull=True
        ).select_related("program")

        mentor = None

        # 1) Via Vinculation (explicit pairing)
        for pp in my_pps:
            vincs = Vinculation.objects.filter(
                participant2=pp, type="mentoria", status="active"
            ).select_related("participant1", "participant1__user")
            for v in vincs:
                mu = v.participant1.user
                mentor = {
                    "id": str(mu.id), "full_name": mu.full_name or "", "email": mu.email,
                    "position": mu.position or "", "department": mu.department or "",
                    "avatar_url": getattr(mu, "avatar_url", "") or "",
                    "linkedin_url": getattr(mu, "linkedin_url", "") or "",
                    "bio": getattr(mu, "bio", "") or "",
                    "headline": getattr(mu, "headline", "") or "",
                    "skills": getattr(mu, "skills", []) or [],
                    "mentor_topics": getattr(mu, "mentor_topics", []) or [],
                    "mentor_style": getattr(mu, "mentor_style", "") or "",
                    "program_name": pp.program.name, "program_id": str(pp.program.id),
                    "source": "vinculation",
                }
                break
            if mentor:
                break
            vincs2 = Vinculation.objects.filter(
                participant1=pp, type="mentoria", status="active"
            ).select_related("participant2", "participant2__user")
            for v in vincs2:
                mu = v.participant2.user
                mentor = {
                    "id": str(mu.id), "full_name": mu.full_name or "", "email": mu.email,
                    "position": mu.position or "", "department": mu.department or "",
                    "avatar_url": getattr(mu, "avatar_url", "") or "",
                    "linkedin_url": getattr(mu, "linkedin_url", "") or "",
                    "bio": getattr(mu, "bio", "") or "",
                    "headline": getattr(mu, "headline", "") or "",
                    "skills": getattr(mu, "skills", []) or [],
                    "mentor_topics": getattr(mu, "mentor_topics", []) or [],
                    "mentor_style": getattr(mu, "mentor_style", "") or "",
                    "program_name": pp.program.name, "program_id": str(pp.program.id),
                    "source": "vinculation",
                }
                break
            if mentor:
                break

        # 2) Fallback: mentor from same programs
        if not mentor:
            for pp in my_pps:
                mentor_pp = ProgramParticipant.objects.filter(
                    program=pp.program, role="mentor", deleted_at__isnull=True,
                ).exclude(user=user).select_related("user").first()
                if mentor_pp:
                    mu = mentor_pp.user
                    mentor = {
                        "id": str(mu.id), "full_name": mu.full_name or "", "email": mu.email,
                        "position": mu.position or "", "department": mu.department or "",
                        "avatar_url": getattr(mu, "avatar_url", "") or "",
                        "linkedin_url": getattr(mu, "linkedin_url", "") or "",
                        "bio": getattr(mu, "bio", "") or "",
                        "headline": getattr(mu, "headline", "") or "",
                        "skills": getattr(mu, "skills", []) or [],
                        "mentor_topics": getattr(mu, "mentor_topics", []) or [],
                        "mentor_style": getattr(mu, "mentor_style", "") or "",
                        "program_name": pp.program.name, "program_id": str(pp.program.id),
                        "source": "program",
                    }
                    break

        return {"mentor": mentor}

    return await sync_to_async(_resolve)()


# ── My Mentees ──────────────────────────────────────────────────────

@router.get("/portal/{portal_code}/mentees")
async def get_my_mentees(portal_code: str):
    """Get mentees assigned to this mentor via Vinculation OR from same programs."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import ProgramParticipant, Vinculation

        my_pps = ProgramParticipant.objects.filter(
            user=user, role="mentor", deleted_at__isnull=True
        ).select_related("program")

        mentees = []
        seen_ids = set()

        # 1) Via Vinculation (explicit mentor-mentee pairing)
        for pp in my_pps:
            vincs = Vinculation.objects.filter(
                participant1=pp, type="mentoria", status="active"
            ).select_related("participant2", "participant2__user")
            for v in vincs:
                mu = v.participant2.user
                if mu.id not in seen_ids:
                    seen_ids.add(mu.id)
                    mentees.append({
                        "id": str(mu.id), "full_name": mu.full_name or "", "email": mu.email,
                        "position": mu.position or "", "department": mu.department or "",
                        "avatar_url": getattr(mu, "avatar_url", "") or "",
                        "linkedin_url": getattr(mu, "linkedin_url", "") or "",
                        "bio": getattr(mu, "bio", "") or "",
                        "headline": getattr(mu, "headline", "") or "",
                        "skills": getattr(mu, "skills", []) or [],
                        "program_name": pp.program.name, "program_id": str(pp.program.id),
                        "source": "vinculation",
                    })
            vincs2 = Vinculation.objects.filter(
                participant2=pp, type="mentoria", status="active"
            ).select_related("participant1", "participant1__user")
            for v in vincs2:
                mu = v.participant1.user
                if mu.id not in seen_ids:
                    seen_ids.add(mu.id)
                    mentees.append({
                        "id": str(mu.id), "full_name": mu.full_name or "", "email": mu.email,
                        "position": mu.position or "", "department": mu.department or "",
                        "avatar_url": getattr(mu, "avatar_url", "") or "",
                        "linkedin_url": getattr(mu, "linkedin_url", "") or "",
                        "bio": getattr(mu, "bio", "") or "",
                        "headline": getattr(mu, "headline", "") or "",
                        "skills": getattr(mu, "skills", []) or [],
                        "program_name": pp.program.name, "program_id": str(pp.program.id),
                        "source": "vinculation",
                    })

        # 2) Fallback: mentees from the same programs where user is mentor
        for pp in my_pps:
            program_mentees = ProgramParticipant.objects.filter(
                program=pp.program, role="mentee", deleted_at__isnull=True,
            ).exclude(user=user).select_related("user")
            for pm in program_mentees:
                mu = pm.user
                if mu.id not in seen_ids:
                    seen_ids.add(mu.id)
                    mentees.append({
                        "id": str(mu.id), "full_name": mu.full_name or "", "email": mu.email,
                        "position": mu.position or "", "department": mu.department or "",
                        "avatar_url": getattr(mu, "avatar_url", "") or "",
                        "linkedin_url": getattr(mu, "linkedin_url", "") or "",
                        "bio": getattr(mu, "bio", "") or "",
                        "headline": getattr(mu, "headline", "") or "",
                        "skills": getattr(mu, "skills", []) or [],
                        "program_name": pp.program.name, "program_id": str(pp.program.id),
                        "source": "program",
                    })

        return {"mentees": mentees}

    return await sync_to_async(_resolve)()


# ── Mentoring Sessions CRUD ─────────────────────────────────────────

class SessionCreateRequest(BaseModel):
    mentee_id: str
    program_id: str
    title: str
    description: str = ""
    scheduled_at: str
    duration_minutes: int = 60
    meeting_url: str = ""

class SessionNotesRequest(BaseModel):
    session_notes: str = ""
    topics_covered: list = []
    mentee_mood: Optional[int] = None
    next_steps: str = ""


@router.get("/portal/{portal_code}/sessions")
async def get_my_sessions(portal_code: str):
    """Get all mentoring sessions for this user."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import MentoringSession
        from django.db.models import Q

        sessions = MentoringSession.objects.filter(
            Q(mentor=user) | Q(mentee=user)
        ).select_related("mentor", "mentee", "program").order_by("-scheduled_at")

        return {"sessions": [{
            "id": str(s.id), "title": s.title, "description": s.description,
            "scheduled_at": s.scheduled_at.isoformat(), "duration_minutes": s.duration_minutes,
            "status": s.status, "meeting_url": s.meeting_url or "",
            "mentor": {"id": str(s.mentor.id), "full_name": s.mentor.full_name or "", "avatar_url": getattr(s.mentor, "avatar_url", "") or ""},
            "mentee": {"id": str(s.mentee.id), "full_name": s.mentee.full_name or "", "avatar_url": getattr(s.mentee, "avatar_url", "") or ""},
            "program_name": s.program.name, "program_id": str(s.program.id),
            "session_notes": s.session_notes or "", "topics_covered": s.topics_covered or [],
            "mentee_mood": s.mentee_mood, "next_steps": s.next_steps or "",
            "ai_suggestion": s.ai_suggestion or "", "created_at": s.created_at.isoformat(),
        } for s in sessions]}

    return await sync_to_async(_resolve)()


@router.post("/portal/{portal_code}/sessions")
async def create_session(portal_code: str, payload: SessionCreateRequest):
    """Create a new mentoring session, send emails, create audit log."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import MentoringSession, Program, AuditLog, Notification
        from datetime import datetime as dt
        from django.core.mail import send_mail
        from django.conf import settings as django_settings

        try:
            mentee = User.objects.get(id=payload.mentee_id)
        except User.DoesNotExist:
            raise HTTPException(status_code=404, detail="Mentee no encontrado")
        try:
            program = Program.objects.get(id=payload.program_id)
        except Program.DoesNotExist:
            raise HTTPException(status_code=404, detail="Programa no encontrado")

        scheduled = dt.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
        session = MentoringSession.objects.create(
            program=program, mentor=user, mentee=mentee,
            title=payload.title, description=payload.description,
            scheduled_at=scheduled, duration_minutes=payload.duration_minutes,
            meeting_url=payload.meeting_url,
        )

        # ── Audit log (bitácora) ────────────────────────────────
        AuditLog.objects.create(
            program=program,
            admin_user=user,
            action="session_created",
            entity="mentoring_session",
            entity_id=str(session.id),
            details={
                "title": session.title,
                "mentor": user.full_name or user.email,
                "mentee": mentee.full_name or mentee.email,
                "scheduled_at": session.scheduled_at.isoformat(),
                "duration_minutes": session.duration_minutes,
                "meeting_url": session.meeting_url or "",
            },
        )

        # ── In-app notifications ────────────────────────────────
        formatted_date = scheduled.strftime("%d/%m/%Y a las %H:%M")
        Notification.objects.create(
            recipient=mentee, sender=user,
            notification_type="system",
            title="Nueva sesión de mentoría agendada",
            message=f"{user.full_name or 'Tu mentor'} agendó una sesión: \"{session.title}\" para el {formatted_date}.",
            link=f"/p/{mentee.portal_code}/sesiones" if mentee.portal_code else "",
        )
        Notification.objects.create(
            recipient=user, sender=user,
            notification_type="system",
            title="Sesión de mentoría creada",
            message=f"Creaste una sesión: \"{session.title}\" con {mentee.full_name or mentee.email} para el {formatted_date}.",
            link=f"/p/{user.portal_code}/sesiones" if user.portal_code else "",
        )

        # ── Email to mentee ─────────────────────────────────────
        frontend_url = getattr(django_settings, "FRONTEND_URL", "https://inspiratoria.aplifly.com")
        mentee_portal_link = f"{frontend_url}/p/{mentee.portal_code}/sesiones" if mentee.portal_code else frontend_url
        meeting_block = ""
        if session.meeting_url:
            meeting_block = f"""
              <div style="text-align:center;margin:20px 0 0 0;">
                <a href="{session.meeting_url}" style="display:inline-block;background:#0891b2;color:#ffffff;padding:12px 32px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;">Enlace de reunión</a>
              </div>"""

        mentee_html = f"""
        <div style="background-color:#f9fafb;padding:40px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;">
            <div style="text-align:center;padding-bottom:32px;">
              <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;">Inspiratoria</span>
            </div>
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 36px;">
              <p style="margin:0 0 8px 0;color:#111827;font-size:17px;font-weight:600;">
                Nueva sesión de mentoría agendada
              </p>
              <p style="margin:0 0 24px 0;color:#6b7280;font-size:14px;">
                Hola {mentee.full_name or 'Mentee'}, tu mentor ha agendado una sesión contigo.
              </p>
              <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:20px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;width:110px;">Sesión</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{session.title}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Mentor</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{user.full_name or user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Fecha</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{formatted_date}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Duración</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{session.duration_minutes} minutos</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Programa</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{program.name}</td>
                  </tr>
                </table>
              </div>
              {f'<p style="margin:0 0 16px 0;color:#4b5563;font-size:13px;line-height:1.6;">{session.description}</p>' if session.description else ''}
              {meeting_block}
              <div style="text-align:center;margin:24px 0 0 0;">
                <a href="{mentee_portal_link}" style="display:inline-block;background:#0a0a0a;color:#FFD902;padding:14px 40px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">Ver mis sesiones</a>
              </div>
            </div>
            <div style="text-align:center;padding-top:28px;">
              <p style="margin:0;color:#d1d5db;font-size:11px;">Equipo Inspiratoria</p>
            </div>
          </div>
        </div>"""

        # ── Email to mentor (confirmation) ──────────────────────
        mentor_portal_link = f"{frontend_url}/p/{user.portal_code}/sesiones" if user.portal_code else frontend_url
        mentor_html = f"""
        <div style="background-color:#f9fafb;padding:40px 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;">
            <div style="text-align:center;padding-bottom:32px;">
              <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#0a0a0a;">Inspiratoria</span>
            </div>
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 36px;">
              <p style="margin:0 0 8px 0;color:#111827;font-size:17px;font-weight:600;">
                Sesión de mentoría confirmada
              </p>
              <p style="margin:0 0 24px 0;color:#6b7280;font-size:14px;">
                Hola {user.full_name or 'Mentor'}, tu sesión ha sido creada exitosamente.
              </p>
              <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:20px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;width:110px;">Sesión</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{session.title}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Mentee</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{mentee.full_name or mentee.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Fecha</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{formatted_date}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Duración</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{session.duration_minutes} minutos</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:13px;">Programa</td>
                    <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">{program.name}</td>
                  </tr>
                </table>
              </div>
              {meeting_block}
              <div style="text-align:center;margin:24px 0 0 0;">
                <a href="{mentor_portal_link}" style="display:inline-block;background:#0a0a0a;color:#FFD902;padding:14px 40px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;">Ver mis sesiones</a>
              </div>
            </div>
            <div style="text-align:center;padding-top:28px;">
              <p style="margin:0;color:#d1d5db;font-size:11px;">Equipo Inspiratoria</p>
            </div>
          </div>
        </div>"""

        # Send emails (fail_silently so session creation still succeeds)
        try:
            send_mail(
                subject=f"📅 Nueva sesión de mentoría: {session.title}",
                message=f"Tu mentor {user.full_name or user.email} agendó una sesión \"{session.title}\" para el {formatted_date}. Programa: {program.name}.",
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[mentee.email],
                html_message=mentee_html,
                fail_silently=True,
            )
        except Exception:
            pass
        try:
            send_mail(
                subject=f"✅ Sesión confirmada: {session.title}",
                message=f"Creaste la sesión \"{session.title}\" con {mentee.full_name or mentee.email} para el {formatted_date}. Programa: {program.name}.",
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=mentor_html,
                fail_silently=True,
            )
        except Exception:
            pass

        return {
            "id": str(session.id), "title": session.title,
            "scheduled_at": session.scheduled_at.isoformat(), "status": session.status,
            "emails_sent": True,
        }

    return await sync_to_async(_resolve)()


@router.put("/portal/{portal_code}/sessions/{session_id}")
async def update_session(portal_code: str, session_id: str, payload: SessionCreateRequest):
    """Update a mentoring session."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import MentoringSession
        from datetime import datetime as dt

        try:
            session = MentoringSession.objects.get(id=session_id, mentor=user)
        except MentoringSession.DoesNotExist:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        session.title = payload.title
        session.description = payload.description
        session.scheduled_at = dt.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
        session.duration_minutes = payload.duration_minutes
        session.meeting_url = payload.meeting_url
        session.save()
        return {"success": True, "id": str(session.id)}

    return await sync_to_async(_resolve)()


@router.patch("/portal/{portal_code}/sessions/{session_id}/status")
async def update_session_status(portal_code: str, session_id: str, status_val: str = "completed"):
    """Mark session as completed/cancelled."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import MentoringSession

        try:
            session = MentoringSession.objects.get(id=session_id, mentor=user)
        except MentoringSession.DoesNotExist:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        if status_val in ("completed", "cancelled", "no_show"):
            session.status = status_val
            session.save(update_fields=["status", "updated_at"])
        return {"success": True, "status": session.status}

    return await sync_to_async(_resolve)()


# ── Session Notes + AI ──────────────────────────────────────────────

@router.post("/portal/{portal_code}/sessions/{session_id}/notes")
async def save_session_notes(portal_code: str, session_id: str, payload: SessionNotesRequest):
    """Save notes for a session."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import MentoringSession

        try:
            session = MentoringSession.objects.get(id=session_id, mentor=user)
        except MentoringSession.DoesNotExist:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        session.session_notes = payload.session_notes
        session.topics_covered = payload.topics_covered
        session.mentee_mood = payload.mentee_mood
        session.next_steps = payload.next_steps
        session.save()
        return {"success": True}

    return await sync_to_async(_resolve)()


@router.post("/portal/{portal_code}/sessions/{session_id}/ai-suggest")
async def ai_suggest_next_session(portal_code: str, session_id: str):
    """AI suggest content for the next mentoring session based on notes."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import MentoringSession

        try:
            session = MentoringSession.objects.get(id=session_id, mentor=user)
        except MentoringSession.DoesNotExist:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")

        mentee = session.mentee
        mentor_topics = getattr(user, "mentor_topics", []) or []
        mentor_style = getattr(user, "mentor_style", []) or []

        prev_sessions = MentoringSession.objects.filter(
            mentor=user, mentee=mentee, status="completed"
        ).order_by("-scheduled_at")[:5]

        history = ""
        for ps in prev_sessions:
            history += f"- '{ps.title}': {ps.session_notes[:200]}\n  Temas: {', '.join(ps.topics_covered or [])}\n  Próximos pasos: {ps.next_steps[:150]}\n"

        prompt = f"""Eres un experto en diseño de sesiones de mentoría profesional.

Mentor: {user.full_name} | Expertise: {', '.join(mentor_topics)} | Estilo: {', '.join(mentor_style)}
Mentee: {mentee.full_name} | Cargo: {mentee.position or 'N/A'} | Área: {mentee.department or 'N/A'}
Bio mentee: {getattr(mentee, 'bio', '') or 'No disponible'}

Última sesión: "{session.title}"
Notas: {session.session_notes or 'Sin notas'}
Temas cubiertos: {', '.join(session.topics_covered or [])}
Ánimo mentee (1-5): {session.mentee_mood or 'No registrado'}
Próximos pasos: {session.next_steps or 'No definidos'}

Historial:
{history or 'Sin sesiones previas.'}

Genera en español:
1. Título sugerido para la próxima sesión
2. 3-4 objetivos clave
3. Actividades y ejercicios recomendados
4. Preguntas poderosas para abrir la conversación
5. Recursos o lecturas recomendadas"""

        try:
            from programs.ai_service import GeminiAIService
            result = GeminiAIService._call_gemini(prompt, temperature=0.7)
            if result:
                session.ai_suggestion = result
                session.save(update_fields=["ai_suggestion", "updated_at"])
                return {"suggestion": result}
        except Exception:
            pass
        return {"suggestion": "No se pudo generar sugerencia. Verifica la configuración de la IA."}

    return await sync_to_async(_resolve)()


# ── Activity Completion ──────────────────────────────────────────────

@router.post("/portal/{portal_code}/activities/{activity_id}/complete")
async def complete_activity(portal_code: str, activity_id: str):
    """Mark an activity as completed by this user."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import Activity, ActivityCompletion

        try:
            activity = Activity.objects.get(id=activity_id)
        except Activity.DoesNotExist:
            raise HTTPException(status_code=404, detail="Actividad no encontrada")

        completion, created = ActivityCompletion.objects.get_or_create(
            activity=activity, user=user,
        )
        if not created:
            return {"success": True, "already_completed": True}
        return {"success": True, "already_completed": False, "completed_at": completion.completed_at.isoformat()}

    return await sync_to_async(_resolve)()


@router.get("/portal/{portal_code}/activities")
async def get_my_activities(portal_code: str):
    """Get activities with completion status for this user."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import ProgramParticipant, Activity, ActivityCompletion

        pps = ProgramParticipant.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("program_id", flat=True)

        activities = Activity.objects.filter(
            program_id__in=list(pps)
        ).select_related("program").order_by("start_date")

        completed_ids = set(
            ActivityCompletion.objects.filter(user=user).values_list("activity_id", flat=True)
        )

        return {"activities": [{
            "id": a.id, "name": a.name, "description": a.description,
            "activity_type": a.activity_type, "status": a.status,
            "start_date": a.start_date.isoformat() if a.start_date else None,
            "end_date": a.end_date.isoformat() if a.end_date else None,
            "modality": a.modality or "", "meeting_url": a.meeting_url or "",
            "program_name": a.program.name, "program_id": str(a.program.id),
            "completed_by_me": a.id in completed_ids,
        } for a in activities]}

    return await sync_to_async(_resolve)()


# ── Influence Network ────────────────────────────────────────────────

@router.get("/portal/{portal_code}/network")
async def get_influence_network(portal_code: str):
    """Express profiles of people in the user's programs."""
    def _resolve():
        user = _get_portal_user(portal_code)
        from programs.models import ProgramParticipant

        my_program_ids = ProgramParticipant.objects.filter(
            user=user, deleted_at__isnull=True
        ).values_list("program_id", flat=True)

        peers = ProgramParticipant.objects.filter(
            program_id__in=list(my_program_ids), deleted_at__isnull=True,
        ).exclude(user=user).select_related("user", "program")

        seen = set()
        network = []
        for p in peers:
            u = p.user
            if u.id in seen:
                continue
            seen.add(u.id)
            network.append({
                "id": str(u.id), "full_name": u.full_name or "",
                "position": u.position or "", "department": u.department or "",
                "avatar_url": getattr(u, "avatar_url", "") or "",
                "linkedin_url": getattr(u, "linkedin_url", "") or "",
                "bio": getattr(u, "bio", "") or "",
                "headline": getattr(u, "headline", "") or "",
                "role": p.role, "program_name": p.program.name,
            })
        return {"network": network}

    return await sync_to_async(_resolve)()
