"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  position: string;
  is_active: boolean;
  created_at: string;
}

interface Company {
  name: string;
}

export default function ClientUsersPage() {
  const params = useParams();
  const companyId = params?.id as string;
  const [users, setUsers] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    try {
      // Cargar empresa
      const companyRes = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}`
      );
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      // Cargar usuarios
      const usersRes = await apiFetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}/users`
      );
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && user.is_active) ||
                         (statusFilter === "inactive" && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(new Set(users.map(u => u.role)));
  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

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
        <p className="text-gray-600 mt-2">Usuarios de {company?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Total Usuarios</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Activos</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{activeUsers}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Inactivos</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{inactiveUsers}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Roles Únicos</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{uniqueRoles.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar Usuario"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Rol</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Estado</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No hay usuarios registrados</h3>
          <p className="text-gray-600">Los usuarios aparecerán aquí una vez registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Cargo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.position || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-500 hover:text-primary-600 font-semibold text-sm">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
