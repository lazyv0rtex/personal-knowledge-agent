import { NextResponse } from "next/server";
import { getNoteTree } from "@/lib/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tree = await getNoteTree();
    return NextResponse.json({ tree });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load notes" }, { status: 500 });
  }
}
