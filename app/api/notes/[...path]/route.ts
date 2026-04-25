import { NextResponse } from "next/server";
import { getNote, saveNote, deleteNote, createNote } from "@/lib/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { path: string[] } };

export async function GET(req: Request, { params }: Params) {
  try {
    const notePath = params.path.join("/");
    const note = await getNote(notePath);
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load note" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const notePath = params.path.join("/");
    const { content } = await req.json();
    await saveNote(notePath, content);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save note" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const notePath = params.path.join("/");
    await createNote(notePath);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create note" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const notePath = params.path.join("/");
    await deleteNote(notePath);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete note" }, { status: 500 });
  }
}
