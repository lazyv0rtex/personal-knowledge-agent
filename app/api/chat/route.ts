import { NextResponse } from "next/server";
import { loadStore } from "@/lib/vectorstore";
import { getChatModel } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are a personal knowledge assistant. Answer the user's questions using ONLY the provided context from their local notes whenever possible.
- If the answer is not contained in the context, say so plainly and offer your best general guidance.
- Cite sources inline using the note filename in square brackets, e.g. [work/ideas.md].
- Be concise and structured. Use markdown.`;

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMsg[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "No user message." }, { status: 400 });
    }

    const store = await loadStore();
    let contextBlock = "";
    let sources: { source: string; snippet: string }[] = [];

    if (store) {
      const results = await store.similaritySearch(lastUser.content, 5);
      sources = results.map((d) => ({
        source: String(d.metadata?.source ?? "unknown"),
        snippet: d.pageContent.slice(0, 240).replace(/\s+/g, " ").trim(),
      }));
      contextBlock = results
        .map((d, i) => `[[${i + 1}] ${d.metadata?.source ?? "unknown"}]\n${d.pageContent}`)
        .join("\n\n---\n\n");
    }

    const model = await getChatModel();
    const contextPreface = contextBlock
      ? `Context from the user's notes:\n\n${contextBlock}\n\n---\n`
      : "No local notes are indexed yet. Answer from general knowledge and mention that syncing notes would help.\n";

    const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

    const res = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextPreface },
      ...history,
      { role: "user", content: lastUser.content },
    ]);

    const answer = typeof res.content === "string"
      ? res.content
      : Array.isArray(res.content)
        ? res.content.map((c: any) => (typeof c === "string" ? c : c?.text ?? "")).join("")
        : String(res.content);

    return NextResponse.json({ answer, sources });
  } catch (err: any) {
    console.error("chat failed:", err);
    return NextResponse.json(
      { error: err?.message || "Chat failed" },
      { status: 500 }
    );
  }
}
