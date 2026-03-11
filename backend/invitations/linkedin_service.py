"""
Servicio OAuth 2.0 para LinkedIn.
Maneja autenticación y obtención de datos del perfil.
"""

import os
import requests
from typing import Dict, Any, Optional
from urllib.parse import urlencode


class LinkedInOAuthService:
    """
    Servicio para manejar autenticación OAuth 2.0 con LinkedIn
    y obtener datos del perfil del usuario.
    """
    
    # URLs de LinkedIn OAuth
    AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    # API v2 endpoints (no requieren OpenID Connect)
    PROFILE_URL = "https://api.linkedin.com/v2/userinfo"
    EMAIL_URL = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
    
    # Scopes necesarios (API v2 básica)
    SCOPES = [
        'openid',
        'profile', 
        'email',
    ]
    
    def __init__(self):
        self.client_id = os.getenv('LINKEDIN_CLIENT_ID')
        self.client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
        self.redirect_uri = os.getenv('LINKEDIN_REDIRECT_URI', 'http://localhost:3000/onboarding/linkedin-callback')
        
        # Permitir que falten credenciales en desarrollo (usaremos mock)
        if not self.client_id or not self.client_secret:
            print("WARNING: LinkedIn OAuth credentials not configured. LinkedIn auth will not work.")
            self.client_id = "mock_client_id"
            self.client_secret = "mock_client_secret"
    
    def get_authorization_url(self, state: str) -> str:
        """
        Genera URL para iniciar flujo OAuth.
        
        Args:
            state: Token único para prevenir CSRF attacks
        
        Returns:
            URL completa para redirigir al usuario
        """
        
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'state': state,
            'scope': ' '.join(self.SCOPES)
        }
        
        return f"{self.AUTHORIZATION_URL}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code: str) -> Optional[str]:
        """
        Intercambia el código de autorización por un access token.
        
        Args:
            code: Código recibido del callback de LinkedIn
        
        Returns:
            Access token o None si falla
        """
        
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        try:
            response = requests.post(self.TOKEN_URL, data=data, timeout=10)
            response.raise_for_status()
            
            token_data = response.json()
            return token_data.get('access_token')
            
        except requests.exceptions.RequestException as e:
            print(f"Error al intercambiar código por token: {str(e)}")
            return None
    
    def get_profile_data(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene datos del perfil de LinkedIn usando el access token.
        
        Args:
            access_token: Token de acceso de LinkedIn
        
        Returns:
            Dict con datos del perfil o None si falla
        """
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            # Obtener perfil usando OpenID Connect userinfo endpoint
            profile_response = requests.get(self.PROFILE_URL, headers=headers, timeout=10)
            profile_response.raise_for_status()
            profile_data = profile_response.json()
            
            # El endpoint /v2/userinfo ya incluye email si el scope está presente
            # No necesitamos hacer llamada separada
            
            return profile_data
            
        except requests.exceptions.RequestException as e:
            print(f"Error al obtener perfil de LinkedIn: {str(e)}")
            return None
    
    def _extract_email(self, email_data: Dict) -> str:
        """Extrae email del response de LinkedIn"""
        try:
            elements = email_data.get('elements', [])
            if elements:
                handle = elements[0].get('handle~', {})
                return handle.get('emailAddress', '')
        except (KeyError, IndexError):
            pass
        return ''
    
    def _enrich_profile_data(
        self, 
        profile_data: Dict, 
        access_token: str, 
        headers: Dict
    ) -> Dict[str, Any]:
        """
        Intenta obtener datos adicionales del perfil (experiencia, educación, skills).
        Nota: Algunos endpoints requieren permisos adicionales.
        """
        
        # URL para obtener más detalles del perfil
        detailed_urls = {
            'positions': 'https://api.linkedin.com/v2/positions?q=members&projection=(elements*(company,title,startDate,endDate))',
            'educations': 'https://api.linkedin.com/v2/educations?q=members&projection=(elements*(schoolName,degreeName,fieldOfStudy))',
            'skills': 'https://api.linkedin.com/v2/skills?q=members&projection=(elements*(name))'
        }
        
        for key, url in detailed_urls.items():
            try:
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    profile_data[key] = response.json()
            except requests.exceptions.RequestException:
                # Si falla, simplemente no agregamos esos datos
                profile_data[key] = None
        
        return profile_data
    
    def validate_token(self, access_token: str) -> bool:
        """
        Valida si un access token sigue siendo válido.
        
        Args:
            access_token: Token a validar
        
        Returns:
            True si el token es válido, False en caso contrario
        """
        
        headers = {'Authorization': f'Bearer {access_token}'}
        
        try:
            response = requests.get(self.PROFILE_URL, headers=headers, timeout=10)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False


# Instancia global del servicio
linkedin_service = LinkedInOAuthService()
