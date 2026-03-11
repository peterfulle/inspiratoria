from __future__ import annotations

from django.test import TestCase

from programs.models import Participant, Program
from programs.services.matching import compute_match_score, create_match_with_score


class MatchingServiceTests(TestCase):
    def setUp(self) -> None:
        self.program = Program.objects.create(name="Test", description="", theme="General", status="active")
        self.mentor = Participant.objects.create(
            program=self.program,
            full_name="Mentor Uno",
            role="mentor",
            skills=["liderazgo", "producto"],
            goals=["coaching"],
            availability_hours=3,
        )
        self.mentee = Participant.objects.create(
            program=self.program,
            full_name="Mentee Uno",
            role="mentee",
            skills=["producto"],
            goals=["liderazgo"],
            availability_hours=2,
        )

    def test_compute_match_score_overlap(self) -> None:
        score = compute_match_score(self.mentor, self.mentee)
        self.assertGreater(score, 0)

    def test_create_match_with_score_creates_milestones(self) -> None:
        match = create_match_with_score(self.program.id, self.mentor.id, self.mentee.id)
        self.assertEqual(match.milestones.count(), 4)
