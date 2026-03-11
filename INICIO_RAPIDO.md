# 🚀 INICIO RÁPIDO - INSPIRATORIA

## Comando Único para Iniciar Todo

```bash
bash /Users/peterfulle/Desktop/Inspiratoria/start_all.sh
```

Este comando inicia:
- ✅ Backend en puerto **8001** 
- ✅ Frontend en puerto **3000**
- ✅ Limpieza automática de puertos
- ✅ Logs en tiempo real
- ✅ Detención con Ctrl+C

---

## URLs del Sistema

| Servicio | URL | Estado |
|----------|-----|--------|
| 🎨 **Frontend** | http://localhost:3000 | ✅ Activo |
| 📡 **Backend API** | http://localhost:8001 | ✅ Activo |
| 🏥 **Health Check** | http://localhost:8001/api/health | ✅ Disponible |

---

## Login Credentials

```
Email:    admin@test.com
Password: admin123
Role:     Super Admin (todos los permisos)
```

---

## Ver Logs en Tiempo Real

### Backend
```bash
tail -f /tmp/inspiratoria_backend.log
```

### Frontend
```bash
tail -f /tmp/inspiratoria_frontend.log
```

---

## Detener el Sistema

Desde la terminal donde está corriendo:
```
Ctrl + C
```

O manualmente:
```bash
pkill -f "uvicorn.*8001"
pkill -f "next dev"
```

---

## Comandos Separados (Opcional)

### Solo Backend
```bash
bash /Users/peterfulle/Desktop/Inspiratoria/start_backend.sh
```

### Solo Frontend
```bash
cd /Users/peterfulle/Desktop/Inspiratoria/frontend && npm run dev
```

---

## Verificar Estado

### Backend Health
```bash
curl http://localhost:8001/api/health
```

### Probar Endpoints
```bash
# Programas
curl http://localhost:8001/api/programs | jq

# Empresas
curl http://localhost:8001/api/companies/ | jq

# Actividades
curl http://localhost:8001/api/activities | jq

# Alertas
curl http://localhost:8001/api/alerts | jq
```

---

## Troubleshooting

### Puerto ocupado
```bash
# Liberar puerto 8001
kill -9 $(lsof -ti:8001)

# Liberar puerto 3000
kill -9 $(lsof -ti:3000)
```

### Reiniciar todo
```bash
pkill -f uvicorn
pkill -f "next dev"
bash /Users/peterfulle/Desktop/Inspiratoria/start_all.sh
```

---

## Estructura de Vistas

| Vista | URL | Descripción |
|-------|-----|-------------|
| 📊 Dashboard | `/dashboard` | Vista general |
| 🏢 Clientes | `/dashboard/clients` | Gestión de empresas |
| 📚 Programas | `/dashboard/programs` | Diseño de programas |
| 👥 Participantes | `/dashboard/participants` | Configuración usuarios |
| 📅 Actividades | `/dashboard/activities` | Entrenamientos/Eventos |
| 🔗 Matches | `/dashboard/matches` | Smart matching |
| 🗓️ Calendario | `/dashboard/calendar` | Vista temporal |
| ⚠️ Alertas | `/dashboard/alerts` | Monitoreo operativo |
| 📈 Analytics | `/dashboard/analytics` | Métricas |
| 📋 Reportes | `/dashboard/reports` | Informes |

---

## Próximos Pasos después de Iniciar

1. **Login** → http://localhost:3000/login
2. **Crear Cliente** → `/dashboard/clients`
3. **Diseñar Programa** → `/dashboard/programs`
4. **Agregar Participantes** → `/dashboard/participants`
5. **Crear Actividades** → `/dashboard/activities`
6. **Ejecutar Matches** → `/dashboard/matches`
7. **Monitorear Alertas** → `/dashboard/alerts`

---

**✨ ¡El sistema está listo para usar!**
