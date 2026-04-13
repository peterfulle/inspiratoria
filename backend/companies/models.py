from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.crypto import get_random_string
import uuid


class Company(models.Model):
    """
    Organización/Empresa cliente que contrata la plataforma
    """
    ACCOUNT_TYPE_CHOICES = [
        ("internal", "Interna (Inspiratoria)"),
        ("core", "Core (Auto-registro)"),
        ("studio", "Studio (Consultoría)"),
    ]
    
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("trial", "Trial"),
        ("active", "Activa"),
        ("suspended", "Suspendida"),
        ("cancelled", "Cancelada"),
    ]
    
    PLAN_CHOICES = [
        ("trial", "Trial (14 días)"),
        ("starter", "Starter - $3,200/año"),
        ("growth", "Growth - $9,600/año"),
        ("enterprise", "Enterprise - Custom"),
    ]
    
    # Límites por plan
    PLAN_LIMITS = {
        "trial": {"max_users": 5, "max_programs": 1, "max_participants": 10},
        "starter": {"max_users": 20, "max_programs": 1, "max_participants": 40},
        "growth": {"max_users": 80, "max_programs": 3, "max_participants": 160},
        "enterprise": {"max_users": 9999, "max_programs": 999, "max_participants": 9999},
    }
    
    # Features por plan
    PLAN_FEATURES = {
        "trial": {
            "api_access": False,
            "sso": False,
            "white_label": False,
            "matching_ai": "basic",
            "support_sla": "none",
            "account_manager": False,
            "custom_content": False,
        },
        "starter": {
            "api_access": False,
            "sso": False,
            "white_label": False,
            "matching_ai": "basic",
            "support_sla": "72hr",
            "account_manager": False,
            "custom_content": False,
        },
        "growth": {
            "api_access": True,
            "sso": True,
            "white_label": "basic",  # logo + colors
            "matching_ai": "advanced",
            "support_sla": "24hr",
            "account_manager": True,  # shared 1:12
            "custom_content": False,
        },
        "enterprise": {
            "api_access": True,
            "sso": "saml_scim",
            "white_label": "full",
            "matching_ai": "custom",
            "support_sla": "4hr",
            "account_manager": "dedicated",  # 1:5
            "sla_uptime": "99.9%",
            "custom_content": True,
        },
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name="Nombre de la Empresa")
    slug = models.SlugField(max_length=200, unique=True)
    corp_id = models.CharField(max_length=20, unique=True, blank=True, verbose_name="ID Corporativo")
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default="core", verbose_name="Tipo de Cuenta")
    
    # Datos básicos
    industry = models.CharField(max_length=100, blank=True, verbose_name="Industria")
    company_size = models.CharField(max_length=50, blank=True, verbose_name="Tamaño")
    website = models.URLField(blank=True, verbose_name="Sitio Web")
    
    # Personalidad jurídica (Chile)
    legal_name = models.CharField(max_length=300, blank=True, verbose_name="Razón Social")
    rut = models.CharField(max_length=12, blank=True, verbose_name="RUT")  # 12.345.678-9
    tax_id = models.CharField(max_length=20, blank=True, verbose_name="ID Tributario")
    legal_address = models.TextField(blank=True, verbose_name="Dirección Legal")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ciudad")
    region = models.CharField(max_length=100, blank=True, verbose_name="Región")
    country = models.CharField(max_length=100, default="Chile", verbose_name="País")
    postal_code = models.CharField(max_length=20, blank=True, verbose_name="Código Postal")
    
    # Contacto principal
    contact_name = models.CharField(max_length=200, blank=True, verbose_name="Nombre Contacto")
    contact_email = models.EmailField(blank=True, verbose_name="Email Contacto")
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name="Teléfono Contacto")
    contact_position = models.CharField(max_length=100, blank=True, verbose_name="Cargo Contacto")
    
    # Información comercial
    business_type = models.CharField(max_length=100, blank=True, verbose_name="Tipo de Negocio")
    foundation_year = models.PositiveIntegerField(null=True, blank=True, verbose_name="Año Fundación")
    description = models.TextField(blank=True, verbose_name="Descripción")
    
    # Plan y estado
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="trial")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="trial")
    
    # Setup inicial - Validación de información completa
    is_data_complete = models.BooleanField(default=False, verbose_name="Información Completa")
    is_enabled = models.BooleanField(default=False, verbose_name="Habilitado para Programas")
    
    # Límites según plan
    max_users = models.PositiveIntegerField(default=100)
    max_programs = models.PositiveIntegerField(default=1)
    max_participants = models.PositiveIntegerField(default=100)
    
    # Branding
    logo_url = models.TextField(blank=True, default="")
    primary_color = models.CharField(max_length=7, default="#FFD700")  # Hex color
    secondary_color = models.CharField(max_length=7, default="#1E293B")
    
    # PM asignado
    assigned_pm = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='managed_companies', verbose_name="PM Asignado"
    )
    
    # Contrato
    contract_start = models.DateField(null=True, blank=True, verbose_name="Inicio Contrato")
    contract_end = models.DateField(null=True, blank=True, verbose_name="Fin Contrato")
    internal_notes = models.TextField(blank=True, verbose_name="Notas Internas")
    
    # Metadata
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Companies"

    def __str__(self) -> str:
        return self.name
    
    def get_plan_limits(self) -> dict:
        """Retorna los límites del plan actual"""
        return self.PLAN_LIMITS.get(self.plan, self.PLAN_LIMITS["trial"])
    
    def get_plan_features(self) -> dict:
        """Retorna las features del plan actual"""
        return self.PLAN_FEATURES.get(self.plan, self.PLAN_FEATURES["trial"])
    
    def check_plan_limits(self) -> dict:
        """Verifica si la empresa excede los límites de su plan"""
        limits = self.get_plan_limits()
        
        current_users = self.users.filter(is_active=True).count()
        current_programs = 0
        try:
            from programs.models import Program
            current_programs = Program.objects.filter(company=self, status="active").count()
        except:
            pass
        
        exceeded = []
        if current_users >= limits["max_users"]:
            exceeded.append("users")
        if current_programs >= limits["max_programs"]:
            exceeded.append("programs")
        
        return {
            "exceeded": exceeded,
            "suggest_upgrade": len(exceeded) > 0,
            "current": {"users": current_users, "programs": current_programs},
            "limits": limits,
            "plan": self.plan,
            "next_plan": self.get_upgrade_plan(),
        }
    
    def get_upgrade_plan(self) -> str:
        """Retorna el siguiente plan disponible para upgrade"""
        upgrade_path = {
            "trial": "starter",
            "starter": "growth",
            "growth": "enterprise",
            "enterprise": None,
        }
        return upgrade_path.get(self.plan)
    
    def can_add_user(self) -> bool:
        """Verifica si se puede agregar un nuevo usuario"""
        limits = self.get_plan_limits()
        current_users = self.users.filter(is_active=True).count()
        return current_users < limits["max_users"]
    
    def can_add_program(self) -> bool:
        """Verifica si se puede agregar un nuevo programa"""
        limits = self.get_plan_limits()
        try:
            from programs.models import Program
            current_programs = Program.objects.filter(company=self, status__in=["active", "draft"]).count()
            return current_programs < limits["max_programs"]
        except:
            return True
    
    def has_feature(self, feature_name: str) -> bool:
        """Verifica si el plan tiene una feature específica"""
        features = self.get_plan_features()
        return bool(features.get(feature_name, False))
    
    def validate_data_complete(self) -> bool:
        """
        Valida si la información del cliente está completa.
        Requisitos para considerar completa:
        
        Datos Básicos (4 campos):
        - name (obligatorio siempre)
        - industry
        - company_size
        - website
        
        Contacto Principal (4 campos):
        - contact_name
        - contact_email
        - contact_phone
        - contact_position
        """
        required_fields = [
            # Datos Básicos
            bool(self.name and self.name.strip()),
            bool(self.industry and self.industry.strip()),
            bool(self.company_size and self.company_size.strip()),
            bool(self.website and self.website.strip()),
            # Contacto Principal
            bool(self.contact_name and self.contact_name.strip()),
            bool(self.contact_email and self.contact_email.strip()),
            bool(self.contact_phone and self.contact_phone.strip()),
            bool(self.contact_position and self.contact_position.strip()),
        ]
        return all(required_fields)
    
    def enable_for_programs(self) -> bool:
        """
        Habilita el cliente para crear programas.
        Solo se habilita si la información está completa.
        Retorna True si se pudo habilitar, False si no.
        """
        if self.validate_data_complete():
            self.is_data_complete = True
            self.is_enabled = True
            self.save()
            return True
        return False
    
    def save(self, *args, **kwargs):
        """
        Al guardar, valida automáticamente si la información está completa.
        Si está completa, habilita automáticamente.
        También genera el slug y corp_id si no existen.
        """
        # Generar slug si no existe
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Company.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # Generar corp_id si no existe (formato: YYYYMMDD-HHMM)
        if not self.corp_id:
            from django.utils import timezone
            now = timezone.now()
            base_corp_id = now.strftime("%Y%m%d-%H%M")
            corp_id = base_corp_id
            counter = 1
            while Company.objects.filter(corp_id=corp_id).exists():
                corp_id = f"{base_corp_id}-{counter}"
                counter += 1
            self.corp_id = corp_id
        
        # Validar completitud automáticamente
        self.is_data_complete = self.validate_data_complete()
        
        # is_enabled depende del status, NO de is_data_complete
        # Solo las empresas suspendidas o canceladas están deshabilitadas
        if self.status in ["suspended", "cancelled"]:
            self.is_enabled = False
        else:
            # trial o active = habilitado
            self.is_enabled = True
        
        # Aplicar límites según el plan
        limits = self.PLAN_LIMITS.get(self.plan, self.PLAN_LIMITS["trial"])
        self.max_users = limits["max_users"]
        self.max_programs = limits["max_programs"]
        self.max_participants = limits["max_participants"]
        
        super().save(*args, **kwargs)


class User(AbstractUser):
    """
    Usuario extendido con los 7 roles del sistema + permisos granulares para admin_root
    """
    ROLE_CHOICES = [
        ("superadmin", "Super Admin"),  # Administrador de Inspiratoria (Admin Root)
        ("admin_root", "Admin Root"),  # Admin raíz del sistema
        ("inspiratoria_admin", "Admin Inspiratoria"),  # Administrador de Inspiratoria (Nuevo rol)
        ("coordinator", "Coordinador"),  # Coordinador de programas
        ("project_manager", "Project Manager"),  # Gestor de proyectos
        ("billing", "Facturación"),  # Encargado de facturación
        ("client", "Cliente"),  # Contraparte en la empresa
        ("admin", "Administrador"),  # Admin interno de la empresa
        ("facilitator_internal", "Facilitador Interno"),
        ("facilitator_inspiratoria", "Facilitador Inspiratoria"),
        ("mentor", "Mentor"),
        ("mentee", "Mentee"),
        ("participant", "Participante"),  # Participante general de eventos
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company, 
        related_name="users", 
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="mentee")
    
    # Perfil básico
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    position = models.CharField(max_length=100, blank=True)  # Cargo en la empresa
    department = models.CharField(max_length=100, blank=True)
    linkedin_url = models.URLField(max_length=300, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    headline = models.CharField(max_length=200, blank=True, default="")
    skills = models.JSONField(default=list, blank=True)
    
    # Avatar (stored as base64 data URI in DB for Render compatibility)
    avatar_url = models.TextField(blank=True, default="")
    
    # Perfil extendido mentor (multi-step onboarding)
    GENDER_CHOICES = [
        ("masculino", "Masculino"),
        ("femenino", "Femenino"),
        ("no_binario", "No binario"),
        ("prefiero_no_decir", "Prefiero no decir"),
    ]
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, default="")
    personal_email = models.EmailField(max_length=254, blank=True, default="")
    presentation = models.TextField(blank=True, default="")  # Breve presentación 3-5 líneas
    mentor_topics = models.JSONField(default=list, blank=True)  # Temas de valor como mentor
    mentor_objectives = models.JSONField(default=list, blank=True)  # Objetivos a acompañar
    mentor_style = models.JSONField(default=list, blank=True)  # Estilo de acompañamiento
    experience_level = models.CharField(max_length=30, blank=True, default="")  # Nivel experiencia
    experience_area = models.JSONField(default=list, blank=True)  # Área de experiencia
    mentee_preference = models.JSONField(default=list, blank=True)  # Perfil mentee preferido
    mentee_outcomes = models.JSONField(default=list, blank=True)  # Resultados esperados
    session_structure = models.JSONField(default=list, blank=True)  # Estructura sesiones
    mentor_profile_step = models.PositiveIntegerField(default=0)  # Paso actual del wizard (0=no iniciado, 4=completo)
    
    # Onboarding
    is_onboarded = models.BooleanField(default=False)
    onboarding_step = models.PositiveIntegerField(default=0)
    
    # Permisos granulares para Admin Root (superadmin)
    # Estos permisos permiten operación completa según el SOP
    can_manage_clients = models.BooleanField(default=False)  # Setup: crear/habilitar clientes
    can_manage_programs = models.BooleanField(default=False)  # Diseño: crear/configurar programas
    can_manage_users = models.BooleanField(default=False)  # Usuarios: cargar/asignar roles
    can_manage_activities = models.BooleanField(default=False)  # Ejecución: gestionar actividades
    can_execute_matches = models.BooleanField(default=False)  # Ejecución: ejecutar y validar matches
    can_view_reports = models.BooleanField(default=False)  # Cierre: ver dashboards y reportes
    can_close_programs = models.BooleanField(default=False)  # Cierre: cerrar programas
    can_manage_alerts = models.BooleanField(default=False)  # Seguimiento: gestionar alertas
    
    # OTP para activación de cuenta
    otp_code = models.CharField(max_length=4, blank=True, default="")
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    is_account_activated = models.BooleanField(default=False)
    
    # TOTP (Google Authenticator / Microsoft Authenticator)
    totp_secret = models.CharField(max_length=64, blank=True, default="")
    totp_enabled = models.BooleanField(default=False)
    
    # Token único para activación (link en email)
    activation_token = models.CharField(max_length=128, blank=True, default="")
    
    # Portal code único para URL de participante (/p/{portal_code})
    portal_code = models.CharField(max_length=12, unique=True, blank=True, null=True)
    
    # Permisos de vistas del dashboard
    # Lista de vistas permitidas: dashboard, accounts, programs, billing, users, analytics, ecosystem, configuration
    view_permissions = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de vistas del dashboard que el usuario puede ver"
    )
    
    # Metadata
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.role})"
    
    @staticmethod
    def _generate_portal_code():
        """Genera un código portal único de 8 caracteres alfanuméricos."""
        from companies.models import User as _U
        for _ in range(20):
            code = get_random_string(8, 'abcdefghijkmnpqrstuvwxyz23456789')
            if not _U.objects.filter(portal_code=code).exists():
                return code
        return get_random_string(12, 'abcdefghijkmnpqrstuvwxyz23456789')

    def save(self, *args, **kwargs):
        """
        Al guardar, si es superadmin o is_superuser, otorga todos los permisos automáticamente
        Esto implementa el Admin Root con permisos totales del SOP
        """
        if not self.portal_code:
            self.portal_code = User._generate_portal_code()
        if self.role == "superadmin" or self.is_superuser:
            self.can_manage_clients = True
            self.can_manage_programs = True
            self.can_manage_users = True
            self.can_manage_activities = True
            self.can_execute_matches = True
            self.can_view_reports = True
            self.can_close_programs = True
            self.can_manage_alerts = True
        # Asignar todas las vistas si es admin/superadmin y no tiene permisos definidos
        ALL_VIEWS = ["dashboard", "accounts", "programs", "billing", "users", "analytics", "ecosystem", "configuration"]
        if (self.role in ("superadmin", "inspiratoria_admin") or self.is_superuser) and not self.view_permissions:
            self.view_permissions = ALL_VIEWS
        super().save(*args, **kwargs)
    
    @property
    def is_company_admin(self) -> bool:
        return self.role in ["admin", "client", "superadmin"]
    
    @property
    def is_admin_root(self) -> bool:
        """Verifica si el usuario es Admin Root (superadmin con todos los permisos)"""
        return self.role == "superadmin" or self.is_superuser
    
    @property
    def can_view_all_data(self) -> bool:
        return self.role in ["client", "admin", "superadmin"]


class OnboardingInvitation(models.Model):
    """
    Invitaciones para que usuarios completen su onboarding
    """
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("accepted", "Aceptada"),
        ("expired", "Expirada"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=30, choices=User.ROLE_CHOICES)
    token = models.CharField(max_length=64, unique=True)
    
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Invitation for {self.email} as {self.role}"


class AccountNote(models.Model):
    """
    Bitácora / Notas de gestión de un cliente.
    Registro cronológico de interacciones, decisiones y seguimiento.
    """
    NOTE_TYPE_CHOICES = [
        ("general", "Nota General"),
        ("call", "Llamada"),
        ("meeting", "Reunión"),
        ("email", "Email"),
        ("task", "Tarea"),
        ("decision", "Decisión"),
        ("milestone", "Hito"),
        ("issue", "Problema"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="authored_notes")
    content = models.TextField(verbose_name="Contenido")
    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES, default="general")
    is_pinned = models.BooleanField(default=False, verbose_name="Fijado")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Nota de Cuenta"
        verbose_name_plural = "Notas de Cuenta"

    def __str__(self) -> str:
        return f"[{self.note_type}] {self.content[:50]}"


class AccountChangeLog(models.Model):
    """
    Registro de cambios en la cuenta / Control de cambios.
    Se crea automáticamente al cambiar campos clave.
    """
    CHANGE_TYPE_CHOICES = [
        ("status_change", "Cambio de Estado"),
        ("plan_change", "Cambio de Plan"),
        ("pm_assign", "Asignación de PM"),
        ("info_update", "Actualización de Datos"),
        ("account_created", "Cuenta Creada"),
        ("account_approved", "Solicitud Aprobada"),
        ("contract_update", "Actualización de Contrato"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="changelog")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="changes_made")
    change_type = models.CharField(max_length=30, choices=CHANGE_TYPE_CHOICES)
    field_changed = models.CharField(max_length=100, blank=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    description = models.TextField(blank=True, verbose_name="Descripción del cambio")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Registro de Cambio"
        verbose_name_plural = "Registros de Cambio"

    def __str__(self) -> str:
        return f"[{self.change_type}] {self.description[:50]}"


class StudioAccount(models.Model):
    """
    Cuenta de acceso Studio para empresas aprobadas.
    Genera credenciales únicas, hash de acceso y gestiona el estado.
    """
    STATUS_CHOICES = [
        ("active", "Activa"),
        ("suspended", "Suspendida"),
        ("expired", "Expirada"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name="studio_account")
    admin_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="studio_admin_account", null=True, blank=True)
    
    # Hash único de acceso
    access_hash = models.CharField(max_length=64, unique=True, blank=True)
    
    # Credenciales generadas
    generated_email = models.EmailField(verbose_name="Email de acceso")
    generated_password = models.CharField(max_length=128, verbose_name="Contraseña generada")
    
    # Estado y vigencia
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    valid_from = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    last_login = models.DateTimeField(null=True, blank=True)
    login_count = models.PositiveIntegerField(default=0)
    credentials_sent = models.BooleanField(default=False)
    credentials_sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Cuenta Studio"
        verbose_name_plural = "Cuentas Studio"
    
    def save(self, *args, **kwargs):
        if not self.access_hash:
            import hashlib
            import time
            raw = f"{self.company_id}-{time.time()}-{uuid.uuid4()}"
            self.access_hash = hashlib.sha256(raw.encode()).hexdigest()[:32]
        super().save(*args, **kwargs)
    
    def __str__(self) -> str:
        return f"Studio: {self.company.name} ({self.status})"
    
    @property
    def is_valid(self) -> bool:
        from django.utils import timezone
        if self.status != "active":
            return False
        if self.valid_until and timezone.now() > self.valid_until:
            return False
        return True
