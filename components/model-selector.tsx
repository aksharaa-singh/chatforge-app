"use client";

import type { ModelOption } from "@/lib/types";
import { MODEL_OPTIONS } from "@/lib/models";

export function ModelSelector({
  selectedModel,
  onChange,
  disabled,
}: {
  selectedModel: ModelOption;
  onChange: (model: ModelOption) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">Model provider</span>
      <select
        value={`${selectedModel.provider}:${selectedModel.model}`}
        disabled={disabled}
        onChange={(event) => {
          const nextModel = MODEL_OPTIONS.find(
            (option) =>
              `${option.provider}:${option.model}` === event.target.value
          );

          if (nextModel) {
            onChange(nextModel);
          }
        }}
        className="h-10 rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-neutral-200 outline-none transition hover:bg-neutral-800 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {MODEL_OPTIONS.map((option) => (
          <option
            key={`${option.provider}:${option.model}`}
            value={`${option.provider}:${option.model}`}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}