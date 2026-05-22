"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { createRepositories } from "@/infrastructure/repositories";
import type { ChatThread, ChatMessage } from "@/core/entities/Chat";
import { Send, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ChatPanelProps {
  actionId: string;
  threads: ChatThread[];
  defaultThreadId: string | null;
  currentUserId: string;
}

export function ChatPanel({
  actionId,
  threads: initialThreads,
  defaultThreadId,
  currentUserId,
}: ChatPanelProps) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [threadId, setThreadId] = useState<string | null>(defaultThreadId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const repos = createRepositories(supabase);
  const currentThread = threadId ?? threads[0]?.id;

  const enrichNames = useCallback(
    async (msgs: ChatMessage[]) => {
      const ids = [...new Set(msgs.map((m) => m.sender_id))];
      const missing = ids.filter((id) => !names[id]);
      if (missing.length === 0) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", missing);
      const next: Record<string, string> = { ...names };
      for (const p of data ?? []) {
        next[p.id] = p.full_name ?? "Ciudadano";
      }
      setNames(next);
    },
    [names, supabase]
  );

  const loadMessages = useCallback(async () => {
    if (!currentThread) return;
    const list = await repos.chat.getMessages(currentThread);
    setMessages(list);
    await enrichNames(list);
  }, [currentThread, repos.chat, enrichNames]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!currentThread) return;
    const channel = supabase
      .channel(`chat-${currentThread}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "action_chat_messages",
          filter: `thread_id=eq.${currentThread}`,
        },
        () => {
          void loadMessages();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentThread, supabase, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentThread) return;
    setLoading(true);
    try {
      await repos.chat.sendMessage(currentThread, actionId, currentUserId, input.trim());
      setInput("");
      await loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTopicTitle.trim() || "Nuevo tema";
    try {
      const newThread = await repos.chat.createThread(actionId, title);
      setThreads((prev) => [...prev, newThread]);
      setThreadId(newThread.id);
      setNewTopicTitle("");
      setShowNewTopic(false);
    } catch {
      /* ignore */
    }
  };

  if (threads.length === 0) {
    return (
      <Card className="p-8 text-center text-[var(--muted)]">
        No hay hilos de chat.
      </Card>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <p className="text-xs text-[var(--muted)]">
        Coordina con tu equipo aquí. Los mensajes quedan en la bitácora de la acción.
      </p>
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThreadId(t.id)}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-card text-sm font-medium transition-colors",
                  currentThread === t.id
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--surface-hover)]"
                )}
              >
                {t.title ?? "Sin título"}
              </button>
            ))}
          </div>
          {showNewTopic ? (
            <form onSubmit={handleCreateTopic} className="flex items-center gap-2">
              <input
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Nombre del tema"
                className="w-40 rounded-card border px-2 py-1 text-sm"
                autoFocus
              />
              <Button type="submit" size="sm" variant="accent">
                Crear
              </Button>
              <button type="button" onClick={() => setShowNewTopic(false)}>
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewTopic(true)}>
              <Plus className="h-4 w-4" />
              Nuevo tema
            </Button>
          )}
        </div>
      </Card>
      <Card className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px]">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-card px-3 py-2 text-sm",
                  mine
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--surface-hover)]"
                )}
              >
                <p className="text-[10px] opacity-80 mb-1">
                  {names[m.sender_id] ?? "…"} ·{" "}
                  {new Date(m.created_at).toLocaleString("es-CO", {
                    timeZone: "America/Bogota",
                  })}
                </p>
                <p>{m.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </Card>
      <Card className="p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje al equipo…"
            className="flex-1 rounded-card border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2 rounded-card bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </Card>
    </div>
  );
}
