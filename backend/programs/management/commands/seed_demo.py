from __future__ import annotations

from django.core.management.base import BaseCommand

from programs.models import Participant, Program
from programs.services.matching import create_match_with_score


def _bootstrap_program() -> Program:
    program, _ = Program.objects.get_or_create(
        name="Future Leaders",
        defaults={
            "description": "Programa de mentoría orientado a liderazgo inclusivo",
            "theme": "Leadership",
            "status": "active",
        },
    )
    return program


def _bootstrap_participants(program: Program) -> None:
    mentors = [
        {
            "full_name": "Ana Mentor",
            "role": "mentor",
            "headline": "VP de Producto",
            "skills": ["liderazgo", "producto", "innovación"],
            "goals": ["coaching"],
        },
        {
            "full_name": "Carlos Coach",
            "role": "mentor",
            "headline": "Director de Talento",
            "skills": ["talento", "diversidad", "coaching"],
            "goals": ["impacto social"],
        },
    ]
    mentees = [
        {
            "full_name": "Beatriz Aprendiz",
            "role": "mentee",
            "headline": "PM Junior",
            "goals": ["liderazgo", "innovación"],
            "skills": ["producto"],
        },
        {
            "full_name": "Diego Explorer",
            "role": "mentee",
            "headline": "HR Business Partner",
            "goals": ["diversidad", "coaching"],
            "skills": ["talento"],
        },
    ]

    for payload in mentors + mentees:
        Participant.objects.get_or_create(program=program, full_name=payload["full_name"], defaults=payload)


def _seed_matches(program: Program) -> None:
    mentors = list(program.participants.filter(role="mentor"))
    mentees = list(program.participants.filter(role="mentee"))
    for mentor, mentee in zip(mentors, mentees, strict=False):
        create_match_with_score(program.id, mentor.id, mentee.id)


class Command(BaseCommand):
    help = "Crea datos demo para probar la plataforma"

    def handle(self, *args, **options):  # type: ignore[override]
        program = _bootstrap_program()
        _bootstrap_participants(program)
        _seed_matches(program)
        self.stdout.write(self.style.SUCCESS("Datos demo creados"))
