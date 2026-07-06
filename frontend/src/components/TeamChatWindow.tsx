"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface TeamChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  created_at: string;
}

interface CurrentUser {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
}

/**
 * Chat interno en tiempo real del equipo Inspiratoria.
 * Restringido a usuarios activos con email @inspiratoria.org (verificado
 * también server-side en el socket y en el endpoint de historial).
 * Se abre/cierra desde el ítem "Chat de Equipo" del sidebar vía CustomEvent.
 */
export default function TeamChatWindow({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [online, setOnline] = useState<{ id: string; name: string; email: string }[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const eligible = !!user?.email && user.email.toLowerCase().endsWith("@inspiratoria.org");

  // Toggle abierto/cerrado desde el sidebar
  useEffect(() => {
    const handler = () => setOpen((o) => !o);
    window.addEventListener("toggleTeamChat", handler);
    return () => window.removeEventListener("toggleTeamChat", handler);
  }, []);

  // Reset de no leídos al abrir + avisar al sidebar
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("teamChatUnread", { detail: unread }));
  }, [unread]);

  // Conexión al socket (una sola vez, si el usuario es elegible)
  useEffect(() => {
    if (!eligible || !user?.id) return;

    const socket = io(API_URL, { path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_team_chat", { user_id: user.id });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("team_chat_denied", (d: { message: string }) => setDenied(d?.message || "Acceso restringido"));
    socket.on("team_chat_history", (history: TeamChatMessage[]) => setMessages(history || []));
    socket.on("team_chat_presence", (list: { id: string; name: string; email: string }[]) => setOnline(list || []));
    socket.on("team_chat_message", (msg: TeamChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender_id !== user.id) {
        setOpen((isOpen) => {
          if (!isOpen) setUnread((u) => u + 1);
          return isOpen;
        });
      }
    });

    return () => {
      socket.emit("leave_team_chat");
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, user?.id]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    const content = input.trim();
    if (!content || !socketRef.current) return;
    socketRef.current.emit("send_team_message", { content });
    setInput("");
  };

  if (!eligible || !open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[540px] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-900 text-white flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">Chat de Equipo</div>
          <div className="text-[10.5px] text-zinc-400 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-500"}`} />
            {connected ? `${online.length} conectado${online.length === 1 ? "" : "s"}` : "Conectando…"}
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition flex-shrink-0"
          aria-label="Cerrar chat"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mensajes */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-zinc-50 min-h-[280px]">
        {denied ? (
          <div className="text-center py-8">
            <p className="text-[12.5px] text-red-600 font-medium">{denied}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[12.5px] text-zinc-400">Sin mensajes todavía. ¡Escribí el primero!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && <span className="text-[10px] font-semibold text-zinc-500 mb-0.5 px-1">{m.sender_name}</span>}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-[12.5px] leading-relaxed break-words ${
                    isMine ? "bg-zinc-900 text-white rounded-br-sm" : "bg-white text-zinc-800 border border-zinc-200 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[9.5px] text-zinc-400 mt-0.5 px-1">
                  {new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {!denied && (
        <div className="p-2.5 border-t border-zinc-100 flex items-center gap-2 flex-shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Escribí un mensaje…"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-zinc-200 text-[12.5px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition"
          />
          <button
            onClick={send}
            disabled={!input.trim() || !connected}
            className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 disabled:opacity-40 transition flex-shrink-0"
            aria-label="Enviar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
