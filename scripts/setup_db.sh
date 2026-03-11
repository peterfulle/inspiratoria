#!/bin/bash
# Script para inicializar la base de datos desde cero

cd "$(dirname "$0")/.."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Iniciando setup de base de datos...${NC}"

# 1. Crear migraciones
echo -e "${GREEN}📝 Creando migraciones...${NC}"
/Users/peterfulle/Desktop/Inspiratoria/.venv/bin/python backend/manage.py makemigrations

# 2. Aplicar migraciones
echo -e "${GREEN}⚙️  Aplicando migraciones...${NC}"
/Users/peterfulle/Desktop/Inspiratoria/.venv/bin/python backend/manage.py migrate

# 3. Crear superusuario demo
echo -e "${GREEN}👤 Creando superusuario demo...${NC}"
/Users/peterfulle/Desktop/Inspiratoria/.venv/bin/python backend/manage.py shell <<EOF
from companies.models import Company, User
from django.contrib.auth.hashers import make_password

# Crear empresa demo
company = Company.objects.create(
    name="Inspiratoria Demo",
    slug="inspiratoria-demo",
    industry="Tecnología",
    company_size="11-50",
    plan="growth",
    status="active",
    onboarding_completed=True
)

# Crear superadmin
user = User.objects.create(
    username="admin",
    email="admin@inspiratoria.com",
    password=make_password("admin123"),
    full_name="Administrador Demo",
    role="admin",
    company=company,
    is_onboarded=True,
    is_staff=True,
    is_superuser=True,
    is_active=True
)

print(f"✅ Empresa creada: {company.name}")
print(f"✅ Usuario creado: {user.username} (password: admin123)")
EOF

echo -e "${GREEN}✅ Setup completado!${NC}"
echo -e "${YELLOW}Puedes iniciar sesión con: admin / admin123${NC}"
