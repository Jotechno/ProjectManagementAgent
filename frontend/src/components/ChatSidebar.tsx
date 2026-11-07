"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import {
  MessageSquare,
  Send,
  PanelRightClose,
  PanelRightOpen,
  Bot,
  User,
} from "lucide-react";
import { BoardData, ChatMessage } from "@/types/kanban";
import { sendChatMessage } from "@/lib/api";

interface ChatSidebarProps {
  onBoardUpdate?: (updatedBoard: BoardData) => void;
  defaultOpen?: boolean;
}

export function ChatSidebar({
  onBoardUpdate,
  defaultOpen = true,
}: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const historySnapshot = [...messages];
    const userMessage: ChatMessage = { role: "user", content: trimmed };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed, historySnapshot);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.updated_board && onBoardUpdate) {
        onBoardUpdate(response.updated_board);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo obtener respuesta del asistente de IA."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!isOpen) {
    return (
      <aside
        data-testid="chat-sidebar-collapsed"
        className="shrink-0 flex flex-col items-center py-4 px-2 bg-white border-l border-slate-200 shadow-sm"
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          data-testid="chat-toggle-btn"
          aria-expanded={false}
          aria-label="Abrir chat con IA"
          title="Abrir asistente IA"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary-purple text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          <PanelRightOpen className="w-4 h-4" />
          <span>Asistente IA</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      data-testid="chat-sidebar"
      className="w-80 lg:w-96 shrink-0 flex flex-col bg-white border-l border-slate-200 shadow-sm h-[calc(100vh-76px)] sticky top-0"
    >
      <div className="bg-dark-navy text-white px-4 py-3 border-b-2 border-accent-yellow flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-blue/20 border border-primary-blue/40 text-accent-yellow">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              Asistente IA Kanban
            </h2>
            <p className="text-[11px] text-text-gray">
              Crea, edita o mueve tarjetas
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          data-testid="chat-toggle-btn"
          aria-expanded={true}
          aria-label="Ocultar chat con IA"
          title="Ocultar asistente IA"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div
        data-testid="chat-messages"
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60"
      >
        {messages.length === 0 && !isLoading && (
          <div
            data-testid="chat-empty-state"
            className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-white"
          >
            <Bot className="w-7 h-7 mx-auto mb-2 text-primary-blue" />
            <p className="text-xs font-semibold text-dark-navy mb-1">
              Gestiona tu tablero con IA
            </p>
            <p className="text-xs text-text-gray leading-relaxed">
              Escribe una instrucción para crear, editar, mover o eliminar
              tarjetas del proyecto.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              data-testid={`chat-message-${idx}`}
              data-role={msg.role}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-dark-navy text-accent-yellow flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-primary-blue text-white rounded-br-sm"
                    : "bg-white text-dark-navy border border-slate-200 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {isUser && (
                <div className="w-6 h-6 rounded-full bg-secondary-purple text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div
            data-testid="chat-loading"
            className="flex items-center gap-2 text-xs font-medium text-text-gray bg-white border border-slate-200 rounded-xl px-3.5 py-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse" />
            <span>Pensando...</span>
          </div>
        )}
      </div>

      {error && (
        <div
          data-testid="chat-error"
          role="alert"
          className="mx-4 mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Escribe un mensaje para la IA..."
          data-testid="chat-input"
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-dark-navy placeholder:text-text-gray focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          data-testid="chat-send-btn"
          aria-label="Enviar mensaje"
          className="px-3.5 py-2 rounded-xl bg-secondary-purple text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </aside>
  );
}

