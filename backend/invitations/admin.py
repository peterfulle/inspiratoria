from django.contrib import admin
from .models import PendingInvitation, OnboardingProgress


@admin.register(PendingInvitation)
class PendingInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'company', 'program', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'role', 'company', 'created_at']
    search_fields = ['email', 'token']
    readonly_fields = ['token', 'created_at', 'accepted_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('email', 'role', 'status')
        }),
        ('Relaciones', {
            'fields': ('company', 'program', 'invited_by')
        }),
        ('Token y Seguridad', {
            'fields': ('token', 'created_at', 'expires_at', 'accepted_at')
        }),
        ('Mensaje', {
            'fields': ('personal_message',),
            'classes': ('collapse',)
        }),
    )


@admin.register(OnboardingProgress)
class OnboardingProgressAdmin(admin.ModelAdmin):
    list_display = ['invitation', 'current_step', 'started_at', 'updated_at', 'completed_at']
    list_filter = ['current_step', 'started_at']
    search_fields = ['invitation__email']
    readonly_fields = ['started_at', 'updated_at', 'completed_at']
    date_hierarchy = 'started_at'
    
    fieldsets = (
        ('Invitación', {
            'fields': ('invitation', 'current_step')
        }),
        ('Datos de LinkedIn', {
            'fields': ('linkedin_data', 'extracted_profile'),
            'classes': ('collapse',)
        }),
        ('Datos Personalizados', {
            'fields': ('custom_data',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('started_at', 'updated_at', 'completed_at')
        }),
    )
