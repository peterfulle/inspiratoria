"use client";

import { useState } from "react";
import { Participant } from "@/lib/api";

type MatchingEngineProps = {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (programId: number) => void;
  participants: Participant[];
  darkMode: boolean;
};

type SuggestedMatch = {
  mentor: Participant;
  mentee: Participant;
  score: number;
  reasons: string[];
};

export default function MatchingEngine({ isOpen, onClose, onExecute, participants, darkMode }: MatchingEngineProps) {
  const [programId, setProgramId] = useState(1);
  const [suggestions, setSuggestions] = useState<SuggestedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const mentors = participants.filter(p => p.role === "mentor");
  const mentees = participants.filter(p => p.role === "mentee");

  const calculateMatch = () => {
    setLoading(true);
    
    // Simular cálculo de matching
    setTimeout(() => {
      const matches: SuggestedMatch[] = [];
      
      mentees.forEach(mentee => {
        mentors.forEach(mentor => {
          const skillOverlap = mentee.goals.filter(goal => 
            mentor.skills.some(skill => skill.toLowerCase().includes(goal.toLowerCase()))
          ).length;
          
          const score = Math.min(100, (skillOverlap * 20) + Math.random() * 40 + 30);
          
          const reasons = [
            `${skillOverlap} goals coinciden con skills del mentor`,
            `Disponibilidad: ${mentor.availability_hours}h y ${mentee.availability_hours}h`,
            score > 70 ? "Alta compatibilidad técnica" : "Compatibilidad moderada"
          ];
          
          matches.push({ mentor, mentee, score: Math.round(score), reasons });
        });
      });
      
      matches.sort((a, b) => b.score - a.score);
      setSuggestions(matches.slice(0, 10));
      setLoading(false);
    }, 1500);
  };

  const toggleApprove = (mentorId: number, menteeId: number) => {
    const key = `${mentorId}-${menteeId}`;
    const newApproved = new Set(approved);
    if (newApproved.has(key)) {
      newApproved.delete(key);
    } else {
      newApproved.add(key);
    }
    setApproved(newApproved);
  };

  const handleExecute = () => {
    onExecute(programId);
    setSuggestions([]);
    setApproved(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 ${
        darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
      }`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
            🤖 Motor de Matching Inteligente
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`}
          >
            ×
          </button>
        </div>

        {suggestions.length === 0 ? (
          <div className="space-y-4">
            <div className={`rounded-lg border p-6 text-center ${
              darkMode ? "border-gray-700 bg-dark-500" : "border-gray-200 bg-gray-50"
            }`}>
              <div className="mb-4 text-6xl">🎯</div>
              <h3 className={`mb-2 text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                Ejecutar Algoritmo de Matching
              </h3>
              <p className={`mb-6 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                El algoritmo analizará skills, goals, disponibilidad y compatibilidad
              </p>
              
              <div className="mb-6">
                <label className={`mb-2 block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Programa ID
                </label>
                <input
                  type="number"
                  value={programId}
                  onChange={(e) => setProgramId(parseInt(e.target.value))}
                  className={`mx-auto w-32 rounded-lg border px-4 py-2 text-center ${
                    darkMode
                      ? "border-gray-700 bg-dark-400 text-white"
                      : "border-gray-300 bg-white text-black"
                  }`}
                />
              </div>

              <div className={`mb-6 rounded-lg border p-4 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={`font-semibold ${darkMode ? "text-primary-400" : "text-primary-600"}`}>
                      {mentors.length} Mentores
                    </p>
                    <p className={darkMode ? "text-gray-400" : "text-gray-600"}>disponibles</p>
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? "text-primary-400" : "text-primary-600"}`}>
                      {mentees.length} Mentees
                    </p>
                    <p className={darkMode ? "text-gray-400" : "text-gray-600"}>esperando match</p>
                  </div>
                </div>
              </div>

              <button
                onClick={calculateMatch}
                disabled={loading}
                className="rounded-lg bg-primary-500 px-6 py-3 font-bold text-black transition hover:bg-primary-400 hover:shadow-glow disabled:opacity-50"
              >
                {loading ? "Calculando..." : "🚀 Calcular Matches"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {suggestions.length} matches sugeridos • {approved.size} aprobados
              </p>
              <button
                onClick={() => {
                  setSuggestions([]);
                  setApproved(new Set());
                }}
                className={`text-sm ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`}
              >
                Recalcular
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {suggestions.map((match, i) => {
                const key = `${match.mentor.id}-${match.mentee.id}`;
                const isApproved = approved.has(key);
                
                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 transition ${
                      isApproved
                        ? darkMode
                          ? "border-primary-500 bg-primary-500/10"
                          : "border-primary-500 bg-primary-50"
                        : darkMode
                        ? "border-gray-700 bg-dark-500"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-4">
                          <div className="flex-1">
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Mentor</p>
                            <p className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                              {match.mentor.full_name}
                            </p>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                              {match.mentor.headline}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className={`rounded-full px-4 py-2 font-bold ${
                              match.score >= 80
                                ? "bg-green-500/20 text-green-400"
                                : match.score >= 60
                                ? "bg-primary-500/20 text-primary-500"
                                : "bg-orange-500/20 text-orange-400"
                            }`}>
                              {match.score}
                            </div>
                            <p className={`mt-1 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                              score
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Mentee</p>
                            <p className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                              {match.mentee.full_name}
                            </p>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                              {match.mentee.headline}
                            </p>
                          </div>
                        </div>

                        <div className={`mb-3 rounded border p-2 text-xs ${
                          darkMode ? "border-gray-700 bg-dark-400" : "border-gray-200 bg-gray-50"
                        }`}>
                          {match.reasons.map((reason, j) => (
                            <p key={j} className={darkMode ? "text-gray-400" : "text-gray-600"}>
                              • {reason}
                            </p>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleApprove(match.mentor.id, match.mentee.id)}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          isApproved
                            ? "border-primary-500 bg-primary-500 text-black hover:bg-primary-400"
                            : darkMode
                            ? "border-gray-600 text-gray-300 hover:border-primary-500 hover:text-primary-500"
                            : "border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-500"
                        }`}
                      >
                        {isApproved ? "✓ Aprobado" : "Aprobar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setSuggestions([]);
                  setApproved(new Set());
                  onClose();
                }}
                className={`flex-1 rounded-lg border px-4 py-3 font-medium transition ${
                  darkMode
                    ? "border-gray-700 text-gray-300 hover:bg-dark-500"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleExecute}
                disabled={approved.size === 0}
                className="flex-1 rounded-lg bg-primary-500 px-4 py-3 font-bold text-black transition hover:bg-primary-400 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear {approved.size} Matches
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
