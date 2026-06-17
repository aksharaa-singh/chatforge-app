import OpenAI from "openai";

import type {
  GenerateChatResponseInput,
  GenerateChatResponseResult,
} from "@/lib/llm/types";
import { generateOpenRouterResponse } from "@/lib/llm/providers/openrouter";

function getOpenAIModel(model: string) {
  if (model.includes("/")) {
    return "gpt-4.1";
  }

  return model;
}

export async function generateOpenAIResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseResult> {
  if (process.env.OPENROUTER_API_KEY) {
    return generateOpenRouterResponse(input);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI or OpenRouter API key is not configured.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model: getOpenAIModel(input.model),
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
