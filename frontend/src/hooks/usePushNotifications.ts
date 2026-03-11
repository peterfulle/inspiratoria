"use client";

import { useEffect, useState } from "react";

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permiso
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  // Enviar notificación
  const sendNotification = (options: PushNotificationOptions) => {
    if (!isSupported) {
      console.warn("Push notifications not supported");
      return null;
    }

    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/images/logo.png",
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        badge: "/images/logo.png",
      });

      // Auto-cerrar después de 5 segundos si no es requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  };

  // Verificar milestones próximos
  const checkMilestones = async (milestones: any[]) => {
    if (permission !== "granted") return;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    milestones.forEach((milestone) => {
      if (!milestone.completed && milestone.target_date) {
        const targetDate = new Date(milestone.target_date);
        
        // Notificar si el milestone vence en 3 días
        if (targetDate <= threeDaysFromNow && targetDate > now) {
          const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          sendNotification({
            title: "⏰ Milestone Próximo",
            body: `"${milestone.title}" vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
            tag: `milestone-${milestone.id}`,
            requireInteraction: true,
          });
        }
        
        // Notificar si el milestone está vencido
        if (targetDate < now) {
          sendNotification({
            title: "🚨 Milestone Vencido",
            body: `"${milestone.title}" ya venció. Por favor, actualiza su estado.`,
            tag: `milestone-overdue-${milestone.id}`,
            requireInteraction: true,
          });
        }
      }
    });
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    checkMilestones,
  };
}
