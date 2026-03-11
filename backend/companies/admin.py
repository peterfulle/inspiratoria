from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Company, User, OnboardingInvitation


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan', 'status', 'max_users', 'created_at']
    list_filter = ['plan', 'status']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'full_name', 'role', 'company', 'is_active']
    list_filter = ['role', 'company', 'is_active']
    search_fields = ['username', 'full_name', 'email']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Company Info', {'fields': ('company', 'role', 'full_name', 'phone', 'position', 'department')}),
        ('Onboarding', {'fields': ('is_onboarded', 'onboarding_step')}),
    )


@admin.register(OnboardingInvitation)
class OnboardingInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'company', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'role', 'company']
    search_fields = ['email']
