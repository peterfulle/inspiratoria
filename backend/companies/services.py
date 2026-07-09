from django.utils.text import slugify
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from datetime import timedelta
import secrets
from typing import Tuple, Optional

from .models import Company, User, OnboardingInvitation
from programs.models import Program


class OnboardingService:
    """
    Servicio para manejar el flujo de onboarding multi-step
    """
    
    @staticmethod
    def create_company_step1(name: str, industry: str = None, 
                            company_size: str = None, website: str = None,
                            account_type: str = "core") -> Company:
        """
        Step 1: Crear empresa
        """
        # Generar slug único
        base_slug = slugify(name)
        slug = base_slug
        counter = 1
        while Company.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        company = Company.objects.create(
            name=name,
            slug=slug,
            industry=industry or "",
            company_size=company_size or "",
            website=website or "",
            status="trial",
            plan="trial",
            account_type=account_type,
            onboarding_completed=False,
        )
        
        return company
    
    @staticmethod
    def create_super_admin_step2(
        company: Company,
        username: str,
        email: str,
        password: str,
        full_name: str,
        phone: str = None,
        position: str = None
    ) -> User:
        """
        Step 2: Crear usuario super admin
        """
        # Verificar que no exista el username
        if User.objects.filter(username=username).exists():
            raise ValueError("El nombre de usuario ya existe")
        
        if User.objects.filter(email=email).exists():
            raise ValueError("El email ya está registrado")
        
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            full_name=full_name,
            phone=phone or "",
            position=position or "",
            role="admin",
            company=company,
            is_onboarded=False,
            onboarding_step=2,
            is_staff=True,  # Puede acceder al admin de Django
            is_active=True,
        )
        
        return user
    
    @staticmethod
    def create_inspiratoria_admin(
        username: str,
        email: str,
        password: str,
        full_name: str,
        phone: str = None,
        profile: str = "operations_admin"
    ) -> User:
        """
        Crear usuario administrador de Inspiratoria (sin empresa)
        """
        # Verificar que no exista el username
        if User.objects.filter(username=username).exists():
            raise ValueError("El nombre de usuario ya existe")
        
        if User.objects.filter(email=email).exists():
            raise ValueError("El email ya está registrado")
        
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            full_name=full_name,
            phone=phone or "",
            role="inspiratoria_admin",
            company=None,  # Admin de Inspiratoria no tiene empresa
            is_onboarded=True,
            is_staff=True,  # Puede acceder al admin de Django
            is_active=True,
        )
        
        return user
    
    @staticmethod
    def complete_onboarding_step3(
        company: Company,
        user: User,
        primary_color: str = None,
        secondary_color: str = None,
        initial_program_name: str = None,
        initial_program_description: str = None
    ) -> Tuple[Company, Optional[Program]]:
        """
        Step 3: Finalizar onboarding con configuración inicial
        """
        # Actualizar colores de marca
        if primary_color:
            company.primary_color = primary_color
        if secondary_color:
            company.secondary_color = secondary_color
        
        company.onboarding_completed = True
        company.save()
        
        # Marcar usuario como onboarded
        user.is_onboarded = True
        user.onboarding_step = 3
        user.save()
        
        # Crear programa inicial si se proporcionó
        program = None
        if initial_program_name:
            program = Program.objects.create(
                name=initial_program_name,
                description=initial_program_description or "",
                status="draft",
                theme="Onboarding",
            )
        
        return company, program
    
    @staticmethod
    def generate_invitation_token() -> str:
        """Genera un token único de 32 caracteres"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def invite_user(
        company: Company,
        invited_by: User,
        email: str,
        role: str,
        expiration_days: int = 7
    ) -> OnboardingInvitation:
        """
        Crear invitación para nuevo usuario
        """
        # Verificar que el invitador tenga permisos
        if not invited_by.can_manage_users:
            raise ValueError("No tienes permisos para invitar usuarios")
        
        # Verificar que no exista el email
        if User.objects.filter(email=email).exists():
            raise ValueError("El email ya está registrado")
        
        # Verificar invitación pendiente
        existing = OnboardingInvitation.objects.filter(
            email=email,
            company=company,
            status="pending"
        ).first()
        
        if existing:
            # Actualizar token y expiración
            existing.token = OnboardingService.generate_invitation_token()
            existing.expires_at = timezone.now() + timedelta(days=expiration_days)
            existing.save()
            return existing
        
        invitation = OnboardingInvitation.objects.create(
            company=company,
            email=email,
            role=role,
            token=OnboardingService.generate_invitation_token(),
            invited_by=invited_by,
            status="pending",
            expires_at=timezone.now() + timedelta(days=expiration_days),
        )
        
        return invitation
    
    @staticmethod
    def accept_invitation(
        token: str,
        username: str,
        password: str,
        full_name: str,
        phone: str = None,
        position: str = None
    ) -> Tuple[User, Company]:
        """
        Aceptar invitación y crear usuario
        """
        invitation = OnboardingInvitation.objects.filter(
            token=token,
            status="pending"
        ).first()
        
        if not invitation:
            raise ValueError("Invitación inválida o ya utilizada")
        
        if invitation.expires_at < timezone.now():
            invitation.status = "expired"
            invitation.save()
            raise ValueError("La invitación ha expirado")
        
        # Verificar username único
        if User.objects.filter(username=username).exists():
            raise ValueError("El nombre de usuario ya existe")
        
        # Crear usuario
        user = User.objects.create(
            username=username,
            email=invitation.email,
            password=make_password(password),
            full_name=full_name,
            phone=phone or "",
            position=position or "",
            role=invitation.role,
            company=invitation.company,
            is_onboarded=True,
            onboarding_step=3,
            is_active=True,
        )
        
        # Marcar invitación como aceptada
        invitation.status = "accepted"
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        return user, invitation.company


    @staticmethod
    def register_company(
        account_type: str,
        plan_tier: str,
        company_name: str,
        company_industry: str = None,
        company_size: str = None,
        admin_name: str = "",
        admin_email: str = "",
        admin_phone: str = "",
        password: str = "",
    ) -> Tuple[Company, User]:
        """
        Registro completo en un solo paso: crear empresa + admin.
        Usado desde el formulario de registro Core.
        """
        # Mapear plan_tier del frontend al plan del modelo
        TIER_TO_PLAN = {
            "core_50": "starter",
            "core_120": "growth",
            "core_300": "enterprise",
            "core_enterprise": "enterprise",
        }
        plan = TIER_TO_PLAN.get(plan_tier, "trial")

        # Validar unicidad del email
        if User.objects.filter(email=admin_email).exists():
            raise ValueError("El email ya está registrado")

        # Generar username a partir del email
        username = admin_email.split("@")[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # 1. Crear empresa
        company = OnboardingService.create_company_step1(
            name=company_name,
            industry=company_industry,
            company_size=company_size,
        )
        company.plan = plan
        company.status = "active"
        company.account_type = account_type or "core"
        company.onboarding_completed = True
        company.contact_name = admin_name
        company.contact_email = admin_email
        company.contact_phone = admin_phone or ""
        company.save()

        # 2. Crear usuario admin de la empresa
        user = User.objects.create(
            username=username,
            email=admin_email,
            password=make_password(password),
            full_name=admin_name,
            phone=admin_phone or "",
            role="admin",
            company=company,
            is_onboarded=True,
            onboarding_step=3,
            is_staff=False,
            is_active=True,
        )

        return company, user

    @staticmethod
    def register_studio_inquiry(
        nombre: str,
        apellido: str = "",
        cargo: str = "",
        empresa: str = "",
        email: str = "",
        whatsapp: str = "",
        idea: str = "",
    ) -> Company:
        """
        Registro de consulta Studio: crea empresa tipo 'studio' en la DB.
        No crea usuario con contraseña (es solo una consulta).
        """
        # Crear empresa tipo studio
        company = OnboardingService.create_company_step1(
            name=empresa,
            account_type="studio",
        )
        company.status = "pending"
        company.plan = "enterprise"  # Studio = Enterprise custom
        company.contact_name = f"{nombre} {apellido}".strip()
        company.contact_email = email
        company.contact_phone = whatsapp or ""
        company.contact_position = cargo or ""
        company.description = idea or ""
        company.save()

        return company


class AuthService:
    """
    Servicio de autenticación
    """
    
    @staticmethod
    def authenticate(username: str, password: str):
        """
        Autenticar usuario - acepta username o email.
        Returns (user, error_code) tuple.
        error_code: None=success, 'user_not_found', 'wrong_password', 'account_inactive'
        """
        try:
            # Intentar buscar por username primero
            user = User.objects.select_related('company').filter(username=username).first()
            
            # Si no se encuentra, intentar por email
            if not user:
                user = User.objects.select_related('company').filter(email=username).first()
            
            if not user:
                return None, 'user_not_found'
            
            if not user.is_active:
                return None, 'account_inactive'
            
            if not check_password(password, user.password):
                return None, 'wrong_password'
            
            # Actualizar last login
            user.last_login_at = timezone.now()
            user.save(update_fields=['last_login_at'])
            return user, None
        except Exception as e:
            print(f"Error en authenticate: {e}")
            return None, 'server_error'
    
    @staticmethod
    def generate_session_token(user: User, hours: Optional[int] = 24 * 30) -> str:
        """
        Genera un token de sesión real: crea un AuthToken en la base de datos
        (guardando solo el hash SHA-256, nunca el valor crudo) y devuelve el
        token en claro — es la única vez que existe sin hashear.
        """
        import hashlib
        from .models import AuthToken

        raw_token = f"{user.id}:{secrets.token_urlsafe(32)}"
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        AuthToken.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=(timezone.now() + timedelta(hours=hours)) if hours else None,
        )
        return raw_token

    @staticmethod
    def verify_session_token(authorization: Optional[str]) -> Optional[User]:
        """
        Valida un token contra las sesiones reales emitidas por
        generate_session_token. Devuelve el User si es válido, no expiró y
        no fue revocado; None en cualquier otro caso (nunca lanza).
        """
        import hashlib
        from .models import AuthToken

        if not authorization:
            return None
        raw_token = authorization.replace("Bearer ", "").strip()
        if not raw_token:
            return None
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        try:
            at = AuthToken.objects.select_related("user", "user__company").get(token_hash=token_hash)
        except AuthToken.DoesNotExist:
            return None
        if at.revoked_at is not None:
            return None
        if at.expires_at is not None and at.expires_at < timezone.now():
            return None
        at.last_used_at = timezone.now()
        at.save(update_fields=["last_used_at"])
        return at.user

    @staticmethod
    def revoke_session_token(authorization: Optional[str]) -> bool:
        """Revoca (invalida) una sesión — usado en logout. Devuelve True si existía."""
        import hashlib
        from .models import AuthToken

        if not authorization:
            return False
        raw_token = authorization.replace("Bearer ", "").strip()
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        updated = AuthToken.objects.filter(token_hash=token_hash, revoked_at__isnull=True).update(revoked_at=timezone.now())
        return updated > 0
