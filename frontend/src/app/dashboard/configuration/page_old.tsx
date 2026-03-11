"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [canDelete, setCanDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Countdown cuando se muestra la confirmación
  useEffect(() => {
    if (showConfirmation && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanDelete(true);
    }
  }, [showConfirmation, countdown]);

  const handleDeleteAllData = async () => {
    if (confirmText !== "ELIMINAR TODO") {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8001/api/clear-all-data", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Mostrar mensaje de éxito por 3 segundos antes de redirigir
        setTimeout(() => {
          localStorage.clear();
          router.push("/login");
        }, 3000);
      } else {
        // Mostrar error detallado
        const errorMsg = typeof data.detail === 'string' 
          ? data.detail 
          : JSON.stringify(data.detail, null, 2);
        setError(errorMsg);
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error al eliminar datos:", error);
      setError(`Error de conexión: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gray-900 rounded-xl">
            <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Gestión avanzada y mantenimiento de la plataforma</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-1">✅ Datos eliminados exitosamente</h3>
              <p className="text-green-700">Redirigiendo al login...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">❌ Error al eliminar datos</h3>
              <pre className="text-sm text-red-700 bg-red-100 p-3 rounded overflow-auto max-h-40">
                {error}
              </pre>
              <button
                onClick={() => {
                  setError(null);
                  setShowConfirmation(false);
                  setConfirmText("");
                  setCountdown(3);
                  setCanDelete(false);
                }}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Message */}
      {loading && !success && !error && (
        <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-1">✅ Eliminando datos...</h3>
              <p className="text-green-700">La base de datos está siendo limpiada. Serás redirigido al login.</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Card */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-8 mb-6 shadow-lg">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0 p-3 bg-red-600 rounded-xl shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-red-900 mb-3 flex items-center gap-2">
              ⚠️ Zona de Peligro
              <span className="text-xs px-3 py-1 bg-red-600 text-white rounded-full font-semibold">IRREVERSIBLE</span>
            </h3>
            <p className="text-red-800 mb-4 text-lg">
              Las acciones en esta sección son <strong>permanentes e irreversibles</strong>. Todos los datos serán eliminados sin posibilidad de recuperación.
            </p>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-red-200">
              <p className="text-sm font-semibold text-red-900 mb-3">Se eliminarán:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🏢", text: "Todas las empresas/organizaciones" },
                  { icon: "📚", text: "Todos los programas" },
                  { icon: "👥", text: "Todos los usuarios" },
                  { icon: "🤝", text: "Todos los matches" },
                  { icon: "📊", text: "Todas las métricas" },
                  { icon: "🎯", text: "Todas las actividades" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-red-800">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete All Data Section */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-xl">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Eliminar Todos los Datos</h2>
            <p className="text-gray-600">
              Esta acción eliminará <strong className="text-red-600">PERMANENTEMENTE</strong> todos los registros de la base de datos y cerrará tu sesión.
            </p>
          </div>
        </div>

        {!showConfirmation ? (
          <button
            onClick={() => {
              setShowConfirmation(true);
              setCountdown(3);
              setCanDelete(false);
            }}
            className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar Todos los Datos
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-8 space-y-6">
            {/* Countdown */}
            {countdown > 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-600 rounded-full mb-4 shadow-xl animate-pulse">
                  <span className="text-5xl font-bold text-white">{countdown}</span>
                </div>
                <p className="text-lg font-semibold text-gray-700">Preparando confirmación...</p>
              </div>
            )}

            {/* Confirmation Form */}
            {canDelete && (
              <>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    ⚠️ Confirmación Requerida
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Para confirmar esta acción <strong>IRREVERSIBLE</strong>, escribe exactamente el texto que aparece abajo:
                  </p>
                  <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl shadow-lg mb-4">
                    <p className="text-3xl font-mono font-bold text-white text-center tracking-wider">
                      ELIMINAR TODO
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                      placeholder="Escribe: ELIMINAR TODO"
                      className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg font-mono focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                      disabled={loading}
                      autoFocus
                    />
                    {confirmText && confirmText !== "ELIMINAR TODO" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {confirmText === "ELIMINAR TODO" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleDeleteAllData}
                    disabled={loading || confirmText !== "ELIMINAR TODO"}
                    className={`flex-1 px-8 py-4 font-bold text-lg rounded-xl transition-all shadow-lg ${
                      loading || confirmText !== "ELIMINAR TODO"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-xl"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Eliminando...
                      </span>
                    ) : "✓ Confirmar Eliminación"}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setConfirmText("");
                      setCountdown(3);
                      setCanDelete(false);
                    }}
                    disabled={loading}
                    className="px-8 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-lg rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1 text-lg">💡 Información</h4>
            <p className="text-blue-800">
              Esta función está diseñada para entornos de <strong>desarrollo y testing</strong>. En producción, siempre realiza backups antes de realizar operaciones destructivas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
