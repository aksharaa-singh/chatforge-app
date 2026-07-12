import Anthropic from "@anthropic-ai/sdk";

import type {
  GenerateChatResponseInput,
  GenerateChatResponseResult,
} from "@/lib/llm/types";
import { generateOpenRouterResponse } from "@/lib/llm/providers/openrouter";

function getAnthropicModel(model: string) {
  if (model.includes("/")) {
    return "claude-3-5-sonnet";
  }

  return model;
}

export async function generateAnthropicResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseResult> {
  if (process.env.OPENROUTER_API_KEY) {
    return generateOpenRouterResponse(input);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key is not configured.");
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: getAnthropicModel(input.model),
    max_tokens: 4000,
    messages: input.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
  });

  const textBlock = response.content.find((block) => block.type === "text");

  return {
    content:
      textBlock && "text" in textBlock
        ? textBlock.text
        : "I could not generate a response.",
  };
}
