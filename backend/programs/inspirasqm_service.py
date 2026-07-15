"""
InspiraSQM — asistente de IA (Claude/Anthropic) con contexto en tiempo real
del programa de mentorías. Se usa desde la Vista Corporativa para que la
empresa cliente pueda preguntar en lenguaje natural sobre participantes,
cronograma y avance de su programa, siempre con datos reales de la DB.
"""

import os
import requests
from typing import Dict, List, Optional

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-5"


class InspiraSQMChatService:
    """Chatbot de IA con contexto real del programa (mentores, mentees, cronograma)."""

    @staticmethod
    def _anon_label(full_name: str) -> str:
        """Primer nombre + inicial del apellido — nunca email ni apellido completo."""
        parts = (full_name or "").strip().split()
        if not parts:
            return "Participante"
        first = parts[0]
        initial = f" {parts[1][0]}." if len(parts) > 1 else ""
        return f"{first}{initial}"

    @staticmethod
    def build_context(program, participants, activities) -> str:
        mentors = [p for p in participants if p.role == "mentor"]
        mentees = [p for p in participants if p.role == "mentee"]

        lines: List[str] = []
        lines.append(f"Programa: {program.name}")
        lines.append(f"Empresa: {program.company.name if program.company else 'N/A'}")
        lines.append(f"Estado del programa: {program.get_status_display()}")
        if program.description:
            lines.append(f"Descripción: {program.description}")
        lines.append("")
        lines.append(f"PARTICIPANTES: {len(participants)} totales — {len(mentors)} mentores, {len(mentees)} mentees")
        lines.append("(Nota: por privacidad solo se comparten nombres de pila e iniciales, nunca emails.)")
        lines.append("Mentores:")
        for p in mentors:
            nombre = InspiraSQMChatService._anon_label(p.user.full_name)
            lines.append(f"- {nombre} — estado: {p.get_status_display()}")
        lines.append("Mentees:")
        for p in mentees:
            nombre = InspiraSQMChatService._anon_label(p.user.full_name)
            lines.append(f"- {nombre} — estado: {p.get_status_display()}")
        lines.append("")
        lines.append(f"CRONOGRAMA ({len(activities)} sesiones):")
        for a in activities:
            fecha = a.start_date.strftime("%d/%m/%Y") if a.start_date else "sin fecha"
            n_modulos = a.modules.count() if hasattr(a, "modules") else 0
            lines.append(
                f"- {a.name} | {fecha} | modalidad: {a.get_modality_display()} | "
                f"estado: {a.get_status_display()} | módulos: {n_modulos}"
            )
        return "\n".join(lines)

    @staticmethod
    def build_engagement_context(engagement: Dict) -> str:
        """Resumen agregado (sin PII) de asistencia/recursos/accesos, para insights ejecutivos."""
        agg = engagement.get("aggregates", {}) or {}
        by_role = agg.get("by_role", {}) or {}
        mentor_agg = by_role.get("mentor", {}) or {}
        mentee_agg = by_role.get("mentee", {}) or {}
        risk_counts = {"high": 0, "medium": 0, "low": 0}
        for p in engagement.get("participants", []) or []:
            r = p.get("risk")
            if r in risk_counts:
                risk_counts[r] += 1

        lines: List[str] = []
        lines.append(f"Sesiones realizadas: {agg.get('sessions_total', 0)}")
        lines.append(f"Recursos publicados: {agg.get('resources_total', 0)}")
        lines.append(
            f"Asistencia promedio: {agg.get('avg_attendance_pct', 0)}% "
            f"(mentores {mentor_agg.get('avg_attendance_pct', 0)}%, mentees {mentee_agg.get('avg_attendance_pct', 0)}%)"
        )
        lines.append(
            f"Recursos revisados en promedio: {agg.get('avg_resources_pct', 0)}% "
            f"(mentores {mentor_agg.get('avg_resources_pct', 0)}%, mentees {mentee_agg.get('avg_resources_pct', 0)}%)"
        )
        lines.append(
            f"Accesos promedio a la plataforma: {agg.get('avg_access_count', 0)} "
            f"(mentores {mentor_agg.get('avg_access_count', 0)}, mentees {mentee_agg.get('avg_access_count', 0)})"
        )
        lines.append(
            f"Participantes por nivel de riesgo de desengagement — alto: {risk_counts['high']}, "
            f"medio: {risk_counts['medium']}, saludable: {risk_counts['low']}"
        )
        for s in engagement.get("sessions", []) or []:
            fecha = s.get("date", "")[:10] if s.get("date") else "sin fecha"
            lines.append(f"- Sesión «{s.get('name')}» ({fecha}): asistencia {s.get('attendance_pct', 0)}%")
        return "\n".join(lines)

    @staticmethod
    def generate_insights(program_context: str, engagement_context: str) -> Optional[str]:
        """Resumen ejecutivo corto (bullets) para gerentes, generado por Claude a partir de datos agregados reales."""
        system_prompt = (
            "Eres InspiraSQM, analista de datos del programa de mentorías Mentor-Mentee de "
            "Inspiratoria para SQM. Vas a escribir un resumen ejecutivo BREVE (máximo 4 bullets, "
            "cada uno de una sola frase) en español, dirigido a gerentes de SQM que revisan el "
            "estado del programa. Basate ÚNICAMENTE en los datos reales entregados. Destacá lo más "
            "relevante: salud general del engagement, algún riesgo si existe, y un logro o fortaleza. "
            "Tono profesional, directo, sin relleno, sin inventar nombres ni datos que no se entregaron. "
            "Formato: bullets con «•», sin título, sin cierre.\n\n"
            f"DATOS DEL PROGRAMA:\n{program_context}\n\nDATOS DE ENGAGEMENT:\n{engagement_context}"
        )
        try:
            resp = requests.post(
                ANTHROPIC_ENDPOINT,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": ANTHROPIC_MODEL,
                    "max_tokens": 400,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": "Generá el resumen ejecutivo."}],
                },
                timeout=30,
            )
            if resp.status_code == 200:
                data = resp.json()
                blocks = data.get("content", [])
                text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
                return text or None
            print(f"Error en Anthropic API: {resp.status_code} - {resp.text}")
            return None
        except Exception as e:
            print(f"Error llamando a Claude: {str(e)}")
            return None

    @staticmethod
    def chat(message: str, history: List[Dict], context: str) -> Optional[str]:
        system_prompt = (
            "Eres InspiraSQM, el asistente de inteligencia artificial del programa de mentorías "
            "Mentor-Mentee de Inspiratoria para SQM. Respondes siempre en español, de forma clara, "
            "cálida y profesional, como si hablaras con una persona del equipo de SQM. "
            "Usa ÚNICAMENTE los datos reales del programa que se te entregan a continuación para "
            "responder preguntas sobre participantes, mentores, mentees, cronograma, módulos y avance. "
            "Los participantes se identifican solo con nombre de pila e inicial por privacidad: nunca "
            "inventes apellidos completos, emails ni otro dato de contacto que no se te haya dado. "
            "Si te preguntan algo que no está en estos datos, decilo con honestidad en vez de inventar "
            "información. Sé concisa y directa, evita relleno innecesario.\n\n"
            f"DATOS REALES DEL PROGRAMA (actualizados en tiempo real):\n{context}"
        )
        messages = [
            {"role": m["role"], "content": m["content"]}
            for m in history
            if m.get("role") in ("user", "assistant") and m.get("content")
        ]
        messages.append({"role": "user", "content": message})

        try:
            resp = requests.post(
                ANTHROPIC_ENDPOINT,
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": ANTHROPIC_MODEL,
                    "max_tokens": 1024,
                    "system": system_prompt,
                    "messages": messages,
                },
                timeout=30,
            )
            if resp.status_code == 200:
                data = resp.json()
                blocks = data.get("content", [])
                text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
                return text or None
            print(f"Error en Anthropic API: {resp.status_code} - {resp.text}")
            return None
        except Exception as e:
            print(f"Error llamando a Claude: {str(e)}")
            return None
