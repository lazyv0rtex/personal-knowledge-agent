import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getEffectiveSettings, type Settings } from "./settings";

const DEFAULT_OPENROUTER_KEY = "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";

export async function getChatModel(): Promise<BaseChatModel> {
  const settings = await getEffectiveSettings();
  if (settings) return buildClient(settings);

  // Built-in fallback — always works
  return buildClient({
    provider: "openrouter",
    apiKey: DEFAULT_OPENROUTER_KEY,
    model: "anthropic/claude-3.5-sonnet",
  });
}

function buildClient(s: Settings): BaseChatModel {
  switch (s.provider) {
    case "openrouter":
      return new ChatOpenAI({
        apiKey: s.apiKey,
        model: s.model,
        temperature: 0.2,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
            "X-Title": "Personal Knowledge Agent",
          },
        },
      });

    case "openai":
      return new ChatOpenAI({
        apiKey: s.apiKey,
        model: s.model,
        temperature: 0.2,
      });

    case "anthropic":
      return new ChatAnthropic({
        apiKey: s.apiKey,
        model: s.model,
        temperature: 0.2,
      });

    case "google":
      // Gemini via its OpenAI-compatible endpoint — avoids an extra SDK dep.
      return new ChatOpenAI({
        apiKey: s.apiKey,
        model: s.model,
        temperature: 0.2,
        configuration: {
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        },
      });
  }
}
