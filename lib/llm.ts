import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getEffectiveSettings, type Settings } from "./settings";

export async function getChatModel(): Promise<BaseChatModel> {
  const settings = await getEffectiveSettings();
  if (!settings) {
    throw new Error(
      "No API key configured. Open Settings in the app and add a key, or set one in .env.local."
    );
  }
  return buildClient(settings);
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
