"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient, Notification } from "@/lib/api";

interface NotificationBellProps {
  userId: string | number;
  darkMode?: boolean;
}

export default function NotificationBell({ userId, darkMode = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getUserNotifications(userId, false);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const deleteNotification = async (notificationId: number) => {
    try {
      await ApiClient.deleteNotification(notificationId);
      const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) markAsRead(unreadIds);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const recent = notifications.slice(0, 5);
  const dm = darkMode;

  return (
    <div className="relative">
      {/* Bell Button — modern filled style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-lg p-1.5 transition ${
          dm ? "hover:bg-dark-300 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        }`}
        aria-label="Notificaciones"
      >
        {/* Modern bell icon (filled when unread) */}
        {unreadCount > 0 ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a1 1 0 011 1v.7A6.006 6.006 0 0118 9.7v2.8l1.7 2.55a1 1 0 01-.84 1.55H5.14a1 1 0 01-.84-1.55L6 12.5V9.7a6.006 6.006 0 015-5.999V3a1 1 0 011-1zM9.17 18a3.001 3.001 0 005.66 0H9.17z"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-dark-500">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className={`absolute right-0 top-full mt-1.5 z-50 w-80 rounded-lg border shadow-lg overflow-hidden ${
            dm ? "border-gray-700 bg-dark-400" : "border-gray-200 bg-white"
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-3.5 py-2.5 border-b ${
              dm ? "border-gray-700" : "border-gray-100"
            }`}>
              <span className={`text-sm font-semibold ${dm ? "text-gray-200" : "text-gray-800"}`}>Notificaciones</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] font-medium text-primary-600 hover:text-primary-700">
                  Leer todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                </div>
              ) : recent.length === 0 ? (
                <div className={`py-8 text-center text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
                  Sin notificaciones
                </div>
              ) : (
                recent.map((n) => (
                  <div
                    key={n.id}
                    className={`px-3.5 py-2.5 border-b last:border-0 transition-colors ${
                      !n.is_read
                        ? dm ? "bg-primary-500/5 border-gray-700" : "bg-primary-50/70 border-gray-100"
                        : dm ? "border-gray-700 hover:bg-dark-300" : "border-gray-50 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Unread dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        {!n.is_read ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                        ) : (
                          <div className="w-1.5 h-1.5"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-medium leading-snug truncate ${
                            !n.is_read
                              ? dm ? "text-gray-200" : "text-gray-900"
                              : dm ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] ${dm ? "text-gray-600" : "text-gray-400"}`}>
                              {getRelativeTime(n.created_at)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                              className={`opacity-0 group-hover:opacity-100 hover:!opacity-100 text-[10px] ${
                                dm ? "text-gray-600 hover:text-gray-300" : "text-gray-300 hover:text-gray-500"
                              }`}
                              style={{ opacity: undefined }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.3")}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-1 ${
                          dm ? "text-gray-500" : "text-gray-500"
                        }`}>
                          {n.message}
                        </p>
                        {/* Action row */}
                        <div className="flex items-center gap-2 mt-1">
                          {!n.is_read && (
                            <button
                              onClick={() => markAsRead([n.id])}
                              className="text-[10px] font-medium text-primary-600 hover:text-primary-700"
                            >
                              Marcar leída
                            </button>
                          )}
                          {n.link && (n.link.startsWith("http") || n.link.startsWith("/")) && (
                            <a
                              href={n.link}
                              target={n.link.startsWith("http") ? "_blank" : undefined}
                              rel={n.link.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="text-[10px] font-medium text-primary-600 hover:text-primary-700"
                              onClick={() => setIsOpen(false)}
                            >
                              Ver →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={`border-t px-3.5 py-2 text-center ${dm ? "border-gray-700" : "border-gray-100"}`}>
                <button
                  onClick={() => { setIsOpen(false); router.push("/dashboard/notifications"); }}
                  className={`text-xs font-medium ${
                    dm ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Ver todas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
