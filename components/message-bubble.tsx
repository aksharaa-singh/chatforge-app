"use client";

import {
  Check,
  Copy,
  Edit3,
  FileText,
  ListCollapse,
  RefreshCw,
  Sparkles,
} from "lucide-react";
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
  isStreaming,
  themeClasses,
  onEditUserMessage,
  onRegenerateAssistantMessage,
  onContinueAssistantMessage,
  onShortenAssistantMessage,
  onExpandAssistantMessage,
  onCopied,
}: {
  message: ChatMessage;
  animate: boolean;
  isStreaming?: boolean;
  themeClasses: {
  userBubble: string;
  assistantAction: string;
  border: string;
  muted: string;
  text: string;
  textSoft: string;
  assistantResponse: string;
assistantTable: string;
surfaceMuted: string;
codeBlock: string;
inlineCode: string;
};
  onEditUserMessage?: (message: ChatMessage) => void;
  onRegenerateAssistantMessage?: (message: ChatMessage) => void;
  onContinueAssistantMessage?: (message: ChatMessage) => void;
  onShortenAssistantMessage?: (message: ChatMessage) => void;
  onExpandAssistantMessage?: (message: ChatMessage) => void;
  onCopied?: () => void;
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
    onCopied?.();

    window.setTimeout(() => {
      setIsCopied(false);
    }, 1400);
  }

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative px-4 py-3 text-sm leading-6 ${
          isUser
            ? `max-w-[85%] rounded-2xl shadow-sm sm:max-w-[72%] ${themeClasses.userBubble}`
            : `w-full max-w-full ${themeClasses.textSoft}`
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{displayedContent}</p>
        ) : (
          <div className={`max-w-full overflow-x-auto ${themeClasses.assistantResponse}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table({ children }) {
                  return (
                    <div className={`my-5 w-full overflow-x-auto rounded-xl border ${themeClasses.assistantTable}`}>
                      <table className="w-max min-w-full table-auto border-collapse text-left text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) {
                  return <thead className={themeClasses.surfaceMuted}>{children}</thead>;
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
                    <th className={`border-r px-4 py-3 align-top text-xs font-semibold uppercase tracking-[0.08em] last:border-r-0 ${themeClasses.border} ${themeClasses.text}`}>
                      {children}
                    </th>
                  );
                },
                td({ children }) {
  return (
    <td className={`whitespace-nowrap border-r px-4 py-3 align-top last:border-r-0 ${themeClasses.border} ${themeClasses.textSoft}`}>
      <div className="max-w-[360px] whitespace-normal break-words leading-6">
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
    <code className={`rounded px-1 py-0.5 ${themeClasses.inlineCode}`}>
      {children}
    </code>
  );
},
                pre({ children }) {
  return (
    <pre className={`my-4 overflow-x-auto rounded-lg border p-4 ${themeClasses.codeBlock}`}>
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
          <div className="mt-3 flex justify-end gap-1">
  <button
    type="button"
    onClick={copyMessage}
    className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${themeClasses.assistantAction}`}
    aria-label="Copy user message"
    title="Copy"
  >
    {isCopied ? (
      <Check className="h-4 w-4" />
    ) : (
      <Copy className="h-4 w-4" />
    )}
  </button>

  <button
    type="button"
    onClick={() => onEditUserMessage?.(message)}
    className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border opacity-100 transition hover:-translate-y-0.5 active:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100 ${themeClasses.assistantAction}`}
    aria-label="Edit and resend message"
    title="Edit and resend"
  >
    <Edit3 className="h-4 w-4" />
  </button>
</div>
        ) : !isStreaming ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            {providerLabel ? (
              <p className="mr-auto text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                {providerLabel}
              </p>
            ) : (
              <span className="mr-auto" />
            )}

            <button
  type="button"
  onClick={copyMessage}
  title="Copy"
  className={`group/action relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${themeClasses.assistantAction}`}
>
  {isCopied ? (
    <Check className="h-3.5 w-3.5" />
  ) : (
    <Copy className="h-3.5 w-3.5" />
  )}
  <span className="sr-only">Copy</span>
  <span className={`pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-lg group-hover/action:block ${themeClasses.codeBlock}`}>
    Copy
  </span>
</button>

            <button
  type="button"
  onClick={() => onRegenerateAssistantMessage?.(message)}
  title="Regenerate"
  className={`group/action relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${themeClasses.assistantAction}`}
>
  <RefreshCw className="h-3.5 w-3.5" />
  <span className="sr-only">Regenerate</span>
  <span className={`pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-lg group-hover/action:block ${themeClasses.codeBlock}`}>
    Regenerate
  </span>
</button>
           <button
  type="button"
  onClick={() => onContinueAssistantMessage?.(message)}
  title="Continue"
  className={`group/action relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${themeClasses.assistantAction}`}
>
  <FileText className="h-3.5 w-3.5" />
  <span className="sr-only">Continue</span>
  <span className={`pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-lg group-hover/action:block ${themeClasses.codeBlock}`}>
    Continue
  </span>
</button>

            <button
  type="button"
  onClick={() => onShortenAssistantMessage?.(message)}
  title="Shorter"
  className={`group/action relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${themeClasses.assistantAction}`}
>
  <ListCollapse className="h-3.5 w-3.5" />
  <span className="sr-only">Shorter</span>
  <span className={`pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-lg group-hover/action:block ${themeClasses.codeBlock}`}>
    Shorter
  </span>
</button>

           <button
  type="button"
  onClick={() => onExpandAssistantMessage?.(message)}
  title="More detailed"
  className={`group/action relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${themeClasses.assistantAction}`}
>
  <Sparkles className="h-3.5 w-3.5" />
  <span className="sr-only">More detailed</span>
  <span className={`pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] shadow-lg group-hover/action:block ${themeClasses.codeBlock}`}>
    More detailed
  </span>
</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}