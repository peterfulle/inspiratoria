"""
Servicio de IA usando Gemini (Neuralmorphic) para procesar datos de LinkedIn
y crear perfiles estructurados de mentores/mentees.
"""

import os
import json
import google.generativeai as genai
from typing import Dict, Any, Optional


class NeuralmorphicProfileExtractor:
    """
    Usa Gemini (branded como Neuralmorphic) para analizar datos de LinkedIn
    y extraer información estructurada del perfil del participante.
    """
    
    def __init__(self):
        # Configurar Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("WARNING: GEMINI_API_KEY not configured. AI features will not work.")
            self.model = None
            return
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def extract_profile_from_linkedin(
        self, 
        linkedin_data: Dict[str, Any], 
        role: str
    ) -> Dict[str, Any]:
        """
        Analiza datos de LinkedIn y extrae perfil estructurado.
        
        Args:
            linkedin_data: Datos raw del perfil de LinkedIn (OAuth response)
            role: 'mentor' o 'mentee'
        
        Returns:
            Dict con perfil estructurado listo para crear Participant
        """
        
        # Si Gemini no está configurado, usar fallback
        if not self.model:
            return self._get_fallback_profile(linkedin_data, role)
        
        # Construir prompt específico según el rol
        if role == 'mentor':
            prompt = self._build_mentor_extraction_prompt(linkedin_data)
        else:
            prompt = self._build_mentee_extraction_prompt(linkedin_data)
        
        try:
            # Llamar a Gemini
            response = self.model.generate_content(prompt)
            
            # Parsear respuesta JSON
            extracted_data = json.loads(response.text)
            
            # Validar y limpiar datos
            profile = self._validate_and_clean_profile(extracted_data, role)
            
            return profile
            
        except Exception as e:
            print(f"Error al extraer perfil con Gemini: {str(e)}")
            return self._get_fallback_profile(linkedin_data, role)
    
    def _build_mentor_extraction_prompt(self, linkedin_data: Dict) -> str:
        """Construye prompt para extraer perfil de MENTOR"""
        
        return f"""
Eres Neuralmorphic, un asistente de IA especializado en análisis de perfiles profesionales.

Analiza los siguientes datos de LinkedIn de un MENTOR y extrae información estructurada:

DATOS DE LINKEDIN:
{json.dumps(linkedin_data, indent=2)}

TAREA:
Extrae y estructura la siguiente información en formato JSON válido:

{{
  "full_name": "string",
  "headline": "string - título profesional actual",
  "bio": "string - biografía profesional generada (2-3 oraciones destacando experiencia)",
  "skills": ["array de strings - skills técnicos y blandos relevantes"],
  "expertise_areas": ["array de strings - áreas de expertise como mentor"],
  "experience_years": "number - años totales de experiencia",
  "industry": "string - industria principal",
  "current_role": "string - cargo actual",
  "education_level": "string - nivel educativo más alto",
  "languages": ["array de strings - idiomas que habla"],
  "achievements": ["array de strings - 3-5 logros destacados"],
  "mentoring_style": "string - estilo de mentoría inferido (colaborativo/directivo/coaching)",
  "availability_recommendation": "number - horas/semana recomendadas (4-8)",
  "best_for_mentees": "string - tipo de mentees que mejor encajan con este mentor"
}}

INSTRUCCIONES:
- Si falta información, usa "No especificado" o [] para arrays
- Sé conciso pero informativo
- La bio debe ser profesional y atractiva
- Infiere el estilo de mentoría basándote en su experiencia de liderazgo
- Los achievements deben ser específicos y medibles
- RESPONDE SOLO CON JSON VÁLIDO, SIN TEXTO ADICIONAL
"""
    
    def _build_mentee_extraction_prompt(self, linkedin_data: Dict) -> str:
        """Construye prompt para extraer perfil de MENTEE"""
        
        return f"""
Eres Neuralmorphic, un asistente de IA especializado en análisis de perfiles profesionales.

Analiza los siguientes datos de LinkedIn de un MENTEE y extrae información estructurada:

DATOS DE LINKEDIN:
{json.dumps(linkedin_data, indent=2)}

TAREA:
Extrae y estructura la siguiente información en formato JSON válido:

{{
  "full_name": "string",
  "headline": "string - título profesional actual",
  "bio": "string - biografía profesional generada (2-3 oraciones destacando aspiraciones)",
  "skills": ["array de strings - skills actuales"],
  "development_areas": ["array de strings - áreas que quiere desarrollar"],
  "experience_years": "number - años totales de experiencia",
  "industry": "string - industria actual o deseada",
  "current_role": "string - cargo actual",
  "education_level": "string - nivel educativo más alto",
  "languages": ["array de strings - idiomas que habla"],
  "career_goals": ["array de strings - 3-5 objetivos profesionales inferidos"],
  "learning_style": "string - estilo de aprendizaje inferido (visual/práctico/teórico)",
  "availability_recommendation": "number - horas/semana recomendadas (2-4)",
  "ideal_mentor_profile": "string - tipo de mentor que mejor le ayudaría"
}}

INSTRUCCIONES:
- Si falta información, usa "No especificado" o [] para arrays
- Sé conciso pero motivador
- La bio debe enfocarse en potencial y aspiraciones
- Infiere objetivos profesionales basándote en su trayectoria
- Los career_goals deben ser específicos y alcanzables
- RESPONDE SOLO CON JSON VÁLIDO, SIN TEXTO ADICIONAL
"""
    
    def _validate_and_clean_profile(
        self, 
        extracted_data: Dict[str, Any], 
        role: str
    ) -> Dict[str, Any]:
        """Valida y limpia los datos extraídos"""
        
        # Campos obligatorios
        required_fields = ['full_name', 'headline', 'bio', 'skills']
        
        for field in required_fields:
            if field not in extracted_data or not extracted_data[field]:
                extracted_data[field] = "No especificado" if isinstance(extracted_data.get(field), str) else []
        
        # Limitar arrays a tamaños razonables
        if len(extracted_data.get('skills', [])) > 15:
            extracted_data['skills'] = extracted_data['skills'][:15]
        
        # Asegurar que experience_years sea un número
        try:
            extracted_data['experience_years'] = int(extracted_data.get('experience_years', 0))
        except (ValueError, TypeError):
            extracted_data['experience_years'] = 0
        
        return extracted_data
    
    def _get_fallback_profile(
        self, 
        linkedin_data: Dict[str, Any], 
        role: str
    ) -> Dict[str, Any]:
        """Perfil básico de respaldo si Gemini falla"""
        
        return {
            "full_name": linkedin_data.get('localizedFirstName', '') + ' ' + linkedin_data.get('localizedLastName', ''),
            "headline": linkedin_data.get('localizedHeadline', 'Profesional'),
            "bio": "Perfil importado desde LinkedIn. Actualizar descripción.",
            "skills": [],
            "experience_years": 0,
            "industry": "No especificado",
            "current_role": linkedin_data.get('localizedHeadline', ''),
            "education_level": "No especificado",
            "languages": ["Español"],
            "availability_recommendation": 4 if role == 'mentor' else 2
        }
    
    def enhance_profile_description(
        self, 
        profile_data: Dict[str, Any], 
        role: str
    ) -> str:
        """
        Genera una descripción mejorada del perfil usando Gemini.
        Útil cuando el usuario completa el perfil manualmente.
        """
        
        prompt = f"""
Eres Neuralmorphic, un asistente de IA especializado en mentoría.

Genera una biografía profesional atractiva (2-3 párrafos) para un {role.upper()} con estos datos:

{json.dumps(profile_data, indent=2)}

La biografía debe:
- Ser profesional pero cálida
- Destacar fortalezas clave
- Mencionar objetivos {'de desarrollo' if role == 'mentee' else 'como mentor'}
- Ser inspiradora y auténtica
- Máximo 250 palabras

RESPONDE SOLO CON LA BIOGRAFÍA, SIN FORMATO ADICIONAL.
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error al generar descripción mejorada: {str(e)}")
            return profile_data.get('bio', 'Profesional comprometido con el desarrollo y crecimiento.')
    
    def suggest_goals_for_mentee(
        self, 
        profile_data: Dict[str, Any]
    ) -> list[str]:
        """
        Sugiere objetivos profesionales para un mentee basándose en su perfil.
        """
        
        prompt = f"""
Eres Neuralmorphic, un asistente de IA especializado en desarrollo profesional.

Basándote en este perfil de MENTEE, sugiere 5 objetivos SMART específicos:

{json.dumps(profile_data, indent=2)}

Los objetivos deben ser:
- Specific (Específicos)
- Measurable (Medibles)
- Achievable (Alcanzables en 6-12 meses)
- Relevant (Relevantes para su carrera)
- Time-bound (Con plazo definido)

Formato de respuesta:
["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4", "Objetivo 5"]

RESPONDE SOLO CON UN ARRAY JSON VÁLIDO, SIN TEXTO ADICIONAL.
"""
        
        try:
            response = self.model.generate_content(prompt)
            goals = json.loads(response.text)
            return goals[:5]  # Máximo 5 objetivos
        except Exception as e:
            print(f"Error al sugerir objetivos: {str(e)}")
            return [
                "Desarrollar habilidades de liderazgo",
                "Ampliar red profesional",
                "Mejorar habilidades técnicas clave",
                "Explorar nuevas oportunidades de carrera",
                "Aumentar visibilidad profesional"
            ]


# Instancia global del servicio
neuralmorphic_service = NeuralmorphicProfileExtractor()
