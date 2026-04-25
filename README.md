# Personal Knowledge Agent

A local-first Next.js (App Router) dashboard that lets you **chat with your own notes folder**.

- **UI:** Next.js 14 + TypeScript + Tailwind CSS
- **RAG:** LangChain.js + HNSWLib (on-disk vector store)
- **Embeddings:** `Xenova/all-MiniLM-L6-v2` (runs locally via `@xenova/transformers` — no API key needed)
- **LLM:** pick any of OpenRouter, OpenAI, Anthropic (Claude), or Google Gemini from the in-app Settings panel

## Setup

```bash
npm install
cp .env.local.example .env.local   # optional — keys can also be set in the UI
```

### Configuring the model

Click **Model & API keys** in the sidebar to choose a provider and paste an API key.
Settings are persisted locally at `./.data/settings.json` (chmod 600, gitignored) and
take precedence over env vars. Supported providers:

| Provider   | Default model                   | Key env var (fallback) |
|------------|---------------------------------|-------------------------|
| OpenRouter | `anthropic/claude-3.5-sonnet`   | `OPENROUTER_API_KEY`    |
| OpenAI     | `gpt-4o-mini`                   | `OPENAI_API_KEY`        |
| Anthropic  | `claude-3-5-sonnet-20241022`    | `ANTHROPIC_API_KEY`     |
| Gemini     | `gemini-1.5-flash`              | `GOOGLE_API_KEY`        |

Optional env vars:

- `NOTES_DIR` — path to your notes folder (default: `./notes`)
- `VECTOR_STORE_DIR` — where the HNSWLib index is saved (default: `./vector_store`)

## Run

```bash
npm run dev
```

Open http://localhost:3000.

1. Put `.md` / `.mdx` / `.txt` files in the notes folder.
2. Click **Sync notes folder** in the sidebar.
3. Ask questions. Answers include inline citations and a sources panel.

## How it works

- `POST /api/sync` — walks `NOTES_DIR`, chunks documents, embeds locally, saves HNSWLib index.
- `GET /api/status` — returns index metadata (file count, chunk count, last sync).
- `POST /api/chat` — retrieves top-k chunks for the user's query and sends them plus the chat history to Claude 3.5 via OpenRouter.

## Notes

- The first sync downloads the embedding model (~25 MB) into your local transformers cache.
- HNSWLib persists as plain files under `vector_store/` — delete that folder to fully reset.
- Swap to Chroma later by replacing `lib/vectorstore.ts`; the route signatures stay the same.
