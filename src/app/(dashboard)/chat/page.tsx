"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  Trash2,
  CaptionsIcon,
  Loader2,
  Sparkles,
} from "lucide-react";

const MODELS = [
  { key: "free-developer", label: "Auto (Free)", provider: "9router" },
  { key: "groq-llama4", label: "Llama 4 Maverick", provider: "Groq" },
  { key: "groq-llama", label: "Llama 3.3 70B", provider: "Groq" },
  { key: "groq-qwen", label: "Qwen 32B", provider: "Groq" },
  { key: "cerebras-zai", label: "ZAI GLM 4.7", provider: "Cerebras" },
  { key: "cerebras-qwen", label: "Qwen 3 235B", provider: "Cerebras" },
  { key: "gemini-flash", label: "Gemini 3 Flash", provider: "Gemini" },
  { key: "gemini-pro", label: "Gemini 3.1 Pro", provider: "Gemini" },
];

const PROVIDER_COLORS: Record<string, string> = {
  "9router": "bg-gradient-to-r from-purple-500 to-blue-500",
  Groq: "bg-emerald-500",
  Cerebras: "bg-orange-500",
  Gemini: "bg-blue-500",
};

interface Citation {
  source: string;
  text: string;
  score: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: Citation[];
  model_used?: string;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
}

interface MeetingItem {
  id: string;
  title: string;
  date: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("free-developer");
  const [isNewChat, setIsNewChat] = useState(true);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchSessions();
    fetchMeetings();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMeetings() {
    try {
      const res = await fetch("/api/meetings?limit=100");
      const json = await res.json();
      if (json.success) setMeetings(json.data);
    } catch {}
  }

  async function fetchSessions() {
    try {
      const res = await fetch("/api/chat/sessions");
      const json = await res.json();
      if (json.success) {
        setSessions(
          json.data.map((s: { id: string; title: string; updatedAt: string; _count: { messages: number } }) => ({
            id: s.id,
            title: s.title,
            updatedAt: new Date(s.updatedAt),
            messageCount: s._count?.messages ?? 0,
          }))
        );
      }
    } catch {}
  }

  async function fetchMessages(sessionId: string) {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(
          json.data.messages.map((m: { id: string; role: string; content: string; metadata: unknown }) => {
            const meta = (m.metadata ?? {}) as { citations?: Citation[]; model_used?: string };
            return {
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              citations: meta.citations,
              model_used: meta.model_used,
            };
          })
        );
      }
    } catch {}
  }

  async function createSession(title = "Chat Baru"): Promise<string | null> {
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
              meetingId: selectedMeetingId && selectedMeetingId !== "all" ? selectedMeetingId : undefined,
          contextType: selectedMeetingId ? "meeting" : "general",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSessions((prev) => [
          { id: json.data.id, title: json.data.title, updatedAt: new Date(json.data.updatedAt), messageCount: 0 },
          ...prev,
        ]);
        return json.data.id;
      }
    } catch {}
    return null;
  }

  const handleNewChat = async () => {
    const sid = await createSession();
    if (sid) {
      setActiveSession(sid);
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: selectedMeetingId
            ? `Siap! Saya sudah membaca konteks rapat yang dipilih. Silakan tanyakan seputar rapat tersebut.`
            : "Selamat datang di AI Chat. Silakan tanyakan apa saja seputar rapat-rapat Anda!",
        },
      ]);
      setIsNewChat(false);
    }
  };

  const selectSession = (sid: string) => {
    setActiveSession(sid);
    setIsNewChat(false);
    fetchMessages(sid);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    abortRef.current?.abort();

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    const streamMsgId = crypto.randomUUID();
    const streamMsg: ChatMessage = { id: streamMsgId, role: "assistant", content: "", isStreaming: true, model_used: model };

    setMessages((prev) => [...prev, userMsg, streamMsg]);
    setInput("");
    setIsLoading(true);

    let sessionId = activeSession;
    if (!sessionId) {
      sessionId = await createSession();
      if (!sessionId) { setIsLoading(false); return; }
      setActiveSession(sessionId);
      setIsNewChat(false);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/chat/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMsg.content,
          model,
          meeting_ids: selectedMeetingId && selectedMeetingId !== "all" ? [selectedMeetingId] : undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "{}") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamMsgId ? { ...m, content: m.content + parsed.token } : m
                )
              );
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsgId
            ? { ...m, content: "Maaf, terjadi kesalahan. Silakan coba lagi.", isStreaming: false }
            : m
        )
      );
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === streamMsgId ? { ...m, isStreaming: false } : m))
    );
    setIsLoading(false);
    fetchSessions();
  }, [input, isLoading, model, activeSession, selectedMeetingId]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="hidden w-72 shrink-0 flex-col lg:flex">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-headline-sm text-on-surface">Riwayat Chat</h2>
          <Button variant="ghost" size="icon" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={`w-full rounded-lg p-3 text-left transition-colors ${
                activeSession === session.id
                  ? "bg-primary-container text-on-primary-container"
                  : "hover:bg-surface-container-high text-on-surface"
              }`}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium">{session.title}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {session.messageCount} pesan
                  </p>
                </div>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-center text-body-sm text-on-surface-variant py-8">
              Belum ada sesi chat
            </p>
          )}
        </div>
      </div>

      <GlassPanel className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-container px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-headline-sm text-on-surface">
              {isNewChat ? "AI Chat" : sessions.find((s) => s.id === activeSession)?.title ?? "AI Chat"}
            </h2>
            {!isNewChat && activeSession && (
              <Button variant="ghost" size="icon" onClick={() => { setActiveSession(null); setMessages([]); setIsNewChat(true); }}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua rapat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua rapat</SelectItem>
                {meetings.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-48">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${PROVIDER_COLORS[m.provider]}`} />
                      {m.label}
                      <span className="text-xs text-on-surface-variant">({m.provider})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-xs text-on-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`rounded-xl px-4 py-3 text-body-sm ${
                    msg.role === "user"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface"
                  }`}
                >
                  {msg.content || (msg.isStreaming ? "" : "")}
                  {msg.isStreaming && msg.content && (
                    <span className="inline-block ml-0.5 w-2 h-4 bg-primary animate-pulse" />
                  )}
                  {msg.isStreaming && !msg.content && (
                    <span className="flex items-center gap-2 text-on-surface-variant">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menulis...
                    </span>
                  )}
                  {msg.model_used && msg.role === "assistant" && !msg.isStreaming && (
                    <div className="mt-2 flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                      <Sparkles className="h-3 w-3" />
                      {MODELS.find((m) => m.key === msg.model_used)?.label ?? msg.model_used}
                    </div>
                  )}
                </div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-1">
                    {msg.citations.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-surface-container bg-surface-container-low p-2 text-label-sm text-on-surface-variant"
                      >
                        <CaptionsIcon className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>
                          <strong>{c.source}</strong>: {c.text}
                          <span className="ml-1 text-primary">
                            ({(c.score * 100).toFixed(0)}% match)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary-container text-xs text-on-primary-container">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <Separator />
        <div className="flex items-center gap-3 p-4">
          <Input
            placeholder={
              selectedMeetingId
                ? "Tanyakan tentang rapat ini..."
                : "Tanyakan tentang rapat..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="mr-2 h-4 w-4" />
            Kirim
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
