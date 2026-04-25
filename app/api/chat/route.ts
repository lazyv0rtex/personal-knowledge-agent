import { NextResponse } from "next/server";
import { loadStore } from "@/lib/vectorstore";
import { getChatModel } from "@/lib/llm";
import { saveNote, getNote } from "@/lib/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are a personal knowledge assistant with access to the user's notes and the web.

Capabilities:
1. Answer questions using the user's notes (cite with [filename]).
2. Summarize and synthesize web search results when provided.
3. When asked to "write", "save", "add to notes", "create a note", respond with a JSON action block at the END of your message:
   \`\`\`action
   {"type":"write_note","filename":"suggested-name.md","content":"# Title\\n\\nContent here..."}
   \`\`\`
4. Be concise, structured, use markdown.`;

function detectWebSearchIntent(query: string): boolean {
  const webTriggers = [
    /search\s+(the\s+)?web/i,
    /look\s+up/i,
    /google\s+it/i,
    /find\s+(online|on\s+the\s+web|on\s+internet)/i,
    /what.s\s+(the\s+)?latest/i,
    /current\s+(news|events|status)/i,
    /search\s+for/i,
    /browse\s+(the\s+)?web/i,
    /web\s+search/i,
  ];
  return webTriggers.some((r) => r.test(query));
}

async function fetchWebResults(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { messages, activeNote } = (await req.json()) as { messages: ChatMsg[]; activeNote?: string };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "No user message." }, { status: 400 });
    }

    // --- Notes context ---
    const store = await loadStore();
    let contextBlock = "";
    let sources: { source: string; snippet: string; type: "note" | "web" }[] = [];

    if (store) {
      const results = await store.similaritySearch(lastUser.content, 5);
      sources = results.map((d) => ({
        source: String(d.metadata?.source ?? "unknown"),
        snippet: d.pageContent.slice(0, 240).replace(/\s+/g, " ").trim(),
        type: "note" as const,
      }));
      contextBlock = results
        .map((d, i) => `[[${i + 1}] ${d.metadata?.source ?? "unknown"}]\n${d.pageContent}`)
        .join("\n\n---\n\n");
    }

    // --- Web search context ---
    let webBlock = "";
    const shouldSearch = detectWebSearchIntent(lastUser.content);
    if (shouldSearch) {
      const webResults = await fetchWebResults(lastUser.content.replace(/search\s+(the\s+)?web\s+(for\s+)?/i, "").trim());
      if (webResults.length > 0) {
        webBlock = "\n\nWeb search results:\n\n" +
          webResults.map((r, i) => `[Web ${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`).join("\n\n---\n\n");
        sources = [
          ...sources,
          ...webResults.map((r) => ({ source: r.title, snippet: r.snippet, type: "web" as const, url: r.url })),
        ];
      }
    }

    // --- Active note context ---
    let activeNoteBlock = "";
    if (activeNote) {
      const note = await getNote(activeNote);
      if (note) {
        activeNoteBlock = `\n\nCurrently open note [${activeNote}]:\n\`\`\`\n${note.content.slice(0, 2000)}\n\`\`\``;
      }
    }

    const model = await getChatModel();
    const contextPreface =
      (contextBlock ? `Context from the user's notes:\n\n${contextBlock}\n\n---\n` : "No notes indexed yet.\n") +
      webBlock +
      activeNoteBlock;

    const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

    const res = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextPreface },
      ...history,
      { role: "user", content: lastUser.content },
    ]);

    const rawAnswer = typeof res.content === "string"
      ? res.content
      : Array.isArray(res.content)
        ? res.content.map((c: any) => (typeof c === "string" ? c : c?.text ?? "")).join("")
        : String(res.content);

    // --- Parse write_note action ---
    let answer = rawAnswer;
    let noteAction: { filename: string; content: string } | null = null;

    const actionMatch = rawAnswer.match(/```action\s*([\s\S]*?)```/);
    if (actionMatch) {
      try {
        const parsed = JSON.parse(actionMatch[1].trim());
        if (parsed.type === "write_note" && parsed.filename && parsed.content) {
          const existing = await getNote(parsed.filename).catch(() => null);
          const finalContent = existing?.content
            ? existing.content + "\n\n---\n\n" + parsed.content
            : parsed.content;
          await saveNote(parsed.filename, finalContent);
          noteAction = { filename: parsed.filename, content: parsed.content };
        }
      } catch {}
      answer = rawAnswer.replace(/```action[\s\S]*?```/g, "").trim();
    }

    return NextResponse.json({ answer, sources, noteAction, webSearched: shouldSearch });
  } catch (err: any) {
    console.error("chat failed:", err);
    return NextResponse.json(
      { error: err?.message || "Chat failed" },
      { status: 500 }
    );
  }
}
