import fs from "node:fs/promises";
import path from "node:path";
import { notesDir } from "./paths";

export type NoteFile = {
  id: string;
  name: string;
  path: string;
  content: string;
  modified: number;
  isDirectory: boolean;
};

export type NoteTree = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: NoteTree[];
};

const ALLOWED_EXT = new Set([".md", ".mdx", ".markdown", ".txt"]);

async function buildTree(dir: string, relativePath = ""): Promise<NoteTree[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const tree: NoteTree[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      const children = await buildTree(fullPath, relPath);
      tree.push({ name: entry.name, path: relPath, isDirectory: true, children });
    } else if (ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) {
      tree.push({ name: entry.name, path: relPath, isDirectory: false });
    }
  }
  return tree.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getNoteTree(): Promise<NoteTree[]> {
  const dir = notesDir();
  await fs.mkdir(dir, { recursive: true });
  return buildTree(dir);
}

export async function getNote(relativePath: string): Promise<NoteFile | null> {
  const dir = notesDir();
  const fullPath = path.join(dir, relativePath);
  
  // Security: ensure path is within notes dir
  const resolved = path.resolve(fullPath);
  const base = path.resolve(dir);
  if (!resolved.startsWith(base)) return null;

  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) return null;
    const content = await fs.readFile(fullPath, "utf8");
    return {
      id: relativePath,
      name: path.basename(relativePath),
      path: relativePath,
      content,
      modified: stat.mtimeMs,
      isDirectory: false,
    };
  } catch {
    return null;
  }
}

export async function saveNote(relativePath: string, content: string): Promise<void> {
  const dir = notesDir();
  const fullPath = path.join(dir, relativePath);
  
  const resolved = path.resolve(fullPath);
  const base = path.resolve(dir);
  if (!resolved.startsWith(base)) throw new Error("Invalid path");

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf8");
}

export async function createNote(relativePath: string): Promise<void> {
  await saveNote(relativePath, "");
}

export async function deleteNote(relativePath: string): Promise<void> {
  const dir = notesDir();
  const fullPath = path.join(dir, relativePath);
  
  const resolved = path.resolve(fullPath);
  const base = path.resolve(dir);
  if (!resolved.startsWith(base)) throw new Error("Invalid path");

  await fs.unlink(fullPath);
}

export async function renameNote(oldPath: string, newPath: string): Promise<void> {
  const dir = notesDir();
  const oldFull = path.join(dir, oldPath);
  const newFull = path.join(dir, newPath);
  
  const resolvedOld = path.resolve(oldFull);
  const resolvedNew = path.resolve(newFull);
  const base = path.resolve(dir);
  if (!resolvedOld.startsWith(base) || !resolvedNew.startsWith(base)) {
    throw new Error("Invalid path");
  }

  await fs.mkdir(path.dirname(newFull), { recursive: true });
  await fs.rename(oldFull, newFull);
}
