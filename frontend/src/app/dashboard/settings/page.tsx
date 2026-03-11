"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role: string;
  profile?: string;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Administrador",
  inspiratoria_admin: "Admin Inspiratoria",
  admin: "Administrador",
  coordinator: "Coordinador",
  client: "Cliente",
  mentor: "Mentor",
  mentee: "Mentee",
  facilitator_internal: "Facilitador Interno",
  facilitator_inspiratoria: "Facilitador Inspiratoria",
};

const PROFILE_LABELS: Record<string, string> = {
  super_admin: "Super Administrador",
  operations_admin: "Administrador de Operaciones",
  support_admin: "Administrador de Soporte",
};

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    companies: 0,
    programs: 0,
    users: 0,
    activities: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Cargar datos del usuario
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    setUserData(JSON.parse(userStr));

    // Cargar preferencia de modo oscuro
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);

    // Cargar estadísticas del usuario
    loadUserStats();
  }, [router]);

  const loadUserStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      // Cargar empresas
      const companiesRes = await fetch(`${apiUrl}/api/companies/`);
      const companiesData = await companiesRes.ok ? await companiesRes.json() : [];
      
      // Cargar programas
      const programsRes = await fetch(`${apiUrl}/api/programs`);
      const programsData = await programsRes.ok ? await programsRes.json() : [];
      
      // Cargar usuarios
      const usersRes = await fetch(`${apiUrl}/api/programs/users-with-programs`);
      const usersData = await usersRes.ok ? await usersRes.json() : [];
      
      setStats({
        companies: companiesData.length || 0,
        programs: programsData.length || 0,
        users: usersData.length || 0,
        activities: programsData.reduce((sum: number, p: any) => sum + (p.activities_count || 0), 0)
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    window.dispatchEvent(new Event("darkModeChange"));
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("company");
    router.push("/login");
  };

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-dark-500 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className={`mb-4 flex items-center gap-2 text-sm font-medium transition-colors ${
              darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        {/* Resumen de Actividad */}
        <div className={`rounded-xl border p-6 mb-6 ${darkMode ? "bg-dark-400 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              darkMode ? "bg-primary-500/20" : "bg-primary-100"
            }`}>
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Resumen de Actividad</h2>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Tu impacto en la plataforma
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`p-4 rounded-xl border ${darkMode ? "bg-dark-300 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className="animate-pulse">
                    <div className={`h-4 rounded mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    <div className={`h-8 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Empresas */}
              <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                darkMode ? "bg-dark-300 border-gray-700 hover:border-blue-500/50" : "bg-gray-50 border-gray-200 hover:border-blue-300"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? "bg-blue-500/20" : "bg-blue-100"
                  }`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <p className={`text-sm font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Empresas
                </p>
                <p className="text-3xl font-bold">{stats.companies}</p>
              </div>

              {/* Programas */}
              <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                darkMode ? "bg-dark-300 border-gray-700 hover:border-purple-500/50" : "bg-gray-50 border-gray-200 hover:border-purple-300"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? "bg-purple-500/20" : "bg-purple-100"
                  }`}>
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <p className={`text-sm font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Programas
                </p>
                <p className="text-3xl font-bold">{stats.programs}</p>
              </div>

              {/* Usuarios */}
              <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                darkMode ? "bg-dark-300 border-gray-700 hover:border-green-500/50" : "bg-gray-50 border-gray-200 hover:border-green-300"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? "bg-green-500/20" : "bg-green-100"
                  }`}>
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-sm font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Usuarios
                </p>
                <p className="text-3xl font-bold">{stats.users}</p>
              </div>

              {/* Actividades */}
              <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                darkMode ? "bg-dark-300 border-gray-700 hover:border-orange-500/50" : "bg-gray-50 border-gray-200 hover:border-orange-300"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? "bg-orange-500/20" : "bg-orange-100"
                  }`}>
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className={`text-sm font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Actividades
                </p>
                <p className="text-3xl font-bold">{stats.activities}</p>
              </div>
            </div>
          )}
        </div>

        {/* Información del Usuario */}
        <div className={`rounded-xl border p-6 mb-6 ${darkMode ? "bg-dark-400 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Información Personal
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* ID */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                ID de Usuario
              </label>
              <div className={`px-4 py-3 rounded-lg font-mono text-sm ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                {userData.id}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Nombre de Usuario
              </label>
              <div className={`px-4 py-3 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                {userData.username}
              </div>
            </div>

            {/* Full Name */}
            {userData.full_name && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Nombre Completo
                </label>
                <div className={`px-4 py-3 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                  {userData.full_name}
                </div>
              </div>
            )}

            {/* Email */}
            {userData.email && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Email
                </label>
                <div className={`px-4 py-3 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                  {userData.email}
                </div>
              </div>
            )}

            {/* Phone */}
            {userData.phone && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Teléfono
                </label>
                <div className={`px-4 py-3 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                  {userData.phone}
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Rol
              </label>
              <div className={`px-4 py-3 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                {ROLE_LABELS[userData.role] || userData.role}
              </div>
            </div>

            {/* Profile Type */}
            {userData.profile && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Tipo de Perfil
                </label>
                <div className={`px-4 py-3 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-100"}`}>
                  {PROFILE_LABELS[userData.profile] || userData.profile}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferencias */}
        <div className={`rounded-xl border p-6 mb-6 ${darkMode ? "bg-dark-400 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preferencias
          </h2>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Modo Oscuro</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Cambia entre modo claro y oscuro
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  darkMode ? "bg-primary-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    darkMode ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Zona de Peligro */}
        <div className={`rounded-xl border border-red-300 p-6 ${darkMode ? "bg-red-950/20" : "bg-red-50"}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Zona de Peligro
          </h2>
          <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Cerrar sesión te desconectará de tu cuenta.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
