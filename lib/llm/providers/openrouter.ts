import OpenAI from "openai";

import type {
  GenerateChatResponseInput,
  GenerateChatResponseResult,
} from "@/lib/llm/types";

const FREE_CHAT_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
];

function getOpenRouterModel(model: string) {
  if (model.includes("/")) {
    return model;
  }

  return FREE_CHAT_MODELS[0];
}

export async function generateOpenRouterResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "ChatForge",
    },
  });

  const preferredModel = getOpenRouterModel(input.model);
  const modelsToTry = [
    preferredModel,
    ...FREE_CHAT_MODELS.filter((model) => model !== preferredModel),
  ];

  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 700,
        messages: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      return {
        content:
          response.choices[0]?.message?.content ||
          "I could not generate a response.",
      };
    } catch (error) {
      lastError = error;
      console.warn(`OpenRouter model failed: ${model}`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All OpenRouter free models failed.");
}
