"use client";

import { useState, useEffect } from "react";

export default function Footer() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Inicialmente colapsado

  useEffect(() => {
    const collapsed = localStorage.getItem("sidebarCollapsed");
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

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 h-8 bg-gray-900 border-t border-gray-800 z-40 transition-all duration-300"
      style={{ marginLeft: sidebarCollapsed ? "72px" : "288px" }}
    >
      <div className="h-full px-4 flex items-center justify-center">
        <p className="text-xs text-gray-400">
          Development Version • Built by{" "}
          <a
            href="https://aplifly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
          >
            Aplifly.com
          </a>
        </p>
      </div>
    </footer>
  );
}
