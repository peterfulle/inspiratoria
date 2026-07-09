"use client";

import React, { useState, useEffect } from "react";
import { backendUrl, apiFetch } from "@/lib/api";
interface Program {
  id: number;
  name: string;
  description: string;
  theme: string;
  status: "draft" | "active" | "paused" | "completed";
  created_at: string;
  updated_at: string;
}

interface ProgramFormData {
  name: string;
  description: string;
  theme: string;
}

interface ProgramManagementProps {
  darkMode?: boolean;
}

const STATUS_COLORS = {
  draft: { bg: "bg-gray-500", text: "text-gray-100" },
  active: { bg: "bg-green-500", text: "text-green-100" },
  paused: { bg: "bg-yellow-500", text: "text-yellow-100" },
  completed: { bg: "bg-blue-500", text: "text-blue-100" },
};

const STATUS_LABELS = {
  draft: "Borrador",
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
};

export default function ProgramManagement({ darkMode }: ProgramManagementProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    description: "",
    theme: "General",
  });
  const [formErrors, setFormErrors] = useState<Partial<ProgramFormData>>({});

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await apiFetch(`${backendUrl}/api/programs`, { headers });
      if (!response.ok) throw new Error("Error al cargar programas");
      
      const data = await response.json();
      setPrograms(data);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<ProgramFormData> = {};
    
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    } else if (formData.name.length < 3) {
      errors.name = "El nombre debe tener al menos 3 caracteres";
    }
    
    if (!formData.description.trim()) {
      errors.description = "La descripción es requerida";
    } else if (formData.description.length < 10) {
      errors.description = "La descripción debe tener al menos 10 caracteres";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`${backendUrl}/api/programs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al crear programa");

      await fetchPrograms();
      setShowCreateModal(false);
      setFormData({ name: "", description: "", theme: "General" });
      setFormErrors({});
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear el programa");
    }
  };

  const handleEdit = async () => {
    if (!selectedProgram || !validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`${backendUrl}/api/programs/${selectedProgram.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al actualizar programa");

      await fetchPrograms();
      setShowEditModal(false);
      setSelectedProgram(null);
      setFormData({ name: "", description: "", theme: "General" });
      setFormErrors({});
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el programa");
    }
  };

  const handleDelete = async () => {
    if (!selectedProgram) return;

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`${backendUrl}/api/programs/${selectedProgram.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar programa");

      await fetchPrograms();
      setShowDeleteModal(false);
      setSelectedProgram(null);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el programa");
    }
  };

  const handleStatusChange = async (program: Program, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`${backendUrl}/api/programs/${program.id}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al cambiar estado");

      await fetchPrograms();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar el estado del programa");
    }
  };

  const openEditModal = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      theme: program.theme,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (program: Program) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log("🔍 Estado actual:");
  console.log("- Total programs:", programs.length);
  console.log("- Filtered programs:", filteredPrograms.length);
  console.log("- Search term:", searchTerm);
  console.log("- Status filter:", statusFilter);

  if (loading) {
    return (
      <div className={`p-6 ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded w-1/3`}></div>
          <div className={`h-64 ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className={`${darkMode ? "bg-gray-800/50" : "bg-white"} rounded-2xl p-6 shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Gestión de Programas
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {filteredPrograms.length} programa(s) encontrado(s)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Actualizado hace un momento
            </div>
            <button
              onClick={() => {
                setFormData({ name: "", description: "", theme: "General" });
                setFormErrors({});
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Programa
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={`${darkMode ? "bg-gray-800/50" : "bg-white"} rounded-2xl p-6 shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar programas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-4 py-2 rounded-lg border ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Completado</option>
          </select>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <div
            key={program.id}
            className={`p-6 rounded-2xl ${
              darkMode ? "bg-gray-800/50" : "bg-white"
            } shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"} hover:shadow-md transition-all duration-300`}
          >
            {/* Header with title and subtle status indicator */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {program.name}
                </h3>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  program.status === "active" 
                    ? darkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"
                    : program.status === "draft"
                    ? darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
                    : program.status === "paused"
                    ? darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700"
                    : darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-700"
                }`}>
                  {STATUS_LABELS[program.status]}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className={`text-sm mb-4 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {program.description.length > 120
                ? String(program.description).substring(0, 120) + "..."
                : program.description}
            </p>

            {/* Theme and Date - Clean info line */}
            <div className={`flex items-center justify-between text-xs mb-6 pb-4 border-b ${darkMode ? "border-gray-700 text-gray-500" : "border-gray-200 text-gray-500"}`}>
              <span>Tema: {program.theme}</span>
              <span>
                {program.created_at && !isNaN(new Date(program.created_at).getTime())
                  ? new Date(program.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                  : "Fecha no disponible"}
              </span>
            </div>

            {/* Action Buttons - Minimal and clean */}
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(program)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode 
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
              
              {/* Status dropdown menu */}
              <div className="relative group">
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                }`}>
                  {program.status !== "active" && (
                    <button
                      onClick={() => handleStatusChange(program, "active")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Activar
                    </button>
                  )}
                  {program.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(program, "paused")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Pausar
                    </button>
                  )}
                  {program.status !== "draft" && (
                    <button
                      onClick={() => handleStatusChange(program, "draft")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Marcar borrador
                    </button>
                  )}
                  {program.status !== "completed" && (
                    <button
                      onClick={() => handleStatusChange(program, "completed")}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Completar
                    </button>
                  )}
                  <div className={`border-t my-1 ${darkMode ? "border-gray-700" : "border-gray-200"}`}></div>
                  <button
                    onClick={() => openDeleteModal(program)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      darkMode ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-600"
                    }`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          <p className="text-lg">No se encontraron programas</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-8 max-w-2xl w-full mx-4`}>
            <h3 className="text-2xl font-bold mb-6">Crear Nuevo Programa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Programa *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    formErrors.name ? "border-red-500" : darkMode ? "border-gray-700" : "border-gray-300"
                  } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
                  placeholder="Ej: Programa de Mentoring 2024"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    formErrors.description ? "border-red-500" : darkMode ? "border-gray-700" : "border-gray-300"
                  } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
                  placeholder="Describe el propósito y objetivos del programa..."
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tema</label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="Ej: Liderazgo, Tecnología, Negocios..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleCreate}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Crear Programa
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", description: "", theme: "General" });
                  setFormErrors({});
                }}
                className={`px-6 py-3 rounded-lg transition font-medium ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-8 max-w-2xl w-full mx-4`}>
            <h3 className="text-2xl font-bold mb-6">Editar Programa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Programa *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    formErrors.name ? "border-red-500" : darkMode ? "border-gray-700" : "border-gray-300"
                  } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    formErrors.description ? "border-red-500" : darkMode ? "border-gray-700" : "border-gray-300"
                  } ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tema</label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? "bg-gray-700 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleEdit}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProgram(null);
                  setFormData({ name: "", description: "", theme: "General" });
                  setFormErrors({});
                }}
                className={`px-6 py-3 rounded-lg transition font-medium ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-8 max-w-md w-full mx-4`}>
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-4">¿Eliminar Programa?</h3>
              <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                ¿Estás seguro de que deseas eliminar el programa <strong>{selectedProgram.name}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProgram(null);
                  }}
                  className={`flex-1 px-6 py-3 rounded-lg transition font-medium ${
                    darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
