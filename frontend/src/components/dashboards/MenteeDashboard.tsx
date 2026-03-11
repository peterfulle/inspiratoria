"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient, Match } from "@/lib/api";
import ChatWindow from "@/components/ChatWindow";
import GoalsOKRs from "@/components/GoalsOKRs";
import CalendarView from "@/components/CalendarView";

// Icons
const IconHeart = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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

type Props = {
  userId: string;
  userName: string;
  darkMode?: boolean;
  activeView?: string;
  onViewChange?: (view: string) => void;
};

export default function MenteeDashboard({ userId, userName, darkMode = false, activeView: controlledActiveView, onViewChange }: Props) {
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
      // Filter matches where I am the mentee
      const myMatchesList = allMatches.filter((m) => m.mentee.id.toString() === userId);
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

  const myMatch = myMatches[0]; // Mentee typically has one mentor

  return (
    <div className={`min-h-screen p-8 ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">¡Hola, {userName}! 👋</h1>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Bienvenido a tu espacio de mentoría
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: darkMode ? "#333" : "#e5e7eb" }}>
        {[
          { id: "overview", label: "Mi Mentor", icon: IconHeart },
          { id: "chat", label: "Chat", icon: IconChat },
          { id: "goals", label: "Mis Goals", icon: IconTarget },
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
      {!myMatch ? (
        <div className={`rounded-xl border p-12 text-center ${
          darkMode ? "border-gray-800 bg-dark-400/50" : "border-gray-200 bg-gray-50"
        }`}>
          <IconHeart className="w-20 h-20 text-gray-400 opacity-30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Aún no tienes un mentor asignado</h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            El administrador te asignará un mentor pronto. ¡Estate atento!
          </p>
        </div>
      ) : (
        <>
          {activeView === "overview" && (
            <div className="space-y-6">
              {/* Mentor Card */}
              <div className={`rounded-xl border p-6 ${
                darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
              }`}>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl">
                    👨‍🏫
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{myMatch.mentor.full_name}</h3>
                    <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {myMatch.mentor.headline || "Tu mentor"}
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <IconStar className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-semibold">Match Score: {myMatch.score}%</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        myMatch.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {myMatch.status}
                      </span>
                    </div>

                    {/* Mentor Skills */}
                    {myMatch.mentor.skills && myMatch.mentor.skills.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Habilidades:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {myMatch.mentor.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-1 rounded ${
                                darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleViewChange("chat")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-black font-semibold hover:bg-primary-400 transition"
                      >
                        <IconChat className="w-4 h-4" />
                        Chatear
                      </button>
                      <button
                        onClick={() => handleViewChange("goals")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold transition ${
                          darkMode
                            ? "border-gray-700 text-gray-300 hover:border-primary-500 hover:bg-primary-500/10"
                            : "border-gray-300 text-gray-700 hover:border-primary-500 hover:bg-primary-500/10"
                        }`}
                      >
                        <IconTarget className="w-4 h-4" />
                        Ver Goals
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Match Score
                  </p>
                  <p className="text-3xl font-bold text-primary-500">{myMatch.score}%</p>
                </div>
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Estado
                  </p>
                  <p className="text-3xl font-bold capitalize">{myMatch.status}</p>
                </div>
                <div className={`rounded-xl border p-5 ${
                  darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
                }`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Inicio
                  </p>
                  <p className="text-lg font-bold">
                    {new Date(myMatch.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeView === "chat" && selectedMatch && (
            <ChatWindow 
              matchId={selectedMatch.id}
              currentUserId={parseInt(userId)}
              currentUserName={userName}
              recipientName={selectedMatch.mentor.full_name}
              darkMode={darkMode}
              onClose={() => handleViewChange("overview")}
            />
          )}

          {activeView === "goals" && selectedMatch && (
            <GoalsOKRs 
              match={selectedMatch} 
              darkMode={darkMode} 
              onClose={() => handleViewChange("overview")}
            />
          )}

          {activeView === "calendar" && (
            <CalendarView matches={myMatches} darkMode={darkMode} />
          )}
        </>
      )}
    </div>
  );
}
