"use client";

import React, { useState } from "react";

// ================================================================================
// TIPOS
// ================================================================================

export type IndividualStep = "search" | "found" | "create" | "role" | "vinculation" | "confirm";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company?: string;
  is_onboarded: boolean;
}

export interface NewUserForm {
  nombre: string;
  apellidos: string;
  email: string;
}

export interface IndividualLoadViewProps {
  step: IndividualStep;
  searchQuery: string;
  searchResults: User[];
  selectedUser: User | null;
  newUserForm: NewUserForm;
  selectedRole: string;
  requiresVinculation: boolean;
  vinculationType: string;
  vinculationMatch: User | null;
  programId: string;
  onSearch: (query: string) => void;
  onSelectUser: (user: User) => void;
  onAssociateUser: () => void;
  onCreateNew: () => void;
  onUpdateForm: (form: NewUserForm) => void;
  onContinueToRole: () => void;
  onSelectRole: (role: string) => void;
  onToggleVinculation: (value: boolean) => void;
  onSelectVinculationType: (type: string) => void;
  onSelectMatch: (user: User | null) => void;
  onContinueToVinculation: () => void;
  onContinueToConfirm: () => void;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================

export function IndividualLoadView(props: IndividualLoadViewProps) {
  const {
    step,
    searchQuery,
    searchResults,
    selectedUser,
    newUserForm,
    selectedRole,
    requiresVinculation,
    vinculationType,
    vinculationMatch,
    programId,
    onSearch,
    onSelectUser,
    onAssociateUser,
    onCreateNew,
    onUpdateForm,
    onContinueToRole,
    onSelectRole,
    onToggleVinculation,
    onSelectVinculationType,
    onSelectMatch,
    onContinueToVinculation,
    onContinueToConfirm,
    onConfirm,
    onBack,
    onCancel,
  } = props;

  // Estados locales para búsqueda de vinculaciones
  const [vinculationSearchQuery, setVinculationSearchQuery] = useState("");
  const [vinculationSearchResults, setVinculationSearchResults] = useState<User[]>([]);

  // ================================================================================
  // PASO 1: BÚSQUEDA
  // ================================================================================

  if (step === "search") {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🔍 Paso 1: Buscar Usuario</h2>
          <p className="text-gray-600">
            Busca al usuario en el sistema escribiendo su nombre, apellido o email
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Escribe nombre, apellido o email..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: Escribe al menos 2 caracteres para buscar
          </p>
        </div>

        {/* Resultados de búsqueda */}
        {searchQuery.length >= 2 && (
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-700 mb-3">
              {searchResults.length > 0
                ? `📋 ${searchResults.length} resultado(s) encontrado(s)`
                : "❌ No se encontraron resultados"}
            </p>

            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-lg">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-700">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.company && (
                          <p className="text-xs text-gray-500 mt-1">🏢 {user.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        user.is_onboarded
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {user.is_onboarded ? "✓ Activo" : "⏳ Pendiente"}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-600 font-bold mb-2">
                  No encontramos usuarios con ese criterio
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Verifica el email o nombre, o crea un nuevo usuario
                </p>
                <button
                  onClick={onCreateNew}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Crear Nuevo Usuario
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 2: USUARIO ENCONTRADO
  // ================================================================================

  if (step === "found" && selectedUser) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Paso 2: Usuario Encontrado</h2>
          <p className="text-gray-600">Confirma que este es el usuario correcto</p>
        </div>

        {/* Tarjeta de usuario */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-3xl">
                {selectedUser.first_name[0]}{selectedUser.last_name[0]}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-700">{selectedUser.email}</span>
                </div>
                {selectedUser.company && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className="text-gray-700">{selectedUser.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <span className={`px-4 py-2 text-sm font-bold rounded-full ${
                    selectedUser.is_onboarded
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {selectedUser.is_onboarded ? "✓ Usuario Activo" : "⏳ Onboarding Pendiente"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Siguiente paso:</strong> Asignarás un rol a este usuario dentro del programa
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Buscar Otro
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={onAssociateUser}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold flex items-center gap-2"
            >
              Continuar
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 3: CREAR NUEVO USUARIO
  // ================================================================================

  if (step === "create") {
    const validateEmail = (email: string): boolean => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    const isFormValid = (): boolean => {
      return (
        newUserForm.nombre.length >= 2 &&
        newUserForm.apellidos.length >= 2 &&
        validateEmail(newUserForm.email)
      );
    };

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Crear Nuevo Usuario</h2>
          <p className="text-gray-600">
            Completa los datos del nuevo usuario que agregarás al programa
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newUserForm.nombre}
              onChange={(e) =>
                onUpdateForm({ ...newUserForm, nombre: e.target.value })
              }
              placeholder="Juan"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {newUserForm.nombre.length > 0 && newUserForm.nombre.length < 2 && (
              <p className="text-sm text-red-500 mt-1">Mínimo 2 caracteres</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newUserForm.apellidos}
              onChange={(e) =>
                onUpdateForm({ ...newUserForm, apellidos: e.target.value })
              }
              placeholder="Pérez García"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {newUserForm.apellidos.length > 0 && newUserForm.apellidos.length < 2 && (
              <p className="text-sm text-red-500 mt-1">Mínimo 2 caracteres</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email Corporativo <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newUserForm.email}
              onChange={(e) =>
                onUpdateForm({ ...newUserForm, email: e.target.value })
              }
              placeholder="juan.perez@empresa.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {newUserForm.email.length > 0 && !validateEmail(newUserForm.email) && (
              <p className="text-sm text-red-500 mt-1">Email inválido</p>
            )}
          </div>
        </div>

        {/* Información */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>📧 Nota:</strong> Se enviará una invitación por email al usuario para que complete
            su registro
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={onContinueToRole}
              disabled={!isFormValid()}
              className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 ${
                isFormValid()
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continuar
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 4: ASIGNAR ROL
  // ================================================================================

  if (step === "role") {
    const roles = [
      {
        value: "participant",
        label: "👤 Participante",
        description: "Usuario regular del programa sin permisos administrativos",
        color: "blue",
      },
      {
        value: "instructor",
        label: "👨‍🏫 Instructor",
        description: "Puede facilitar actividades y dar seguimiento a participantes",
        color: "purple",
      },
      {
        value: "administrator",
        label: "⚙️ Administrador",
        description: "Control total sobre el programa y sus participantes",
        color: "red",
      },
      {
        value: "observer",
        label: "👁️ Observador",
        description: "Solo puede ver el programa sin editar",
        color: "gray",
      },
    ];

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎭 Paso 3: Asignar Rol</h2>
          <p className="text-gray-600">Selecciona el rol que tendrá este usuario en el programa</p>
        </div>

        {/* Usuario seleccionado */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold">
                {selectedUser ? `${selectedUser.first_name[0]}${selectedUser.last_name[0]}` : `${newUserForm.nombre[0]}${newUserForm.apellidos[0]}`}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : `${newUserForm.nombre} ${newUserForm.apellidos}`}
              </p>
              <p className="text-sm text-gray-600">
                {selectedUser ? selectedUser.email : newUserForm.email}
              </p>
            </div>
          </div>
        </div>

        {/* Selección de roles */}
        <div className="space-y-3 mb-6">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => onSelectRole(role.value)}
              className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                selectedRole === role.value
                  ? `border-${role.color}-500 bg-${role.color}-50 shadow-lg`
                  : "border-gray-200 hover:border-gray-300 hover:shadow"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{role.label}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === role.value
                      ? `border-${role.color}-500 bg-${role.color}-500`
                      : "border-gray-300"
                  }`}
                >
                  {selectedRole === role.value && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Información */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Puedes cambiar el rol más adelante desde la tabla de participantes
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={onContinueToVinculation}
              disabled={!selectedRole}
              className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 ${
                selectedRole
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continuar
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 5: VINCULACIÓN (OPCIONAL)
  // ================================================================================

  if (step === "vinculation") {
    // Buscar participantes para vincular
    const searchVinculation = async (query: string) => {
      if (query.length < 2) {
        setVinculationSearchResults([]);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
        const response = await fetch(
          `${apiUrl}/api/programs/users/search?q=${encodeURIComponent(query)}&exclude_program_id=${programId}`
        );
        if (response.ok) {
          const data = await response.json();
          setVinculationSearchResults(data);
        }
      } catch (error) {
        console.error("Error searching vinculation users:", error);
      }
    };

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🔗 Paso 4: Vinculación (Opcional)</h2>
          <p className="text-gray-600">¿Deseas vincular este usuario con un mentor o equipo?</p>
        </div>

        {/* Usuario seleccionado */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold">
                {selectedUser ? `${selectedUser.first_name[0]}${selectedUser.last_name[0]}` : `${newUserForm.nombre[0]}${newUserForm.apellidos[0]}`}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : `${newUserForm.nombre} ${newUserForm.apellidos}`}
              </p>
              <p className="text-sm text-gray-600">
                Rol: <span className="font-bold">{selectedRole}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Toggle de vinculación */}
        <div className="mb-6">
          <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-100 transition-all">
            <input
              type="checkbox"
              checked={requiresVinculation}
              onChange={(e) => onToggleVinculation(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <div>
              <p className="font-bold text-gray-900">Vincular con otro participante</p>
              <p className="text-sm text-gray-600">
                Asigna un mentor, tutor o equipo a este usuario
              </p>
            </div>
          </label>
        </div>

        {/* Opciones de vinculación (si está habilitado) */}
        {requiresVinculation && (
          <div className="space-y-6 mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
            {/* Tipo de vinculación */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Tipo de Vinculación
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "mentoria", label: "👨‍🏫 Mentoría", description: "Relación mentor-mentee" },
                  { value: "tutoria", label: "📚 Tutoría", description: "Seguimiento académico" },
                  { value: "equipo", label: "👥 Equipo", description: "Trabajo en equipo" },
                  { value: "coaching", label: "🎯 Coaching", description: "Desarrollo personal" },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => onSelectVinculationType(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      vinculationType === type.value
                        ? "border-blue-500 bg-blue-100"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <p className="font-bold text-gray-900 text-sm mb-1">{type.label}</p>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Búsqueda de participante */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Buscar Participante
              </label>
              <input
                type="text"
                value={vinculationSearchQuery}
                onChange={(e) => {
                  setVinculationSearchQuery(e.target.value);
                  searchVinculation(e.target.value);
                }}
                placeholder="Buscar mentor, tutor o compañero..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {/* Resultados de búsqueda */}
              {vinculationSearchQuery.length >= 2 && vinculationSearchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {vinculationSearchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectMatch(user);
                        setVinculationSearchQuery(`${user.first_name} ${user.last_name}`);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                        vinculationMatch?.id === user.id
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      {vinculationMatch?.id === user.id && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {vinculationMatch && (
                <div className="mt-3 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Vinculación seleccionada: <strong>{vinculationMatch.first_name} {vinculationMatch.last_name}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={onContinueToConfirm}
              disabled={requiresVinculation && (!vinculationType || !vinculationMatch)}
              className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 ${
                !requiresVinculation || (vinculationType && vinculationMatch)
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continuar
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 6: CONFIRMACIÓN
  // ================================================================================

  if (step === "confirm") {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Paso 5: Confirmar</h2>
          <p className="text-gray-600">Revisa la información antes de agregar al participante</p>
        </div>

        {/* Resumen */}
        <div className="space-y-4 mb-6">
          {/* Usuario */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">👤 Usuario</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {selectedUser ? `${selectedUser.first_name[0]}${selectedUser.last_name[0]}` : `${newUserForm.nombre[0]}${newUserForm.apellidos[0]}`}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : `${newUserForm.nombre} ${newUserForm.apellidos}`}
                </p>
                <p className="text-gray-600">
                  {selectedUser ? selectedUser.email : newUserForm.email}
                </p>
                {!selectedUser && (
                  <p className="text-sm text-green-600 font-bold mt-1">
                    ✨ Nuevo usuario - Se creará en el sistema
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rol */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">🎭 Rol en el Programa</h3>
            <p className="text-lg font-bold text-gray-900">{selectedRole}</p>
          </div>

          {/* Vinculación */}
          {requiresVinculation && vinculationMatch && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">🔗 Vinculación</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {vinculationMatch.first_name[0]}{vinculationMatch.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {vinculationMatch.first_name} {vinculationMatch.last_name}
                  </p>
                  <p className="text-sm text-gray-600">Tipo: <strong>{vinculationType}</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>📧 Importante:</strong> Se enviará un email de invitación al usuario para que acceda
            al programa
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Confirmar y Agregar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
