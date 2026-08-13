import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sesión de Activación · SQMentors 2026 · Inspiratoria",
  description: "Guión operativo de la sesión de activación de plataforma para mentores y mentoras SQMentors 2026.",
};

const CANVA_URL = "https://canva.link/tkl3zbcw4swczlz";

const AGENDA = [
  { n: 1, title: "Bienvenida y encuadre", min: 5 },
  { n: 2, title: "Sentido de la plataforma en SQMentors", min: 5 },
  { n: 3, title: "Activación de acceso e ingreso", min: 10 },
  { n: 4, title: "Recorrido guiado por la plataforma", min: 20 },
  { n: 5, title: "Uso durante el proceso de mentoría", min: 10 },
  { n: 6, title: "Preguntas frecuentes y soporte", min: 7 },
  { n: 7, title: "Cierre y próximos pasos", min: 3 },
];

const RECORRIDO_SECCIONES = [
  {
    n: "1",
    title: "Panel principal",
    lead: "Explicar que este será el punto de entrada del mentor/a.",
    guion:
      "En el panel principal encontrarán una vista general de su participación en el programa. Desde aquí podrán acceder a la información de su dupla, recursos disponibles y estado del proceso.",
  },
  {
    n: "2",
    title: "Perfil del mentor/a",
    lead: "Mostrar dónde revisar o completar información personal/profesional.",
    guion:
      "Les pedimos revisar que su información esté correcta. Este perfil nos ayuda a mantener ordenado el proceso y también permite que la experiencia sea más personalizada.",
  },
  {
    n: "3",
    title: "Información de la dupla asignada",
    lead: "Mostrar dónde aparece el nombre e información básica del mentee.",
    guion:
      "En esta sección podrán ver la información de su mentee asignado/a. Recuerden que la primera conversación formal estará orientada a construir vínculo, acordar expectativas y definir objetivos del proceso, por lo que esta información es solo un punto de partida.",
  },
  {
    n: "4",
    title: "Recursos del programa",
    lead: "Mostrar bitácora, guías, pautas o materiales disponibles.",
    guion:
      "Aquí encontrarán los recursos que apoyan el proceso: guías de sesión, bitácoras, pautas de conversación y otros materiales que iremos dejando disponibles. La recomendación es revisarlos antes de cada sesión para llegar con claridad sobre el foco metodológico.",
  },
  {
    n: "5",
    title: "Registro de sesiones",
    lead: "Explicar cómo registrar fecha, asistencia, acuerdos y observaciones generales.",
    guion:
      "Esta sección es muy importante. Después de cada sesión deberán registrar información básica del encuentro: fecha, si se realizó o no, principales temas trabajados y acuerdos generales. No se trata de escribir detalles confidenciales ni conversaciones personales profundas, sino de dejar trazabilidad del proceso y próximos pasos.",
  },
  {
    n: "6",
    title: "Seguimiento y avances",
    lead: "Mostrar, si aplica, dónde revisar progreso o estado del proceso.",
    guion:
      "El seguimiento nos permite acompañar mejor a las duplas y detectar a tiempo si alguna necesita apoyo. La idea es que la plataforma ayude a sostener el proceso, no que se transforme en una carga administrativa.",
  },
];

const REGLAS_USO = [
  "Ingresar antes de iniciar el proceso para revisar perfil y dupla.",
  "Revisar recursos antes de cada sesión.",
  "Registrar cada sesión realizada.",
  "Dejar acuerdos generales, no detalles privados.",
  "Avisar al equipo si hay dificultades de contacto, agenda o continuidad.",
  "Usar la plataforma como apoyo, no como reemplazo de la conversación.",
];

const FAQ = [
  { q: "¿Qué pasa si no puedo ingresar?", a: "Nos escriben al canal de soporte definido y revisaremos su caso individualmente." },
  { q: "¿Qué pasa si mis datos aparecen incorrectos?", a: "Deben informarlo al equipo para que podamos corregirlo o indicarles cómo editarlo." },
  { q: "¿Qué pasa si no veo a mi mentee asignado/a?", a: "Lo revisaremos con el equipo, porque puede ser un tema de activación o sincronización." },
  { q: "¿Cuánto detalle debo poner en el registro de sesión?", a: "Solo información general: fecha, foco trabajado, acuerdos y próximos pasos. No deben registrar información confidencial o sensible de la conversación." },
  { q: "¿La plataforma reemplaza la bitácora?", a: "No. La bitácora es el recurso metodológico de trabajo; la plataforma es el espacio de gestión, seguimiento y trazabilidad." },
  { q: "¿Qué hago si mi mentee no responde o cancela?", a: "Registrar la situación si corresponde y avisar al equipo de coordinación para apoyar la continuidad del proceso." },
];

const CHECKLIST = {
  antes: [
    "Confirmar link de reunión.",
    "Confirmar listado de mentores convocados.",
    "Verificar que los correos de activación hayan sido enviados.",
    "Tener acceso de prueba a la plataforma.",
    "Preparar recorrido en pantalla.",
    "Definir canal de soporte posterior.",
    "Tener listado para anotar casos con problemas de acceso.",
    "Probar audio, pantalla compartida y navegación.",
  ],
  durante: [
    "Dar bienvenida y encuadre.",
    "Explicar el sentido de la plataforma.",
    "Guiar ingreso paso a paso.",
    "Mostrar secciones principales.",
    "Explicar registro de sesiones.",
    "Resolver dudas frecuentes.",
    "Anotar casos que requieran soporte.",
    "Reforzar próximos pasos.",
  ],
  despues: [
    "Enviar correo de seguimiento con link de plataforma.",
    "Compartir instrucciones breves de uso.",
    "Contactar a mentores con problemas de acceso.",
    "Confirmar mentores activados.",
    "Revisar si hay dudas metodológicas adicionales.",
    "Dejar registro de asistencia a la sesión.",
  ],
};

function SectionLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-extrabold text-dark-500">
        {n}
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{title}</h2>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-0 sm:flex sm:justify-between sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-800 sm:mt-0 sm:text-right">{value}</dd>
    </div>
  );
}

function Guion({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="relative rounded-2xl border border-primary-200 bg-primary-50/60 p-5 pl-6 text-[0.95rem] leading-relaxed text-gray-700">
      <span className="absolute left-2 top-2 text-3xl font-serif text-primary-400/70">&ldquo;</span>
      <p className="relative whitespace-pre-line pl-4 italic">{children}</p>
    </blockquote>
  );
}

function PersonTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-dark-500 px-3 py-1 text-xs font-semibold text-white">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      {children}
    </span>
  );
}

function DurationTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
      {children}
    </span>
  );
}

export default function SQMentorsActivacionPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2">
            <Image src="/images/isologo-amarillo.png" alt="Inspiratoria" width={28} height={28} />
            <span className="hidden text-sm font-bold text-gray-800 sm:inline">Inspiratoria</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-500">SQMentors 2026</span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {AGENDA.map((a) => (
              <a
                key={a.n}
                href={`#momento-${a.n}`}
                title={a.title}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-gray-500 transition hover:bg-primary-100 hover:text-dark-500"
              >
                {a.n}
              </a>
            ))}
            <a
              href="#checklist"
              className="ml-2 hidden shrink-0 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-primary-400 hover:text-dark-500 sm:inline"
            >
              Checklist
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-[#7a1f8c] bg-cover bg-center px-5 py-24 text-center"
        style={{ backgroundImage: "url(/sqmentors/fondo2.jpeg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/30 backdrop-blur">
            Sesión de activación · Plataforma
          </span>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Activación de Plataforma
            <br className="hidden sm:block" /> Mentores SQMentors 2026
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm text-white/85 sm:text-base">
            Guión operativo para que cada mentor y mentora ingrese, conozca su dupla y sepa registrar
            avances antes de comenzar sus sesiones de mentoría.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-dark-500">⏱ 60 minutos</span>
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-dark-500">Modalidad online</span>
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-dark-500">Anfitrión: Alfredo Olguín</span>
          </div>
          <div className="mt-8">
            <a
              href={CANVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-dark-500 shadow-glow transition hover:bg-primary-400"
            >
              Ver presentación en Canva
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10" /></svg>
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-16">
        {/* ── Objetivo ── */}
        <section className="mb-16">
          <SectionLabel n={0} title="Objetivo de la sesión" />
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-7 text-[0.98rem] leading-relaxed text-gray-700 sm:p-9">
            Activar a mentores y mentoras en la plataforma de gestión de SQMentors, entregándoles una
            orientación práctica sobre su uso, sus principales funcionalidades y el rol que tendrá esta
            herramienta durante el proceso de acompañamiento. La sesión busca que cada mentor/a pueda
            ingresar correctamente, revisar su perfil, conocer la información disponible de su mentee,
            comprender cómo registrar avances y resolver dudas iniciales antes de comenzar sus sesiones de
            mentoría.
          </div>
        </section>

        {/* ── Datos generales ── */}
        <section id="datos-generales" className="mb-16">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Datos generales</h3>
          <dl className="rounded-3xl border border-gray-100 p-7 sm:p-9">
            <MetaRow label="Actividad" value="Sesión de Activación Plataforma SQMentors" />
            <MetaRow label="Dirigida a" value="Mentores y mentoras SQMentors 2026" />
            <MetaRow label="Anfitrión" value="Alfredo Olguín, Inspiratoria" />
            <MetaRow label="Facilitadores plataforma" value="Alfredo Olguín y Peter" />
            <MetaRow label="Duración sugerida" value="60 minutos" />
            <MetaRow label="Modalidad" value="Online" />
            <MetaRow label="Foco" value="Activación, navegación, uso práctico y resolución de dudas" />
            <MetaRow
              label="Presentación"
              value={
                <a href={CANVA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-dark-500 underline underline-offset-2 hover:text-primary-700">
                  Ver en Canva ↗
                </a>
              }
            />
          </dl>
        </section>

        {/* ── Agenda / timeline ── */}
        <section id="agenda" className="mb-20">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">Estructura sugerida de la sesión</h3>
          <ol className="relative space-y-0 border-l-2 border-primary-200 pl-8">
            {AGENDA.map((a) => (
              <li key={a.n} className="relative pb-8 last:pb-0">
                <span className="absolute -left-[41px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-primary-500 text-xs font-extrabold text-dark-500">
                  {a.n}
                </span>
                <a href={`#momento-${a.n}`} className="group flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-base font-bold text-gray-800 group-hover:text-dark-500 group-hover:underline">{a.title}</span>
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-500">{a.min} min</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        {/* ══ MOMENTO 1 ══ */}
        <section id="momento-1" className="mb-16 scroll-mt-24">
          <SectionLabel n={1} title="Bienvenida y encuadre" />
          <div className="mb-4 flex flex-wrap gap-2">
            <DurationTag>5 minutos</DurationTag>
            <PersonTag>Alfredo Olguín</PersonTag>
          </div>
          <Guion>
            {`Hola a todas y todos, muchas gracias por conectarse a esta sesión de activación de plataforma de SQMentors 2026. Soy Alfredo Olguín, parte del equipo de Inspiratoria, y hoy junto a Peter los vamos a acompañar en este recorrido práctico para que puedan ingresar, conocer y utilizar la plataforma que apoyará el proceso de mentoría.

La idea de esta sesión es muy concreta: que todas y todos puedan quedar activados, entender dónde encontrar la información relevante y saber cómo registrar los avances de sus sesiones. No es una sesión teórica sobre mentoring, sino una instancia operativa para que lleguen al proceso con más claridad y confianza.

Les recomendamos tener a mano su computador, revisar si recibieron el correo de acceso y, si tienen dudas durante la sesión, pueden ir dejándolas en el chat o levantarlas en los momentos que iremos abriendo.`}
          </Guion>
        </section>

        {/* ══ MOMENTO 2 ══ */}
        <section id="momento-2" className="mb-16 scroll-mt-24">
          <SectionLabel n={2} title="Sentido de la plataforma en SQMentors" />
          <div className="mb-4 flex flex-wrap gap-2">
            <DurationTag>5 minutos</DurationTag>
            <PersonTag>Alfredo Olguín</PersonTag>
          </div>
          <Guion>
            {`Antes de entrar a la navegación, queremos reforzar brevemente por qué estamos usando esta plataforma.

SQMentors no es solo una serie de reuniones entre mentor y mentee. Es una experiencia de acompañamiento que busca tener continuidad, trazabilidad y foco. La plataforma nos permite ordenar el proceso, centralizar información y acompañar mejor a cada dupla.

Aquí podrán encontrar información relevante de su proceso, acceder a recursos, revisar datos de su mentee, registrar sesiones y dejar evidencia de avances y acuerdos. Esto es importante porque nos ayuda a cuidar la experiencia, hacer seguimiento metodológico y asegurar que el acompañamiento no dependa solo de la memoria o de conversaciones aisladas.

La plataforma no reemplaza el vínculo humano ni la calidad de la conversación.

Al contrario, está al servicio de esa relación, para que cada encuentro tenga más claridad, continuidad y propósito.`}
          </Guion>
        </section>

        {/* ══ MOMENTO 3 ══ */}
        <section id="momento-3" className="mb-16 scroll-mt-24">
          <SectionLabel n={3} title="Activación de acceso e ingreso" />
          <div className="mb-4 flex flex-wrap gap-2">
            <DurationTag>10 minutos</DurationTag>
            <PersonTag>Peter</PersonTag>
            <PersonTag>Alfredo Olguín</PersonTag>
          </div>
          <p className="mb-4 text-sm font-semibold text-gray-500">
            Objetivo del momento: asegurar que mentores y mentoras puedan ingresar correctamente a la plataforma.
          </p>
          <Guion>
            {`Ahora vamos a hacer el ingreso paso a paso. Peter nos va a guiar en pantalla y les pedimos que, en paralelo, cada uno pueda ir probando desde su computador.

Lo primero será revisar el correo de activación que recibieron. Desde ese enlace podrán ingresar a la plataforma, crear o confirmar sus credenciales y acceder a su perfil.`}
          </Guion>

          <div className="mt-6 rounded-2xl border border-gray-100 p-6">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Pasos sugeridos a mostrar</div>
            <ol className="space-y-2.5">
              {[
                "Abrir correo de activación.",
                "Hacer clic en el enlace de acceso.",
                "Crear contraseña o ingresar con credenciales, según corresponda.",
                "Confirmar acceso a la plataforma.",
                "Revisar nombre de usuario y datos básicos.",
                "Verificar que el perfil esté correctamente asociado al programa SQMentors 2026.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[0.65rem] font-bold text-dark-500">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl bg-primary-50 p-5 text-sm text-gray-700">
            <svg className="mt-0.5 shrink-0 text-primary-700" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M15.09 14c.3-.5.5-1.1.7-1.6.5-1.3 1.2-2.5 1.2-4.4 0-3.3-2.7-6-6-6S5 4.7 5 8c0 1.9.7 3.1 1.2 4.4.2.5.4 1.1.7 1.6" /></svg>
            <p><span className="font-semibold">Mensaje de apoyo:</span> &ldquo;Si alguien no logra ingresar en este momento, no se preocupen. Vamos a tomar nota y el equipo les dará soporte después de la sesión. Lo importante es que hoy todos entiendan el flujo y sepamos quiénes requieren apoyo específico.&rdquo;</p>
          </div>
        </section>

        {/* ══ MOMENTO 4 ══ */}
        <section id="momento-4" className="mb-16 scroll-mt-24">
          <SectionLabel n={4} title="Recorrido guiado por la plataforma" />
          <div className="mb-4 flex flex-wrap gap-2">
            <DurationTag>20 minutos</DurationTag>
            <PersonTag>Peter</PersonTag>
            <PersonTag>Apoyo: Alfredo Olguín</PersonTag>
          </div>
          <p className="mb-4 text-sm font-semibold text-gray-500">
            Objetivo del momento: mostrar las principales secciones que utilizarán los mentores durante el proceso.
          </p>
          <Guion>
            {`Ahora vamos a recorrer las principales secciones de la plataforma. La idea no es revisar cada detalle, sino que sepan dónde está lo esencial y cómo se usará durante el acompañamiento.`}
          </Guion>

          <div className="mt-6 space-y-4">
            {RECORRIDO_SECCIONES.map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-100 p-6">
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="text-xs font-extrabold text-primary-700">{s.n}</span>
                  <h4 className="text-base font-bold text-gray-900">{s.title}</h4>
                </div>
                <p className="mb-3 text-sm text-gray-500">{s.lead}</p>
                <blockquote className="border-l-2 border-primary-300 pl-4 text-sm italic leading-relaxed text-gray-700">
                  &ldquo;{s.guion}&rdquo;
                </blockquote>
              </div>
            ))}
          </div>
        </section>

        {/* ══ MOMENTO 5 ══ */}
        <section id="momento-5" className="mb-16 scroll-mt-24">
          <SectionLabel n={5} title="Uso durante el proceso de mentoría" />
          <div className="mb-4 flex flex-wrap gap-2">
            <DurationTag>10 minutos</DurationTag>
            <PersonTag>Alfredo Olguín</PersonTag>
          </div>
          <p className="mb-4 text-sm font-semibold text-gray-500">
            Objetivo del momento: alinear expectativas sobre cómo y cuándo usar la plataforma.
          </p>
          <Guion>
            {`Queremos reforzar que la plataforma se usará como una herramienta de apoyo durante todo el proceso de mentoría. No esperamos que pasen mucho tiempo llenando información, pero sí que mantengamos ciertos registros mínimos para cuidar la experiencia.

Después de cada sesión, idealmente dentro de las siguientes 24 a 48 horas, les pediremos ingresar y registrar la información básica del encuentro. Esto nos permite saber que la sesión ocurrió, qué foco general tuvo y cuáles fueron los acuerdos principales.

También es importante revisar los recursos antes de cada sesión. La bitácora de participantes y la guía para mentores están diseñadas para conversar entre sí, por lo que el uso de la plataforma ayudará a mantener ese hilo metodológico.`}
          </Guion>

          <div className="mt-6 rounded-2xl border border-gray-100 p-6">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Reglas simples de uso</div>
            <ul className="space-y-2.5">
              {REGLAS_USO.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <svg className="mt-0.5 shrink-0 text-primary-700" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-2xl bg-dark-500 p-5 text-sm text-white/90">
            <span className="font-semibold text-primary-400">Mensaje clave:</span> &ldquo;Lo más importante seguirá siendo la calidad del vínculo y la conversación con su mentee. La plataforma existe para dar orden, continuidad y soporte a ese proceso.&rdquo;
          </div>
        </section>

        {/* ══ MOMENTO 6 ══ */}
        <section id="momento-6" className="mb-16 scroll-mt-24">
          <SectionLabel n={6} title="Preguntas frecuentes y soporte" />
          <div className="mb-6 flex flex-wrap gap-2">
            <DurationTag>7 minutos</DurationTag>
            <PersonTag>Peter</PersonTag>
            <PersonTag>Alfredo Olguín</PersonTag>
          </div>
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {FAQ.map((f, i) => (
              <div key={i} className="p-6">
                <div className="mb-1.5 font-bold text-gray-900">{f.q}</div>
                <div className="text-sm leading-relaxed text-gray-600">&ldquo;{f.a}&rdquo;</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ MOMENTO 7 ══ */}
        <section id="momento-7" className="mb-20 scroll-mt-24">
          <SectionLabel n={7} title="Cierre y próximos pasos" />
          <div className="mb-4 flex flex-wrap gap-2">
            <DurationTag>3 minutos</DurationTag>
            <PersonTag>Alfredo Olguín</PersonTag>
          </div>
          <Guion>
            {`Muchas gracias por participar en esta sesión de activación. Sabemos que incorporar una plataforma nueva puede requerir un pequeño ajuste inicial, pero la idea es que esta herramienta les facilite el proceso y nos ayude a acompañar mejor a cada dupla.

Como próximos pasos, les pedimos revisar su acceso, confirmar que sus datos estén correctos, explorar los recursos disponibles y estar atentos a la coordinación de sus primeras sesiones con mentees.

Desde Inspiratoria estaremos disponibles para acompañarlos en cualquier dificultad técnica o metodológica. Gracias nuevamente por su compromiso como mentores y mentoras de SQMentors 2026. Su rol es clave para que esta experiencia tenga impacto real en las y los jóvenes.`}
          </Guion>
        </section>

        {/* ── Checklist operativo ── */}
        <section id="checklist" className="mb-20 scroll-mt-24">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">Checklist operativo</h3>
          <h2 className="mb-8 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">Para Alfredo y Peter</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { title: "Antes de la sesión", items: CHECKLIST.antes, color: "bg-primary-500" },
              { title: "Durante la sesión", items: CHECKLIST.durante, color: "bg-dark-500" },
              { title: "Después de la sesión", items: CHECKLIST.despues, color: "bg-gray-400" },
            ].map((col) => (
              <div key={col.title} className="rounded-2xl border border-gray-100 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <h4 className="text-sm font-bold text-gray-900">{col.title}</h4>
                </div>
                <ul className="space-y-2.5">
                  {col.items.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[0.83rem] leading-snug text-gray-600">
                      <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-gray-300" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mensaje de seguimiento ── */}
        <section id="seguimiento" className="mb-6 scroll-mt-24">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">Mensaje breve de seguimiento posterior (sugerido)</h3>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-6 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs font-medium text-gray-400">Correo de seguimiento</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="mb-4 text-sm">
                <span className="text-gray-400">Asunto: </span>
                <span className="font-bold text-gray-900">Acceso y próximos pasos plataforma SQMentors</span>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                <p>Hola a todas y todos,</p>
                <p>Muchas gracias por participar en la sesión de activación de la plataforma SQMentors.</p>
                <p>
                  Les pedimos revisar su acceso, confirmar que sus datos estén correctos y explorar los
                  recursos disponibles para acompañar sus próximas sesiones de mentoría. Recuerden que
                  después de cada encuentro deberán registrar información general de la sesión, acuerdos y
                  próximos pasos, evitando incluir detalles confidenciales de la conversación.
                </p>
                <p>Ante cualquier dificultad de acceso o uso de la plataforma, pueden contactarnos para recibir apoyo.</p>
                <p>Muchas gracias nuevamente por su compromiso como mentores y mentoras.</p>
                <p className="font-semibold text-gray-900">Equipo Inspiratoria</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative mt-10 bg-[#3d1e6b] bg-cover bg-center px-5 py-14 text-center"
        style={{ backgroundImage: "url(/sqmentors/fondo1.jpeg)" }}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-4">
          <Image
            src="/home/inspiratoria_negro-negro-300x68.png"
            alt="Inspiratoria"
            width={160}
            height={36}
            className="h-8 w-auto brightness-0 invert opacity-90"
          />
          <p className="text-sm text-white/80">
            Guión operativo — Sesión de Activación Plataforma · Mentores SQMentors 2026
          </p>
          <p className="text-xs text-white/50">Uso interno · Equipo Inspiratoria</p>
        </div>
      </footer>
    </div>
  );
}
