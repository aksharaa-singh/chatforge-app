import type { MessageRole, ModelProvider } from "@prisma/client";

export type ChatSummary = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  provider: ModelProvider | null;
  model: string | null;
  createdAt: string;
};

export type ModelOption = {
  provider: ModelProvider;
  model: string;
  label: string;
};
