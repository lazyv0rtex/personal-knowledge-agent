import { NextResponse } from "next/server";
import {
  PROVIDER_DEFAULTS,
  type Provider,
  getPublicSettings,
  writeSettings,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getPublicSettings();
  return NextResponse.json({ settings, providers: PROVIDER_DEFAULTS });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      provider?: Provider;
      apiKey?: string;
      model?: string;
    };
    if (!body.provider || !(body.provider in PROVIDER_DEFAULTS)) {
      return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
    }
    const apiKey = (body.apiKey ?? "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required." }, { status: 400 });
    }
    const model = (body.model || PROVIDER_DEFAULTS[body.provider].model).trim();

    await writeSettings({ provider: body.provider, apiKey, model });
    const settings = await getPublicSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save settings." },
      { status: 500 }
    );
  }
}
