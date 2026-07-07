const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

interface AIFetchOptions {
  method?: string;
  body?: unknown;
  timeout?: number;
}

async function aiFetch<T>(path: string, options: AIFetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = options.timeout ?? 30000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: options.method ?? "POST",
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.detail ?? err.message ?? "AI service error");
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const ai = {
  // Speech Recognition
  transcribe: async (file: File, meetingId: string, language = "id") => {
    const form = new FormData();
    form.append("file", file);
    form.append("meeting_id", meetingId);
    form.append("language", language);
    const res = await fetch(`${AI_SERVICE_URL}/api/v1/transcription/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Transcription failed");
    return res.json();
  },

  // NLP
  normalize: (text: string) =>
    aiFetch<{ original: string; normalized: string; changes: unknown[] }>("/api/v1/nlp/normalize", {
      body: { text, normalize_numbers: true, normalize_currency: true, normalize_dates: true, capitalize: true, fix_punctuation: true },
    }),

  summarize: (text: string) =>
    aiFetch<{ summary: string }>("/api/v1/nlp/summarize", {
      body: { text },
    }),

  // Government Intelligence
  extractGovernmentEntities: (text: string) =>
    aiFetch<{ entities: unknown[] }>("/api/v1/government/extract", {
      body: { text },
    }),

  // Context Understanding
  extractContext: (text: string) =>
    aiFetch<{ action_items: unknown[]; decisions: unknown[] }>("/api/v1/context/extract", {
      body: { text },
    }),

  // Minutes Generator
  generateMinutes: (data: {
    meeting_id: string;
    template_type: string;
    title: string;
    date: string;
    location: string;
    participants: unknown[];
    transcript: unknown[];
  }) => aiFetch("/api/v1/minutes/generate", { body: data }),

  getTemplates: () =>
    aiFetch<Record<string, unknown>>("/api/v1/minutes/templates", { method: "GET" }),

  // AI Chat / RAG
  chat: (sessionId: string, message: string, meetingIds?: string[]) =>
    aiFetch<{ answer: string; citations: unknown[] }>("/api/v1/chat/ask", {
      body: { session_id: sessionId, message, meeting_ids: meetingIds },
    }),

  indexMeeting: (meetingId: string, textChunks: { text: string; source: string }[]) =>
    aiFetch("/api/v1/chat/index", {
      body: { meeting_id: meetingId, text_chunks: textChunks },
    }),

  // Health
  health: () => aiFetch<{ status: string }>("/api/v1/health", { method: "GET" }),
};
