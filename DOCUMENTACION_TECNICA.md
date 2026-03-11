# 📚 DOCUMENTACIÓN TÉCNICA COMPLETA - INSPIRATORIA

**Sistema de Mentoring y Gestión de Programas de Desarrollo**  
**Última actualización:** 7 de Enero, 2026

---

## 🏗️ ARQUITECTURA GENERAL

### Stack Tecnológico

#### **Backend**
- **Framework Principal:** Django 5.2.8 + FastAPI (Híbrido)
- **Lenguaje:** Python 3.10.16
- **Servidor ASGI:** Uvicorn
- **Base de Datos:** 
  - Desarrollo: SQLite 3
  - Producción: PostgreSQL 16.x (Render.com)
- **Comunicación en Tiempo Real:** Socket.IO (WebSockets)
- **IA/ML:** Google Gemini AI (gemini-1.5-flash)

#### **Frontend**
- **Framework:** Next.js 14.1.0 (App Router)
- **Lenguaje:** TypeScript 5.2.2
- **UI:** React 18.2.0 + Tailwind CSS 3.4.0
- **Estado:** React Hooks (useState, useEffect, useContext)
- **Comunicación:** Fetch API con safeFetch wrapper

#### **Deployment**
- **Plataforma:** Render.com
- **Backend URL:** https://inspiratoria-backend.onrender.com
- **Frontend URL:** https://inspiratoria.aplifly.com
- **Dominio Custom:** inspiratoria.aplifly.com

---

## 🗄️ BASE DE DATOS

### Modelo de Datos

#### **1. COMPANIES (Empresas Clientes)**
```python
# Tabla: companies_company
```

**Campos Principales:**
- `id` (UUID) - Identificador único
- `name` (varchar) - Nombre de la empresa
- `slug` (varchar) - URL-friendly identifier
- `corp_id` (varchar) - ID corporativo único (YYYYMMDD-HHMM)
- `rut` (varchar) - RUT chileno (12.345.678-9)
- `status` - trial | active | suspended | cancelled
- `plan` - startup | growth | enterprise
- `is_data_complete` (bool) - Validación de información completa
- `is_enabled` (bool) - Habilitado para crear programas
- `max_users`, `max_programs`, `max_participants` - Límites según plan
- `logo_url`, `primary_color`, `secondary_color` - Branding
- `onboarding_completed` (bool) - Estado del onboarding

**Relaciones:**
- `1:N` con `User` (usuarios de la empresa)
- `1:N` con `Program` (programas de la empresa)
- `1:N` con `PendingInvitation` (invitaciones pendientes)

**Reglas de Negocio:**
- Al crear una empresa, se genera automáticamente `slug` y `corp_id`
- Solo se habilita para crear programas si `is_data_complete = True`
- Validación automática de completitud en cada guardado

---

#### **2. USERS (Usuarios del Sistema)**
```python
# Tabla: companies_user (AUTH_USER_MODEL custom)
# Extiende AbstractUser de Django
```

**Campos Principales:**
- `id` (int) - ID único
- `username` (varchar) - Nombre de usuario único
- `email` (varchar) - Email único
- `first_name`, `last_name` (varchar)
- `password` (hash) - Contraseña hasheada (PBKDF2)
- `role` (varchar) - Rol principal del usuario
- `is_active` (bool) - Usuario activo
- `is_staff` (bool) - Acceso al admin de Django
- `is_superuser` (bool) - Permisos de superusuario
- `date_joined` (datetime)
- `last_login` (datetime)

**Permisos Granulares:**
- `can_manage_clients` (bool)
- `can_manage_programs` (bool)
- `can_manage_users` (bool)
- `can_manage_activities` (bool)
- `can_execute_matches` (bool)
- `can_view_reports` (bool)
- `can_close_programs` (bool)

**Roles Disponibles:**
```python
ROLE_CHOICES = [
    ("admin_root", "Admin Root"),        # ⚡ Permisos totales
    ("superadmin", "Super Admin"),       # 👑 Admin de Inspiratoria
    ("inspiratoria_admin", "Admin Inspiratoria"), # ⭐ Admin operativo
    ("coordinator", "Coordinador"),      # 👑 Coordinador de programas
    ("client", "Cliente"),               # 💼 Stakeholder cliente
    ("admin", "Administrador"),          # 👑 Admin de empresa
    ("facilitator_internal", "Facilitador Interno"),
    ("facilitator_inspiratoria", "Facilitador Inspiratoria"),
    ("mentor", "Mentor"),                # 👨‍🏫 Mentor
    ("mentee", "Mentee"),                # 👨‍🎓 Aprendiz
]
```

**Relaciones:**
- `N:1` con `Company` (empresa a la que pertenece)
- `1:1` con `Participant` (opcional, si es mentor/mentee)
- `1:N` con `Notification` (notificaciones recibidas)
- `1:N` con `ChatMessage` (mensajes enviados)

**Lógica de Permisos:**
- `admin_root` → Todos los permisos automáticamente
- `superadmin` → Gestión completa de la plataforma
- `inspiratoria_admin` → Gestión de clientes y programas
- Otros roles → Permisos específicos según configuración

---

#### **3. PROGRAMS (Programas de Mentoring)**
```python
# Tabla: programs_program
```

**Campos Principales:**
- `id` (UUID) - Identificador único
- `name` (varchar) - Nombre del programa
- `description` (text) - Descripción completa
- `theme` (varchar) - Tema principal
- `status` (varchar) - Estado del programa
- `company_id` (UUID FK) - Empresa propietaria
- `requires_certification` (bool)
- `certification_rules` (JSON) - Reglas de certificación
- `created_at`, `updated_at` (datetime)
- `last_follow_up` (datetime) - Último seguimiento

**Estados del Programa:**
```python
STATUS_CHOICES = [
    ("designed", "Diseñado"),              # Estructura definida
    ("ready_for_execution", "Listo"),      # Usuarios cargados
    ("in_execution", "En Ejecución"),      # Activo
    ("under_review", "Revisión"),          # Datos incompletos
    ("closed", "Cerrado"),                 # Finalizado
    # Legacy (compatibilidad)
    ("draft", "Borrador"),
    ("active", "Activo"),
    ("paused", "Pausado"),
    ("completed", "Completado"),
]
```

**Relaciones:**
- `N:1` con `Company`
- `1:N` con `Participant` (participantes del programa)
- `1:N` con `Match` (matches mentor-mentee)
- `1:N` con `Activity` (actividades del programa)
- `1:N` con `PendingInvitation`

---

#### **4. PARTICIPANTS (Participantes)**
```python
# Tabla: programs_participant
```

**Campos Principales:**
- `id` (int) - ID único
- `program_id` (UUID FK) - Programa al que pertenece
- `full_name` (varchar)
- `role` (varchar) - mentor | mentee | facilitator | participant | client
- `headline` (varchar) - Título profesional
- `goals` (JSON) - Lista de objetivos
- `skills` (JSON) - Lista de habilidades
- `availability_hours` (int) - Horas disponibles por semana
- `timezone` (varchar) - Zona horaria
- `requires_match` (bool) - Requiere ser emparejado

**Relaciones:**
- `N:1` con `Program`
- `1:1` con `User` (opcional)
- `1:N` con `Match` (como mentor o mentee)

---

#### **5. MATCHES (Emparejamientos Mentor-Mentee)**
```python
# Tabla: programs_match
```

**Campos Principales:**
- `id` (int) - ID único
- `program_id` (UUID FK)
- `mentor_id` (int FK) - Participante mentor
- `mentee_id` (int FK) - Participante mentee
- `score` (decimal) - Score de compatibilidad (0.00-100.00)
- `status` (varchar) - pending | active | completed
- `created_at` (datetime)

**Constraint Único:**
```sql
UNIQUE(mentor, mentee, program)
```

**Relaciones:**
- `N:1` con `Program`
- `N:1` con `Participant` (mentor)
- `N:1` con `Participant` (mentee)
- `1:N` con `Milestone` (hitos del match)
- `1:N` con `Sentiment` (ratings/feedback)
- `1:N` con `Goal` (objetivos del match)
- `1:N` con `ChatMessage` (mensajes del chat)

---

#### **6. ACTIVITIES (Actividades del Programa)**
```python
# Tabla: programs_activity
```

**Campos Principales:**
- `id` (UUID)
- `program_id` (UUID FK)
- `activity_type` - training | workshop | assessment | other
- `name` (varchar)
- `description` (text)
- `status` - scheduled | in_progress | completed | cancelled
- `start_date` (date)
- `modality` - remote | in_person | hybrid
- `meeting_url` (varchar) - URL para reuniones virtuales
- `location_address` (text) - Dirección física
- `duration_minutes` (int)

**Tipos de Actividad:**
- `training` - Entrenamiento/capacitación
- `workshop` - Taller interactivo
- `assessment` - Evaluación/assessment
- `other` - Otros tipos

---

#### **7. GOALS & OKRs (Objetivos y Resultados Clave)**
```python
# Tabla: programs_goal
# Tabla: programs_keyresult
# Tabla: programs_goalupdate
```

**Goal (Objetivo):**
- `id` (int)
- `match_id` (int FK)
- `title` (varchar)
- `description` (text)
- `goal_type` - skill | career | project | leadership | technical | soft_skill | other
- `priority` - high | medium | low
- `status` - not_started | in_progress | completed | blocked
- `progress_percentage` (int 0-100)
- `start_date`, `target_date`, `completed_date`

**KeyResult (Resultado Clave):**
- `id` (int)
- `goal_id` (int FK)
- `description` (text)
- `target_value` (decimal)
- `current_value` (decimal)
- `unit` (varchar) - %, units, completions, etc.
- `is_completed` (bool)

**GoalUpdate (Actualización de Progreso):**
- `id` (int)
- `goal_id` (int FK)
- `update_text` (text)
- `progress_delta` (int) - Cambio en porcentaje
- `created_by_id` (int FK)
- `created_at` (datetime)

---

#### **8. INVITATIONS (Sistema de Invitaciones)**
```python
# Tabla: pending_invitations
```

**Campos Principales:**
- `id` (int)
- `email` (varchar)
- `role` (varchar) - mentor | mentee
- `token` (varchar) - Token único de 64 caracteres
- `company_id` (UUID FK)
- `program_id` (UUID FK)
- `invited_by_id` (int FK)
- `status` - pending | accepted | expired | cancelled
- `created_at`, `expires_at`, `accepted_at` (datetime)
- `personal_message` (text) - Mensaje personalizado
- `linkedin_profile_data` (JSON) - Datos del perfil de LinkedIn

**Flujo de Invitación:**
1. Admin crea invitación → Estado: `pending`
2. Se envía email con token único
3. Usuario acepta → Estado: `accepted`, se crea `User` y `Participant`
4. Después de X días → Estado: `expired` (si no acepta)

---

#### **9. NOTIFICATIONS (Sistema de Notificaciones)**
```python
# Tabla: programs_notification
```

**Campos:**
- `id` (int)
- `recipient_id` (int FK) - Usuario destinatario
- `notification_type` (varchar)
- `title`, `message` (varchar/text)
- `link` (varchar) - URL para navegación
- `is_read` (bool)
- `match_id`, `milestone_id` (int FK, opcional)
- `created_at` (datetime)

**Tipos de Notificación:**
- `milestone_due` - Hito vencido
- `milestone_upcoming` - Hito próximo
- `new_match` - Nuevo emparejamiento
- `rating_received` - Rating recibido
- `message` - Nuevo mensaje
- `system` - Notificación del sistema

---

#### **10. CHAT MESSAGES (Mensajes en Tiempo Real)**
```python
# Tabla: programs_chatmessage
```

**Campos:**
- `id` (int)
- `match_id` (int FK)
- `sender_id` (int FK)
- `content` (text)
- `created_at` (datetime)
- `is_read` (bool)

**Índices:**
```sql
INDEX (match_id, created_at DESC)
```

---

## 🔌 API ENDPOINTS

### Base URL
- **Desarrollo:** `http://localhost:8001/api`
- **Producción:** `https://inspiratoria-backend.onrender.com/api`

### Autenticación
```http
POST /api/companies/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}

Response:
{
  "access_token": "...",
  "user": {
    "id": 1,
    "email": "admin@test.com",
    "role": "admin_root",
    "company_id": "uuid-here"
  }
}
```

---

### 📋 COMPANIES (Empresas)

#### Listar Empresas
```http
GET /api/companies/
```

#### Crear Empresa
```http
POST /api/companies/
{
  "name": "Empresa Demo",
  "industry": "Tecnología",
  "company_size": "50-200",
  "website": "https://demo.com"
}
```

#### Obtener Empresa
```http
GET /api/companies/{company_id}
```

#### Actualizar Empresa
```http
PUT /api/companies/{company_id}
PATCH /api/companies/{company_id}  # Actualización parcial
```

#### Completar Onboarding
```http
POST /api/companies/{company_id}/complete-onboarding
{
  "name": "...",
  "industry": "...",
  "company_size": "...",
  "website": "..."
}
```

#### Validar Datos Completos
```http
POST /api/companies/{company_id}/validate
```

---

### 👥 USERS (Usuarios)

#### Listar Usuarios
```http
GET /api/users
Response: [
  {
    "id": 1,
    "username": "admin",
    "email": "admin@test.com",
    "role": "admin_root",
    "is_active": true,
    "can_manage_clients": true,
    ...
  }
]
```

#### Crear Usuario
```http
POST /api/users
{
  "username": "nuevo_usuario",
  "email": "usuario@empresa.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "admin",
  "password": "password123"
}
```

#### Actualizar Usuario
```http
PATCH /api/users/{user_id}
{
  "first_name": "Juan Carlos",
  "role": "coordinator",
  "is_active": true
}
```

#### Eliminar Usuario
```http
DELETE /api/users/{user_id}
```

---

### 📚 PROGRAMS (Programas)

#### Listar Programas
```http
GET /api/programs
GET /api/programs?company_id={uuid}  # Filtrar por empresa
```

#### Crear Programa
```http
POST /api/programs
{
  "name": "Programa de Liderazgo 2026",
  "description": "Desarrollo de habilidades...",
  "theme": "Liderazgo",
  "company_id": "uuid-here",
  "status": "designed",
  "activities": [
    {
      "type": "training",
      "name": "Kickoff Session",
      "description": "Sesión inicial",
      "modality": "remote"
    }
  ]
}
```

#### Obtener Programa
```http
GET /api/programs/{program_id}
```

#### Actualizar Programa
```http
PUT /api/programs/{program_id}
```

#### Cambiar Estado
```http
PATCH /api/programs/{program_id}/status
{
  "status": "in_execution"
}
```

#### Lanzar Programa
```http
POST /api/programs/{program_id}/launch
```

#### Eliminar Programa
```http
DELETE /api/programs/{program_id}
```

---

### 👤 PARTICIPANTS (Participantes)

#### Listar Participantes
```http
GET /api/participants?program_id={program_id}
```

#### Crear Participante
```http
POST /api/participants
{
  "program_id": "uuid",
  "full_name": "María González",
  "role": "mentor",
  "headline": "Senior Developer",
  "goals": ["Mejorar liderazgo", "Compartir conocimiento"],
  "skills": ["Python", "Leadership"],
  "availability_hours": 4
}
```

#### Importación Masiva
```http
POST /api/participants/bulk-import
{
  "program_id": "uuid",
  "participants": [...]
}
```

---

### 🤝 MATCHES (Emparejamientos)

#### Listar Matches
```http
GET /api/matches?program_id={uuid}
```

#### Crear Match Inteligente (AI)
```http
POST /api/matches/smart
{
  "program_id": "uuid",
  "mentor_id": 123,
  "mentee_id": 456
}
```

#### Aprobar Match
```http
POST /api/matches/{match_id}/approve
```

#### Sugerencias de Match (AI)
```http
POST /api/ai/match-suggestions
{
  "program_id": "uuid",
  "max_suggestions": 10
}
```

---

### 🎯 GOALS & OKRs (Objetivos)

#### Listar Objetivos de un Match
```http
GET /api/goals/match/{match_id}
```

#### Crear Objetivo
```http
POST /api/goals
{
  "match_id": 1,
  "title": "Dominar React",
  "description": "...",
  "goal_type": "technical",
  "priority": "high",
  "target_date": "2026-06-30",
  "key_results": [
    {
      "description": "Completar 5 proyectos",
      "target_value": 5,
      "unit": "projects"
    }
  ]
}
```

#### Actualizar Progreso
```http
PUT /api/goals/{goal_id}/progress
{
  "progress_percentage": 60,
  "update_text": "Completados 3 proyectos"
}
```

#### Actualizar Key Result
```http
PUT /api/key-results/{kr_id}
{
  "current_value": 3,
  "is_completed": false
}
```

---

### 🤖 AI ENDPOINTS (Inteligencia Artificial)

#### Recomendaciones de Objetivos
```http
POST /api/ai/recommendations
{
  "participant_id": 123,
  "match_id": 456  # Opcional
}

Response: {
  "recommendations": [
    {
      "title": "Desarrollar Liderazgo Técnico",
      "description": "...",
      "goal_type": "leadership",
      "priority": "high",
      "key_results": [...],
      "estimated_duration_weeks": 12
    }
  ]
}
```

#### Analizar Objetivo
```http
POST /api/ai/analyze-goal
{
  "goal_id": 789
}

Response: {
  "sentiment": "positive",
  "engagement_level": "high",
  "confidence_score": 0.85,
  "risk_signals": [],
  "positive_signals": ["Regular updates", "High completion rate"],
  "recommendations": ["Continue current approach"],
  "summary": "El objetivo muestra progreso constante..."
}
```

#### Salud del Match
```http
POST /api/ai/match-health
{
  "match_id": 123
}

Response: {
  "health_score": 85,
  "health_status": "excellent",
  "engagement_metrics": {...},
  "risk_factors": [],
  "strengths": ["Regular communication", "Goal alignment"],
  "recommendations": ["Schedule review session"],
  "next_steps": [...]
}
```

#### Generar Programa con IA
```http
POST /api/ai/generate-program
{
  "company_name": "TechCorp",
  "program_theme": "Liderazgo Digital",
  "duration_weeks": 12
}
```

---

### 📊 ACTIVITIES (Actividades)

#### Listar Actividades
```http
GET /api/activities?program_id={uuid}
```

#### Crear Actividad
```http
POST /api/activities
{
  "program_id": "uuid",
  "activity_type": "training",
  "name": "Workshop de Comunicación",
  "description": "...",
  "start_date": "2026-02-15",
  "modality": "hybrid",
  "meeting_url": "https://zoom.us/...",
  "location_address": "Av. Principal 123",
  "duration_minutes": 120
}
```

#### Actualizar Actividad
```http
PUT /api/activities/{activity_id}
```

#### Eliminar Actividad
```http
DELETE /api/activities/{activity_id}
```

---

### 🔔 NOTIFICATIONS (Notificaciones)

#### Obtener Notificaciones del Usuario
```http
GET /api/notifications/user/{user_id}
```

#### Crear Notificación
```http
POST /api/notifications
{
  "recipient_id": 123,
  "notification_type": "system",
  "title": "Bienvenido",
  "message": "...",
  "link": "/dashboard"
}
```

#### Marcar como Leída
```http
POST /api/notifications/mark-read
{
  "notification_ids": [1, 2, 3]
}
```

#### Contador de No Leídas
```http
GET /api/notifications/unread-count/{user_id}
```

---

### 📈 STATISTICS (Estadísticas)

#### Dashboard General
```http
GET /api/stats/dashboard
Response: {
  "total_programs": 15,
  "active_programs": 8,
  "total_participants": 250,
  "total_matches": 120,
  "average_match_score": 85.5,
  "engagement_rate": 0.92
}
```

#### Estadísticas de Programa
```http
GET /api/stats/programs/{program_id}
```

#### Timeline de Eventos
```http
GET /api/stats/timeline
```

---

### 🧹 UTILITIES (Utilidades)

#### Health Check
```http
GET /api/health
Response: {"status": "ok"}
```

#### Limpiar Datos (Solo dev)
```http
DELETE /api/clear-all-data
```

---

## 🎨 FRONTEND

### Estructura de Carpetas
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página home
│   │   ├── login/             # Autenticación
│   │   └── dashboard/         # Dashboard principal
│   │       ├── page.tsx       # Vista de empresas
│   │       ├── users/         # Gestión de usuarios
│   │       ├── programs/      # Gestión de programas
│   │       ├── setup/         # Setup inicial
│   │       └── billing/       # Facturación
│   ├── components/            # Componentes reutilizables
│   │   ├── Sidebar.tsx        # Navegación lateral
│   │   ├── CompanyCard.tsx    # Card de empresa
│   │   └── ...
│   ├── lib/                   # Utilidades
│   │   ├── permissions.ts     # Sistema de permisos
│   │   └── safeFetch.ts       # Wrapper de fetch
│   └── types/                 # Tipos TypeScript
│       └── company.ts
├── public/                    # Archivos estáticos
└── package.json
```

---

### Sistema de Permisos Frontend

```typescript
// lib/permissions.ts

export type UserRole = 
  | 'admin_root'              // 🔐 Permisos totales
  | 'superadmin'              // 👑 Admin Inspiratoria
  | 'inspiratoria_admin'      // ⭐ Admin operativo
  | 'coordinator'             // 👑 Coordinador
  | 'client'                  // 💼 Cliente
  | 'admin'                   // 👑 Admin empresa
  | 'facilitator_internal'    // 🎯 Facilitador interno
  | 'facilitator_inspiratoria'// 🎯 Facilitador Inspiratoria
  | 'mentor'                  // 👨‍🏫 Mentor
  | 'mentee';                 // 👨‍🎓 Aprendiz

export interface Permission {
  canViewGlobalDashboard: boolean;
  canViewCompanyDashboard: boolean;
  canCreatePrograms: boolean;
  canEditPrograms: boolean;
  canViewPrograms: boolean;
  canDeletePrograms: boolean;
  canCreateParticipants: boolean;
  canEditParticipants: boolean;
  canViewAllParticipants: boolean;
  canCreateMatches: boolean;
  canViewAllMatches: boolean;
  canRegisterSessions: boolean;
  canViewSessions: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canInviteUsers: boolean;
  canManageUsers: boolean;
  canChatWithAnyone: boolean;
  canManageCompany: boolean;
  canViewMultipleCompanies: boolean;
}

// Matriz de permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin_root: {
    // Todos los permisos en true
  },
  superadmin: {
    // Casi todos los permisos
  },
  // ... otros roles
};
```

---

### Componentes Principales

#### Sidebar.tsx
```tsx
// Navegación lateral moderna con:
- Gradientes de color por sección
- Iconos dinámicos (Lucide React)
- Indicador de ruta activa
- Filtrado por rol de usuario
- Profile card con avatar
- Efectos hover y transiciones
```

#### safeFetch.ts
```typescript
// Wrapper de fetch con:
- Manejo de errores centralizado
- Logging de requests/responses
- Headers automáticos (Content-Type, Accept)
- Timeout configurable
- Retry automático
```

---

### Páginas Principales

#### `/dashboard` - Vista General
- Lista de empresas cliente
- Filtros por estado y búsqueda
- Cards con información resumida
- Acceso rápido a acciones

#### `/dashboard/users` - Gestión de Usuarios
- Lista de usuarios del sistema
- Filtros por rol y estado
- Creación/edición de usuarios
- Asignación de permisos granulares

#### `/dashboard/programs` - Gestión de Programas
- Lista de programas
- Wizard de creación de programas
- Gestión de actividades
- Participantes y matches

#### `/dashboard/setup` - Configuración Inicial
- Wizard de onboarding de empresa
- Validación de datos requeridos
- Preview de información

#### `/dashboard/billing` - Facturación
- Información de plan actual
- Límites y uso
- Historial de facturación

---

## 🔐 SEGURIDAD

### Autenticación
- **Sistema:** Django Authentication
- **Hash de Contraseñas:** PBKDF2 (Django default)
- **Tokens:** JWT (en implementación)
- **Sesiones:** Django Sessions con cookies seguras

### Seguridad de Producción
```python
# settings.py (Producción)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### CORS
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://inspiratoria-frontend.onrender.com",
]
CORS_ALLOW_CREDENTIALS = True
```

---

## 🚀 DEPLOYMENT

### Render.com Configuration

#### Backend Service
```yaml
- type: web
  name: inspiratoria-backend
  env: python
  plan: starter
  buildCommand: |
    pip install -r backend/requirements.txt
    python backend/manage.py migrate
    python backend/manage.py collectstatic --noinput
  startCommand: |
    cd backend && uvicorn mentorloop_clone.asgi:application \
      --host 0.0.0.0 --port $PORT
  envVars:
    - PYTHON_VERSION: 3.10.16
    - DATABASE_URL: (from PostgreSQL)
    - DJANGO_SECRET_KEY: (auto-generated)
    - GEMINI_API_KEY: (manual)
```

#### Frontend Service
```yaml
- type: web
  name: inspiratoria-frontend
  env: node
  plan: starter
  buildCommand: |
    cd frontend
    npm install
    npm run build
  startCommand: cd frontend && npm start
  envVars:
    - NODE_VERSION: 18.17.0
    - NEXT_PUBLIC_API_BASE_URL: https://backend.url/api
```

#### Database
```yaml
databases:
  - name: inspiratoria-db
    databaseName: inspiratoria
    user: inspiratoria_user
    plan: starter
```

---

## 🔄 FLUJOS DE NEGOCIO

### 1. Onboarding de Cliente (Empresa)

```
1. Admin Root crea Company
   └─> Status: trial, is_enabled: false

2. Se completa información (setup wizard)
   ├─> name, industry, company_size, website
   └─> Validación automática

3. Sistema valida datos completos
   └─> is_data_complete = true
   └─> is_enabled = true (automático)

4. Cliente habilitado para crear programas
```

### 2. Creación de Programa

```
1. Admin/Cliente crea Program
   ├─> Status: designed
   └─> Vinculado a Company

2. Define actividades
   ├─> Trainings, workshops, assessments
   └─> Fechas, modalidad, ubicación

3. Invita participantes
   ├─> Mentores y mentees
   └─> Vía PendingInvitation

4. Participantes aceptan invitación
   ├─> Se crea User
   ├─> Se crea Participant
   └─> Se vincula al Program

5. Lanzamiento del programa
   ├─> Status: ready_for_execution
   └─> Habilita matching
```

### 3. Matching Inteligente (AI)

```
1. Sistema recopila datos
   ├─> Goals de mentees
   ├─> Skills de mentores
   ├─> Availability
   └─> Timezone compatibility

2. Gemini AI procesa
   ├─> Analiza compatibilidad
   ├─> Genera score (0-100)
   └─> Sugiere matches

3. Admin aprueba matches
   └─> Match Status: active

4. Sistema notifica participantes
   └─> Notification: new_match
```

### 4. Seguimiento y OKRs

```
1. Match define Goals
   ├─> Objetivo principal
   ├─> Key Results medibles
   └─> Fechas objetivo

2. Seguimiento periódico
   ├─> GoalUpdates regulares
   ├─> Actualización de progress_percentage
   └─> Actualización de current_value en KRs

3. AI analiza progreso
   ├─> Sentiment analysis
   ├─> Engagement metrics
   ├─> Risk detection
   └─> Recommendations

4. Cierre de objetivo
   ├─> Status: completed
   └─> Métricas finales registradas
```

---

## 📊 MÉTRICAS Y ANALYTICS

### Métricas Clave

1. **Engagement Rate**
   ```
   (Matches activos / Total matches) × 100
   ```

2. **Match Success Score**
   ```
   Promedio de scores de matches activos
   ```

3. **Goal Completion Rate**
   ```
   (Goals completados / Total goals) × 100
   ```

4. **Program Health**
   ```
   Combinación de:
   - Engagement rate
   - Activity completion
   - Participant satisfaction
   ```

---

## 🧪 TESTING

### Usuarios de Prueba

```
Admin Root:
  email: admin@test.com
  password: admin123
  role: admin_root

Coordinador:
  email: coordinator@test.com
  password: test123
  role: coordinator

Mentor:
  email: mentor@test.com
  password: test123
  role: mentor

Mentee:
  email: mentee@test.com
  password: test123
  role: mentee
```

### Scripts de Testing

```bash
# Crear usuarios de prueba
python backend/create_test_admin.py

# Crear empresas demo
python backend/create_real_companies.py

# Crear programa completo
python backend/create_program.py

# Probar flujo completo
python backend/test_full_flow.py

# Limpiar datos (mantener admin)
python backend/clear_all_keep_admin.py
```

---

## 🛠️ DESARROLLO LOCAL

### Iniciar Sistema Completo

```bash
# Método 1: Script unificado
./start_all.sh

# Método 2: Manual
# Terminal 1 - Backend
cd backend
source ../venv/bin/activate
python -m uvicorn mentorloop_clone.asgi:application \
  --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### URLs Locales
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- Django Admin: http://localhost:8001/admin

---

## 📦 DEPENDENCIAS

### Backend (requirements.txt)
```txt
Django==5.2.8
fastapi==0.115.12
uvicorn[standard]==0.34.0
python-socketio==5.16.0
google-generativeai==0.8.5
pydantic==2.10.6
python-dotenv==1.0.0
dj-database-url==2.3.0
psycopg2-binary==2.9.10  # PostgreSQL
django-cors-headers==4.6.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.2.2",
    "tailwindcss": "3.4.0",
    "lucide-react": "^0.263.1"
  }
}
```

---

## 🐛 TROUBLESHOOTING

### Problemas Comunes

#### 1. Puerto 8001 en uso
```bash
lsof -ti:8001 | xargs kill -9
```

#### 2. Migraciones pendientes
```bash
python manage.py migrate
```

#### 3. Frontend no compila
```bash
cd frontend
rm -rf .next
npm install
npm run build
```

#### 4. CORS errors
Verificar `CORS_ALLOWED_ORIGINS` en settings.py

#### 5. Base de datos bloqueada (SQLite)
```bash
rm backend/db.sqlite3
python backend/manage.py migrate
python backend/create_test_admin.py
```

---

## 📝 COMMITS Y GIT

### Convención de Commits
```
feat: Nueva característica
fix: Corrección de bug
refactor: Refactorización de código
docs: Actualización de documentación
style: Cambios de estilo (formato, etc)
test: Añadir o modificar tests
chore: Tareas de mantenimiento
```

### Git Flow
```bash
git add .
git commit -m "feat: Descripción del cambio"
git push origin main
```

---

## 🔮 ROADMAP

### Funcionalidades Futuras

1. **Sistema de Roles Avanzado**
   - Permisos a nivel de empresa
   - Roles personalizados

2. **Analytics Avanzado**
   - Dashboard interactivo
   - Reportes personalizados
   - Exportación de datos

3. **Integración LinkedIn**
   - OAuth completo
   - Importación de perfiles
   - Verificación de identidad

4. **Notificaciones Push**
   - Web Push API
   - Email notifications
   - SMS (opcional)

5. **Mobile App**
   - React Native
   - Notificaciones nativas
   - Chat en tiempo real

6. **AI Enhancements**
   - Predicción de éxito de matches
   - Recomendaciones personalizadas
   - Análisis de sentimiento en chat

---

## 📞 CONTACTO Y SOPORTE

**Desarrollado por:** Inspiratoria Team  
**Email:** admin@inspiratoria.com  
**Documentación:** Este archivo  
**Repositorio:** https://github.com/peterfulle/inspiratoria

---

**Última actualización:** 7 de Enero, 2026  
**Versión:** 1.0.0  
**Estado:** En Producción ✅
