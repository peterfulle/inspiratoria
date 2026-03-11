"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Company {
  name: string;
  onboarding_completed: boolean;
  is_data_complete: boolean;
}

export default function ClientSetupPage() {
  const params = useParams();
  const companyId = params?.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    try {
      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}`
      );
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Completar perfil de empresa",
      status: company?.is_data_complete ? "completed" : "pending",
      description: "Información básica y legal de la empresa"
    },
    {
      title: "Crear primer programa",
      status: "pending",
      description: "Diseña el programa de mentoring"
    },
    {
      title: "Invitar usuarios",
      status: "pending",
      description: "Agrega tu equipo a la plataforma"
    },
    {
      title: "Configurar branding",
      status: "pending",
      description: "Personaliza colores y logo"
    },
    {
      title: "Lanzamiento oficial",
      status: company?.onboarding_completed ? "completed" : "pending",
      description: "Activa la plataforma"
    }
  ];

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Administración del Cliente</h1>
        <p className="text-gray-600 mt-2">Proceso de Onboarding</p>
      </div>

      {/* Progreso */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Progreso General</h2>
          <span className="text-2xl font-bold text-primary-500">{completedSteps}/{steps.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">{progress}% completado</p>
      </div>

      {/* Pasos */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <p className="text-gray-600 mb-6">Sigue estos pasos para configurar completamente tu cuenta</p>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                step.status === "completed"
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step.status === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}>
                {step.status === "completed" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                step.status === "completed"
                  ? "bg-green-200 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {step.status === "completed" ? "Completado" : "Pendiente"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
