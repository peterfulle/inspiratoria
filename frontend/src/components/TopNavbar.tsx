"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

interface TopNavbarProps {
  username: string;
  role: string;
  userId?: string | number;
  darkMode: boolean;
}

// SVG Icons
const IconSun = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconMoon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const IconChevronRight = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const IconHome = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// Breadcrumb route mapping
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Usuarios",
  analytics: "Analítica",
  configuration: "Configuración",
  profile: "Mi Configuración",
  chat: "Chat",
  goals: "Objetivos",
  programs: "Programas",
  investors: "Inversores",
  invitations: "Invitaciones",
  notifications: "Notificaciones",
};

export default function TopNavbar({ username, role, userId = "", darkMode }: TopNavbarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [localDarkMode, setLocalDarkMode] = useState(darkMode);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const collapsed = localStorage.getItem("sidebarCollapsed");
    setSidebarCollapsed(collapsed === null ? true : collapsed === "true");

    // Sync dark mode
    const theme = localStorage.getItem("theme");
    setLocalDarkMode(theme === "dark");
  }, []);

  useEffect(() => {
    setLocalDarkMode(darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleSidebarToggle = () => {
      const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
      setSidebarCollapsed(collapsed);
    };
    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Listen for theme changes from sidebar
  useEffect(() => {
    const handleThemeChange = () => {
      const theme = localStorage.getItem("theme");
      setLocalDarkMode(theme === "dark");
    };
    window.addEventListener("themeToggle", handleThemeChange);
    return () => window.removeEventListener("themeToggle", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const newMode = !localDarkMode;
    setLocalDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    window.dispatchEvent(new Event("themeToggle"));
  };

  // Build breadcrumbs from pathname
  const getBreadcrumbs = () => {
    if (!pathname) return [];
    const segments = pathname.split("/").filter(Boolean);
    // Remove "dashboard" prefix, keep rest
    const crumbs: { label: string; path: string }[] = [];
    
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const path = "/" + segments.slice(0, i + 1).join("/");
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ label, path });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const dm = localDarkMode;

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setCurrentTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 border-b z-50 transition-all duration-300 ${
        dm ? "bg-dark-500 border-gray-800" : "bg-white border-gray-200"
      }`}
      style={{ marginLeft: sidebarCollapsed ? "72px" : "288px" }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              dm ? "hover:bg-dark-400 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            }`}
          >
            <IconHome />
          </button>

          {breadcrumbs.length > 0 && (
            <>
              <IconChevronRight className={`w-3 h-3 flex-shrink-0 ${dm ? "text-gray-600" : "text-gray-300"}`} />
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.path} className="flex items-center gap-2 min-w-0">
                  {i > 0 && (
                    <IconChevronRight className={`w-3 h-3 flex-shrink-0 ${dm ? "text-gray-600" : "text-gray-300"}`} />
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span className={`text-sm font-semibold truncate ${dm ? "text-white" : "text-gray-900"}`}>
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => router.push(crumb.path)}
                      className={`text-sm font-medium truncate transition-colors ${
                        dm ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {crumb.label}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {breadcrumbs.length === 0 && (
            <span className={`text-sm font-semibold ${dm ? "text-white" : "text-gray-900"}`}>
              Dashboard
            </span>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`relative p-2 rounded-lg transition-all ${
              dm
                ? "hover:bg-dark-400 text-yellow-400 hover:text-yellow-300"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
            title={dm ? "Modo claro" : "Modo oscuro"}
          >
            {dm ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>

          {/* Settings gear */}
          <button
            onClick={() => router.push("/dashboard/configuration")}
            className={`p-2 rounded-lg transition-all ${
              pathname?.includes("/dashboard/configuration")
                ? dm ? "bg-yellow-400/10 text-yellow-400" : "bg-gray-100 text-gray-900"
                : dm ? "hover:bg-dark-400 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            }`}
            title="Configuración"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Notification Bell */}
          <NotificationBell userId={userId} darkMode={dm} />

          {/* Separator */}
          <div className={`w-px h-8 mx-1 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />

          {/* User info: Name, ID, Time */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${dm ? "text-white" : "text-gray-900"}`}>
              {username}
            </span>
            <span className={`text-xs ${dm ? "text-gray-400" : "text-gray-500"}`}>
              ID: {userId}
            </span>
            <span className={`text-xs tabular-nums ${dm ? "text-gray-400" : "text-gray-500"}`}>
              {currentTime}
            </span>

            {/* Logout */}
            <button
              onClick={() => { localStorage.clear(); router.push("/"); }}
              className={`p-1.5 rounded-lg transition-colors group ${
                dm ? "hover:bg-red-500/10 text-gray-400 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
              }`}
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
