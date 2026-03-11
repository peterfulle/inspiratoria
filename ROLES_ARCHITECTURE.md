# 🎭 Arquitectura de Roles - Inspiratoria

## 📋 Roles del Sistema

### 1. **SuperAdmin** (`superadmin`)
**Acceso:** TODO el sistema + configuración de plataforma
- ✅ Gestión multi-empresa
- ✅ Configuración global
- ✅ Analytics de todas las empresas
- ✅ Administración de usuarios de todas las empresas

**Vista de Dashboard:**
- KPIs globales de todas las empresas
- Gestión de empresas (activar/desactivar)
- Logs de sistema
- Configuración de planes

---

### 2. **Cliente** (`client`)
**Acceso:** Vista ejecutiva de su empresa
- ✅ Dashboard ejecutivo (métricas generales)
- ✅ Reportes y analytics de su empresa
- ✅ Ver programas activos
- ✅ Ver estadísticas de participación
- ❌ NO puede crear/editar programas
- ❌ NO puede gestionar usuarios

**Vista de Dashboard:**
- Métricas de participación
- ROI y resultados de programas
- Gráficos de progreso
- Exportar reportes

---

### 3. **Administrador** (`admin`)
**Acceso:** Gestión completa de su empresa
- ✅ Crear/editar/eliminar programas
- ✅ Invitar y gestionar usuarios
- ✅ Matching manual y automático
- ✅ Ver todos los matches
- ✅ Analytics completos
- ✅ Configuración de empresa

**Vista de Dashboard:**
- Vista completa actual (la que tienes ahora)
- Gestión de programas
- Gestión de participantes
- Matching engine
- Analytics

---

### 4. **Facilitador Interno** (`facilitator_internal`)
**Acceso:** Gestión de sesiones y seguimiento de su empresa
- ✅ Ver programas de su empresa
- ✅ Registrar sesiones
- ✅ Ver matches asignados
- ✅ Seguimiento de participantes
- ✅ Registro de asistencia
- ❌ NO puede crear programas
- ❌ NO puede hacer matching

**Vista de Dashboard:**
- Calendario de sesiones
- Lista de participantes asignados
- Registro de asistencia
- Progreso de matches supervisados

---

### 5. **Facilitador Inspiratoria** (`facilitator_inspiratoria`)
**Acceso:** Gestión multi-empresa (empleado de Inspiratoria)
- ✅ Ver programas de múltiples clientes
- ✅ Registrar sesiones cross-empresa
- ✅ Ver matches de clientes asignados
- ✅ Generar reportes para clientes
- ❌ NO puede modificar estructura de empresas

**Vista de Dashboard:**
- Vista multi-empresa
- Calendario de sesiones (todas las empresas asignadas)
- Reportes por cliente
- Recursos y materiales

---

### 6. **Mentor** (`mentor`)
**Acceso:** Su perfil y su(s) mentee(s)
- ✅ Ver su perfil
- ✅ Ver sus matches (mentees asignados)
- ✅ Chat con mentees
- ✅ Goals y OKRs compartidos
- ✅ Calendario de sesiones
- ✅ Recursos del programa
- ❌ NO ve otros matches
- ❌ NO ve datos agregados

**Vista de Dashboard:**
- Mi perfil
- Mis mentees (cards)
- Chat por mentee
- Goals compartidos
- Próximas sesiones
- Recursos del programa

---

### 7. **Mentee** (`mentee`)
**Acceso:** Su perfil y su mentor
- ✅ Ver su perfil
- ✅ Ver su mentor asignado
- ✅ Chat con mentor
- ✅ Goals y OKRs personales
- ✅ Calendario de sesiones
- ✅ Recursos del programa
- ❌ NO ve otros matches
- ❌ NO ve datos agregados

**Vista de Dashboard:**
- Mi perfil
- Mi mentor (card)
- Chat con mentor
- Mis goals
- Próximas sesiones
- Recursos del programa

---

## 🗺️ Navegación por Rol

### SuperAdmin
```
Dashboard (global)
├── Empresas
├── Usuarios
├── Analytics
└── Configuración
```

### Cliente
```
Dashboard (su empresa)
├── Reportes
├── Programas (solo ver)
└── Analytics
```

### Administrador
```
Dashboard (su empresa)
├── Programas
├── Participantes
├── Matches
├── Analytics
├── Calendario
└── Usuarios
```

### Facilitador Interno
```
Dashboard
├── Sesiones
├── Mis Participantes
├── Calendario
└── Asistencia
```

### Facilitador Inspiratoria
```
Dashboard (multi-empresa)
├── Mis Clientes
├── Sesiones
├── Calendario
└── Reportes
```

### Mentor
```
Mi Dashboard
├── Mi Perfil
├── Mis Mentees
├── Chat
├── Goals
└── Calendario
```

### Mentee
```
Mi Dashboard
├── Mi Perfil
├── Mi Mentor
├── Chat
├── Mis Goals
└── Calendario
```

---

## 🛡️ Matriz de Permisos

| Funcionalidad | SuperAdmin | Cliente | Admin | Fac. Interno | Fac. Inspiratoria | Mentor | Mentee |
|--------------|:----------:|:-------:|:-----:|:------------:|:----------------:|:------:|:------:|
| Ver dashboard global | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver dashboard empresa | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ | ❌ |
| Crear programas | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar programas | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver programas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅** | ✅** |
| Crear participantes | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver participantes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Hacer matching | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver todos los matches | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver mis matches | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat (cualquiera) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Chat (mis matches) | - | - | - | - | - | ✅ | ✅ |
| Registrar sesiones | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exportar datos | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Invitar usuarios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

\* Multi-empresa asignadas
\** Solo su programa

---

## 🎨 Componentes a Crear

### 1. Layout por Rol
- `layouts/AdminLayout.tsx` - Para admin, superadmin, cliente
- `layouts/FacilitatorLayout.tsx` - Para facilitadores
- `layouts/ParticipantLayout.tsx` - Para mentor/mentee

### 2. Dashboards Específicos
- `dashboards/SuperAdminDashboard.tsx`
- `dashboards/ClientDashboard.tsx`
- `dashboards/AdminDashboard.tsx` (actual)
- `dashboards/FacilitatorDashboard.tsx`
- `dashboards/MentorDashboard.tsx`
- `dashboards/MenteeDashboard.tsx`

### 3. Componentes Compartidos
- `components/MatchCard.tsx` - Card de match (mentor+mentee)
- `components/SessionCalendar.tsx` - Calendario de sesiones
- `components/RoleGuard.tsx` - Protección por rol
- `components/CompanySelector.tsx` - Para facilitador Inspiratoria

---

## 🔧 Implementación

### Fase 1: Infraestructura (2-3 horas)
- ✅ Helper de permisos (`utils/permissions.ts`)
- ✅ RoleGuard component
- ✅ Actualizar Sidebar con navegación dinámica
- ✅ Crear layouts base

### Fase 2: Dashboards (8-12 horas)
- ✅ MenteeDashboard (más simple)
- ✅ MentorDashboard
- ✅ FacilitatorDashboard
- ✅ ClientDashboard
- ✅ AdminDashboard (refactor del actual)
- ✅ SuperAdminDashboard

### Fase 3: Funcionalidades Específicas (6-8 horas)
- ✅ Sesiones y asistencia (facilitadores)
- ✅ Vista de matches personales (mentor/mentee)
- ✅ Chat 1-1 entre match
- ✅ Goals por match

### Fase 4: Testing y Refinamiento (4-6 horas)
- ✅ Crear usuarios de prueba para cada rol
- ✅ Testing de permisos
- ✅ Ajustes UX
- ✅ Documentación

**Total estimado: 20-29 horas**

---

## 📝 Notas de Implementación

1. **Backward Compatibility**: Mantener rol "coordinator" funcionando como "admin"
2. **Data Scoping**: Cada query debe filtrar por company_id excepto superadmin
3. **API Updates**: Endpoints deben verificar permisos en backend
4. **Session Storage**: Guardar company_id en localStorage junto con user
5. **Multi-tenant**: Facilitador Inspiratoria puede tener multiple company_ids asignados
