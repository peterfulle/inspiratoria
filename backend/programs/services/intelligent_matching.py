"""
Intelligent mentor-mentee matching engine.

Operates over `companies.User` profiles (rich onboarding data) and returns
ranked suggestions with an explainable, weighted multi-dimensional score.

Dimensions (sum to 100):
    skills_x_goals      25  · mentor.skills ↔ mentee.mentee_goals + mentee_interests
    topics_x_challenges 20  · mentor.mentor_topics ↔ mentee.mentee_challenges + interests
    style_fit           15  · mentor.mentor_style ↔ mentee.preferred_mentor_style
    experience_fit      15  · mentor.experience_level / experience_area vs mentee profile
    objectives_fit      15  · mentor.mentor_objectives ↔ mentee.mentee_expectations + goals
    domain_fit          10  · mentor.position/department/headline ↔ mentee.position/headline

If the mentee profile is empty, the score scales down proportionally.
"""

from __future__ import annotations

import os
import json
import re
import unicodedata
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests

from companies.models import User


# ────────────────────────────── helpers ──────────────────────────────

_STOPWORDS = {
    "de", "del", "la", "el", "los", "las", "y", "o", "u", "a", "en", "con",
    "para", "por", "un", "una", "the", "and", "or", "of", "to", "in", "for",
    "with", "on", "at", "as", "is", "be", "que", "qué", "como", "cómo",
    "mi", "tu", "su", "se", "lo", "le", "al",
}


def _norm(text: str) -> str:
    """lowercase + strip accents"""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", str(text))
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def _tokens(text: str) -> set[str]:
    if not text:
        return set()
    n = _norm(text)
    raw = re.split(r"[^a-z0-9]+", n)
    return {t for t in raw if t and len(t) > 2 and t not in _STOPWORDS}


def _to_list(value: Any) -> List[str]:
    """Normalize any field to a list of clean strings."""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return []
        # Try JSON
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(v).strip() for v in parsed if str(v).strip()]
        except Exception:
            pass
        # Fallback comma split
        return [p.strip() for p in s.split(",") if p.strip()]
    return [str(value).strip()]


def _flat_tokens(values: Iterable[str]) -> set[str]:
    out: set[str] = set()
    for v in values:
        out |= _tokens(v)
    return out


def _overlap_ratio(a_tokens: set[str], b_tokens: set[str]) -> Tuple[float, List[str]]:
    """Jaccard-like overlap over the smaller side. Returns (ratio 0-1, matched tokens)."""
    if not a_tokens or not b_tokens:
        return 0.0, []
    matched = sorted(a_tokens & b_tokens)
    denom = min(len(a_tokens), len(b_tokens))
    return (len(matched) / denom), matched


def _items_overlap(
    a_items: List[str], b_items: List[str]
) -> Tuple[float, List[str]]:
    """
    Compare two lists of phrases. Returns (ratio 0-1 over smaller side, matched phrases).
    A pair is considered matched if any token-level overlap exists.
    """
    if not a_items or not b_items:
        return 0.0, []
    a_norm = [(item, _tokens(item)) for item in a_items if _tokens(item)]
    b_norm = [(item, _tokens(item)) for item in b_items if _tokens(item)]
    if not a_norm or not b_norm:
        return 0.0, []
    matches: List[str] = []
    for a_item, a_tok in a_norm:
        for b_item, b_tok in b_norm:
            if a_tok & b_tok:
                # Use the more descriptive (longer) phrase as the matched label
                matches.append(a_item if len(a_item) >= len(b_item) else b_item)
                break
    denom = min(len(a_norm), len(b_norm))
    return (len(matches) / denom), sorted(set(matches))


# ────────────────────────────── scoring ──────────────────────────────

WEIGHTS: Dict[str, int] = {
    "skills_x_goals": 25,
    "topics_x_challenges": 20,
    "style_fit": 15,
    "experience_fit": 15,
    "objectives_fit": 15,
    "domain_fit": 10,
}

EXPERIENCE_RANK: Dict[str, int] = {
    "junior": 1, "jr": 1, "trainee": 1, "principiante": 1,
    "mid": 2, "midlevel": 2, "ssr": 2, "intermedio": 2, "intermediate": 2,
    "senior": 3, "sr": 3, "avanzado": 3, "advanced": 3,
    "lead": 4, "principal": 4, "staff": 4,
    "expert": 5, "experto": 5, "director": 5, "executive": 5, "ejecutivo": 5,
}


def _experience_rank(level: str) -> int:
    return EXPERIENCE_RANK.get(_norm(level), 0)


def _profile(user: User, role: str) -> Dict[str, Any]:
    """Extract a normalized profile dict from a User object."""
    data: Dict[str, Any] = {
        "id": str(user.id),
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "role": role,
        "headline": getattr(user, "headline", "") or "",
        "bio": getattr(user, "bio", "") or "",
        "position": getattr(user, "position", "") or "",
        "department": getattr(user, "department", "") or "",
        "skills": _to_list(getattr(user, "skills", [])),
        "experience_level": getattr(user, "experience_level", "") or "",
        "experience_area": _to_list(getattr(user, "experience_area", [])),
    }
    if role == "mentor":
        data.update({
            "mentor_topics": _to_list(getattr(user, "mentor_topics", [])),
            "mentor_objectives": _to_list(getattr(user, "mentor_objectives", [])),
            "mentor_style": _to_list(getattr(user, "mentor_style", [])),
            "mentee_preference": _to_list(getattr(user, "mentee_preference", [])),
            "mentee_outcomes": _to_list(getattr(user, "mentee_outcomes", [])),
        })
    else:
        data.update({
            "mentee_goals": _to_list(getattr(user, "mentee_goals", [])),
            "mentee_interests": _to_list(getattr(user, "mentee_interests", [])),
            "mentee_challenges": _to_list(getattr(user, "mentee_challenges", [])),
            "mentee_expectations": _to_list(getattr(user, "mentee_expectations", [])),
            "preferred_mentor_style": _to_list(getattr(user, "preferred_mentor_style", [])),
        })
    return data


def _profile_strength(profile: Dict[str, Any]) -> float:
    """0..1 — how much profile data we have. Used to attenuate scores when sparse."""
    role = profile.get("role")
    if role == "mentor":
        keys = ["skills", "mentor_topics", "mentor_objectives", "mentor_style", "experience_area"]
    else:
        keys = ["mentee_goals", "mentee_interests", "mentee_challenges",
                "mentee_expectations", "preferred_mentor_style"]
    filled = sum(1 for k in keys if profile.get(k))
    return filled / len(keys) if keys else 0.0


def score_pair(mentor: User, mentee: User) -> Dict[str, Any]:
    """Compute an explainable score for a (mentor, mentee) pair."""
    m = _profile(mentor, "mentor")
    e = _profile(mentee, "mentee")

    breakdown: Dict[str, Dict[str, Any]] = {}
    matched_overall: List[str] = []

    # 1) skills × (goals + interests)
    mentee_focus = e["mentee_goals"] + e["mentee_interests"]
    ratio, matches = _items_overlap(m["skills"], mentee_focus)
    pts = ratio * WEIGHTS["skills_x_goals"]
    breakdown["skills_x_goals"] = {
        "weight": WEIGHTS["skills_x_goals"],
        "earned": round(pts, 2),
        "ratio": round(ratio, 3),
        "matches": matches,
        "label": "Skills del mentor vs goals/intereses del mentee",
    }
    matched_overall += matches

    # 2) topics × challenges (+ interests)
    ratio, matches = _items_overlap(
        m["mentor_topics"], e["mentee_challenges"] + e["mentee_interests"]
    )
    pts2 = ratio * WEIGHTS["topics_x_challenges"]
    breakdown["topics_x_challenges"] = {
        "weight": WEIGHTS["topics_x_challenges"],
        "earned": round(pts2, 2),
        "ratio": round(ratio, 3),
        "matches": matches,
        "label": "Temas del mentor vs desafíos/intereses del mentee",
    }
    matched_overall += matches

    # 3) style fit
    ratio, matches = _items_overlap(m["mentor_style"], e["preferred_mentor_style"])
    pts3 = ratio * WEIGHTS["style_fit"]
    breakdown["style_fit"] = {
        "weight": WEIGHTS["style_fit"],
        "earned": round(pts3, 2),
        "ratio": round(ratio, 3),
        "matches": matches,
        "label": "Compatibilidad de estilo de mentoring",
    }
    matched_overall += matches

    # 4) experience fit
    mentor_rank = _experience_rank(m["experience_level"])
    mentee_rank = _experience_rank(e["experience_level"])
    if mentor_rank > 0 and mentee_rank > 0:
        gap = mentor_rank - mentee_rank
        # Best when mentor is 1-3 levels above mentee
        if 1 <= gap <= 3:
            level_score = 1.0
        elif gap == 0:
            level_score = 0.6
        elif gap > 3:
            level_score = 0.5
        else:  # mentor below mentee
            level_score = 0.2
    elif mentor_rank > 0 or mentee_rank > 0:
        level_score = 0.5
    else:
        level_score = 0.0

    area_ratio, area_matches = _items_overlap(
        m["experience_area"],
        e["mentee_interests"] + e["mentee_goals"] + e["mentee_challenges"],
    )
    exp_total = (level_score * 0.5 + area_ratio * 0.5)
    pts4 = exp_total * WEIGHTS["experience_fit"]
    breakdown["experience_fit"] = {
        "weight": WEIGHTS["experience_fit"],
        "earned": round(pts4, 2),
        "ratio": round(exp_total, 3),
        "matches": area_matches,
        "level_gap": gap if (mentor_rank and mentee_rank) else None,
        "mentor_level": m["experience_level"] or None,
        "mentee_level": e["experience_level"] or None,
        "label": "Nivel y área de experiencia",
    }
    matched_overall += area_matches

    # 5) objectives fit
    ratio, matches = _items_overlap(
        m["mentor_objectives"], e["mentee_expectations"] + e["mentee_goals"]
    )
    pts5 = ratio * WEIGHTS["objectives_fit"]
    breakdown["objectives_fit"] = {
        "weight": WEIGHTS["objectives_fit"],
        "earned": round(pts5, 2),
        "ratio": round(ratio, 3),
        "matches": matches,
        "label": "Objetivos del mentor vs expectativas del mentee",
    }
    matched_overall += matches

    # 6) domain fit (free-text headline/position/department/bio)
    mentor_domain_text = " ".join([m["position"], m["department"], m["headline"], m["bio"]])
    mentee_domain_text = " ".join([e["position"], e["department"], e["headline"], e["bio"]])
    ratio, matches_tok = _overlap_ratio(_tokens(mentor_domain_text), _tokens(mentee_domain_text))
    pts6 = ratio * WEIGHTS["domain_fit"]
    breakdown["domain_fit"] = {
        "weight": WEIGHTS["domain_fit"],
        "earned": round(pts6, 2),
        "ratio": round(ratio, 3),
        "matches": matches_tok,
        "label": "Afinidad de rol/área profesional",
    }
    matched_overall += matches_tok

    raw_total = pts + pts2 + pts3 + pts4 + pts5 + pts6

    # Attenuation by mentee profile completeness (avoid inflated scores when empty)
    mentee_strength = _profile_strength(e)
    mentor_strength = _profile_strength(m)
    # Soft attenuation: never below 0.6 to not over-punish empty profiles
    attenuation = 0.6 + 0.4 * ((mentee_strength + mentor_strength) / 2)
    final_total = round(raw_total * attenuation, 2)

    # Build human-readable reasons
    reasons: List[str] = []
    for key, info in breakdown.items():
        if info["earned"] >= 4:
            label = info["label"]
            if info.get("matches"):
                sample = ", ".join(info["matches"][:3])
                reasons.append(f"{label}: {sample}")
            else:
                reasons.append(label)
    if not reasons:
        reasons.append("Coincidencia base — los perfiles tienen poco detalle aún.")

    return {
        "score": min(100.0, final_total),
        "raw_score": round(raw_total, 2),
        "attenuation": round(attenuation, 3),
        "mentor_profile_strength": round(mentor_strength, 3),
        "mentee_profile_strength": round(mentee_strength, 3),
        "breakdown": breakdown,
        "matched_keywords": sorted(set(matched_overall))[:25],
        "reasons": reasons,
        "mentor": {
            "id": m["id"], "name": m["name"], "email": m["email"],
            "headline": m["headline"], "position": m["position"],
            "department": m["department"], "skills": m["skills"],
            "topics": m["mentor_topics"], "style": m["mentor_style"],
            "experience_level": m["experience_level"],
            "experience_area": m["experience_area"],
        },
        "mentee": {
            "id": e["id"], "name": e["name"], "email": e["email"],
            "headline": e["headline"], "position": e["position"],
            "department": e["department"],
            "goals": e["mentee_goals"], "interests": e["mentee_interests"],
            "challenges": e["mentee_challenges"],
            "expectations": e["mentee_expectations"],
            "preferred_style": e["preferred_mentor_style"],
            "experience_level": e["experience_level"],
        },
    }


# ────────────────────────────── candidate selection ──────────────────────────────

def _query_users(role: str, program_id: Optional[str], company_id: Optional[str]) -> List[User]:
    qs = User.objects.filter(role=role, is_active=True)
    if company_id:
        qs = qs.filter(company_id=company_id)
    if program_id:
        from programs.models import ProgramParticipant
        user_ids = ProgramParticipant.objects.filter(
            program_id=program_id, deleted_at__isnull=True,
        ).values_list("user_id", flat=True)
        qs = qs.filter(id__in=list(user_ids))
    return list(qs)


def intelligent_match(
    *,
    program_id: Optional[str] = None,
    company_id: Optional[str] = None,
    mentor_id: Optional[str] = None,
    mentee_id: Optional[str] = None,
    top_k: int = 10,
    min_score: float = 0.0,
    use_ai: bool = False,
) -> Dict[str, Any]:
    """
    Run intelligent matching. Returns {results: [...], stats: {...}}.

    Modes:
      - default: cross-product of mentors × mentees (filtered by program/company)
      - mentor_id: rank the best mentees for a given mentor
      - mentee_id: rank the best mentors for a given mentee
    """
    if mentor_id:
        try:
            mentor = User.objects.get(id=mentor_id, role="mentor")
        except User.DoesNotExist:
            return {"results": [], "stats": {"error": "mentor not found"}}
        mentees = _query_users("mentee", program_id, company_id or str(mentor.company_id) if mentor.company_id else None)
        pairs = [(mentor, e) for e in mentees]
    elif mentee_id:
        try:
            mentee = User.objects.get(id=mentee_id, role="mentee")
        except User.DoesNotExist:
            return {"results": [], "stats": {"error": "mentee not found"}}
        mentors = _query_users("mentor", program_id, company_id or str(mentee.company_id) if mentee.company_id else None)
        pairs = [(m, mentee) for m in mentors]
    else:
        mentors = _query_users("mentor", program_id, company_id)
        mentees = _query_users("mentee", program_id, company_id)
        pairs = [(m, e) for m in mentors for e in mentees]

    if not pairs:
        return {
            "results": [],
            "stats": {
                "mentors": 0, "mentees": 0, "pairs": 0,
                "reason": "no candidates found in scope",
            },
        }

    scored = [score_pair(m, e) for m, e in pairs]
    scored = [s for s in scored if s["score"] >= min_score]
    scored.sort(key=lambda s: s["score"], reverse=True)
    top = scored[: max(1, top_k)]

    if use_ai and top:
        for item in top[:5]:  # keep cost low — only top 5
            item["ai_recommendation"] = _ai_explain(item) or _fallback_recommendation(item)

    mentor_ids = {p[0].id for p in pairs}
    mentee_ids = {p[1].id for p in pairs}
    return {
        "results": top,
        "stats": {
            "mentors": len(mentor_ids),
            "mentees": len(mentee_ids),
            "pairs": len(pairs),
            "returned": len(top),
            "min_score": min_score,
        },
    }


# ────────────────────────────── AI explanation (Claude) ──────────────────────────────

def _fallback_recommendation(result: Dict[str, Any]) -> str:
    """Rule-based fallback when Claude is unavailable."""
    score = result["score"]
    mentor_name = result["mentor"]["name"]
    mentee_name = result["mentee"]["name"]
    top_matches = result.get("matched_keywords", [])[:4]
    kw = f" Afinidad en: {', '.join(top_matches)}." if top_matches else ""

    if score >= 75:
        return (
            f"Excelente match entre {mentor_name} y {mentee_name}.{kw} "
            "Alta compatibilidad en habilidades, objetivos y estilo de mentoring."
        )
    if score >= 55:
        return (
            f"Buen match entre {mentor_name} y {mentee_name}.{kw} "
            "Base sólida — se recomienda sesión inicial para alinear expectativas."
        )
    return (
        f"Match viable entre {mentor_name} y {mentee_name}.{kw} "
        "Compatibilidad moderada; reforzar el perfil del mentee maximizará el impacto."
    )


def _ai_explain(result: Dict[str, Any]) -> Optional[str]:
    """
    Claude-powered match explanation.
    Uses claude-haiku-4-5 for speed and cost efficiency at scale.
    Falls back silently if ANTHROPIC_API_KEY is not set.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None

    mentor = result["mentor"]
    mentee = result["mentee"]
    score = result["score"]

    # Build compact breakdown for context
    top_dimensions = sorted(
        result.get("breakdown", {}).items(),
        key=lambda x: x[1].get("earned", 0),
        reverse=True,
    )[:3]
    dim_summary = "; ".join(
        f"{v.get('label', k)}: {v.get('earned', 0):.0f}/{v.get('weight', 0):.0f}"
        for k, v in top_dimensions
    )
    matched_kw = ", ".join(result.get("matched_keywords", [])[:6]) or "—"

    system = (
        "Eres un experto en programas de mentoría corporativa. "
        "Analizas perfiles de mentores y mentees para explicar por qué un match "
        "es valioso o qué limitaciones tiene. Respondes en español, tono profesional "
        "y directo, máximo 3 oraciones."
    )

    user_msg = f"""Analiza este match mentor-mentee y explica su calidad:

MENTOR: {mentor['name']}
• Headline: {mentor.get('headline') or '—'}
• Skills: {', '.join(mentor.get('skills', [])) or '—'}
• Temas que puede enseñar: {', '.join(mentor.get('topics', [])) or '—'}
• Estilo de mentoring: {', '.join(mentor.get('style', [])) or '—'}
• Nivel/área de experiencia: {mentor.get('experience_level', '')} — {', '.join(mentor.get('experience_area', [])) or '—'}

MENTEE: {mentee['name']}
• Headline: {mentee.get('headline') or '—'}
• Objetivos: {', '.join(mentee.get('goals', [])) or '—'}
• Intereses: {', '.join(mentee.get('interests', [])) or '—'}
• Desafíos: {', '.join(mentee.get('challenges', [])) or '—'}
• Estilo preferido: {', '.join(mentee.get('preferred_style', [])) or '—'}

SCORE: {score}/100
Dimensiones destacadas: {dim_summary}
Keywords en común: {matched_kw}

Responde SOLO con el análisis explicativo (sin encabezados, sin JSON, sin listas)."""

    try:
        import anthropic as _anthropic
        client = _anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )
        text = message.content[0].text.strip() if message.content else ""
        return text or None
    except Exception as exc:  # noqa: BLE001
        print(f"[intelligent_matching] Claude error: {exc}")
    return None
