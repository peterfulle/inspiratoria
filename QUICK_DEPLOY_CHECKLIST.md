# ✅ CHECKLIST RÁPIDO - DEPLOYMENT EN RENDER

## 🎯 OBJETIVO
Desplegar Inspiratoria en Render en menos de 30 minutos

---

## 📋 PASOS RÁPIDOS

### ☑️ Antes de empezar (5 min)

- [ ] **Obtener Gemini API Key**
  - Ir a: https://makersuite.google.com/app/apikey
  - Click "Create API Key"
  - Copiar la key (empieza con `AIza...`)
  - ✏️ Pegarla aquí: `_________________________________`

- [ ] **Crear cuenta Render**
  - Ir a: https://render.com
  - Sign up con GitHub
  - Conectar GitHub account

---

### ☑️ Deploy Automático (20 min)

- [ ] **1. Crear Blueprint**
  - En Render Dashboard: New → Blueprint
  - Conectar repo: `peterfulle/inspiratoria`
  - Render detecta `render.yaml` automáticamente
  - Click "Apply"

- [ ] **2. Configurar Backend**
  - Ir a `inspiratoria-backend` service
  - Settings → Environment
  - Agregar variables:
    ```
    GEMINI_API_KEY = [tu key aquí]
    DEBUG = False
    ALLOWED_HOSTS = inspiratoria-backend.onrender.com
    CORS_ALLOWED_ORIGINS = https://inspiratoria-frontend.onrender.com
    ```
  - Click "Save Changes"

- [ ] **3. Configurar Frontend**
  - Ir a `inspiratoria-frontend` service
  - Settings → Environment
  - Agregar variable:
    ```
    NEXT_PUBLIC_API_BASE_URL = https://inspiratoria-backend.onrender.com/api
    ```
  - Click "Save Changes"

- [ ] **4. Esperar Deploy** ⏱️
  - Backend: ~5-7 minutos
  - Frontend: ~3-5 minutos
  - Ver progreso en "Logs"

---

### ☑️ Verificación (5 min)

- [ ] **Backend Health Check**
  - Ir a: `https://inspiratoria-backend.onrender.com/api/health`
  - Debe mostrar: `{"status": "healthy"}`
  - ✏️ URL real: `_________________________________`

- [ ] **Frontend Loading**
  - Ir a: `https://inspiratoria-frontend.onrender.com`
  - Debe cargar la landing page
  - ✏️ URL real: `_________________________________`

- [ ] **Login Test**
  - Ir a: `/login`
  - User: `admin`
  - Password: `admin123`
  - Debe redirigir al dashboard

- [ ] **Dashboard Test**
  - Ver que carguen los gráficos
  - Ver que se muestren stats
  - Probar dark mode (toggle en sidebar)

- [ ] **Crear Match Test**
  - Ir a sección "Matches"
  - Click "Create New Match"
  - Verificar que funcione el selector

---

## 🚨 TROUBLESHOOTING RÁPIDO

### ❌ Backend no responde
```bash
# Ver logs:
Dashboard → inspiratoria-backend → Logs

# Verificar:
- GEMINI_API_KEY está configurada?
- DATABASE_URL está conectada?
- Build terminó sin errores?
```

### ❌ Frontend con error CORS
```bash
# Verificar en backend:
CORS_ALLOWED_ORIGINS = https://inspiratoria-frontend.onrender.com
# (sin slash al final!)

# Verificar en frontend:
NEXT_PUBLIC_API_BASE_URL = https://inspiratoria-backend.onrender.com/api
```

### ❌ Database connection failed
```bash
# Verificar:
1. PostgreSQL database está "Available" (verde)?
2. DATABASE_URL está en environment del backend?
3. Migrations se ejecutaron? (ver logs de build)
```

---

## 📝 NOTAS POST-DEPLOY

### URLs en Producción
```
Backend:  _______________________________________
Frontend: _______________________________________
```

### Credenciales Admin
```
User:     admin
Password: admin123
```

**⚠️ IMPORTANTE**: Cambiar password de admin después del primer login!

### Costos Mensuales
```
Backend:  $7/mes
Frontend: $7/mes
Database: $7/mes (gratis por 90 días)
─────────────────
Total:    $14/mes (luego $21/mes)
```

---

## 🎉 DESPUÉS DEL DEPLOY

- [ ] Compartir URL de demo con stakeholders
- [ ] Cambiar password de admin
- [ ] Crear usuarios de prueba adicionales
- [ ] Cargar datos reales (o usar seed_demo)
- [ ] Configurar monitoring/alerts
- [ ] Planear siguiente fase de features

---

## 📞 SOPORTE

**Documentación**:
- Guía detallada: `RENDER_SETUP.md`
- Troubleshooting: `DEPLOYMENT.md`
- Brochure completo: `BROCHURE_INSPIRATORIA.md`

**Links**:
- Render Docs: https://render.com/docs
- GitHub Repo: https://github.com/peterfulle/inspiratoria

---

**Última actualización**: December 2, 2025
**Versión**: 1.0.0

---

**¡Éxito con el deployment!** 🚀
