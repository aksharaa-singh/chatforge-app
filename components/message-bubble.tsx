"use client";

import { Check, Copy, Edit3, RefreshCw } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useTypewriter } from "@/lib/hooks/use-typewriter";
import type { ChatMessage } from "@/lib/types";

const PROVIDER_LABELS = {
  openai: "OpenAI",
  anthropic: "Claude",
  deepseek: "DeepSeek",
};

export function MessageBubble({
  message,
  animate,
  onEditUserMessage,
  onRegenerateAssistantMessage,
}: {
  message: ChatMessage;
  animate: boolean;
  onEditUserMessage?: (message: ChatMessage) => void;
  onRegenerateAssistantMessage?: (message: ChatMessage) => void;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === "user";
  const displayedContent = useTypewriter(message.content, animate);
  const providerLabel = message.provider
    ? PROVIDER_LABELS[message.provider]
    : null;

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
    setIsCopied(true);

    window.setTimeout(() => {
      setIsCopied(false);
    }, 1400);
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%] ${
          isUser
            ? "bg-white text-neutral-950"
            : "border border-white/10 bg-neutral-900 text-neutral-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{displayedContent}</p>
        ) : (
          <div className="prose prose-invert max-w-none text-sm leading-6 prose-p:my-2 prose-pre:my-3 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:border-white/10 prose-pre:bg-neutral-950 prose-pre:p-3 prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-neutral-100 prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedContent}
            </ReactMarkdown>
          </div>
        )}

        {isUser ? (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onEditUserMessage?.(message)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 opacity-100 transition hover:bg-neutral-200 hover:text-neutral-950 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Edit and resend message"
              title="Edit and resend"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3">
            {providerLabel ? (
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                {providerLabel}
              </p>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRegenerateAssistantMessage?.(message)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 opacity-100 transition hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Regenerate assistant response"
                title="Regenerate"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={copyMessage}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 opacity-100 transition hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Copy assistant message"
                title="Copy"
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
