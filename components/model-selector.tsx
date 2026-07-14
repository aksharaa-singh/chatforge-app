"use client";

import type { ModelOption } from "@/lib/types";
import { MODEL_OPTIONS } from "@/lib/models";

export function ModelSelector({
  selectedModel,
  onChange,
  disabled,
  className = "",
}: {
  selectedModel: ModelOption;
  onChange: (model: ModelOption) => void;
  disabled?: boolean;
  className?: string;
}) {
  function handleChange(value: string) {
    const nextModel = MODEL_OPTIONS.find(
      (model) => `${model.provider}:${model.model}` === value
    );

    if (nextModel) {
      onChange(nextModel);
    }
  }

  return (
    <select
      value={`${selectedModel.provider}:${selectedModel.model}`}
      onChange={(event) => handleChange(event.target.value)}
      disabled={disabled}
      className={`h-12 rounded-lg border border-current/20 bg-transparent px-4 text-sm font-medium outline-none transition hover:bg-current/5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {MODEL_OPTIONS.map((model) => (
        <option
          key={`${model.provider}:${model.model}`}
          value={`${model.provider}:${model.model}`}
        >
          {model.label}
        </option>
      ))}
    </select>
  );
}