from __future__ import annotations

from django.db import models
from django.conf import settings  # Para referenciar AUTH_USER_MODEL
import uuid


class Program(models.Model):
    STATUS_CHOICES = [
        ("designed", "Diseñado"),  # Programa diseñado, estructura definida
        ("ready_for_execution", "Listo para Ejecución"),  # Usuarios cargados
        ("in_execution", "En Ejecución"),  # Programa activo
        ("under_review", "Revisión"),  # Datos incompletos
        ("closed", "Cerrado"),  # Programa finalizado
        # Estados legacy (mantener compatibilidad)
        ("draft", "Borrador"),
        ("active", "Activo"),
        ("paused", "Pausado"),
        ("completed", "Completado"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    theme = models.CharField(max_length=120, default="General")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="designed")
    company = models.ForeignKey("companies.Company", null=True, blank=True, on_delete=models.SET_NULL, related_name="programs")

    # Trazabilidad plantilla -> programa (de qué diseño se instanció)
    template = models.ForeignKey(
        "programs.ProgramTemplate",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="programs",
    )
    # Copia congelada del diseño completo de la plantilla al momento de asignar
    # (módulos, hitos, requisitos, reglas de matching/sesiones). Así el programa
    # conserva TODO el diseño aunque la plantilla cambie o se borre después.
    design_snapshot = models.JSONField(default=dict, blank=True)
    cohort_year = models.PositiveIntegerField(null=True, blank=True)

    # Reglas de avance y certificación
    requires_certification = models.BooleanField(default=False)
    certification_rules = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_follow_up = models.DateTimeField(null=True, blank=True)  # Último seguimiento

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class Participant(models.Model):
    ROLE_CHOICES = [
        ("mentor", "Mentor"),
        ("mentee", "Mentee"),
        ("facilitator", "Facilitador"),
        ("participant", "Participante"),
        ("client", "Cliente"),
    ]

    program = models.ForeignKey(Program, related_name="participants", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=120)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    headline = models.CharField(max_length=160, blank=True)
    goals = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)
    availability_hours = models.PositiveIntegerField(default=2)
    timezone = models.CharField(max_length=60, default="UTC")
    requires_match = models.BooleanField(default=False)  # Marca si requiere match
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.role})"


class Match(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("active", "Activo"),
        ("completed", "Completado"),
    ]

    program = models.ForeignKey(Program, related_name="matches", on_delete=models.CASCADE)
    mentor = models.ForeignKey(Participant, related_name="mentor_matches", on_delete=models.CASCADE)
    mentee = models.ForeignKey(Participant, related_name="mentee_matches", on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["mentor", "mentee", "program"], name="unique_match_tuple"),
        ]

    def __str__(self) -> str:
        return f"{self.mentor.full_name} ↔ {self.mentee.full_name}"


class Milestone(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Sin iniciar"),
        ("in_progress", "En progreso"),
        ("done", "Completado"),
    ]

    match = models.ForeignKey(Match, related_name="milestones", on_delete=models.CASCADE)
    title = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    due_date = models.DateField(null=True, blank=True)
    order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"


class Sentiment(models.Model):
    match = models.ForeignKey(Match, related_name="sentiments", on_delete=models.CASCADE)
    score = models.PositiveSmallIntegerField(help_text="Rango 1-5")
    note = models.CharField(max_length=240, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self) -> str:
        return f"Sentiment {self.score}"


class Notification(models.Model):
    """Sistema de notificaciones para eventos importantes"""
    NOTIFICATION_TYPES = [
        ("milestone_due", "Milestone Vencido"),
        ("milestone_upcoming", "Milestone Próximo"),
        ("new_match", "Nuevo Match"),
        ("rating_received", "Rating Recibido"),
        ("message", "Nuevo Mensaje"),
        ("system", "Sistema"),
    ]
    
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="sent_notifications")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True)  # URL para navegar al hacer clic
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Referencias opcionales
    match = models.ForeignKey(Match, on_delete=models.CASCADE, null=True, blank=True)
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["-created_at"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.notification_type}: {self.title}"


class ChatMessage(models.Model):
    """Mensajes del chat en tiempo real entre mentores y mentees"""
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["match", "-created_at"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.sender.email}: {self.content[:50]}"


class Goal(models.Model):
    """Objetivos y OKRs para matches mentor-mentee"""
    GOAL_TYPES = [
        ("skill", "Desarrollo de Habilidad"),
        ("career", "Crecimiento de Carrera"),
        ("project", "Proyecto Específico"),
        ("leadership", "Liderazgo"),
        ("technical", "Técnico"),
        ("soft_skill", "Habilidad Blanda"),
        ("other", "Otro"),
    ]
    
    PRIORITY_LEVELS = [
        ("high", "Alta"),
        ("medium", "Media"),
        ("low", "Baja"),
    ]
    
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=200)
    description = models.TextField()
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES, default="skill")
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default="medium")
    
    # SMART criteria
    specific = models.TextField(help_text="¿Qué quiero lograr exactamente?")
    measurable = models.TextField(help_text="¿Cómo mediré el progreso?")
    achievable = models.TextField(help_text="¿Es realista con los recursos disponibles?")
    relevant = models.TextField(help_text="¿Por qué es importante este objetivo?")
    time_bound = models.DateField(help_text="¿Cuál es la fecha límite?")
    
    # Progress tracking
    progress_percentage = models.IntegerField(default=0, help_text="0-100")
    status = models.CharField(
        max_length=20,
        choices=[
            ("not_started", "No Iniciado"),
            ("in_progress", "En Progreso"),
            ("blocked", "Bloqueado"),
            ("completed", "Completado"),
            ("cancelled", "Cancelado"),
        ],
        default="not_started",
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_goals")
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["match", "-created_at"]),
            models.Index(fields=["status"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.title} - {self.progress_percentage}%"
    
    @property
    def is_overdue(self) -> bool:
        """Verifica si el objetivo está vencido"""
        from django.utils import timezone
        return self.time_bound < timezone.now().date() and self.status not in ["completed", "cancelled"]
    
    @property
    def days_remaining(self) -> int:
        """Días restantes hasta la fecha límite"""
        from django.utils import timezone
        delta = self.time_bound - timezone.now().date()
        return delta.days


class KeyResult(models.Model):
    """Key Results (resultados clave) asociados a un Goal"""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="key_results")
    description = models.CharField(max_length=300)
    target_value = models.FloatField(help_text="Valor objetivo a alcanzar")
    current_value = models.FloatField(default=0, help_text="Valor actual")
    unit = models.CharField(max_length=50, help_text="Unidad de medida (%, horas, proyectos, etc.)")
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["id"]
    
    def __str__(self) -> str:
        return f"{self.description}: {self.current_value}/{self.target_value} {self.unit}"
    
    @property
    def progress_percentage(self) -> float:
        """Calcula el porcentaje de progreso"""
        if self.target_value == 0:
            return 0
        return min(100, (self.current_value / self.target_value) * 100)


class GoalUpdate(models.Model):
    """Actualizaciones de progreso para los goals"""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="updates")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    note = models.TextField()
    progress_before = models.IntegerField()
    progress_after = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return f"Update: {self.progress_before}% → {self.progress_after}%"


class Activity(models.Model):
    """Actividades del programa (Entrenamientos o Eventos)"""
    ACTIVITY_TYPE_CHOICES = [
        ("training", "Entrenamiento"),
        ("event", "Evento"),
    ]
    
    TRAINING_CATEGORY_CHOICES = [
        ("mentors", "Mentores"),
        ("mentees", "Mentees"),
        ("facilitators", "Facilitadores"),
        ("other", "Otro"),
    ]
    
    EVENT_CATEGORY_CHOICES = [
        ("talk", "Charla"),
        ("workshop", "Workshop"),
        ("meeting", "Encuentro"),
        ("other", "Otro"),
    ]
    
    STATUS_CHOICES = [
        ("created", "Creada"),
        ("scheduled", "Programada"),
        ("rescheduled", "Reprogramada"),
        ("completed", "Realizada"),
        ("closed", "Cerrada"),
    ]
    
    MODALITY_CHOICES = [
        ("online", "Online"),
        ("in_person", "Presencial"),
        ("hybrid", "Híbrido"),
    ]
    
    program = models.ForeignKey(Program, related_name="activities", on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)
    
    # Categoría según tipo
    training_category = models.CharField(max_length=20, choices=TRAINING_CATEGORY_CHOICES, blank=True, null=True)
    event_category = models.CharField(max_length=20, choices=EVENT_CATEGORY_CHOICES, blank=True, null=True)
    
    # Rol objetivo
    target_role = models.CharField(max_length=20, choices=Participant.ROLE_CHOICES, blank=True)
    
    # Fechas
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Estado
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    
    # Configuración específica para Entrenamientos
    has_modules = models.BooleanField(default=False)  # Contenido por módulos
    requires_module_survey = models.BooleanField(default=False)  # Encuesta por módulo
    provides_certification = models.BooleanField(default=False)  # Certificación final
    
    # Configuración específica para Eventos
    modality = models.CharField(max_length=20, choices=MODALITY_CHOICES, blank=True, null=True)
    requires_satisfaction_survey = models.BooleanField(default=False)  # Encuesta de satisfacción
    provides_participation_certificate = models.BooleanField(default=False)  # Certificado de participación
    
    # Ubicación y enlace según modalidad
    meeting_url = models.URLField(blank=True, null=True)  # URL para modalidad online/híbrido
    location_address = models.CharField(max_length=500, blank=True, null=True)  # Dirección para presencial/híbrido
    
    # Facilitadores y participantes asignados
    facilitators = models.ManyToManyField(
        Participant,
        related_name="facilitated_activities",
        blank=True,
        limit_choices_to={'role': 'facilitator'}
    )
    participants = models.ManyToManyField(
        Participant,
        related_name="assigned_activities",
        blank=True
    )
    
    # Tracking
    invitations_sent = models.BooleanField(default=False)
    confirmed_count = models.IntegerField(default=0)
    attendance_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["start_date", "created_at"]
        verbose_name_plural = "Activities"
    
    def __str__(self) -> str:
        return f"{self.name} ({self.get_activity_type_display()})"
    
    @property
    def attendance_rate(self) -> float:
        """Calcula la tasa de asistencia"""
        if self.confirmed_count == 0:
            return 0
        return (self.attendance_count / self.confirmed_count) * 100


class Content(models.Model):
    """Contenido/Módulos para actividades de tipo Entrenamiento"""
    activity = models.ForeignKey(Activity, related_name="modules", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)
    is_published = models.BooleanField(default=False)
    materials_url = models.URLField(blank=True, null=True)
    
    # Campos de configuración del módulo
    duration_minutes = models.PositiveIntegerField(default=60, help_text="Duración del módulo en minutos")
    requires_evaluation = models.BooleanField(default=False, help_text="Si el módulo requiere evaluación")
    minimum_score = models.PositiveIntegerField(default=70, help_text="Puntuación mínima para aprobar (%)")
    
    # Fechas del módulo
    start_date = models.DateTimeField(null=True, blank=True, help_text="Fecha de inicio del módulo")
    end_date = models.DateTimeField(null=True, blank=True, help_text="Fecha de fin del módulo")
    
    # Encuesta del módulo
    survey_sent = models.BooleanField(default=False)
    survey_responses = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["order"]
        unique_together = ["activity", "order"]
    
    def __str__(self) -> str:
        return f"{self.title} (Módulo {self.order})"


class Survey(models.Model):
    """Encuestas (por módulo o de satisfacción)"""
    SURVEY_TYPE_CHOICES = [
        ("module", "Módulo"),
        ("satisfaction", "Satisfacción"),
    ]
    
    activity = models.ForeignKey(Activity, related_name="surveys", on_delete=models.CASCADE)
    content = models.ForeignKey(Content, null=True, blank=True, related_name="survey", on_delete=models.CASCADE)
    survey_type = models.CharField(max_length=20, choices=SURVEY_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    questions = models.JSONField(default=list)  # Lista de preguntas
    
    # Tracking
    sent_to_count = models.IntegerField(default=0)
    responses_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return f"{self.title} - {self.get_survey_type_display()}"
    
    @property
    def response_rate(self) -> float:
        """Calcula la tasa de respuesta"""
        if self.sent_to_count == 0:
            return 0
        return (self.responses_count / self.sent_to_count) * 100


class Alert(models.Model):
    """Alertas operativas para seguimiento"""
    ALERT_TYPE_CHOICES = [
        ("activity_delayed", "Actividad Atrasada"),
        ("low_confirmation", "Baja Confirmación"),
        ("low_attendance", "Baja Asistencia"),
        ("pending_surveys", "Encuestas Pendientes"),
        ("match_pending", "Match Pendiente"),
    ]
    
    STATUS_CHOICES = [
        ("active", "Activa"),
        ("in_progress", "En Proceso"),
        ("resolved", "Resuelta"),
        ("dismissed", "Descartada"),
    ]
    
    program = models.ForeignKey(Program, related_name="alerts", on_delete=models.CASCADE)
    activity = models.ForeignKey(Activity, null=True, blank=True, related_name="alerts", on_delete=models.CASCADE)
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    
    # Acción correctiva
    action_taken = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="resolved_alerts"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return f"{self.get_alert_type_display()} - {self.program.name}"


# ================================================================================
# MODELOS PARA GESTIÓN AVANZADA DE PARTICIPANTES
# ================================================================================

class ProgramParticipant(models.Model):
    """
    Modelo para gestionar la relación entre usuarios y programas.
    Extiende la funcionalidad del modelo Participant original.
    """
    ROLE_CHOICES = [
        # Roles nuevos para gestion de participantes del programa
        ("facilitator", "Facilitador"),
        ("mentor", "Mentor"),
        ("mentee", "Mentee"),
        ("participant_cell", "Participante Celula"),
        # Roles legacy para compatibilidad con data historica
        ("administrator", "Administrador"),
        ("instructor", "Instructor"),
        ("participant", "Participante"),
        ("observer", "Observador"),
    ]
    
    STATUS_CHOICES = [
        ("active", "Activo"),
        ("pending", "Pendiente"),
        ("suspended", "Suspendido"),
        ("inactive", "Inactivo"),
        ("deleted", "Eliminado"),
    ]
    
    program = models.ForeignKey(
        Program, 
        on_delete=models.CASCADE, 
        related_name="program_participants"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="program_memberships"
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="participant_cell")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    # Fechas de seguimiento
    invitation_sent_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    last_access_at = models.DateTimeField(null=True, blank=True)
    
    # Configuración adicional
    configuration = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)
    
    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)  # Soft delete
    
    class Meta:
        ordering = ["-created_at"]
        unique_together = [["program", "user"]]
    
    def __str__(self) -> str:
        return f"{self.user.get_full_name()} - {self.program.name} ({self.role})"


class Vinculation(models.Model):
    """
    Modelo para gestionar vinculaciones entre participantes (mentor-mentee, etc)
    """
    TYPE_CHOICES = [
        ("mentoria", "Mentoría"),
        ("tutoria", "Tutoría"),
        ("equipo", "Equipo"),
        ("coaching", "Coaching"),
    ]
    
    STATUS_CHOICES = [
        ("active", "Activa"),
        ("pending", "Pendiente"),
        ("inactive", "Inactiva"),
    ]
    
    program = models.ForeignKey(
        Program, 
        on_delete=models.CASCADE, 
        related_name="vinculations"
    )
    participant1 = models.ForeignKey(
        ProgramParticipant, 
        on_delete=models.CASCADE, 
        related_name="vinculations_as_1"
    )
    participant2 = models.ForeignKey(
        ProgramParticipant, 
        on_delete=models.CASCADE, 
        related_name="vinculations_as_2"
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return f"{self.participant1.user.get_full_name()} ↔ {self.participant2.user.get_full_name()} ({self.type})"


class AuditLog(models.Model):
    """
    Modelo para auditoría de acciones en el sistema de participantes
    """
    program = models.ForeignKey(
        Program, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    action = models.CharField(max_length=100)
    entity = models.CharField(max_length=50)  # user, participant, vinculation, etc
    entity_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self) -> str:
        return f"{self.action} - {self.admin_user.username} - {self.created_at}"


class ProgramChatMessage(models.Model):
    """Mensajes de chat grupal por programa — tiempo real entre participantes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="chat_messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_chat_messages")
    content = models.TextField(blank=True)
    # Attachments stored as JSON list: [{"name": "file.pdf", "url": "...", "size": 1234, "type": "application/pdf"}]
    attachments = models.JSONField(default=list, blank=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["program", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.sender.email}: {self.content[:50]}"


class ProgramTemplate(models.Model):
    """
    Plantillas de programa compartidas entre todos los usuarios.
    Toda la estructura rica (módulos, recursos, hitos, reglas) se guarda como JSON.
    """
    CATEGORY_CHOICES = [
        ("leadership", "Leadership"),
        ("tech", "Tech"),
        ("sales", "Sales"),
        ("diversity", "Diversity"),
        ("operations", "Operations"),
    ]
    STATUS_CHOICES = [
        ("draft", "Borrador"),
        ("published", "Publicada"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=200, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="leadership")
    duration = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Rich structured data as JSON
    modules = models.JSONField(default=list, blank=True)
    milestones = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    mentor_requirements = models.JSONField(default=dict, blank=True)
    mentee_requirements = models.JSONField(default=dict, blank=True)
    matching_rules = models.JSONField(default=dict, blank=True)
    session_rules = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="program_templates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.category})"


# ================================================================================
# SESIONES DE MENTORÍA
# ================================================================================

class MentoringSession(models.Model):
    """Sesión de mentoría entre mentor y mentee dentro de un programa."""
    STATUS_CHOICES = [
        ("scheduled", "Programada"),
        ("completed", "Completada"),
        ("cancelled", "Cancelada"),
        ("no_show", "No asistió"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="mentoring_sessions")
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentor_sessions")
    mentee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentee_sessions")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    meeting_url = models.URLField(blank=True)

    # Notes written by mentor after session
    session_notes = models.TextField(blank=True)
    topics_covered = models.JSONField(default=list, blank=True)
    mentee_mood = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-5")
    next_steps = models.TextField(blank=True)

    # AI-generated content suggestion for next session
    ai_suggestion = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_at"]

    def __str__(self) -> str:
        return f"{self.title} — {self.mentor.full_name} ↔ {self.mentee.full_name}"


class ActivityCompletion(models.Model):
    """Registro de actividad completada por un participante."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="completions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_completions")
    completed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = [["activity", "user"]]
        ordering = ["-completed_at"]

    def __str__(self) -> str:
        return f"{self.user.full_name} — {self.activity.name}"
