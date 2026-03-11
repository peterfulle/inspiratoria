"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { backendUrl } from "@/lib/api";

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatWindowProps {
  matchId: number;
  currentUserId: number;
  currentUserName: string;
  recipientName: string;
  darkMode?: boolean;
  onClose: () => void;
}

export default function ChatWindow({
  matchId,
  currentUserId,
  currentUserName,
  recipientName,
  darkMode = false,
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conectar Socket.IO
  useEffect(() => {
    const socketInstance = io(backendUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);
      
      // Unirse a la sala del match
      socketInstance.emit("join_match", { match_id: matchId, user_id: currentUserId });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // Recibir mensajes previos
    socketInstance.on("previous_messages", (data: Message[]) => {
      console.log("Previous messages received:", data);
      setMessages(data);
    });

    // Recibir nuevos mensajes
    socketInstance.on("new_message", (message: Message) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    // Confirmación de mensaje enviado
    socketInstance.on("message_sent", (message: Message) => {
      console.log("Message sent confirmed:", message);
    });

    socketInstance.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [matchId, currentUserId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      match_id: matchId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      content: newMessage.trim(),
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`flex h-[600px] w-[500px] flex-col rounded-xl border shadow-2xl ${
        darkMode
          ? "border-gray-700 bg-dark-400"
          : "border-gray-200 bg-white"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-4 ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              darkMode ? "bg-primary-500/20" : "bg-primary-500/30"
            }`}>
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h3 className="font-bold">{recipientName}</h3>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {isConnected ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    En línea
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                    Desconectado
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition ${
              darkMode
                ? "hover:bg-dark-300"
                : "hover:bg-gray-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          darkMode ? "bg-dark-500" : "bg-gray-50"
        }`}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <span className="text-6xl opacity-20">💬</span>
              <p className={`mt-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                No hay mensajes aún
              </p>
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Envía el primer mensaje para iniciar la conversación
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? "bg-primary-500 text-black"
                        : darkMode
                        ? "bg-dark-400 text-white"
                        : "bg-white text-black border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`mt-1 text-xs ${
                      isOwnMessage
                        ? "text-black/70"
                        : darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t p-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className={`flex-1 resize-none rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                darkMode
                  ? "border-gray-700 bg-dark-300 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-black placeholder-gray-400"
              }`}
              rows={2}
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className={`rounded-lg px-4 py-2 font-semibold transition ${
                !newMessage.trim() || !isConnected
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-primary-500 text-black hover:bg-primary-400"
              }`}
            >
              Enviar
            </button>
          </div>
          <p className={`mt-2 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
