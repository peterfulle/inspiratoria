"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient, Match, Program, Participant } from "@/lib/api";
import CalendarView from "@/components/CalendarView";

// Icons
const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconClipboard = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconUsers = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconChart = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconCheck = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconX = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconPlus = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconClock = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  program: string;
  attendees: number;
  totalParticipants: number;
  status: "scheduled" | "completed" | "cancelled";
}

interface AttendanceRecord {
  participantId: number;
  participantName: string;
  attended: boolean;
}

type Props = {
  userId: string;
  userName: string;
  companyId: string;
  role: "facilitator_internal" | "facilitator_inspiratoria";
  darkMode?: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
};

export default function FacilitatorDashboard({ userId, userName, companyId, role, darkMode = false, activeView: controlledActiveView, onViewChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [internalActiveView, setInternalActiveView] = useState<"overview" | "sessions" | "participants" | "calendar">("overview");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
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

      // Mock sessions data (en producción vendría del backend)
      const mockSessions: Session[] = [
        {
          id: "1",
          title: "Sesión de Onboarding",
          date: "2024-12-05",
          time: "10:00 AM",
          program: programsData[0]?.name || "Programa 1",
          attendees: 0,
          totalParticipants: 12,
          status: "scheduled",
        },
        {
          id: "2",
          title: "Workshop de Objetivos",
          date: "2024-12-03",
          time: "3:00 PM",
          program: programsData[0]?.name || "Programa 1",
          attendees: 10,
          totalParticipants: 12,
          status: "completed",
        },
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAttendance = (session: Session) => {
    setSelectedSession(session);
    // Initialize attendance records
    const records: AttendanceRecord[] = participants.slice(0, session.totalParticipants).map((p) => ({
      participantId: p.id,
      participantName: p.full_name,
      attended: false,
    }));
    setAttendance(records);
    setShowAttendanceModal(true);
  };

  const handleToggleAttendance = (participantId: number) => {
    setAttendance((prev) =>
      prev.map((record) =>
        record.participantId === participantId
          ? { ...record, attended: !record.attended }
          : record
      )
    );
  };

  const handleSaveAttendance = () => {
    // TODO: Save to backend
    const attendedCount = attendance.filter((r) => r.attended).length;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSession?.id
          ? { ...s, attendees: attendedCount, status: "completed" as const }
          : s
      )
    );
    setShowAttendanceModal(false);
    alert(`✅ Asistencia guardada: ${attendedCount}/${attendance.length} participantes`);
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Cargando panel...</p>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter((s) => s.status === "scheduled");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalAttendance = completedSessions.reduce((sum, s) => sum + s.attendees, 0);
  const totalExpected = completedSessions.reduce((sum, s) => sum + s.totalParticipants, 0);
  const attendanceRate = totalExpected > 0 ? ((totalAttendance / totalExpected) * 100).toFixed(1) : "0";

  return (
    <div className={`min-h-screen p-8 ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">¡Hola, {userName}! 🎯</h1>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {role === "facilitator_inspiratoria"
            ? "Panel de Facilitador Inspiratoria - Vista multi-empresa"
            : "Panel de Facilitador Interno"}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: darkMode ? "#333" : "#e5e7eb" }}>
        {[
          { id: "overview", label: "Overview", icon: IconChart },
          { id: "sessions", label: "Sesiones", icon: IconCalendar },
          { id: "participants", label: "Participantes", icon: IconUsers },
          { id: "calendar", label: "Calendario", icon: IconCalendar },
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
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className={`rounded-xl border p-5 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
            }`}>
              <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Sesiones Programadas
              </p>
              <p className="text-3xl font-bold text-primary-500">{upcomingSessions.length}</p>
            </div>
            <div className={`rounded-xl border p-5 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
            }`}>
              <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Sesiones Completadas
              </p>
              <p className="text-3xl font-bold text-green-400">{completedSessions.length}</p>
            </div>
            <div className={`rounded-xl border p-5 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
            }`}>
              <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Tasa de Asistencia
              </p>
              <p className="text-3xl font-bold">{attendanceRate}%</p>
            </div>
            <div className={`rounded-xl border p-5 ${
              darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
            }`}>
              <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Participantes Activos
              </p>
              <p className="text-3xl font-bold">{participants.length}</p>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <IconCalendar className="w-6 h-6 text-primary-500" />
                Próximas Sesiones
              </h2>
              <button
                onClick={() => setShowNewSessionModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold hover:bg-primary-400 transition"
              >
                <IconPlus className="w-4 h-4" />
                Nueva Sesión
              </button>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className={`rounded-xl border p-12 text-center ${
                darkMode ? "border-gray-800 bg-dark-400/50" : "border-gray-200 bg-gray-50"
              }`}>
                <IconCalendar className="w-20 h-20 text-gray-400 opacity-30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No hay sesiones programadas</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Crea tu primera sesión para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-xl border p-5 ${
                      darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{session.title}</h3>
                        <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {session.program}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <IconCalendar className="w-4 h-4" />
                            {new Date(session.date).toLocaleDateString("es", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <IconClock className="w-4 h-4" />
                            {session.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <IconUsers className="w-4 h-4" />
                            {session.totalParticipants} participantes
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenAttendance(session)}
                        className={`px-4 py-2 rounded-lg border font-semibold transition ${
                          darkMode
                            ? "border-gray-700 text-gray-300 hover:border-primary-500 hover:bg-primary-500/10"
                            : "border-gray-300 text-gray-700 hover:border-primary-500 hover:bg-primary-500/10"
                        }`}
                      >
                        Registrar Asistencia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <IconClipboard className="w-6 h-6 text-primary-500" />
              Actividad Reciente
            </h2>
            <div className="space-y-2">
              {completedSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className={`rounded-lg border p-4 flex items-center justify-between ${
                    darkMode ? "border-gray-800 bg-dark-400/50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <IconCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{session.title}</p>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {new Date(session.date).toLocaleDateString("es")} - {session.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {session.attendees}/{session.totalParticipants}
                    </p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {((session.attendees / session.totalParticipants) * 100).toFixed(0)}% asistencia
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === "sessions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gestión de Sesiones</h2>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold hover:bg-primary-400 transition"
            >
              <IconPlus className="w-4 h-4" />
              Nueva Sesión
            </button>
          </div>

          {/* All Sessions */}
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`rounded-xl border p-6 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{session.title}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          session.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : session.status === "scheduled"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {session.status === "completed"
                          ? "Completada"
                          : session.status === "scheduled"
                          ? "Programada"
                          : "Cancelada"}
                      </span>
                    </div>
                    <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {session.program}
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <IconCalendar className="w-4 h-4" />
                        {new Date(session.date).toLocaleDateString("es", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <IconClock className="w-4 h-4" />
                        {session.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <IconUsers className="w-4 h-4" />
                        {session.attendees}/{session.totalParticipants} asistieron
                      </div>
                    </div>
                  </div>
                  {session.status === "scheduled" && (
                    <button
                      onClick={() => handleOpenAttendance(session)}
                      className="px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold hover:bg-primary-400 transition"
                    >
                      Registrar Asistencia
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === "participants" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Participantes Asignados</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    participant.role === "mentor"
                      ? "bg-gradient-to-br from-primary-500 to-primary-600"
                      : "bg-gradient-to-br from-blue-400 to-blue-600"
                  }`}>
                    {participant.role === "mentor" ? "👨‍🏫" : "👨‍🎓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{participant.full_name}</h3>
                    <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {participant.role === "mentor" ? "Mentor" : "Mentee"}
                    </p>
                    {participant.headline && (
                      <p className={`text-sm line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {participant.headline}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === "calendar" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Calendario de Sesiones</h2>
          <CalendarView matches={matches} darkMode={darkMode} />
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${
            darkMode ? "bg-dark-500 border border-gray-800" : "bg-white"
          }`}>
            <div className={`p-6 border-b ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
              <h3 className="text-2xl font-bold mb-1">{selectedSession.title}</h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {new Date(selectedSession.date).toLocaleDateString("es")} - {selectedSession.time}
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record.participantId}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{record.participantName}</span>
                    <button
                      onClick={() => handleToggleAttendance(record.participantId)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        record.attended
                          ? "bg-green-500 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {record.attended ? <IconCheck className="w-5 h-5" /> : <IconX className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-6 border-t flex gap-3 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className={`flex-1 px-4 py-3 rounded-lg border font-semibold transition ${
                  darkMode
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAttendance}
                className="flex-1 px-4 py-3 rounded-lg bg-primary-500 text-black font-semibold hover:bg-primary-400 transition"
              >
                Guardar Asistencia ({attendance.filter((r) => r.attended).length}/{attendance.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal - Placeholder */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-md w-full p-6 ${
            darkMode ? "bg-dark-500 border border-gray-800" : "bg-white"
          }`}>
            <h3 className="text-2xl font-bold mb-4">Nueva Sesión</h3>
            <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Funcionalidad en desarrollo. Aquí podrás crear nuevas sesiones con:
            </p>
            <ul className={`space-y-2 mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              <li>• Título y descripción</li>
              <li>• Fecha y hora</li>
              <li>• Programa asociado</li>
              <li>• Participantes</li>
            </ul>
            <button
              onClick={() => setShowNewSessionModal(false)}
              className="w-full px-4 py-3 rounded-lg bg-primary-500 text-black font-semibold hover:bg-primary-400 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
