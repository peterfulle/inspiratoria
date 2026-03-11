# 🚀 Quick Start - Sistema de Onboarding

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ **Iniciar Backend**
```bash
cd backend
source .venv/bin/activate
python manage.py runserver
```
✅ Backend corriendo en: http://localhost:8000

### 2️⃣ **Iniciar Frontend**
```bash
cd frontend
npm run dev
```
✅ Frontend corriendo en: http://localhost:3000

---

## 🧪 **Testing Rápido**

### **Método 1: Desde UI (Recomendado)**
1. Abre: http://localhost:3000
2. Login como admin
3. Click en "AdminDashboard"
4. Sección "Participantes" → "Agregar Participante"
5. Completa:
   - Email: `mentor@test.com`
   - Rol: `Mentor`
   - Programa: Selecciona uno
6. Click "Enviar Invitación"
7. **Copia el link del modal de éxito**
8. Pega en **modo incógnito** → Completa onboarding

### **Método 2: Script Python (Más Rápido)**
```bash
cd backend
source .venv/bin/activate
python generate_invitation.py mentor@test.com mentor
```

**Copia el URL generado y ábrelo en tu navegador.**

---

## 🔗 **URLs Importantes**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | App principal |
| Backend Admin | http://localhost:8000/admin | Django admin |
| API Docs | http://localhost:8000/api/docs | Swagger UI |
| Onboarding | http://localhost:3000/onboarding?token=xxx | Página pública |

---

## 🎯 **Flujo Simplificado**

```
Admin invita
    ↓
Participante recibe link
    ↓
Completa 6 pasos:
  1. Validación
  2. Crear cuenta
  3. LinkedIn (opcional) 
  4. Perfil
  5. Config rol
  6. Confirmación
    ↓
Auto-login → Dashboard
```

---

## 📝 **Credenciales por Defecto**

### **Admin (ejemplo)**
```
Email: admin@inspiratoria.com
Password: tu_contraseña
```

### **LinkedIn OAuth**
```
Client ID: 7801chy7hcexca
Redirect: http://localhost:3000/onboarding/linkedin-callback
```

### **Gemini AI**
```
Model: gemini-2.5-flash
API Key: (en .env)
```

---

## 🐛 **Problemas Comunes**

### **"No se encuentra el módulo framer-motion"**
```bash
cd frontend
npm install framer-motion
```

### **"No hay programas disponibles"**
1. Login como admin
2. AdminDashboard → Programas
3. Crear al menos un programa

### **"Token inválido o expirado"**
```bash
python backend/generate_invitation.py --list
```
Genera uno nuevo si es necesario.

---

## 📚 **Documentación Completa**

- **ONBOARDING_SYSTEM.md** (800 líneas) - Guía completa
- **ONBOARDING_SUMMARY.md** - Resumen ejecutivo
- **Este archivo** - Quick start

---

## ✅ **Checklist Pre-Testing**

- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000
- [ ] .env configurado con todas las variables
- [ ] Al menos un programa creado en la DB
- [ ] Usuario admin creado

**¡Listo para probar! 🎉**

---

## 🆘 **Comandos Útiles**

```bash
# Listar invitaciones pendientes
python backend/generate_invitation.py --list

# Generar URL de LinkedIn para testing
python backend/generate_linkedin_url.py

# Crear superuser
python backend/manage.py createsuperuser

# Ver migraciones
python backend/manage.py showmigrations

# Reiniciar servidor backend
# Ctrl+C en terminal → python manage.py runserver
```

---

**¿Dudas? Revisa la documentación completa en `ONBOARDING_SYSTEM.md`**
