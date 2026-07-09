"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { apiFetch } from "@/lib/api";

// ================================================================================
// INTERFACES
// ================================================================================

interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  role?: string;
  company?: {
    id: string;
    name: string;
  };
}

interface ProgramSummary {
  program_id: string;
  program_name: string;
  role: string;
  status: "active" | "pending" | "suspended" | "inactive";
  created_at: string;
  last_access_at?: string;
  vinculation?: {
    type: string;
    match_name: string;
  };
}

interface UserWithPrograms extends User {
  programs: ProgramSummary[];
  total_programs: number;
  active_programs: number;
}

interface ModalUserData {
  user: UserWithPrograms;
  selectedProgram?: ProgramSummary;
}

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================

export default function ParticipantsManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithPrograms[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModal, setSelectedModal] = useState<ModalUserData | null>(null);
  const [selectedProgramModal, setSelectedProgramModal] = useState<any | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"users" | "programs" | "companies">("programs");

  useEffect(() => {
    loadUsers();
    loadPrograms();
    loadCompanies();
  }, []);

  const loadUsers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      const response = await apiFetch(`${apiUrl}/api/programs/users-with-programs`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: UserWithPrograms[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await apiFetch(`${apiUrl}/api/programs`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error("Error loading programs:", error);
    }
  };

  const loadCompanies = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await apiFetch(`${apiUrl}/api/companies/`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRole = filterRole === "all" || 
      user.programs.some(p => p.role === filterRole);
    
    const matchStatus = filterStatus === "all" || 
      user.programs.some(p => p.status === filterStatus);
    
    return matchSearch && matchRole && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo con info */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración General</h1>
                <p className="text-sm text-gray-600">Gestiona programas, usuarios y cuentas desde un solo lugar</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("programs")}
              className={`flex items-center gap-2 px-4 py-3 border-b-3 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "programs"
                  ? "border-primary-500 text-primary-600 bg-primary-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Programas</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "programs" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"
              }`}>
                {programs.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-3 border-b-3 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "users"
                  ? "border-primary-500 text-primary-600 bg-primary-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Usuarios</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "users" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"
              }`}>
                {users.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab("companies")}
              className={`flex items-center gap-2 px-4 py-3 border-b-3 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "companies"
                  ? "border-primary-500 text-primary-600 bg-primary-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Cuentas</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "companies" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"
              }`}>
                {companies.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-8 py-8">
        {activeTab === "programs" && (
          <ProgramsTabContent 
            programs={programs} 
            onSelectProgram={setSelectedProgramModal}
          />
        )}

        {activeTab === "users" && (
          <UsersTabContent
            users={users}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            setSelectedModal={setSelectedModal}
          />
        )}

        {activeTab === "companies" && (
          <CompaniesTabContent companies={companies} />
        )}

        {/* Modal de Gestión de Usuario */}
        {selectedModal && (
          <UserManagementModal
            data={selectedModal}
            onClose={() => setSelectedModal(null)}
          />
        )}

        {/* Modal de Detalles de Programa */}
        {selectedProgramModal && (
          <ProgramDetailModal
            program={selectedProgramModal}
            onClose={() => setSelectedProgramModal(null)}
          />
        )}
      </div>
    </div>
  );
}

// ================================================================================
// COMPONENTE TAB DE USUARIOS
// ================================================================================

function UsersTabContent({
  users,
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  setSelectedModal
}: any) {
  const filteredUsers = users.filter((user: UserWithPrograms) => {
    const matchSearch = 
      user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRole = filterRole === "all" || 
      user.programs.some(p => p.role === filterRole);
    
    const matchStatus = filterStatus === "all" || 
      user.programs.some(p => p.status === filterStatus);
    
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <>
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Total Usuarios</p>
          <p className="text-4xl font-bold text-primary-600">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Usuarios Activos</p>
          <p className="text-4xl font-bold text-green-600">
            {users.filter((u: UserWithPrograms) => u.programs.some(p => p.status === "active")).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">En Múltiples Programas</p>
          <p className="text-4xl font-bold text-blue-600">
            {users.filter((u: UserWithPrograms) => u.total_programs > 1).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Con Vinculaciones</p>
          <p className="text-4xl font-bold text-purple-600">
            {users.filter((u: UserWithPrograms) => u.programs.some(p => p.vinculation)).length}
          </p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar Usuario
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre, apellido o email..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Rol
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="all">Todos los roles</option>
              <option value="administrator">Administrador</option>
              <option value="instructor">Instructor</option>
              <option value="participant">Participante</option>
              <option value="observer">Observador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="suspended">Suspendido</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                  Programas
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                  Roles
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                  Estados
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-bold mb-1">No hay usuarios</p>
                      <p className="text-sm">No se encontraron usuarios con los filtros aplicados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: UserWithPrograms) => {
                  const initials = `${user.nombre[0] || ''}${user.apellidos[0] || ''}`;
                  const uniqueRoles = Array.from(new Set(user.programs.map(p => p.role)));
                  const statuses = user.programs.map(p => p.status);
                  const hasActive = statuses.includes("active");
                  const hasPending = statuses.includes("pending");

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-bold text-sm">
                              {initials}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {user.nombre} {user.apellidos}
                            </p>
                            {user.company && (
                              <p className="text-xs text-gray-500">{user.company.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {user.total_programs} programa{user.total_programs !== 1 ? 's' : ''}
                          </span>
                          {user.active_programs > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              {user.active_programs} activo{user.active_programs !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {uniqueRoles.map((role, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {hasActive && (
                            <span className="text-green-600 text-sm">●</span>
                          )}
                          {hasPending && (
                            <span className="text-yellow-600 text-sm">●</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedModal({ user })}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ================================================================================
// COMPONENTE TAB DE PROGRAMAS
// ================================================================================

function ProgramsTabContent({ programs, onSelectProgram }: any) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [filterCompany, setFilterCompany] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("name");

  // Get unique companies
  const companies = Array.from(new Set(programs.map((p: any) => p.company?.name).filter(Boolean)));

  // Filter programs
  const filteredPrograms = programs.filter((program: any) => {
    const matchSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       program.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || program.status === filterStatus;
    const matchCompany = filterCompany === "all" || program.company?.name === filterCompany;
    return matchSearch && matchStatus && matchCompany;
  }).sort((a: any, b: any) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "participants") return (b.participants_count || 0) - (a.participants_count || 0);
    if (sortBy === "activities") return (b.activities_count || 0) - (a.activities_count || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Total Programas</p>
          <p className="text-4xl font-bold text-primary-600">{programs.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Activos</p>
          <p className="text-4xl font-bold text-green-600">
            {programs.filter((p: any) => p.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Borradores</p>
          <p className="text-4xl font-bold text-yellow-600">
            {programs.filter((p: any) => p.status === "draft").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Total Participantes</p>
          <p className="text-4xl font-bold text-blue-600">
            {programs.reduce((sum: number, p: any) => sum + (p.participants_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar Programa
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre o descripción..."
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Empresa
            </label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="all">Todas</option>
              {(companies as string[]).map((company: string, idx: number) => (
                <option key={idx} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="name">Nombre</option>
              <option value="participants">Participantes</option>
              <option value="activities">Actividades</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Programas */}
      <div className="space-y-4">
        {filteredPrograms.map((program: any) => (
          <div
            key={program.id}
            className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onSelectProgram(program)}
          >
            <div className="flex items-center gap-6">
              {/* Left: Program Info */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        program.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : program.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {program.status === 'active' ? 'Activo' : program.status === 'draft' ? 'Borrador' : program.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{program.description}</p>
                    
                    {/* Company Info */}
                    {program.company && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700">{program.company.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center: Metrics */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-600">Participantes</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{program.participants_count || 0}</p>
                </div>

                <div className="h-12 w-px bg-gray-200"></div>

                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-xs font-bold text-gray-600">Actividades</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{program.activities_count || 0}</p>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex gap-3 min-w-[320px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/dashboard/programs/${program.id}/participants`, '_blank');
                  }}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Participantes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/dashboard/programs/${program.id}/manage`, '_blank');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-2 border-gray-200 hover:border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPrograms.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-bold text-gray-900 mb-1">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all" 
                ? "No se encontraron programas" 
                : "No hay programas"}
            </p>
            <p className="text-sm text-gray-600">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Crea tu primer programa desde el dashboard de programas"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================================
// COMPONENTE TAB DE EMPRESAS
// ================================================================================

function CompaniesTabContent({ companies }: any) {
  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Total Empresas</p>
          <p className="text-4xl font-bold text-primary-600">{companies.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Activas</p>
          <p className="text-4xl font-bold text-green-600">
            {companies.filter((c: any) => c.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">En Onboarding</p>
          <p className="text-4xl font-bold text-yellow-600">
            {companies.filter((c: any) => c.status === "onboarding").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-bold mb-1">Total Usuarios</p>
          <p className="text-4xl font-bold text-blue-600">
            {companies.reduce((sum: number, c: any) => sum + (c.users_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Lista vertical de Empresas */}
      <div className="space-y-4">
        {companies.map((company: any) => (
          <div
            key={company.id}
            className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-6">
              {/* Logo de empresa */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Información de la empresa */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    company.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : company.status === 'onboarding'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {company.status === 'active' ? 'Activa' : company.status === 'onboarding' ? 'Onboarding' : company.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {company.industry && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-bold">{company.industry}</span>
                    </div>
                  )}
                  {company.size && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-bold">{company.size} empleados</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-600">Usuarios</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{company.users_count || 0}</p>
                </div>

                <div className="h-12 w-px bg-gray-200"></div>

                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-600">Programas</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">{company.programs_count || 0}</p>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => window.open(`/dashboard/companies/${company.id}`, '_blank')}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}

        {companies.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-bold text-gray-900 mb-1">No hay empresas</p>
            <p className="text-sm text-gray-600">Las empresas aparecerán aquí una vez creadas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================================
// MODAL DE GESTIÓN DE USUARIO
// ================================================================================

function UserManagementModal({ data, onClose }: { data: ModalUserData; onClose: () => void }) {
  const router = useRouter();
  const { user } = data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-bold text-2xl">
                {user.nombre[0]}{user.apellidos[0]}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.nombre} {user.apellidos}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Resumen General */}
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Resumen General</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Programas</p>
                <p className="text-2xl font-bold text-primary-600">{user.total_programs}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Programas Activos</p>
                <p className="text-2xl font-bold text-green-600">{user.active_programs}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Con Vinculaciones</p>
                <p className="text-2xl font-bold text-purple-600">
                  {user.programs.filter(p => p.vinculation).length}
                </p>
              </div>
            </div>
          </div>

          {/* Programas */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Participación en Programas</h3>
            <div className="space-y-3">
              {user.programs.map((program, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{program.program_name}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          {program.role}
                        </span>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          program.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : program.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {program.status}
                        </span>
                        {program.vinculation && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                            {program.vinculation.type}: {program.vinculation.match_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        window.open(`/dashboard/programs/${program.program_id}/participants`, '_blank');
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm flex items-center gap-2"
                    >
                      Ir al Programa
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-bold">Ingresó:</span> {new Date(program.created_at).toLocaleDateString()}
                    </div>
                    {program.last_access_at && (
                      <div>
                        <span className="font-bold">Último acceso:</span> {new Date(program.last_access_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-bold text-gray-900 mb-1">Generar Informe</p>
                <p className="text-xs text-gray-600">Informe completo de participación</p>
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                <div className="text-2xl mb-2">🔗</div>
                <p className="font-bold text-gray-900 mb-1">Gestionar Vinculaciones</p>
                <p className="text-xs text-gray-600">Crear o modificar relaciones</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Detalles del Programa
function ProgramDetailModal({ program, onClose }: { program: any; onClose: () => void }) {
  const [participants, setParticipants] = React.useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = React.useState(true);

  React.useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoadingParticipants(true);
        const response = await apiFetch(`/api/programs/${program.id}/participants`);
        if (!response.ok) throw new Error('Error al cargar participantes');
        const data = await response.json();
        setParticipants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando participantes:', error);
        setParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }
    };

    loadParticipants();
  }, [program.id]);

  const getStatusColor = (status: string) => {
    const colors: any = {
      'designed': 'bg-blue-100 text-blue-800 border border-blue-300',
      'active': 'bg-green-100 text-green-800 border border-green-300',
      'closed': 'bg-gray-100 text-gray-800 border border-gray-300',
      'cancelled': 'bg-red-100 text-red-800 border border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      'designed': 'Diseñado',
      'active': 'Activo',
      'closed': 'Cerrado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  const handleNavigateToProgram = () => {
    window.location.href = `/dashboard/programs/${program.id}/manage`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con línea gráfica Inspiratoria */}
        <div className="relative bg-gradient-to-r from-primary-500 via-purple-500 to-primary-600 text-white p-8">
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400"></div>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {/* Icono de programa */}
                <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{program.name}</h2>
                  <p className="text-white/80 text-sm mt-1">Vista previa del programa</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm bg-white/95 ${getStatusColor(program.status).replace('bg-', 'text-').replace('100', '700')}`}>
                  {getStatusLabel(program.status)}
                </span>
                {program.company_name && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">{program.company_name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {/* Descripción */}
          {program.description && (
            <div className="bg-white rounded-2xl border-2 border-primary-100 p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-bold text-gray-900 text-lg">Descripción del Programa</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{program.description}</p>
            </div>
          )}

          {/* Estadísticas con línea gráfica */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-blue-600 group-hover:scale-110 transition-transform">
                  {program.participants_count || 0}
                </div>
              </div>
              <div className="text-sm text-blue-800 font-bold">Participantes</div>
              <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-3"></div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-purple-600 group-hover:scale-110 transition-transform">
                  {program.activities_count || 0}
                </div>
              </div>
              <div className="text-sm text-purple-800 font-bold">Actividades</div>
              <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mt-3"></div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-green-600 group-hover:scale-110 transition-transform">
                  {program.vinculations_count || 0}
                </div>
              </div>
              <div className="text-sm text-green-800 font-bold">Vinculaciones</div>
              <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mt-3"></div>
            </div>
          </div>

          {/* Lista de Participantes */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="font-bold text-gray-900 text-lg">Lista de Participantes</h3>
                <span className="ml-auto bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                  {participants.length} {participants.length === 1 ? 'persona' : 'personas'}
                </span>
              </div>
            </div>
            
            {loadingParticipants ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="font-medium">Cargando participantes...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="font-medium">No hay participantes en este programa</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rol en Programa</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {participants.map((participant: any, index: number) => (
                      <tr key={participant.id} className={`hover:bg-primary-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold shadow-md">
                              {participant.user?.first_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900">
                              {participant.user?.first_name && participant.user?.last_name 
                                ? `${participant.user.first_name} ${participant.user.last_name}`
                                : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{participant.user?.email || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs font-bold border border-blue-300 shadow-sm">
                            {participant.role || 'Participante'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {participant.status === 'active' ? (
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-full border-2 border-green-300 shadow-sm">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-300">
                              {participant.status || 'pending'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer con botón Ver Detalles */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 p-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p className="font-medium">¿Necesitas gestionar este programa?</p>
            <p className="text-xs">Accede a todas las funcionalidades de gestión</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-bold transition-all duration-200 shadow-sm"
            >
              Cerrar
            </button>
            <button
              onClick={handleNavigateToProgram}
              className="px-8 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl hover:from-primary-600 hover:to-purple-700 font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              Ver Detalles Completos
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
