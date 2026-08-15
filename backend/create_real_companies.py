"""
Script para crear empresas reales de Chile
Empresas solicitadas: SQM, Clínica Las Condes, IDEAL, Banco de Chile
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mentorloop_clone.settings')
django.setup()

from companies.models import Company

def create_real_companies():
    print("\n" + "="*70)
    print("CREAR EMPRESAS REALES - Setup Inicial")
    print("="*70 + "\n")
    
    companies_data = [
        {
            "name": "SQM",
            "industry": "Minería y Química",
            "company_size": "1000+",
            "website": "https://www.sqm.com",
            "plan": "enterprise"
        },
        {
            "name": "Clínica Las Condes",
            "industry": "Salud",
            "company_size": "1000+",
            "website": "https://www.clinicalascondes.cl",
            "plan": "enterprise"
        },
        {
            "name": "IDEAL",
            "industry": "Educación Superior",
            "company_size": "201-1000",
            "website": "https://www.ideal.cl",
            "plan": "growth"
        },
        {
            "name": "Banco de Chile",
            "industry": "Servicios Financieros",
            "company_size": "1000+",
            "website": "https://www.bancochile.cl",
            "plan": "enterprise"
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for data in companies_data:
        # Intentar encontrar empresa existente
        from django.utils.text import slugify
        base_slug = slugify(data["name"])
        
        existing = Company.objects.filter(slug__startswith=base_slug).first()
        
        if existing:
            # Actualizar empresa existente
            existing.industry = data["industry"]
            existing.company_size = data["company_size"]
            existing.website = data["website"]
            existing.plan = data["plan"]
            existing.save()
            
            print(f"✏️  ACTUALIZADA: {existing.name}")
            print(f"   Slug: {existing.slug}")
            print(f"   Industria: {existing.industry}")
            print(f"   Tamaño: {existing.company_size}")
            print(f"   Website: {existing.website}")
            print(f"   Plan: {existing.plan}")
            print(f"   ✅ is_enabled: {existing.is_enabled}")
            print(f"   ✅ is_data_complete: {existing.is_data_complete}")
            print()
            updated_count += 1
        else:
            # Crear nueva empresa
            company = Company.objects.create(**data)
            
            print(f"✨ CREADA: {company.name}")
            print(f"   Slug: {company.slug}")
            print(f"   Industria: {company.industry}")
            print(f"   Tamaño: {company.company_size}")
            print(f"   Website: {company.website}")
            print(f"   Plan: {company.plan}")
            print(f"   ✅ is_enabled: {company.is_enabled}")
            print(f"   ✅ is_data_complete: {company.is_data_complete}")
            print()
            created_count += 1
    
    print("="*70)
    print(f"✅ Proceso completado:")
    print(f"   - Empresas creadas: {created_count}")
    print(f"   - Empresas actualizadas: {updated_count}")
    print(f"   - Total empresas en sistema: {Company.objects.count()}")
    print(f"   - Empresas HABILITADAS: {Company.objects.filter(is_enabled=True).count()}")
    print("="*70 + "\n")
    
    # Mostrar todas las empresas
    print("📋 LISTADO DE TODAS LAS EMPRESAS:\n")
    for company in Company.objects.all().order_by('-created_at'):
        status = "✅ HABILITADA" if company.is_enabled else "⚠️ NO HABILITADA"
        print(f"{status} | {company.name} ({company.slug})")
        if not company.is_enabled:
            missing = []
            if not company.industry: missing.append("industria")
            if not company.company_size: missing.append("tamaño")
            if not company.website: missing.append("website")
            print(f"         Faltan: {', '.join(missing)}")
    print()

if __name__ == "__main__":
    create_real_companies()
