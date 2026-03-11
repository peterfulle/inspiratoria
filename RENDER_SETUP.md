# 🚀 INSPIRATORIA - GUÍA DE DEPLOYMENT EN RENDER

## ✅ STATUS: Código subido a GitHub exitosamente

**Repositorio**: https://github.com/peterfulle/inspiratoria
**Rama**: main
**Commit**: Initial commit con 71 archivos (16,616 líneas)

---

## 📋 PRÓXIMOS PASOS PARA DEPLOYMENT

### 1️⃣ Obtener API Key de Google Gemini

1. Ir a: https://makersuite.google.com/app/apikey
2. Crear o seleccionar un proyecto
3. Hacer click en "Create API Key"
4. Copiar la API Key (empieza con `AIza...`)
5. **Guardarla** - la necesitarás en Render

---

### 2️⃣ Crear cuenta en Render (si no tienes)

1. Ir a: https://render.com
2. Sign up (puedes usar tu cuenta de GitHub)
3. Conectar tu cuenta de GitHub
4. Autorizar acceso a repositorios

---

### 3️⃣ Deploy con Blueprint (Método Recomendado)

#### Paso A: Crear nuevo Blueprint
1. En Render Dashboard, click **"New"** → **"Blueprint"**
2. Conectar tu repositorio: `peterfulle/inspiratoria`
3. Render detectará automáticamente `render.yaml`
4. Click en **"Apply"**

#### Paso B: Configurar Variables de Entorno

**Para `inspiratoria-backend`**:
```
GEMINI_API_KEY=TU_API_KEY_DE_GOOGLE_AQUI
DEBUG=False
ALLOWED_HOSTS=inspiratoria-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://inspiratoria-frontend.onrender.com
```

**Para `inspiratoria-frontend`**:
```
NEXT_PUBLIC_API_BASE_URL=https://inspiratoria-backend.onrender.com/api
```

#### Paso C: Deploy
1. Render comenzará a hacer build automáticamente
2. Esperar 5-10 minutos para el primer deploy
3. Verificar que ambos servicios estén "Live" (verde)

---

### 4️⃣ Deploy Manual (Alternativa)

Si prefieres crear los servicios manualmente:

#### A. Crear PostgreSQL Database
1. Dashboard → **"New"** → **"PostgreSQL"**
2. Nombre: `inspiratoria-db`
3. Plan: Starter (gratis por 90 días)
4. Region: Oregon
5. Click **"Create Database"**
6. **Copiar el `Internal Database URL`** (lo necesitarás)

#### B. Crear Backend Service
1. Dashboard → **"New"** → **"Web Service"**
2. Conectar repo: `peterfulle/inspiratoria`
3. Configuración:
   - **Name**: `inspiratoria-backend`
   - **Root Directory**: (dejar vacío)
   - **Environment**: Python 3
   - **Build Command**:
     ```bash
     pip install --upgrade pip
     pip install -r backend/requirements.txt
     python backend/manage.py collectstatic --noinput
     python backend/manage.py migrate
     ```
   - **Start Command**:
     ```bash
     cd backend && uvicorn mentorloop_clone.asgi:application --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: Starter ($7/mes)

4. Variables de entorno:
   - `PYTHON_VERSION`: `3.9.18`
   - `GEMINI_API_KEY`: Tu API key de Google
   - `DJANGO_SECRET_KEY`: (auto-generar o usar uno random)
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `inspiratoria-backend.onrender.com`
   - `CORS_ALLOWED_ORIGINS`: `https://inspiratoria-frontend.onrender.com`
   - `DATABASE_URL`: Pegar el Internal Database URL de PostgreSQL

5. Click **"Create Web Service"**

#### C. Crear Frontend Service
1. Dashboard → **"New"** → **"Web Service"**
2. Conectar repo: `peterfulle/inspiratoria`
3. Configuración:
   - **Name**: `inspiratoria-frontend`
   - **Root Directory**: (dejar vacío)
   - **Environment**: Node
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     cd frontend && npm start
     ```
   - **Plan**: Starter ($7/mes)

4. Variables de entorno:
   - `NODE_VERSION`: `18.17.0`
   - `NEXT_PUBLIC_API_BASE_URL`: `https://inspiratoria-backend.onrender.com/api`

5. Click **"Create Web Service"**

---

### 5️⃣ Verificación Post-Deploy

#### Health Checks
Después de que ambos servicios estén "Live":

1. **Backend**:
   - URL: `https://inspiratoria-backend.onrender.com/api/health`
   - Debe responder: `{"status": "healthy"}`

2. **Frontend**:
   - URL: `https://inspiratoria-frontend.onrender.com`
   - Debe cargar la landing page

3. **Login Test**:
   - Ir a: `https://inspiratoria-frontend.onrender.com/login`
   - User: `admin`
   - Password: `admin123`
   - Debe redirigir al dashboard

#### Si algo falla:
1. Ir a Render Dashboard
2. Click en el servicio con error
3. Ver **"Logs"** para diagnosticar
4. Problemas comunes:
   - `ModuleNotFoundError`: Falta dependencia en requirements.txt
   - `CORS error`: Verificar CORS_ALLOWED_ORIGINS
   - `Database connection`: Verificar DATABASE_URL

---

### 6️⃣ Configuración de Dominio Custom (Opcional)

Si tienes un dominio propio:

1. Ir a Render → Service → **"Settings"**
2. Scroll a **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Ingresar tu dominio (ej: `app.inspiratoria.com`)
5. Configurar DNS según instrucciones de Render
6. Actualizar `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` con nuevo dominio

---

## 📊 COSTOS ESTIMADOS

### Plan Gratuito (Starter)
```
Backend:    $7/mes
Frontend:   $7/mes
Database:   $0/mes (gratis por 90 días, luego $7/mes)
───────────────────
TOTAL:      $14/mes (luego $21/mes)
```

### Notas sobre el plan gratuito:
- Backend y Frontend se "duermen" después de 15 min de inactividad
- Primera carga después de dormir puede tomar 30-50 segundos
- Suficiente para demos y testing
- 750 horas/mes de runtime

### Plan Recomendado para Producción
```
Backend:    $25/mes (Standard)
Frontend:   $25/mes (Standard)
Database:   $25/mes (Standard)
───────────────────
TOTAL:      $75/mes
```

Incluye:
- Sin "sleep"
- 24/7 uptime
- Mejor performance
- Más recursos (RAM, CPU)

---

## 🔧 MANTENIMIENTO

### Actualizar código en producción
```bash
# Hacer cambios localmente
git add .
git commit -m "Descripción de cambios"
git push origin main

# Render hace redeploy automático
```

### Ver logs en tiempo real
```bash
# Opción 1: Dashboard de Render
# Ir a Service → Logs

# Opción 2: CLI de Render
render logs -t backend
render logs -t frontend
```

### Rollback a versión anterior
1. Render Dashboard → Service
2. Tab **"Events"**
3. Click en **"Rollback"** en el deploy anterior

---

## 🎯 SIGUIENTES FEATURES A IMPLEMENTAR

Una vez en producción, puedes trabajar en:

1. **Notifications System** (16-24h)
   - Email notifications con Sendgrid
   - Push notifications

2. **Automated Reports** (24-32h)
   - Scheduled reports con Celery
   - PDF generation

3. **Calendar Integration** (24-32h)
   - Google Calendar sync
   - Outlook integration

4. **Multi-tenancy** (40-56h)
   - Múltiples organizaciones
   - Aislamiento de datos

Ver roadmap completo en: `BROCHURE_INSPIRATORIA.md`

---

## 📞 SOPORTE

### Documentación útil:
- **Render Docs**: https://render.com/docs
- **Django Deploy**: https://docs.djangoproject.com/en/5.0/howto/deployment/
- **Next.js Deploy**: https://nextjs.org/docs/deployment

### Si necesitas ayuda:
- Render Support: https://render.com/support
- GitHub Issues: https://github.com/peterfulle/inspiratoria/issues

---

## ✨ CHECKLIST FINAL

Antes de considerar el deployment completo:

- [ ] Ambos servicios "Live" en Render
- [ ] Backend responde en `/api/health`
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] Crear matches funciona
- [ ] Charts se cargan
- [ ] Dark mode funciona
- [ ] Exportar a Excel funciona
- [ ] Sin errores en logs
- [ ] Performance aceptable (< 3s TTFB)

---

**Fecha**: December 2, 2025
**Versión**: 1.0.0
**Status**: ✅ Código en GitHub - Listo para deploy en Render

---

¡Éxito con el deployment! 🚀
