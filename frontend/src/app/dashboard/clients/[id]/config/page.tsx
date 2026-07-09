"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  plan: string;
  primary_color: string;
  secondary_color: string;
  max_users: number;
  max_programs: number;
  is_enabled: boolean;
}

export default function ClientConfigPage() {
  const params = useParams();
  const companyId = params?.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#FFD700");
  const [secondaryColor, setSecondaryColor] = useState("#1E293B");

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
        setPrimaryColor(companyData.primary_color || "#FFD700");
        setSecondaryColor(companyData.secondary_color || "#1E293B");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primary_color: primaryColor,
            secondary_color: secondaryColor,
          }),
        }
      );
      if (response.ok) {
        alert("Colores actualizados correctamente");
        loadData();
      }
    } catch (error) {
      console.error("Error saving colors:", error);
    }
  };

  const handleDeleteCompany = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${company?.name}? Esta acción es IRREVERSIBLE.`)) {
      return;
    }

    const confirmText = prompt("Escribe el nombre de la empresa para confirmar:");
    if (confirmText !== company?.name) {
      alert("El nombre no coincide. Cancelando eliminación.");
      return;
    }

    try {
      const response = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        alert("Empresa eliminada correctamente");
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Error deleting company:", error);
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
        <p className="text-gray-600 mt-2">Configuración del Cliente</p>
      </div>

      <p className="text-gray-600 mb-6">Administra configuraciones avanzadas y opciones peligrosas</p>

      {/* Plan y Límites */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Plan y Límites</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Plan Actual</p>
            <p className="text-xl font-bold text-gray-900">{company?.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Usuarios Máximos</p>
            <p className="text-xl font-bold text-gray-900">{company?.max_users}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Programas Máximos</p>
            <p className="text-xl font-bold text-gray-900">{company?.max_programs}</p>
          </div>
        </div>
      </div>

      {/* Colores de Marca */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Colores de Marca</h2>
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color Primario
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleSaveColors}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-black rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all"
        >
          Guardar Colores
        </button>
      </div>

      {/* Zona de Peligro */}
      <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-900 mb-2">Zona de Peligro</h2>
        <p className="text-sm text-red-700 mb-6">
          Las acciones en esta sección son irreversibles y eliminarán permanentemente todos los datos asociados.
        </p>
        <button
          onClick={handleDeleteCompany}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          Eliminar Cliente Permanentemente
        </button>
      </div>
    </div>
  );
}
