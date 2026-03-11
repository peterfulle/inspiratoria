"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import Footer from "@/components/Footer";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import DashboardSkeleton from "@/components/DashboardSkeleton";
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
  const { sendNotification } = usePushNotifications();

  // Ocultar sidebar en rutas de programa que tienen su propio layout con sidebar
  const programManagePattern = /^\/dashboard\/programs\/[^/]+\/(manage|training|activities|participants|config|reports)$/;
  const isInProgramRoute = programManagePattern.test(pathname);
  const isInClientRoute = isInProgramRoute;

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
        {!isInClientRoute && <Footer />}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen h-full bg-white overflow-x-hidden">
      {!isInClientRoute && (
        <>
          <Sidebar
            username={user.username || user.full_name || user.email}
            role={user.role || ""}
            userId={user.id || 1}
          />

          <TopNavbar
            username={user.username || user.full_name || user.email}
            role={user.role || ""}
            userId={user.id || 1}
            darkMode={darkMode}
          />
        </>
      )}

      <main className={`${isInClientRoute ? '' : sidebarCollapsed ? 'ml-[72px] mt-16 p-8 pb-64' : 'ml-72 mt-16 p-8 pb-64'} flex-1 bg-white transition-all duration-300`}>
        {children}
      </main>

      {!isInClientRoute && <Footer />}

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
    </div>
  );
}
