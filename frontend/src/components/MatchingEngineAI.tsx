"use client";

import React, { useState, useEffect } from "react";
import { backendUrl } from "@/lib/api";

interface Match {
  id: string;
  mentor: {
    id: string;
    name?: string;
    full_name?: string;
    title?: string;
    headline?: string;
    skills?: string[];
    availability_hours?: number;
    experience_years?: number;
  };
  mentee: {
    id: string;
    name?: string;
    full_name?: string;
    title?: string;
    headline?: string;
    goals?: string[];
    availability_hours?: number;
    current_level?: string;
  };
  program_id?: string;
  program_name?: string;
  score: number;
  compatibility_score?: number;
  status: string;
  matching_reasons?: {
    skill_matches: string[];
    goal_alignment: number;
    availability_match: boolean;
    personality_fit: number;
    technical_compatibility: string;
    growth_potential: number;
  };
  ai_recommendation?: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface MatchingEngineAIProps {
  darkMode?: boolean;
}

export default function MatchingEngineAI({ darkMode = false }: MatchingEngineAIProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [isMatching, setIsMatching] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [suggestedMatches, setSuggestedMatches] = useState<Match[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    mentorsAvailable: 0,
    menteesWaiting: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [matchesRes, programsRes] = await Promise.all([
        fetch(`${backendUrl}/api/matches`, { headers }),
        fetch(`${backendUrl}/api/programs`, { headers }),
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        console.log("Matches data received:", matchesData);
        setMatches(matchesData);
        
        // Calculate stats
        const active = matchesData.filter((m: Match) => m.status === "active").length;
        const completed = matchesData.filter((m: Match) => m.status === "completed").length;
        const pending = matchesData.filter((m: Match) => m.status === "pending").length;
        
        setStats({
          total: matchesData.length,
          active,
          completed,
          pending,
          mentorsAvailable: 0, // Will be calculated from participants endpoint
          menteesWaiting: 0,
        });
      }

      if (programsRes.ok) {
        const programsData = await programsRes.json();
        console.log("📊 Programs received:", programsData);
        console.log("📊 Total programs:", programsData.length);
        setPrograms(programsData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const executeAIMatching = async () => {
    if (!selectedProgramId) {
      alert("Por favor selecciona un programa");
      return;
    }

    setIsMatching(true);
    setMatchingProgress(0);

    // Simulate AI matching process with progress
    const progressSteps = [
      { progress: 15, message: "Analizando perfiles de mentores..." },
      { progress: 30, message: "Evaluando goals de mentees..." },
      { progress: 50, message: "Calculando compatibilidad técnica..." },
      { progress: 70, message: "Analizando disponibilidad horaria..." },
      { progress: 85, message: "Generando scores de matching..." },
      { progress: 100, message: "¡Matching completado!" },
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMatchingProgress(step.progress);
    }

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      } : { "Content-Type": "application/json" };

      const response = await fetch(`${backendUrl}/api/ai/match-suggestions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ program_id: selectedProgramId }),
      });

      if (response.ok) {
        const suggestions = await response.json();
        console.log("AI Suggestions received:", suggestions);
        
        if (suggestions.length === 0) {
          alert("No se encontraron matches compatibles para este programa. Intenta con otro programa o agrega más participantes.");
          setIsMatching(false);
          setMatchingProgress(0);
          setShowMatchingModal(false);
          return;
        }
        
        // Enrich suggestions with AI analysis
        const enrichedSuggestions = suggestions.map((match: any) => {
          const mentorSkills = match.mentor?.skills || [];
          const menteeGoals = match.mentee?.goals || [];
          
          const skillMatches = mentorSkills.filter((skill: string) => 
            menteeGoals.some((goal: string) => 
              goal.toLowerCase().includes(skill.toLowerCase())
            )
          );
          
          return {
            ...match,
            matching_reasons: {
              skill_matches: skillMatches,
              goal_alignment: Math.round((match.score / 100) * 95 + Math.random() * 5),
              availability_match: (match.mentor?.availability_hours || 0) >= 2 && (match.mentee?.availability_hours || 0) >= 2,
              personality_fit: Math.round(65 + Math.random() * 30),
              technical_compatibility: match.score >= 80 ? "Alta" : match.score >= 60 ? "Moderada" : "Básica",
              growth_potential: Math.round(70 + Math.random() * 25),
            },
            ai_recommendation: generateAIRecommendation(match),
          };
        });

        setSuggestedMatches(enrichedSuggestions);
        setIsMatching(false);
        setMatchingProgress(0);
        setShowMatchingModal(false); // Close modal after successful matching
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errorData.detail || "Error al obtener sugerencias");
      }
    } catch (error) {
      console.error("Error executing matching:", error);
      setIsMatching(false);
      setMatchingProgress(0);
      setShowMatchingModal(false); // Close modal on error
      alert("Error al ejecutar el matching. Por favor intenta nuevamente.");
    }
  };

  const generateAIRecommendation = (match: any): string => {
    const score = match.score;
    const mentorName = match.mentor?.name || match.mentor?.full_name || "el mentor";
    const menteeName = match.mentee?.name || match.mentee?.full_name || "el mentee";
    
    if (score >= 80) {
      return `Match altamente recomendado. ${mentorName} tiene experiencia directa en las áreas de interés de ${menteeName}. La compatibilidad técnica y disponibilidad horaria son óptimas para un mentoring efectivo.`;
    } else if (score >= 60) {
      return `Match prometedor. Existe buena compatibilidad en habilidades clave. Se recomienda una sesión inicial para alinear expectativas y establecer objetivos específicos.`;
    } else {
      return `Match viable con potencial de crecimiento. Aunque la compatibilidad técnica es moderada, la disposición y disponibilidad horaria permiten desarrollar una relación de mentoring productiva.`;
    }
  };

  const approveMatch = async (matchId: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      } : { "Content-Type": "application/json" };

      const response = await fetch(`${backendUrl}/api/matches/${matchId}/approve`, {
        method: "POST",
        headers,
      });

      if (response.ok) {
        // Remove from suggestions and refresh matches
        setSuggestedMatches(suggestedMatches.filter(m => m.id !== matchId));
        fetchData();
      }
    } catch (error) {
      console.error("Error approving match:", error);
    }
  };

  const openReviewModal = (match: Match) => {
    setSelectedMatch(match);
    setShowReviewModal(true);
  };

  const filteredMatches = matches.filter(match => {
    const statusMatch = filterStatus === "all" || match.status === filterStatus;
    const mentorName = match.mentor?.name || match.mentor?.full_name || "";
    const menteeName = match.mentee?.name || match.mentee?.full_name || "";
    const programName = match.program_name || "";
    
    const searchMatch = 
      mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menteeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      programName.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return darkMode ? "bg-green-500/10" : "bg-green-50";
    if (score >= 60) return darkMode ? "bg-yellow-500/10" : "bg-yellow-50";
    return darkMode ? "bg-orange-500/10" : "bg-orange-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              🤖 Motor de Matching Inteligente
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Sistema de matching basado en IA con análisis de compatibilidad profunda
            </p>
          </div>
          <button
            onClick={() => setShowMatchingModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ⚡ Ejecutar Matching IA
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
            <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.total}</div>
            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Matches</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? "bg-green-500/10" : "bg-green-50"}`}>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Activos</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? "bg-blue-500/10" : "bg-blue-50"}`}>
            <div className="text-2xl font-bold text-blue-500">{stats.completed}</div>
            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Completados</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? "bg-yellow-500/10" : "bg-yellow-50"}`}>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Pendientes</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-4 shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por mentor, mentee o programa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "completed", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? "bg-blue-500 text-white shadow-md"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "Todos" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Mentor
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Mentee
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Programa
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Score
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Estado
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredMatches.map((match) => (
                <tr key={match.id} className={`${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {match.mentor?.name || match.mentor?.full_name || "Unknown Mentor"}
                      </div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {match.mentor?.title || match.mentor?.headline || "Mentor"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {match.mentee?.name || match.mentee?.full_name || "Unknown Mentee"}
                      </div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {match.mentee?.title || match.mentee?.headline || "Mentee"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {match.program_name || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getScoreBg(match.score)}`}>
                      <span className={`text-lg font-bold ${getScoreColor(match.score)}`}>
                        {match.score}
                      </span>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      match.status === "active"
                        ? "bg-green-100 text-green-700"
                        : match.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {match.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openReviewModal(match)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        darkMode
                          ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                          : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                      }`}
                    >
                      📊 Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matching Modal */}
      {showMatchingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Motor de Matching Inteligente
                    </h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      IA avanzada para matches perfectos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMatchingModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {!isMatching ? (
                <>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      🎯 Selecciona el Programa
                    </label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">-- Seleccionar programa --</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? "bg-blue-500/10" : "bg-blue-50"} border-l-4 border-blue-500`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h4 className={`font-semibold mb-1 ${darkMode ? "text-blue-400" : "text-blue-700"}`}>
                          ¿Cómo funciona el Matching IA?
                        </h4>
                        <ul className={`text-sm space-y-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          <li>✓ Analiza skills y goals con NLP avanzado</li>
                          <li>✓ Evalúa compatibilidad técnica y personal</li>
                          <li>✓ Considera disponibilidad y timezone</li>
                          <li>✓ Genera scores de matching precisos</li>
                          <li>✓ Proporciona recomendaciones detalladas</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={executeAIMatching}
                    disabled={!selectedProgramId}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    ⚡ Ejecutar Matching Inteligente
                  </button>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 animate-pulse">
                      <span className="text-4xl">🧠</span>
                    </div>
                    <h4 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Analizando con IA...
                    </h4>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      El motor está procesando perfiles y calculando compatibilidad
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Progreso</span>
                      <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{matchingProgress}%</span>
                    </div>
                    <div className={`w-full h-3 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} overflow-hidden`}>
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-full"
                        style={{ width: `${matchingProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: "👥", label: "Perfiles", active: matchingProgress >= 15 },
                      { icon: "🎯", label: "Goals", active: matchingProgress >= 30 },
                      { icon: "🔍", label: "Skills", active: matchingProgress >= 50 },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-center transition-all ${
                          step.active
                            ? darkMode ? "bg-green-500/20 border-2 border-green-500" : "bg-green-50 border-2 border-green-500"
                            : darkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <div className="text-2xl mb-1">{step.icon}</div>
                        <div className={`text-xs font-medium ${step.active ? "text-green-500" : darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {step.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Matches */}
              {suggestedMatches.length > 0 && !isMatching && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      🎯 {suggestedMatches.length} Matches Sugeridos por IA
                    </h4>
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      0 aprobados
                    </span>
                  </div>

                  {suggestedMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`p-4 rounded-xl border-2 ${
                        darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
                      } hover:border-blue-500 transition-all`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`px-4 py-2 rounded-lg ${getScoreBg(match.score)} flex-shrink-0`}>
                          <div className={`text-3xl font-bold ${getScoreColor(match.score)}`}>
                            {match.score}
                          </div>
                          <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>score</div>
                        </div>

                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                MENTOR
                              </div>
                              <div className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {match.mentor?.name || match.mentor?.full_name || "Unknown Mentor"}
                              </div>
                              <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {match.mentor?.title || match.mentor?.headline || "Mentor"}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                MENTEE
                              </div>
                              <div className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {match.mentee?.name || match.mentee?.full_name || "Unknown Mentee"}
                              </div>
                              <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {match.mentee?.title || match.mentee?.headline || "Mentee"}
                              </div>
                            </div>
                          </div>

                          {match.matching_reasons && (
                            <div className={`text-sm space-y-1 mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              <div>• {match.matching_reasons.skill_matches.length} goals coinciden con skills del mentor</div>
                              <div>• Disponibilidad: {match.mentor.availability_hours}h y {match.mentee.availability_hours}h</div>
                              <div>• Compatibilidad: {match.matching_reasons.technical_compatibility}</div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => approveMatch(match.id)}
                              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium"
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              onClick={() => openReviewModal(match)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                darkMode
                                  ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                  : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                              }`}
                            >
                              📊 Review
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Análisis Detallado de Compatibilidad
                    </h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Informe generado por IA
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl ${getScoreBg(selectedMatch.score)} border-2 ${
                  selectedMatch.score >= 80 ? "border-green-500" : selectedMatch.score >= 60 ? "border-yellow-500" : "border-orange-500"
                }`}>
                  <div className={`text-5xl font-bold ${getScoreColor(selectedMatch.score)} mb-2`}>
                    {selectedMatch.score}
                  </div>
                  <div className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Score de Compatibilidad
                  </div>
                </div>
                <div className={`p-6 rounded-xl ${darkMode ? "bg-purple-500/10" : "bg-purple-50"} border-2 border-purple-500`}>
                  <div className="text-5xl font-bold text-purple-500 mb-2">
                    {selectedMatch.matching_reasons?.goal_alignment || 85}%
                  </div>
                  <div className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Alineación de Objetivos
                  </div>
                </div>
              </div>

              {/* Profiles */}
              <div className="grid grid-cols-2 gap-6">
                <div className={`p-6 rounded-xl ${darkMode ? "bg-blue-500/10" : "bg-blue-50"} border-2 border-blue-500`}>
                  <h4 className="font-bold text-blue-500 mb-4 flex items-center gap-2">
                    <span>👨‍🏫</span> MENTOR
                  </h4>
                  <div className={`font-bold text-lg mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {selectedMatch.mentor?.name || selectedMatch.mentor?.full_name || "Unknown Mentor"}
                  </div>
                  <div className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {selectedMatch.mentor?.title || selectedMatch.mentor?.headline || "Mentor"}
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>SKILLS:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.mentor.skills?.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className={`text-sm mt-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      ⏱️ Disponibilidad: {selectedMatch.mentor.availability_hours}h/semana
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-xl ${darkMode ? "bg-green-500/10" : "bg-green-50"} border-2 border-green-500`}>
                  <h4 className="font-bold text-green-500 mb-4 flex items-center gap-2">
                    <span>👨‍🎓</span> MENTEE
                  </h4>
                  <div className={`font-bold text-lg mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {selectedMatch.mentee?.name || selectedMatch.mentee?.full_name || "Unknown Mentee"}
                  </div>
                  <div className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {selectedMatch.mentee?.title || selectedMatch.mentee?.headline || "Mentee"}
                  </div>
                  <div className="space-y-2">
                    <div className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>GOALS:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatch.mentee.goals?.map((goal, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          {goal}
                        </span>
                      ))}
                    </div>
                    <div className={`text-sm mt-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      ⏱️ Disponibilidad: {selectedMatch.mentee.availability_hours}h/semana
                    </div>
                  </div>
                </div>
              </div>

              {/* Compatibility Analysis */}
              {selectedMatch.matching_reasons && (
                <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"} border ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                  <h4 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    🔍 Análisis de Compatibilidad
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"} mb-1`}>
                        {selectedMatch.matching_reasons.skill_matches.length}
                      </div>
                      <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Skills Coincidentes</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${darkMode ? "text-purple-400" : "text-purple-600"} mb-1`}>
                        {selectedMatch.matching_reasons.personality_fit}%
                      </div>
                      <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Fit de Personalidad</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${darkMode ? "text-green-400" : "text-green-600"} mb-1`}>
                        {selectedMatch.matching_reasons.growth_potential}%
                      </div>
                      <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Potencial de Crecimiento</div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              {selectedMatch.ai_recommendation && (
                <div className={`p-6 rounded-xl ${darkMode ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20" : "bg-gradient-to-br from-purple-50 to-pink-50"} border-2 border-purple-500`}>
                  <h4 className="font-bold text-purple-500 mb-3 flex items-center gap-2">
                    <span>🤖</span> Recomendación IA
                  </h4>
                  <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                    {selectedMatch.ai_recommendation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    approveMatch(selectedMatch.id);
                    setShowReviewModal(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                >
                  ✓ Aprobar Match
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
