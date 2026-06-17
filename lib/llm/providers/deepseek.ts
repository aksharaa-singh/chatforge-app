import OpenAI from "openai";

import type {
  GenerateChatResponseInput,
  GenerateChatResponseResult,
} from "@/lib/llm/types";
import { generateOpenRouterResponse } from "@/lib/llm/providers/openrouter";

function getDeepSeekModel(model: string) {
  if (model.includes("/")) {
    return "deepseek-chat";
  }

  return model;
}

export async function generateDeepSeekResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseResult> {
  if (process.env.OPENROUTER_API_KEY) {
    return generateOpenRouterResponse(input);
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DeepSeek API key is not configured.");
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const response = await client.chat.completions.create({
    model: getDeepSeekModel(input.model),
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
}
