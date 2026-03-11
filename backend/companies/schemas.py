from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
import uuid


# ============ COMPANY SCHEMAS ============

class CompanyCreateRequest(BaseModel):
    """Step 1: Datos de la empresa"""
    name: str = Field(..., min_length=2, max_length=200)
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    account_type: Optional[str] = "core"


class CompanyUpdateRequest(BaseModel):
    """Schema para actualizar cualquier campo de la empresa"""
    # Datos básicos
    name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    
    # Personalidad jurídica
    legal_name: Optional[str] = None
    rut: Optional[str] = None
    tax_id: Optional[str] = None
    legal_address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Contacto principal
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_position: Optional[str] = None
    
    # Información comercial
    business_type: Optional[str] = None
    foundation_year: Optional[int] = None
    description: Optional[str] = None
    
    # Plan
    plan: Optional[str] = None
    status: Optional[str] = None


class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    corp_id: Optional[str] = None
    account_type: Optional[str] = "core"
    industry: Optional[str]
    company_size: Optional[str]
    website: Optional[str]
    
    # Personalidad jurídica
    legal_name: Optional[str] = None
    rut: Optional[str] = None
    tax_id: Optional[str] = None
    legal_address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = "Chile"
    postal_code: Optional[str] = None
    
    # Contacto principal
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_position: Optional[str] = None
    
    # Información comercial
    business_type: Optional[str] = None
    foundation_year: Optional[int] = None
    description: Optional[str] = None
    
    plan: str
    status: str
    is_data_complete: bool
    is_enabled: bool
    max_users: int
    max_programs: int
    max_participants: int
    primary_color: str
    secondary_color: str
    onboarding_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ USER SCHEMAS ============

class SuperAdminCreateRequest(BaseModel):
    """Step 2: Crear super admin de la empresa"""
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = None
    position: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        if not any(c.isalpha() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra')
        return v


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    full_name: str
    role: str
    company_id: Optional[uuid.UUID]
    position: Optional[str]
    department: Optional[str]
    avatar_url: Optional[str]
    is_onboarded: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    user: UserResponse
    company: Optional[CompanyResponse]
    token: str
    message: str


# ============ SELF-REGISTRATION (CORE) ============

class RegisterCompanyRequest(BaseModel):
    """Registro completo: empresa + admin en un solo paso (desde /register)"""
    account_type: str = Field(default="core")  # core / studio
    plan_tier: str = Field(default="core_50")
    company_name: str = Field(..., min_length=2, max_length=200)
    company_industry: Optional[str] = None
    company_size: Optional[str] = None
    admin_name: str = Field(..., min_length=2, max_length=200)
    admin_email: EmailStr
    admin_phone: Optional[str] = None
    password: str = Field(..., min_length=8)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v


# ============ INSPIRATORIA ADMIN SCHEMAS ============

class InspiratoriaAdminCreateRequest(BaseModel):
    """Crear usuario administrador de Inspiratoria"""
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    profile: str  # super_admin, operations_admin, support_admin

    @validator('profile')
    def validate_profile(cls, v):
        valid_profiles = ['super_admin', 'operations_admin', 'support_admin']
        if v not in valid_profiles:
            raise ValueError(f'Perfil inválido. Debe ser uno de: {", ".join(valid_profiles)}')
        return v


# ============ ONBOARDING SCHEMAS ============

class OnboardingStep3Request(BaseModel):
    """Step 3: Configuración inicial del proyecto"""
    primary_color: Optional[str] = "#FFD700"
    secondary_color: Optional[str] = "#1E293B"
    initial_program_name: Optional[str] = None
    initial_program_description: Optional[str] = None


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str
    full_name: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        valid_roles = [
            'client', 'admin', 'facilitator_internal', 
            'facilitator_inspiratoria', 'mentor', 'mentee'
        ]
        if v not in valid_roles:
            raise ValueError(f'Rol inválido. Debe ser uno de: {", ".join(valid_roles)}')
        return v


class InvitationResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    token: str
    status: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    token: str
    username: str
    password: str = Field(..., min_length=8)
    full_name: str
    phone: Optional[str] = None
    position: Optional[str] = None


# ============ ONBOARDING COMPLETE RESPONSE ============

class OnboardingCompleteResponse(BaseModel):
    company: CompanyResponse
    user: UserResponse
    token: str
    next_steps: List[str]
    message: str


# ============ USER MANAGEMENT SCHEMAS ============

class UserCreateRequest(BaseModel):
    """Crear un nuevo usuario (por admin)"""
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=200)
    role: str
    company_id: Optional[uuid.UUID] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        valid_roles = [
            'superadmin', 'client', 'admin', 'facilitator_internal', 
            'facilitator_inspiratoria', 'mentor', 'mentee'
        ]
        if v not in valid_roles:
            raise ValueError(f'Rol inválido. Debe ser uno de: {", ".join(valid_roles)}')
        return v


class UserUpdateRequest(BaseModel):
    """Actualizar datos de usuario"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_onboarded: Optional[bool] = None


class UserListResponse(BaseModel):
    """Lista de usuarios con información básica"""
    id: uuid.UUID
    username: str
    email: str
    full_name: str
    role: str
    company_id: Optional[uuid.UUID]
    position: Optional[str]
    is_onboarded: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ STUDIO REGISTRATION ============

class RegisterStudioRequest(BaseModel):
    """Registro de consulta Studio: crea empresa + contacto en DB"""
    nombre: str = Field(..., min_length=2, max_length=200)
    apellido: str = Field(default="", max_length=200)
    cargo: Optional[str] = None
    empresa: str = Field(..., min_length=2, max_length=200)
    email: str
    whatsapp: Optional[str] = None
    idea: Optional[str] = None


class StudioRegistrationResponse(BaseModel):
    company: CompanyResponse
    message: str


class CreateStudioAccountRequest(BaseModel):
    """Request para crear cuenta Studio con credenciales"""
    admin_name: str = Field(..., min_length=2, max_length=200)
    admin_email: str = Field(..., min_length=5)
    admin_position: str = Field(default="Administrador de Programa", max_length=200)


class StudioAccountResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    company_name: str
    access_hash: str
    generated_email: str
    status: str
    valid_from: datetime
    valid_until: Optional[datetime] = None
    credentials_sent: bool
    admin_user_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssignProgramRequest(BaseModel):
    """Request para asignar un programa a una empresa"""
    program_id: uuid.UUID
    company_id: uuid.UUID
