"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Program {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  participants_count: number;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

export default function ClientProgramsPage() {
  const params = useParams();
  const companyId = params?.id as string;
  const [programs, setPrograms] = useState<Program[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    theme: "",
    company_id: companyId,
    status: "designed"
  });

  useEffect(() => {
    if (companyId) {
      setFormData(prev => ({ ...prev, company_id: companyId }));
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    try {
      // Cargar empresa
      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}`
      );
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      // Cargar programas
      const programsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/programs?company_id=${companyId}`
      );
      if (programsRes.ok) {
        const programsData = await programsRes.json();
        setPrograms(programsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      const programData = {
        ...formData,
        status: "designed",
        activities: []
      };
      
      const response = await fetch(`${apiUrl}/api/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(programData),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Programa creado exitosamente:", data);
        loadData();
        resetModal();
      } else {
        const errorData = await response.json();
        console.error("Error al crear programa:", errorData);
        alert("Error al crear el programa: " + (errorData.detail || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error creating program:", error);
      alert("Error de conexión al crear el programa");
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setFormData({
      name: "",
      description: "",
      theme: "",
      company_id: companyId,
      status: "designed"
    });
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración del Cliente</h1>
          <p className="text-gray-600 mt-2">Programas del Cliente</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-black px-6 py-3 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Crear Programa</span>
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin programas activos</h3>
          <p className="text-gray-600">
            Comienza creando un nuevo programa para este cliente usando el botón "Crear Programa" arriba.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Programa</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Participantes</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Fechas</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {programs.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{program.name}</p>
                        <p className="text-sm text-gray-600">{program.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        program.status === "active" ? "bg-green-100 text-green-800" :
                        program.status === "draft" ? "bg-gray-100 text-gray-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {program.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{program.participants_count}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => window.location.href = `/dashboard/programs/${program.id}/manage`}
                        className="text-primary-500 hover:text-primary-600 font-semibold text-sm"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear Programa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Crear Programa</h2>
                  <p className="text-sm text-gray-600 mt-1">Define la información básica del programa</p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <div className="text-sm text-gray-700">
                  <p className="font-bold mb-1">Cliente: {company?.name}</p>
                  <p>El programa será creado automáticamente para este cliente.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Programa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="Ej: Programa de Liderazgo 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="Describe el objetivo general del programa..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tema / Categoría *
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="Ej: Liderazgo, Mentoring, Onboarding..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.name || !formData.description || !formData.theme}
                  className="flex-1 px-6 py-3 bg-primary-500 text-black font-bold rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Programa ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
