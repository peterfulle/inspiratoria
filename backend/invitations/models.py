from django.db import models
from companies.models import Company, User
from programs.models import Program
import secrets
from datetime import timedelta
from django.utils import timezone


class PendingInvitation(models.Model):
    """
    Tabla para gestionar invitaciones pendientes de participantes.
    Cuando un admin invita a un mentor/mentee, se crea un registro aquí.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('accepted', 'Aceptada'),
        ('expired', 'Expirada'),
        ('cancelled', 'Cancelada'),
    ]
    
    ROLE_CHOICES = [
        ('mentor', 'Mentor'),
        ('mentee', 'Mentee'),
    ]
    
    # Información de la invitación
    email = models.EmailField(
        verbose_name="Email del invitado",
        help_text="Email donde se enviará la invitación"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        verbose_name="Rol asignado"
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        default=secrets.token_urlsafe,
        verbose_name="Token único de invitación"
    )
    
    # Relaciones
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='pending_invitations',
        verbose_name="Empresa"
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name='pending_invitations',
        verbose_name="Programa asignado"
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_invitations',
        verbose_name="Invitado por"
    )
    
    # Estado y fechas
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Estado"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación"
    )
    expires_at = models.DateTimeField(
        verbose_name="Fecha de expiración"
    )
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de aceptación"
    )
    
    # Datos adicionales
    personal_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Mensaje personalizado",
        help_text="Mensaje opcional que verá el invitado"
    )
    
    class Meta:
        db_table = 'pending_invitations'
        verbose_name = 'Invitación Pendiente'
        verbose_name_plural = 'Invitaciones Pendientes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'status']),
            models.Index(fields=['token']),
            models.Index(fields=['company', 'status']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.role} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Si es una nueva invitación, establecer expiración en 7 días
        if not self.pk and not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Verifica si la invitación es válida"""
        if self.status != 'pending':
            return False
        if timezone.now() > self.expires_at:
            self.status = 'expired'
            self.save()
            return False
        return True
    
    def mark_as_accepted(self):
        """Marca la invitación como aceptada"""
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save()


class OnboardingProgress(models.Model):
    """
    Rastrea el progreso del onboarding de un participante.
    Útil para permitir que el usuario complete el proceso en múltiples sesiones.
    """
    
    STEP_CHOICES = [
        ('validation', 'Validación de Token'),
        ('account', 'Creación de Cuenta'),
        ('linkedin', 'Importación LinkedIn'),
        ('profile', 'Completar Perfil'),
        ('config', 'Configuración Específica'),
        ('completed', 'Completado'),
    ]
    
    invitation = models.OneToOneField(
        PendingInvitation,
        on_delete=models.CASCADE,
        related_name='onboarding_progress',
        verbose_name="Invitación"
    )
    current_step = models.CharField(
        max_length=20,
        choices=STEP_CHOICES,
        default='validation',
        verbose_name="Paso actual"
    )
    
    # Datos recopilados durante el onboarding
    linkedin_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Datos de LinkedIn (raw)"
    )
    extracted_profile = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Perfil extraído por IA"
    )
    custom_data = models.JSONField(
        default=dict,
        verbose_name="Datos personalizados"
    )
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'onboarding_progress'
        verbose_name = 'Progreso de Onboarding'
        verbose_name_plural = 'Progresos de Onboarding'
    
    def __str__(self):
        return f"{self.invitation.email} - {self.current_step}"
    
    def advance_step(self, next_step):
        """Avanza al siguiente paso del onboarding"""
        self.current_step = next_step
        if next_step == 'completed':
            self.completed_at = timezone.now()
        self.save()
