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
} from "lucide-react";
import FileTree from "./FileTree";
import NoteEditor from "./NoteEditor";
import AIChat from "./AIChat";
import SettingsModal from "./SettingsModal";

type NoteTree = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: NoteTree[];
};

type Tab = "notes" | "settings" | "github" | "themes";

export default function NotesApp() {
  const [tree, setTree] = useState<NoteTree[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    try {
      await fetch("/api/sync", { method: "POST" });
      await loadTree();
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-neutral-100">
      {/* Left Sidebar - File Tree */}
      <aside className="w-64 shrink-0 border-r border-border bg-panel flex flex-col shadow-xl">
        <div className="h-14 border-b border-border px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm font-semibold">Notes</span>
          </div>
          <button
            onClick={() => {}}
            className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-neutral-200 transition"
            title="New note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <FileTree
          tree={tree}
          selectedPath={selectedNote}
          onSelect={setSelectedNote}
          onNew={() => {}}
        />

        <div className="mt-auto p-3 border-t border-border">
          <button
            onClick={handleSync}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync & Index
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="h-14 border-b border-border bg-panel/50 backdrop-blur px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-1">
            {(["notes", "settings", "github", "themes"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "settings") setSettingsOpen(true);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-accent/20 text-accent"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                }`}
              >
                {tab === "notes" && <FileText className="h-4 w-4" />}
                {tab === "settings" && <SettingsIcon className="h-4 w-4" />}
                {tab === "github" && <Github className="h-4 w-4" />}
                {tab === "themes" && <Palette className="h-4 w-4" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setAiOpen(!aiOpen)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              aiOpen
                ? "bg-accent text-white"
                : "bg-white/5 text-neutral-300 hover:bg-white/10"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            AI Chat
            <kbd className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono">⌘K</kbd>
          </button>
        </nav>

        {/* Editor Area */}
        <NoteEditor notePath={selectedNote} onClose={() => setSelectedNote(null)} />
      </div>

      {/* Right Sidebar - AI Chat */}
      {aiOpen && (
        <aside className="w-96 shrink-0 border-l border-border bg-panel flex flex-col shadow-2xl animate-slide-in">
          <div className="h-14 border-b border-border px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setAiOpen(false)}
              className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-neutral-200 transition"
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
