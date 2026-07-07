import { ProgramTemplate, MentorRequirements, MenteeRequirements, MatchingRules, SessionRules } from "./types";

// ═══════════════════════════════════════════════════════════════════
// GEMINI API INTEGRATION
// ═══════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = "AIzaSyDhdNKyJgGNLVRC41VqE3EuCJZ4z0iGCCo";

export async function generateModuleContent(moduleName: string, moduleDescription: string): Promise<{
  objectives: string[];
  keyTopics: string[];
  exercises: string[];
  reflectionQuestions: string[];
}> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Eres un experto en programas de mentoría de liderazgo. Genera contenido para el módulo "${moduleName}" con descripción: "${moduleDescription}".

Responde SOLO en JSON válido con esta estructura exacta:
{
  "objectives": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "keyTopics": ["tema 1", "tema 2", "tema 3", "tema 4"],
  "exercises": ["ejercicio 1", "ejercicio 2"],
  "reflectionQuestions": ["pregunta 1", "pregunta 2", "pregunta 3"]
}

El contenido debe ser profesional, accionable y específico para desarrollo de líderes.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Gemini API error:", error);
  }
  return {
    objectives: ["Desarrollar competencias clave", "Aplicar técnicas efectivas", "Medir progreso"],
    keyTopics: ["Fundamentos", "Técnicas avanzadas", "Casos prácticos"],
    exercises: ["Ejercicio práctico grupal", "Análisis de caso"],
    reflectionQuestions: ["¿Qué aprendiste?", "¿Cómo lo aplicarás?"]
  };
}

export async function generateSessionPlan(sessionTitle: string, moduleName: string): Promise<{
  agenda: string[];
  discussion_points: string[];
  homework: string;
}> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Crea un plan de sesión de mentoría de 60 minutos para "${sessionTitle}" del módulo "${moduleName}".

Responde SOLO en JSON válido:
{
  "agenda": ["00-05 min: ...", "05-20 min: ...", "20-40 min: ...", "40-55 min: ...", "55-60 min: ..."],
  "discussion_points": ["punto 1", "punto 2", "punto 3"],
  "homework": "descripción de la tarea para antes de la próxima sesión"
}`
            }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
        })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini error:", error);
  }
  return {
    agenda: ["00-10 min: Check-in", "10-45 min: Tema principal", "45-60 min: Plan de acción"],
    discussion_points: ["Reflexión sobre el tema", "Aplicación práctica"],
    homework: "Aplicar lo aprendido en una situación real"
  };
}

// ═══════════════════════════════════════════════════════════════════
// DATE UTILITIES - Start on Next Monday
// ═══════════════════════════════════════════════════════════════════

export function getNextMonday(fromDate: Date = new Date()): Date {
  const d = new Date(fromDate);
  const dayOfWeek = d.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getModuleStartDates(moduleCount: number, weeksPerModule: number[]): Date[] {
  const dates: Date[] = [];
  let currentDate = getNextMonday();
  
  for (let i = 0; i < moduleCount; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + (weeksPerModule[i] || 4) * 7);
  }
  return dates;
}

export function formatDateSpanish(date: Date): string {
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

export const defaultMentorReqs: MentorRequirements = {
  maxMentees: 5,
  minExperienceYears: 3,
  requiredLevel: "senior",
  requireProfile: true,
  requireLinkedIn: false,
  requiredCertifications: [],
  requiredSkills: [],
};

export const defaultMenteeReqs: MenteeRequirements = {
  canSelectMentor: true,
  maxMentors: 1,
  requiredGoals: true,
  requireProfile: true,
  minTenure: 0,
  requiredDepartments: [],
};

export const defaultMatchingRules: MatchingRules = {
  algorithm: "hybrid",
  allowPreferences: true,
  weighSkills: 30,
  weighGoals: 40,
  weighDepartment: 15,
  weighSeniority: 15,
};

export const defaultSessionRules: SessionRules = {
  defaultDuration: 60,
  frequencyPerMonth: 2,
  allowReschedule: true,
  maxReschedules: 2,
  reminderDays: 2,
  requireAgenda: true,
  requireFeedback: true,
};

// ═══════════════════════════════════════════════════════════════════
// INITIAL TEMPLATES DATA
// ═══════════════════════════════════════════════════════════════════

export const initialTemplates: ProgramTemplate[] = [
  {
    id: "tpl-001",
    slug: "new-leaders",
    name: "New Leaders",
    description: "Programa integral de 6 meses para nuevos líderes que asumen roles de gestión por primera vez. Desarrolla habilidades de liderazgo, comunicación efectiva, gestión de equipos, coaching, toma de decisiones e inteligencia emocional. Incluye 19 sesiones de mentoría, recursos descargables, ejercicios prácticos y evaluaciones 360.",
    category: "leadership",
    duration: "6 meses",
    modules: [
      {
        id: "m1",
        name: "Fundamentos del Liderazgo",
        duration: "4 semanas",
        sessions: 4,
        description: "Conceptos fundamentales de liderazgo, autoconocimiento del líder, estilos de liderazgo y construcción de tu identidad como líder. Incluye assessment inicial 360° y definición de áreas de desarrollo prioritarias.",
        objectives: [
          "Identificar y comprender tu estilo natural de liderazgo",
          "Conocer los principales modelos y teorías de liderazgo (Situacional, Transformacional, Servant)",
          "Desarrollar autoconciencia sobre fortalezas y áreas de mejora",
          "Establecer tu visión personal de liderazgo",
          "Crear tu plan de desarrollo de liderazgo (PDL)",
        ],
        resources: [
          { id: "r1-1", name: "Guía Completa de Estilos de Liderazgo", type: "pdf", url: "/resources/new-leaders/m1/guia-estilos-liderazgo.pdf", size: "3.2 MB", description: "Análisis detallado de 12 estilos de liderazgo con ejemplos y aplicaciones prácticas" },
          { id: "r1-2", name: "Video: Liderazgo Situacional de Hersey-Blanchard", type: "video", url: "/resources/new-leaders/m1/video-liderazgo-situacional.mp4", size: "52 min", description: "Masterclass sobre adaptación del estilo según madurez del equipo" },
          { id: "r1-3", name: "Assessment DISC de Personalidad", type: "template", url: "/resources/new-leaders/m1/assessment-disc.pdf", description: "Evaluación de perfil conductual con interpretación para líderes" },
          { id: "r1-4", name: "Workbook: Mi Identidad como Líder", type: "pdf", url: "/resources/new-leaders/m1/workbook-identidad-lider.pdf", size: "1.8 MB", description: "Ejercicios de reflexión y autoconocimiento" },
          { id: "r1-5", name: "Template: Plan de Desarrollo de Liderazgo (PDL)", type: "template", url: "/resources/new-leaders/m1/template-pdl.xlsx", description: "Plantilla para definir objetivos y acciones de desarrollo" },
          { id: "r1-6", name: "Lectura: Los 7 Hábitos de la Gente Altamente Efectiva (Resumen)", type: "pdf", url: "/resources/new-leaders/m1/resumen-7-habitos.pdf", size: "2.1 MB" },
        ],
        activities: [
          { id: "a1-1", name: "Assessment de Liderazgo 360°", type: "assessment", duration: "45 min", description: "Evaluación completa de competencias de liderazgo con feedback de pares, reportes directos y supervisores. Incluye análisis de gaps y áreas prioritarias.", required: true },
          { id: "a1-2", name: "Reflexión: Mi Viaje de Líder", type: "reflection", duration: "30 min", description: "Journaling estructurado sobre experiencias formativas de liderazgo, modelos a seguir y momentos clave en tu desarrollo profesional." },
          { id: "a1-3", name: "Ejercicio: Definir Mi Visión de Liderazgo", type: "exercise", duration: "40 min", description: "Crear una declaración de visión personal que guíe tu estilo de liderazgo y valores." },
          { id: "a1-4", name: "Caso de Estudio: El Nuevo Director", type: "exercise", duration: "60 min", description: "Análisis de caso real sobre la transición de contribuidor individual a líder, con discusión de decisiones y consecuencias." },
        ],
        sessions_detail: [
          { id: "s1-1", title: "Bienvenida y Assessment Inicial", week: 1, duration: 60, agenda: ["Introducción al programa", "Expectativas y compromisos", "Assessment 360° inicial", "Reflexión sobre mi momento actual"], homework: "Completar assessment DISC y reflexión de viaje de líder" },
          { id: "s1-2", title: "Estilos de Liderazgo", week: 2, duration: 60, agenda: ["Review del DISC", "Modelo de Liderazgo Situacional", "Identificar mi estilo dominante", "Plan para flexibilizar estilos"], homework: "Observar y documentar 3 situaciones de liderazgo esta semana" },
          { id: "s1-3", title: "Autoconocimiento del Líder", week: 3, duration: 60, agenda: ["Feedback del 360°", "Análisis de fortalezas y gaps", "Creación de mi visión de liderazgo", "Definir 3 áreas prioritarias"], homework: "Entrevistar a 2 líderes admirados sobre su estilo" },
          { id: "s1-4", title: "Mi Plan de Desarrollo", week: 4, duration: 60, agenda: ["Consolidar aprendizajes del módulo", "Crear PDL con metas SMART", "Definir indicadores de éxito", "Compromisos para el siguiente módulo"], homework: "Completar PDL y compartir con mentor" },
        ],
      },
      {
        id: "m2",
        name: "Comunicación Efectiva para Líderes",
        duration: "3 semanas",
        sessions: 3,
        description: "Domina las técnicas de comunicación esenciales para líderes: escucha activa, comunicación asertiva, presentaciones de alto impacto, y adaptación del mensaje a diferentes audiencias. Incluye práctica de conversaciones difíciles y feedback.",
        objectives: [
          "Dominar técnicas de escucha activa y empática",
          "Estructurar mensajes claros, concisos y persuasivos",
          "Adaptar el estilo de comunicación según la audiencia y contexto",
          "Desarrollar presencia ejecutiva en presentaciones",
          "Manejar conversaciones difíciles con confianza",
        ],
        resources: [
          { id: "r2-1", name: "Framework SBAR para Comunicación", type: "template", url: "/resources/new-leaders/m2/framework-sbar.pdf", description: "Situación-Background-Assessment-Recommendation para comunicación estructurada" },
          { id: "r2-2", name: "Video: El Arte de la Escucha Activa", type: "video", url: "/resources/new-leaders/m2/video-escucha-activa.mp4", size: "38 min", description: "Técnicas de escucha activa con ejercicios prácticos" },
          { id: "r2-3", name: "Guía: Conversaciones Difíciles", type: "pdf", url: "/resources/new-leaders/m2/guia-conversaciones-dificiles.pdf", size: "2.8 MB", description: "Paso a paso para abordar conversaciones complicadas con empatía y claridad" },
          { id: "r2-4", name: "Template: Estructura de Presentación Ejecutiva", type: "template", url: "/resources/new-leaders/m2/template-presentacion.pptx", description: "Plantilla para presentaciones de alto impacto con tips de storytelling" },
          { id: "r2-5", name: "Checklist: Preparación para Reuniones", type: "template", url: "/resources/new-leaders/m2/checklist-reuniones.pdf", description: "Lista de verificación para maximizar efectividad de reuniones" },
        ],
        activities: [
          { id: "a2-1", name: "Role Play: Conversaciones Difíciles", type: "roleplay", duration: "50 min", description: "Práctica de 3 escenarios comunes: dar feedback negativo, comunicar decisiones impopulares, mediar conflictos.", required: true },
          { id: "a2-2", name: "Ejercicio: Elevator Pitch", type: "exercise", duration: "20 min", description: "Estructurar y practicar un mensaje clave en 60 segundos con técnicas de storytelling." },
          { id: "a2-3", name: "Práctica: Escucha Activa en Parejas", type: "exercise", duration: "30 min", description: "Ejercicio de escucha activa con feedback inmediato del compañero." },
          { id: "a2-4", name: "Análisis de Comunicación: Video Self-Review", type: "reflection", duration: "45 min", description: "Grabarse dando feedback y analizar lenguaje verbal y no verbal." },
        ],
        sessions_detail: [
          { id: "s2-1", title: "Escucha Activa y Empatía", week: 5, duration: 60, agenda: ["Técnicas de escucha activa", "Práctica en parejas", "Identificar barreras personales", "Plan de mejora"], homework: "Practicar escucha activa en 3 conversaciones y documentar" },
          { id: "s2-2", title: "Comunicación Asertiva", week: 6, duration: 60, agenda: ["Modelo de comunicación asertiva", "Role play conversaciones difíciles", "Feedback y coaching", "Herramientas para el día a día"], homework: "Preparar una conversación difícil pendiente con el framework SBAR" },
          { id: "s2-3", title: "Presencia y Presentaciones", week: 7, duration: 60, agenda: ["Elementos de presencia ejecutiva", "Estructura de presentaciones efectivas", "Práctica: Elevator pitch", "Feedback grupal"], homework: "Preparar mini-presentación de 5 minutos para el siguiente módulo" },
        ],
      },
      {
        id: "m3",
        name: "Gestión de Equipos de Alto Rendimiento",
        duration: "4 semanas",
        sessions: 4,
        description: "Construye y lidera equipos de alto rendimiento. Aprende a estructurar equipos efectivos, delegar con claridad, motivar y desarrollar talento, y gestionar la diversidad. Incluye herramientas para 1:1s y reuniones de equipo.",
        objectives: [
          "Comprender las etapas de desarrollo de equipos (Tuckman)",
          "Estructurar equipos con roles claros y complementarios",
          "Delegar efectivamente con el modelo RACI",
          "Diseñar y conducir reuniones de equipo productivas",
          "Identificar y desarrollar talento en el equipo",
          "Gestionar diversidad e inclusión",
        ],
        resources: [
          { id: "r3-1", name: "Matriz de Delegación RACI", type: "template", url: "/resources/new-leaders/m3/matriz-raci.xlsx", description: "Plantilla para asignar responsabilidades claras en proyectos" },
          { id: "r3-2", name: "Guía: Equipos de Alto Rendimiento", type: "pdf", url: "/resources/new-leaders/m3/guia-equipos-alto-rendimiento.pdf", size: "4.2 MB", description: "Características, construcción y mantenimiento de equipos excepcionales" },
          { id: "r3-3", name: "Template: Agenda de 1:1 Efectivo", type: "template", url: "/resources/new-leaders/m3/template-1on1.pdf", description: "Estructura para reuniones 1:1 productivas y de desarrollo" },
          { id: "r3-4", name: "Video: Las 5 Disfunciones de un Equipo", type: "video", url: "/resources/new-leaders/m3/video-5-disfunciones.mp4", size: "42 min", description: "Modelo de Patrick Lencioni para diagnosticar y mejorar equipos" },
          { id: "r3-5", name: "Assessment: Salud de Equipo", type: "template", url: "/resources/new-leaders/m3/assessment-salud-equipo.pdf", description: "Cuestionario para evaluar estado actual del equipo" },
          { id: "r3-6", name: "Guía: Onboarding de Nuevos Miembros", type: "pdf", url: "/resources/new-leaders/m3/guia-onboarding.pdf", size: "1.9 MB", description: "Checklist y mejores prácticas para integrar nuevos miembros" },
        ],
        activities: [
          { id: "a3-1", name: "Caso: Reestructuración de Equipo", type: "exercise", duration: "75 min", description: "Análisis de caso real sobre reorganización de equipo con problemas de rendimiento. Incluye diagnóstico, plan de acción y roleplay de conversaciones.", required: true },
          { id: "a3-2", name: "Ejercicio: Plan de Desarrollo Individual (PDI)", type: "exercise", duration: "50 min", description: "Crear un PDI completo para un miembro del equipo incluyendo competencias, acciones y métricas." },
          { id: "a3-3", name: "Simulación: Reunión de Equipo", type: "roleplay", duration: "45 min", description: "Conducir una reunión de equipo con diferentes personalidades y situaciones a manejar." },
          { id: "a3-4", name: "Assessment de Delegación Personal", type: "assessment", duration: "25 min", description: "Evaluar tu estilo de delegación actual e identificar áreas de mejora." },
        ],
        sessions_detail: [
          { id: "s3-1", title: "Construir Equipos Efectivos", week: 8, duration: 60, agenda: ["Modelo de Tuckman", "Diagnóstico de mi equipo actual", "Identificar gaps de roles", "Plan de acción"], homework: "Aplicar assessment de salud de equipo" },
          { id: "s3-2", title: "El Arte de Delegar", week: 9, duration: 60, agenda: ["Por qué no delegamos", "Modelo RACI", "Niveles de delegación", "Práctica con casos reales"], homework: "Identificar 3 tareas para delegar esta semana usando RACI" },
          { id: "s3-3", title: "1:1s y Desarrollo de Talento", week: 10, duration: 60, agenda: ["Estructura de 1:1 efectivo", "Identificar potencial y performance", "Crear PDI para un miembro", "Coaching en el momento"], homework: "Conducir 2 1:1s con la nueva estructura y documentar" },
          { id: "s3-4", title: "Reuniones de Equipo Productivas", week: 11, duration: 60, agenda: ["Tipos de reuniones y cuándo usarlas", "Diseño de agenda efectiva", "Facilitación y participación", "Seguimiento y accountability"], homework: "Rediseñar y facilitar una reunión de equipo" },
        ],
      },
      {
        id: "m4",
        name: "Feedback y Coaching para el Desarrollo",
        duration: "3 semanas",
        sessions: 3,
        description: "Desarrolla habilidades de coaching y feedback efectivo. Aprende el modelo GROW, técnicas de feedback SBI, y cómo crear una cultura de mejora continua en tu equipo.",
        objectives: [
          "Aplicar el modelo GROW de coaching en conversaciones de desarrollo",
          "Dar feedback constructivo usando el modelo SBI (Situación-Comportamiento-Impacto)",
          "Recibir feedback con apertura y aplicar mejoras",
          "Crear una cultura de feedback continuo en el equipo",
          "Distinguir entre coaching, mentoring y managing",
        ],
        resources: [
          { id: "r4-1", name: "Modelo GROW - Guía Práctica Completa", type: "pdf", url: "/resources/new-leaders/m4/modelo-grow-guia.pdf", size: "2.5 MB", description: "Goal, Reality, Options, Will - Paso a paso con ejemplos de preguntas" },
          { id: "r4-2", name: "Template: Sesión de Coaching GROW", type: "template", url: "/resources/new-leaders/m4/template-sesion-grow.pdf", description: "Plantilla para estructurar sesiones de coaching" },
          { id: "r4-3", name: "Framework SBI para Feedback", type: "pdf", url: "/resources/new-leaders/m4/framework-sbi.pdf", size: "1.2 MB", description: "Situation-Behavior-Impact con ejemplos positivos y constructivos" },
          { id: "r4-4", name: "Video: Coaching vs Telling", type: "video", url: "/resources/new-leaders/m4/video-coaching-vs-telling.mp4", size: "28 min", description: "Cuándo hacer coaching y cuándo dar dirección" },
          { id: "r4-5", name: "Checklist: Conversaciones de Feedback", type: "template", url: "/resources/new-leaders/m4/checklist-feedback.pdf", description: "Preparación y seguimiento de conversaciones de feedback" },
        ],
        activities: [
          { id: "a4-1", name: "Práctica: Sesión de Coaching GROW", type: "roleplay", duration: "55 min", description: "Sesión completa de coaching usando GROW con un compañero, incluyendo feedback del observador.", required: true },
          { id: "a4-2", name: "Ejercicio: Dar Feedback con SBI", type: "exercise", duration: "35 min", description: "Preparar y entregar feedback constructivo usando SBI para 3 escenarios diferentes." },
          { id: "a4-3", name: "Reflexión: Mi Historial de Feedback", type: "reflection", duration: "25 min", description: "Analizar feedback recibido en tu carrera y cómo impactó tu desarrollo." },
          { id: "a4-4", name: "Role Play: Feedback Difícil", type: "roleplay", duration: "40 min", description: "Practicar feedback sobre bajo rendimiento con empatía y claridad." },
        ],
        sessions_detail: [
          { id: "s4-1", title: "Fundamentos del Coaching", week: 12, duration: 60, agenda: ["Coaching vs mentoring vs managing", "Modelo GROW introducción", "Práctica de preguntas poderosas", "Aplicación en 1:1s"], homework: "Identificar 2 oportunidades de coaching esta semana" },
          { id: "s4-2", title: "Dar y Recibir Feedback", week: 13, duration: 60, agenda: ["Modelo SBI en detalle", "Práctica de feedback positivo y constructivo", "Recibir feedback con apertura", "Plan para cultura de feedback"], homework: "Dar feedback a 3 personas usando SBI y documentar" },
          { id: "s4-3", title: "Sesión Práctica de Coaching", week: 14, duration: 60, agenda: ["Role play GROW completo", "Feedback sobre técnicas", "Errores comunes y cómo evitarlos", "Plan de práctica continua"], homework: "Conducir sesión de coaching real con un miembro del equipo" },
        ],
      },
      {
        id: "m5",
        name: "Toma de Decisiones Estratégicas",
        duration: "3 semanas",
        sessions: 3,
        description: "Frameworks y herramientas para tomar decisiones efectivas bajo presión. Aprende a balancear velocidad y calidad, gestionar riesgo e incertidumbre, y comunicar decisiones con confianza.",
        objectives: [
          "Aplicar frameworks de decisión (RAPID, Eisenhower, pros/cons ponderados)",
          "Tomar decisiones efectivas bajo presión y con información incompleta",
          "Balancear velocidad de decisión con calidad del análisis",
          "Gestionar riesgo e incertidumbre de manera estructurada",
          "Comunicar decisiones difíciles al equipo con transparencia",
        ],
        resources: [
          { id: "r5-1", name: "Framework RAPID para Decisiones", type: "template", url: "/resources/new-leaders/m5/framework-rapid.pdf", description: "Recommend-Agree-Perform-Input-Decide para clarificar roles en decisiones" },
          { id: "r5-2", name: "Árbol de Decisiones - Template", type: "template", url: "/resources/new-leaders/m5/arbol-decisiones.xlsx", description: "Plantilla para visualizar opciones y consecuencias" },
          { id: "r5-3", name: "Guía: Decisiones Bajo Incertidumbre", type: "pdf", url: "/resources/new-leaders/m5/guia-decisiones-incertidumbre.pdf", size: "2.3 MB", description: "Técnicas para decidir cuando no tienes toda la información" },
          { id: "r5-4", name: "Video: Sesgos Cognitivos en Decisiones", type: "video", url: "/resources/new-leaders/m5/video-sesgos.mp4", size: "35 min", description: "Reconocer y mitigar sesgos que afectan nuestras decisiones" },
          { id: "r5-5", name: "Template: Análisis de Riesgos", type: "template", url: "/resources/new-leaders/m5/template-riesgos.xlsx", description: "Matriz de probabilidad e impacto para evaluar riesgos" },
        ],
        activities: [
          { id: "a5-1", name: "Simulación: Crisis Management", type: "exercise", duration: "90 min", description: "Toma de decisiones bajo presión de tiempo con información limitada. Incluye debrief sobre proceso y aprendizajes.", required: true },
          { id: "a5-2", name: "Ejercicio: Aplicar RAPID", type: "exercise", duration: "40 min", description: "Usar framework RAPID para estructurar una decisión pendiente en tu área." },
          { id: "a5-3", name: "Análisis: Decisión Pasada", type: "reflection", duration: "30 min", description: "Analizar una decisión importante que tomaste: qué hiciste bien y qué harías diferente." },
          { id: "a5-4", name: "Role Play: Comunicar Decisión Difícil", type: "roleplay", duration: "35 min", description: "Practicar comunicar una decisión impopular al equipo con empatía y claridad." },
        ],
        sessions_detail: [
          { id: "s5-1", title: "Frameworks de Decisión", week: 15, duration: 60, agenda: ["Tipos de decisiones", "Framework RAPID", "Matriz de Eisenhower", "Cuándo usar cada herramienta"], homework: "Aplicar RAPID a una decisión pendiente" },
          { id: "s5-2", title: "Decidir Bajo Presión", week: 16, duration: 60, agenda: ["Sesgos cognitivos", "Técnicas para información incompleta", "Simulación de crisis", "Debrief y aprendizajes"], homework: "Identificar un sesgo personal y plan para mitigarlo" },
          { id: "s5-3", title: "Comunicar Decisiones", week: 17, duration: 60, agenda: ["Estructurar comunicación de decisiones", "Role play decisión difícil", "Manejo de objeciones", "Seguimiento post-decisión"], homework: "Comunicar una decisión pendiente usando el framework aprendido" },
        ],
      },
      {
        id: "m6",
        name: "Inteligencia Emocional y Resiliencia",
        duration: "2 semanas",
        sessions: 2,
        description: "Desarrolla autoconciencia emocional, regulación del estrés y empatía activa. Construye resiliencia para liderar en tiempos de cambio e incertidumbre. Incluye evaluación final 360° y plan de desarrollo continuo.",
        objectives: [
          "Desarrollar autoconciencia emocional y reconocer triggers",
          "Aplicar técnicas de regulación emocional y manejo del estrés",
          "Practicar empatía activa en interacciones diarias",
          "Construir resiliencia personal y del equipo",
          "Crear plan de desarrollo de liderazgo continuo post-programa",
        ],
        resources: [
          { id: "r6-1", name: "Diario de Emociones - Template", type: "template", url: "/resources/new-leaders/m6/diario-emociones.pdf", description: "Plantilla para tracking diario de emociones y triggers" },
          { id: "r6-2", name: "Video: Mindfulness para Líderes", type: "video", url: "/resources/new-leaders/m6/video-mindfulness.mp4", size: "32 min", description: "Prácticas de mindfulness adaptadas a líderes ocupados" },
          { id: "r6-3", name: "Guía: Construir Resiliencia", type: "pdf", url: "/resources/new-leaders/m6/guia-resiliencia.pdf", size: "2.1 MB", description: "Técnicas y hábitos para desarrollar resiliencia personal" },
          { id: "r6-4", name: "Assessment EQ-i 2.0 (Guía)", type: "pdf", url: "/resources/new-leaders/m6/guia-eq-assessment.pdf", size: "1.5 MB", description: "Interpretación del assessment de inteligencia emocional" },
          { id: "r6-5", name: "Template: Plan de Desarrollo Continuo", type: "template", url: "/resources/new-leaders/m6/template-desarrollo-continuo.xlsx", description: "Plan para seguir desarrollándote después del programa" },
        ],
        activities: [
          { id: "a6-1", name: "Reflexión: Triggers Emocionales", type: "reflection", duration: "35 min", description: "Identificar patrones emocionales personales, situaciones que te desregulan y estrategias de manejo.", required: true },
          { id: "a6-2", name: "Práctica: Técnicas de Regulación", type: "exercise", duration: "25 min", description: "Practicar 3 técnicas de regulación emocional: respiración, reencuadre, y pausa estratégica." },
          { id: "a6-3", name: "Assessment 360° Final", type: "assessment", duration: "45 min", description: "Evaluación de cierre para medir progreso y definir siguientes pasos.", required: true },
          { id: "a6-4", name: "Crear Plan de Desarrollo Continuo", type: "exercise", duration: "40 min", description: "Definir metas, acciones y recursos para los próximos 12 meses de desarrollo." },
        ],
        sessions_detail: [
          { id: "s6-1", title: "Inteligencia Emocional", week: 18, duration: 60, agenda: ["Componentes de IE", "Identificar mis triggers", "Técnicas de regulación", "Empatía en acción"], homework: "Llevar diario de emociones por 1 semana" },
          { id: "s6-2", title: "Cierre y Siguiente Capítulo", week: 19, duration: 60, agenda: ["Review del 360° final vs inicial", "Celebrar logros y aprendizajes", "Plan de desarrollo continuo", "Despedida y compromisos"], homework: "Completar plan de desarrollo para próximos 12 meses" },
        ],
      },
    ],
    status: "published",
    mentorRequirements: { 
      maxMentees: 5, 
      minExperienceYears: 5, 
      requiredLevel: "senior", 
      requireProfile: true, 
      requireLinkedIn: true, 
      requiredCertifications: [], 
      requiredSkills: ["liderazgo", "gestión de equipos", "coaching"] 
    },
    menteeRequirements: { 
      canSelectMentor: true, 
      maxMentors: 1, 
      requiredGoals: true, 
      requireProfile: true, 
      minTenure: 6, 
      requiredDepartments: [] 
    },
    matchingRules: { 
      algorithm: "hybrid", 
      allowPreferences: true, 
      weighSkills: 25, 
      weighGoals: 40, 
      weighDepartment: 15, 
      weighSeniority: 20 
    },
    sessionRules: { 
      defaultDuration: 60, 
      frequencyPerMonth: 2, 
      allowReschedule: true, 
      maxReschedules: 2, 
      reminderDays: 2, 
      requireAgenda: true, 
      requireFeedback: true 
    },
    milestones: [
      { id: "ms1", name: "Assessment Inicial 360° Completado", week: 1, description: "Evaluación de competencias de liderazgo con feedback multi-fuente", deliverable: "Reporte de assessment con áreas prioritarias identificadas" },
      { id: "ms2", name: "Plan de Desarrollo Personal (PDL) Definido", week: 4, description: "PDL con 3 áreas de enfoque, metas SMART y acciones específicas", deliverable: "Documento PDL firmado por mentor y mentee" },
      { id: "ms3", name: "Primera Práctica de Feedback Documentada", week: 8, description: "Sesión real de feedback usando modelo SBI documentada", deliverable: "Reporte de la sesión con reflexiones" },
      { id: "ms4", name: "Sesión de Coaching GROW Completada", week: 14, description: "Sesión de coaching real con un miembro del equipo", deliverable: "Grabación o notas de la sesión" },
      { id: "ms5", name: "Proyecto de Mejora de Equipo", week: 17, description: "Implementación de una mejora concreta en el equipo", deliverable: "Presentación de resultados e impacto" },
      { id: "ms6", name: "Assessment Final 360° y Plan Continuo", week: 19, description: "Evaluación de cierre comparativa y plan de desarrollo post-programa", deliverable: "Reporte comparativo y plan de 12 meses" },
    ],
    tags: ["liderazgo", "nuevos managers", "soft skills", "gestión de equipos", "coaching", "feedback", "inteligencia emocional", "comunicación"],
    createdAt: "2024-01-15",
    updatedAt: new Date().toISOString().split('T')[0],
  },
  {
    id: "tpl-002",
    slug: "tech-leadership",
    name: "Tech Leadership",
    description: "Transición de roles técnicos a liderazgo tecnológico. Para developers senior que pasan a Tech Lead o Engineering Manager.",
    category: "tech",
    duration: "6 meses",
    modules: [
      {
        id: "m1",
        name: "De IC a Manager",
        duration: "3 semanas",
        sessions: 3,
        description: "La transición del contributor individual al liderazgo técnico",
        objectives: [
          "Entender el cambio de identidad profesional",
          "Dejar ir el código sin perder lo técnico",
          "Definir tu rol como líder técnico",
        ],
        resources: [
          { id: "r1", name: "Libro: The Manager's Path (resumen)", type: "pdf", url: "#", size: "1.2 MB" },
          { id: "r2", name: "Video: IC to Manager Journey", type: "video", url: "#", size: "40 min" },
        ],
        activities: [
          { id: "a1", name: "Reflexión: Mi valor como IC vs Manager", type: "reflection", duration: "25 min", description: "Journaling sobre la transición" },
        ],
      },
      {
        id: "m2",
        name: "Arquitectura y Decisiones Técnicas",
        duration: "4 semanas",
        sessions: 4,
        description: "Liderar decisiones de arquitectura y technical roadmap",
        objectives: [
          "Facilitar decisiones técnicas en equipo",
          "Documentar decisiones con ADRs",
          "Balancear deuda técnica y features",
        ],
        resources: [
          { id: "r3", name: "Template ADR (Architecture Decision Record)", type: "template", url: "#" },
          { id: "r4", name: "Framework: Technical Debt Quadrant", type: "pdf", url: "#", size: "0.8 MB" },
        ],
        activities: [
          { id: "a2", name: "Ejercicio: Facilitar RFC Review", type: "exercise", duration: "60 min", description: "Liderar revisión de propuesta técnica" },
        ],
      },
      {
        id: "m3",
        name: "Gestión de Equipos Tech",
        duration: "4 semanas",
        sessions: 4,
        description: "Recruiting, 1:1s, performance reviews y desarrollo de talento técnico",
        objectives: [
          "Conducir entrevistas técnicas efectivas",
          "Estructurar 1:1s de alto valor",
          "Calibrar y dar feedback técnico",
        ],
        resources: [
          { id: "r5", name: "Rúbrica de Entrevista Técnica", type: "template", url: "#" },
          { id: "r6", name: "Template: 1:1 para Engineering Managers", type: "template", url: "#" },
          { id: "r7", name: "Guía: Performance Reviews en Tech", type: "pdf", url: "#", size: "2.1 MB" },
        ],
        activities: [
          { id: "a3", name: "Role Play: Entrevista System Design", type: "roleplay", duration: "45 min", description: "Practicar conducción de entrevista" },
          { id: "a4", name: "Ejercicio: Escribir Performance Review", type: "exercise", duration: "40 min", description: "Documentar performance de un reporte" },
        ],
      },
      {
        id: "m4",
        name: "Tech Strategy",
        duration: "4 semanas",
        sessions: 4,
        description: "Visión tecnológica, roadmaps y alineación con negocio",
        objectives: [
          "Crear tech vision document",
          "Alinear roadmap técnico con OKRs",
          "Comunicar estrategia a stakeholders",
        ],
        resources: [
          { id: "r8", name: "Template: Tech Vision Document", type: "template", url: "#" },
          { id: "r9", name: "Video: Tech Strategy at Scale", type: "video", url: "#", size: "55 min" },
        ],
        activities: [
          { id: "a5", name: "Ejercicio: Pitch de Roadmap", type: "exercise", duration: "30 min", description: "Presentar roadmap a ejecutivos" },
        ],
      },
      {
        id: "m5",
        name: "Engineering Culture",
        duration: "2 semanas",
        sessions: 2,
        description: "Construir cultura de ingeniería, documentación y mejora continua",
        objectives: [
          "Definir engineering principles",
          "Implementar práticas de documentación",
          "Crear ciclos de retrospectiva",
        ],
        resources: [
          { id: "r10", name: "Ejemplos de Engineering Principles", type: "document", url: "#" },
          { id: "r11", name: "Template: Retrospectiva Técnica", type: "template", url: "#" },
        ],
        activities: [
          { id: "a6", name: "Taller: Definir Principles", type: "discussion", duration: "60 min", description: "Co-crear principles con el equipo" },
        ],
      },
    ],
    status: "published",
    mentorRequirements: { ...defaultMentorReqs, minExperienceYears: 5, requiredLevel: "staff", requiredSkills: ["engineering management", "system design"] },
    menteeRequirements: { ...defaultMenteeReqs },
    matchingRules: { ...defaultMatchingRules, algorithm: "auto_skills", weighSkills: 50 },
    sessionRules: { ...defaultSessionRules },
    milestones: [
      { id: "ms1", name: "Transición Documentada", week: 3, description: "Plan de transición IC a Manager", deliverable: "Documento de transición" },
      { id: "ms2", name: "Primer ADR Creado", week: 7, description: "Decisión técnica documentada", deliverable: "ADR publicado" },
      { id: "ms3", name: "Primer Ciclo de 1:1s", week: 12, description: "4 semanas de 1:1s consistentes", deliverable: "Notas de 1:1s" },
      { id: "ms4", name: "Tech Vision Draft", week: 20, description: "Borrador de visión técnica", deliverable: "Tech vision document" },
    ],
    tags: ["tech", "engineering management", "liderazgo técnico", "developers"],
    createdAt: "2024-03-10",
    updatedAt: "2025-01-08",
  },
  {
    id: "tpl-003",
    slug: "sales-excellence",
    name: "Sales Excellence",
    description: "Metodología de ventas consultivas B2B. Desde prospecting hasta cierre, incluyendo negociación y gestión de cuentas.",
    category: "sales",
    duration: "4 meses",
    modules: [
      {
        id: "m1",
        name: "Prospecting Estratégico",
        duration: "3 semanas",
        sessions: 3,
        description: "Identificar, calificar y priorizar oportunidades de negocio",
        objectives: [
          "Definir ICP (Ideal Customer Profile)",
          "Implementar cadencias de prospecting",
          "Calificar leads con BANT/MEDDIC",
        ],
        resources: [
          { id: "r1", name: "Template ICP", type: "template", url: "#" },
          { id: "r2", name: "Guía MEDDIC", type: "pdf", url: "#", size: "1.5 MB" },
          { id: "r3", name: "Ejemplos de Cadencias", type: "template", url: "#" },
        ],
        activities: [
          { id: "a1", name: "Ejercicio: Crear ICP", type: "exercise", duration: "45 min", description: "Definir perfil de cliente ideal" },
          { id: "a2", name: "Role Play: Cold Call", type: "roleplay", duration: "30 min", description: "Práctica de llamada en frío" },
        ],
      },
      {
        id: "m2",
        name: "Discovery",
        duration: "3 semanas",
        sessions: 3,
        description: "Entender profundamente las necesidades del cliente",
        objectives: [
          "Dominar preguntas de discovery",
          "Identificar pain points ocultos",
          "Mapear proceso de decisión",
        ],
        resources: [
          { id: "r4", name: "Banco de Preguntas Discovery", type: "template", url: "#" },
          { id: "r5", name: "Video: Discovery Call Masterclass", type: "video", url: "#", size: "50 min" },
        ],
        activities: [
          { id: "a3", name: "Role Play: Discovery Call", type: "roleplay", duration: "45 min", description: "Simular llamada de discovery" },
        ],
      },
      {
        id: "m3",
        name: "Negociación y Cierre",
        duration: "3 semanas",
        sessions: 3,
        description: "Técnicas de cierre, manejo de objeciones y negociación win-win",
        objectives: [
          "Manejar objeciones comunes",
          "Aplicar técnicas de cierre",
          "Negociar valor, no precio",
        ],
        resources: [
          { id: "r6", name: "Playbook de Objeciones", type: "pdf", url: "#", size: "2.2 MB" },
          { id: "r7", name: "Framework de Negociación", type: "template", url: "#" },
        ],
        activities: [
          { id: "a4", name: "Role Play: Manejo de Objeción", type: "roleplay", duration: "40 min", description: "Práctica de respuestas" },
          { id: "a5", name: "Simulación: Negociación", type: "exercise", duration: "60 min", description: "Negociación completa simulada" },
        ],
      },
      {
        id: "m4",
        name: "Account Management",
        duration: "3 semanas",
        sessions: 3,
        description: "Expandir y retener cuentas, upsell/cross-sell",
        objectives: [
          "Crear plan de cuenta",
          "Identificar oportunidades de expansión",
          "Gestionar QBRs efectivos",
        ],
        resources: [
          { id: "r8", name: "Template Account Plan", type: "template", url: "#" },
          { id: "r9", name: "Guía QBR", type: "pdf", url: "#", size: "1.1 MB" },
        ],
        activities: [
          { id: "a6", name: "Ejercicio: Account Plan", type: "exercise", duration: "50 min", description: "Crear plan para cuenta real" },
        ],
      },
    ],
    status: "published",
    mentorRequirements: { ...defaultMentorReqs, maxMentees: 4, requiredSkills: ["B2B sales", "negotiation"] },
    menteeRequirements: { ...defaultMenteeReqs, canSelectMentor: false },
    matchingRules: { ...defaultMatchingRules, algorithm: "auto_goals", weighGoals: 60 },
    sessionRules: { ...defaultSessionRules, frequencyPerMonth: 4 },
    milestones: [
      { id: "ms1", name: "ICP Definido", week: 2, description: "Perfil de cliente ideal documentado", deliverable: "Documento ICP" },
      { id: "ms2", name: "Primera Cadencia Activa", week: 4, description: "Cadencia en ejecución", deliverable: "Reporte de cadencia" },
      { id: "ms3", name: "Deal Cerrado", week: 12, description: "Aplicar metodología en deal real", deliverable: "Análisis post-mortem" },
    ],
    tags: ["ventas", "B2B", "negociación", "prospecting"],
    createdAt: "2024-02-20",
    updatedAt: "2025-01-05",
  },
  {
    id: "tpl-004",
    slug: "women-in-leadership",
    name: "Women in Leadership",
    description: "Programa para mujeres líderes. Navegación de barreras, negociación, visibilidad estratégica y network building.",
    category: "diversity",
    duration: "5 meses",
    modules: [
      {
        id: "m1",
        name: "Liderazgo Auténtico",
        duration: "3 semanas",
        sessions: 3,
        description: "Desarrollar tu estilo único de liderazgo",
        objectives: [
          "Identificar fortalezas únicas",
          "Superar síndrome del impostor",
          "Definir tu marca personal",
        ],
        resources: [
          { id: "r1", name: "Assessment de Fortalezas", type: "template", url: "#" },
          { id: "r2", name: "Video: Authentic Leadership", type: "video", url: "#", size: "35 min" },
        ],
        activities: [
          { id: "a1", name: "Reflexión: Mi Historia de Liderazgo", type: "reflection", duration: "30 min", description: "Journaling sobre trayectoria" },
        ],
      },
      {
        id: "m2",
        name: "Negociación y Self-Advocacy",
        duration: "3 semanas",
        sessions: 3,
        description: "Negociar efectivamente y abogar por ti misma",
        objectives: [
          "Negociar compensación con confianza",
          "Pedir recursos y oportunidades",
          "Establecer límites profesionales",
        ],
        resources: [
          { id: "r3", name: "Guía de Negociación Salarial", type: "pdf", url: "#", size: "1.8 MB" },
          { id: "r4", name: "Scripts de Negociación", type: "template", url: "#" },
        ],
        activities: [
          { id: "a2", name: "Role Play: Negociación Salarial", type: "roleplay", duration: "45 min", description: "Práctica de negociación" },
        ],
      },
      {
        id: "m3",
        name: "Executive Presence",
        duration: "3 semanas",
        sessions: 3,
        description: "Presencia ejecutiva y comunicación de alto impacto",
        objectives: [
          "Proyectar confianza y autoridad",
          "Comunicar en contextos ejecutivos",
          "Gestionar tu presencia en reuniones",
        ],
        resources: [
          { id: "r5", name: "Video: Executive Presence Masterclass", type: "video", url: "#", size: "45 min" },
          { id: "r6", name: "Checklist de Preparación Ejecutiva", type: "template", url: "#" },
        ],
        activities: [
          { id: "a3", name: "Ejercicio: Pitch to Executives", type: "exercise", duration: "40 min", description: "Presentación ejecutiva" },
        ],
      },
      {
        id: "m4",
        name: "Strategic Network",
        duration: "3 semanas",
        sessions: 3,
        description: "Construir red de sponsors y aliados estratégicos",
        objectives: [
          "Identificar sponsors potenciales",
          "Activar tu red estratégicamente",
          "Crear comunidad de soporte",
        ],
        resources: [
          { id: "r7", name: "Mapa de Network Estratégico", type: "template", url: "#" },
          { id: "r8", name: "Guía: De Mentor a Sponsor", type: "pdf", url: "#", size: "1.2 MB" },
        ],
        activities: [
          { id: "a4", name: "Ejercicio: Mapear Red Actual", type: "exercise", duration: "35 min", description: "Auditoría de network" },
          { id: "a5", name: "Plan: Activar 3 Sponsors", type: "exercise", duration: "40 min", description: "Estrategia de sponsorship" },
        ],
      },
    ],
    status: "published",
    mentorRequirements: { ...defaultMentorReqs, requireLinkedIn: true },
    menteeRequirements: { ...defaultMenteeReqs },
    matchingRules: { ...defaultMatchingRules },
    sessionRules: { ...defaultSessionRules },
    milestones: [
      { id: "ms1", name: "Personal Brand Definida", week: 3, description: "Marca personal clara", deliverable: "Statement de marca" },
      { id: "ms2", name: "Negociación Practicada", week: 8, description: "3 role plays completados", deliverable: "Feedback de práctica" },
      { id: "ms3", name: "Network Activado", week: 16, description: "3 sponsors identificados", deliverable: "Plan de activación" },
    ],
    tags: ["mujeres", "liderazgo", "diversidad", "executive presence"],
    createdAt: "2024-04-05",
    updatedAt: "2025-01-02",
  },
  {
    id: "tpl-005",
    slug: "operational-excellence",
    name: "Operational Excellence",
    description: "Optimización de procesos, gestión de proyectos y mejora continua. Metodologías Lean y Agile aplicadas.",
    category: "operations",
    duration: "4 meses",
    modules: [
      {
        id: "m1",
        name: "Process Mapping",
        duration: "3 semanas",
        sessions: 3,
        description: "Mapear y analizar procesos existentes",
        objectives: [
          "Crear mapas de proceso actuales",
          "Identificar cuellos de botella",
          "Medir eficiencia de procesos",
        ],
        resources: [
          { id: "r1", name: "Template SIPOC", type: "template", url: "#" },
          { id: "r2", name: "Guía de Value Stream Mapping", type: "pdf", url: "#", size: "2.5 MB" },
        ],
        activities: [
          { id: "a1", name: "Ejercicio: Mapear Proceso Core", type: "exercise", duration: "60 min", description: "VSM de proceso principal" },
        ],
      },
      {
        id: "m2",
        name: "Lean Fundamentals",
        duration: "3 semanas",
        sessions: 3,
        description: "Principios de mejora Lean y eliminación de desperdicios",
        objectives: [
          "Identificar 8 tipos de desperdicio",
          "Aplicar principios Lean",
          "Implementar mejoras rápidas",
        ],
        resources: [
          { id: "r3", name: "Poster: 8 Desperdicios", type: "pdf", url: "#", size: "0.5 MB" },
          { id: "r4", name: "Video: Lean Thinking", type: "video", url: "#", size: "40 min" },
        ],
        activities: [
          { id: "a2", name: "Gemba Walk", type: "exercise", duration: "45 min", description: "Observación en el lugar de trabajo" },
        ],
      },
      {
        id: "m3",
        name: "Project Management",
        duration: "4 semanas",
        sessions: 4,
        description: "Gestión efectiva de proyectos de mejora",
        objectives: [
          "Estructurar proyectos de mejora",
          "Gestionar stakeholders",
          "Comunicar progreso efectivamente",
        ],
        resources: [
          { id: "r5", name: "Template: Project Charter", type: "template", url: "#" },
          { id: "r6", name: "Template: Status Report", type: "template", url: "#" },
        ],
        activities: [
          { id: "a3", name: "Ejercicio: Crear Project Charter", type: "exercise", duration: "40 min", description: "Charter para proyecto real" },
        ],
      },
      {
        id: "m4",
        name: "Continuous Improvement",
        duration: "3 semanas",
        sessions: 3,
        description: "Cultura de mejora continua y sustentabilidad",
        objectives: [
          "Implementar ciclos PDCA",
          "Crear sistema de sugerencias",
          "Sostener mejoras en el tiempo",
        ],
        resources: [
          { id: "r7", name: "Template PDCA", type: "template", url: "#" },
          { id: "r8", name: "Guía: Kaizen Events", type: "pdf", url: "#", size: "1.9 MB" },
        ],
        activities: [
          { id: "a4", name: "Planear Kaizen Event", type: "exercise", duration: "50 min", description: "Diseñar evento de mejora" },
        ],
      },
    ],
    status: "published",
    mentorRequirements: { ...defaultMentorReqs },
    menteeRequirements: { ...defaultMenteeReqs },
    matchingRules: { ...defaultMatchingRules, algorithm: "manual" },
    sessionRules: { ...defaultSessionRules },
    milestones: [
      { id: "ms1", name: "VSM Completado", week: 3, description: "Mapa de valor actual", deliverable: "VSM documentado" },
      { id: "ms2", name: "Quick Win Implementado", week: 8, description: "Mejora rápida ejecutada", deliverable: "Reporte de mejora" },
      { id: "ms3", name: "Proyecto Completado", week: 16, description: "Proyecto de mejora cerrado", deliverable: "Presentación final" },
    ],
    tags: ["operaciones", "lean", "mejora continua", "procesos"],
    createdAt: "2024-05-12",
    updatedAt: "2024-12-20",
  },
  {
    id: "tpl-006",
    slug: "executive-coaching",
    name: "Executive Coaching",
    description: "Programa de alto nivel para C-Suite y directores. Coaching 1:1 intensivo con coaches ejecutivos certificados.",
    category: "leadership",
    duration: "12 meses",
    modules: [
      {
        id: "m1",
        name: "Leadership Assessment",
        duration: "2 semanas",
        sessions: 2,
        description: "Evaluación 360 inicial y diagnóstico de liderazgo",
        objectives: [
          "Completar assessment 360 ejecutivo",
          "Identificar áreas de desarrollo",
          "Definir objetivos de coaching",
        ],
        resources: [
          { id: "r1", name: "Assessment 360 Ejecutivo", type: "template", url: "#" },
          { id: "r2", name: "Guía de Interpretación", type: "pdf", url: "#", size: "1.8 MB" },
        ],
        activities: [
          { id: "a1", name: "Sesión de Debrief", type: "discussion", duration: "90 min", description: "Revisar resultados de 360" },
        ],
      },
      {
        id: "m2",
        name: "Strategic Vision",
        duration: "4 semanas",
        sessions: 4,
        description: "Clarificar y comunicar visión estratégica personal y organizacional",
        objectives: [
          "Definir visión personal de liderazgo",
          "Alinear con estrategia organizacional",
          "Crear narrativa de liderazgo",
        ],
        resources: [
          { id: "r3", name: "Framework: Personal Vision", type: "template", url: "#" },
          { id: "r4", name: "Video: Strategic Storytelling", type: "video", url: "#", size: "55 min" },
        ],
        activities: [
          { id: "a2", name: "Ejercicio: Vision Statement", type: "reflection", duration: "45 min", description: "Escribir statement personal" },
        ],
      },
      {
        id: "m3",
        name: "Board Dynamics",
        duration: "3 semanas",
        sessions: 3,
        description: "Navegación efectiva del board y stakeholders de alto nivel",
        objectives: [
          "Entender dinámica de boards",
          "Presentar efectivamente al board",
          "Gestionar relaciones con directores",
        ],
        resources: [
          { id: "r5", name: "Guía: Presenting to the Board", type: "pdf", url: "#", size: "2.3 MB" },
        ],
        activities: [
          { id: "a3", name: "Simulación: Board Presentation", type: "roleplay", duration: "60 min", description: "Práctica de presentación" },
        ],
      },
      {
        id: "m4",
        name: "Crisis Leadership",
        duration: "3 semanas",
        sessions: 3,
        description: "Liderazgo en momentos críticos y gestión de crisis",
        objectives: [
          "Frameworks de crisis management",
          "Comunicación en crisis",
          "Mantener equipo enfocado",
        ],
        resources: [
          { id: "r6", name: "Playbook de Crisis", type: "pdf", url: "#", size: "3.1 MB" },
          { id: "r7", name: "Template: Crisis Communication", type: "template", url: "#" },
        ],
        activities: [
          { id: "a4", name: "Simulación: Manejo de Crisis", type: "exercise", duration: "120 min", description: "Escenario de crisis real" },
        ],
      },
      {
        id: "m5",
        name: "Legacy Building",
        duration: "3 semanas",
        sessions: 3,
        description: "Construir legado duradero y plan de sucesión",
        objectives: [
          "Definir legado deseado",
          "Desarrollar sucesores",
          "Crear impacto sostenible",
        ],
        resources: [
          { id: "r8", name: "Framework: Leadership Legacy", type: "template", url: "#" },
          { id: "r9", name: "Guía: Succession Planning", type: "pdf", url: "#", size: "1.7 MB" },
        ],
        activities: [
          { id: "a5", name: "Reflexión: Mi Legado", type: "reflection", duration: "40 min", description: "Definir impacto deseado" },
        ],
      },
    ],
    status: "draft",
    mentorRequirements: { ...defaultMentorReqs, minExperienceYears: 10, maxMentees: 3, requiredCertifications: ["ICF PCC", "ICF MCC"] },
    menteeRequirements: { ...defaultMenteeReqs },
    matchingRules: { ...defaultMatchingRules, algorithm: "manual" },
    sessionRules: { ...defaultSessionRules, defaultDuration: 90, requireAgenda: true, requireFeedback: true },
    milestones: [
      { id: "ms1", name: "Assessment Completado", week: 2, description: "360 y entrevistas finalizadas", deliverable: "Reporte de assessment" },
      { id: "ms2", name: "Vision Definida", week: 8, description: "Vision statement creado", deliverable: "Documento de visión" },
      { id: "ms3", name: "Mid-point Review", week: 24, description: "Evaluación de medio término", deliverable: "Reporte de progreso" },
      { id: "ms4", name: "Legacy Plan", week: 44, description: "Plan de legado definido", deliverable: "Documento de legado" },
      { id: "ms5", name: "Final Assessment", week: 48, description: "360 de cierre", deliverable: "Reporte comparativo" },
    ],
    tags: ["ejecutivos", "C-suite", "coaching", "liderazgo senior"],
    createdAt: "2025-01-10",
    updatedAt: "2025-02-01",
  },
];

// ═══════════════════════════════════════════════════════════════════
// CATEGORÍAS DE PROGRAMA — catálogo completo (temáticas reales de Inspiratoria)
// ═══════════════════════════════════════════════════════════════════

export interface ProgramCategoryDef {
  key: string;
  label: string;
  bg: string;
  fg: string;
}

export const PROGRAM_CATEGORIES: ProgramCategoryDef[] = [
  { key: "leadership", label: "Liderazgo", bg: "#dbeafe", fg: "#2563eb" },
  { key: "women_empowerment", label: "Empoderamiento Femenino", bg: "#fdf4ff", fg: "#86198f" },
  { key: "diversity", label: "Diversidad e Inclusión", bg: "#fce7f3", fg: "#db2777" },
  { key: "employability", label: "Empleabilidad", bg: "#d1fae5", fg: "#059669" },
  { key: "mentoring", label: "Mentoría", bg: "#e0e7ff", fg: "#4f46e5" },
  { key: "coaching", label: "Coaching", bg: "#eff6ff", fg: "#1d4ed8" },
  { key: "entrepreneurship", label: "Emprendimiento", bg: "#ffedd5", fg: "#ea580c" },
  { key: "tech", label: "Tecnología", bg: "#f3e8ff", fg: "#7c3aed" },
  { key: "digital_skills", label: "Habilidades Digitales", bg: "#eef2ff", fg: "#4338ca" },
  { key: "sales", label: "Ventas", bg: "#fef3c7", fg: "#d97706" },
  { key: "operations", label: "Operaciones", bg: "#e0f2fe", fg: "#0369a1" },
  { key: "communication", label: "Comunicación", bg: "#cffafe", fg: "#0e7490" },
  { key: "public_speaking", label: "Oratoria y Comunicación Pública", bg: "#ffe4e6", fg: "#e11d48" },
  { key: "career_development", label: "Desarrollo de Carrera", bg: "#ecfccb", fg: "#4d7c0f" },
  { key: "networking", label: "Networking", bg: "#f5f3ff", fg: "#6d28d9" },
  { key: "finance", label: "Finanzas", bg: "#dcfce7", fg: "#15803d" },
  { key: "innovation", label: "Innovación", bg: "#fae8ff", fg: "#a21caf" },
  { key: "wellbeing", label: "Bienestar y Salud Mental", bg: "#f0fdfa", fg: "#0f766e" },
  { key: "work_life_balance", label: "Equilibrio Vida-Trabajo", bg: "#fef9c3", fg: "#a16207" },
  { key: "personal_branding", label: "Marca Personal", bg: "#fdf2f8", fg: "#9d174d" },
  { key: "negotiation", label: "Negociación", bg: "#f5f5f4", fg: "#57534e" },
  { key: "team_management", label: "Gestión de Equipos", bg: "#ecfeff", fg: "#155e75" },
  { key: "youth", label: "Desarrollo Juvenil", bg: "#fff7ed", fg: "#c2410c" },
  { key: "sustainability", label: "Sostenibilidad y ESG", bg: "#f0fdf4", fg: "#166534" },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const getCategoryLabel = (category: string): string => {
  const found = PROGRAM_CATEGORIES.find((c) => c.key === category);
  return found?.label || category;
};

export const getCategoryColor = (category: string): { bg: string; fg: string } => {
  const found = PROGRAM_CATEGORIES.find((c) => c.key === category);
  return found ? { bg: found.bg, fg: found.fg } : { bg: "#f4f4f5", fg: "#71717a" };
};

/**
 * Calcula una duración legible ("3 meses", "1 año 2 meses") a partir de un
 * rango de fechas. Usado para que el usuario elija fecha de inicio/término
 * en vez de escribir la duración a mano; el resultado se guarda en el mismo
 * campo `duration` (texto) que ya consume el resto de la plataforma.
 */
export const computeDurationFromDates = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return "";

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 1) {
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return `${days} día${days === 1 ? "" : "s"}`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} año${years === 1 ? "" : "s"}`);
  if (rem > 0) parts.push(`${rem} mes${rem === 1 ? "" : "es"}`);
  return parts.join(" ") || "1 mes";
};

export const getAlgorithmLabel = (algo: string): string => {
  const labels: Record<string, string> = {
    manual: "Manual",
    auto_skills: "Auto (Skills)",
    auto_goals: "Auto (Goals)",
    hybrid: "Híbrido",
  };
  return labels[algo] || algo;
};

export const getTotalSessions = (modules: { sessions: number }[]): number => {
  return modules.reduce((acc, m) => acc + m.sessions, 0);
};

export const getTotalResources = (modules: { resources: any[] }[]): number => {
  return modules.reduce((acc, m) => acc + (m.resources?.length || 0), 0);
};

export const getTotalActivities = (modules: { activities: any[] }[]): number => {
  return modules.reduce((acc, m) => acc + (m.activities?.length || 0), 0);
};

export const getResourceIcon = (type: string) => {
  const icons: Record<string, string> = {
    pdf: "Document",
    video: "Video",
    link: "Link",
    document: "File",
    template: "Folder",
  };
  return icons[type] || "File";
};

export const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    exercise: "Puzzle",
    reflection: "Lightbulb",
    roleplay: "Users",
    assessment: "Award",
    discussion: "Users",
  };
  return icons[type] || "Puzzle";
};

// ═══════════════════════════════════════════════════════════════════
// VERIFICACIÓN DE COMPLETITUD DE LA PLANTILLA (wizard paso a paso)
// ═══════════════════════════════════════════════════════════════════

export interface TemplateStepStatus {
  id: "general" | "modules" | "milestones" | "mentors" | "mentees" | "matching" | "sessions";
  label: string;
  required: boolean;
  complete: boolean;
  hint: string;
}

/**
 * Evalúa qué tan lista está una plantilla para producir un programa real.
 * "General" y "Módulos" son obligatorios: sin nombre/descripción no hay
 * identidad, y sin módulos el programa se crea en la BD pero con 0
 * actividades (se ve "vacío"). El resto tiene valores por defecto válidos,
 * así que se marca como recomendado, no bloqueante.
 */
export function getTemplateSteps(t: Partial<ProgramTemplate>): TemplateStepStatus[] {
  const modules = t.modules || [];
  const generalOk = !!(t.name?.trim() && t.description?.trim() && t.category && t.duration?.trim());
  const modulesOk = modules.length > 0 && modules.every((m) => (m.name || "").trim().length > 0);
  const milestonesOk = (t.milestones || []).length > 0;
  const mentorsOk = !!(t.mentorRequirements?.requiredSkills || []).length;
  const menteesOk = !!(t.menteeRequirements?.requiredDepartments || []).length || !!t.menteeRequirements?.requiredGoals;
  const matchingOk = !!t.matchingRules?.algorithm && t.matchingRules.algorithm !== "manual";
  const sessionsOk = !!(t.sessionRules?.frequencyPerMonth && t.sessionRules?.defaultDuration);

  return [
    { id: "general", label: "General", required: true, complete: generalOk, hint: "Nombre, descripción, categoría y duración" },
    { id: "modules", label: "Módulos", required: true, complete: modulesOk, hint: "Al menos un módulo con nombre — sin esto el programa no tendrá actividades" },
    { id: "milestones", label: "Hitos", required: false, complete: milestonesOk, hint: "Hitos de avance (opcional)" },
    { id: "mentors", label: "Mentores", required: false, complete: mentorsOk, hint: "Skills requeridas del mentor (opcional, usa valores por defecto)" },
    { id: "mentees", label: "Mentees", required: false, complete: menteesOk, hint: "Requisitos del mentee (opcional, usa valores por defecto)" },
    { id: "matching", label: "Matching", required: false, complete: matchingOk, hint: "Algoritmo de matching (opcional, usa valores por defecto)" },
    { id: "sessions", label: "Sesiones", required: false, complete: sessionsOk, hint: "Frecuencia y duración de sesiones (opcional, usa valores por defecto)" },
  ];
}

export function getTemplateCompleteness(t: Partial<ProgramTemplate>) {
  const steps = getTemplateSteps(t);
  const required = steps.filter((s) => s.required);
  const requiredComplete = required.every((s) => s.complete);
  const doneCount = steps.filter((s) => s.complete).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  return { steps, requiredComplete, percent };
}

// Estilos de estado para programas (instancias/asignaciones). Cada uno: label + colores del pill.
export const PROGRAM_STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  designed:            { label: "Diseñado",       color: "#7c3aed", bg: "#f5f3ff", dot: "#a78bfa" },
  ready_for_execution: { label: "Listo",          color: "#0369a1", bg: "#f0f9ff", dot: "#38bdf8" },
  in_execution:        { label: "En ejecución",   color: "#047857", bg: "#ecfdf5", dot: "#10b981" },
  under_review:        { label: "En revisión",    color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
  closed:              { label: "Cerrado",         color: "#475569", bg: "#f1f5f9", dot: "#94a3b8" },
  draft:               { label: "Borrador",        color: "#64748b", bg: "#f8fafc", dot: "#94a3b8" },
  active:              { label: "Activo",          color: "#047857", bg: "#ecfdf5", dot: "#10b981" },
  paused:              { label: "Pausado",         color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
  completed:           { label: "Completado",      color: "#4338ca", bg: "#eef2ff", dot: "#6366f1" },
};
export const programStatusMeta = (s: string) => PROGRAM_STATUS_META[s] || PROGRAM_STATUS_META.draft;
