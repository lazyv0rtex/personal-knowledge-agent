import path from "node:path";

export function notesDir(): string {
  const configured = process.env.NOTES_DIR;
  if (!configured) return path.join(process.cwd(), "notes");
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function vectorStoreDir(): string {
  const configured = process.env.VECTOR_STORE_DIR || "./vector_store";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function metadataFile(): string {
  return path.join(vectorStoreDir(), "meta.json");
}
