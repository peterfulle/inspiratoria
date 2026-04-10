"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  name: string;
  description: string;
  activity_type: "training" | "event";
  status: string;
  start_date: string | null;
  end_date: string | null;
  program: { id: string; name: string };
  confirmed_count: number;
  attendance_count: number;
  invitations_sent: boolean;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "training" | "event">("all");

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/activities`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeIcon = (type: string) => {
    return type === "training" ? "📚" : "🎉";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "rescheduled": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "created": return "bg-gray-100 text-gray-800 border-gray-200";
      case "closed": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredActivities = activities.filter(a => filter === "all" || a.activity_type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Actividades</h1>
          <p className="text-gray-600 mt-1">ETAPA 4: Ejecución - Gestión de entrenamientos y eventos</p>
        </div>
        <button
          className="flex items-center gap-2 bg-primary-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Actividad
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Actividades</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{activities.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Entrenamientos</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {activities.filter(a => a.activity_type === "training").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Eventos</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {activities.filter(a => a.activity_type === "event").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Completadas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {activities.filter(a => a.status === "completed").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            filter === "all"
              ? "bg-primary-500 text-black"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("training")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            filter === "training"
              ? "bg-primary-500 text-black"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500"
          }`}
        >
          📚 Entrenamientos
        </button>
        <button
          onClick={() => setFilter("event")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            filter === "event"
              ? "bg-primary-500 text-black"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500"
          }`}
        >
          🎉 Eventos
        </button>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No hay actividades disponibles</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all hover:border-primary-500"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                    {getActivityTypeIcon(activity.activity_type)}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(activity.status)}`}>
                      {activity.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{activity.name}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{activity.description}</p>

              {/* Program */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-1">PROGRAMA</p>
                <p className="text-sm font-bold text-gray-900">{activity.program?.name || "Sin programa"}</p>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confirmados:</span>
                  <span className="font-bold text-gray-900">{activity.confirmed_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Asistencia:</span>
                  <span className="font-bold text-gray-900">{activity.attendance_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Invitaciones:</span>
                  {activity.invitations_sent ? (
                    <span className="text-green-600 font-bold text-sm">✓ Enviadas</span>
                  ) : (
                    <span className="text-yellow-600 font-bold text-sm">⏳ Pendiente</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="w-full text-center text-primary-500 hover:text-primary-700 font-bold text-sm">
                  Ver Detalle →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
