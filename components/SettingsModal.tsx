"use client";

import { useEffect, useState } from "react";
import { X, KeyRound, Loader2, CheckCircle2 } from "lucide-react";

type Provider = "openrouter" | "openai" | "anthropic" | "google";

type ProviderMeta = { model: string; label: string; keyHint: string; modelHint: string };

type PublicSettings = {
  provider: Provider;
  model: string;
  hasKey: boolean;
  envFallbackAvailable: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (s: PublicSettings) => void;
};

export default function SettingsModal({ open, onClose, onSaved }: Props) {
  const [providers, setProviders] = useState<Record<Provider, ProviderMeta> | null>(null);
  const [current, setCurrent] = useState<PublicSettings | null>(null);
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setError(null);
      setApiKey("");
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setProviders(data.providers);
        setCurrent(data.settings);
        setProvider(data.settings.provider);
        setModel(data.settings.model);
      } catch (e: any) {
        setError(e.message || "Failed to load settings");
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!providers) return;
    // When provider changes, reset the model to the provider's default unless the user
    // is looking at the provider that's already persisted.
    if (current && provider === current.provider) {
      setModel(current.model);
    } else {
      setModel(providers[provider].model);
    }
  }, [provider, providers, current]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved(data.settings);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const meta = providers?.[provider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-panel shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold">Model & API keys</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-neutral-400"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(providers ?? {}) as Provider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`text-left rounded-lg border px-3 py-2 transition ${
                    provider === p
                      ? "border-accent bg-accent/15 text-neutral-100"
                      : "border-border bg-[#0e1216] text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  <div className="text-sm font-medium">{providers![p].label}</div>
                  <div className="text-[11px] text-neutral-400">{providers![p].model}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={meta?.model}
              className="w-full rounded-lg bg-[#0e1216] border border-border px-3 py-2 focus:outline-none focus:border-accent/60"
            />
            {provider === "openrouter" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  "anthropic/claude-3.5-sonnet",
                  "openai/gpt-4o",
                  "openai/gpt-4o-mini",
                  "google/gemini-2.0-flash-exp",
                  "meta-llama/llama-3.3-70b-instruct",
                  "deepseek/deepseek-chat",
                ].map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`text-[10px] px-2 py-1 rounded border transition ${
                      model === m
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-border bg-[#0a0c0f] text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    {m.split("/")[1]}
                  </button>
                ))}
              </div>
            )}
            {meta?.modelHint && (
              <p className="text-[11px] text-neutral-500 mt-1.5">{meta.modelHint}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">
              API key
              {current?.provider === provider && current.hasKey && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> key saved
                </span>
              )}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={meta?.keyHint || "Paste your key"}
              autoComplete="off"
              className="w-full rounded-lg bg-[#0e1216] border border-border px-3 py-2 font-mono focus:outline-none focus:border-accent/60"
            />
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Stored locally at <code>.data/settings.json</code> (chmod 600, gitignored). Never sent anywhere except the provider you choose.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/30 text-red-200 text-xs px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 transition"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
