"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  Brain,
  FileText,
  Settings as SettingsIcon,
  Github,
  Palette,
  Plus,
  RefreshCw,
  MessageSquare,
  X,
  Calculator as CalcIcon,
  Globe,
  ChevronLeft,
  ChevronRight,
  Check,
  FolderSync,
} from "lucide-react";
import FileTree from "./FileTree";
import NoteEditor from "./NoteEditor";
import AIChat from "./AIChat";
import SettingsModal from "./SettingsModal";
import Calculator from "./Calculator";
import MiniBrowser from "./MiniBrowser";
import { useTheme } from "./ThemeProvider";
import { THEMES } from "@/lib/themes";

type NoteTree = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: NoteTree[];
};

type Tab = "notes" | "settings" | "github" | "themes";
type LeftPanel = "files" | "calc" | "browser";

export default function NotesApp() {
  const { theme, setThemeId } = useTheme();
  const [tree, setTree] = useState<NoteTree[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftPanel, setLeftPanel] = useState<LeftPanel>("files");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [newNoteName, setNewNoteName] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);
  const [githubStatus, setGithubStatus] = useState<"idle" | "pushing" | "done" | "error">("idle");
  const [githubMsg, setGithubMsg] = useState("");

  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setAiOpen((prev) => !prev);
  });

  useEffect(() => {
    loadTree();
  }, []);

  async function loadTree() {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree);
      }
    } catch (e) {
      console.error("Failed to load notes:", e);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      await loadTree();
      setSyncMsg(`✓ Synced ${data.status?.documentCount ?? 0} files`);
      setTimeout(() => setSyncMsg(""), 3000);
    } catch (e) {
      setSyncMsg("✗ Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleNewNote() {
    if (!newNoteName.trim()) return;
    const name = newNoteName.trim().endsWith(".md") ? newNoteName.trim() : newNoteName.trim() + ".md";
    try {
      await fetch(`/api/notes/${name}`, { method: "POST" });
      await loadTree();
      setSelectedNote(name);
      setShowNewNote(false);
      setNewNoteName("");
    } catch (e) {
      console.error("Create note failed:", e);
    }
  }

  async function handleGithubPush() {
    setGithubStatus("pushing");
    setGithubMsg("Pushing to GitHub...");
    try {
      const res = await fetch("/api/github/push", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Push failed");
      setGithubStatus("done");
      setGithubMsg(data.message || "Pushed successfully!");
    } catch (e: any) {
      setGithubStatus("error");
      setGithubMsg(e.message || "Push failed");
    }
  }

  const sidebarStyle = {
    background: theme.panel,
    borderColor: theme.border,
    color: theme.text,
  };

  const tabActiveStyle = {
    background: theme.accent + "22",
    color: theme.accent,
  };

  const tabInactiveStyle = {
    color: theme.textMuted,
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: theme.bg, color: theme.text }}
    >
      {/* Icon Rail */}
      <div
        className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 border-r"
        style={{ background: theme.panel, borderColor: theme.border }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center mb-3"
          style={{ background: theme.accent + "22" }}
        >
          <Brain className="h-4 w-4" style={{ color: theme.accent }} />
        </div>

        {(["files", "calc", "browser"] as LeftPanel[]).map((p) => (
          <button
            key={p}
            onClick={() => setLeftPanel(p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition"
            style={leftPanel === p ? tabActiveStyle : tabInactiveStyle}
            title={p === "files" ? "Files" : p === "calc" ? "Calculator" : "Browser"}
          >
            {p === "files" && <FileText className="h-4 w-4" />}
            {p === "calc" && <CalcIcon className="h-4 w-4" />}
            {p === "browser" && <Globe className="h-4 w-4" />}
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => { setActiveTab("themes"); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
          style={activeTab === "themes" ? tabActiveStyle : tabInactiveStyle}
          title="Themes"
        >
          <Palette className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setActiveTab("settings"); setSettingsOpen(true); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition mb-2"
          style={activeTab === "settings" ? tabActiveStyle : tabInactiveStyle}
          title="Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Left Panel */}
      <aside
        className="shrink-0 border-r flex flex-col transition-all duration-200"
        style={{ ...sidebarStyle, width: leftPanel === "browser" ? "480px" : leftPanel === "calc" ? "220px" : "240px" }}
      >
        {leftPanel === "files" && (
          <>
            <div
              className="h-12 px-3 flex items-center justify-between border-b"
              style={{ borderColor: theme.border }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Explorer
              </span>
              <button
                onClick={() => setShowNewNote(true)}
                className="p-1 rounded transition hover:opacity-80"
                style={{ color: theme.accent }}
                title="New note"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showNewNote && (
              <div className="px-3 py-2 border-b" style={{ borderColor: theme.border }}>
                <input
                  autoFocus
                  value={newNoteName}
                  onChange={(e) => setNewNoteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNewNote();
                    if (e.key === "Escape") { setShowNewNote(false); setNewNoteName(""); }
                  }}
                  placeholder="note-name.md"
                  className="w-full text-xs px-2 py-1.5 rounded focus:outline-none"
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.accent}`,
                    color: theme.text,
                  }}
                />
              </div>
            )}

            <FileTree
              tree={tree}
              selectedPath={selectedNote}
              onSelect={setSelectedNote}
              onNew={() => setShowNewNote(true)}
            />

            <div className="p-2 border-t" style={{ borderColor: theme.border }}>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition"
                style={{ background: theme.accent + "22", color: theme.accent }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync & Index"}
              </button>
              {syncMsg && (
                <p className="text-[10px] text-center mt-1" style={{ color: theme.textMuted }}>{syncMsg}</p>
              )}
            </div>
          </>
        )}

        {leftPanel === "calc" && (
          <>
            <div
              className="h-12 px-3 flex items-center border-b"
              style={{ borderColor: theme.border }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Calculator
              </span>
            </div>
            <Calculator />
          </>
        )}

        {leftPanel === "browser" && (
          <>
            <div
              className="h-12 px-3 flex items-center border-b"
              style={{ borderColor: theme.border }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Browser
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MiniBrowser />
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Tabs */}
        <nav
          className="h-12 border-b flex items-center justify-between px-4 shrink-0"
          style={{ background: theme.panel, borderColor: theme.border }}
        >
          <div className="flex items-center gap-0.5">
            {(["notes", "github", "themes"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition"
                style={activeTab === tab ? tabActiveStyle : tabInactiveStyle}
              >
                {tab === "notes" && <FileText className="h-3.5 w-3.5" />}
                {tab === "github" && <Github className="h-3.5 w-3.5" />}
                {tab === "themes" && <Palette className="h-3.5 w-3.5" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setAiOpen(!aiOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow"
            style={
              aiOpen
                ? { background: theme.accent, color: "#fff" }
                : { background: theme.accent + "22", color: theme.accent }
            }
          >
            <MessageSquare className="h-3.5 w-3.5" />
            AI Chat
            <kbd
              className="px-1.5 py-0.5 rounded text-[9px] font-mono"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              ⌘K
            </kbd>
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "notes" && (
            <NoteEditor notePath={selectedNote} onClose={() => setSelectedNote(null)} />
          )}

          {activeTab === "github" && (
            <div className="p-8 max-w-xl">
              <h2 className="text-lg font-bold mb-1" style={{ color: theme.text }}>GitHub Sync</h2>
              <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
                Push your notes to <code className="text-xs px-1 py-0.5 rounded" style={{ background: theme.border }}>lazyv0rtex/personal-knowledge-agent</code>
              </p>

              <button
                onClick={handleGithubPush}
                disabled={githubStatus === "pushing"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg"
                style={{ background: theme.accent, color: "#fff", opacity: githubStatus === "pushing" ? 0.7 : 1 }}
              >
                <FolderSync className={`h-4 w-4 ${githubStatus === "pushing" ? "animate-spin" : ""}`} />
                {githubStatus === "pushing" ? "Pushing..." : "Push to GitHub"}
              </button>

              {githubMsg && (
                <div
                  className="mt-4 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: githubStatus === "error" ? "#ff4d4d22" : theme.accent + "22",
                    color: githubStatus === "error" ? "#ff6b6b" : theme.accent,
                    border: `1px solid ${githubStatus === "error" ? "#ff4d4d44" : theme.accent + "44"}`,
                  }}
                >
                  {githubMsg}
                </div>
              )}
            </div>
          )}

          {activeTab === "themes" && (
            <div className="p-8">
              <h2 className="text-lg font-bold mb-1" style={{ color: theme.text }}>Themes</h2>
              <p className="text-sm mb-6" style={{ color: theme.textMuted }}>Choose your vibe</p>
              <div className="grid grid-cols-3 gap-4">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className="rounded-2xl overflow-hidden transition hover:scale-105 active:scale-100 shadow-lg"
                    style={{
                      border: `2px solid ${theme.id === t.id ? t.accent : t.border}`,
                    }}
                  >
                    {/* Theme preview */}
                    <div className="p-3" style={{ background: t.bg }}>
                      <div className="h-14 rounded-lg p-2" style={{ background: t.panel, border: `1px solid ${t.border}` }}>
                        <div className="h-2 w-16 rounded mb-1.5" style={{ background: t.accent }} />
                        <div className="h-1.5 w-20 rounded mb-1" style={{ background: t.textMuted + "44" }} />
                        <div className="h-1.5 w-12 rounded" style={{ background: t.textMuted + "33" }} />
                      </div>
                    </div>
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{ background: t.panel, borderTop: `1px solid ${t.border}` }}
                    >
                      <span className="text-xs font-medium" style={{ color: t.text }}>{t.name}</span>
                      {theme.id === t.id && (
                        <Check className="h-3.5 w-3.5" style={{ color: t.accent }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - AI Chat */}
      {aiOpen && (
        <aside
          className="w-80 shrink-0 border-l flex flex-col animate-slide-in shadow-2xl"
          style={{ background: theme.panel, borderColor: theme.border }}
        >
          <div
            className="h-12 border-b px-4 flex items-center justify-between"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" style={{ color: theme.accent }} />
              <span className="text-sm font-semibold" style={{ color: theme.text }}>AI Assistant</span>
            </div>
            <button
              onClick={() => setAiOpen(false)}
              className="p-1.5 rounded transition"
              style={{ color: theme.textMuted }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AIChat />
        </aside>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setActiveTab("notes");
        }}
        onSaved={() => {}}
      />
    </div>
  );
}
