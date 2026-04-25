# Welcome to your Personal Knowledge Agent

Drop your `.md`, `.mdx`, or `.txt` notes into this folder (or set `NOTES_DIR`
in `.env.local` to a different absolute path).

Then click **Sync notes folder** in the sidebar. The app will:

1. Read every supported file under this directory (recursively).
2. Split them into ~1000-character chunks.
3. Generate embeddings locally with `Xenova/all-MiniLM-L6-v2`.
4. Persist the index with HNSWLib under `./vector_store`.

Ask questions in the chat and Claude 3.5 Sonnet (via OpenRouter) will answer
using the retrieved chunks as context.
