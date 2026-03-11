# Sistema de Dashboards por Rol - Documentación Completa

## 📋 Resumen

Sistema completo de dashboards personalizados para 7 roles de usuario con navegación dinámica, permisos granulares y componentes especializados.

## 🎯 Roles Implementados

### 1. **Superadmin** 👑
- **Acceso:** Total control de la plataforma
- **Dashboard:** AdminDashboard con gestión completa
- **Menú visible:**
  - Dashboard
  - Programas
  - Participantes
  - Matches
  - Calendario
  - Analytics
  - Reportes

### 2. **Admin** 👑
- **Acceso:** Gestión de programas y participantes
- **Dashboard:** AdminDashboard
- **Menú visible:**
  - Dashboard
  - Programas
  - Participantes
  - Matches
  - Calendario
  - Analytics
  - Reportes

### 3. **Coordinator** 👑
- **Acceso:** Similar a admin, gestión operativa
- **Dashboard:** AdminDashboard
- **Menú visible:** (igual que admin)

### 4. **Client** 👑
- **Acceso:** Vista ejecutiva de alto nivel
- **Dashboard:** ClientDashboard (solo lectura)
- **Menú visible:**
  - Dashboard (KPIs y métricas)
  - Programas (vista general)
  - Calendario
  - Analytics
  - Reportes

### 5. **Facilitator Internal** 🎯
- **Acceso:** Gestión de sesiones y participantes internos
- **Dashboard:** FacilitatorDashboard
- **Menú visible:**
  - Dashboard
  - Participantes
  - Matches
  - Sesiones (gestión de asistencia)
  - Calendario

### 6. **Facilitator Inspiratoria** 🎯
- **Acceso:** Gestión de sesiones Inspiratoria
- **Dashboard:** FacilitatorDashboard
- **Menú visible:**
  - Dashboard
  - Participantes
  - Sesiones
  - Calendario

### 7. **Mentor** 👨‍🏫
- **Acceso:** Gestión de mentees asignados
- **Dashboard:** MentorDashboard
- **Menú visible:**
  - Dashboard
  - Chat (con mentees)
  - Objetivos (compartidos)
  - Calendario

### 8. **Mentee** 👨‍🎓
- **Acceso:** Vista de su mentor y objetivos
- **Dashboard:** MenteeDashboard
- **Menú visible:**
  - Dashboard
  - Chat (con mentor)
  - Objetivos
  - Calendario

## 🏗️ Arquitectura

### Estructura de Archivos

```
/frontend/src/
├── app/
│   └── dashboard/
│       └── page.tsx                    # Router principal (150 líneas)
├── components/
│   ├── Sidebar.tsx                     # Navegación dinámica (340 líneas)
│   └── dashboards/
│       ├── AdminDashboard.tsx          # Dashboard admin (754 líneas)
│       ├── MenteeDashboard.tsx         # Dashboard mentee (269 líneas)
│       ├── MentorDashboard.tsx         # Dashboard mentor (358 líneas)
│       ├── FacilitatorDashboard.tsx    # Dashboard facilitador (422 líneas)
│       └── ClientDashboard.tsx         # Dashboard cliente (603 líneas)
└── lib/
    └── permissions.ts                  # Sistema de permisos (63 líneas)
```

### Flujo de Datos

```
Login → localStorage.setItem("user", JSON.stringify(userData))
  ↓
Dashboard Router lee user.role
  ↓
Selecciona componente según rol:
  - mentee → MenteeDashboard
  - mentor → MentorDashboard
  - facilitator_* → FacilitatorDashboard
  - client → ClientDashboard
  - admin/superadmin/coordinator → AdminDashboard
  ↓
Sidebar filtra menú según rol
  ↓
Usuario ve solo elementos permitidos
```

## 🔐 Sistema de Permisos

### Archivo: `/lib/permissions.ts`

```typescript
export type UserRole = 
  | "superadmin"
  | "client"
  | "admin"
  | "coordinator"
  | "facilitator_internal"
  | "facilitator_inspiratoria"
  | "mentor"
  | "mentee";

export type Permission = 
  | "manage_users"
  | "manage_programs"
  | "manage_participants"
  | "create_matches"
  | "view_analytics"
  | "manage_sessions"
  | "access_reports"
  | "view_all_data";
```

### Matriz de Permisos

| Permission | Superadmin | Admin | Coordinator | Client | Facilitator Internal | Facilitator Inspiratoria | Mentor | Mentee |
|-----------|-----------|-------|------------|--------|---------------------|------------------------|--------|--------|
| manage_users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manage_programs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manage_participants | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| create_matches | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| view_analytics | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| manage_sessions | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| access_reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view_all_data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Funciones Helper

```typescript
// Verificar permiso específico
hasPermission(role: UserRole, permission: Permission): boolean

// Grupos de roles
isAdmin(role: UserRole): boolean          // superadmin, admin, coordinator, client
isFacilitator(role: UserRole): boolean    // facilitator_internal, facilitator_inspiratoria
isParticipant(role: UserRole): boolean    // mentor, mentee
```

## 📊 Características por Dashboard

### AdminDashboard
**Ubicación:** `/components/dashboards/AdminDashboard.tsx`

**Características:**
- ✅ 4 KPI cards: Programas, Matches, Participantes, Score Promedio
- ✅ Acciones rápidas: Crear programa, Agregar participante, Importar CSV, Ejecutar matching
- ✅ 4 gráficos Chart.js:
  - Distribución de participantes (Doughnut)
  - Estado de matches (Doughnut)
  - Matches por programa (Bar)
  - Distribución de scores (Bar)
- ✅ Modales integrados: ProgramModal, ParticipantModal, CSVUploadModal, MatchingEngine
- ✅ Estado completo de datos: programs, matches, participants

**Props:**
```typescript
{
  userId: number;
  username: string;
  role: string;
  darkMode: boolean;
  activeView: string;
  onViewChange: (view: string) => void;
}
```

### MenteeDashboard
**Ubicación:** `/components/dashboards/MenteeDashboard.tsx`

**Características:**
- ✅ Mentor card con avatar, score y objetivos
- ✅ 4 vistas: Overview, Chat, Objetivos, Calendario
- ✅ Vista overview muestra información del mentor
- ✅ Integración con ChatWindow, GoalsOKRs, CalendarView
- ✅ Carga automática de match asignado

**Props:**
```typescript
{
  userId: string;
  userName: string;
  darkMode: boolean;
}
```

### MentorDashboard
**Ubicación:** `/components/dashboards/MentorDashboard.tsx`

**Características:**
- ✅ Gestión de múltiples mentees
- ✅ 4 stats cards: Total mentees, Activos, Score promedio, Completados
- ✅ Grid de mentees con selección
- ✅ Tips para mentores
- ✅ Mismo sistema de 4 vistas que mentee
- ✅ Cambio de contexto entre mentees

**Props:**
```typescript
{
  userId: string;
  userName: string;
  darkMode: boolean;
}
```

### FacilitatorDashboard
**Ubicación:** `/components/dashboards/FacilitatorDashboard.tsx`

**Características:**
- ✅ 12 sesiones mock con datos realistas
- ✅ Modal de asistencia con toggles por participante
- ✅ 4 vistas: Overview, Sesiones, Participantes, Calendario
- ✅ Stats: Programadas, Completadas, Tasa de asistencia, Participantes activos
- ✅ Filtros por estado de sesión
- ✅ Gestión de asistencia por sesión

**Props:**
```typescript
{
  userId: string;
  userName: string;
  role: string;
  darkMode: boolean;
  companyId: string;
}
```

### ClientDashboard
**Ubicación:** `/components/dashboards/ClientDashboard.tsx`

**Características:**
- ✅ Vista ejecutiva de alto nivel (solo lectura)
- ✅ 4 KPI cards con trending indicators
- ✅ Panel de impacto: Tasa de participación, Tasa de compleción, Satisfacción
- ✅ 4 gráficos Chart.js:
  - Distribución de participantes (Doughnut)
  - Estado de matches (Doughnut)
  - Matches por programa (Bar)
  - Distribución de scores (Bar)
- ✅ Exportación de datos: Programas, Participantes, Matches
- ✅ Program cards en grid con estadísticas

**Props:**
```typescript
{
  companyName: string;
  darkMode: boolean;
}
```

## 🎨 Sidebar Dinámico

### Configuración de Menú por Rol

El Sidebar filtra automáticamente los elementos visibles según el rol del usuario:

```typescript
interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  roles: UserRole[]; // Roles que pueden ver este item
}
```

**Ejemplo de configuración:**

```typescript
{
  id: "programs",
  label: "Programas",
  icon: IconPrograms,
  roles: ["superadmin", "admin", "coordinator", "client"],
}
```

### Lógica de Filtrado

```typescript
const getMenuItemsForRole = (userRole: string): MenuItem[] => {
  const allItems = getAllMenuItems();
  return allItems.filter(item => 
    item.roles.includes(userRole as UserRole)
  );
};
```

## 🚀 Uso y Testing

### Probar como Admin
```javascript
// En login, guardar:
localStorage.setItem("user", JSON.stringify({
  id: 1,
  username: "admin",
  email: "admin@sqm.com",
  role: "admin"
}));
```

**Resultado:**
- Dashboard: AdminDashboard con gestión completa
- Menú: Dashboard, Programas, Participantes, Matches, Calendario, Analytics, Reportes

### Probar como Mentee
```javascript
localStorage.setItem("user", JSON.stringify({
  id: 2,
  username: "Juan Pérez",
  email: "juan@example.com",
  role: "mentee"
}));
```

**Resultado:**
- Dashboard: MenteeDashboard con mentor card
- Menú: Dashboard, Chat, Objetivos, Calendario

### Probar como Facilitador
```javascript
localStorage.setItem("user", JSON.stringify({
  id: 3,
  username: "María González",
  email: "maria@sqm.com",
  role: "facilitator_internal"
}));
```

**Resultado:**
- Dashboard: FacilitatorDashboard con sesiones
- Menú: Dashboard, Participantes, Matches, Sesiones, Calendario

### Probar como Cliente
```javascript
localStorage.setItem("user", JSON.stringify({
  id: 4,
  username: "CEO SQM",
  email: "ceo@sqm.com",
  role: "client"
}));
```

**Resultado:**
- Dashboard: ClientDashboard con KPIs ejecutivos
- Menú: Dashboard, Programas, Calendario, Analytics, Reportes

## 🔧 Configuración Backend

### Modelos Django

Asegúrate de que el modelo User tenga los roles correctos:

```python
# backend/companies/models.py
class User(AbstractUser):
    ROLE_CHOICES = [
        ('superadmin', 'Superadmin'),
        ('client', 'Cliente'),
        ('admin', 'Administrador'),
        ('coordinator', 'Coordinador'),
        ('facilitator_internal', 'Facilitador Interno'),
        ('facilitator_inspiratoria', 'Facilitador Inspiratoria'),
        ('mentor', 'Mentor'),
        ('mentee', 'Mentee'),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='mentee')
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
```

### API Response

El endpoint de login debe devolver:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@sqm.com",
  "role": "admin",
  "full_name": "Admin Usuario",
  "company_id": 1
}
```

## 📝 Próximos Pasos

### 1. Guards de Autorización
- [ ] Crear `RoleGuard` component
- [ ] Proteger rutas en Next.js
- [ ] Middleware de verificación de permisos
- [ ] Validación en cada acción (crear, editar, eliminar)

### 2. Testing
- [ ] Crear usuarios demo para cada rol
- [ ] Casos de prueba por rol
- [ ] Testing de navegación
- [ ] Testing de permisos

### 3. Mejoras
- [ ] Animaciones de transición entre dashboards
- [ ] Breadcrumbs dinámicos
- [ ] Notificaciones contextuales por rol
- [ ] Onboarding personalizado por rol

## 🐛 Troubleshooting

### Problema: Usuario ve menú incorrecto
**Solución:** Verificar que `localStorage.getItem("user")` tenga el rol correcto

### Problema: Dashboard no carga
**Solución:** Verificar que el componente del dashboard esté importado en `/app/dashboard/page.tsx`

### Problema: Permisos no funcionan
**Solución:** Verificar que el tipo `UserRole` en `permissions.ts` incluya el rol del usuario

### Problema: Sidebar vacío
**Solución:** Verificar que `getAllMenuItems()` retorne items con el rol del usuario en el array `roles`

## 📚 Referencias

- **Documentación de roles:** `/ROLES_ARCHITECTURE.md`
- **Sistema de permisos:** `/frontend/src/lib/permissions.ts`
- **Router principal:** `/frontend/src/app/dashboard/page.tsx`
- **Sidebar dinámico:** `/frontend/src/components/Sidebar.tsx`

---

**Versión:** 1.0.0  
**Fecha:** Diciembre 2024  
**Autor:** Equipo Inspiratoria
