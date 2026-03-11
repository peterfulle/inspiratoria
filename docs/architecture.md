# Arquitectura de la Plataforma de Mentoría

Esta plataforma replica el flywheel **Match → Momentum → Measure** descrito por Mentorloop y separa responsabilidades en dos capas principales:

1. **Backend Python (Django + FastAPI)**
   - **Django** provee ORM, autenticación, panel de administración y migraciones.
   - **FastAPI** expone APIs modernas (JSON/REST) montadas sobre la misma aplicación ASGI para alto rendimiento.
   - **SQLite** por defecto para desarrollo (intercambiable por Postgres/MySQL en producción).
   - **Capas funcionales**:
     - *Program Management*: programas, temas, branding y formularios.
     - *Participant Graph*: participantes, roles (mentor/mentee) y habilidades.
     - *Matching Engine*: cálculo de afinidad y generación de matches manuales o automáticos.
     - *Momentum Services*: milestones, nudges y seguimiento de objetivos.
     - *Sentiment & Analytics*: recolección de feedback y agregación para dashboards.
   - **Integración**: `asgi.py` monta FastAPI bajo `/api` y deja a Django manejar `/admin` y las vistas clásicas.

2. **Frontend React (Next.js + Tailwind)**
   - Next 14 (App Router) para SSR/SSG híbrido.
   - Tailwind + componentes reutilizables para UI "muy moderna".
   - Data layer con SWR y un `ApiClient` que consume el backend.
   - Secciones clave: Hero, métricas, lista de programas, estado de matches, pulso de sentimiento.

## Flujo de Datos
1. Coordinador configura un programa → se guarda en Django y se expone vía `/api/programs`.
2. Participantes se registran/importan → `/api/participants`.
3. Motor de matching calcula afinidad y crea `Match` + `Milestone` inicial.
4. Frontend consume `/api/matches` y muestra progreso; los nudges/milestones se actualizan vía API.
5. Sentiment se registra y alimenta dashboards en tiempo real.

## Seguridad y extensibilidad
- CORS restringible desde variables de entorno.
- Integración SSO/HRIS planificada mediante capa `integrations` futura.
- Arquitectura lista para desacoplar servicios (p.ej. mover matching a microservicio FastAPI dedicado) sin tocar el frontend.
