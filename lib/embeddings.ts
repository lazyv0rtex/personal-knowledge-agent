import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

// Local, CPU-friendly embedding model (runs via @xenova/transformers — no API key required).
let singleton: HuggingFaceTransformersEmbeddings | null = null;

export function getEmbeddings(): HuggingFaceTransformersEmbeddings {
  if (!singleton) {
    singleton = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/all-MiniLM-L6-v2",
    });
  }
  return singleton;
}
