"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient, Match, Program, Participant } from "@/lib/api";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import ExportButton from "@/components/ExportButton";

// Icons
const IconTrendingUp = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconChart = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconUsers = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconProgram = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconStar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconDownload = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const IconDocument = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconCheckCircle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type Props = {
  companyName: string;
  darkMode?: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
};

export default function ClientDashboard({ companyName, darkMode = false, activeView: controlledActiveView, onViewChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [internalActiveView, setInternalActiveView] = useState<"overview" | "programs" | "reports">("overview");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const router = useRouter();

  // Use controlled view if provided, otherwise use internal state
  const activeView = controlledActiveView || internalActiveView;
  const handleViewChange = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      setInternalActiveView(view as any);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [programsData, matchesData, participantsData] = await Promise.all([
        ApiClient.getPrograms(),
        ApiClient.getMatches(),
        ApiClient.getParticipants(),
      ]);

      setPrograms(programsData);
      setMatches(matchesData);
      setParticipants(participantsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Cargando dashboard ejecutivo...</p>
        </div>
      </div>
    );
  }

  const mentors = participants.filter((p) => p.role === "mentor");
  const mentees = participants.filter((p) => p.role === "mentee");
  const activeMatches = matches.filter((m) => m.status === "active");
  const completedMatches = matches.filter((m) => m.status === "completed");
  const avgScore = matches.length > 0
    ? (matches.reduce((sum, m) => sum + m.score, 0) / matches.length).toFixed(1)
    : "0";

  // Chart data
  const participantData = {
    labels: ["Mentores", "Mentees"],
    datasets: [
      {
        data: [mentors.length, mentees.length],
        backgroundColor: ["#FFD902", "#1a1a1a"],
        borderWidth: 2,
        borderColor: darkMode ? "#333" : "#fff",
      },
    ],
  };

  const matchStatusData = {
    labels: ["Activos", "Completados", "Pendientes"],
    datasets: [
      {
        data: [
          matches.filter((m) => m.status === "active").length,
          matches.filter((m) => m.status === "completed").length,
          matches.filter((m) => m.status === "pending").length,
        ],
        backgroundColor: ["#10b981", "#FFD902", "#6b7280"],
        borderWidth: 2,
        borderColor: darkMode ? "#000" : "#fff",
      },
    ],
  };

  const programData = {
    labels: programs.map((p) => p.name),
    datasets: [
      {
        label: "Matches por Programa",
        data: programs.map((p) => matches.filter((m) => m.program_id === p.id).length),
        backgroundColor: "#FFD902",
        borderRadius: 8,
      },
    ],
  };

  const scoreDistributionData = {
    labels: ["90-100", "80-89", "70-79", "60-69", "<60"],
    datasets: [
      {
        label: "Distribución de Scores",
        data: [
          matches.filter((m) => m.score >= 90).length,
          matches.filter((m) => m.score >= 80 && m.score < 90).length,
          matches.filter((m) => m.score >= 70 && m.score < 80).length,
          matches.filter((m) => m.score >= 60 && m.score < 70).length,
          matches.filter((m) => m.score < 60).length,
        ],
        backgroundColor: "#FFD902",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? "#fff" : "#000",
          font: { size: 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
        grid: { color: darkMode ? "#374151" : "#e5e7eb" },
      },
      y: {
        ticks: { color: darkMode ? "#9ca3af" : "#6b7280" },
        grid: { color: darkMode ? "#374151" : "#e5e7eb" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: darkMode ? "#fff" : "#000",
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className={`min-h-screen p-8 ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard Ejecutivo 💼</h1>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Vista general de {companyName}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: darkMode ? "#333" : "#e5e7eb" }}>
        {[
          { id: "overview", label: "Vista General", icon: IconChart },
          { id: "programs", label: "Programas", icon: IconProgram },
          { id: "reports", label: "Reportes", icon: IconDocument },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleViewChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              activeView === id
                ? "bg-primary-500 text-black"
                : darkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* KPIs Principales */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gradient-to-br from-primary-50 to-primary-100"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <IconProgram className="w-8 h-8 text-primary-500" />
                <IconTrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Programas Activos
              </p>
              <p className="text-4xl font-bold text-primary-500">{programs.length}</p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                En ejecución
              </p>
            </div>

            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <IconUsers className="w-8 h-8 text-blue-500" />
                <span className="text-xs font-semibold text-blue-500">+{mentees.length}</span>
              </div>
              <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Participantes
              </p>
              <p className="text-4xl font-bold">{participants.length}</p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                {mentors.length} mentores • {mentees.length} mentees
              </p>
            </div>

            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gradient-to-br from-green-50 to-green-100"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <IconCheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-xs font-semibold text-green-500">{activeMatches.length} activos</span>
              </div>
              <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Total Matches
              </p>
              <p className="text-4xl font-bold">{matches.length}</p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                {completedMatches.length} completados
              </p>
            </div>

            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gradient-to-br from-yellow-50 to-yellow-100"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <IconStar className="w-8 h-8 text-primary-500" />
                <span className="text-xs font-semibold text-primary-500">Excelente</span>
              </div>
              <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Score Promedio
              </p>
              <p className="text-4xl font-bold text-primary-500">{avgScore}%</p>
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Calidad de matching
              </p>
            </div>
          </div>

          {/* ROI & Impact Highlights */}
          <div className={`rounded-xl border p-6 ${
            darkMode ? "border-primary-500/30 bg-primary-500/10" : "border-primary-500/30 bg-primary-50"
          }`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <IconTrendingUp className="w-6 h-6 text-primary-500" />
              Impacto del Programa
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Tasa de Participación
                </p>
                <p className="text-3xl font-bold text-primary-500">
                  {participants.length > 0 ? ((matches.length / participants.length) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Tasa de Completación
                </p>
                <p className="text-3xl font-bold text-green-400">
                  {matches.length > 0 ? ((completedMatches.length / matches.length) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Satisfacción General
                </p>
                <p className="text-3xl font-bold">4.8/5.0</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart 1: Participantes */}
            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <h3 className="mb-4 text-lg font-semibold">Distribución de Participantes</h3>
              <div className="h-64">
                <Doughnut data={participantData} options={doughnutOptions} />
              </div>
            </div>

            {/* Chart 2: Estado de Matches */}
            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <h3 className="mb-4 text-lg font-semibold">Estado de Matches</h3>
              <div className="h-64">
                <Doughnut data={matchStatusData} options={doughnutOptions} />
              </div>
            </div>

            {/* Chart 3: Matches por Programa */}
            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <h3 className="mb-4 text-lg font-semibold">Matches por Programa</h3>
              <div className="h-64">
                <Bar data={programData} options={chartOptions as any} />
              </div>
            </div>

            {/* Chart 4: Distribución de Scores */}
            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <h3 className="mb-4 text-lg font-semibold">Calidad de Matches</h3>
              <div className="h-64">
                <Bar data={scoreDistributionData} options={chartOptions as any} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "programs" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Programas Activos</h2>
          {programs.length === 0 ? (
            <div className={`rounded-xl border p-12 text-center ${
              darkMode ? "border-gray-800 bg-dark-400/50" : "border-gray-200 bg-gray-50"
            }`}>
              <IconProgram className="w-20 h-20 text-gray-400 opacity-30 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay programas activos</h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Contacta al administrador para crear programas
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => {
                const programMatches = matches.filter((m) => m.program_id === program.id);
                const programParticipants = participants.filter((p) => p.program_id === program.id);
                
                return (
                  <div
                    key={program.id}
                    className={`rounded-xl border p-6 ${
                      darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-2">{program.name}</h3>
                      {program.description && (
                        <p className={`text-sm line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {program.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Participantes
                        </span>
                        <span className="font-semibold">{programParticipants.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Matches
                        </span>
                        <span className="font-semibold">{programMatches.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Activos
                        </span>
                        <span className="font-semibold text-green-400">
                          {programMatches.filter((m) => m.status === "active").length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t" style={{ borderColor: darkMode ? "#333" : "#e5e7eb" }}>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        program.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {program.status === "active" ? "Activo" : program.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Reportes y Exportación</h2>
          </div>

          {/* Export Options */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <IconDocument className="w-6 h-6 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Reporte de Programas</h3>
                  <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Exporta información detallada de todos los programas activos
                  </p>
                  <ExportButton
                    data={programs}
                    filename={`programas-${companyName}-${new Date().toISOString().split('T')[0]}`}
                    type="programs"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <IconUsers className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Reporte de Participantes</h3>
                  <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Exporta listado completo de mentores y mentees
                  </p>
                  <ExportButton
                    data={participants}
                    filename={`participantes-${companyName}-${new Date().toISOString().split('T')[0]}`}
                    type="participants"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <IconCheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Reporte de Matches</h3>
                  <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Exporta todos los matches con scores y estados
                  </p>
                  <ExportButton
                    data={matches}
                    filename={`matches-${companyName}-${new Date().toISOString().split('T')[0]}`}
                    type="matches"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-6 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
            }`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <IconChart className="w-6 h-6 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Reporte Ejecutivo</h3>
                  <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Dashboard completo con métricas y KPIs (próximamente)
                  </p>
                  <button
                    disabled
                    className={`px-4 py-2 rounded-lg font-semibold opacity-50 cursor-not-allowed ${
                      darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    Próximamente
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className={`rounded-xl border p-6 ${
            darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
          }`}>
            <h3 className="text-lg font-bold mb-4">Resumen de Datos Disponibles</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Programas
                </p>
                <p className="text-2xl font-bold text-primary-500">{programs.length}</p>
              </div>
              <div>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Participantes
                </p>
                <p className="text-2xl font-bold">{participants.length}</p>
              </div>
              <div>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Matches
                </p>
                <p className="text-2xl font-bold">{matches.length}</p>
              </div>
              <div>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Última actualización
                </p>
                <p className="text-sm font-semibold">{new Date().toLocaleDateString("es")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
