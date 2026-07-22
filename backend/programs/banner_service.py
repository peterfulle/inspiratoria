"""
Banner de programa — genera un fondo SVG abstracto (con Claude) para el header
del programa en Studio, en vez del bloque de texto plano que había antes.

Se genera UNA vez y se cachea en Program.banner_svg — no se le pide a Claude
en cada carga de página.
"""

import os
import re
from typing import Optional

import requests

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-5"

# Paletas por tema — mismo espíritu que THEME_GRADIENTS del frontend, para que
# el banner combine con el resto de la UI en vez de traer colores random.
THEME_PALETTES = {
    "leadership": ["#0c4a6e", "#0e7490", "#0891b2", "#06b6d4"],
    "innovation": ["#0c4a6e", "#0369a1", "#0284c7", "#0ea5e9"],
    "diversity": ["#134e4a", "#0f766e", "#0d9488", "#14b8a6"],
    "onboarding": ["#064e3b", "#047857", "#059669", "#10b981"],
    "technical": ["#0c4a6e", "#075985", "#0369a1", "#0284c7"],
    "empleabilidad": ["#3730a3", "#4338ca", "#4f46e5", "#6366f1"],
    "general": ["#164e63", "#155e75", "#0e7490", "#0891b2"],
}

SVG_TAG_RE = re.compile(r"<svg[\s\S]*</svg>", re.IGNORECASE)


def _extract_svg(text: str) -> Optional[str]:
    """Limpia fences de markdown y se queda solo con el <svg>...</svg>."""
    match = SVG_TAG_RE.search(text or "")
    if not match:
        return None
    svg = match.group(0).strip()
    if len(svg) > 60_000:  # guardrail contra respuestas gigantes
        return None
    return svg


def generate_program_banner_svg(theme: str, company_name: str) -> Optional[str]:
    """
    Devuelve el markup de un <svg> abstracto de fondo, o None si Claude no está
    configurado o falla — el frontend usa un degradado CSS como respaldo.
    """
    if not ANTHROPIC_API_KEY:
        return None

    colors = THEME_PALETTES.get((theme or "").lower(), THEME_PALETTES["general"])

    system_prompt = (
        "Eres un diseñador de fondos abstractos para headers de aplicaciones SaaS "
        "corporativas B2B, estilo Stripe/Linear. Vas a generar ÚNICAMENTE el código "
        "de un SVG, nada de texto antes o después, sin explicación, sin bloque de "
        "markdown (sin ```), directamente empezando en '<svg' y terminando en '</svg>'.\n\n"
        "Requisitos del SVG:\n"
        f"- viewBox=\"0 0 1200 300\", width=\"100%\" height=\"100%\", preserveAspectRatio=\"xMidYMid slice\".\n"
        f"- Paleta EXCLUSIVA (no uses otros colores): {', '.join(colors)}, y blanco/negro solo con baja opacidad para brillos o sombras sutiles.\n"
        "- Composición abstracta y elegante: pocas formas geométricas grandes (círculos, "
        "ondas suaves, líneas diagonales finas), con buen espacio negativo. NADA de texto, "
        "letras, logos ni íconos — el texto se superpone después con HTML.\n"
        "- Que se vea profesional y sobrio, no infantil ni recargado. Máximo 12 elementos."
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
                "max_tokens": 2000,
                "system": system_prompt,
                "messages": [{
                    "role": "user",
                    "content": f"Generá el fondo para el programa de la empresa \"{company_name}\".",
                }],
            },
            timeout=45,
        )
        if resp.status_code != 200:
            print(f"Error generando banner (Anthropic {resp.status_code}): {resp.text[:300]}")
            return None
        data = resp.json()
        blocks = data.get("content", [])
        text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
        return _extract_svg(text)
    except Exception as e:
        print(f"Error generando banner de programa: {str(e)}")
        return None
