# Inspiratoria — Detalle de horas de ingeniería

> Documento de respaldo de esfuerzo técnico invertido en el desarrollo de la
> plataforma Inspiratoria (backend Django + FastAPI, frontend Next.js 14,
> portal de participantes, motor de matching IA, despliegue en Render y
> producción en `inspiratoria.aplifly.com`).
>
> **Fecha de corte:** 09 de mayo de 2026
> **Repositorio:** github.com/peterfulle/inspiratoria
> **Métrica base de repo:** 33 commits firmados, 436 archivos tocados,
> **125 753 líneas añadidas** y 7 952 eliminadas.
>
> Las horas reportadas siguen una tarifa de ingeniería senior full-stack
> (estimación conservadora). El detalle se agrupa por **módulos funcionales**
> y se contrasta con los entregables visibles en producción.

---

## 1. Resumen ejecutivo

| Bloque | Horas | % |
|---|---:|---:|
| Backend (Django + FastAPI + DB) | 92 | 19,8 % |
| Frontend (Next.js + UI/UX) | 168 | 36,1 % |
| Portal de participante (`/p/{code}`) | 64 | 13,8 % |
| Studio / PM Console v2 | 46 | 9,9 % |
| Motor de matching inteligente (6D + Gemini) | 28 | 6,0 % |
| Onboarding (LinkedIn + Gemini + wizards) | 22 | 4,7 % |
| Sistema de chat + Socket.IO | 14 | 3,0 % |
| Auth (OTP + TOTP + portal_code) | 10 | 2,2 % |
| DevOps / Render / dominio / CORS | 12 | 2,6 % |
| QA, testing manual y bugfixing | 9 | 1,9 % |
| **TOTAL** | **465 horas** | **100 %** |

> A 5 horas/día (jornada parcial sostenida): **~93 jornadas hábiles**.
> A 8 horas/día (jornada full): **~58 jornadas hábiles**.

---

## 2. Backend (Django 5 + FastAPI) — 92 h

### 2.1. Modelado de dominio y migraciones — **20 h**

- App `companies/`: modelo `Company` (multi-tenant, plan, branding, contactos,
  RUT/tax_id) y `User` custom heredando `AbstractUser` con perfil mentor/mentee,
  permisos granulares (8 flags), portal_code único, OTP/TOTP, avatar base64.
- App `programs/`: `Program`, `ProgramParticipant`, `Match`, `Milestone`,
  `Sentiment`, `Notification`, `Activity`, `Content`, `Survey`, `Alert`.
- App `invitations/`: `PendingInvitation` con token de 64 chars y
  `OnboardingProgress` (6 pasos).
- Migraciones, índices, constraints únicos (mentor+mentee+program), defaults,
  data fixtures.

### 2.2. Capa FastAPI / endpoints REST — **24 h**

- Router central `/api` con apps `companies`, `programs`, `invitations`.
- ~40 endpoints con schemas Pydantic, validaciones, manejo de errores
  consistente y respuestas tipadas.
- Endpoints públicos (sin auth) para self-enroll y `public-info`.
- Endpoints administrativos para CRUD de plantillas, participantes y matches.

### 2.3. Auth: OTP + TOTP + portal_code — **10 h**

- Generación de OTP de 4 dígitos con expiración 15 min.
- Helper `prepare_user_secure_access(user, send_email)` reutilizable.
- TOTP con `pyotp` + QR generado server-side.
- `portal_code` único por usuario para deep-links del portal.

### 2.4. Pipeline de email (SMTP + plantillas) — **8 h**

- Configuración Gmail (`smtp.gmail.com:587`, app password).
- Plantillas HTML inline en español: OTP de acceso, invitación a programa,
  notificaciones de sesión mentor/mentee, activación de cuenta.
- Reenvío idempotente y logs de envío.

### 2.5. Seeds y management commands — **6 h**

- `seed_intelligent_match_demo.py` (10 mentores + 10 mentees ricos).
- `seed_all_roles.py` (todos los roles).
- `clear_all_keep_admin.py`.
- Comandos Django para limpieza, sync y carga inicial.

### 2.6. Servicios auxiliares — **8 h**

- `LinkedInOAuthService` (OAuth 2.0).
- `NeuralmorphicAIService` (Gemini 2.5 Flash) para extracción de perfil y
  generación de bio.
- Cliente Gemini con manejo de quotas y fallbacks cuando la API falla.

### 2.7. Configuración Django + ASGI + Socket.IO — **6 h**

- `mentorloop_clone/asgi.py` montando Socket.IO en `/socket.io`,
  FastAPI en `/api`, estáticos en `/static` y Django ASGI en `/`.
- Middleware CORS, configuración por entorno (DEV vs PROD), logging.

### 2.8. WebSockets / chat backend — **10 h**

- Servidor Socket.IO con namespaces, autenticación de conexión por token,
  emisión/recepción de mensajes, presencia online/offline, persistencia.

---

## 3. Frontend (Next.js 14 + TypeScript) — 168 h

### 3.1. Setup base + sistema de diseño — **14 h**

- App router (`src/app/`), layouts globales, fonts, Tailwind con paleta
  custom (#FFD902 amarillo Inspiratoria), tokens compartidos.
- `globals.css`, animaciones reutilizables, fonts (Inter), tipografías.
- THEME_GRADIENTS (6 gradientes preset por temática).

### 3.2. Landing pública / login / register / activate — **14 h**

- Landing con hero, secciones, scroll animations, video carousel.
- `/login` (público) + `/login/admin` (OTP + TOTP).
- `/register` con validaciones.
- `/activate/[token]` para activación por correo.

### 3.3. Dashboard admin (consola completa) — **48 h**

Vistas: `accounts`, `activities`, `alerts`, `analytics`, `billing`,
`calendar`, `chat`, `clients/[id]/{billing,config,manage,programs,setup,users}`,
`configuration`, `ecosystem`, `goals`, `intelligent-match`,
`manage-programs`, `matches`, `migration`, `notifications`,
`participants`, `profile`, `programs/[id]/{activities,config,manage,participants,reports,training}`,
`reports`, `sessions`, `users`.

Cada vista incluye:

- Tabla con búsqueda + filtros + acciones masivas.
- Modal de creación/edición con validaciones.
- Skeletons de carga.
- Stats cards animadas con auto-refresh (30 s).

### 3.4. Studio / PM Console v2 — **46 h**

- Workspace `/studio/{slug}/program/{programId}` (~1730 líneas).
- Tabs: Resumen, Información, Cronograma, Actividades, Participantes, Gobierno.
- **Cronograma con asistente automático** que sugiere fechas a partir de
  `template.duration` y la cantidad de matches.
- **TabParticipantes**: banner self-enroll con link copiable, 5 stats cards,
  buscador + filtro por rol, modal `AddParticipantModal` con dos pestañas
  grandes (Buscar existente / Crear nuevo), toggle de envío de invitación,
  acciones por fila (reenviar OTP, eliminar).
- Línea de tiempo visual de actividades programadas con badges de modalidad.
- Modal de credenciales seguro y vista de gobierno con permisos por rol.

### 3.5. Portal de participante `/p/[code]` — **64 h**

Archivo central: `frontend/src/app/p/[code]/[[...section]]/page.tsx`
(~4540 líneas, catch-all con 16+ secciones).

- Sidebar agrupada (Mi Espacio, Mentoría, Personal, Reconocimiento, Conexión)
  filtrada por rol (mentor vs mentee).
- Topbar con indicador “Sync hh:mm” + botón manual de refresh con animación.
- **`reloadProgramData({silent})`** carga en paralelo programa, plantilla,
  participantes y my-programs.
- Auto-refresh en `window.focus` y `document.visibilitychange`.
- **Sistema de skeletons reutilizables** (`SkelBlock`, `SkelCardGrid`,
  `SkelList`, `SkelDetailPage`) que reemplazan cualquier “Cargando…”.
- Pantalla inicial con esqueleto de shell completo (sidebar + topbar + stats
  + grid) — elimina el flash morado del onboarding.
- **Wizard de perfil** mentor/mentee de 4 pasos con bloqueo de plataforma
  hasta completarse, validación por paso, nombre/apellido y email de acceso
  bloqueados (vienen del invite), email personal alternativo opcional.
- Tab Módulos sincronizado con cronograma (lookup por nombre+module_id),
  fechas/modalidad por actividad, badge “Sin agendar”, sección extra para
  actividades fuera de módulo.
- Tab Progreso usa fechas reales de cronograma (`scheduledActivities[0]` →
  startDate, `scheduledEnds[last]` → endDate) con fallback a duración del
  template.
- Tab Mis Actividades con smart sort, badge HOY, resaltado rojo de vencidas,
  link a meeting URL, barra de progreso personal y CTA “Marcar completa”.
- Mentor: `/mis-mentees`, `/sesiones` (con notas + estado de ánimo + temas +
  próximos pasos + sugerencia IA Gemini para próxima sesión).
- Mentee: `/mi-mentor`, `/sesiones`, `/mi-red`, `/insignias`.
- Chat embebido con perfil del participante en modal (click en avatar).

### 3.6. Página pública de auto-enrolamiento `/enroll/[programId]` — **6 h**

- Hero con info del programa (consume `/public-info`).
- Selector de rol con 4 cards.
- Formulario email + nombre + apellido.
- Pantalla de éxito con CTA al login.
- Estados de error (programa no encontrado, no acepta inscripciones).

### 3.7. Onboarding wizard (6 pasos LinkedIn + Gemini) — **14 h**

- `/onboarding/page.tsx` con `OnboardingWizard`.
- `/onboarding/linkedin-callback` que recibe el código OAuth y consulta al
  backend.
- Componente `OnboardingWizard` con stepper visual, manejo de estado
  centralizado y persistencia en `OnboardingProgress`.

### 3.8. Vistas mentor/mentee resumidas + páginas core — **8 h**

- `/mentor`, `/mentor/program`, `/mentee`, `/mentee/program`.
- `/participant/[id]` detalle individual.
- `/core[/...]` páginas institucionales.

### 3.9. Componentes compartidos — **14 h**

- `Sidebar`, `TopNavbar`, `DashboardSkeleton`, `DashboardStatsCards`.
- `ProgramManagement`, `ParticipantModal`, `MatchingEngine`,
  `MatchingEngineAI`, `ChatWindow`, `CalendarView`, `GoalsOKRs`,
  `FlywheelCard`.
- Dashboards por rol: `AdminDashboard`, `ClientDashboard`,
  `FacilitatorDashboard`, `MentorDashboard`, `MenteeDashboard`.

---

## 4. Motor de matching inteligente (6D + Gemini) — 28 h

### 4.1. Algoritmo en `intelligent_matching.py` — **16 h**

Suma ponderada en 6 dimensiones:

| Dimensión | Peso |
|---|---:|
| Skills × Goals | 25 % |
| Topics × Challenges | 20 % |
| Style fit | 15 % |
| Experience fit | 15 % |
| Objectives fit | 15 % |
| Domain fit | 10 % |

- Atenuación por completitud de perfil (mentor/mentee).
- Normalización de strings (lowercase, trim, deduplicación).
- Deduplicación de pares ya activos.
- Tests manuales con seed de 10×10.

### 4.2. UI `/dashboard/intelligent-match` — **8 h**

- Selector de programa, sliders de `topK` y `minScore`, toggle IA.
- Render de resultados con breakdown numérico por dimensión + keywords
  coincidentes resaltadas.
- Acción “Activar match” con confirmación y emisión de notificaciones.
- Animación al ejecutar el matching (loading IA).

### 4.3. Integración Gemini para explicación — **4 h**

- Prompt engineered en español que recibe los dos perfiles y devuelve 3
  bullets ejecutivos.
- Manejo de quota errors / fallback graceful a “sin explicación IA”.

---

## 5. Onboarding LinkedIn + Gemini — 22 h

- OAuth 2.0 con LinkedIn (state, redirect, refresh).
- Extracción de perfil desde respuesta LinkedIn (work experience, skills,
  headline, summary).
- Llamada a Gemini para parsing semántico del perfil y generación de bio.
- Wizard de 6 pasos con progreso persistente.
- Lock de plataforma hasta completar perfil mentor/mentee (`isProfileComplete`).

---

## 6. Sistema de chat (Socket.IO) — 14 h

- Servidor Socket.IO con namespaces y autenticación.
- `ChatWindow` con dark theme, mensajes en tiempo real, estados de typing,
  badges de no leídos.
- Modal de perfil al click en avatar (consulta perfil + programa actual).
- Persistencia en DB.

---

## 7. Auth: OTP + TOTP + portal routing — 10 h

- Login `/login/admin` con flujo email → OTP de 4 dígitos → TOTP opcional.
- Generación y verificación de OTP server-side (15 min).
- 2FA con `pyotp`, QR para Google/Microsoft Authenticator.
- Routing por rol post-login + portal_code.
- Manejo de `auth_token`, `user`, `company`, `program_participant`,
  `session_expires_at` en `localStorage` con auto-logout.

---

## 8. DevOps / Render / dominio — 12 h

- `render.yaml` con servicio backend (uvicorn ASGI), frontend (Next.js) y
  Postgres.
- Configuración de variables de entorno (DJANGO_SECRET_KEY, DATABASE_URL,
  GEMINI_API_KEY, EMAIL_*, LINKEDIN_*, FRONTEND_URL, CORS_*).
- Dominio custom `inspiratoria.aplifly.com` (CNAME en Aplifly → Render).
- Script `start_all.sh` local (limpieza de puertos + nohup + tail).
- `start_backend.sh` para sólo backend con `--reload`.
- Avatar base64 en DB (resuelve filesystem efímero de Render).

---

## 9. QA, testing manual y bugfixing — 9 h

Bugs corregidos visibles en commits `fix:`:

- React #310 (hooks antes de early return) en 2 vistas.
- TypeScript build errors para Render (resolución de tipos en deploy).
- Wrap de `useSearchParams` en Suspense para `/login/admin`, `/core`, `/studio`.
- 422 al crear usuario por roles faltantes (admin_root, coordinator,
  project_manager, billing).
- Hydration mismatch + CORS aplifly + videos mp4 incluidos en git.
- Carga de mentees al crear sesión + feedback en formulario.
- Sync de fechas de cronograma con tab Módulos del portal.

---

## 10. Documentación (no contabilizada en horas de ingeniería)

Como entregable adicional, sin costo extra:

- `PROJECT_OVERVIEW.md` (656 líneas): informe técnico A → Z.
- `PROJECT_OVERVIEW.pdf` (versión imprimible monocroma).
- ~20 documentos previos en raíz: `BACKEND_STATUS.md`,
  `DASHBOARD_SYSTEM.md`, `ROLES_ARCHITECTURE.md`, `ONBOARDING_SYSTEM.md`,
  `DEPLOYMENT.md`, `RENDER_SETUP.md`, `UX_IMPROVEMENTS_LOG.md`,
  `TESTING_GUIDE.md`, `BROCHURE_INSPIRATORIA.md`, `PLANES_MONETIZACION.md`,
  entre otros.

---

## 11. Histórico de commits (33 commits)

Selección de los más representativos por sprint:

| Commit | Fecha | Descripción |
|---|---|---|
| `8f42bf9` | 2026-05-09 | docs: PDF B&W de PROJECT_OVERVIEW + script generador |
| `e4405ce` | 2026-05-09 | docs: PROJECT_OVERVIEW.md (informe A→Z) |
| `80545ed` | 2026-05-05 | feat(portal/modulos): sync con cronograma + actividades huérfanas |
| `819a01a` | 2026-05-05 | feat(portal): skeletons + bloqueo de campos del invite |
| `fae3f33` | 2026-05-05 | feat: PM Console v2 + gestión de participantes + sync portal |
| `81e2540` | 2026-04-13 | feat: wizard onboarding mentee (4 pasos, bloquea acceso) |
| `301809c` | 2026-04-13 | feat: dashboard mentee, nav por rol, my-mentor, sesiones |
| `a7aedf4` | 2026-04-13 | feat: audit log de sesión, emails mentor/mentee, iconos SVG |
| `833e416` | 2026-04-13 | feat: sesiones de mentoría, perfiles mentee, sugerencias IA |
| `06dccc8` | 2026-04-12 | feat: wizard mentor multi-step (4 pasos, DB-backed) |
| `f12e385` | 2026-04-12 | feat: lock nav hasta completar perfil |
| `5f85f1a` | 2026-04-12 | feat: chat profile detail modal |
| `19ba1c0` | 2026-04-12 | feat: sistema de chat + portal completo |
| `88c3fc3` | 2026-04-10 | feat: avatar base64 (Render persistente) |
| `ef30034` | 2026-04-10 | feat: notificaciones, perfil, 2FA, TipTap, branding amarillo |
| `c045f9f` | 2026-03-13 | fix: preview lee localStorage + visor PDF + descarga + imprimir |
| `14cf3c6` | 2026-03-13 | feat: file upload + slug + preview de programas |
| `3d93e0b` | 2026-03-11 | actualizar: fix CORS, videos, hydration y configuración completa |

---

## 12. Tarifa de referencia (orientativa)

| Tarifa por hora | Total estimado |
|---|---:|
| USD 25/h | USD 11 625 |
| USD 35/h | USD 16 275 |
| USD 50/h | USD 23 250 |
| USD 75/h | USD 34 875 |
| CLP 25 000/h | CLP 11 625 000 |
| CLP 35 000/h | CLP 16 275 000 |

> Las tarifas son referenciales para perfil **senior full-stack**
> (Python/Django, FastAPI, TypeScript/Next.js, integración con LLMs y
> despliegue cloud). Ajustar según mercado, modalidad y dedicación.

---

## 13. Entregables verificables

1. Repositorio Git con 33 commits firmados (rama `main`).
2. Aplicación funcionando en `https://inspiratoria.aplifly.com`.
3. Backend FastAPI con OpenAPI auto-documentado (`/api/docs`).
4. Despliegue automático en Render desde rama `main`.
5. Postgres productiva con migraciones aplicadas.
6. Pipeline de email funcional (OTP, invitaciones, notificaciones).
7. Documento técnico A → Z (`PROJECT_OVERVIEW.md` + PDF).
8. Este documento de horas de ingeniería (`HORAS_INGENIERIA.md` + PDF).

---

> Este documento sirve como respaldo formal de horas para facturación,
> control de proyecto, comparación con propuestas externas o planificación
> de extensiones futuras (export Excel/PDF avanzado, notificaciones push,
> mobile app, multi-idioma, integración con calendarios externos, etc.).
