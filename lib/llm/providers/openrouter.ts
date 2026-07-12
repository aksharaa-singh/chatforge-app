import OpenAI from "openai";

import type {
  GenerateChatResponseInput,
  GenerateChatResponseResult,
} from "@/lib/llm/types";

const GENERAL_FREE_MODELS = [
  "openai/gpt-oss-120b:free",
  "deepseek/deepseek-r1:free",
  "openai/gpt-oss-20b:free",
  "deepseek/deepseek-chat-v3:free",
  "deepseek/deepseek-r1-0528:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
];

const PROVIDER_MODEL_FALLBACKS = {
  openai: [
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    ...GENERAL_FREE_MODELS,
  ],
  anthropic: [
    "openai/gpt-oss-120b:free",
    "deepseek/deepseek-r1:free",
    "openai/gpt-oss-20b:free",
    ...GENERAL_FREE_MODELS,
  ],
  deepseek: [
    "deepseek/deepseek-r1:free",
    "deepseek/deepseek-chat-v3:free",
    "deepseek/deepseek-r1-0528:free",
    ...GENERAL_FREE_MODELS,
  ],
} satisfies Record<GenerateChatResponseInput["provider"], string[]>;

function uniqueModels(models: string[]) {
  return Array.from(new Set(models));
}

function getOpenRouterModelsToTry(input: GenerateChatResponseInput) {
  const requestedModel = input.model.includes("/") ? input.model : null;
  const providerModels = PROVIDER_MODEL_FALLBACKS[input.provider];

  return uniqueModels([
    ...(requestedModel ? [requestedModel] : []),
    ...providerModels,
    ...GENERAL_FREE_MODELS,
  ]);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown provider error.";
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

  const modelsToTry = getOpenRouterModelsToTry(input);
  const failedModels: string[] = [];
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 4000,
        messages: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error(`Model ${model} returned an empty response.`);
      }

      return {
        content,
      };
    } catch (error) {
      lastError = error;
      failedModels.push(`${model}: ${getErrorMessage(error)}`);
      console.warn(`OpenRouter model failed: ${model}`, error);
    }
  }

  console.warn("All OpenRouter fallback models failed:", failedModels);

  throw lastError instanceof Error
    ? lastError
    : new Error("All OpenRouter fallback models failed.");
}