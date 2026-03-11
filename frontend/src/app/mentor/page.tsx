"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { initialTemplates, getNextMonday, formatDateSpanish } from "../dashboard/programs/data";
import { ProgramTemplate, Module, SessionDetail } from "../dashboard/programs/types";

// ═══════════════════════════════════════════════════════════════════
// MENTOR DASHBOARD - Ultra Modern Minimal Design
// Clean, light, airy - inspired by Linear, Notion, Stripe
// ═══════════════════════════════════════════════════════════════════

interface Mentee {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  progress: number;
  influence: number;
  nextSession?: Date;
  goals: string[];
  sessionsCompleted: number;
  totalSessions: number;
}

// ═══════════════════════════════════════════════════════════════════
// MINIMAL ICONS
// ═══════════════════════════════════════════════════════════════════

const Icon = {
  Home: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  Users: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <circle cx="17" cy="7" r="3"/>
      <path d="M21 21v-2a3 3 0 00-3-3h-1"/>
    </svg>
  ),
  Calendar: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  Book: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  MessageCircle: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  ),
  Video: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="14" rx="2"/>
      <path d="M16 10l5-3v10l-5-3"/>
    </svg>
  ),
  Clock: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  TrendingUp: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
      <polyline points="17,6 23,6 23,12"/>
    </svg>
  ),
  ChevronRight: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  ChevronDown: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  Plus: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Play: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  ),
  X: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  Save: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
  ),
  Trash: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  Download: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Phone: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  Mail: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  FileText: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Sparkles: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z"/>
      <path d="M19 12l.5 1.5L21 14l-1.5.5L19 16l-.5-1.5L17 14l1.5-.5L19 12z"/>
    </svg>
  ),
  Settings: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  LogOut: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  MoreHorizontal: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="19" cy="12" r="1"/>
      <circle cx="5" cy="12" r="1"/>
    </svg>
  ),
  ArrowUpRight: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7"/>
      <polyline points="7,7 17,7 17,17"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

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

function formatTime(date: Date | undefined): string {
  if (!date) return '';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getRelativeDay(date: Date | undefined): string {
  if (!date) return '';
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana";
  return formatDateShort(date);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "program" | "mentees" | "messages">("dashboard");
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");
  const [selectedMentee, setSelectedMentee] = useState<number>(0);
  
  // Modal states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Expanded session row state
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  
  // Session prep state
  const [sessionNotes, setSessionNotes] = useState("");
  const [customAgenda, setCustomAgenda] = useState<string[]>([]);
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [sessionObjectives, setSessionObjectives] = useState("");
  const [savedPreps, setSavedPreps] = useState<{[key: string]: boolean}>({});
  
  const program = initialTemplates[0];
  const schedule = getModuleSchedule(program.modules);
  const programStartDate = schedule[0]?.startDate;

  const mentees: Mentee[] = [
    { id: 1, name: "Carlos Mendoza", role: "Team Lead", company: "StartupX", avatar: "https://randomuser.me/api/portraits/men/32.jpg", progress: 35, influence: 72, nextSession: new Date(Date.now() + 2 * 60 * 60 * 1000), goals: ["Comunicación", "Delegación"], sessionsCompleted: 4, totalSessions: 12 },
    { id: 2, name: "Ana Rodríguez", role: "Product Manager", company: "TechCorp", avatar: "https://randomuser.me/api/portraits/women/28.jpg", progress: 20, influence: 85, nextSession: new Date(Date.now() + 26 * 60 * 60 * 1000), goals: ["Liderazgo", "Remoto"], sessionsCompleted: 2, totalSessions: 12 },
    { id: 3, name: "Miguel Torres", role: "Engineering Lead", company: "DataFlow", avatar: "https://randomuser.me/api/portraits/men/45.jpg", progress: 45, influence: 65, nextSession: new Date(Date.now() + 50 * 60 * 60 * 1000), goals: ["Balance", "Talento"], sessionsCompleted: 5, totalSessions: 12 },
  ];

  const currentMentee = mentees[selectedMentee];

  const navItems = [
    { id: "dashboard", label: "Inicio", icon: Icon.Home },
    { id: "program", label: "Programa", icon: Icon.Book },
    { id: "mentees", label: "Mentees", icon: Icon.Users },
    { id: "messages", label: "Mensajes", icon: Icon.MessageCircle, badge: 3 },
  ];

  return (
    <div className="min-h-screen flex bg-white">
      {/* ═══════════════════════════════════════════════════════════════════
          SIDEBAR - Ultra Minimal
          ═══════════════════════════════════════════════════════════════════ */}
      <aside className="w-64 min-h-screen flex flex-col border-r border-gray-100">
        {/* Logo */}
        <div className="h-16 flex items-center px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Icon.Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Inspiratoria</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                    isActive 
                      ? "bg-gray-100 text-gray-900 font-medium" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded ${
                      isActive ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Program pill */}
          <div className="mt-8 px-1">
            <p className="px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Programa</p>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="font-medium text-sm text-gray-900 truncate">{program.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mentees.length} mentees</p>
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full" style={{ width: "33%" }} />
              </div>
            </div>
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">María García</p>
              <p className="text-xs text-gray-500">Mentor</p>
            </div>
            <Icon.Settings className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-screen overflow-auto bg-gray-50/50">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "program" && "Programa"}
              {activeTab === "mentees" && "Mentees"}
              {activeTab === "messages" && "Mensajes"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowVideoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Icon.Video className="w-4 h-4" />
              Nueva sesión
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* ═══════════════════════════════════════════════════════════════════
              DASHBOARD VIEW
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 max-w-6xl">
              {/* Welcome */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Hola, María 👋</h2>
                <p className="text-gray-500 mt-1">Tienes 3 sesiones esta semana</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Mentees", value: "3", sub: "activos" },
                  { label: "Sesiones", value: "12", sub: "este mes" },
                  { label: "Horas", value: "18.5", sub: "invertidas" },
                  { label: "Progreso", value: "33%", sub: "promedio" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{stat.label} <span className="text-gray-400">· {stat.sub}</span></p>
                  </div>
                ))}
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Sessions */}
                <div className="col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Próximas sesiones</h3>
                    <button className="text-sm text-gray-500 hover:text-gray-900">Ver todas</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {mentees.map((mentee, i) => (
                      <div key={mentee.id} className="transition-all">
                        {/* Clickable row */}
                        <button
                          onClick={() => setExpandedSession(expandedSession === i ? null : i)}
                          className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left"
                        >
                          <img src={mentee.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{mentee.name}</p>
                            <p className="text-xs text-gray-500">{mentee.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{mentee.nextSession && getRelativeDay(mentee.nextSession)}</p>
                            <p className="text-xs text-gray-500">{mentee.nextSession && formatTime(mentee.nextSession)}</p>
                          </div>
                          {expandedSession === i ? (
                            <Icon.ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Icon.ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        
                        {/* Expanded content */}
                        {expandedSession === i && (
                          <div className="px-5 pb-4 bg-gray-50/50 border-t border-gray-100">
                            <div className="pt-4 space-y-4">
                              {/* Session info */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Icon.Calendar className="w-4 h-4" />
                                  <span>{mentee.nextSession?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Icon.Clock className="w-4 h-4" />
                                  <span>{formatTime(mentee.nextSession)} - {formatTime(new Date((mentee.nextSession?.getTime() || 0) + 60 * 60 * 1000))}</span>
                                </div>
                              </div>
                              
                              {/* Goals */}
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Objetivos del mentee</p>
                                <div className="flex flex-wrap gap-2">
                                  {mentee.goals.map((goal, j) => (
                                    <span key={j} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{goal}</span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Progress */}
                              <div>
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                  <span className="text-gray-500">Progreso del programa</span>
                                  <span className="font-medium text-gray-900">{mentee.sessionsCompleted}/{mentee.totalSessions} sesiones</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${mentee.progress}%` }} />
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMentee(i);
                                    const session = schedule[0]?.module.sessions_detail?.[0];
                                    if (session) {
                                      setSelectedSession(session);
                                      setSelectedModuleId(schedule[0].module.id);
                                      setCustomAgenda([...session.agenda]);
                                      setShowSessionModal(true);
                                    }
                                  }}
                                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                                >
                                  Preparar sesión
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedMentee(i); setShowChatModal(true); }}
                                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <Icon.MessageCircle className="w-4 h-4" />
                                  Chat
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedMentee(i); setShowVideoModal(true); }}
                                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                  <Icon.Video className="w-4 h-4" />
                                  Video
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Influence */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-medium text-gray-900">Influencia</h3>
                    <span className="text-xs text-gray-400">En vivo</span>
                  </div>
                  
                  <div className="space-y-4">
                    {mentees.map((mentee) => (
                      <div key={mentee.id} className="flex items-center gap-3">
                        <img src={mentee.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{mentee.name.split(' ')[0]}</p>
                            <span className="text-sm font-semibold text-gray-900">{mentee.influence}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${mentee.influence}%`,
                                backgroundColor: mentee.influence >= 80 ? '#10b981' : mentee.influence >= 60 ? '#f59e0b' : '#6b7280'
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Promedio</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {(mentees.reduce((sum, m) => sum + m.influence, 0) / mentees.length).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentees overview */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Progreso de mentees</h3>
                  <button onClick={() => setActiveTab("mentees")} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    Ver todos <Icon.ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {mentees.map((mentee, i) => (
                    <button
                      key={mentee.id}
                      onClick={() => { setSelectedMentee(i); setActiveTab("mentees"); }}
                      className="p-5 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <img src={mentee.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{mentee.name}</p>
                          <p className="text-xs text-gray-500">{mentee.role}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progreso</span>
                            <span className="font-medium text-gray-900">{mentee.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${mentee.progress}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Sesiones</span>
                          <span className="text-gray-900">{mentee.sessionsCompleted}/{mentee.totalSessions}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              PROGRAM VIEW
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "program" && (
            <div className="max-w-5xl space-y-6">
              {/* Program header */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">Activo</span>
                    <h2 className="text-xl font-semibold text-gray-900 mt-2">{program.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{program.duration} · {program.modules.length} módulos</p>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{mentees.length}</p>
                      <p className="text-xs text-gray-500">Mentees</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">33%</p>
                      <p className="text-xs text-gray-500">Completado</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {/* Mentees sidebar */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">Mentees</p>
                  {mentees.map((mentee, index) => (
                    <button
                      key={mentee.id}
                      onClick={() => setSelectedMentee(index)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedMentee === index 
                          ? "bg-gray-900 text-white" 
                          : "bg-white border border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={mentee.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedMentee === index ? 'text-white' : 'text-gray-900'}`}>{mentee.name.split(' ')[0]}</p>
                          <p className={`text-xs truncate ${selectedMentee === index ? 'text-gray-300' : 'text-gray-500'}`}>{mentee.influence}% influencia</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Modules */}
                <div className="col-span-3 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">Módulos</p>
                  {schedule.map(({ module, startDate, endDate }, index) => (
                    <div
                      key={module.id}
                      className={`bg-white border rounded-xl overflow-hidden transition-all ${
                        expandedModule === module.id ? 'border-gray-200' : 'border-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{module.name}</h4>
                          <p className="text-xs text-gray-500">{formatDateShort(startDate)} - {formatDateShort(endDate)}</p>
                        </div>
                        {index === 0 && <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">Actual</span>}
                        {expandedModule === module.id ? <Icon.ChevronDown className="w-4 h-4 text-gray-400" /> : <Icon.ChevronRight className="w-4 h-4 text-gray-400" />}
                      </button>

                      {expandedModule === module.id && module.sessions_detail && (
                        <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-4">
                          {module.sessions_detail.map((session, i) => (
                            <div key={session.id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100/50 transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                                    savedPreps[`${module.id}-${session.id}`] ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-500'
                                  }`}>
                                    {savedPreps[`${module.id}-${session.id}`] ? <Icon.Check className="w-3 h-3" /> : i + 1}
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900 text-sm">{session.title}</h5>
                                    <p className="text-xs text-gray-500">Semana {session.week} · {session.duration} min</p>
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
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  {savedPreps[`${module.id}-${session.id}`] ? "Ver" : "Preparar"}
                                </button>
                              </div>
                              <div className="space-y-1.5 ml-9">
                                {session.agenda.slice(0, 2).map((item, j) => (
                                  <div key={j} className="flex items-start gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400 mt-0.5">•</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                                {session.agenda.length > 2 && (
                                  <p className="text-xs text-gray-400 ml-4">+{session.agenda.length - 2} más</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              MENTEES VIEW
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "mentees" && (
            <div className="max-w-5xl">
              <div className="grid grid-cols-3 gap-5">
                {mentees.map((mentee, i) => (
                  <div key={mentee.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-5">
                        <img src={mentee.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{mentee.name}</h3>
                          <p className="text-sm text-gray-500">{mentee.role}</p>
                          <p className="text-xs text-gray-400">{mentee.company}</p>
                        </div>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Icon.MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="text-center p-3 rounded-lg bg-gray-50">
                          <p className="text-lg font-semibold text-gray-900">{mentee.progress}%</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Progreso</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gray-50">
                          <p className="text-lg font-semibold text-gray-900">{mentee.sessionsCompleted}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Sesiones</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-gray-50">
                          <p className="text-lg font-semibold text-gray-900">{mentee.influence}%</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Influencia</p>
                        </div>
                      </div>

                      <div className="mb-5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Objetivos</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mentee.goals.map((goal, j) => (
                            <span key={j} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">{goal}</span>
                          ))}
                        </div>
                      </div>

                      {mentee.nextSession && (
                        <div className="p-3 rounded-lg bg-amber-50 mb-5">
                          <p className="text-[10px] text-amber-600 uppercase tracking-wide mb-0.5">Próxima sesión</p>
                          <p className="text-sm font-medium text-amber-800">{getRelativeDay(mentee.nextSession)}, {formatTime(mentee.nextSession)}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => { setSelectedMentee(i); setShowSessionModal(true); }} className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center">
                          <Icon.FileText className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => { setSelectedMentee(i); setShowChatModal(true); }} className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center">
                          <Icon.MessageCircle className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => { setSelectedMentee(i); setShowVideoModal(true); }} className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center">
                          <Icon.Video className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center">
                          <Icon.Download className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { setSelectedMentee(i); setShowVideoModal(true); }}
                      className="w-full py-3 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Iniciar sesión
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Icon.MessageCircle className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Centro de mensajes</h3>
                <p className="text-sm text-gray-500">Próximamente</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Session Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Preparar sesión</h3>
                <p className="text-sm text-gray-500">{selectedSession.title}</p>
              </div>
              <button onClick={() => setShowSessionModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Icon.X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Icon.Clock className="w-4 h-4" />{selectedSession.duration} min</span>
                <span className="flex items-center gap-1.5"><Icon.Calendar className="w-4 h-4" />Semana {selectedSession.week}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos</label>
                <textarea value={sessionObjectives} onChange={(e) => setSessionObjectives(e.target.value)} placeholder="¿Qué quieres lograr?" className="w-full p-3 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" rows={2} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Agenda</label>
                  <span className="text-xs text-gray-400">{customAgenda.length} items</span>
                </div>
                <div className="space-y-2 mb-3">
                  {customAgenda.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 group">
                      <span className="text-gray-400 text-sm">•</span>
                      <span className="flex-1 text-sm text-gray-700">{item}</span>
                      <button onClick={() => setCustomAgenda(customAgenda.filter((_, j) => j !== i))} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all">
                        <Icon.X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newAgendaItem} onChange={(e) => setNewAgendaItem(e.target.value)} placeholder="Agregar punto..." className="flex-1 p-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" onKeyDown={(e) => { if (e.key === "Enter" && newAgendaItem.trim()) { setCustomAgenda([...customAgenda, newAgendaItem.trim()]); setNewAgendaItem(""); } }} />
                  <button onClick={() => { if (newAgendaItem.trim()) { setCustomAgenda([...customAgenda, newAgendaItem.trim()]); setNewAgendaItem(""); } }} className="px-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                    <Icon.Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="Notas privadas..." className="w-full p-3 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900" rows={3} />
              </div>

              {selectedSession.homework && (
                <div className="p-3 rounded-lg bg-amber-50">
                  <p className="text-[10px] text-amber-600 uppercase tracking-wide mb-1">Tarea</p>
                  <p className="text-sm text-amber-800">{selectedSession.homework}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setShowSessionModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
              <div className="flex gap-2">
                <button onClick={() => { setShowSessionModal(false); setShowVideoModal(true); }} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Icon.Video className="w-4 h-4" />Iniciar
                </button>
                <button onClick={() => { if (selectedModuleId && selectedSession) { setSavedPreps(prev => ({ ...prev, [`${selectedModuleId}-${selectedSession.id}`]: true })); } setShowSessionModal(false); }} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <Icon.Save className="w-4 h-4" />Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={currentMentee.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{currentMentee.name}</p>
                  <p className="text-xs text-gray-500">En línea</p>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Icon.X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="h-64 p-4 bg-gray-50 flex items-center justify-center">
              <p className="text-sm text-gray-400">Sin mensajes</p>
            </div>
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input type="text" placeholder="Mensaje..." className="flex-1 p-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <button className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">Enviar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Nueva sesión</h3>
              <button onClick={() => setShowVideoModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Icon.X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="text-center mb-5">
                <img src={currentMentee.avatar} alt="" className="w-14 h-14 rounded-full mx-auto mb-3 object-cover" />
                <p className="font-medium text-gray-900">{currentMentee.name}</p>
                <p className="text-sm text-gray-500">{currentMentee.role}</p>
              </div>
              
              <div className="space-y-2 mb-5">
                {[
                  { name: "Google Meet", icon: "🎥" },
                  { name: "Zoom", icon: "💬" },
                  { name: "Link personalizado", icon: "🔗" },
                ].map((opt, i) => (
                  <button key={i} className="w-full p-3 rounded-lg border border-gray-200 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{opt.name}</span>
                  </button>
                ))}
              </div>
              
              <button onClick={() => { alert(`Sesión con ${currentMentee.name}`); setShowVideoModal(false); }} className="w-full py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Icon.Play className="w-4 h-4" />
                Iniciar ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
