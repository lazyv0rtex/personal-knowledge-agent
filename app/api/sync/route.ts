import { NextResponse } from "next/server";
import { syncNotes } from "@/lib/vectorstore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const status = await syncNotes();
    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    console.error("sync failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
