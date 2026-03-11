"use client";

import { useEffect, useState } from "react";
import { ApiClient, Goal, KeyResult, Match } from "@/lib/api";

interface GoalsOKRsProps {
  match: Match;
  darkMode?: boolean;
  onClose: () => void;
}

export default function GoalsOKRs({ match, darkMode = false, onClose }: GoalsOKRsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getMatchGoals(match.id);
      setGoals(data);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [match.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-500";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500";
      case "low":
        return "bg-green-500/20 text-green-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400";
      case "blocked":
        return "bg-red-500/20 text-red-500";
      case "not_started":
        return "bg-gray-500/20 text-gray-500";
      case "cancelled":
        return "bg-orange-500/20 text-orange-500";
      default:
        return "bg-gray-500/20 text-gray-500";
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
            <h2 className="text-2xl font-bold">🎯 Goals & OKRs</h2>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {match.mentor.full_name} ↔ {match.mentee.full_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400"
            >
              + Nuevo Goal
            </button>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            </div>
          ) : goals.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <span className="text-8xl opacity-20">🎯</span>
              <p className={`mt-4 text-lg font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                No hay goals definidos
              </p>
              <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Crea el primer goal para empezar a trackear el progreso
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`rounded-xl border p-6 ${
                    darkMode ? "border-gray-700 bg-dark-300" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {/* Goal Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(goal.priority)}`}>
                          {goal.priority.toUpperCase()}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(goal.status)}`}>
                          {goal.status.replace("_", " ").toUpperCase()}
                        </span>
                        {goal.is_overdue && (
                          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                            ⚠️ VENCIDO
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold">{goal.title}</h3>
                      <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {goal.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedGoal(goal)}
                      className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                        darkMode
                          ? "hover:bg-dark-400"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      Ver detalles
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Progreso</span>
                      <span className="font-bold text-primary-500">{goal.progress_percentage}%</span>
                    </div>
                    <div className={`h-3 overflow-hidden rounded-full ${
                      darkMode ? "bg-dark-500" : "bg-gray-200"
                    }`}>
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Results */}
                  {goal.key_results && goal.key_results.length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Key Results:
                      </p>
                      {goal.key_results.map((kr) => (
                        <div
                          key={kr.id}
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            darkMode ? "border-gray-600 bg-dark-400" : "border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={kr.completed}
                              onChange={async () => {
                                try {
                                  await ApiClient.updateKeyResult(kr.id, {
                                    current_value: kr.current_value,
                                    completed: !kr.completed,
                                  });
                                  await loadGoals();
                                } catch (error) {
                                  console.error("Error updating KR:", error);
                                }
                              }}
                              className="h-5 w-5 cursor-pointer"
                            />
                            <span className={kr.completed ? "line-through opacity-60" : ""}>
                              {kr.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {kr.current_value} / {kr.target_value} {kr.unit}
                            </span>
                            <span className="font-semibold text-primary-500">
                              {Math.round(kr.progress_percentage)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className={`mt-4 flex items-center justify-between border-t pt-3 text-xs ${
                    darkMode ? "border-gray-600 text-gray-500" : "border-gray-300 text-gray-500"
                  }`}>
                    <span>
                      Fecha límite: {new Date(goal.time_bound).toLocaleDateString("es-ES")}
                    </span>
                    <span>
                      {goal.days_remaining > 0
                        ? `${goal.days_remaining} días restantes`
                        : `Vencido hace ${Math.abs(goal.days_remaining)} días`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <CreateGoalModal
            matchId={match.id}
            darkMode={darkMode}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadGoals();
            }}
          />
        )}

        {/* Goal Detail Modal */}
        {selectedGoal && (
          <GoalDetailModal
            goal={selectedGoal}
            darkMode={darkMode}
            onClose={() => setSelectedGoal(null)}
            onUpdate={() => {
              setSelectedGoal(null);
              loadGoals();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Goal Modal Component
function CreateGoalModal({
  matchId,
  darkMode,
  onClose,
  onSuccess,
}: {
  matchId: number;
  darkMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal_type: "skill",
    priority: "medium",
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    time_bound: "",
    key_results: [{ description: "", target_value: 0, unit: "" }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createGoal({
        match_id: matchId,
        ...formData,
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("Error al crear el goal");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 shadow-2xl ${
        darkMode
          ? "border-gray-700 bg-dark-400"
          : "border-gray-200 bg-white"
      }`}>
        <h3 className="text-2xl font-bold mb-6">Crear Nuevo Goal</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 ${
                  darkMode
                    ? "border-gray-700 bg-dark-300 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}>
                Tipo
              </label>
              <select
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 ${
                  darkMode
                    ? "border-gray-700 bg-dark-300 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
              >
                <option value="skill">Desarrollo de Habilidad</option>
                <option value="career">Crecimiento de Carrera</option>
                <option value="project">Proyecto Específico</option>
                <option value="leadership">Liderazgo</option>
                <option value="technical">Técnico</option>
                <option value="soft_skill">Habilidad Blanda</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              Descripción *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2 ${
                darkMode
                  ? "border-gray-700 bg-dark-300 text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
            />
          </div>

          {/* SMART Criteria */}
          <div className="space-y-3">
            <p className="font-semibold">Criterios SMART:</p>
            
            {[
              { key: "specific", label: "Specific: ¿Qué quiero lograr exactamente?" },
              { key: "measurable", label: "Measurable: ¿Cómo mediré el progreso?" },
              { key: "achievable", label: "Achievable: ¿Es realista con los recursos disponibles?" },
              { key: "relevant", label: "Relevant: ¿Por qué es importante?" },
            ].map((field) => (
              <div key={field.key}>
                <label className={`block text-sm font-medium mb-1 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  {field.label} *
                </label>
                <input
                  type="text"
                  required
                  value={formData[field.key as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-2 ${
                    darkMode
                      ? "border-gray-700 bg-dark-300 text-white"
                      : "border-gray-300 bg-white text-black"
                  }`}
                />
              </div>
            ))}

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Time-bound: Fecha límite *
              </label>
              <input
                type="date"
                required
                value={formData.time_bound}
                onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 ${
                  darkMode
                    ? "border-gray-700 bg-dark-300 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg border px-4 py-2 font-semibold transition ${
                darkMode
                  ? "border-gray-600 text-gray-300 hover:border-gray-500"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400"
            >
              Crear Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Goal Detail Modal (placeholder - puedes expandir)
function GoalDetailModal({
  goal,
  darkMode,
  onClose,
  onUpdate,
}: {
  goal: Goal;
  darkMode: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl border p-6 shadow-2xl ${
        darkMode
          ? "border-gray-700 bg-dark-400"
          : "border-gray-200 bg-white"
      }`}>
        <h3 className="text-2xl font-bold mb-4">{goal.title}</h3>
        
        <div className="space-y-4">
          <div>
            <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Specific
            </p>
            <p>{goal.specific}</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Measurable
            </p>
            <p>{goal.measurable}</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Achievable
            </p>
            <p>{goal.achievable}</p>
          </div>
          <div>
            <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Relevant
            </p>
            <p>{goal.relevant}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
