"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Pencil, Trash2, Copy, FolderPlus, FilePlus,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

type NoteTree = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: NoteTree[];
};

type Props = {
  tree: NoteTree[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onNew: () => void;
  onDelete?: (path: string) => void;
  onRename?: (path: string) => void;
  onDuplicate?: (path: string) => void;
  onNewFolder?: (parentPath: string) => void;
};

type CtxMenu = { x: number; y: number; node: NoteTree } | null;

export default function FileTree({ tree, selectedPath, onSelect, onNew, onDelete, onRename, onDuplicate, onNewFolder }: Props) {
  const { theme } = useTheme();
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCtxMenu(null);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin relative">
      <div className="p-2 space-y-0.5">
        {tree.length === 0 && (
          <p className="text-xs px-2 py-4 text-center opacity-40">No notes yet — click + to create one</p>
        )}
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onNewFolder={onNewFolder}
            onContextMenu={(e, n) => {
              e.preventDefault();
              setCtxMenu({ x: e.clientX, y: e.clientY, node: n });
            }}
            level={0}
          />
        ))}
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 rounded-xl shadow-2xl py-1 min-w-[160px] text-xs"
          style={{
            left: ctxMenu.x,
            top: ctxMenu.y,
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          {!ctxMenu.node.isDirectory && (
            <CtxItem icon={<File className="h-3.5 w-3.5" />} label="Open" onClick={() => { onSelect(ctxMenu.node.path); setCtxMenu(null); }} theme={theme} />
          )}
          {onRename && (
            <CtxItem icon={<Pencil className="h-3.5 w-3.5" />} label="Rename" onClick={() => { onRename(ctxMenu.node.path); setCtxMenu(null); }} theme={theme} />
          )}
          {onDuplicate && !ctxMenu.node.isDirectory && (
            <CtxItem icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={() => { onDuplicate(ctxMenu.node.path); setCtxMenu(null); }} theme={theme} />
          )}
          {onNewFolder && ctxMenu.node.isDirectory && (
            <CtxItem icon={<FolderPlus className="h-3.5 w-3.5" />} label="New folder inside" onClick={() => { onNewFolder(ctxMenu.node.path); setCtxMenu(null); }} theme={theme} />
          )}
          {!ctxMenu.node.isDirectory && onNew && (
            <CtxItem icon={<FilePlus className="h-3.5 w-3.5" />} label="New note" onClick={() => { onNew(); setCtxMenu(null); }} theme={theme} />
          )}
          <div className="my-1 border-t" style={{ borderColor: theme.border }} />
          {onDelete && (
            <CtxItem icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" onClick={() => { onDelete(ctxMenu.node.path); setCtxMenu(null); }} theme={theme} danger />
          )}
        </div>
      )}
    </div>
  );
}

function CtxItem({ icon, label, onClick, theme, danger }: { icon: React.ReactNode; label: string; onClick: () => void; theme: any; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 transition hover:opacity-80"
      style={{ color: danger ? "#f87171" : theme.text }}
      onMouseEnter={(e) => (e.currentTarget.style.background = theme.border)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: danger ? "#f87171" : theme.textMuted }}>{icon}</span>
      {label}
    </button>
  );
}

function TreeNode({
  node, selectedPath, onSelect, onDelete, onRename, onDuplicate, onNewFolder, onContextMenu, level,
}: {
  node: NoteTree;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDelete?: (path: string) => void;
  onRename?: (path: string) => void;
  onDuplicate?: (path: string) => void;
  onNewFolder?: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: NoteTree) => void;
  level: number;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedPath === node.path;

  if (node.isDirectory) {
    return (
      <div>
        <div
          className="flex items-center rounded text-xs transition"
          style={{
            background: hovered ? theme.border : "transparent",
            paddingLeft: `${level * 12 + 8}px`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center gap-1.5 py-1.5 min-w-0"
            style={{ color: theme.textMuted }}
          >
            {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
            {expanded
              ? <FolderOpen className="h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
              : <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: theme.textMuted }} />}
            <span className="truncate font-medium">{node.name}</span>
          </button>
          {hovered && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.path); }}
              className="p-0.5 rounded mr-1.5 opacity-60 hover:opacity-100 transition"
              style={{ color: "#f87171" }}
              title="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onDelete={onDelete}
                onRename={onRename}
                onDuplicate={onDuplicate}
                onNewFolder={onNewFolder}
                onContextMenu={onContextMenu}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center rounded text-xs transition"
      style={{
        background: isSelected ? theme.accent + "22" : hovered ? theme.border : "transparent",
        paddingLeft: `${level * 12 + 8 + 16}px`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      <button
        onClick={() => onSelect(node.path)}
        className="flex-1 flex items-center gap-1.5 py-1.5 pr-1 min-w-0"
        style={{ color: isSelected ? theme.accent : theme.text }}
      >
        <File className="h-3.5 w-3.5 shrink-0 opacity-50" />
        <span className="truncate">{node.name}</span>
      </button>
      {hovered && (
        <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
          {onRename && (
            <button onClick={(e) => { e.stopPropagation(); onRename(node.path); }} className="p-0.5 rounded opacity-50 hover:opacity-100 transition" style={{ color: theme.textMuted }} title="Rename">
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDuplicate && (
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(node.path); }} className="p-0.5 rounded opacity-50 hover:opacity-100 transition" style={{ color: theme.textMuted }} title="Duplicate">
              <Copy className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(node.path); }} className="p-0.5 rounded opacity-50 hover:opacity-100 transition" style={{ color: "#f87171" }} title="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
