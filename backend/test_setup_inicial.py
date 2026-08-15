"""
Script para probar el flujo del Setup Inicial
Valida que los clientes se habiliten automáticamente cuando tienen datos completos
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')
django.setup()

from companies.models import Company

def test_setup_inicial():
    print("\n" + "="*60)
    print("TEST: SETUP INICIAL - Flujo de Habilitación de Clientes")
    print("="*60 + "\n")
    
    # Test 1: Crear cliente con datos incompletos
    print("📝 Test 1: Cliente con datos INCOMPLETOS")
    print("-" * 40)
    company_incompleto = Company.objects.create(
        name="Test Incompleto S.A.",
        industry="",  # Falta
        company_size="",  # Falta
        website=""  # Falta
    )
    print(f"Nombre: {company_incompleto.name}")
    print(f"Industria: '{company_incompleto.industry}' (vacío)")
    print(f"Tamaño: '{company_incompleto.company_size}' (vacío)")
    print(f"Website: '{company_incompleto.website}' (vacío)")
    print(f"is_data_complete: {company_incompleto.is_data_complete}")
    print(f"is_enabled: {company_incompleto.is_enabled}")
    assert company_incompleto.is_data_complete == False, "❌ ERROR: Debe estar incompleto"
    assert company_incompleto.is_enabled == False, "❌ ERROR: No debe estar habilitado"
    print("✅ PASS: Cliente incompleto NO está habilitado\n")
    
    # Test 2: Completar datos del cliente
    print("📝 Test 2: COMPLETAR datos del cliente")
    print("-" * 40)
    company_incompleto.industry = "Tecnología"
    company_incompleto.company_size = "201-1000"
    company_incompleto.website = "https://www.testincompleto.cl"
    company_incompleto.save()
    company_incompleto.refresh_from_db()
    
    print(f"Nombre: {company_incompleto.name}")
    print(f"Industria: '{company_incompleto.industry}'")
    print(f"Tamaño: '{company_incompleto.company_size}'")
    print(f"Website: '{company_incompleto.website}'")
    print(f"is_data_complete: {company_incompleto.is_data_complete}")
    print(f"is_enabled: {company_incompleto.is_enabled}")
    assert company_incompleto.is_data_complete == True, "❌ ERROR: Debe estar completo"
    assert company_incompleto.is_enabled == True, "❌ ERROR: Debe estar habilitado"
    print("✅ PASS: Cliente con datos completos SE HABILITA automáticamente\n")
    
    # Test 3: Crear cliente con datos completos desde el inicio
    print("📝 Test 3: Cliente con datos COMPLETOS desde creación")
    print("-" * 40)
    company_completo = Company.objects.create(
        name="SQM S.A.",
        industry="Minería",
        company_size="1000+",
        website="https://www.sqm.com"
    )
    print(f"Nombre: {company_completo.name}")
    print(f"Industria: '{company_completo.industry}'")
    print(f"Tamaño: '{company_completo.company_size}'")
    print(f"Website: '{company_completo.website}'")
    print(f"is_data_complete: {company_completo.is_data_complete}")
    print(f"is_enabled: {company_completo.is_enabled}")
    assert company_completo.is_data_complete == True, "❌ ERROR: Debe estar completo"
    assert company_completo.is_enabled == True, "❌ ERROR: Debe estar habilitado"
    print("✅ PASS: Cliente completo se HABILITA inmediatamente\n")
    
    # Test 4: Dejar incompleto un campo (volver a deshabilitarse)
    print("📝 Test 4: QUITAR un dato requerido (deshabilitación)")
    print("-" * 40)
    company_completo.website = ""
    company_completo.save()
    company_completo.refresh_from_db()
    
    print(f"Nombre: {company_completo.name}")
    print(f"Website: '{company_completo.website}' (VACÍO)")
    print(f"is_data_complete: {company_completo.is_data_complete}")
    print(f"is_enabled: {company_completo.is_enabled}")
    assert company_completo.is_data_complete == False, "❌ ERROR: Debe estar incompleto"
    assert company_completo.is_enabled == False, "❌ ERROR: Debe estar deshabilitado"
    print("✅ PASS: Cliente con datos incompletos se DESHABILITA automáticamente\n")
    
    # Cleanup
    company_incompleto.delete()
    company_completo.delete()
    
    print("="*60)
    print("✅ TODOS LOS TESTS PASARON - Setup Inicial funciona correctamente")
    print("="*60 + "\n")
    
    print("📋 RESUMEN DEL FLUJO:")
    print("1. Cliente creado sin datos completos → NO HABILITADO")
    print("2. Se completan todos los datos → HABILITADO AUTOMÁTICAMENTE")
    print("3. Cliente creado con datos completos → HABILITADO INMEDIATAMENTE")
    print("4. Se quita un dato requerido → DESHABILITADO AUTOMÁTICAMENTE")
    print("\n✨ Regla: Solo clientes HABILITADOS pueden crear programas\n")

if __name__ == "__main__":
    test_setup_inicial()
