from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


class CompanyBasic(BaseModel):
    """Schema básico para company anidado"""
    id: str
    name: str


class ProgramIn(BaseModel):
    name: str
    description: Optional[str] = None
    theme: Optional[str] = None
    # company_id may arrive as a UUID object (from DB) or as a string from clients
    company_id: Optional[Union[str, UUID]] = None
    status: Optional[str] = "designed"
    activities: Optional[List[Dict[str, Any]]] = None  # Actividades al crear programa


class ProgramOut(ProgramIn):
    id: str
    status: str
    company: Optional[CompanyBasic] = None  # Objeto company anidado
    activities: Optional[List[Dict[str, Any]]] = None  # Lista de actividades
    activities_count: Optional[int] = 0
    participants_count: Optional[int] = 0

    class Config:
        from_attributes = True


class ParticipantIn(BaseModel):
    program_id: int
    full_name: str
    role: str = Field(pattern="^(mentor|mentee)$")
    headline: Optional[str] = None
    goals: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    availability_hours: int = 2


class ParticipantOut(ParticipantIn):
    id: int

    class Config:
        from_attributes = True


class MatchOut(BaseModel):
    id: int
    program_id: int
    mentor: ParticipantOut
    mentee: ParticipantOut
    score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SmartMatchRequest(BaseModel):
    program_id: int
    mentor_id: int
    mentee_id: int


class MilestoneOut(BaseModel):
    id: int
    title: str
    status: str
    due_date: Optional[datetime]

    class Config:
        from_attributes = True


class SentimentIn(BaseModel):
    match_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class SentimentOut(BaseModel):
    id: int
    match_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationIn(BaseModel):
    recipient_id: UUID
    notification_type: str
    title: str
    message: str
    link: str = ""
    match_id: Optional[int] = None
    milestone_id: Optional[int] = None


class NotificationOut(BaseModel):
    id: int
    recipient_id: UUID
    sender_id: Optional[UUID] = None
    sender_name: Optional[str] = None
    notification_type: str
    title: str
    message: str
    link: str
    is_read: bool
    created_at: datetime
    match_id: Optional[int]
    milestone_id: Optional[int]

    class Config:
        from_attributes = True


class NotificationBroadcast(BaseModel):
    sender_id: Optional[UUID] = None
    notification_type: str = "system"
    title: str
    message: str
    link: str = ""


class NotificationMarkRead(BaseModel):
    notification_ids: list[int]


# ============= GOALS & OKRs SCHEMAS =============

class KeyResultIn(BaseModel):
    description: str
    target_value: float
    current_value: float = 0
    unit: str


class KeyResultOut(BaseModel):
    id: int
    goal_id: int
    description: str
    target_value: float
    current_value: float
    unit: str
    completed: bool
    progress_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalIn(BaseModel):
    match_id: int
    title: str
    description: str
    goal_type: str = "skill"
    priority: str = "medium"
    specific: str
    measurable: str
    achievable: str
    relevant: str
    time_bound: str  # YYYY-MM-DD
    key_results: list[KeyResultIn] = []


class GoalOut(BaseModel):
    id: int
    match_id: int
    title: str
    description: str
    goal_type: str
    priority: str
    specific: str
    measurable: str
    achievable: str
    relevant: str
    time_bound: str
    progress_percentage: int
    status: str
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[int]
    is_overdue: bool
    days_remaining: int
    key_results: list[KeyResultOut] = []

    class Config:
        from_attributes = True


class GoalUpdateIn(BaseModel):
    goal_id: int
    user_id: int
    note: str
    progress_after: int


class GoalUpdateOut(BaseModel):
    id: int
    goal_id: int
    user_id: int
    note: str
    progress_before: int
    progress_after: int
    created_at: datetime

    class Config:
        from_attributes = True


class KeyResultUpdateIn(BaseModel):
    current_value: float
    completed: bool = False


# AI / Neuramorphic Schemas
class AIRecommendationRequest(BaseModel):
    participant_id: int
    match_id: Optional[int] = None


class AIGoalRecommendation(BaseModel):
    title: str
    description: str
    goal_type: str
    priority: str
    rationale: str
    key_results: list[dict]
    estimated_duration_weeks: int


class AIRecommendationOut(BaseModel):
    recommendations: list[AIGoalRecommendation]


class AIAnalysisRequest(BaseModel):
    goal_id: int


class AIAnalysisOut(BaseModel):
    sentiment: str
    engagement_level: str
    confidence_score: float
    risk_signals: list[str]
    positive_signals: list[str]
    recommendations: list[str]
    summary: str
    predictive_alerts: list[dict]


class AIMatchHealthRequest(BaseModel):
    match_id: int


class AIMatchHealthOut(BaseModel):
    health_score: int
    health_status: str
    engagement_metrics: dict
    risk_factors: list[str]
    strengths: list[str]
    recommendations: list[str]
    next_steps: list[str]
    summary: str


# User Management Schemas
class UserOut(BaseModel):
    id: str  # UUID as string
    username: str
    email: str
    nombre: str  # Cambiado de first_name
    apellidos: str  # Cambiado de last_name
    telefono: str = ""  # Agregado
    role: str
    is_active: bool = True
    is_staff: bool = False
    is_superuser: bool = False
    date_joined: Optional[str] = None
    last_login: Optional[str] = None
    company: Optional[str] = None  # Agregado
    is_onboarded: bool = False  # Agregado
    can_manage_clients: bool = False
    can_manage_programs: bool = False
    can_manage_users: bool = False
    can_manage_activities: bool = False
    can_execute_matches: bool = False
    can_view_reports: bool = False
    can_close_programs: bool = False

    class Config:
        from_attributes = True


class UserIn(BaseModel):
    username: str
    email: str
    nombre: str  # Cambiado de first_name
    apellidos: str  # Cambiado de last_name
    telefono: str = ""  # Agregado
    role: str
    password: str


class UserUpdateIn(BaseModel):
    nombre: Optional[str] = None  # Cambiado de first_name
    apellidos: Optional[str] = None  # Cambiado de last_name
    email: Optional[str] = None
    telefono: Optional[str] = None  # Agregado
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ─── Program Template Schemas ───

class ProgramTemplateIn(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = ""
    category: Optional[str] = "leadership"
    duration: Optional[str] = ""
    status: Optional[str] = "draft"
    modules: Optional[List[Dict[str, Any]]] = []
    milestones: Optional[List[Dict[str, Any]]] = []
    tags: Optional[List[str]] = []
    mentorRequirements: Optional[Dict[str, Any]] = {}
    menteeRequirements: Optional[Dict[str, Any]] = {}
    matchingRules: Optional[Dict[str, Any]] = {}
    sessionRules: Optional[Dict[str, Any]] = {}


class ProgramTemplateOut(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    category: str
    duration: str
    status: str
    modules: List[Dict[str, Any]]
    milestones: List[Dict[str, Any]]
    tags: List[str]
    mentorRequirements: Dict[str, Any]
    menteeRequirements: Dict[str, Any]
    matchingRules: Dict[str, Any]
    sessionRules: Dict[str, Any]
    createdAt: str
    updatedAt: str
    createdBy: Optional[str] = None

    class Config:
        from_attributes = True

