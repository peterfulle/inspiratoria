"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MyProgressSection from "../../components/MyProgressSection";

// Types
interface Mentor {
  id: number;
  full_name: string;
  headline: string;
  avatar?: string;
  skills: string[];
  rating: number;
  totalSessions: number;
  nextSession?: string;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: "not_started" | "in_progress" | "completed";
  dueDate: string;
  milestones: Milestone[];
}

interface Milestone {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string;
}

interface Session {
  id: number;
  date: string;
  time: string;
  duration: number;
  topic: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  mentorFeedback?: string;
}

interface Resource {
  id: number;
  title: string;
  type: "video" | "article" | "course" | "book";
  url: string;
  recommended_by: string;
  completed: boolean;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

// Icons
const IconGoal = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconCalendar = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconChat = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconBook = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconAI = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const IconVideo = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconStar = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconTrophy = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconBell = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconPlay = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export default function MenteeDashboard() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "sessions" | "resources" | "chat" | "ai">("overview");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // Demo data
  const [mentor] = useState<Mentor>({
    id: 1,
    full_name: "Ana Martínez",
    headline: "VP of Engineering @ TechCorp | 15+ años de experiencia",
    skills: ["Leadership", "Product Strategy", "Team Management", "Technical Architecture"],
    rating: 4.9,
    totalSessions: 24,
    nextSession: "2026-02-12",
  });

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      title: "Mejorar habilidades de liderazgo",
      description: "Desarrollar competencias para liderar equipos técnicos",
      progress: 65,
      status: "in_progress",
      dueDate: "2026-04-30",
      milestones: [
        { id: 1, title: "Leer 'The Manager's Path'", completed: true, dueDate: "2026-01-15" },
        { id: 2, title: "Liderar daily standups", completed: true, dueDate: "2026-02-01" },
        { id: 3, title: "Dar feedback 1:1 a 3 colegas", completed: false, dueDate: "2026-02-28" },
        { id: 4, title: "Presentar en all-hands", completed: false, dueDate: "2026-03-15" },
      ],
    },
    {
      id: 2,
      title: "Transición a Tech Lead",
      description: "Prepararse para el rol de Tech Lead en los próximos 6 meses",
      progress: 40,
      status: "in_progress",
      dueDate: "2026-06-30",
      milestones: [
        { id: 1, title: "Definir roadmap técnico", completed: true, dueDate: "2026-02-15" },
        { id: 2, title: "Mentorar a 2 juniors", completed: false, dueDate: "2026-03-30" },
        { id: 3, title: "Liderar proyecto end-to-end", completed: false, dueDate: "2026-05-15" },
      ],
    },
    {
      id: 3,
      title: "Mejorar comunicación ejecutiva",
      description: "Comunicar efectivamente con stakeholders de negocio",
      progress: 20,
      status: "in_progress",
      dueDate: "2026-05-30",
      milestones: [
        { id: 1, title: "Curso de presentaciones", completed: true, dueDate: "2026-02-01" },
        { id: 2, title: "Práctica con mentor", completed: false, dueDate: "2026-02-20" },
      ],
    },
  ]);

  const [sessions] = useState<Session[]>([
    { id: 1, date: "2026-02-12", time: "10:00", duration: 60, topic: "Revisión de progreso semanal", status: "scheduled" },
    { id: 2, date: "2026-02-08", time: "10:00", duration: 60, topic: "Estrategias de liderazgo", status: "completed", notes: "Excelente sesión. Revisamos técnicas de feedback constructivo.", mentorFeedback: "Carlos mostró gran progreso. Listo para el siguiente nivel." },
    { id: 3, date: "2026-02-01", time: "10:00", duration: 60, topic: "Definir objetivos Q1", status: "completed" },
  ]);

  const [resources] = useState<Resource[]>([
    { id: 1, title: "The Manager's Path", type: "book", url: "#", recommended_by: "Ana Martínez", completed: true },
    { id: 2, title: "System Design Interview", type: "course", url: "#", recommended_by: "Ana Martínez", completed: false },
    { id: 3, title: "How to Give Effective Feedback", type: "video", url: "#", recommended_by: "InspiraAI", completed: false },
    { id: 4, title: "Leading Without Authority", type: "article", url: "#", recommended_by: "Ana Martínez", completed: true },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "Ana Martínez", content: "Hola Carlos! ¿Cómo te fue con la presentación de ayer?", timestamp: "09:15", isMe: false },
    { id: 2, sender: "Tú", content: "¡Hola Ana! Muy bien, apliqué las técnicas que practicamos 🎉", timestamp: "09:20", isMe: true },
    { id: 3, sender: "Ana Martínez", content: "¡Excelente! Me alegra mucho. En nuestra próxima sesión revisemos los siguientes pasos", timestamp: "09:22", isMe: false },
  ]);

  const [achievements] = useState([
    { id: 1, title: "Primera Sesión", icon: "🎯", earned: true },
    { id: 2, title: "5 Objetivos Completados", icon: "⭐", earned: true },
    { id: 3, title: "Racha de 4 semanas", icon: "🔥", earned: true },
    { id: 4, title: "Mentor Estrella", icon: "🏆", earned: false },
  ]);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setDarkMode(theme === "dark");
  }, []);

  const toggleMilestone = (goalId: number, milestoneId: number) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(m => 
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = Math.round((completedCount / updatedMilestones.length) * 100);
        return { ...goal, milestones: updatedMilestones, progress };
      }
      return goal;
    }));
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    setMessages([...messages, {
      id: messages.length + 1,
      sender: "Tú",
      content: chatMessage,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    }]);
    setChatMessage("");
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video": return "🎥";
      case "book": return "📚";
      case "course": return "🎓";
      case "article": return "📄";
      default: return "📌";
    }
  };

  const overallProgress = Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? "border-gray-800 bg-dark-500" : "border-gray-200 bg-white"} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/images/logo.png" alt="Inspiratoria" width={140} height={36} />
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold">
              Portal Mentee
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className={`p-2 rounded-lg relative ${darkMode ? "hover:bg-dark-400" : "hover:bg-gray-100"}`}>
              <IconBell />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                CR
              </div>
              <div className="hidden md:block">
                <p className="font-semibold">Carlos Rodríguez</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Mentee</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={`border-b ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "overview", label: "🏠 Mi Progreso" },
              { id: "goals", label: "🎯 Objetivos" },
              { id: "sessions", label: "📅 Sesiones" },
              { id: "resources", label: "📚 Recursos" },
              { id: "chat", label: "💬 Chat" },
              { id: "ai", label: "🤖 InspiraAI" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-4 font-medium whitespace-nowrap transition border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-500"
                    : `border-transparent ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <MyProgressSection />
            {/* Welcome & Mentor Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Overview */}
              <div className={`lg:col-span-2 p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                <h2 className="text-xl font-bold mb-6">👋 ¡Hola Carlos!</h2>
                
                {/* Overall Progress */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Progreso General</span>
                    <span className="text-primary-500 font-bold">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-4 rounded-full bg-gradient-to-r from-primary-500 to-yellow-400 transition-all"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-300" : "bg-gray-50"}`}>
                    <p className="text-3xl font-bold text-primary-500">{goals.length}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Objetivos Activos</p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-300" : "bg-gray-50"}`}>
                    <p className="text-3xl font-bold text-green-500">{sessions.filter(s => s.status === "completed").length}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sesiones Completadas</p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-300" : "bg-gray-50"}`}>
                    <p className="text-3xl font-bold text-blue-500">{resources.filter(r => r.completed).length}/{resources.length}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Recursos Completados</p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-dark-300" : "bg-gray-50"}`}>
                    <p className="text-3xl font-bold text-purple-500">4</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Semanas de Racha 🔥</p>
                  </div>
                </div>
              </div>

              {/* Mentor Card */}
              <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                <h3 className="text-lg font-bold mb-4">Mi Mentor</h3>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-yellow-400 flex items-center justify-center text-black text-3xl font-bold mx-auto mb-3">
                    {mentor.full_name.charAt(0)}
                  </div>
                  <h4 className="font-bold text-lg">{mentor.full_name}</h4>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-3`}>{mentor.headline}</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.floor(mentor.rating) ? "text-yellow-500" : "text-gray-400"}>
                        <IconStar />
                      </span>
                    ))}
                    <span className="ml-1 text-sm">{mentor.rating}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab("chat")}
                      className="flex-1 px-3 py-2 rounded-lg bg-primary-500 text-black font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <IconChat /> Chat
                    </button>
                    <button 
                      onClick={() => setShowVideoCall(true)}
                      className={`px-3 py-2 rounded-lg border ${darkMode ? "border-gray-600" : "border-gray-300"}`}
                    >
                      <IconVideo />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Session & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next Session */}
              <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <IconCalendar /> Próxima Sesión
                </h3>
                {sessions.filter(s => s.status === "scheduled")[0] && (
                  <div className={`p-4 rounded-xl border-2 border-primary-500 bg-primary-500/10`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{sessions[0].topic}</p>
                        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>con {mentor.full_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-500">{sessions[0].date}</p>
                        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>{sessions[0].time}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowVideoCall(true)}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold flex items-center justify-center gap-2"
                      >
                        <IconVideo /> Unirse a la Sesión
                      </button>
                      <button className={`px-4 py-2 rounded-lg border ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                        Reagendar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <IconTrophy /> Logros
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`text-center p-3 rounded-xl transition ${
                        achievement.earned 
                          ? darkMode ? "bg-dark-300" : "bg-gray-50"
                          : "opacity-40"
                      }`}
                    >
                      <span className="text-3xl">{achievement.icon}</span>
                      <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{achievement.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Goals Summary */}
            <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <IconGoal /> Mis Objetivos
                </h3>
                <button 
                  onClick={() => setActiveTab("goals")}
                  className="text-primary-500 text-sm font-semibold hover:underline"
                >
                  Ver todos →
                </button>
              </div>
              <div className="space-y-4">
                {goals.slice(0, 2).map((goal) => (
                  <div key={goal.id} className={`p-4 rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold">{goal.title}</p>
                      <span className="text-primary-500 font-bold">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      📅 Meta: {goal.dueDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">🎯 Mis Objetivos</h2>
              <button className="px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold">
                + Nuevo Objetivo
              </button>
            </div>

            {goals.map((goal) => (
              <div key={goal.id} className={`p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{goal.title}</h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{goal.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary-500">{goal.progress}%</span>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>📅 {goal.dueDate}</p>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 mb-6">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-yellow-400"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>

                <h4 className="font-semibold mb-3">Milestones</h4>
                <div className="space-y-2">
                  {goal.milestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      onClick={() => toggleMilestone(goal.id, milestone.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                        darkMode ? "hover:bg-dark-300" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                        milestone.completed 
                          ? "bg-green-500 border-green-500 text-white" 
                          : darkMode ? "border-gray-600" : "border-gray-300"
                      }`}>
                        {milestone.completed && <IconCheck />}
                      </div>
                      <div className="flex-1">
                        <p className={milestone.completed ? "line-through text-gray-500" : ""}>{milestone.title}</p>
                      </div>
                      <span className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {milestone.dueDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">📅 Mis Sesiones</h2>
              <button className="px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold">
                Solicitar Sesión
              </button>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className={`p-6 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">{session.topic}</p>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        con {mentor.full_name} • {session.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-500">{session.date}</p>
                      <p className={darkMode ? "text-gray-400" : "text-gray-500"}>{session.time}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      session.status === "completed" 
                        ? "bg-green-500/20 text-green-500"
                        : session.status === "scheduled"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-red-500/20 text-red-500"
                    }`}>
                      {session.status === "completed" ? "✓ Completada" : session.status === "scheduled" ? "📅 Agendada" : "Cancelada"}
                    </span>

                    {session.status === "scheduled" && (
                      <button 
                        onClick={() => setShowVideoCall(true)}
                        className="px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold flex items-center gap-2"
                      >
                        <IconVideo /> Unirse
                      </button>
                    )}
                  </div>

                  {session.notes && (
                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-50"}`}>
                      <p className="font-semibold text-sm mb-1">📝 Notas de la sesión:</p>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{session.notes}</p>
                    </div>
                  )}

                  {session.mentorFeedback && (
                    <div className={`mt-3 p-4 rounded-lg border-l-4 border-primary-500 ${darkMode ? "bg-primary-500/10" : "bg-yellow-50"}`}>
                      <p className="font-semibold text-sm mb-1">💬 Feedback del Mentor:</p>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{session.mentorFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">📚 Recursos Recomendados</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <div key={resource.id} className={`p-6 rounded-xl border transition hover:border-primary-500 ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-2xl">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{resource.title}</h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Recomendado por {resource.recommended_by}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button className={`px-3 py-1 rounded text-sm font-semibold ${
                          resource.completed 
                            ? "bg-green-500/20 text-green-500"
                            : "bg-primary-500 text-black"
                        }`}>
                          {resource.completed ? "✓ Completado" : "Ver Recurso"}
                        </button>
                        {resource.type === "video" && (
                          <button className={`px-3 py-1 rounded border ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                            <IconPlay />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className={`rounded-xl border h-[600px] flex flex-col ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-yellow-400 flex items-center justify-center text-black font-bold">
                  {mentor.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{mentor.full_name}</p>
                  <p className="text-xs text-green-500">En línea</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVideoCall(true)}
                className="p-2 rounded-lg bg-primary-500 text-black"
              >
                <IconVideo />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    msg.isMe 
                      ? "bg-primary-500 text-black" 
                      : darkMode ? "bg-dark-300" : "bg-gray-100"
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.isMe ? "text-black/60" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className={`flex-1 px-4 py-3 rounded-xl border ${
                    darkMode 
                      ? "bg-dark-300 border-gray-700 text-white" 
                      : "bg-gray-50 border-gray-200"
                  }`}
                />
                <button 
                  onClick={sendMessage}
                  className="px-6 py-3 rounded-xl bg-primary-500 text-black font-semibold"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className={`p-8 rounded-xl border ${darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
                  🤖
                </div>
                <div>
                  <h2 className="text-2xl font-bold">InspiraAI - Tu Coach Virtual</h2>
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Potenciado por inteligencia artificial para acelerar tu desarrollo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button className={`p-4 rounded-xl border text-left transition hover:border-primary-500 ${darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"}`}>
                  <span className="text-2xl mb-2 block">🎯</span>
                  <p className="font-semibold">Revisar mis Objetivos</p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Análisis y sugerencias para tus metas</p>
                </button>
                <button className={`p-4 rounded-xl border text-left transition hover:border-primary-500 ${darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"}`}>
                  <span className="text-2xl mb-2 block">📚</span>
                  <p className="font-semibold">Recomendar Recursos</p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cursos y materiales personalizados</p>
                </button>
                <button className={`p-4 rounded-xl border text-left transition hover:border-primary-500 ${darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"}`}>
                  <span className="text-2xl mb-2 block">💪</span>
                  <p className="font-semibold">Plan de Acción</p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Próximos pasos concretos</p>
                </button>
              </div>

              {/* AI Chat */}
              <div className={`rounded-xl border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <h3 className="font-semibold">💬 Pregúntale a InspiraAI</h3>
                </div>
                <div className="h-64 p-4 overflow-y-auto">
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">🤖</div>
                    <div className={`flex-1 p-4 rounded-xl ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                      <p>¡Hola Carlos! 🎉 He analizado tu progreso y tengo algunas sugerencias:</p>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Vas muy bien con "Mejorar habilidades de liderazgo" (65%)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-yellow-500">⚡</span>
                          <span>Sugerencia: Programa tu milestone "Dar feedback 1:1" esta semana</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-blue-500">📚</span>
                          <span>Te recomiendo el video "How to Give Effective Feedback"</span>
                        </li>
                      </ul>
                      <p className="mt-3 text-sm">¿Te gustaría que profundice en alguno de estos puntos?</p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pregunta algo a InspiraAI..."
                      className={`flex-1 px-4 py-2 rounded-xl border ${
                        darkMode 
                          ? "bg-dark-300 border-gray-700 text-white" 
                          : "bg-gray-50 border-gray-200"
                      }`}
                    />
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                      Preguntar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Video Call Modal */}
      {showVideoCall && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="w-full max-w-5xl p-4">
            <div className={`rounded-xl overflow-hidden ${darkMode ? "bg-dark-400" : "bg-white"}`}>
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-yellow-400 flex items-center justify-center text-5xl mb-4 mx-auto">
                    A
                  </div>
                  <p className="text-white text-xl">Conectando con {mentor.full_name}...</p>
                  <p className="text-gray-400 mt-2">Preparando videollamada</p>
                </div>
                {/* Self video preview */}
                <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg bg-dark-300 border border-gray-600 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
              <div className={`p-4 flex items-center justify-center gap-4 ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                <button className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition">
                  🎤
                </button>
                <button className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition">
                  📷
                </button>
                <button className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition">
                  🖥️
                </button>
                <button 
                  onClick={() => setShowVideoCall(false)}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition"
                >
                  📞
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
