from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("admin_root", "Admin Root"),  # Admin con permisos totales
        ("coordinator", "Coordinador"),
        ("mentor", "Mentor"),
        ("mentee", "Mentee"),
        ("facilitator", "Facilitador"),  # Facilitador de entrenamientos
        ("client", "Cliente"),  # Stakeholder del cliente/empresa
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="mentee")
    participant = models.OneToOneField(
        "programs.Participant", null=True, blank=True, on_delete=models.SET_NULL, related_name="user_account"
    )
    # Permisos específicos para admin_root
    can_manage_clients = models.BooleanField(default=False)
    can_manage_programs = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    can_manage_activities = models.BooleanField(default=False)
    can_execute_matches = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)
    can_close_programs = models.BooleanField(default=False)

    class Meta:
        db_table = "auth_user"
    
    def save(self, *args, **kwargs):
        # Si es admin_root, otorgar todos los permisos automáticamente
        if self.role == "admin_root" or self.is_superuser:
            self.can_manage_clients = True
            self.can_manage_programs = True
            self.can_manage_users = True
            self.can_manage_activities = True
            self.can_execute_matches = True
            self.can_view_reports = True
            self.can_close_programs = True
        super().save(*args, **kwargs)
