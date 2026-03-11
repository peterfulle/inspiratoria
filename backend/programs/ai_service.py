"""
Servicio de IA con Neuramorphic AI (powered by Gemini 2.0 Flash)
Proporciona recomendaciones inteligentes, análisis de sentimientos y alertas predictivas
"""

import os
import json
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta

# API Key de Gemini 2.0 desde variable de entorno
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


class GeminiAIService:
    """Servicio de IA Neuramorphic usando Gemini 2.0 Flash como backend"""
    
    @staticmethod
    def _call_gemini(prompt: str, temperature: float = 0.7) -> Optional[str]:
        """Llamada base a la API de Gemini"""
        try:
            headers = {
                "Content-Type": "application/json",
                "X-goog-api-key": GEMINI_API_KEY
            }
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": temperature,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1024,
                }
            }
            
            response = requests.post(
                GEMINI_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"Error en Gemini API: {response.status_code} - {response.text}")
            
            return None
        except Exception as e:
            print(f"Error llamando a Gemini: {str(e)}")
            return None
    
    @staticmethod
    def generate_goal_recommendations(
        participant_skills: List[str],
        participant_interests: List[str],
        participant_role: str,
        current_goals: List[Dict]
    ) -> List[Dict]:
        """
        Genera recomendaciones de goals basadas en el perfil del participante
        """
        prompt = f"""
Eres un experto mentor y coach profesional. Analiza el siguiente perfil y genera 3 recomendaciones de goals SMART:

**Perfil del Participante:**
- Rol: {participant_role}
- Habilidades: {", ".join(participant_skills) if participant_skills else "No especificadas"}
- Intereses: {", ".join(participant_interests) if participant_interests else "No especificados"}

**Goals actuales:**
{json.dumps(current_goals, indent=2) if current_goals else "Sin goals definidos aún"}

**Instrucciones:**
1. Genera 3 goals SMART específicos y accionables
2. Considera las habilidades e intereses del participante
3. Asegúrate de que sean diferentes a los goals actuales
4. Incluye KPIs medibles (Key Results)

**Formato de respuesta (JSON):**
{{
  "recommendations": [
    {{
      "title": "Título del goal",
      "description": "Descripción detallada",
      "goal_type": "skill|career|project|leadership|technical|soft_skill",
      "priority": "high|medium|low",
      "rationale": "Por qué este goal es relevante para el participante",
      "key_results": [
        {{
          "description": "KPI específico y medible",
          "target_value": 100,
          "unit": "unidad de medida"
        }}
      ],
      "estimated_duration_weeks": 8
    }}
  ]
}}

Responde SOLO con el JSON, sin texto adicional.
"""
        
        response_text = GeminiAIService._call_gemini(prompt, temperature=0.8)
        
        if response_text:
            try:
                # Limpiar respuesta (remover markdown)
                clean_response = response_text.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                data = json.loads(clean_response)
                return data.get("recommendations", [])
            except json.JSONDecodeError as e:
                print(f"Error parseando JSON de Gemini: {str(e)}")
                print(f"Respuesta recibida: {response_text}")
        
        return []
    
    @staticmethod
    def analyze_goal_sentiment(
        goal_title: str,
        goal_description: str,
        updates_history: List[Dict]
    ) -> Dict:
        """
        Analiza el sentimiento y progreso de un goal
        Detecta señales de riesgo, motivación y engagement
        """
        updates_text = "\n".join([
            f"- {u['created_at']}: {u['note']} (progreso: {u['progress_before']}% → {u['progress_after']}%)"
            for u in updates_history
        ])
        
        prompt = f"""
Eres un analista de datos experto en coaching y desarrollo profesional. Analiza el siguiente goal y su historial:

**Goal:**
- Título: {goal_title}
- Descripción: {goal_description}

**Historial de Updates:**
{updates_text if updates_text else "Sin updates aún"}

**Instrucciones:**
Analiza el sentimiento, motivación y riesgos. Genera un reporte con:
1. Sentimiento general (positive/neutral/negative)
2. Nivel de engagement (high/medium/low)
3. Señales de riesgo detectadas
4. Recomendaciones para mejorar

**Formato de respuesta (JSON):**
{{
  "sentiment": "positive|neutral|negative",
  "engagement_level": "high|medium|low",
  "confidence_score": 0.85,
  "risk_signals": [
    "Descripción de señal de riesgo detectada"
  ],
  "positive_signals": [
    "Descripción de señal positiva detectada"
  ],
  "recommendations": [
    "Recomendación específica para mejorar"
  ],
  "summary": "Resumen ejecutivo del análisis (2-3 líneas)"
}}

Responde SOLO con el JSON, sin texto adicional.
"""
        
        response_text = GeminiAIService._call_gemini(prompt, temperature=0.5)
        
        if response_text:
            try:
                clean_response = response_text.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                data = json.loads(clean_response)
                return data
            except json.JSONDecodeError as e:
                print(f"Error parseando JSON de Gemini: {str(e)}")
        
        return {
            "sentiment": "neutral",
            "engagement_level": "medium",
            "confidence_score": 0.0,
            "risk_signals": [],
            "positive_signals": [],
            "recommendations": [],
            "summary": "No se pudo analizar el goal"
        }
    
    @staticmethod
    def generate_predictive_alerts(
        goal_data: Dict,
        progress_percentage: float,
        days_remaining: int
    ) -> List[Dict]:
        """
        Genera alertas predictivas basadas en el progreso del goal
        """
        alerts = []
        
        # Calcular velocidad esperada
        if days_remaining > 0:
            expected_progress = 100 - (days_remaining / 90) * 100  # Asumiendo 90 días típicos
            progress_gap = expected_progress - progress_percentage
            
            # Alerta de progreso lento
            if progress_gap > 20:
                alerts.append({
                    "type": "slow_progress",
                    "severity": "high",
                    "title": "⚠️ Progreso por debajo de lo esperado",
                    "message": f"El goal está {progress_gap:.0f}% por debajo del ritmo esperado. Se recomienda revisar los key results y ajustar el plan.",
                    "action": "Agendar sesión de revisión con mentor"
                })
            
            # Alerta de deadline próximo
            if days_remaining <= 7 and progress_percentage < 80:
                alerts.append({
                    "type": "deadline_approaching",
                    "severity": "critical",
                    "title": "🚨 Deadline próximo con progreso bajo",
                    "message": f"Quedan {days_remaining} días y el progreso es {progress_percentage}%. Se recomienda priorizar este goal.",
                    "action": "Priorizar tareas relacionadas"
                })
            
            # Alerta de excelente progreso
            if progress_percentage > expected_progress + 15:
                alerts.append({
                    "type": "excellent_progress",
                    "severity": "low",
                    "title": "🎉 Progreso excepcional",
                    "message": f"¡El goal está {progress_percentage - expected_progress:.0f}% por encima del ritmo esperado! Considera establecer goals más ambiciosos.",
                    "action": "Celebrar milestone y establecer nuevo reto"
                })
        
        return alerts
    
    @staticmethod
    def analyze_match_health(
        match_data: Dict,
        chat_messages: List[Dict],
        goals: List[Dict],
        session_frequency: int
    ) -> Dict:
        """
        Analiza la salud general de un match mentor-mentee
        """
        prompt = f"""
Eres un experto en programas de mentoring. Analiza la salud de este match:

**Datos del Match:**
- Score de compatibilidad: {match_data.get('score', 0)}
- Sesiones en las últimas 4 semanas: {session_frequency}
- Total de mensajes: {len(chat_messages)}
- Goals activos: {len([g for g in goals if g.get('status') == 'in_progress'])}
- Goals completados: {len([g for g in goals if g.get('status') == 'completed'])}

**Últimos mensajes del chat:**
{chr(10).join([f"- {m.get('content', '')[:100]}" for m in chat_messages[-5:]]) if chat_messages else "Sin mensajes"}

**Instrucciones:**
Genera un reporte de salud del match con métricas y recomendaciones.

**Formato de respuesta (JSON):**
{{
  "health_score": 85,
  "health_status": "excellent|good|needs_attention|critical",
  "engagement_metrics": {{
    "communication": "high|medium|low",
    "goal_completion": "high|medium|low",
    "session_frequency": "high|medium|low"
  }},
  "risk_factors": [
    "Factor de riesgo identificado"
  ],
  "strengths": [
    "Fortaleza del match"
  ],
  "recommendations": [
    "Recomendación específica"
  ],
  "next_steps": [
    "Acción sugerida"
  ],
  "summary": "Resumen ejecutivo (2-3 líneas)"
}}

Responde SOLO con el JSON, sin texto adicional.
"""
        
        response_text = GeminiAIService._call_gemini(prompt, temperature=0.6)
        
        if response_text:
            try:
                clean_response = response_text.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                clean_response = clean_response.strip()
                
                data = json.loads(clean_response)
                return data
            except json.JSONDecodeError as e:
                print(f"Error parseando JSON de Gemini: {str(e)}")
        
        return {
            "health_score": 50,
            "health_status": "needs_attention",
            "engagement_metrics": {
                "communication": "medium",
                "goal_completion": "medium",
                "session_frequency": "medium"
            },
            "risk_factors": [],
            "strengths": [],
            "recommendations": [],
            "next_steps": [],
            "summary": "No se pudo analizar el match"
        }
