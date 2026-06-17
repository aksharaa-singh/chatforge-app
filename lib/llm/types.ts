import type { MessageRole, ModelProvider } from "@prisma/client";

export type LlmMessage = {
  role: MessageRole;
  content: string;
};

export type GenerateChatResponseInput = {
  provider: ModelProvider;
  model: string;
  messages: LlmMessage[];
};

export type GenerateChatResponseResult = {
  content: string;
};