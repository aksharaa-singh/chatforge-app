import type { ModelOption } from "@/lib/types";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    provider: "openai",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "OpenAI",
  },
  {
    provider: "anthropic",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Claude",
  },
  {
    provider: "deepseek",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "DeepSeek",
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0];
