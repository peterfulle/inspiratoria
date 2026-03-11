"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { initialTemplates, getNextMonday, formatDateSpanish } from "../../dashboard/programs/data";
import { ProgramTemplate, Module, SessionDetail } from "../../dashboard/programs/types";
import InfluenceBubbles, { InfluenceNode, InfluenceIndicator } from "../../../components/InfluenceBubbles";

// ═══════════════════════════════════════════════════════════════════
// MENTOR PROGRAM VIEW - New Leaders Program Starting Next Monday
// ═══════════════════════════════════════════════════════════════════

// Icons
const Icon = {
  ArrowLeft: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  Calendar: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  Clock: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  Check: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  Book: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  Users: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="17" cy="7" r="3"/>
      <path d="M21 21v-2a3 3 0 00-3-3h-1"/>
    </svg>
  ),
  Award: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  ChevronDown: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  ChevronRight: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  FileText: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Target: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  MessageSquare: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  Clipboard: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
    </svg>
  ),
  Video: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="14" height="14" rx="2"/>
      <path d="M16 10l5-3v10l-5-3"/>
    </svg>
  ),
  Star: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  X: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Edit: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Save: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
  ),
  Plus: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  Play: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  ),
  ExternalLink: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15,3 21,3 21,9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

// Helper to calculate module dates
function getModuleSchedule(modules: Module[]): { module: Module; startDate: Date; endDate: Date }[] {
  const schedule: { module: Module; startDate: Date; endDate: Date }[] = [];
  let currentDate = getNextMonday();

  modules.forEach((module) => {
    const startDate = new Date(currentDate);
    const weeks = parseInt(module.duration) || 4;
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + weeks * 7 - 1);
    
    schedule.push({ module, startDate, endDate });
    currentDate.setDate(currentDate.getDate() + weeks * 7);
  });

  return schedule;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function MentorProgramPage() {
  const [program] = useState<ProgramTemplate>(initialTemplates[0]);
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");
  const [selectedMentee, setSelectedMentee] = useState<number>(0);
  
  // Modal states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Session prep state
  const [sessionNotes, setSessionNotes] = useState("");
  const [customAgenda, setCustomAgenda] = useState<string[]>([]);
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [sessionObjectives, setSessionObjectives] = useState("");
  const [savedPreps, setSavedPreps] = useState<{[key: string]: boolean}>({});
  
  const schedule = getModuleSchedule(program.modules);
  const programStartDate = schedule[0]?.startDate;

  // Mock mentees assigned to this mentor in this program
  const mentees = [
    {
      id: 1,
      name: "Carlos Mendoza",
      role: "Team Lead",
      company: "StartupX",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      progress: 0,
      currentModule: 1,
      nextSession: schedule[0]?.startDate,
      goals: ["Mejorar comunicación con equipo", "Desarrollar habilidades de delegación"],
      influence: 72,
    },
    {
      id: 2,
      name: "Ana Rodríguez",
      role: "Product Manager",
      company: "TechCorp",
      avatar: "https://randomuser.me/api/portraits/women/28.jpg",
      progress: 0,
      currentModule: 1,
      nextSession: schedule[0]?.startDate,
      goals: ["Transición a rol de liderazgo", "Gestión de equipos remotos"],
      influence: 85,
    },
    {
      id: 3,
      name: "Miguel Torres",
      role: "Engineering Lead",
      company: "DataFlow",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      progress: 0,
      currentModule: 1,
      nextSession: schedule[0]?.startDate,
      goals: ["Balance técnico-gestión", "Desarrollo de talento"],
      influence: 65,
    },
  ];

  // Transform mentees to influence nodes
  const influenceNodes: InfluenceNode[] = mentees.map(mentee => ({
    id: `mentee-${mentee.id}`,
    name: mentee.name,
    role: "mentee" as const,
    avatar: mentee.avatar,
    influence: mentee.influence,
    metrics: {
      sessionsCompleted: 0,
      goalsAchieved: 0,
      engagement: mentee.influence,
    }
  }));

  const currentMentee = mentees[selectedMentee];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fafafa" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/mentor" 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon.ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
                  {program.name}
                </h1>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Vista del Mentor • {mentees.length} mentees asignados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
                Inicia {programStartDate && formatDateShort(programStartDate)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mentees Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold" style={{ color: "#1a1a1a" }}>
              Mis Mentees
            </h3>
            
            {mentees.map((mentee, index) => (
              <button
                key={mentee.id}
                onClick={() => setSelectedMentee(index)}
                className="w-full p-4 rounded-xl border text-left transition-all"
                style={{ 
                  backgroundColor: selectedMentee === index ? "#1a1a1a" : "#fff",
                  borderColor: selectedMentee === index ? "#1a1a1a" : "#e5e7eb",
                  color: selectedMentee === index ? "#fff" : "#1a1a1a"
                }}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={mentee.avatar} 
                    alt={mentee.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{mentee.name}</p>
                    <p className="text-sm opacity-70 truncate">{mentee.role}</p>
                  </div>
                </div>
                {/* Influence indicator */}
                <div className="mt-2">
                  <InfluenceIndicator influence={mentee.influence} trend="up" />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="opacity-70">Progreso</span>
                  <span className="font-medium">{mentee.progress}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: selectedMentee === index ? "rgba(255,255,255,0.2)" : "#e5e7eb" }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${mentee.progress}%`,
                      backgroundColor: selectedMentee === index ? "#fff" : "#1a1a1a"
                    }}
                  />
                </div>
              </button>
            ))}

            {/* Program Stats */}
            <div className="border rounded-xl p-4 mt-6" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
              <h4 className="font-medium mb-3" style={{ color: "#1a1a1a" }}>
                Resumen del Programa
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Duración</span>
                  <span className="font-medium" style={{ color: "#1a1a1a" }}>{program.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Módulos</span>
                  <span className="font-medium" style={{ color: "#1a1a1a" }}>{program.modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Sesiones totales</span>
                  <span className="font-medium" style={{ color: "#1a1a1a" }}>{program.modules.reduce((sum, m) => sum + m.sessions, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Frecuencia</span>
                  <span className="font-medium" style={{ color: "#1a1a1a" }}>{program.sessionRules.frequencyPerMonth}x/mes</span>
                </div>
              </div>
            </div>

            {/* Influence Bubbles - Real-time Visualization */}
            <div className="mt-6">
              <InfluenceBubbles
                nodes={influenceNodes}
                variant="mentor-view"
                centralLabel="TÚ"
                onNodeClick={(node) => {
                  const menteeIndex = mentees.findIndex(m => `mentee-${m.id}` === node.id);
                  if (menteeIndex !== -1) {
                    setSelectedMentee(menteeIndex);
                  }
                }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mentee Header Card */}
            <div 
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={currentMentee.avatar} 
                    alt={currentMentee.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{currentMentee.name}</h2>
                    <p className="opacity-80">{currentMentee.role} • {currentMentee.company}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm opacity-70">
                      <span className="flex items-center gap-1">
                        <Icon.Calendar className="w-4 h-4" />
                        Próxima sesión: {currentMentee.nextSession && formatDateShort(currentMentee.nextSession)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowChatModal(true)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Enviar mensaje"
                  >
                    <Icon.MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowVideoModal(true)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Iniciar videollamada"
                  >
                    <Icon.Video className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Goals */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm opacity-70 mb-2">Objetivos del mentee:</p>
                <div className="flex flex-wrap gap-2">
                  {currentMentee.goals.map((goal, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm bg-white/10">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Program Modules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
                  Plan de Sesiones
                </h3>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Inicia: {programStartDate && formatDateSpanish(programStartDate)}
                </p>
              </div>

              {schedule.map(({ module, startDate, endDate }, index) => (
                <div
                  key={module.id}
                  className="border rounded-xl overflow-hidden"
                  style={{ backgroundColor: "#fff", borderColor: expandedModule === module.id ? "#1a1a1a" : "#e5e7eb" }}
                >
                  {/* Module Header */}
                  <button
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold flex-shrink-0"
                      style={{ 
                        backgroundColor: index === 0 ? "#1a1a1a" : "#f3f4f6",
                        color: index === 0 ? "#fff" : "#6b7280"
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium" style={{ color: "#1a1a1a" }}>
                        {module.name}
                      </h4>
                      <p className="text-sm" style={{ color: "#6b7280" }}>
                        {formatDateShort(startDate)} - {formatDateShort(endDate)} • {module.sessions} sesiones
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                          Próximo
                        </span>
                      )}
                      {expandedModule === module.id ? (
                        <Icon.ChevronDown className="w-5 h-5" style={{ color: "#6b7280" }} />
                      ) : (
                        <Icon.ChevronRight className="w-5 h-5" style={{ color: "#6b7280" }} />
                      )}
                    </div>
                  </button>

                  {/* Module Details */}
                  {expandedModule === module.id && (
                    <div className="border-t p-4" style={{ borderColor: "#e5e7eb" }}>
                      {/* Sessions with agenda */}
                      {module.sessions_detail && module.sessions_detail.length > 0 && (
                        <div className="space-y-4">
                          {module.sessions_detail.map((session, i) => (
                            <div 
                              key={session.id}
                              className="border rounded-lg p-4"
                              style={{ borderColor: "#e5e7eb" }}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                                    style={{ backgroundColor: savedPreps[`${module.id}-${session.id}`] ? "#dcfce7" : "#f3f4f6", color: savedPreps[`${module.id}-${session.id}`] ? "#166534" : "#374151" }}
                                  >
                                    {savedPreps[`${module.id}-${session.id}`] ? <Icon.Check className="w-4 h-4" /> : i + 1}
                                  </div>
                                  <div>
                                    <h5 className="font-medium" style={{ color: "#1a1a1a" }}>
                                      {session.title}
                                    </h5>
                                    <p className="text-xs" style={{ color: "#6b7280" }}>
                                      Semana {session.week} • {session.duration} minutos
                                    </p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setSelectedModuleId(module.id);
                                    setCustomAgenda([...session.agenda]);
                                    setSessionNotes("");
                                    setSessionObjectives("");
                                    setShowSessionModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                                  style={{ 
                                    backgroundColor: savedPreps[`${module.id}-${session.id}`] ? "#1a1a1a" : "#f3f4f6", 
                                    color: savedPreps[`${module.id}-${session.id}`] ? "#fff" : "#374151" 
                                  }}
                                >
                                  {savedPreps[`${module.id}-${session.id}`] ? "Ver Preparación" : "Preparar Sesión"}
                                </button>
                              </div>

                              {/* Agenda */}
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-2" style={{ color: "#6b7280" }}>
                                  AGENDA SUGERIDA
                                </p>
                                <div className="space-y-1">
                                  {session.agenda.map((item, j) => (
                                    <div key={j} className="flex items-start gap-2 text-sm" style={{ color: "#4b5563" }}>
                                      <Icon.Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Homework */}
                              {session.homework && (
                                <div className="p-3 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                                  <p className="text-xs font-medium mb-1" style={{ color: "#92400e" }}>
                                    TAREA PARA EL MENTEE
                                  </p>
                                  <p className="text-sm" style={{ color: "#78350f" }}>
                                    {session.homework}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resources Preview */}
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                            Recursos del Módulo
                          </p>
                          <span className="text-xs" style={{ color: "#6b7280" }}>
                            {module.resources.length} disponibles
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {module.resources.slice(0, 4).map((res) => (
                            <span 
                              key={res.id}
                              className="px-2 py-1 rounded text-xs flex items-center gap-1"
                              style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}
                            >
                              <Icon.FileText className="w-3 h-3" />
                              {res.name.substring(0, 25)}...
                            </span>
                          ))}
                          {module.resources.length > 4 && (
                            <span className="text-xs" style={{ color: "#6b7280" }}>
                              +{module.resources.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div className="border rounded-xl p-6" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#1a1a1a" }}>
                <Icon.Award className="w-5 h-5" />
                Hitos y Entregables
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {program.milestones.map((milestone, i) => (
                  <div 
                    key={milestone.id}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                        Semana {milestone.week}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1" style={{ color: "#1a1a1a" }}>
                      {milestone.name}
                    </h4>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      {milestone.description}
                    </p>
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: "#f3f4f6" }}>
                      <p className="text-xs flex items-center gap-1" style={{ color: "#059669" }}>
                        <Icon.Clipboard className="w-3 h-3" />
                        {milestone.deliverable}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SESSION PREP MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                    Preparar Sesión
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                    {selectedSession.title} • {currentMentee.name}
                  </p>
                </div>
                <button 
                  onClick={() => setShowSessionModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Session Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                  <Icon.Clock className="w-4 h-4" />
                  <span>{selectedSession.duration} minutos</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                  <Icon.Calendar className="w-4 h-4" />
                  <span>Semana {selectedSession.week}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                  <Icon.Target className="w-4 h-4" />
                  <span>Sesión 1:1</span>
                </div>
              </div>

              {/* Objectives */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#1a1a1a" }}>
                  Objetivos de la sesión
                </label>
                <textarea
                  value={sessionObjectives}
                  onChange={(e) => setSessionObjectives(e.target.value)}
                  placeholder="¿Qué quieres lograr en esta sesión con tu mentee?"
                  className="w-full p-3 rounded-lg border resize-none text-sm"
                  style={{ borderColor: "#e5e7eb", minHeight: "80px" }}
                />
              </div>

              {/* Agenda */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                    Agenda personalizada
                  </label>
                  <span className="text-xs" style={{ color: "#6b7280" }}>
                    {customAgenda.length} items
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {customAgenda.map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg group"
                      style={{ backgroundColor: "#f9fafb" }}
                    >
                      <Icon.Check className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                      <span className="flex-1 text-sm" style={{ color: "#374151" }}>{item}</span>
                      <button
                        onClick={() => setCustomAgenda(customAgenda.filter((_, j) => j !== i))}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                      >
                        <Icon.Trash className="w-3 h-3" style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAgendaItem}
                    onChange={(e) => setNewAgendaItem(e.target.value)}
                    placeholder="Agregar punto a la agenda..."
                    className="flex-1 p-2 rounded-lg border text-sm"
                    style={{ borderColor: "#e5e7eb" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newAgendaItem.trim()) {
                        setCustomAgenda([...customAgenda, newAgendaItem.trim()]);
                        setNewAgendaItem("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newAgendaItem.trim()) {
                        setCustomAgenda([...customAgenda, newAgendaItem.trim()]);
                        setNewAgendaItem("");
                      }
                    }}
                    className="px-3 py-2 rounded-lg flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
                  >
                    <Icon.Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#1a1a1a" }}>
                  Notas privadas
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Notas que solo tú verás (puntos a recordar, contexto del mentee, etc.)"
                  className="w-full p-3 rounded-lg border resize-none text-sm"
                  style={{ borderColor: "#e5e7eb", minHeight: "100px" }}
                />
              </div>

              {/* Homework reminder */}
              {selectedSession.homework && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#92400e" }}>
                    TAREA A ASIGNAR
                  </p>
                  <p className="text-sm" style={{ color: "#78350f" }}>
                    {selectedSession.homework}
                  </p>
                </div>
              )}

              {/* Resources */}
              {selectedSession.resources && selectedSession.resources.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#1a1a1a" }}>
                    Recursos disponibles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.resources.map((res, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-200 transition-colors"
                        style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                      >
                        <Icon.FileText className="w-4 h-4" />
                        {res}
                        <Icon.ExternalLink className="w-3 h-3 opacity-50" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
              <button
                onClick={() => setShowSessionModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: "#6b7280" }}
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e5e7eb", color: "#374151" }}
                >
                  <Icon.Video className="w-4 h-4" />
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    if (selectedModuleId && selectedSession) {
                      setSavedPreps(prev => ({
                        ...prev,
                        [`${selectedModuleId}-${selectedSession.id}`]: true
                      }));
                    }
                    setShowSessionModal(false);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
                >
                  <Icon.Save className="w-4 h-4" />
                  Guardar Preparación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CHAT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-3">
                <img 
                  src={currentMentee.avatar} 
                  alt={currentMentee.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium" style={{ color: "#1a1a1a" }}>{currentMentee.name}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Mentee</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChatModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
              </button>
            </div>

            {/* Messages area */}
            <div className="h-64 p-4 overflow-y-auto" style={{ backgroundColor: "#f9fafb" }}>
              <div className="text-center py-8">
                <Icon.MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Inicia una conversación con {currentMentee.name}
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="flex-1 p-2 rounded-lg border text-sm"
                  style={{ borderColor: "#e5e7eb" }}
                />
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VIDEO CALL MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold" style={{ color: "#1a1a1a" }}>Iniciar Videollamada</h3>
              <button 
                onClick={() => setShowVideoModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#f3f4f6" }}
              >
                <Icon.Video className="w-10 h-10" style={{ color: "#6b7280" }} />
              </div>
              <h4 className="font-medium mb-2" style={{ color: "#1a1a1a" }}>
                Sesión con {currentMentee.name}
              </h4>
              <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
                Se creará un enlace de videollamada y se enviará una notificación a tu mentee.
              </p>
              
              {/* Options */}
              <div className="space-y-3 mb-6">
                <button
                  className="w-full p-3 rounded-lg border text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#dbeafe" }}>
                    <span className="text-lg">🎥</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>Google Meet</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>Crear sala de reunión</p>
                  </div>
                </button>
                <button
                  className="w-full p-3 rounded-lg border text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#e0e7ff" }}>
                    <span className="text-lg">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>Zoom</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>Usar mi sala personal</p>
                  </div>
                </button>
                <button
                  className="w-full p-3 rounded-lg border text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fef3c7" }}>
                    <span className="text-lg">🔗</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>Enlace personalizado</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>Usar tu propia plataforma</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end gap-3" style={{ borderColor: "#e5e7eb" }}>
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                style={{ color: "#6b7280" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert(`Videollamada iniciada con ${currentMentee.name}. En producción se integraría con Google Meet, Zoom u otra plataforma.`);
                  setShowVideoModal(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
              >
                <Icon.Play className="w-4 h-4" />
                Iniciar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
