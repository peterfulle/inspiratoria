"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import UIPrefsLoader from "@/components/UIPrefsLoader";
import TeamChatWindow from "@/components/TeamChatWindow";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Inicialmente colapsado
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sendNotification } = usePushNotifications();

  // Ocultar sidebar en rutas de programa que tienen su propio layout con sidebar
  const programManagePattern = /^\/dashboard\/programs\/[^/]+\/(manage|training|activities|participants|config|reports)$/;
  const isInProgramRoute = programManagePattern.test(pathname);
  // Ocultar todo el chrome del dashboard cuando la página se embebe (ej. iframe
  // dentro de la consola de Studio) — ver app/dashboard/programs/preview/[slug].
  const isEmbedded = searchParams.get("embed") === "1";
  const isInClientRoute = isInProgramRoute || isEmbedded;

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const theme = localStorage.getItem("theme");
    const collapsed = localStorage.getItem("sidebarCollapsed");
    
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setDarkMode(theme === "dark");
      // Si no hay valor guardado, usar colapsado por defecto
      setSidebarCollapsed(collapsed === null ? true : collapsed === "true");
      setLoading(false);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  // Escuchar cambios en el estado del sidebar
  useEffect(() => {
    const handleSidebarToggle = () => {
      const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
      setSidebarCollapsed(collapsed);
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Listen for theme toggle from header or sidebar
  useEffect(() => {
    const handleThemeToggle = () => {
      const theme = localStorage.getItem("theme");
      setDarkMode(theme === "dark");
    };
    window.addEventListener("themeToggle", handleThemeToggle);
    return () => window.removeEventListener("themeToggle", handleThemeToggle);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen h-full bg-white overflow-x-hidden">
        {!isInClientRoute && (
          <>
            <Sidebar
              username="..."
              role="admin"
              userId={1}
            />
            <TopNavbar
              username="..."
              role="admin"
              userId={1}
              darkMode={darkMode}
            />
          </>
        )}
        <main className={`${isInClientRoute ? '' : 'ml-72 mt-16 p-8 pb-64'} flex-1 bg-white`}>
          <DashboardSkeleton darkMode={darkMode} />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen h-full bg-white overflow-x-hidden">
      <UIPrefsLoader />
      {!isInClientRoute && (
        <>
          <Sidebar
            username={user.full_name || user.username || user.email}
            role={user.role || ""}
            userId={user.id || 1}
          />

          <TopNavbar
            username={user.full_name || user.username || user.email}
            role={user.role || ""}
            userId={user.id || 1}
            darkMode={darkMode}
          />
        </>
      )}

      <main className={`${isInClientRoute ? '' : sidebarCollapsed ? 'ml-[72px] mt-16 p-8 pb-64' : 'ml-72 mt-16 p-8 pb-64'} flex-1 bg-white transition-all duration-300`}>
        {children}
      </main>

      {/* Push Notification Prompt - solo fuera de rutas de programa */}
      {!isInClientRoute && (
        <PushNotificationPrompt
          darkMode={darkMode}
          onPermissionGranted={() => {
            sendNotification({
              title: "¡Notificaciones activadas!",
              body: "Ahora recibirás alertas sobre tus milestones y matches.",
            });
          }}
        />
      )}

      {/* Chat interno del equipo Inspiratoria (@inspiratoria.org) */}
      {!isInClientRoute && <TeamChatWindow user={user} />}
    </div>
  );
}
