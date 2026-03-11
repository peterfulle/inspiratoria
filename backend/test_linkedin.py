"""
Script de prueba para validar OAuth de LinkedIn
"""

import requests
import json
from invitations.linkedin_service import linkedin_service
from invitations.ai_service import neuralmorphic_service


def test_linkedin_auth_url():
    """Prueba 1: Generar URL de autorización"""
    print("\n" + "="*60)
    print("TEST 1: Generando URL de autorización de LinkedIn")
    print("="*60)
    
    state_token = "test_token_123"
    auth_url = linkedin_service.get_authorization_url(state_token)
    
    print(f"\n✅ URL generada exitosamente:")
    print(f"\n{auth_url}\n")
    print("📋 Copia esta URL y ábrela en tu navegador")
    print("📋 Después de autorizar, LinkedIn te redirigirá con un 'code'")
    
    return auth_url


def test_exchange_code(code: str):
    """Prueba 2: Intercambiar código por token"""
    print("\n" + "="*60)
    print("TEST 2: Intercambiando código por access token")
    print("="*60)
    
    access_token = linkedin_service.exchange_code_for_token(code)
    
    if access_token:
        print(f"\n✅ Access token obtenido:")
        print(f"{access_token[:20]}...")
        return access_token
    else:
        print("\n❌ Error al obtener access token")
        return None


def test_get_profile(access_token: str):
    """Prueba 3: Obtener perfil de LinkedIn"""
    print("\n" + "="*60)
    print("TEST 3: Obteniendo perfil de LinkedIn")
    print("="*60)
    
    profile_data = linkedin_service.get_profile_data(access_token)
    
    if profile_data:
        print("\n✅ Perfil obtenido exitosamente:")
        print(json.dumps(profile_data, indent=2))
        return profile_data
    else:
        print("\n❌ Error al obtener perfil")
        return None


def test_ai_extraction(profile_data: dict, role: str = "mentor"):
    """Prueba 4: Extraer perfil con IA"""
    print("\n" + "="*60)
    print(f"TEST 4: Extrayendo perfil con Gemini AI (rol: {role})")
    print("="*60)
    
    extracted_profile = neuralmorphic_service.extract_profile_from_linkedin(
        linkedin_data=profile_data,
        role=role
    )
    
    print("\n✅ Perfil extraído por IA:")
    print(json.dumps(extracted_profile, indent=2))
    
    return extracted_profile


def test_full_flow():
    """Flujo completo de prueba interactivo"""
    print("\n" + "="*60)
    print("🚀 PRUEBA COMPLETA DEL FLUJO LINKEDIN + IA")
    print("="*60)
    
    # Paso 1: Generar URL
    auth_url = test_linkedin_auth_url()
    
    print("\n" + "-"*60)
    input("Presiona ENTER después de autorizar en LinkedIn...")
    
    # Paso 2: Pedir código
    print("\n📋 Pega el código que aparece en la URL de redirección")
    print("(Busca el parámetro 'code=' en la URL)")
    code = input("\nCódigo: ").strip()
    
    if not code:
        print("❌ No se proporcionó código. Abortando.")
        return
    
    # Paso 3: Intercambiar código por token
    access_token = test_exchange_code(code)
    if not access_token:
        return
    
    # Paso 4: Obtener perfil
    profile_data = test_get_profile(access_token)
    if not profile_data:
        return
    
    # Paso 5: Extraer con IA
    print("\n" + "-"*60)
    role = input("\n¿Rol del participante? (mentor/mentee) [mentor]: ").strip() or "mentor"
    
    extracted_profile = test_ai_extraction(profile_data, role)
    
    print("\n" + "="*60)
    print("✅ ¡PRUEBA COMPLETADA EXITOSAMENTE!")
    print("="*60)
    print("\n📊 Resumen:")
    print(f"- Nombre: {extracted_profile.get('full_name', 'N/A')}")
    print(f"- Headline: {extracted_profile.get('headline', 'N/A')}")
    print(f"- Skills: {len(extracted_profile.get('skills', []))} skills detectados")
    print(f"- Experiencia: {extracted_profile.get('experience_years', 0)} años")
    

if __name__ == "__main__":
    print("\n🔧 Herramienta de prueba LinkedIn OAuth + Gemini AI")
    print("\nOpciones:")
    print("1. Flujo completo interactivo")
    print("2. Solo generar URL de autorización")
    print("3. Probar con código existente")
    
    opcion = input("\nSelecciona una opción [1]: ").strip() or "1"
    
    if opcion == "1":
        test_full_flow()
    elif opcion == "2":
        test_linkedin_auth_url()
    elif opcion == "3":
        code = input("Código de LinkedIn: ").strip()
        access_token = test_exchange_code(code)
        if access_token:
            profile_data = test_get_profile(access_token)
            if profile_data:
                role = input("Rol (mentor/mentee) [mentor]: ").strip() or "mentor"
                test_ai_extraction(profile_data, role)
