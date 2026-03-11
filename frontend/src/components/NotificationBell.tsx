"use client";

import { useEffect, useState } from "react";
import { ApiClient, Notification } from "@/lib/api";

interface NotificationBellProps {
  userId: number;
  darkMode?: boolean;
}

export default function NotificationBell({ userId, darkMode = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones no leídas
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getUserNotifications(userId, false);
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como leídas
  const markAsRead = async (notificationIds: number[]) => {
    try {
      await ApiClient.markNotificationsRead(notificationIds);
      setNotifications(prev =>
        prev.map(n => (notificationIds.includes(n.id) ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId: number) => {
    try {
      await ApiClient.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  // Cargar al montar y cada 30 segundos
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [userId]);

  // Función para obtener emoji según tipo
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "milestone_due":
        return "⏰";
      case "milestone_upcoming":
        return "📅";
      case "new_match":
        return "🤝";
      case "rating_received":
        return "⭐";
      case "message":
        return "💬";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  // Función para formatear tiempo relativo
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-lg p-2 transition ${
          darkMode
            ? "hover:bg-dark-300"
            : "hover:bg-gray-100"
        }`}
        aria-label="Notificaciones"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className={`absolute right-0 top-full mt-2 z-50 w-96 rounded-xl border shadow-xl ${
            darkMode
              ? "border-gray-700 bg-dark-400"
              : "border-gray-200 bg-white"
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b p-4 ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}>
              <h3 className="text-lg font-bold">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary-500 hover:text-primary-400"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                  <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Cargando...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-4xl">📭</span>
                  <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No hay notificaciones
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition ${
                        !notification.is_read
                          ? darkMode
                            ? "bg-primary-500/10"
                            : "bg-primary-50"
                          : ""
                      } ${
                        darkMode
                          ? "hover:bg-dark-300"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.notification_type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm">
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className={`text-xs ${
                                darkMode
                                  ? "text-gray-500 hover:text-gray-300"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              ✕
                            </button>
                          </div>
                          <p className={`mt-1 text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-500"
                            }`}>
                              {getRelativeTime(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead([notification.id])}
                                className="text-xs font-medium text-primary-500 hover:text-primary-400"
                              >
                                Marcar leída
                              </button>
                            )}
                            {notification.link && (
                              <a
                                href={notification.link}
                                className="text-xs font-medium text-primary-500 hover:text-primary-400"
                                onClick={() => setIsOpen(false)}
                              >
                                Ver más →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={`border-t p-3 text-center ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Aquí podrías navegar a una página de notificaciones completa
                  }}
                  className={`text-sm font-medium ${
                    darkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
