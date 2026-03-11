"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { initialTemplates, getNextMonday, formatDateSpanish } from "../../dashboard/programs/data";
import { ProgramTemplate, Module, SessionDetail } from "../../dashboard/programs/types";
import InfluenceBubbles, { InfluenceNode, InfluenceRing } from "../../../components/InfluenceBubbles";

// ═══════════════════════════════════════════════════════════════════
// MENTEE PROGRAM VIEW - New Leaders Program Starting Next Monday
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
  Play: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  ),
  Download: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Target: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Users: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
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
  Video: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="14" height="14" rx="2"/>
      <path d="M16 10l5-3v10l-5-3"/>
    </svg>
  ),
  X: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  MessageSquare: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  ExternalLink: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15,3 21,3 21,9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Send: ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22,2 15,22 11,13 2,9"/>
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

// Format date short
function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function MenteeProgramPage() {
  const [program] = useState<ProgramTemplate>(initialTemplates[0]); // New Leaders
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "resources">("overview");
  
  // Modal states
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  
  const schedule = getModuleSchedule(program.modules);
  const programStartDate = schedule[0]?.startDate;
  const programEndDate = schedule[schedule.length - 1]?.endDate;

  // Mock mentor data
  const mentor = {
    name: "María García",
    role: "VP of Engineering",
    company: "TechCorp",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    nextSession: schedule[0]?.startDate,
    influence: 88, // How much the mentor is influencing the mentee
  };

  // Mentee influence data (how the program is influencing the mentee)
  const menteeInfluenceData = {
    programInfluence: 75, // Overall program influence on mentee
    mentorInfluence: 88,  // Mentor's direct influence
    selfGrowth: 65,       // Mentee's own growth/engagement
  };

  // Influence nodes for visualization
  const influenceNodes: InfluenceNode[] = [
    {
      id: "mentor",
      name: mentor.name,
      role: "mentor" as const,
      avatar: mentor.avatar,
      influence: menteeInfluenceData.mentorInfluence,
      metrics: {
        sessionsCompleted: 0,
        engagement: 95,
      }
    },
    {
      id: "mentee-self",
      name: "Tú",
      role: "mentee" as const,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg", // Could be actual user avatar
      influence: menteeInfluenceData.selfGrowth,
      metrics: {
        goalsAchieved: 0,
        engagement: menteeInfluenceData.selfGrowth,
      }
    },
  ];

  // Generate and download PDF
  const handleDownload = async (fileName: string, fileType: string, moduleId: string) => {
    setDownloadingFile(fileName);
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create a simple PDF-like blob with content
    const content = generatePDFContent(fileName, moduleId);
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadingFile(null);
  };

  // Generate PDF content based on resource
  const generatePDFContent = (fileName: string, moduleId: string): string => {
    const moduleIndex = parseInt(moduleId.replace('m', '')) - 1;
    const module = program.modules[moduleIndex];
    
    return `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 24 Tf
50 700 Td
(${fileName}) Tj
0 -40 Td
/F1 12 Tf
(Programa: New Leaders - Liderazgo para Nuevos Managers) Tj
0 -25 Td
(Modulo: ${module?.name || 'Módulo del Programa'}) Tj
0 -40 Td
/F1 14 Tf
(Contenido del Documento) Tj
0 -25 Td
/F1 11 Tf
(Este es un documento de prueba generado por Inspiratoria.) Tj
0 -20 Td
(El contenido real estaria disponible en la version de produccion.) Tj
0 -40 Td
(Objetivos del modulo:) Tj
0 -20 Td
${module?.objectives.slice(0, 3).map((obj, i) => `(${i + 1}. ${obj.substring(0, 50)}...) Tj 0 -15 Td`).join('\n') || ''}
0 -30 Td
(Generado: ${new Date().toLocaleDateString('es-ES')}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000819 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
896
%%EOF
    `;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fafafa" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/mentee" 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon.ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: "#1a1a1a" }}>
                  {program.name}
                </h1>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Tu programa de mentoría
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                Activo
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Program Summary Card */}
        <div 
          className="rounded-2xl p-6 mb-8"
          style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm opacity-70 mb-1">Inicia el próximo lunes</p>
              <h2 className="text-2xl font-semibold mb-2">
                {programStartDate && formatDateSpanish(programStartDate)}
              </h2>
              <div className="flex items-center gap-4 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <Icon.Clock className="w-4 h-4" />
                  {program.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Icon.Book className="w-4 h-4" />
                  {program.modules.length} módulos
                </span>
                <span className="flex items-center gap-1">
                  <Icon.Calendar className="w-4 h-4" />
                  {program.modules.reduce((sum, m) => sum + m.sessions, 0)} sesiones
                </span>
              </div>
            </div>
            
            {/* Mentor Card with Influence Ring */}
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
              <div className="relative">
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {/* Influence Ring indicator */}
                <svg 
                  className="absolute -inset-1 w-14 h-14" 
                  viewBox="0 0 56 56"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill="none"
                    stroke="#FFD902"
                    strokeWidth="2"
                    strokeDasharray={`${menteeInfluenceData.mentorInfluence * 1.63} 163`}
                    strokeLinecap="round"
                    style={{ 
                      transition: "stroke-dasharray 1s ease-out",
                      filter: "drop-shadow(0 0 4px #FFD902)"
                    }}
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs opacity-70">Tu mentor</p>
                <p className="font-medium">{mentor.name}</p>
                <p className="text-sm opacity-80">{mentor.role}</p>
                <p className="text-xs mt-1" style={{ color: "#FFD902" }}>
                  {menteeInfluenceData.mentorInfluence}% influencia
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          {[
            { id: "overview", label: "Vista General", icon: Icon.Target },
            { id: "timeline", label: "Timeline", icon: Icon.Calendar },
            { id: "resources", label: "Recursos", icon: Icon.Book },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: activeTab === tab.id ? "#1a1a1a" : "transparent",
                color: activeTab === tab.id ? "#1a1a1a" : "#6b7280"
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Modules Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
                Módulos del Programa
              </h3>
              
              {schedule.map(({ module, startDate, endDate }, index) => (
                <div
                  key={module.id}
                  className="border rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: "#fff", borderColor: expandedModule === module.id ? "#1a1a1a" : "#e5e7eb" }}
                >
                  {/* Module Header */}
                  <button
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: index === 0 ? "#1a1a1a" : "#d1d5db" }}
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
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
                    <div className="border-t p-4 space-y-4" style={{ borderColor: "#e5e7eb" }}>
                      <p className="text-sm" style={{ color: "#6b7280" }}>
                        {module.description}
                      </p>

                      {/* Objectives */}
                      <div>
                        <h5 className="text-sm font-medium mb-2" style={{ color: "#1a1a1a" }}>
                          Objetivos
                        </h5>
                        <div className="space-y-1">
                          {module.objectives.slice(0, 4).map((obj, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "#4b5563" }}>
                              <Icon.Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sessions */}
                      {module.sessions_detail && module.sessions_detail.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2" style={{ color: "#1a1a1a" }}>
                            Sesiones
                          </h5>
                          <div className="space-y-2">
                            {module.sessions_detail.map((session, i) => {
                              const sessionDate = new Date(startDate);
                              sessionDate.setDate(sessionDate.getDate() + (session.week - schedule[0].module.sessions_detail![0].week) * 7);
                              
                              return (
                                <div 
                                  key={session.id}
                                  className="flex items-center gap-3 p-3 rounded-lg"
                                  style={{ backgroundColor: "#f9fafb" }}
                                >
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                                    style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
                                  >
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                                      {session.title}
                                    </p>
                                    <p className="text-xs" style={{ color: "#6b7280" }}>
                                      Semana {session.week} • {session.duration} min
                                    </p>
                                  </div>
                                  {session.homework && (
                                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                                      Tarea
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-xs flex items-center gap-1" style={{ color: "#6b7280" }}>
                          <Icon.FileText className="w-3.5 h-3.5" />
                          {module.resources.length} recursos
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: "#6b7280" }}>
                          <Icon.Play className="w-3.5 h-3.5" />
                          {module.activities.length} actividades
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Next Session */}
              <div className="border rounded-xl p-4" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
                <h4 className="font-medium mb-3" style={{ color: "#1a1a1a" }}>
                  Próxima Sesión
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#f3f4f6" }}
                  >
                    <Icon.Calendar className="w-6 h-6" style={{ color: "#1a1a1a" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "#1a1a1a" }}>
                      {schedule[0]?.module.sessions_detail?.[0]?.title || "Sesión 1"}
                    </p>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      {programStartDate && formatDateShort(programStartDate)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const firstSession = schedule[0]?.module.sessions_detail?.[0];
                    if (firstSession) {
                      setSelectedSession(firstSession);
                      setShowAgendaModal(true);
                    }
                  }}
                  className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
                >
                  Ver Agenda
                </button>
              </div>

              {/* Milestones */}
              <div className="border rounded-xl p-4" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
                <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: "#1a1a1a" }}>
                  <Icon.Award className="w-4 h-4" />
                  Hitos del Programa
                </h4>
                <div className="space-y-3">
                  {program.milestones.slice(0, 4).map((milestone, i) => (
                    <div key={milestone.id} className="flex items-start gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                      >
                        <span className="text-xs">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                          {milestone.name}
                        </p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>
                          Semana {milestone.week}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border rounded-xl p-4" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
                <h4 className="font-medium mb-3" style={{ color: "#1a1a1a" }}>
                  Acciones Rápidas
                </h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <Icon.Users className="w-5 h-5" style={{ color: "#6b7280" }} />
                    <span className="text-sm" style={{ color: "#374151" }}>Contactar a mi mentor</span>
                  </button>
                  <button 
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <Icon.Calendar className="w-5 h-5" style={{ color: "#6b7280" }} />
                    <span className="text-sm" style={{ color: "#374151" }}>Agendar sesión</span>
                  </button>
                  <button 
                    onClick={() => setShowDownloadModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                  >
                    <Icon.Download className="w-5 h-5" style={{ color: "#6b7280" }} />
                    <span className="text-sm" style={{ color: "#374151" }}>Descargar materiales</span>
                  </button>
                </div>
              </div>

              {/* Influence Bubbles - Real-time Visualization */}
              <InfluenceBubbles
                nodes={influenceNodes}
                variant="mentee-view"
                centralLabel="PROGRAMA"
                onNodeClick={(node) => {
                  if (node.id === "mentor") {
                    setShowContactModal(true);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
                Timeline del Programa
              </h3>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {programStartDate && formatDateShort(programStartDate)} - {programEndDate && formatDateShort(programEndDate)}
              </p>
            </div>

            {/* Visual Timeline */}
            <div className="relative">
              {/* Timeline Line */}
              <div 
                className="absolute left-6 top-0 bottom-0 w-0.5"
                style={{ backgroundColor: "#e5e7eb" }}
              />

              <div className="space-y-6">
                {schedule.map(({ module, startDate, endDate }, index) => (
                  <div key={module.id} className="relative flex gap-6">
                    {/* Timeline Dot */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0"
                      style={{ 
                        backgroundColor: index === 0 ? "#1a1a1a" : "#fff",
                        border: index === 0 ? "none" : "2px solid #e5e7eb",
                        color: index === 0 ? "#fff" : "#6b7280"
                      }}
                    >
                      <span className="font-semibold">{index + 1}</span>
                    </div>

                    {/* Module Card */}
                    <div 
                      className="flex-1 border rounded-xl p-5"
                      style={{ 
                        backgroundColor: "#fff", 
                        borderColor: index === 0 ? "#1a1a1a" : "#e5e7eb",
                        boxShadow: index === 0 ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none"
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold" style={{ color: "#1a1a1a" }}>
                            {module.name}
                          </h4>
                          <p className="text-sm" style={{ color: "#6b7280" }}>
                            {formatDateShort(startDate)} - {formatDateShort(endDate)}
                          </p>
                        </div>
                        {index === 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                            Inicia pronto
                          </span>
                        )}
                      </div>

                      <p className="text-sm mb-4 line-clamp-2" style={{ color: "#6b7280" }}>
                        {module.description}
                      </p>

                      {/* Sessions Timeline */}
                      {module.sessions_detail && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {module.sessions_detail.map((session, i) => (
                            <div
                              key={session.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                              style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}
                            >
                              <span>S{i + 1}</span>
                              <span className="opacity-60">• Sem {session.week}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs" style={{ borderColor: "#f3f4f6", color: "#6b7280" }}>
                        <span>{module.resources.length} recursos</span>
                        <span>{module.activities.length} actividades</span>
                        <span>{module.sessions} sesiones</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Completion */}
                <div className="relative flex gap-6">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0"
                    style={{ backgroundColor: "#fff", border: "2px solid #10b981" }}
                  >
                    <Icon.Award className="w-6 h-6" style={{ color: "#10b981" }} />
                  </div>
                  <div className="flex-1 border-2 border-dashed rounded-xl p-5" style={{ borderColor: "#d1d5db" }}>
                    <h4 className="font-semibold" style={{ color: "#1a1a1a" }}>
                      🎉 Finalización del Programa
                    </h4>
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      {programEndDate && formatDateSpanish(programEndDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>
              Recursos del Programa
            </h3>

            {schedule.map(({ module }, index) => (
              <div key={module.id} className="border rounded-xl overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
                <div className="p-4 border-b flex items-center gap-3" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: "#1a1a1a" }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium" style={{ color: "#1a1a1a" }}>{module.name}</h4>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{module.resources.length} recursos</p>
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {module.resources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => handleDownload(resource.name, resource.type, module.id)}
                      disabled={downloadingFile === resource.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-gray-300 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: resource.type === "pdf" ? "#fef2f2" : resource.type === "video" ? "#eff6ff" : "#f0fdf4",
                        }}
                      >
                        {resource.type === "video" ? (
                          <Icon.Video className="w-5 h-5" style={{ color: "#2563eb" }} />
                        ) : (
                          <Icon.FileText className="w-5 h-5" style={{ color: resource.type === "pdf" ? "#dc2626" : "#16a34a" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>
                          {resource.name}
                        </p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>
                          {resource.type.toUpperCase()} {resource.size && `• ${resource.size}`}
                        </p>
                      </div>
                      {downloadingFile === resource.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Icon.Download className="w-4 h-4 flex-shrink-0" style={{ color: "#1a1a1a" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AGENDA MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showAgendaModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                    Agenda de la Sesión
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                    {selectedSession.title}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAgendaModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "#f9fafb" }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                  <Icon.Clock className="w-4 h-4" />
                  <span>{selectedSession.duration} min</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7280" }}>
                  <Icon.Calendar className="w-4 h-4" />
                  <span>Semana {selectedSession.week}</span>
                </div>
              </div>

              {/* Agenda Items */}
              <div>
                <h4 className="text-sm font-medium mb-3" style={{ color: "#1a1a1a" }}>
                  Temas a tratar
                </h4>
                <div className="space-y-2">
                  {selectedSession.agenda.map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "#f9fafb" }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                        style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-sm" style={{ color: "#374151" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Homework */}
              {selectedSession.homework && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#92400e" }}>
                    TAREA PARA DESPUÉS
                  </p>
                  <p className="text-sm" style={{ color: "#78350f" }}>
                    {selectedSession.homework}
                  </p>
                </div>
              )}

              {/* Tips */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#eff6ff" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "#1e40af" }}>
                  💡 TIP
                </p>
                <p className="text-sm" style={{ color: "#1e40af" }}>
                  Prepara preguntas específicas sobre los temas de la agenda para aprovechar al máximo tu sesión con tu mentor.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: "#e5e7eb" }}>
              <button
                onClick={() => setShowAgendaModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                style={{ color: "#6b7280" }}
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowAgendaModal(false);
                  setShowContactModal(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
              >
                <Icon.MessageSquare className="w-4 h-4" />
                Contactar Mentor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONTACT MENTOR MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-3">
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium" style={{ color: "#1a1a1a" }}>{mentor.name}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Tu mentor • {mentor.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
              </button>
            </div>

            {/* Messages area */}
            <div className="h-64 p-4 overflow-y-auto" style={{ backgroundColor: "#f9fafb" }}>
              {/* Welcome message from mentor */}
              <div className="flex gap-3 mb-4">
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div 
                  className="p-3 rounded-lg rounded-tl-none max-w-[80%]"
                  style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
                >
                  <p className="text-sm" style={{ color: "#374151" }}>
                    ¡Hola! Soy {mentor.name}, tu mentora en el programa New Leaders. Estoy aquí para ayudarte en tu desarrollo como líder. ¿En qué puedo apoyarte?
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Hace 2 días</p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="flex-1 p-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  style={{ borderColor: "#e5e7eb" }}
                />
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
                >
                  <Icon.Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCHEDULE SESSION MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                  Agendar Sesión
                </h3>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Mentor info */}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "#f9fafb" }}>
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>{mentor.name}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Tu mentor</p>
                </div>
              </div>

              {/* Next available slots */}
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: "#1a1a1a" }}>
                  Horarios disponibles esta semana
                </p>
                <div className="space-y-2">
                  {[
                    { day: "Lunes", date: "17 Feb", time: "10:00 - 11:00" },
                    { day: "Miércoles", date: "19 Feb", time: "14:00 - 15:00" },
                    { day: "Viernes", date: "21 Feb", time: "09:00 - 10:00" },
                  ].map((slot, i) => (
                    <button
                      key={i}
                      className="w-full p-3 rounded-lg border text-left hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>
                            {slot.day}, {slot.date}
                          </p>
                          <p className="text-xs" style={{ color: "#6b7280" }}>{slot.time}</p>
                        </div>
                        <Icon.Calendar className="w-4 h-4" style={{ color: "#6b7280" }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom request */}
              <div className="pt-3 border-t" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-xs mb-2" style={{ color: "#6b7280" }}>
                  ¿Ninguno te funciona?
                </p>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setShowContactModal(true);
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#1a1a1a" }}
                >
                  Solicitar otro horario →
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t" style={{ borderColor: "#e5e7eb" }}>
              <button
                onClick={() => {
                  alert("¡Sesión agendada! Tu mentor recibirá una notificación.");
                  setShowScheduleModal(false);
                }}
                className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
              >
                Confirmar Horario Seleccionado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DOWNLOAD ALL MATERIALS MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                  Descargar Materiales
                </h3>
                <button 
                  onClick={() => setShowDownloadModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon.X className="w-5 h-5" style={{ color: "#6b7280" }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {schedule.map(({ module }, index) => (
                <div key={module.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium"
                      style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
                    >
                      {index + 1}
                    </div>
                    <p className="font-medium text-sm" style={{ color: "#1a1a1a" }}>
                      {module.name}
                    </p>
                  </div>
                  <div className="space-y-1 ml-8">
                    {module.resources.slice(0, 3).map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => handleDownload(resource.name, resource.type, module.id)}
                        disabled={downloadingFile === resource.name}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <Icon.FileText className="w-4 h-4" style={{ color: resource.type === "pdf" ? "#dc2626" : "#16a34a" }} />
                        <span className="flex-1 text-sm truncate" style={{ color: "#374151" }}>
                          {resource.name}
                        </span>
                        {downloadingFile === resource.name ? (
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Icon.Download className="w-3 h-3" style={{ color: "#9ca3af" }} />
                        )}
                      </button>
                    ))}
                    {module.resources.length > 3 && (
                      <p className="text-xs pl-6" style={{ color: "#6b7280" }}>
                        +{module.resources.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t" style={{ borderColor: "#e5e7eb" }}>
              <button
                onClick={async () => {
                  // Download all PDFs
                  for (const { module } of schedule) {
                    for (const resource of module.resources.slice(0, 2)) {
                      await handleDownload(resource.name, resource.type, module.id);
                    }
                  }
                  setShowDownloadModal(false);
                }}
                className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1a1a1a", color: "#fff" }}
              >
                <Icon.Download className="w-4 h-4" />
                Descargar Todo ({program.modules.reduce((sum, m) => sum + m.resources.length, 0)} archivos)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
