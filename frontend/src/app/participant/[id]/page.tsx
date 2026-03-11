"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ApiClient, Match, Participant } from "@/lib/api";

type Milestone = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  due_date: string;
};

// Modern SVG Icons
const IconMentor = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const IconMentee = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IconClock = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSkills = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const IconGoals = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconMilestone = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const IconNotes = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconArrowLeft = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IconSend = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

export default function ParticipantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 1,
      title: "Primera reunión",
      description: "Conocerse y establecer expectativas",
      completed: true,
      due_date: "2025-11-15",
    },
    {
      id: 2,
      title: "Definir objetivos",
      description: "Establecer metas SMART para el programa",
      completed: true,
      due_date: "2025-11-22",
    },
    {
      id: 3,
      title: "Revisar progreso",
      description: "Evaluar avances y ajustar plan",
      completed: false,
      due_date: "2025-12-15",
    },
    {
      id: 4,
      title: "Proyecto final",
      description: "Presentar resultados del mentoring",
      completed: false,
      due_date: "2026-01-30",
    },
  ]);
  const [notes, setNotes] = useState<string>("");
  const [newNote, setNewNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setDarkMode(theme === "dark");
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    }

    // Simular carga de datos
    setTimeout(() => {
      setParticipant({
        id: 1,
        full_name: "Ana García",
        role: "mentor",
        headline: "Senior Product Manager @ Tech Corp",
        skills: ["Product Management", "Leadership", "Strategy", "Agile"],
        goals: ["Career Growth", "Technical Skills", "Networking"],
        availability_hours: 3,
        program_id: 1,
      });
      setLoading(false);
    }, 500);
  }, []);

  const toggleMilestone = (id: number) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const addNote = () => {
    if (newNote.trim()) {
      const timestamp = new Date().toLocaleString("es-ES");
      setNotes(`${notes}\n[${timestamp}] ${newNote}\n`);
      setNewNote("");
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Cargando participante...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Participante no encontrado</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedMilestones = milestones.filter((m) => m.completed).length;
  const progress = Math.round((completedMilestones / milestones.length) * 100);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? "border-gray-800 bg-dark-500" : "border-gray-200 bg-white"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className={`rounded-lg border px-3 py-2 text-sm transition flex items-center gap-2 ${
                darkMode
                  ? "border-gray-700 text-gray-300 hover:border-primary-500 hover:text-primary-500"
                  : "border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-500"
              }`}
            >
              <IconArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <Image src="/images/logo.png" alt="Inspiratoria" width={120} height={32} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Participant Header */}
        <div className={`mb-8 rounded-xl border p-8 ${
          darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-gray-50"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-2xl font-bold text-black">
                  {participant.full_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{participant.full_name}</h1>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {participant.headline}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold flex items-center gap-2 ${
                    participant.role === "mentor"
                      ? "bg-primary-500/20 text-primary-500"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {participant.role === "mentor" ? (
                    <>
                      <IconMentor className="w-4 h-4" />
                      Mentor
                    </>
                  ) : (
                    <>
                      <IconMentee className="w-4 h-4" />
                      Mentee
                    </>
                  )}
                </span>
                <span className={`rounded-full px-4 py-1.5 text-sm flex items-center gap-2 ${
                  darkMode ? "bg-dark-500 text-gray-300" : "bg-gray-200 text-gray-700"
                }`}>
                  <IconClock className="w-4 h-4" />
                  {participant.availability_hours}h/semana
                </span>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="text-center">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90 transform">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={darkMode ? "#1f2937" : "#e5e7eb"}
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#FFD902"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-500">{progress}%</span>
                </div>
              </div>
              <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Progreso</p>
            </div>
          </div>

          {/* Skills & Goals */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className={`mb-3 font-semibold flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <IconSkills className="w-5 h-5 text-primary-500" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {participant.skills.map((skill, i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      darkMode ? "bg-dark-500 text-gray-300" : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className={`mb-3 font-semibold flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <IconGoals className="w-5 h-5 text-green-500" />
                Goals
              </h3>
              <div className="flex flex-wrap gap-2">
                {participant.goals.map((goal, i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      darkMode ? "bg-dark-500 text-gray-300" : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Milestones */}
          <div className={`rounded-xl border p-6 ${
            darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
          }`}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <IconMilestone className="w-6 h-6 text-primary-500" />
                Milestones
              </h2>
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {completedMilestones} de {milestones.length} completados
              </span>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 transition ${
                    milestone.completed
                      ? darkMode
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-green-200 bg-green-50"
                      : darkMode
                      ? "border-gray-700 bg-dark-500"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 transition ${
                      milestone.completed
                        ? "border-primary-500 bg-primary-500"
                        : darkMode
                        ? "border-gray-600"
                        : "border-gray-300"
                    }`}
                  >
                    {milestone.completed && (
                      <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        milestone.completed
                          ? darkMode
                            ? "text-gray-400 line-through"
                            : "text-gray-500 line-through"
                          : darkMode
                          ? "text-white"
                          : "text-black"
                      }`}
                    >
                      {milestone.title}
                    </h3>
                    <p className={`mt-1 text-sm ${darkMode ? "text-gray-500" : "text-gray-600"}`}>
                      {milestone.description}
                    </p>
                    <p className={`mt-2 text-xs flex items-center gap-1.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                      <IconCalendar className="w-3.5 h-3.5" />
                      {new Date(milestone.due_date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={`rounded-xl border p-6 ${
            darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
          }`}>
            <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
              <IconNotes className="w-6 h-6 text-blue-500" />
              Notas & Comentarios
            </h2>

            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe una nota o comentario..."
                className={`w-full rounded-lg border p-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  darkMode
                    ? "border-gray-700 bg-dark-500 text-white placeholder-gray-500"
                    : "border-gray-300 bg-white text-black placeholder-gray-400"
                }`}
                rows={4}
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="mt-2 w-full rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <IconSend className="w-5 h-5" />
                Agregar Nota
              </button>
            </div>

            {notes && (
              <div className={`rounded-lg border p-4 ${
                darkMode ? "border-gray-700 bg-dark-500" : "border-gray-200 bg-gray-50"
              }`}>
                <h3 className={`mb-3 text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Historial
                </h3>
                <pre className={`whitespace-pre-wrap text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {notes}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
