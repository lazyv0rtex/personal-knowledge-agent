"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, RefreshCw, Send, FileText, CheckCircle2, AlertTriangle, Loader2, Settings as SettingsIcon, KeyRound, Trash2, Lightbulb, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SettingsModal from "./SettingsModal";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; sources?: SourceRef[] };
type SourceRef = { source: string; snippet: string };
type Provider = "openrouter" | "openai" | "anthropic" | "google";
type PublicSettings = {
  provider: Provider;
  model: string;
  hasKey: boolean;
  envFallbackAvailable: boolean;
};
type SyncStatus = {
  indexed: boolean;
  documentCount: number;
  chunkCount: number;
  lastSyncedAt: string | null;
  notesDir: string;
  settings: PublicSettings;
};

const PROVIDER_LABEL: Record<Provider, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Gemini",
};

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [conversations, setConversations] = useState<{ id: string; title: string; timestamp: number }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/status");
      if (res.ok) setStatus(await res.json());
    } catch {}
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      await fetchStatus();
      setToast({ kind: "ok", msg: `Synced ${data.status.documentCount} files (${data.status.chunkCount} chunks).` });
    } catch (e: any) {
      setToast({ kind: "err", msg: e.message || "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
  }

  async function handleSend(overrideInput?: string) {
    const q = (overrideInput ?? input).trim();
    if (!q || sending) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${e.message || "Error"}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-border bg-panel flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold">Knowledge Agent</div>
            <div className="text-xs text-neutral-400">
              {status ? `${PROVIDER_LABEL[status.settings.provider]} · local notes` : "local notes"}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 transition"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? "Syncing…" : "Sync notes folder"}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-[#0e1216] hover:border-neutral-600 text-neutral-200 text-sm font-medium px-3 py-2 transition"
          >
            <SettingsIcon className="h-4 w-4" />
            Model & API keys
          </button>

          <div className="rounded-lg border border-border bg-[#0e1216] p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-300">
              <KeyRound className="h-3.5 w-3.5" />
              <span className="font-medium">Model</span>
            </div>
            <div className="text-neutral-400">
              Provider:{" "}
              <span className="text-neutral-200">
                {status ? PROVIDER_LABEL[status.settings.provider] : "…"}
              </span>
            </div>
            <div className="text-neutral-400">
              Model: <span className="text-neutral-200 break-all">{status?.settings.model ?? "…"}</span>
            </div>
            <div className="text-neutral-400">
              Key:{" "}
              {status?.settings.hasKey ? (
                <span className="text-emerald-400">saved</span>
              ) : status?.settings.envFallbackAvailable ? (
                <span className="text-emerald-400">from .env</span>
              ) : (
                <button onClick={() => setSettingsOpen(true)} className="text-amber-400 underline">
                  not set — click to add
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-[#0e1216] p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-300">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">Index</span>
            </div>
            <div className="text-neutral-400">Folder: <span className="text-neutral-200 break-all">{status?.notesDir ?? "…"}</span></div>
            <div className="text-neutral-400">Files: <span className="text-neutral-200">{status?.documentCount ?? 0}</span></div>
            <div className="text-neutral-400">Chunks: <span className="text-neutral-200">{status?.chunkCount ?? 0}</span></div>
            <div className="text-neutral-400">
              Last sync:{" "}
              <span className="text-neutral-200">
                {status?.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : "never"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto px-4 py-3 border-t border-border space-y-3">
          <div>
            <div className="flex items-center gap-2 text-neutral-300 mb-2">
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Quick prompts</span>
            </div>
            <div className="space-y-1.5">
              {[
                "Summarize my notes",
                "What are the main topics?",
                "Find action items",
                "Recent ideas and insights",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    handleQuickPrompt(prompt);
                    handleSend(prompt);
                  }}
                  className="w-full text-left text-[11px] px-2 py-1.5 rounded bg-[#0a0c0f] border border-border hover:border-accent/40 text-neutral-300 hover:text-neutral-100 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Drop `.md`, `.mdx`, `.txt` files in your notes folder, then click sync.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Chat with your notes</h1>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="text-xs text-neutral-400">
            {status?.indexed ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> index ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> no index — run sync
              </span>
            )}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.length === 0 && (
              <div className="rounded-xl border border-border bg-panel p-6 text-sm text-neutral-300">
                <div className="font-medium mb-1">Start by syncing your notes.</div>
                <p className="text-neutral-400">
                  The app reads files from your notes folder, embeds them locally, and stores vectors in
                  HNSWLib on disk. Questions are answered by Claude 3.5 Sonnet via OpenRouter using
                  retrieved context.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> thinking…
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Ask something about your notes…"
              className="flex-1 resize-none rounded-lg bg-panel border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent/60 min-h-[44px] max-h-40"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 transition"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </footer>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => {
          fetchStatus();
          setToast({ kind: "ok", msg: "Settings saved." });
        }}
      />

      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-2 rounded-lg text-sm shadow-lg border ${
            toast.kind === "ok"
              ? "bg-emerald-900/40 border-emerald-700 text-emerald-200"
              : "bg-red-900/40 border-red-700 text-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
          isUser
            ? "bg-accent/20 border-accent/30 text-neutral-100"
            : "bg-panel border-border text-neutral-100"
        }`}
      >
        <div className="prose-chat">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/70 space-y-1.5">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400">Sources</div>
            {msg.sources.map((s, i) => (
              <div key={i} className="text-xs text-neutral-300">
                <span className="text-accent">{s.source}</span>
                <div className="text-neutral-400 line-clamp-2">{s.snippet}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
