"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Company {
  name: string;
  plan: string;
}

export default function ClientBillingPage() {
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
      const companyRes = await apiFetch(
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
        <p className="text-gray-600 mt-2">Facturación</p>
      </div>

      {/* Plan Actual */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Plan Actual</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{company?.plan || "Trial"}</p>
            <p className="text-sm text-gray-600 mt-1">Renovación automática</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-black rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all">
            Cambiar Plan
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Facturas Pagadas</p>
          <p className="text-3xl font-bold text-green-600 mt-1">12</p>
          <p className="text-xs text-gray-500 mt-1">Últimos 12 meses</p>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Pendientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
          <p className="text-xs text-gray-500 mt-1">Al día</p>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de Facturación</h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No hay facturas disponibles</h3>
          <p className="text-gray-600">Las facturas aparecerán aquí cuando se generen</p>
        </div>
      </div>
    </div>
  );
}
