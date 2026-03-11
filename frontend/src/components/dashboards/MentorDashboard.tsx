"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient, Match } from "@/lib/api";
import ChatWindow from "@/components/ChatWindow";
import GoalsOKRs from "@/components/GoalsOKRs";
import CalendarView from "@/components/CalendarView";

// Icons
const IconUsers = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconChat = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const IconTarget = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconStar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconHeart = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const IconChevronRight = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

type Props = {
  userId: string;
  userName: string;
  darkMode?: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
};

export default function MentorDashboard({ userId, userName, darkMode = false, activeView: controlledActiveView, onViewChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [internalActiveView, setInternalActiveView] = useState<"overview" | "chat" | "goals" | "calendar">("overview");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
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
    loadMyMatches();
  }, [userId]);

  const loadMyMatches = async () => {
    setLoading(true);
    try {
      const allMatches = await ApiClient.getMatches();
      // Filter matches where I am the mentor
      const myMatchesList = allMatches.filter((m) => m.mentor.id.toString() === userId);
      setMyMatches(myMatchesList);
      if (myMatchesList.length > 0 && !selectedMatch) {
        setSelectedMatch(myMatchesList[0]);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">¡Hola, {userName}! 👨‍🏫</h1>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {myMatches.length > 0 
            ? `Tienes ${myMatches.length} mentee${myMatches.length > 1 ? 's' : ''} asignad${myMatches.length > 1 ? 'os' : 'o'}`
            : "Aún no tienes mentees asignados"}
        </p>
      </div>

      {myMatches.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${
          darkMode ? "border-gray-800 bg-dark-400/50" : "border-gray-200 bg-gray-50"
        }`}>
          <IconUsers className="w-20 h-20 text-gray-400 opacity-30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Aún no tienes mentees asignados</h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            El administrador te asignará mentees pronto. ¡Estate atento!
          </p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: darkMode ? "#333" : "#e5e7eb" }}>
            {[
              { id: "overview", label: "Mis Mentees", icon: IconUsers },
              { id: "chat", label: "Chat", icon: IconChat, disabled: !selectedMatch },
              { id: "goals", label: "Goals", icon: IconTarget, disabled: !selectedMatch },
              { id: "calendar", label: "Calendario", icon: IconCalendar },
            ].map(({ id, label, icon: Icon, disabled }) => (
              <button
                key={id}
                onClick={() => !disabled && handleViewChange(id)}
                disabled={disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : activeView === id
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
              {/* Stats Overview */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Total Mentees
                  </p>
                  <p className="text-3xl font-bold text-primary-500">{myMatches.length}</p>
                </div>
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Activos
                  </p>
                  <p className="text-3xl font-bold text-green-400">
                    {myMatches.filter(m => m.status === "active").length}
                  </p>
                </div>
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Score Promedio
                  </p>
                  <p className="text-3xl font-bold">
                    {myMatches.length > 0
                      ? (myMatches.reduce((sum, m) => sum + m.score, 0) / myMatches.length).toFixed(1)
                      : "0"}%
                  </p>
                </div>
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Completados
                  </p>
                  <p className="text-3xl font-bold">
                    {myMatches.filter(m => m.status === "completed").length}
                  </p>
                </div>
              </div>

              {/* Mentees Cards */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <IconUsers className="w-6 h-6 text-primary-500" />
                  Mis Mentees
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {myMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`rounded-xl border p-6 transition hover:shadow-lg cursor-pointer ${
                        darkMode 
                          ? "border-gray-800 bg-dark-400 hover:border-primary-500" 
                          : "border-gray-200 bg-white hover:border-primary-500"
                      } ${selectedMatch?.id === match.id ? "ring-2 ring-primary-500" : ""}`}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                          👨‍🎓
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold mb-1 truncate">{match.mentee.full_name}</h3>
                          <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {match.mentee.headline || "Mentee"}
                          </p>

                          {/* Match Info */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-1">
                              <IconStar className="w-4 h-4 text-primary-500" />
                              <span className="text-sm font-semibold">{match.score}%</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              match.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : match.status === "completed"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}>
                              {match.status}
                            </span>
                          </div>

                          {/* Skills */}
                          {match.mentee.goals && match.mentee.goals.length > 0 && (
                            <div className="mb-3">
                              <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Objetivos:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {match.mentee.goals.slice(0, 3).map((goal, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded ${
                                      darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {goal}
                                  </span>
                                ))}
                                {match.mentee.goals.length > 3 && (
                                  <span className={`text-xs px-2 py-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                    +{match.mentee.goals.length - 3} más
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMatch(match);
                                handleViewChange("chat");
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                darkMode
                                  ? "bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                                  : "bg-primary-500/20 text-primary-600 hover:bg-primary-500/30"
                              }`}
                            >
                              <IconChat className="w-4 h-4" />
                              Chat
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMatch(match);
                                handleViewChange("goals");
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                darkMode
                                  ? "border border-gray-700 text-gray-300 hover:border-primary-500 hover:bg-primary-500/10"
                                  : "border border-gray-300 text-gray-700 hover:border-primary-500 hover:bg-primary-500/10"
                              }`}
                            >
                              <IconTarget className="w-4 h-4" />
                              Goals
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips for Mentors */}
              <div className={`rounded-xl border p-6 ${
                darkMode ? "border-primary-500/30 bg-primary-500/10" : "border-primary-500/30 bg-primary-50"
              }`}>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <IconHeart className="w-5 h-5 text-primary-500" />
                  Tips para Mentores
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <IconChevronRight className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Mantén comunicación regular con tus mentees (al menos 1 vez por semana)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <IconChevronRight className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Establece objetivos claros y medibles en la sección de Goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <IconChevronRight className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Agenda sesiones regulares en el calendario</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <IconChevronRight className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Celebra los logros, por pequeños que sean</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeView === "chat" && selectedMatch && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleViewChange("overview")}
                  className={`text-sm flex items-center gap-1 ${
                    darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"
                  }`}
                >
                  ← Volver a Mis Mentees
                </button>
                <h2 className="text-2xl font-bold mt-2">Chat con {selectedMatch.mentee.full_name}</h2>
              </div>
              <ChatWindow 
                matchId={selectedMatch.id}
                currentUserId={parseInt(userId)}
                currentUserName={userName}
                recipientName={selectedMatch.mentee.full_name}
                darkMode={darkMode}
                onClose={() => handleViewChange("overview")}
              />
            </div>
          )}

          {activeView === "goals" && selectedMatch && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleViewChange("overview")}
                  className={`text-sm flex items-center gap-1 ${
                    darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"
                  }`}
                >
                  ← Volver a Mis Mentees
                </button>
                <h2 className="text-2xl font-bold mt-2">Goals con {selectedMatch.mentee.full_name}</h2>
              </div>
              <GoalsOKRs 
                match={selectedMatch} 
                darkMode={darkMode} 
                onClose={() => handleViewChange("overview")}
              />
            </div>
          )}

          {activeView === "calendar" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Calendario de Sesiones</h2>
              <CalendarView matches={myMatches} darkMode={darkMode} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
