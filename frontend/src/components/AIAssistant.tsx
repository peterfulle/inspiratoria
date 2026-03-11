"use client";

import { useState } from "react";
import { ApiClient, AIGoalRecommendation, AIAnalysis, AIMatchHealth, Match } from "@/lib/api";

interface AIAssistantProps {
  match: Match;
  darkMode?: boolean;
  onClose: () => void;
}

export default function AIAssistant({ match, darkMode = false, onClose }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<"recommendations" | "analysis" | "health">("recommendations");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIGoalRecommendation[]>([]);
  const [goalAnalysis, setGoalAnalysis] = useState<AIAnalysis | null>(null);
  const [matchHealth, setMatchHealth] = useState<AIMatchHealth | null>(null);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getAIGoalRecommendations(match.mentee.id, match.id);
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Error loading AI recommendations:", error);
      alert("Error al cargar recomendaciones de IA");
    } finally {
      setLoading(false);
    }
  };

  const loadMatchHealth = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.analyzeMatchHealth(match.id);
      setMatchHealth(data);
    } catch (error) {
      console.error("Error loading match health:", error);
      alert("Error al analizar la salud del match");
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-400 bg-green-500/20";
      case "good":
        return "text-blue-400 bg-blue-500/20";
      case "needs_attention":
        return "text-yellow-400 bg-yellow-500/20";
      case "critical":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`flex h-[90vh] w-full max-w-6xl flex-col rounded-xl border shadow-2xl ${
        darkMode
          ? "border-gray-700 bg-dark-400"
          : "border-gray-200 bg-white"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-6 ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🤖 InspiraAI <span className="text-sm font-normal text-primary-500">Powered by Neuramorphic</span>
            </h2>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Recomendaciones inteligentes para {match.mentor.full_name} ↔ {match.mentee.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition ${
              darkMode
                ? "hover:bg-dark-300"
                : "hover:bg-gray-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 border-b px-6 ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          {[
            { id: "recommendations", label: "📚 Recomendaciones", icon: "💡" },
            { id: "health", label: "❤️ Salud del Match", icon: "📊" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "recommendations" && recommendations.length === 0) {
                  loadRecommendations();
                }
                if (tab.id === "health" && !matchHealth) {
                  loadMatchHealth();
                }
              }}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? darkMode
                    ? "border-b-2 border-primary-500 text-primary-500"
                    : "border-b-2 border-primary-500 text-primary-500"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            </div>
          ) : (
            <>
              {/* Recommendations Tab */}
              {activeTab === "recommendations" && (
                <div className="space-y-6">
                  {recommendations.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-20">
                      <span className="text-8xl opacity-20">🤖</span>
                      <p className={`mt-4 text-lg font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        No hay recomendaciones generadas
                      </p>
                      <button
                        onClick={loadRecommendations}
                        className="mt-4 rounded-lg bg-primary-500 px-6 py-2 font-semibold text-black transition hover:bg-primary-400"
                      >
                        Generar con AI
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={`rounded-lg border p-4 ${
                        darkMode ? "border-blue-700 bg-blue-500/10" : "border-blue-300 bg-blue-50"
                      }`}>
                        <p className={`text-sm ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                          💡 <strong>Recomendaciones generadas por Neuramorphic AI</strong> basadas en el perfil, habilidades e intereses del mentee.
                        </p>
                      </div>

                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`rounded-xl border p-6 ${
                            darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="mb-4">
                            <div className="mb-2 flex items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                rec.priority === "high"
                                  ? "bg-red-500/20 text-red-400"
                                  : rec.priority === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}>
                                {rec.priority.toUpperCase()}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                darkMode ? "bg-primary-500/20 text-primary-500" : "bg-primary-500/20 text-primary-600"
                              }`}>
                                {rec.goal_type.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold">{rec.title}</h3>
                            <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {rec.description}
                            </p>
                          </div>

                          <div className={`mb-4 rounded-lg border p-4 ${
                            darkMode ? "border-gray-600 bg-dark-400" : "border-gray-300 bg-white"
                          }`}>
                            <p className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              💭 Por qué es relevante:
                            </p>
                            <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {rec.rationale}
                            </p>
                          </div>

                          {rec.key_results && rec.key_results.length > 0 && (
                            <div className="mb-4">
                              <p className={`mb-2 text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                🎯 Key Results sugeridos:
                              </p>
                              <ul className="space-y-2">
                                {rec.key_results.map((kr, krIndex) => (
                                  <li
                                    key={krIndex}
                                    className={`flex items-center justify-between rounded-lg border p-3 ${
                                      darkMode ? "border-gray-600 bg-dark-400" : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    <span className="text-sm">{kr.description}</span>
                                    <span className={`text-sm font-semibold ${darkMode ? "text-primary-400" : "text-primary-600"}`}>
                                      {kr.target_value} {kr.unit}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                              ⏱️ Duración estimada: {rec.estimated_duration_weeks} semanas
                            </span>
                            <button
                              onClick={() => {
                                // TODO: Implement create goal from recommendation
                                alert("Feature coming soon: Crear goal desde recomendación");
                              }}
                              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary-400"
                            >
                              Crear Goal
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Match Health Tab */}
              {activeTab === "health" && (
                <div className="space-y-6">
                  {!matchHealth ? (
                    <div className="flex h-full flex-col items-center justify-center py-20">
                      <span className="text-8xl opacity-20">❤️</span>
                      <p className={`mt-4 text-lg font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        No hay análisis de salud generado
                      </p>
                      <button
                        onClick={loadMatchHealth}
                        className="mt-4 rounded-lg bg-primary-500 px-6 py-2 font-semibold text-black transition hover:bg-primary-400"
                      >
                        Analizar con AI
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Health Score */}
                      <div className={`rounded-xl border p-6 ${
                        darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              Health Score
                            </p>
                            <p className="text-5xl font-bold text-primary-500">{matchHealth.health_score}</p>
                            <span className={`mt-2 inline-block rounded-full px-4 py-1 text-sm font-semibold ${getHealthColor(matchHealth.health_status)}`}>
                              {matchHealth.health_status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="text-8xl opacity-20">
                            {matchHealth.health_status === "excellent" ? "🌟" : 
                             matchHealth.health_status === "good" ? "✅" : 
                             matchHealth.health_status === "needs_attention" ? "⚠️" : "🚨"}
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className={`rounded-lg border p-4 ${
                        darkMode ? "border-blue-700 bg-blue-500/10" : "border-blue-300 bg-blue-50"
                      }`}>
                        <p className={`text-sm ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                          📊 <strong>Análisis de Neuramorphic AI:</strong> {matchHealth.summary}
                        </p>
                      </div>

                      {/* Strengths */}
                      {matchHealth.strengths.length > 0 && (
                        <div className={`rounded-xl border p-6 ${
                          darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"
                        }`}>
                          <h3 className="mb-3 text-lg font-bold flex items-center gap-2">
                            💪 Fortalezas
                          </h3>
                          <ul className="space-y-2">
                            {matchHealth.strengths.map((strength, index) => (
                              <li
                                key={index}
                                className={`flex items-start gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                              >
                                <span className="text-green-400">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk Factors */}
                      {matchHealth.risk_factors.length > 0 && (
                        <div className={`rounded-xl border p-6 ${
                          darkMode ? "border-red-700 bg-red-500/10" : "border-red-300 bg-red-50"
                        }`}>
                          <h3 className="mb-3 text-lg font-bold flex items-center gap-2 text-red-400">
                            ⚠️ Factores de Riesgo
                          </h3>
                          <ul className="space-y-2">
                            {matchHealth.risk_factors.map((risk, index) => (
                              <li
                                key={index}
                                className={`flex items-start gap-2 text-sm ${darkMode ? "text-red-300" : "text-red-700"}`}
                              >
                                <span>•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {matchHealth.recommendations.length > 0 && (
                        <div className={`rounded-xl border p-6 ${
                          darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"
                        }`}>
                          <h3 className="mb-3 text-lg font-bold flex items-center gap-2">
                            💡 Recomendaciones
                          </h3>
                          <ul className="space-y-2">
                            {matchHealth.recommendations.map((rec, index) => (
                              <li
                                key={index}
                                className={`rounded-lg border p-3 text-sm ${
                                  darkMode ? "border-gray-600 bg-dark-400" : "border-gray-300 bg-white"
                                }`}
                              >
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {matchHealth.next_steps.length > 0 && (
                        <div className={`rounded-xl border p-6 ${
                          darkMode ? "border-primary-700 bg-primary-500/10" : "border-primary-300 bg-primary-50"
                        }`}>
                          <h3 className="mb-3 text-lg font-bold flex items-center gap-2">
                            🎯 Próximos Pasos
                          </h3>
                          <ol className="space-y-2">
                            {matchHealth.next_steps.map((step, index) => (
                              <li
                                key={index}
                                className={`flex items-start gap-3 text-sm ${darkMode ? "text-primary-300" : "text-primary-700"}`}
                              >
                                <span className="font-bold">{index + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
