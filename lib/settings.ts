import fs from "node:fs/promises";
import path from "node:path";

export type Provider = "openrouter" | "openai" | "anthropic" | "google";

export type Settings = {
  provider: Provider;
  apiKey: string;
  model: string;
};

export type PublicSettings = {
  provider: Provider;
  model: string;
  hasKey: boolean;
  envFallbackAvailable: boolean;
};

export const PROVIDER_DEFAULTS: Record<
  Provider,
  { model: string; label: string; keyHint: string; modelHint: string }
> = {
  openrouter: {
    model: "anthropic/claude-3.5-sonnet",
    label: "OpenRouter",
    keyHint: "sk-or-...",
    modelHint: "e.g. anthropic/claude-3.5-sonnet, openai/gpt-4o",
  },
  openai: {
    model: "gpt-4o-mini",
    label: "OpenAI",
    keyHint: "sk-...",
    modelHint: "e.g. gpt-4o, gpt-4o-mini, gpt-3.5-turbo",
  },
  anthropic: {
    model: "claude-3-5-sonnet-20241022",
    label: "Anthropic (Claude)",
    keyHint: "sk-ant-...",
    modelHint: "e.g. claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022",
  },
  google: {
    model: "gemini-1.5-flash",
    label: "Google Gemini",
    keyHint: "AIza...",
    modelHint: "e.g. gemini-1.5-flash, gemini-1.5-pro",
  },
};

function dataDir(): string {
  return path.join(process.cwd(), ".data");
}

function settingsFile(): string {
  return path.join(dataDir(), "settings.json");
}

export async function readSettings(): Promise<Settings | null> {
  try {
    const raw = await fs.readFile(settingsFile(), "utf8");
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (!parsed.provider || !(parsed.provider in PROVIDER_DEFAULTS)) return null;
    return {
      provider: parsed.provider as Provider,
      apiKey: parsed.apiKey ?? "",
      model: parsed.model || PROVIDER_DEFAULTS[parsed.provider as Provider].model,
    };
  } catch {
    return null;
  }
}

export async function writeSettings(s: Settings): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(settingsFile(), JSON.stringify(s, null, 2), "utf8");
  // Tighten permissions on POSIX so the key file isn't world-readable.
  try {
    await fs.chmod(settingsFile(), 0o600);
  } catch {}
}

function envKeyFor(provider: Provider): string | undefined {
  switch (provider) {
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "google":
      return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  }
}

export async function getEffectiveSettings(): Promise<Settings | null> {
  const stored = await readSettings();
  if (stored?.apiKey) return stored;

  // Fall back to env for the stored provider, or to the default (openrouter) from env.
  const provider: Provider = stored?.provider ?? "openrouter";
  const envKey = envKeyFor(provider);
  if (envKey) {
    return {
      provider,
      apiKey: envKey,
      model: stored?.model || PROVIDER_DEFAULTS[provider].model,
    };
  }
  return null;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const stored = await readSettings();
  const provider: Provider = stored?.provider ?? "openrouter";
  const model = stored?.model || PROVIDER_DEFAULTS[provider].model;
  const hasKey = !!stored?.apiKey;
  const envFallbackAvailable = !!envKeyFor(provider);
  return { provider, model, hasKey, envFallbackAvailable };
}
