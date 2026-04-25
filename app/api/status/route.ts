import { NextResponse } from "next/server";
import { readMeta } from "@/lib/vectorstore";
import { getPublicSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [meta, settings] = await Promise.all([readMeta(), getPublicSettings()]);
  return NextResponse.json({ ...meta, settings });
}
