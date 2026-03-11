"use client";

import { useState, useEffect } from "react";

interface Alert {
  id: string;
  program: { id: string; name: string };
  activity: { id: string; name: string } | null;
  alert_type: string;
  description: string;
  status: string;
  action_taken: string;
  created_at: string;
  resolved_at: string | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/alerts`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "activity_delayed": return "⏰";
      case "low_confirmation": return "📉";
      case "low_attendance": return "🚫";
      case "pending_surveys": return "📝";
      case "match_pending": return "🔗";
      default: return "⚠️";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "activity_delayed": return "Actividad Atrasada";
      case "low_confirmation": return "Baja Confirmación";
      case "low_attendance": return "Baja Asistencia";
      case "pending_surveys": return "Encuestas Pendientes";
      case "match_pending": return "Match Pendiente";
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-800 border-red-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "dismissed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case "activity_delayed":
      case "low_attendance":
        return "border-l-4 border-l-red-500";
      case "low_confirmation":
      case "pending_surveys":
        return "border-l-4 border-l-yellow-500";
      case "match_pending":
        return "border-l-4 border-l-blue-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === "all") return true;
    if (filter === "active") return a.status === "active" || a.status === "in_progress";
    return a.status === "resolved";
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alertas Operativas</h1>
        <p className="text-gray-600 mt-1">ETAPA 5: Seguimiento - Monitoreo y acciones correctivas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Activas</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {alerts.filter(a => a.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">En Proceso</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {alerts.filter(a => a.status === "in_progress").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Resueltas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {alerts.filter(a => a.status === "resolved").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{alerts.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter("active")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            filter === "active"
              ? "bg-primary-500 text-black"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500"
          }`}
        >
          🚨 Activas
        </button>
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
          onClick={() => setFilter("resolved")}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${
            filter === "resolved"
              ? "bg-primary-500 text-black"
              : "bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500"
          }`}
        >
          ✅ Resueltas
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl font-bold text-gray-900 mb-2">¡No hay alertas!</p>
            <p className="text-gray-600">Todo está funcionando correctamente.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all ${getPriorityColor(alert.alert_type)}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  {getAlertIcon(alert.alert_type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {getAlertTypeLabel(alert.alert_type)}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">PROGRAMA</p>
                      <p className="text-sm font-bold text-gray-900">{alert.program?.name || "Sin programa"}</p>
                    </div>
                    {alert.activity && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">ACTIVIDAD</p>
                        <p className="text-sm font-bold text-gray-900">{alert.activity.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Taken */}
                  {alert.action_taken && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-xs text-blue-600 font-bold mb-2">ACCIÓN CORRECTIVA</p>
                      <p className="text-sm text-blue-900">{alert.action_taken}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Creada: {new Date(alert.created_at).toLocaleDateString("es-ES")}
                      {alert.resolved_at && (
                        <span className="ml-4">
                          Resuelta: {new Date(alert.resolved_at).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </div>
                    {alert.status === "active" && (
                      <button className="text-primary-500 hover:text-primary-700 font-bold text-sm">
                        Gestionar →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
