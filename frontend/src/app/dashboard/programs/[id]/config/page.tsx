"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  activities_count: number;
  participants_count: number;
  company?: {
    name: string;
  };
}

export default function ProgramConfigPage() {
  const params = useParams();
  const programId = params?.id as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/programs/${programId}`
      );
      if (response.ok) {
        const data = await response.json();
        setProgram(data);
      }
    } catch (error) {
      console.error("Error loading program:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const hasActivities = (program?.activities_count || 0) > 0;
  const hasParticipants = (program?.participants_count || 0) > 0;
  const isConfigComplete = hasActivities && hasParticipants;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Programa</h1>
        <p className="text-gray-600 mt-2">Revisa el estado de configuración antes de lanzar el programa</p>
      </div>

      {/* Alert de configuración incompleta */}
      {!isConfigComplete && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">⚠️ Configuración incompleta</h3>
              <p className="text-yellow-800 mb-4">Completa los siguientes requisitos antes de lanzar el programa:</p>
              <ul className="space-y-2">
                {!hasActivities && (
                  <li className="flex items-center gap-2 text-yellow-800">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    No hay actividades ni entrenamientos configurados
                  </li>
                )}
                {!hasParticipants && (
                  <li className="flex items-center gap-2 text-yellow-800">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    No hay participantes asignados
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Información General */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Información General</h2>
        <p className="text-sm text-gray-600 mb-4">Datos básicos del programa</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre:</label>
            <p className="text-gray-900">{program?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Empresa:</label>
            <p className="text-gray-900">{program?.company?.name || "No asignada"}</p>
          </div>
        </div>
      </div>

      {/* Actividades */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Actividades</h2>
        <p className="text-sm text-gray-600 mb-4">Entrenamientos y eventos del programa</p>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Entrenamientos</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Eventos</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{program?.activities_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Participantes */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Participantes</h2>
        <p className="text-sm text-gray-600 mb-4">Usuarios asignados al programa</p>
        <div>
          <p className="text-sm text-gray-600 mb-1">Total participantes</p>
          <p className="text-3xl font-bold text-gray-900">{program?.participants_count || 0}</p>
        </div>
      </div>

      {/* Lanzar programa */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">¿Todo listo?</h2>
        <p className="text-gray-600 mb-6">
          {isConfigComplete 
            ? "El programa está listo para ser lanzado" 
            : "Completa todos los requisitos antes de lanzar el programa."}
        </p>
        <button
          disabled={!isConfigComplete}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            isConfigComplete
              ? "bg-gradient-to-r from-primary-500 to-primary-600 text-black hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Lanzar Programa
        </button>
      </div>
    </div>
  );
}
