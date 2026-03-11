"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

interface TopNavbarProps {
  username: string;
  role: string;
  userId?: number;
  darkMode: boolean;
}

// SVG Icons
const IconBell = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconUser = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconSettings = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconProfile = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconChevronDown = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function TopNavbar({ username, role, userId = 1, darkMode }: TopNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Inicialmente colapsado
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load user data from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    const collapsed = localStorage.getItem("sidebarCollapsed");
    if (user) {
      setUserData(JSON.parse(user));
    }
    // Si no hay valor guardado, usar colapsado por defecto
    setSidebarCollapsed(collapsed === null ? true : collapsed === "true");
  }, []);

  // Escuchar cambios en el estado del sidebar
  useEffect(() => {
    const handleSidebarToggle = () => {
      const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
      setSidebarCollapsed(collapsed);
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const getRoleBadge = () => {
    const roleMap: { [key: string]: { emoji: string; label: string } } = {
      superadmin: { emoji: "👑", label: "Super Administrador" },
      inspiratoria_admin: { emoji: "⭐", label: "Admin Inspiratoria" },
      admin: { emoji: "👑", label: "Administrador" },
      coordinator: { emoji: "👑", label: "Coordinador" },
      client: { emoji: "💼", label: "Cliente" },
      mentor: { emoji: "👨‍🏫", label: "Mentor" },
      mentee: { emoji: "👨‍🎓", label: "Mentee" },
      facilitator_internal: { emoji: "🎯", label: "Facilitador Interno" },
      facilitator_inspiratoria: { emoji: "🎯", label: "Facilitador Inspiratoria" },
    };

    return roleMap[role] || { emoji: "👤", label: role };
  };

  const roleBadge = getRoleBadge();

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 border-b z-50 transition-all duration-300 ${
        darkMode ? "bg-dark-500 border-gray-800" : "bg-white border-gray-200"
      }`}
      style={{ marginLeft: sidebarCollapsed ? "72px" : "288px" }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - User Info */}
        <div className="flex items-center gap-3">
          <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {username}
          </h3>
          <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
            darkMode 
              ? "bg-primary-500/20 text-primary-400 border border-primary-500/30" 
              : "bg-primary-100 text-primary-700 border border-primary-200"
          }`}>
            ID: {userId}
          </span>
        </div>

        {/* Right side - Notifications + User Menu */}
        <div className="flex items-center gap-4">
          {/* Notification Bell Button */}
          <button
            className={`relative p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-dark-400 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <IconBell className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* User Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2"
            >
              {/* Avatar Circle */}
              <div 
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 transition-all ${
                  darkMode ? "border-gray-700 hover:border-primary-500" : "border-white hover:border-primary-400"
                }`}
                style={{ 
                  aspectRatio: '1/1',
                  minWidth: '40px',
                  minHeight: '40px',
                  maxWidth: '40px',
                  maxHeight: '40px'
                }}
              >
                {getInitials(username)}
              </div>

              {/* Chevron */}
              <IconChevronDown
                className={`transition-transform ${showDropdown ? "rotate-180" : ""} ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className={`absolute right-0 mt-2 w-96 rounded-xl shadow-xl overflow-hidden animate-fadeIn border ${
                  darkMode
                    ? "bg-dark-400 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* User Info Header */}
                <div className={`px-6 py-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold shadow-md ${
                        darkMode 
                          ? "bg-gradient-to-br from-gray-700 to-gray-600 text-gray-200" 
                          : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
                      }`}>
                        {getInitials(username)}
                      </div>
                      {/* Online Status */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {userData?.full_name || username}
                      </h3>
                      <p className={`text-sm truncate mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        @{username}
                      </p>
                      <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${
                        darkMode 
                          ? "bg-primary-500/20 text-primary-400 border border-primary-500/30" 
                          : "bg-primary-50 text-primary-700 border border-primary-200"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>{roleBadge.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className={`px-6 py-5 space-y-4 ${darkMode ? "bg-dark-300/30" : "bg-gray-50/50"}`}>
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-dark-400" : "bg-white"
                    }`}>
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Email</p>
                      <p className={`text-sm font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {userData?.email || `${username}@inspiratoria.org`}
                      </p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-dark-400" : "bg-white"
                    }`}>
                      <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ID de Usuario</p>
                      <p className={`text-xs font-mono font-medium break-all leading-relaxed ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {userData?.id || userId}
                      </p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-dark-400" : "bg-white"
                    }`}>
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Miembro desde</p>
                      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Diciembre 2025
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className={`py-1 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push("/dashboard/settings");
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                      darkMode
                        ? "text-gray-300 hover:bg-dark-300"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <IconSettings className="w-4 h-4" />
                    <span>Configuración</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push("/dashboard");
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                      darkMode
                        ? "text-gray-300 hover:bg-dark-300"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <IconProfile className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </button>
                </div>

                {/* Logout */}
                <div className={`border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                      darkMode
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <IconLogout className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
