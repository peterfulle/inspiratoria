from __future__ import annotations

from decimal import Decimal

from django.db import transaction

from programs.models import Match, Milestone, Participant


def compute_match_score(mentor: Participant, mentee: Participant) -> Decimal:
    mentor_skills = set(mentor.skills)
    mentee_goals = set(mentee.goals)
    overlap = mentor_skills.intersection(mentee_goals)
    availability_factor = min(mentor.availability_hours, mentee.availability_hours)
    score = len(overlap) * 10 + availability_factor * 2
    return Decimal(min(score, 100))


def create_match_with_score(program_id: int, mentor_id: int, mentee_id: int) -> Match:
    mentor = Participant.objects.get(pk=mentor_id, program_id=program_id)
    mentee = Participant.objects.get(pk=mentee_id, program_id=program_id)

    if mentor.role != "mentor" or mentee.role != "mentee":
        raise ValueError("Roles incompatibles para el emparejamiento")

    score = compute_match_score(mentor, mentee)

    with transaction.atomic():
        match, _ = Match.objects.get_or_create(
            program_id=program_id,
            mentor=mentor,
            mentee=mentee,
            defaults={"score": score, "status": "active"},
        )
        if match.milestones.count() == 0:
            Milestone.objects.bulk_create(
                [
                    Milestone(match=match, title="Kick-off", order=1),
                    Milestone(match=match, title="Definir objetivos", order=2),
                    Milestone(match=match, title="Revisión de mitad de ciclo", order=3),
                    Milestone(match=match, title="Cierre", order=4),
                ]
            )
    return match
