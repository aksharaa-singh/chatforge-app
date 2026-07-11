import type { ModelOption } from "@/lib/types";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    provider: "openai",
    model: "openai/gpt-oss-120b:free",
    label: "OpenAI",
  },
  {
    provider: "anthropic",
    model: "openai/gpt-oss-120b:free",
    label: "Claude",
  },
  {
    provider: "deepseek",
    model: "deepseek/deepseek-r1:free",
    label: "DeepSeek",
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0];