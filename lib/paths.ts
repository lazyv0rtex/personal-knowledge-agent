import path from "node:path";

const isVercel = !!process.env.VERCEL;

function writableRoot(): string {
  return isVercel ? "/tmp" : process.cwd();
}

export function dataDir(): string {
  return path.join(writableRoot(), ".data");
}

export function notesDir(): string {
  const configured = process.env.NOTES_DIR;
  if (configured) return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  return path.join(writableRoot(), "notes");
}

export function vectorStoreDir(): string {
  const configured = process.env.VECTOR_STORE_DIR;
  if (configured) return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  return path.join(writableRoot(), "vector_store");
}

export function metadataFile(): string {
  return path.join(vectorStoreDir(), "meta.json");
}
