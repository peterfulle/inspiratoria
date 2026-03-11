# Actualización de Usuario Admin Root - Inspiratoria

## Resumen de Cambios

Se h22a actualizado el sistema para soportar el flujo operativo completo del Admin Root según el SOP (Standard Operating Procedure) documentado.

## Cambios Implementados

### 1. Modelo de Usuario (companies.User)

Se agregaron los siguientes campos de permisos granulares:

- `can_manage_clients`: Permite crear y habilitar clientes (Etapa Setup)
- `can_manage_programs`: Permite crear y configurar programas (Etapa Diseño)
- `can_manage_users`: Permite cargar y asignar roles de usuarios (Etapa Usuarios)
- `can_manage_activities`: Permite gestionar actividades y eventos (Etapa Ejecución)
- `can_execute_matches`: Permite ejecutar y validar matches (Etapa Ejecución)
- `can_view_reports`: Permite ver dashboards y reportes (Etapa Cierre)
- `can_close_programs`: Permite cerrar programas (Etapa Cierre)
- `can_manage_alerts`: Permite gestionar alertas operativas (Etapa Seguimiento)

### 2. Roles Actualizados

Se agregó el rol `participant` para participantes generales de eventos.

**Roles disponibles:**
- `superadmin`: Super Admin (Admin Root) - Permisos totales
- `client`: Cliente/Contraparte en la empresa
- `admin`: Administrador interno de la empresa
- `facilitator_internal`: Facilitador Interno
- `facilitator_inspiratoria`: Facilitador Inspiratoria
- `mentor`: Mentor
- `mentee`: Mentee
- `participant`: Participante general

### 3. Modelo de Programa (programs.Program)

Se actualizaron los estados del programa según el SOP:

- `designed`: Diseñado - Estructura definida
- `ready_for_execution`: Listo para Ejecución - Usuarios cargados
- `in_execution`: En Ejecución - Programa activo
- `under_review`: Revisión - Datos incompletos
- `closed`: Cerrado - Programa finalizado

Se agregaron campos:
- `company`: Relación con la empresa cliente
- `requires_certification`: Indica si el programa otorga certificación
- `certification_rules`: Reglas de certificación (JSON)
- `last_follow_up`: Fecha del último seguimiento

### 4. Modelo de Participante (programs.Participant)

Se agregaron roles adicionales:
- `facilitator`: Facilitador
- `participant`: Participante
- `client`: Cliente

Se agregó campo:
- `requires_match`: Marca si el participante requiere matching

### 5. Nuevos Modelos para Actividades

#### Activity
Representa actividades del programa (Entrenamientos o Eventos):
- Tipos: `training` (Entrenamiento), `event` (Evento)
- Categorías para entrenamientos: mentores, mentees, facilitadores, otros
- Categorías para eventos: charla, workshop, encuentro, otros
- Estados: creada, programada, reprogramada, realizada, cerrada
- Modalidades: online, presencial, híbrido

#### Content
Módulos de contenido para entrenamientos:
- Orden de módulos
- Estado de publicación
- URLs de materiales
- Tracking de encuestas por módulo

#### Survey
Encuestas (por módulo o de satisfacción):
- Tipos: módulo, satisfacción
- Preguntas en formato JSON
- Tracking de envíos y respuestas
- Cálculo de tasa de respuesta

#### Alert
Alertas operativas para seguimiento:
- Tipos: actividad atrasada, baja confirmación, baja asistencia, encuestas pendientes, match pendiente
- Estados: activa, en proceso, resuelta, descartada
- Registro de acciones correctivas

## Usuario Admin Root Actualizado

El usuario `superadmin@inspiratoria.com` ha sido actualizado con todos los permisos:

✅ Permisos habilitados:
- ✓ Setup: Gestión de clientes
- ✓ Diseño: Gestión de programas
- ✓ Usuarios: Gestión de usuarios y roles
- ✓ Ejecución: Gestión de actividades y matches
- ✓ Seguimiento: Gestión de alertas
- ✓ Cierre: Reportes y cierre de programas

## Lógica Automática

El método `save()` del modelo User otorga automáticamente todos los permisos a:
- Usuarios con `role='superadmin'`
- Usuarios con `is_superuser=True`

Esto garantiza que el Admin Root siempre tenga acceso completo al sistema.

## Script de Actualización

Se creó el script `update_admin_root_permissions.py` que:
1. Busca todos los usuarios superadmin
2. Otorga todos los permisos del Admin Root
3. Crea un usuario Admin Root por defecto si no existe ninguno

### Uso:
```bash
cd backend
python update_admin_root_permissions.py
```

## Próximos Pasos

Para implementar completamente el SOP, se recomienda:

1. **Frontend**: Crear las vistas correspondientes para cada etapa del SOP
2. **Middleware de permisos**: Implementar decoradores/middleware para validar permisos
3. **API endpoints**: Crear endpoints específicos para cada operación del SOP
4. **Dashboard**: Implementar vistas de dashboard con KPIs por etapa
5. **Notificaciones**: Sistema de notificaciones para alertas operativas

## Migraciones Aplicadas

- `companies/migrations/0002_user_can_close_programs_user_can_execute_matches_and_more.py`
- `programs/migrations/0002_participant_requires_match_and_more.py`

## Compatibilidad

Los cambios mantienen compatibilidad con los estados y roles anteriores:
- Estados legacy del programa: draft, active, paused, completed
- Roles existentes: mentor, mentee

## Testing

Para verificar los permisos del Admin Root:

```python
from companies.models import User

admin = User.objects.get(email='superadmin@inspiratoria.com')

# Verificar que es Admin Root
print(admin.is_admin_root)  # True

# Verificar permisos individuales
print(admin.can_manage_clients)     # True
print(admin.can_manage_programs)    # True
print(admin.can_manage_users)       # True
print(admin.can_manage_activities)  # True
print(admin.can_execute_matches)    # True
print(admin.can_view_reports)       # True
print(admin.can_close_programs)     # True
print(admin.can_manage_alerts)      # True
```

---

**Fecha de actualización**: 18 de diciembre de 2025
**Versión**: 1.0
**Autor**: Sistema Inspiratoria
