"use client";

import { useEffect, useState, useRef } from "react";
import { ApiClient, Notification } from "@/lib/api";
import { configStyles } from "../configuration/components/styles";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ============================================================================
// ICONS (SVG)
// ============================================================================
const IconBell = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const IconSend = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const IconInbox = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const IconCheck = <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const IconTrash = <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconClock = <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconMegaphone = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const IconEmpty = <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-30"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;

const NOTIFICATION_TYPE_ICONS: Record<string, JSX.Element> = {
  system: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  message: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  milestone_due: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  milestone_upcoming: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  new_match: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  rating_received: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
};

const NOTIFICATION_LABELS: Record<string, string> = {
  milestone_due: "Milestone Vencido",
  milestone_upcoming: "Milestone Próximo",
  new_match: "Nuevo Match",
  rating_received: "Rating Recibido",
  message: "Mensaje",
  system: "Sistema",
};

type TabId = "inbox" | "send";

function getRelativeTime(dateString: string) {
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
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("inbox");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  // Send form
  const [sendTitle, setSendTitle] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sendLink, setSendLink] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TipTap editor
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Escribe el contenido de la notificación..." }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setSendMessage(editor.getText());
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Auth
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    setUserId(user.id);
    setUserRole(user.role || "");
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await ApiClient.getUserNotifications(userId, false);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadNotifications();
  }, [userId]);

  const markAsRead = async (ids: number[]) => {
    try {
      await ApiClient.markNotificationsRead(ids);
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) markAsRead(unreadIds);
  };

  const deleteNotification = async (id: number) => {
    try {
      await ApiClient.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (selectedNotif?.id === id) setSelectedNotif(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const openNotification = (n: Notification) => {
    setSelectedNotif(n);
    if (!n.is_read) {
      markAsRead([n.id]);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTitle.trim() || !sendMessage.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = await ApiClient.broadcastNotification({
        sender_id: userId || undefined,
        title: sendTitle.trim(),
        message: sendMessage.trim(),
        link: sendLink.trim() || undefined,
        notification_type: "system",
      });
      setSendResult({ type: "success", text: `Notificación enviada a ${result.recipients} usuarios internos` });
      setSendTitle("");
      setSendMessage("");
      setSendLink("");
      setAttachments([]);
      editor?.commands.clearContent();
      setTimeout(() => setSendResult(null), 4000);
    } catch (error) {
      setSendResult({ type: "error", text: "Error al enviar la notificación" });
    } finally {
      setSending(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const isAdmin = ["superadmin", "admin_root", "inspiratoria_admin", "admin"].includes(userRole);

  const tabs = [
    { id: "inbox" as TabId, label: "Bandeja", icon: IconInbox },
    ...(isAdmin ? [{ id: "send" as TabId, label: "Enviar notificación", icon: IconSend }] : []),
  ];

  const toolbarBtnStyle: React.CSSProperties = {
    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "0.25rem", border: "none", cursor: "pointer", fontSize: "0.8125rem",
    color: "#374151", background: "transparent", transition: "background 0.1s",
  };

  const tiptapStyles = `
    .ProseMirror { outline: none; min-height: 10rem; font-size: 0.875rem; line-height: 1.7; color: #1a1a1a; }
    .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #adb5bd; pointer-events: none; height: 0; }
    .ProseMirror p { margin: 0 0 0.5rem; }
    .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin: 0 0 0.5rem; }
    .ProseMirror blockquote { border-left: 3px solid #e5e7eb; padding-left: 1rem; margin: 0 0 0.5rem; color: #6b7280; }
    .ProseMirror a { color: #2563eb; text-decoration: underline; }
    .ProseMirror strong { font-weight: 600; }
  `;

  return (
    <>
      <style>{configStyles}</style>
      <style>{tiptapStyles}</style>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .notif-row { cursor: pointer; }
        .notif-row:hover { background: #f9fafb !important; }
        .notif-delete:hover { color: #dc2626 !important; }
        .modal-backdrop { animation: fadeIn 0.15s ease; }
        .modal-content { animation: modalIn 0.2s ease; }
      `}</style>
      <div className="config-container">
        {/* Header */}
        <div className="config-header">
          <h1 className="config-title">Notificaciones</h1>
          <p className="config-subtitle">
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Gestiona tus notificaciones"}
          </p>
        </div>

        {/* Tabs */}
        <div className="config-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`config-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "inbox" && unreadCount > 0 && (
                <span style={{
                  background: "#dc2626",
                  color: "white",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  padding: "0.125rem 0.375rem",
                  borderRadius: "9999px",
                  marginLeft: "0.25rem",
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: INBOX ─── */}
        {activeTab === "inbox" && (
          <>
            {/* Filter bar + mark all */}
            <div className="section" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {(["all", "unread", "read"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: filter === f ? "#1a1a1a" : "transparent",
                        color: filter === f ? "white" : "#6b7280",
                      }}
                    >
                      {f === "all" ? `Todas (${notifications.length})` : f === "unread" ? `Sin leer (${unreadCount})` : `Leídas (${notifications.length - unreadCount})`}
                    </button>
                  ))}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.75rem", fontWeight: 500, padding: "0.375rem 0.75rem",
                      border: "1px solid #e5e7eb", borderRadius: "0.375rem",
                      background: "white", color: "#374151", cursor: "pointer",
                    }}
                  >
                    {IconCheck} Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            {loading ? (
              <div className="section" style={{ padding: "4rem 0", textAlign: "center" }}>
                <div style={{ width: 32, height: 32, margin: "0 auto 1rem", border: "3px solid #e5e7eb", borderTopColor: "#1a1a1a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Cargando notificaciones...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="section" style={{ padding: "4rem 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {IconEmpty}
                <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "1rem" }}>
                  {filter === "unread" ? "No hay notificaciones sin leer" : filter === "read" ? "No hay notificaciones leídas" : "No hay notificaciones aún"}
                </p>
              </div>
            ) : (
              <div className="section" style={{ overflow: "hidden" }}>
                {filtered.map((n, i) => (
                  <div
                    key={n.id}
                    className="notif-row"
                    onClick={() => openNotification(n)}
                    style={{
                      display: "flex",
                      gap: "0.875rem",
                      padding: "1rem 1.25rem",
                      borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                      background: !n.is_read ? "#FFFEF0" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {/* Unread indicator + icon */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "0.5rem",
                        background: !n.is_read ? "#1a1a1a" : "#f3f4f6",
                        color: !n.is_read ? "white" : "#6b7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {NOTIFICATION_TYPE_ICONS[n.notification_type] || NOTIFICATION_TYPE_ICONS.system}
                      </div>
                      {!n.is_read && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <p style={{ fontSize: "0.875rem", fontWeight: !n.is_read ? 600 : 500, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {n.title}
                        </p>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, color: "#9ca3af", fontSize: "0.6875rem", whiteSpace: "nowrap" }}>
                          {IconClock} {getRelativeTime(n.created_at)}
                        </span>
                      </div>

                      {/* Message */}
                      <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: "0 0 0.5rem", lineHeight: 1.5 }}>{n.message}</p>

                      {/* Meta row: sender + type badge + actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        {n.sender_name && (
                          <span style={{
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            fontSize: "0.6875rem", color: "#6b7280",
                          }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {n.sender_name}
                          </span>
                        )}
                        <span style={{
                          fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                          padding: "0.125rem 0.5rem", borderRadius: "9999px", background: "#f3f4f6", color: "#6b7280",
                        }}>
                          {NOTIFICATION_LABELS[n.notification_type] || n.notification_type}
                        </span>

                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          {!n.is_read && (
                            <button
                              onClick={() => markAsRead([n.id])}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, color: "#1a1a1a", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
                            >
                              {IconCheck} Leída
                            </button>
                          )}
                          {n.link && (n.link.startsWith("http") || n.link.startsWith("/")) && (
                            <a
                              href={n.link}
                              target={n.link.startsWith("http") ? "_blank" : undefined}
                              rel={n.link.startsWith("http") ? "noopener noreferrer" : undefined}
                              style={{ fontSize: "0.75rem", fontWeight: 500, color: "#1a1a1a", textDecoration: "none" }}
                            >
                              Ver detalle →
                            </a>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="notif-delete"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 0, display: "flex" }}
                          >
                            {IconTrash}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── TAB: SEND ─── */}
        {activeTab === "send" && isAdmin && (
          <>
            <div className="section" style={{ overflow: "visible" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {IconMegaphone}
                  <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1a1a1a" }}>Nuevo mensaje al equipo</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem", marginLeft: "1.625rem" }}>
                  Se enviará a todos los usuarios internos de Inspiratoria
                </p>
              </div>

              {sendResult && (
                <div style={{
                  margin: "1rem 1.5rem 0", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                  fontSize: "0.8125rem", fontWeight: 500,
                  background: sendResult.type === "success" ? "#d1fae5" : "#fee2e2",
                  color: sendResult.type === "success" ? "#059669" : "#dc2626",
                  border: `1px solid ${sendResult.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                }}>
                  {sendResult.text}
                </div>
              )}

              <form onSubmit={handleBroadcast}>
                {/* To field (read-only) */}
                <div style={{ display: "flex", alignItems: "center", padding: "0.75rem 1.5rem", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#9ca3af", width: "3rem", flexShrink: 0 }}>Para:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
                    {["Admins", "Coordinadores", "Facilitadores", "PMs"].map((r) => (
                      <span key={r} style={{
                        fontSize: "0.6875rem", fontWeight: 500, padding: "0.1875rem 0.5rem",
                        background: "#f0f5ff", color: "#3b82f6", borderRadius: "0.25rem",
                      }}>{r}</span>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div style={{ display: "flex", alignItems: "center", padding: "0.75rem 1.5rem", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#9ca3af", width: "3rem", flexShrink: 0 }}>Asunto:</span>
                  <input
                    type="text"
                    placeholder="Asunto de la notificación"
                    value={sendTitle}
                    onChange={(e) => setSendTitle(e.target.value)}
                    required
                    maxLength={120}
                    style={{
                      flex: 1, border: "none", outline: "none", fontSize: "0.875rem",
                      color: "#1a1a1a", background: "transparent",
                    }}
                  />
                </div>

                {/* Link */}
                <div style={{ display: "flex", alignItems: "center", padding: "0.75rem 1.5rem", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#9ca3af", width: "3rem", flexShrink: 0 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Enlace opcional (https:// o /dashboard/...)"
                    value={sendLink}
                    onChange={(e) => setSendLink(e.target.value)}
                    style={{
                      flex: 1, border: "none", outline: "none", fontSize: "0.8125rem",
                      color: "#6b7280", background: "transparent",
                    }}
                  />
                </div>

                {/* Rich text editor toolbar */}
                {editor && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.125rem", padding: "0.5rem 1.5rem",
                    borderBottom: "1px solid #f0f0f0", background: "#fafafa",
                  }}>
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
                      style={{ ...toolbarBtnStyle, fontWeight: editor.isActive("bold") ? 700 : 400, background: editor.isActive("bold") ? "#e5e7eb" : "transparent" }}
                      title="Negrita">
                      <strong>B</strong>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("italic") ? "#e5e7eb" : "transparent" }}
                      title="Cursiva">
                      <em>I</em>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("underline") ? "#e5e7eb" : "transparent" }}
                      title="Subrayado">
                      <span style={{ textDecoration: "underline" }}>U</span>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("strike") ? "#e5e7eb" : "transparent" }}
                      title="Tachado">
                      <span style={{ textDecoration: "line-through" }}>S</span>
                    </button>
                    <div style={{ width: 1, height: 18, background: "#e5e7eb", margin: "0 0.375rem" }} />
                    <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("bulletList") ? "#e5e7eb" : "transparent" }}
                      title="Lista">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("orderedList") ? "#e5e7eb" : "transparent" }}
                      title="Lista numerada">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><text x="1" y="6" fontSize="5" fontWeight="600">1.</text><text x="1" y="12" fontSize="5" fontWeight="600">2.</text><text x="1" y="18" fontSize="5" fontWeight="600">3.</text><line x1="8" y1="4" x2="19" y2="4" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </button>
                    <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("blockquote") ? "#e5e7eb" : "transparent" }}
                      title="Cita">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </button>
                    <div style={{ width: 1, height: 18, background: "#e5e7eb", margin: "0 0.375rem" }} />
                    <button type="button" onClick={() => {
                      const url = window.prompt("URL del enlace:");
                      if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
                    }}
                      style={{ ...toolbarBtnStyle, background: editor.isActive("link") ? "#e5e7eb" : "transparent" }}
                      title="Insertar enlace">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </button>
                  </div>
                )}

                {/* Editor body */}
                <div style={{ padding: "1rem 1.5rem", minHeight: "12rem" }}>
                  <EditorContent editor={editor} />
                </div>

                {/* Attachments area */}
                {attachments.length > 0 && (
                  <div style={{ padding: "0 1.5rem 0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {attachments.map((file, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.375rem 0.625rem", background: "#f5f5f5", borderRadius: "0.5rem",
                        border: "1px solid #e5e7eb", fontSize: "0.75rem", color: "#374151",
                      }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span style={{ maxWidth: "10rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                        <span style={{ color: "#9ca3af", fontSize: "0.6875rem" }}>{formatFileSize(file.size)}</span>
                        <button type="button" onClick={() => removeAttachment(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom bar: attachments + send */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.75rem 1.5rem", borderTop: "1px solid #f0f0f0", background: "#fafafa",
                  borderRadius: "0 0 0.75rem 0.75rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={{ ...toolbarBtnStyle, color: "#6b7280" }} title="Adjuntar archivo">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <button type="button" onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) setAttachments(prev => [...prev, ...Array.from(files)]);
                      };
                      input.click();
                    }}
                      style={{ ...toolbarBtnStyle, color: "#6b7280" }} title="Insertar imagen">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>
                      {sendMessage.length > 0 ? `${sendMessage.length} caracteres` : ""}
                    </span>
                    <button
                      type="submit"
                      disabled={sending || !sendTitle.trim() || !sendMessage.trim()}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.5rem 1.25rem", borderRadius: "1.5rem",
                        border: "none", cursor: sending || !sendTitle.trim() || !sendMessage.trim() ? "not-allowed" : "pointer",
                        fontSize: "0.8125rem", fontWeight: 600, color: "white",
                        background: sending || !sendTitle.trim() || !sendMessage.trim() ? "#93c5fd" : "#2563eb",
                        transition: "all 0.15s",
                      }}
                    >
                      {sending ? (
                        <>
                          <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          {IconSend} Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div className="section" style={{ padding: "1rem 1.25rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: "0.375rem" }}>Roles que reciben</p>
                <p style={{ fontSize: "0.8125rem", color: "#374151", lineHeight: 1.6 }}>Admins, Coordinadores, Facilitadores Internos, Facilitadores Inspiratoria, Project Managers</p>
              </div>
              <div className="section" style={{ padding: "1rem 1.25rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: "0.375rem" }}>Funcionamiento</p>
                <p style={{ fontSize: "0.8125rem", color: "#374151", lineHeight: 1.6 }}>La notificación aparece en la campana del header. Cada usuario la ve hasta marcarla como leída.</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── NOTIFICATION DETAIL MODAL ─── */}
      {selectedNotif && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedNotif(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "1rem", width: "100%", maxWidth: "32rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "0.5rem",
                  background: "#1a1a1a", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {NOTIFICATION_TYPE_ICONS[selectedNotif.notification_type] || NOTIFICATION_TYPE_ICONS.system}
                </div>
                <div>
                  <span style={{
                    fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: "0.05em", color: "#9ca3af",
                  }}>
                    {NOTIFICATION_LABELS[selectedNotif.notification_type] || selectedNotif.notification_type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                style={{
                  width: 32, height: 32, borderRadius: "0.5rem", border: "none",
                  background: "#f3f4f6", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "#6b7280",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1a1a1a", margin: "0 0 1rem" }}>
                {selectedNotif.title}
              </h2>

              {/* Sender + time */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f5f5f5",
              }}>
                {selectedNotif.sender_name && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "#FFD902", color: "#1a1a1a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.6875rem", fontWeight: 700,
                    }}>
                      {selectedNotif.sender_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                        {selectedNotif.sender_name}
                      </p>
                    </div>
                  </div>
                )}
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  {IconClock} {getRelativeTime(selectedNotif.created_at)}
                </span>
              </div>

              {/* Message body */}
              <div style={{
                fontSize: "0.875rem", color: "#374151", lineHeight: 1.75,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {selectedNotif.message}
              </div>

              {/* Link */}
              {selectedNotif.link && (selectedNotif.link.startsWith("http") || selectedNotif.link.startsWith("/")) && (
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f5f5f5" }}>
                  <a
                    href={selectedNotif.link}
                    target={selectedNotif.link.startsWith("http") ? "_blank" : undefined}
                    rel={selectedNotif.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.8125rem", fontWeight: 500, color: "#2563eb",
                      textDecoration: "none",
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Abrir enlace
                  </a>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", background: "#fafafa",
            }}>
              <button
                onClick={() => { deleteNotification(selectedNotif.id); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.75rem", fontWeight: 500, color: "#dc2626",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                {IconTrash} Eliminar
              </button>
              <button
                onClick={() => setSelectedNotif(null)}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                  border: "none", background: "#1a1a1a", color: "white",
                  fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
