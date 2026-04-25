import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });

  try {
    // Use DuckDuckGo Instant Answer API (no key required)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, { headers: { "User-Agent": "personal-knowledge-agent/1.0" } });
    const ddgData = await ddgRes.json();

    const results: SearchResult[] = [];

    // Abstract (top answer)
    if (ddgData.AbstractText) {
      results.push({
        title: ddgData.Heading || q,
        url: ddgData.AbstractURL || "https://duckduckgo.com/?q=" + encodeURIComponent(q),
        snippet: ddgData.AbstractText,
      });
    }

    // Related topics
    if (Array.isArray(ddgData.RelatedTopics)) {
      for (const t of ddgData.RelatedTopics.slice(0, 4)) {
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.split(" - ")[0] || t.Text, url: t.FirstURL, snippet: t.Text });
        }
      }
    }

    // Answer box
    if (ddgData.Answer) {
      results.unshift({ title: "Quick Answer", url: "", snippet: ddgData.Answer });
    }

    // Fallback: return a search link if nothing found
    if (results.length === 0) {
      results.push({
        title: `Search DuckDuckGo for "${q}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
        snippet: "No instant results found. Click to open full search.",
      });
    }

    return NextResponse.json({ results: results.slice(0, 6) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
