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
        className={`relative rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "max-w-[85%] bg-white text-neutral-950 sm:max-w-[72%]"
            : "w-full max-w-full border border-white/10 bg-neutral-900 text-neutral-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{displayedContent}</p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table({ children }) {
                  return (
                    <div className="my-5 w-full overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) {
                  return <thead className="bg-neutral-800">{children}</thead>;
                },
                tbody({ children }) {
                  return (
                    <tbody className="divide-y divide-white/10">
                      {children}
                    </tbody>
                  );
                },
                tr({ children }) {
                  return (
                    <tr className="transition odd:bg-white/[0.025] hover:bg-white/[0.04]">
                      {children}
                    </tr>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border-r border-white/10 px-4 py-3 align-top text-xs font-semibold uppercase tracking-[0.08em] text-white last:border-r-0">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border-r border-white/10 px-4 py-3 align-top text-neutral-200 last:border-r-0">
                      <div className="min-w-[140px] whitespace-normal break-words leading-6">
                        {children}
                      </div>
                    </td>
                  );
                },
                p({ children }) {
                  return <p className="my-3 leading-7">{children}</p>;
                },
                ul({ children }) {
                  return (
                    <ul className="my-3 list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  );
                },
                ol({ children }) {
                  return (
                    <ol className="my-3 list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  );
                },
                li({ children }) {
                  return <li className="leading-7">{children}</li>;
                },
                code({ children }) {
                  return (
                    <code className="rounded bg-white/10 px-1 py-0.5 text-neutral-100">
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return (
                    <pre className="my-4 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950 p-4">
                      {children}
                    </pre>
                  );
                },
              }}
            >
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
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
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