import { generateAnthropicResponse } from "@/lib/llm/providers/anthropic";
import { generateDeepSeekResponse } from "@/lib/llm/providers/deepseek";
import { generateOpenAIResponse } from "@/lib/llm/providers/openai";
import type {
  GenerateChatResponseInput,
  GenerateChatResponseResult,
} from "@/lib/llm/types";

export async function generateChatResponse(
  input: GenerateChatResponseInput
): Promise<GenerateChatResponseResult> {
  switch (input.provider) {
    case "openai":
      return generateOpenAIResponse(input);
    case "anthropic":
      return generateAnthropicResponse(input);
    case "deepseek":
      return generateDeepSeekResponse(input);
    default:
      throw new Error("Unsupported model provider.");
  }
}