"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Save, Eye, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default), {
  ssr: false,
});

type Props = {
  notePath: string | null;
  onClose: () => void;
};

export default function NoteEditor({ notePath, onClose }: Props) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notePath) {
      setContent("");
      setOriginalContent("");
      return;
    }
    loadNote();
  }, [notePath]);

  async function loadNote() {
    if (!notePath) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${notePath}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setOriginalContent(data.content);
      }
    } catch (e) {
      console.error("Failed to load note:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = useCallback(async () => {
    if (!notePath || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${notePath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setOriginalContent(content);
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  }, [notePath, content, saving]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const isDirty = content !== originalContent;

  if (!notePath) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
        Select a note to edit
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-12 border-b border-border px-4 flex items-center justify-between bg-panel/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-200">{notePath.split("/").pop()}</span>
          {isDirty && <span className="text-xs text-amber-400">• unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`p-1.5 rounded transition ${
              preview
                ? "bg-accent/20 text-accent"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
            }`}
            title={preview ? "Edit" : "Preview"}
          >
            {preview ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {preview ? (
          <div className="h-full overflow-y-auto px-8 py-6 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full" data-color-mode="dark">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || "")}
              height="100%"
              preview="edit"
              hideToolbar={false}
              visibleDragbar={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
