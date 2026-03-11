from django.contrib import admin

from programs.models import Match, Milestone, Participant, Program, Sentiment


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("name", "theme", "status", "created_at")
    search_fields = ("name", "theme")
    list_filter = ("status", "theme")


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("full_name", "role", "program", "availability_hours")
    list_filter = ("role", "program")
    search_fields = ("full_name", "skills")


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ("program", "mentor", "mentee", "score", "status")
    list_filter = ("status", "program")
    search_fields = ("mentor__full_name", "mentee__full_name")
    inlines = [MilestoneInline]


@admin.register(Sentiment)
class SentimentAdmin(admin.ModelAdmin):
    list_display = ("match", "score", "recorded_at")
    list_filter = ("score", "recorded_at")
