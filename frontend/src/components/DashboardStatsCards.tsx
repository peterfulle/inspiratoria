"use client";

import React, { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { backendUrl } from "@/lib/api";

// Modern SVG Icons
const IconProgram = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconHandshake = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
  </svg>
);

const IconTarget = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconTrending = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconCheckCircle = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconStar = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconFire = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const IconChart = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface DashboardStats {
  programs: {
    total: number;
    active: number;
    draft: number;
    paused: number;
    completed: number;
  };
  participants: {
    total: number;
    mentors: number;
    mentees: number;
  };
  matches: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    avg_score: number;
    recent_30_days: number;
  };
  goals: {
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
    recent_30_days: number;
  };
  sentiment: {
    average: number;
    total_ratings: number;
  };
  engagement: {
    participation_rate: number;
    completion_rate: number;
    goal_completion_rate: number;
  };
}

interface TimelineData {
  matches: Array<{ date: string; count: number }>;
  goals: Array<{ date: string; count: number }>;
}

interface DashboardStatsCardsProps {
  darkMode?: boolean;
}

// Skeleton Loader Component
const SkeletonCard: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => (
  <div
    className={`p-6 rounded-xl ${
      darkMode ? "bg-gray-800" : "bg-white"
    } shadow-lg animate-pulse`}
  >
    <div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-1/3 mb-4`}></div>
    <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-1/2 mb-2`}></div>
    <div className={`h-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-2/3`}></div>
  </div>
);

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1000,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

export default function DashboardStatsCards({ darkMode }: DashboardStatsCardsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsRes, timelineRes] = await Promise.all([
        fetch(`${backendUrl}/api/stats/dashboard`, { headers }),
        fetch(`${backendUrl}/api/stats/timeline?days=30`, { headers }),
      ]);

      if (!statsRes.ok || !timelineRes.ok) {
        throw new Error("Error al cargar estadísticas");
      }

      const statsData = await statsRes.json();
      const timelineData = await timelineRes.json();

      setStats(statsData);
      setTimeline(timelineData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} darkMode={darkMode} />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className={`p-6 rounded-xl ${
          darkMode ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"
        }`}
      >
        <p className="font-medium">⚠️ {error || "No se pudieron cargar las estadísticas"}</p>
      </div>
    );
  }

  // Chart configurations
  const timelineChartData = {
    labels: timeline?.matches.map((item) => new Date(item.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" })) || [],
    datasets: [
      {
        label: "Matches",
        data: timeline?.matches.map((item) => item.count) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Goals",
        data: timeline?.goals.map((item) => item.count) || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const programsDistributionData = {
    labels: ["Activos", "Borrador", "Pausados", "Completados"],
    datasets: [
      {
        data: [stats.programs.active, stats.programs.draft, stats.programs.paused, stats.programs.completed],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(156, 163, 175, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(16, 185, 129, 0.8)",
        ],
        borderColor: darkMode ? "rgba(31, 41, 55, 1)" : "rgba(255, 255, 255, 1)",
        borderWidth: 2,
      },
    ],
  };

  const matchesStatusData = {
    labels: ["Activos", "Completados", "Pendientes"],
    datasets: [
      {
        data: [stats.matches.active, stats.matches.completed, stats.matches.pending],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(251, 191, 36, 0.8)",
        ],
        borderColor: darkMode ? "rgba(31, 41, 55, 1)" : "rgba(255, 255, 255, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: darkMode ? "#e5e7eb" : "#374151",
        },
      },
    },
    scales: {
      y: {
        ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
        grid: { color: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" },
      },
      x: {
        ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
        grid: { color: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className={`${darkMode ? "bg-gray-800/50" : "bg-white"} rounded-2xl p-6 shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Panel de Control
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Vista general del rendimiento y actividad
            </p>
          </div>
          <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Actualizado hace un momento
          </div>
        </div>
      </div>

      {/* Modern Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Programs Card */}
        <div
          onClick={() => setExpandedCard(expandedCard === "programs" ? null : "programs")}
          className={`relative p-8 rounded-2xl cursor-pointer border-l-8 border-blue-500 ${
            darkMode ? "bg-gray-800/50" : "bg-white shadow-lg"
          } ${expandedCard === "programs" ? "ring-2 ring-blue-500 scale-105" : ""} hover:scale-105 transition-all duration-300`}
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-black uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                PROGRAMAS
              </span>
              <div className={`text-xl ${darkMode ? "text-gray-600" : "text-gray-400"} font-black`}>
                {expandedCard === "programs" ? "−" : "+"}
              </div>
            </div>
            <div className="text-6xl font-black text-blue-500 mb-2">
              <AnimatedCounter value={stats.programs.total} />
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
              <span className="text-green-500 font-bold">{stats.programs.active}</span> activos en plataforma
            </p>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "programs" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Activos</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {stats.programs.active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Borrador</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {stats.programs.draft}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Pausados</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                    {stats.programs.paused}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Completados</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {stats.programs.completed}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '#programs';
                }}
                className="w-full mt-3 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition"
              >
                Ver todos los programas →
              </button>
            </div>
          )}
        </div>

        {/* Participants Card */}
        <div
          onClick={() => setExpandedCard(expandedCard === "participants" ? null : "participants")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "participants" ? "ring-2 ring-green-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-green-500/10" : "bg-green-50"}`}>
                  <div className="text-green-500 w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Participantes
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={stats.participants.total} />
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                {stats.participants.mentors} mentores · {stats.participants.mentees} mentees
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "participants" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedCard === "participants" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>👨‍🏫 Mentores</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {stats.participants.mentors}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>👨‍🎓 Mentees</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {stats.participants.mentees}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Ratio</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    1:{stats.participants.mentors > 0 ? (stats.participants.mentees / stats.participants.mentors).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '#participants';
                }}
                className="w-full mt-3 px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition"
              >
                Ver participantes →
              </button>
            </div>
          )}
        </div>

        {/* Matches Card */}
        <div
          onClick={() => setExpandedCard(expandedCard === "matches" ? null : "matches")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "matches" ? "ring-2 ring-purple-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-purple-500/10" : "bg-purple-50"}`}>
                  <div className="text-purple-500 w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Matches
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={stats.matches.total} />
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                Score: <span className="text-purple-500 font-medium">{stats.matches.avg_score.toFixed(1)}</span>/10
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "matches" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "matches" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>⚡ Activos</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {stats.matches.active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>✓ Completados</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {stats.matches.completed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>⏳ Pendientes</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                    {stats.matches.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Score promedio</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                    {stats.matches.avg_score.toFixed(1)}/10
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '#matches';
                }}
                className="w-full mt-3 px-3 py-2 bg-purple-500 text-white text-xs font-medium rounded-lg hover:bg-purple-600 transition"
              >
                Ver todos los matches →
              </button>
            </div>
          )}
        </div>

        {/* Goals Card */}
        <div
          onClick={() => setExpandedCard(expandedCard === "goals" ? null : "goals")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "goals" ? "ring-2 ring-amber-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-amber-500/10" : "bg-amber-50"}`}>
                  <div className="text-amber-500 w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Objetivos
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={stats.goals.total} />
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                <span className="text-green-500 font-medium">{stats.goals.completed}</span> completados
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "goals" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "goals" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>✓ Completados</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {stats.goals.completed} ({stats.goals.total > 0 ? Math.round((stats.goals.completed / stats.goals.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>⚡ En progreso</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {stats.goals.in_progress}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>○ Sin iniciar</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {stats.goals.not_started}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '#goals';
                }}
                className="w-full mt-3 px-3 py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition"
              >
                Ver objetivos →
              </button>
            </div>
          )}
        </div>

        {/* Engagement Rate */}
        <div
          onClick={() => setExpandedCard(expandedCard === "engagement" ? null : "engagement")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "engagement" ? "ring-2 ring-teal-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-teal-500/10" : "bg-teal-50"}`}>
                  <div className="text-teal-500 w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Participación
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={Math.round(stats.engagement.participation_rate)} />%
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                Engagement activo
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "engagement" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "engagement" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Tasa participación</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-teal-400" : "text-teal-600"}`}>
                    {stats.engagement.participation_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Tasa completación</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {stats.engagement.completion_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Goals completados</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                    {stats.engagement.goal_completion_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className={`mt-3 p-2 rounded ${darkMode ? "bg-teal-500/10" : "bg-teal-50"}`}>
                <p className={`text-xs ${darkMode ? "text-teal-400" : "text-teal-600"}`}>
                  💡 {stats.matches.active} matches activos de {stats.participants.total} participantes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div
          onClick={() => setExpandedCard(expandedCard === "completion" ? null : "completion")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "completion" ? "ring-2 ring-emerald-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                  <div className="text-emerald-500 w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Completación
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={Math.round(stats.engagement.completion_rate)} />%
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                Matches finalizados
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "completion" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "completion" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>✓ Completados</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {stats.matches.completed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>⚡ Activos</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {stats.matches.active}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total matches</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {stats.matches.total}
                  </span>
                </div>
              </div>
              <div className={`mt-3 p-2 rounded ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                <p className={`text-xs ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                  🎯 {stats.matches.completed} de {stats.matches.total} matches completados exitosamente
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sentiment */}
        <div
          onClick={() => setExpandedCard(expandedCard === "sentiment" ? null : "sentiment")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "sentiment" ? "ring-2 ring-yellow-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-yellow-500/10" : "bg-yellow-50"}`}>
                  <div className="text-yellow-500 w-5 h-5">
                    <svg fill="currentColor" viewBox="0 0 24 24" stroke="none">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Satisfacción
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {stats.sentiment.average.toFixed(1)}/5
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                {stats.sentiment.total_ratings} valoraciones
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "sentiment" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "sentiment" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Promedio</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                    {stats.sentiment.average.toFixed(2)} / 5.00
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total valoraciones</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {stats.sentiment.total_ratings}
                  </span>
                </div>
                <div className={`mt-2 p-2 rounded ${darkMode ? "bg-yellow-500/10" : "bg-yellow-50"}`}>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(stats.sentiment.average)
                            ? "text-yellow-500"
                            : darkMode ? "text-gray-600" : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              {stats.sentiment.total_ratings === 0 && (
                <div className={`mt-3 p-2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    📊 Sin valoraciones aún. Los participantes podrán calificar su experiencia.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          onClick={() => setExpandedCard(expandedCard === "activity" ? null : "activity")}
          className={`relative p-5 rounded-xl cursor-pointer ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } ${expandedCard === "activity" ? "ring-2 ring-orange-500" : ""} shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-orange-500/10" : "bg-orange-50"}`}>
                  <div className="text-orange-500 w-5 h-5">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  </div>
                </div>
                <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Últimos 30 días
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                <AnimatedCounter value={stats.matches.recent_30_days + stats.goals.recent_30_days} />
              </p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                {stats.matches.recent_30_days} matches · {stats.goals.recent_30_days} goals
              </p>
            </div>
            <div className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedCard === "activity" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </div>
          </div>
          
          {/* Expanded Details */}
          {expandedCard === "activity" && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>🤝 Nuevos matches</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                    {stats.matches.recent_30_days}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>🎯 Nuevos goals</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                    {stats.goals.recent_30_days}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Actividad total</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                    {stats.matches.recent_30_days + stats.goals.recent_30_days} eventos
                  </span>
                </div>
              </div>
              <div className={`mt-3 p-2 rounded ${darkMode ? "bg-orange-500/10" : "bg-orange-50"}`}>
                <p className={`text-xs ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                  🔥 {stats.matches.recent_30_days > 0 || stats.goals.recent_30_days > 0 
                    ? "Alta actividad en el último mes" 
                    : "Sin actividad reciente - Anima a los participantes"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div
          className={`p-6 rounded-2xl ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Tendencia de Actividad
              </h3>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Últimos 30 días
              </p>
            </div>
            <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
              <div className="text-blue-500 w-5 h-5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div style={{ height: "280px" }}>
            <Line data={timelineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Programs Distribution */}
        <div
          className={`p-6 rounded-2xl ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Estado de Programas
              </h3>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Distribución actual
              </p>
            </div>
            <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
              <div className="text-blue-500 w-5 h-5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
          <div style={{ height: "280px" }}>
            <Doughnut data={programsDistributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: darkMode ? "#e5e7eb" : "#374151", padding: 15, font: { size: 11 } } } } }} />
          </div>
        </div>

        {/* Matches Status */}
        <div
          className={`p-6 rounded-2xl ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Estado de Matches
              </h3>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Distribución actual
              </p>
            </div>
            <div className={`p-2 rounded-lg ${darkMode ? "bg-purple-500/10" : "bg-purple-50"}`}>
              <div className="text-purple-500 w-5 h-5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
            </div>
          </div>
          <div style={{ height: "280px" }}>
            <Doughnut data={matchesStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: darkMode ? "#e5e7eb" : "#374151", padding: 15, font: { size: 11 } } } } }} />
          </div>
        </div>

        {/* Goals Progress Bar */}
        <div
          className={`p-6 rounded-2xl ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          } shadow-sm`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Progreso de Objetivos
              </h3>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Estado de cumplimiento
              </p>
            </div>
            <div className={`p-2 rounded-lg ${darkMode ? "bg-amber-500/10" : "bg-amber-50"}`}>
              <div className="text-amber-500 w-5 h-5">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Completados</span>
                <span className={`text-xs font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  {stats.goals.completed} · {Math.round((stats.goals.completed / stats.goals.total) * 100)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.goals.completed / stats.goals.total) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>En Progreso</span>
                <span className={`text-xs font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  {stats.goals.in_progress} · {Math.round((stats.goals.in_progress / stats.goals.total) * 100)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.goals.in_progress / stats.goals.total) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No Iniciados</span>
                <span className={`text-xs font-bold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {stats.goals.not_started} · {Math.round((stats.goals.not_started / stats.goals.total) * 100)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <div
                  className="h-full bg-gray-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.goals.not_started / stats.goals.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
