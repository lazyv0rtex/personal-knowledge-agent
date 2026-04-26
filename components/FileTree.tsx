"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Pencil, Trash2 } from "lucide-react";
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
};

export default function FileTree({ tree, selectedPath, onSelect, onNew, onDelete, onRename }: Props) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-2 space-y-0.5">
        {tree.length === 0 && (
          <p className="text-xs px-2 py-3 text-center opacity-40">No notes yet — click + to create one</p>
        )}
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  selectedPath,
  onSelect,
  onDelete,
  onRename,
  level,
}: {
  node: NoteTree;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDelete?: (path: string) => void;
  onRename?: (path: string) => void;
  level: number;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedPath === node.path;

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition"
          style={{ paddingLeft: `${level * 12 + 8}px`, color: theme.textMuted }}
        >
          {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {expanded
            ? <FolderOpen className="h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
            : <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: theme.textMuted }} />}
          <span className="truncate font-medium">{node.name}</span>
        </button>
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
      className="group relative flex items-center rounded text-xs transition"
      style={{
        background: isSelected ? theme.accent + "22" : hovered ? theme.border : "transparent",
        paddingLeft: `${level * 12 + 8 + 16}px`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onSelect(node.path)}
        className="flex-1 flex items-center gap-1.5 py-1.5 pr-2 min-w-0"
        style={{ color: isSelected ? theme.accent : theme.text }}
      >
        <File className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="truncate">{node.name}</span>
      </button>
      {hovered && (
        <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
          {onRename && (
            <button
              onClick={(e) => { e.stopPropagation(); onRename(node.path); }}
              className="p-0.5 rounded opacity-60 hover:opacity-100 transition"
              style={{ color: theme.textMuted }}
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.path); }}
              className="p-0.5 rounded opacity-60 hover:opacity-100 transition"
              style={{ color: "#f87171" }}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
