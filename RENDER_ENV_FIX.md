# 🚀 Configuración de Variables de Entorno en Render

## ❌ Problema Detectado

El frontend en Render está intentando conectar a `localhost:8001` en lugar del backend de producción.

**Errores en consola:**
```
GET http://localhost:8001/api/stats/dashboard net::ERR_CONNECTION_REFUSED
GET http://localhost:8001/api/stats/timeline?days=30 net::ERR_CONNECTION_REFUSED
```

## ✅ Solución

### 1. Configurar Variables de Entorno en Render Frontend

Ve a tu servicio **inspiratoria-frontend** en Render Dashboard y agrega estas variables de entorno:

```env
NEXT_PUBLIC_API_BASE_URL=https://inspiratoria-backend.onrender.com/api
NEXT_PUBLIC_BACKEND_URL=https://inspiratoria-backend.onrender.com
NEXT_PUBLIC_API_URL=https://inspiratoria-backend.onrender.com
```

### 2. Pasos en Render Dashboard

1. Ve a https://dashboard.render.com
2. Selecciona el servicio **inspiratoria-frontend**
3. Click en **"Environment"** en el menú lateral
4. Click en **"Add Environment Variable"**
5. Agrega cada variable:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://inspiratoria-backend.onrender.com/api`
6. Repite para las otras dos variables
7. Click en **"Save Changes"**

### 3. Redeploy Automático

Render automáticamente re-desplegará el frontend con las nuevas variables.

## 📋 Variables Explicadas

- **NEXT_PUBLIC_API_BASE_URL**: URL base para endpoints de API con `/api`
  - Usada por: `lib/api.ts` → `ApiClient`
  
- **NEXT_PUBLIC_BACKEND_URL**: URL base del backend sin `/api`
  - Usada por: `DashboardStatsCards.tsx`, `ProgramManagement.tsx`, `MatchingEngineAI.tsx`, `DataMigration.tsx`, `ChatWindow.tsx`
  
- **NEXT_PUBLIC_API_URL**: URL alternativa para algunos componentes
  - Usada por: `lib/api/company.ts`, `ProgramWizard.tsx`

## 🔍 Verificación

Después del redeploy, verifica en la consola del navegador que las URLs ahora apuntan a:
```
https://inspiratoria-backend.onrender.com/api/programs
https://inspiratoria-backend.onrender.com/api/stats/dashboard
```

## 📝 Cambios Realizados en el Código

### Archivos Actualizados:
1. ✅ `frontend/src/lib/api.ts` - Exporta `backendUrl`
2. ✅ `frontend/src/components/DashboardStatsCards.tsx` - Usa `backendUrl`
3. ✅ `frontend/src/components/ProgramManagement.tsx` - Usa `backendUrl`
4. ✅ `frontend/src/components/MatchingEngineAI.tsx` - Usa `backendUrl`
5. ✅ `frontend/src/components/DataMigration.tsx` - Usa `backendUrl`
6. ✅ `frontend/src/components/ChatWindow.tsx` - Usa `backendUrl`
7. ✅ `frontend/.env.local` - Variables de desarrollo
8. ✅ `frontend/.env.example` - Documentación actualizada

### Patrón Usado:
```typescript
import { backendUrl } from "@/lib/api";

// Antes:
fetch("http://localhost:8001/api/programs")

// Después:
fetch(`${backendUrl}/api/programs`)
```

## 🐛 Error de Notificaciones

También se detectó un error en el endpoint de notificaciones:
```
GET /api/notifications/user/0db15e06-e52a-44af-aeb7-09826f4cbf6b 422
Error: "Input should be a valid integer, unable to parse string as an integer"
```

**Causa**: El endpoint espera un `user_id` tipo `int` pero recibe un UUID string.

**Solución**: Este es un bug en el backend que debe corregirse para aceptar UUIDs o cambiar el frontend para usar IDs numéricos.

## 🎯 Próximos Pasos

1. ✅ Commit y push de los cambios
2. ⏳ Configurar variables en Render Dashboard
3. ⏳ Esperar redeploy automático (~5-10 min)
4. ⏳ Verificar que el dashboard carga correctamente
5. ⏳ Corregir el bug de notificaciones si es crítico
