"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Trash2, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; sources?: SourceRef[] };
type SourceRef = { source: string; snippet: string };

export default function AIChat() {
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
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">Ask questions about your notes:</p>
            {["Summarize my notes", "What are the main topics?", "Find action items"].map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-[#0a0c0f] border border-border hover:border-accent/40 text-neutral-300 hover:text-neutral-100 transition"
              >
                <Lightbulb className="h-3 w-3 inline mr-1.5 text-accent" />
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
            </div>
          )}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={() => setMessages([])}
            className="text-xs text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1.5 transition"
          >
            <Trash2 className="h-3 w-3" /> Clear chat
          </button>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
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
            placeholder="Ask about your notes..."
            className="flex-1 resize-none rounded-lg bg-[#0a0c0f] border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent/60 min-h-[36px] max-h-32"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed border ${
          isUser
            ? "bg-accent/20 border-accent/30 text-neutral-100"
            : "bg-[#0a0c0f] border-border text-neutral-100"
        }`}
      >
        <div className="prose-chat prose-sm">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-neutral-400">Sources</div>
            {msg.sources.map((s, i) => (
              <div key={i} className="text-[10px] text-neutral-300">
                <span className="text-accent">{s.source}</span>
                <div className="text-neutral-400 line-clamp-1">{s.snippet}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
