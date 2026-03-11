"use client";

import React, { useState } from "react";

// ================================================================================
// TIPOS
// ================================================================================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company?: string;
  is_onboarded: boolean;
}

export interface Participant {
  id: string;
  user: User;
  program_id: string;
  role: string;
  status: string;
  invitation_sent_at?: string;
  activated_at?: string;
  last_access_at?: string;
  configuration: any;
  created_at: string;
  updated_at: string;
}

export interface TableViewProps {
  participants: Participant[];
  programId: string;
  onEdit: (participantId: string) => void;
  onDelete: (participantId: string) => void;
  onBack: () => void;
}

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================

export function TableView(props: TableViewProps) {
  const { participants, programId, onEdit, onDelete, onBack } = props;

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  // Filtrar participantes
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.last_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Manejar selección
  const toggleSelectParticipant = (id: string) => {
    const newSelection = new Set(selectedParticipants);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedParticipants(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map((p) => p.id)));
    }
  };

  // Manejar acciones masivas
  const handleBulkAction = (action: string) => {
    if (selectedParticipants.size === 0) {
      alert("⚠️ Selecciona al menos un participante");
      return;
    }

    switch (action) {
      case "activate":
        alert(`✅ Activando ${selectedParticipants.size} participantes...`);
        // TODO: Implementar lógica de activación masiva
        break;
      case "suspend":
        alert(`⏸️ Suspendiendo ${selectedParticipants.size} participantes...`);
        // TODO: Implementar lógica de suspensión masiva
        break;
      case "delete":
        if (confirm(`¿Seguro que deseas eliminar ${selectedParticipants.size} participantes?`)) {
          alert(`🗑️ Eliminando ${selectedParticipants.size} participantes...`);
          // TODO: Implementar lógica de eliminación masiva
        }
        break;
      default:
        break;
    }
  };

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📋 Tabla de Participantes</h2>
            <p className="text-gray-600 mt-1">
              Mostrando {filteredParticipants.length} de {participants.length} participantes
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 text-primary-600 hover:text-primary-700 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al Dashboard
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">🔍 Buscar</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Email, nombre o apellido..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtro de rol */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🎭 Rol</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="participant">Participante</option>
              <option value="instructor">Instructor</option>
              <option value="administrator">Administrador</option>
              <option value="observer">Observador</option>
            </select>
          </div>

          {/* Filtro de estado */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📊 Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="suspended">Suspendido</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedParticipants.size > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900">
              {selectedParticipants.size} participante(s) seleccionado(s)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm"
              >
                ✅ Activar
              </button>
              <button
                onClick={() => handleBulkAction("suspend")}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold text-sm"
              >
                ⏸️ Suspender
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredParticipants.length > 0 &&
                      selectedParticipants.size === filteredParticipants.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fecha Alta</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    {participants.length === 0 ? (
                      <>
                        <svg
                          className="w-16 h-16 mx-auto text-gray-300 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="font-bold mb-2">No hay participantes</p>
                        <p className="text-sm">Agrega participantes desde el dashboard</p>
                      </>
                    ) : (
                      <p>No se encontraron participantes con los filtros seleccionados</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="hover:bg-gray-50 transition-all"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.has(participant.id)}
                        onChange={() => toggleSelectParticipant(participant.id)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-sm">
                            {participant.user.first_name[0]}{participant.user.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {participant.user.first_name} {participant.user.last_name}
                          </p>
                          {participant.user.company && (
                            <p className="text-xs text-gray-500">{participant.user.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{participant.user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        {participant.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          participant.status === "active"
                            ? "bg-green-100 text-green-700"
                            : participant.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : participant.status === "suspended"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {participant.status === "active" && "🟢 Activo"}
                        {participant.status === "pending" && "🟡 Pendiente"}
                        {participant.status === "suspended" && "🟠 Suspendido"}
                        {participant.status === "inactive" && "⚪ Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(participant.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(participant.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(participant.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
