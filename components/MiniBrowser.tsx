"use client";

import { useState, useRef } from "react";
import { Globe, ArrowLeft, ArrowRight, RefreshCw, X, Search } from "lucide-react";

const QUICK_LINKS = [
  { label: "Google", url: "https://www.google.com/webhp?igu=1" },
  { label: "Wikipedia", url: "https://en.m.wikipedia.org" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "MDN", url: "https://developer.mozilla.org" },
];

export default function MiniBrowser() {
  const [url, setUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function navigate(target: string) {
    let finalUrl = target.trim();
    if (!finalUrl) return;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
        finalUrl = "https://" + finalUrl;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}&igu=1`;
      }
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    const newHistory = [...history.slice(0, historyIdx + 1), finalUrl];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  }

  function goBack() {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setUrl(history[idx]);
      setInputUrl(history[idx]);
    }
  }

  function goForward() {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1;
      setHistoryIdx(idx);
      setUrl(history[idx]);
      setInputUrl(history[idx]);
    }
  }

  function refresh() {
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={goBack}
          disabled={historyIdx <= 0}
          className="p-1 rounded hover:bg-white/5 disabled:opacity-30 transition"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={goForward}
          disabled={historyIdx >= history.length - 1}
          className="p-1 rounded hover:bg-white/5 disabled:opacity-30 transition"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={refresh}
          disabled={!url}
          className="p-1 rounded hover:bg-white/5 disabled:opacity-30 transition"
          style={{ color: "var(--text-muted)" }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <form
          className="flex-1 flex items-center rounded-lg px-2 py-1 gap-1.5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          onSubmit={(e) => { e.preventDefault(); navigate(inputUrl); }}
        >
          <Search className="h-3 w-3 shrink-0" style={{ color: "var(--text-muted)" }} />
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent text-[11px] focus:outline-none"
            style={{ color: "var(--text)" }}
          />
          {inputUrl && (
            <button type="button" onClick={() => setInputUrl("")}>
              <X className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </form>
      </div>

      {/* Quick links */}
      {!url && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <Globe className="h-10 w-10 opacity-20" style={{ color: "var(--accent)" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Browse or search from here</p>
          <div className="grid grid-cols-2 gap-2 w-full">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.url}
                onClick={() => navigate(link.url)}
                className="text-xs px-3 py-2 rounded-lg text-left transition hover:opacity-80"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                <Globe className="h-3 w-3 inline mr-1.5 opacity-60" />
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* iFrame */}
      {url && (
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Mini Browser"
          />
        </div>
      )}
    </div>
  );
}
