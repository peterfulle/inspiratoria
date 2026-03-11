"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationPromptProps {
  darkMode?: boolean;
  onPermissionGranted?: () => void;
}

export default function PushNotificationPrompt({ darkMode = false, onPermissionGranted }: PushNotificationPromptProps) {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Mostrar prompt solo si es soportado, no está garantizado y no fue rechazado
    if (isSupported && permission === "default" && !dismissed) {
      // Esperar 3 segundos antes de mostrar el prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, dismissed]);

  const handleRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
      onPermissionGranted?.();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Guardar en localStorage para no volver a mostrar en esta sesión
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  // No mostrar si no es soportado o ya tiene permiso
  if (!isSupported || permission !== "default" || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className={`rounded-xl border shadow-2xl ${
        darkMode
          ? "border-gray-700 bg-dark-400"
          : "border-gray-200 bg-white"
      }`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🔔</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">
                Activar Notificaciones Push
              </h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Recibe alertas cuando tus milestones estén próximos a vencer o cuando tengas nuevos matches y mensajes.
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRequest}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-semibold text-black transition hover:bg-primary-400"
            >
              Activar
            </button>
            <button
              onClick={handleDismiss}
              className={`flex-1 rounded-lg border px-4 py-2 font-semibold transition ${
                darkMode
                  ? "border-gray-600 text-gray-300 hover:border-gray-500"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
