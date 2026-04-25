"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Trash2, Lightbulb, Globe, FileText, FilePlus, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTheme } from "./ThemeProvider";

type Role = "user" | "assistant";
type SourceRef = { source: string; snippet: string; type?: "note" | "web"; url?: string };
type NoteAction = { filename: string; content: string };
type Message = {
  id: string;
  role: Role;
  content: string;
  sources?: SourceRef[];
  noteAction?: NoteAction;
  webSearched?: boolean;
};

type Props = { activeNote?: string | null };

export default function AIChat({ activeNote }: Props) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

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
          activeNote: activeNote ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          noteAction: data.noteAction,
          webSearched: data.webSearched,
        },
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

  const quickPrompts = [
    { label: "Summarize my notes", icon: "📝" },
    { label: "Search the web for latest AI news", icon: "🌐" },
    { label: "Find action items in my notes", icon: "✅" },
    { label: "Write a note about my goals today", icon: "✍️" },
  ];

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium mb-3" style={{ color: theme.textMuted }}>
              Try asking:
            </p>
            {quickPrompts.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => handleSend(label)}
                className="w-full text-left text-[11px] px-3 py-2 rounded-lg transition flex items-center gap-2"
                style={{
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                }}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
            {activeNote && (
              <div
                className="text-[10px] px-3 py-2 rounded-lg mt-2"
                style={{ background: theme.accent + "15", color: theme.accent, border: `1px solid ${theme.accent}33` }}
              >
                <FileText className="h-3 w-3 inline mr-1.5" />
                Context: <strong>{activeNote}</strong>
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} theme={theme} />
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>thinking…</span>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="px-3 py-1.5 border-t" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setMessages([])}
            className="text-[11px] inline-flex items-center gap-1.5 transition"
            style={{ color: theme.textMuted }}
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      <div className="p-3 border-t" style={{ borderColor: theme.border }}>
        {activeNote && (
          <div className="text-[10px] mb-2 flex items-center gap-1" style={{ color: theme.textMuted }}>
            <FileText className="h-3 w-3" /> Aware of: <span style={{ color: theme.accent }}>{activeNote}</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            rows={1}
            placeholder="Ask, search web, or write notes…"
            className="flex-1 resize-none rounded-lg px-3 py-2 text-xs focus:outline-none min-h-[36px] max-h-32"
            style={{
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              color: theme.text,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="rounded-lg text-white text-xs font-medium px-3 py-2 transition disabled:opacity-50"
            style={{ background: theme.accent }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: theme.textMuted }}>
          Say "search the web for…" · "write a note about…"
        </p>
      </div>
    </>
  );
}

function MessageBubble({ msg, theme }: { msg: Message; theme: any }) {
  const isUser = msg.role === "user";
  const noteSources = msg.sources?.filter((s) => s.type !== "web") ?? [];
  const webSources = msg.sources?.filter((s) => s.type === "web") ?? [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[95%] rounded-xl px-3 py-2 text-xs leading-relaxed"
        style={
          isUser
            ? { background: theme.accent + "22", border: `1px solid ${theme.accent}44`, color: theme.text }
            : { background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }
        }
      >
        <div className="prose-chat">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>

        {/* Note written confirmation */}
        {msg.noteAction && (
          <div
            className="mt-2 px-2 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5"
            style={{ background: theme.accent + "18", color: theme.accent, border: `1px solid ${theme.accent}33` }}
          >
            <FilePlus className="h-3 w-3 shrink-0" />
            Saved to <strong>{msg.noteAction.filename}</strong>
          </div>
        )}

        {/* Web sources */}
        {webSources.length > 0 && (
          <div className="mt-2 pt-2 space-y-1" style={{ borderTop: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide" style={{ color: theme.textMuted }}>
              <Globe className="h-3 w-3" /> Web sources
            </div>
            {webSources.map((s, i) => (
              <div key={i} className="text-[10px]">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: theme.accent }}>
                    {s.source} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <span style={{ color: theme.accent }}>{s.source}</span>
                )}
                <div className="line-clamp-2 mt-0.5" style={{ color: theme.textMuted }}>{s.snippet}</div>
              </div>
            ))}
          </div>
        )}

        {/* Note sources */}
        {noteSources.length > 0 && (
          <div className="mt-2 pt-2 space-y-1" style={{ borderTop: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide" style={{ color: theme.textMuted }}>
              <FileText className="h-3 w-3" /> From notes
            </div>
            {noteSources.map((s, i) => (
              <div key={i} className="text-[10px]">
                <span style={{ color: theme.accent }}>{s.source}</span>
                <div className="line-clamp-1 mt-0.5" style={{ color: theme.textMuted }}>{s.snippet}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
