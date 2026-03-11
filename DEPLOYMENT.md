# Inspiratoria - Deployment Guide

## 🚀 Despliegue en Render

### Pre-requisitos
- Cuenta en [Render.com](https://render.com)
- Cuenta en [Google Cloud](https://console.cloud.google.com) (para Gemini API)
- Repositorio en GitHub

### Paso 1: Preparar el repositorio

```bash
# Asegúrate de tener todos los cambios
git add .
git commit -m "Production ready - MVP complete"
git push origin main
```

### Paso 2: Crear servicios en Render

#### Opción A: Blueprint (Recomendado)
1. Ir a [Render Dashboard](https://dashboard.render.com)
2. Click en "New" → "Blueprint"
3. Conectar tu repositorio GitHub
4. Render detectará automáticamente `render.yaml`
5. Configurar las variables de entorno

#### Opción B: Manual
1. Crear PostgreSQL Database
2. Crear Backend Web Service
3. Crear Frontend Web Service

### Paso 3: Configurar Variables de Entorno

#### Backend (`inspiratoria-backend`)
```env
GEMINI_API_KEY=tu_api_key_de_google_cloud
DJANGO_SECRET_KEY=generado_automaticamente_por_render
DEBUG=False
ALLOWED_HOSTS=inspiratoria-backend.onrender.com,inspiratoria-frontend.onrender.com
CORS_ALLOWED_ORIGINS=https://inspiratoria-frontend.onrender.com
DATABASE_URL=conectado_automaticamente_desde_render
```

#### Frontend (`inspiratoria-frontend`)
```env
NEXT_PUBLIC_API_BASE_URL=https://inspiratoria-backend.onrender.com/api
NODE_VERSION=18.17.0
```

### Paso 4: Deploy

Render hará el deploy automáticamente al hacer push a `main`.

Para forzar un redeploy:
```bash
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

---

## 🔧 Configuración de Producción

### Backend
El archivo `backend/mentorloop_clone/settings.py` ya está configurado para detectar automáticamente el entorno de producción mediante:
- `DEBUG = os.getenv('DEBUG', 'True') == 'True'`
- `ALLOWED_HOSTS` desde variable de entorno
- `DATABASE_URL` para PostgreSQL

### Frontend
Next.js automáticamente optimiza para producción con `npm run build`.

---

## 📊 Monitoreo

### Health Checks
- **Backend**: `https://inspiratoria-backend.onrender.com/api/health`
- **Frontend**: `https://inspiratoria-frontend.onrender.com`

### Logs
Acceder a logs en tiempo real desde el dashboard de Render:
- Backend: Dashboard → inspiratoria-backend → Logs
- Frontend: Dashboard → inspiratoria-frontend → Logs

---

## 🔄 Actualizaciones

### Proceso de actualización
1. Hacer cambios localmente
2. Testear localmente
3. Commit y push a GitHub
4. Render hace deploy automático
5. Verificar en producción

### Rollback
Si algo falla, Render permite hacer rollback a versiones anteriores desde el dashboard.

---

## 💾 Backups

### Base de Datos
Render hace backups automáticos diarios de PostgreSQL (plan Starter y superior).

Para backup manual:
```bash
# Desde tu máquina local
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

## 🔐 Seguridad

### Checklist de Producción
- [x] `DEBUG=False`
- [x] `SECRET_KEY` generado aleatoriamente
- [x] HTTPS automático (Render)
- [x] `ALLOWED_HOSTS` configurado
- [x] `CORS_ALLOWED_ORIGINS` restrictivo
- [x] Variables de entorno para secrets
- [ ] Rate limiting (implementar si es necesario)
- [ ] Monitoring y alertas

---

## 📈 Escalabilidad

### Planes recomendados

#### Fase Inicial (0-1000 usuarios)
- **Backend**: Starter ($7/mes)
- **Frontend**: Starter ($7/mes)
- **Database**: Starter ($7/mes)
- **Total**: ~$21/mes

#### Crecimiento (1000-10000 usuarios)
- **Backend**: Standard ($25/mes)
- **Frontend**: Standard ($25/mes)
- **Database**: Standard ($25/mes)
- **Total**: ~$75/mes

#### Enterprise (10000+ usuarios)
- **Backend**: Pro ($85/mes) + auto-scaling
- **Frontend**: Pro ($85/mes) + auto-scaling
- **Database**: Pro ($90/mes)
- **Total**: ~$260/mes

---

## 🆘 Troubleshooting

### Error: "Application failed to respond"
- Verificar que el `PORT` en el comando de inicio es correcto
- Revisar logs para errores de Python/Node

### Error: "Database connection failed"
- Verificar que `DATABASE_URL` está configurado
- Verificar que las migraciones se ejecutaron

### Error: "CORS error"
- Verificar `CORS_ALLOWED_ORIGINS` en backend
- Verificar `NEXT_PUBLIC_API_BASE_URL` en frontend

---

## 📞 Soporte

Para problemas de deployment:
- Documentación Render: https://render.com/docs
- GitHub Issues: https://github.com/peterfulle/inspiratoria/issues

---

**Última actualización**: December 2, 2025
