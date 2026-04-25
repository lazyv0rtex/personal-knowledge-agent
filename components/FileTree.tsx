"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus } from "lucide-react";

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
};

export default function FileTree({ tree, selectedPath, onSelect, onNew }: Props) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-2 space-y-0.5">
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
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
  level,
}: {
  node: NoteTree;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedPath === node.path;

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-neutral-300 hover:bg-white/5 transition"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition ${
        isSelected
          ? "bg-accent/20 text-accent"
          : "text-neutral-300 hover:bg-white/5"
      }`}
      style={{ paddingLeft: `${level * 12 + 8 + 20}px` }}
    >
      <File className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
