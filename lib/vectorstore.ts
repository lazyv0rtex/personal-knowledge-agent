import fs from "node:fs/promises";
import path from "node:path";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getEmbeddings } from "./embeddings";
import { notesDir, vectorStoreDir, metadataFile } from "./paths";

export type IndexMeta = {
  indexed: boolean;
  documentCount: number;
  chunkCount: number;
  lastSyncedAt: string | null;
  notesDir: string;
};

const ALLOWED_EXT = new Set([".md", ".mdx", ".markdown", ".txt"]);

async function walk(dir: string): Promise<string[]> {
  let out: string[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(await walk(full));
    } else if (entry.isFile() && ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

export async function readMeta(): Promise<IndexMeta> {
  const fallback: IndexMeta = {
    indexed: false,
    documentCount: 0,
    chunkCount: 0,
    lastSyncedAt: null,
    notesDir: notesDir(),
  };
  try {
    const raw = await fs.readFile(metadataFile(), "utf8");
    const parsed = JSON.parse(raw) as IndexMeta;
    return { ...fallback, ...parsed, notesDir: notesDir() };
  } catch {
    return fallback;
  }
}

async function writeMeta(meta: IndexMeta): Promise<void> {
  await fs.mkdir(vectorStoreDir(), { recursive: true });
  await fs.writeFile(metadataFile(), JSON.stringify(meta, null, 2), "utf8");
}

export async function syncNotes(): Promise<IndexMeta> {
  const dir = notesDir();
  await fs.mkdir(dir, { recursive: true });
  const files = await walk(dir);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });

  const docs: Document[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    if (!content.trim()) continue;
    const rel = path.relative(dir, file);
    const chunks = await splitter.splitText(content);
    for (const chunk of chunks) {
      docs.push(new Document({ pageContent: chunk, metadata: { source: rel } }));
    }
  }

  const storeDir = vectorStoreDir();
  await fs.rm(storeDir, { recursive: true, force: true });
  await fs.mkdir(storeDir, { recursive: true });

  const meta: IndexMeta = {
    indexed: docs.length > 0,
    documentCount: files.length,
    chunkCount: docs.length,
    lastSyncedAt: new Date().toISOString(),
    notesDir: dir,
  };

  if (docs.length > 0) {
    const store = await HNSWLib.fromDocuments(docs, getEmbeddings());
    await store.save(storeDir);
  }

  await writeMeta(meta);
  return meta;
}

export async function loadStore(): Promise<HNSWLib | null> {
  const storeDir = vectorStoreDir();
  try {
    await fs.access(path.join(storeDir, "hnswlib.index"));
  } catch {
    return null;
  }
  return HNSWLib.load(storeDir, getEmbeddings());
}
