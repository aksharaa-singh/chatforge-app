"use client";

import {
  ChevronDown,
  Edit3,
  Eraser,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  User,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { MessageBubble } from "@/components/message-bubble";
import { ModelSelector } from "@/components/model-selector";
import { DEFAULT_MODEL } from "@/lib/models";
import type { ChatMessage, ChatSummary, ModelOption } from "@/lib/types";

const PROMPT_SUGGESTIONS = [
  {
    title: "Learn",
    prompt:
      "Explain a difficult concept in simple words, then quiz me with 3 questions.",
  },
  {
    title: "Write",
    prompt:
      "Help me write a clear, professional email and give me 2 tone options.",
  },
  {
    title: "Code",
    prompt:
      "Help me plan a small coding project with files, steps, and beginner-friendly explanations.",
  },
  {
    title: "Plan",
    prompt:
      "Turn this goal into a practical step-by-step plan with priorities and deadlines.",
  },
];

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};
type StreamEvent =
  | {
      type: "userMessage";
      userMessage: ChatMessage;
    }
  | {
      type: "chunk";
      content: string;
    }
  | {
      type: "assistantMessage";
      assistantMessage: ChatMessage;
    }
  | {
      type: "error";
      error: string;
    }
  | {
    type: "limit";
    message: string;
  };

function sortChats(chats: ChatSummary[]) {
  return [...chats].sort((firstChat, secondChat) => {
    if (firstChat.pinned !== secondChat.pinned) {
      return firstChat.pinned ? -1 : 1;
    }

    return (
      new Date(secondChat.updatedAt).getTime() -
      new Date(firstChat.updatedAt).getTime()
    );
  });
}

export function ChatApp({
  userEmail,
  userName,
}: {
  userEmail?: string | null;
  userName?: string | null;
}) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [animatedMessageId, setAnimatedMessageId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [isCompactMode, setIsCompactMode] = useState(false);
const [isTypewriterEnabled, setIsTypewriterEnabled] = useState(true);
const [theme, setTheme] = useState<"dark" | "graphite">("dark");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState(userName || "");
  const [profileDraftName, setProfileDraftName] = useState(userName || "");
  const [profileCreatedAt, setProfileCreatedAt] = useState("");
const [isEmailVerified, setIsEmailVerified] = useState(false);
const [hasPassword, setHasPassword] = useState(false);
const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(chatSearch.trim().toLowerCase())
  );
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  function isSameDay(firstDate: Date, secondDate: Date) {
  return firstDate.toDateString() === secondDate.toDateString();
}

function getInitials() {
  const source = profileName || userEmail || "ChatForge User";
  const parts = source.trim().split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatProfileDate(value: string) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

async function loadProfile() {
  setIsLoadingProfile(true);
  setProfileError("");
  setProfileMessage("");

  try {
    const response = await fetch("/api/account/profile");
    const data = await response.json();

    if (!response.ok) {
      setProfileError(data.error || "Could not load your profile.");
      return;
    }

    setProfileName(data.user.name || "");
    setProfileDraftName(data.user.name || "");
    setProfileCreatedAt(data.user.createdAt || "");
    setIsEmailVerified(Boolean(data.user.emailVerified));
    setHasPassword(Boolean(data.user.hasPassword));
  } catch {
    setProfileError("Network error while loading your profile.");
  } finally {
    setIsLoadingProfile(false);
  }
}

function getChatGroups(chatList: ChatSummary[]) {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  return [
    {
      label: "Pinned",
      chats: chatList.filter((chat) => chat.pinned),
    },
    {
      label: "Today",
      chats: chatList.filter(
        (chat) => !chat.pinned && isSameDay(new Date(chat.updatedAt), now)
      ),
    },
    {
      label: "Yesterday",
      chats: chatList.filter(
        (chat) =>
          !chat.pinned && isSameDay(new Date(chat.updatedAt), yesterday)
      ),
    },
    {
      label: "Older",
      chats: chatList.filter((chat) => {
        const updatedAt = new Date(chat.updatedAt);
        return (
          !chat.pinned &&
          !isSameDay(updatedAt, now) &&
          !isSameDay(updatedAt, yesterday)
        );
      }),
    },
  ].filter((group) => group.chats.length > 0);
}

const chatGroups = getChatGroups(filteredChats);
  const displayName = profileName.trim() || userEmail || "Signed in";

  function createOptimisticUserMessage(content: string): ChatMessage {
    return {
      id: `optimistic-${crypto.randomUUID()}`,
      role: "user",
      content,
      provider: selectedModel.provider,
      model: selectedModel.model,
      createdAt: new Date().toISOString(),
    };
  }

  function showToast(message: string, type: Toast["type"] = "info") {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  async function loadChats() {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not load ChatForge conversations.");
        return;
      }

      setChats(sortChats(data.chats));
    } catch {
      setError("Network error while loading ChatForge conversations.");
    } finally {
      setIsLoadingChats(false);
    }
  }

  async function createChat(initialPrompt?: string) {
    setError("");

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New chat",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create a new conversation.");
        return;
      }

      setChats((current) => sortChats([data.chat, ...current]));
      setActiveChatId(data.chat.id);
      setIsSidebarOpen(false);
      setMessages([]);
      setNextCursor(null);
      setAnimatedMessageId("");
      setEditingMessage(null);

      if (initialPrompt) {
        await sendMessageToChat(data.chat.id, initialPrompt);
      }
    } catch {
      setError("Network error while creating a conversation.");
    }
  }

  async function deleteChat(chatId: string) {
    const shouldDelete = window.confirm(
      "Delete this ChatForge conversation? This cannot be undone."
    );

    if (!shouldDelete) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not delete this conversation.");
        return;
      }

      setChats((current) => current.filter((chat) => chat.id !== chatId));

      if (activeChatId === chatId) {
        setActiveChatId("");
        setMessages([]);
        setNextCursor(null);
        setAnimatedMessageId("");
        setEditingMessage(null);
      }
    } catch {
      setError("Network error while deleting a conversation.");
    }
  }

  async function renameChat(chatId: string, currentTitle: string) {
    const title = window.prompt("Rename ChatForge conversation", currentTitle);

    if (!title?.trim()) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not rename this conversation.");
        return;
      }

      setChats((current) =>
        sortChats(current.map((chat) => (chat.id === chatId ? data.chat : chat)))
      );
      showToast("Chat renamed.", "success");
    } catch {
      setError("Network error while renaming this conversation.");
      showToast("Network error while renaming this conversation.", "error");
    }
  }

  async function togglePinnedChat(chatId: string, pinned: boolean) {
    setError("");

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinned,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not update pinned status.");
        showToast(data.error || "Could not update pinned status.", "error");
        return;
      }

      setChats((current) =>
        sortChats(current.map((chat) => (chat.id === chatId ? data.chat : chat)))
      );
      showToast(pinned ? "Chat pinned." : "Chat unpinned.", "success");
    } catch {
      setError("Network error while updating pinned status.");
      showToast("Network error while updating pinned status.", "error");
    }
  }

  async function loadMessages(chatId: string) {
    setError("");
    setIsLoadingMessages(true);
    setMessages([]);
    setNextCursor(null);
    setAnimatedMessageId("");
    setEditingMessage(null);

    try {
      const response = await fetch(`/api/chats/${chatId}/messages?limit=20`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not load messages.");
        return;
      }

      setMessages(data.messages);
      setNextCursor(data.nextCursor);
    } catch {
      setError("Network error while loading messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function loadOlderMessages() {
    if (!activeChatId || !nextCursor || isLoadingOlder) {
      return;
    }

    setError("");
    setIsLoadingOlder(true);

    try {
      const response = await fetch(
        `/api/chats/${activeChatId}/messages?cursor=${nextCursor}&limit=20`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not load older messages.");
        return;
      }

      setMessages((current) => [...data.messages, ...current]);
      setNextCursor(data.nextCursor);
    } catch {
      setError("Network error while loading older messages.");
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function clearActiveChat() {
    if (!activeChatId || messages.length === 0) {
      return;
    }

    const shouldClear = window.confirm(
      "Clear all messages in this ChatForge conversation?"
    );

    if (!shouldClear) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not clear this conversation.");
        showToast(data.error || "Could not clear this conversation.", "error");
        return;
      }

      setMessages([]);
      setNextCursor(null);
      setAnimatedMessageId("");
      setEditingMessage(null);
      setChats((current) =>
        sortChats(
          current.map((chat) =>
            chat.id === activeChatId
              ? { ...chat, updatedAt: new Date().toISOString() }
              : chat
          )
        )
      );
      showToast("Conversation cleared.", "success");
    } catch {
      setError("Network error while clearing this conversation.");
      showToast("Network error while clearing this conversation.", "error");
    }
  }

async function sendMessageToChat(chatId: string, content: string) {
  setError("");
  setIsSending(true);
  setAnimatedMessageId("");

  const optimisticUserMessage = createOptimisticUserMessage(content);
  const streamingAssistantId = `streaming-${crypto.randomUUID()}`;

  const optimisticAssistantMessage: ChatMessage = {
    id: streamingAssistantId,
    role: "assistant",
    content: "",
    provider: selectedModel.provider,
    model: selectedModel.model,
    createdAt: new Date().toISOString(),
  };

  setMessages((current) => [
    ...current,
    optimisticUserMessage,
    optimisticAssistantMessage,
  ]);

  const abortController = new AbortController();
  abortControllerRef.current = abortController;

  try {
    const response = await fetch(`/api/chats/${chatId}/messages/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: abortController.signal,
      body: JSON.stringify({
        content,
        provider: selectedModel.provider,
        model: selectedModel.model,
      }),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "Could not stream your message.");
      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !== optimisticUserMessage.id &&
            message.id !== streamingAssistantId
        )
      );
      setInput(content);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const event = JSON.parse(line) as StreamEvent;

        if (event.type === "userMessage") {
          setMessages((current) =>
            current.map((message) =>
              message.id === optimisticUserMessage.id
                ? event.userMessage
                : message
            )
          );
        }

        if (event.type === "chunk") {
          setMessages((current) =>
            current.map((message) =>
              message.id === streamingAssistantId
                ? {
                    ...message,
                    content: message.content + event.content,
                  }
                : message
            )
          );
        }

        if (event.type === "limit") {
  showToast(event.message, "info");
}

        if (event.type === "assistantMessage") {
          setMessages((current) =>
            current.map((message) =>
              message.id === streamingAssistantId
                ? event.assistantMessage
                : message
            )
          );
          

          setAnimatedMessageId("");

          setChats((current) =>
            sortChats(
              current.map((chat) =>
                chat.id === chatId
                  ? {
                      ...chat,
                      title:
                        chat.title === "New chat"
                          ? content.slice(0, 60)
                          : chat.title,
                      updatedAt: new Date().toISOString(),
                    }
                  : chat
              )
            )
          );
        }

        if (event.type === "error") {
          setError(event.error || "The selected model provider could not respond.");
          setMessages((current) =>
            current.filter(
              (message) =>
                message.id !== optimisticUserMessage.id &&
                message.id !== streamingAssistantId
            )
          );
          setInput(content);
        }
      }
    }
  } catch (requestError) {
    if (
      requestError instanceof DOMException &&
      requestError.name === "AbortError"
    ) {
      setError("ChatForge response stopped.");
      return;
    }

    setError("Network error while streaming your message.");
    setMessages((current) =>
      current.filter(
        (message) =>
          message.id !== optimisticUserMessage.id &&
          message.id !== streamingAssistantId
      )
    );
    setInput(content);
  } finally {
    abortControllerRef.current = null;
    setIsSending(false);
  }
}

  function startEditingMessage(message: ChatMessage) {
    setEditingMessage(message);
    setInput(message.content);
    setError("");
  }

  function cancelEditingMessage() {
    setEditingMessage(null);
    setInput("");
    setError("");
  }

  async function editAndResendMessage(
    content: string,
    sourceMessage = editingMessage
  ) {
    if (!activeChatId || !sourceMessage) {
      return;
    }

    setError("");
    setIsSending(true);
    setAnimatedMessageId("");

    const previousMessages = messages;
    const optimisticEditedMessage: ChatMessage = {
      ...sourceMessage,
      content,
      provider: selectedModel.provider,
      model: selectedModel.model,
    };

    setMessages((current) => {
      const messageIndex = current.findIndex(
        (message) => message.id === sourceMessage.id
      );

      if (messageIndex === -1) {
        return current;
      }

      return [...current.slice(0, messageIndex), optimisticEditedMessage];
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(
        `/api/chats/${activeChatId}/messages/${sourceMessage.id}/regenerate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
          body: JSON.stringify({
            content,
            provider: selectedModel.provider,
            model: selectedModel.model,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not edit and resend your message.");
        setMessages(previousMessages);
        setInput(content);
        return;
      }

      setMessages((current) => {
        const messageIndex = current.findIndex(
          (message) => message.id === sourceMessage.id
        );

        if (messageIndex === -1) {
          return [...current, data.userMessage, data.assistantMessage];
        }

        return [
          ...current.slice(0, messageIndex),
          data.userMessage,
          data.assistantMessage,
        ];
      });
      setAnimatedMessageId(data.assistantMessage.id);
      setEditingMessage(null);

      setChats((current) =>
        sortChats(
          current.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  title:
                    chat.title === "New chat"
                      ? content.slice(0, 60)
                      : chat.title,
                  updatedAt: new Date().toISOString(),
                }
              : chat
          )
        )
      );
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        setError("ChatForge response stopped.");
        return;
      }

      setError("Network error while editing your message.");
      setMessages(previousMessages);
      setInput(content);
    } finally {
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }

  async function regenerateAssistantResponse(message: ChatMessage) {
    const assistantIndex = messages.findIndex(
      (currentMessage) => currentMessage.id === message.id
    );
    const previousUserMessage = messages
      .slice(0, assistantIndex)
      .reverse()
      .find((currentMessage) => currentMessage.role === "user");

    if (!previousUserMessage) {
      showToast("No user message found to regenerate from.", "error");
      return;
    }

    setEditingMessage(null);
    setInput("");
    await editAndResendMessage(previousUserMessage.content, previousUserMessage);
  }
  async function continueAssistantResponse() {
  if (!activeChatId || isSending) {
    return;
  }

  await sendMessageToChat(
    activeChatId,
    "Continue from your previous response. Do not repeat what you already said."
  );
}

async function shortenAssistantResponse() {
  if (!activeChatId || isSending) {
    return;
  }

  await sendMessageToChat(
    activeChatId,
    "Rewrite your previous response in a shorter, clearer version."
  );
}

async function expandAssistantResponse() {
  if (!activeChatId || isSending) {
    return;
  }

  await sendMessageToChat(
    activeChatId,
    "Expand your previous response with more useful details, examples, and structure."
  );
}

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeChatId || !input.trim() || isSending) {
      return;
    }

    const content = input.trim();
    setInput("");

    if (editingMessage) {
      await editAndResendMessage(content);
      return;
    }

    await sendMessageToChat(activeChatId, content);
  }

  function stopResponse() {
    abortControllerRef.current?.abort();
  }

  async function saveProfile() {
    setProfileError("");
    setProfileMessage("");
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileDraftName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.error || "Could not update your profile.");
        return;
      }

      setProfileName(data.user.name || "");
      setProfileDraftName(data.user.name || "");
      setProfileMessage("Profile updated.");
      setIsEditingProfile(false);
      showToast("Profile updated.", "success");
    } catch {
      setProfileError("Network error while updating your profile.");
      showToast("Network error while updating your profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  }

  useEffect(() => {
    // Data loading on mount is intentional for this client component.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
   <div
  className={`flex h-screen overflow-hidden text-white ${
    theme === "graphite" ? "bg-zinc-900" : "bg-neutral-950"
  }`}
>
      {toasts.length > 0 ? (
        <div className="fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg border px-4 py-3 text-sm shadow-2xl ${
                toast.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : toast.type === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-100"
                    : "border-white/10 bg-neutral-900 text-neutral-100"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-white/10 bg-neutral-900 transition-transform lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div>
            <p className="text-sm font-semibold">ChatForge</p>
            <p className="text-xs text-neutral-500">Private AI workspace</p>
          </div>

          <button
            type="button"
            onClick={() => createChat()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-neutral-950 transition hover:bg-neutral-200"
            aria-label="New chat"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 p-3">
          <label className="relative block">
            <span className="sr-only">Search chats</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/10 bg-neutral-950 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
              placeholder="Search chats"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {isLoadingChats ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-400">
              Loading conversations...
            </div>
          ) : null}

          {!isLoadingChats && chats.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-neutral-400">
              No conversations yet.
            </div>
          ) : null}

          {!isLoadingChats && chats.length > 0 && filteredChats.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-neutral-400">
              No chats match your search.
            </div>
          ) : null}

          <div className="space-y-5">
  {chatGroups.map((group) => (
    <div key={group.label}>
      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-600">
        {group.label}
      </p>
      <div className="space-y-1">
        {group.chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition ${
                  chat.id === activeChatId
                    ? "bg-white text-neutral-950"
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setIsSidebarOpen(false);
                    void loadMessages(chat.id);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {chat.pinned ? (
                    <Pin className="h-4 w-4 shrink-0" />
                  ) : (
                    <MessageSquare className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate text-sm">{chat.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => togglePinnedChat(chat.id, !chat.pinned)}
                  className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition group-hover:inline-flex ${
                    chat.id === activeChatId
                      ? "hover:bg-neutral-200"
                      : "hover:bg-white/10"
                  }`}
                  aria-label={chat.pinned ? "Unpin chat" : "Pin chat"}
                  title={chat.pinned ? "Unpin chat" : "Pin chat"}
                >
                  {chat.pinned ? (
                    <PinOff className="h-4 w-4" />
                  ) : (
                    <Pin className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => renameChat(chat.id, chat.title)}
                  className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition group-hover:inline-flex ${
                    chat.id === activeChatId
                      ? "hover:bg-neutral-200"
                      : "hover:bg-white/10"
                  }`}
                  aria-label="Rename chat"
                  title="Rename chat"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => deleteChat(chat.id)}
                  className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition group-hover:inline-flex ${
                    chat.id === activeChatId
                      ? "hover:bg-neutral-200"
                      : "hover:bg-white/10"
                  }`}
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
                  ))}
      </div>
    </div>
  ))}
</div>
        </div>

        <div className="relative border-t border-white/10 p-4">
          {isAccountMenuOpen ? (
            <div className="absolute bottom-[88px] left-4 right-4 overflow-hidden rounded-lg border border-white/10 bg-neutral-950 shadow-2xl">
              <button
                type="button"
                onClick={() => {
  setIsProfileOpen(true);
  setIsEditingProfile(false);
  setProfileDraftName(profileName);
  setIsAccountMenuOpen(false);
  setProfileMessage("");
  setProfileError("");
  void loadProfile();
}}
                className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-neutral-200 transition hover:bg-white/10"
              >
                <User className="h-4 w-4" />
                Your profile
              </button>
              <button
  type="button"
  onClick={() => {
    setIsSettingsOpen(true);
    setIsAccountMenuOpen(false);
  }}
  className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-neutral-200 transition hover:bg-white/10"
>
  <Settings className="h-4 w-4" />
  Settings
</button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-neutral-200 transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((current) => !current)}
            className="flex w-full items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-left transition hover:bg-white/10"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-950">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {displayName}
              </span>
              <span className="block truncate text-xs text-neutral-500">
                {userEmail || "ChatForge account"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
          </button>
        </div>
      </aside>

      {isProfileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close profile panel"
            onClick={() => {
              setIsProfileOpen(false);
              setIsEditingProfile(false);
              setProfileDraftName(profileName);
            }}
            className="fixed inset-0 z-40 bg-black/60"
          />
          <section className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-neutral-950 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <div>
                <p className="text-sm font-semibold">Your profile</p>
                <p className="text-xs text-neutral-500">
                  Manage your ChatForge account details
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsEditingProfile(false);
                  setProfileDraftName(profileName);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close profile"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-6 flex items-center gap-4">
  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-neutral-950">
    {getInitials()}
  </div>
  <div>
    <p className="text-sm font-medium text-white">{displayName}</p>
    <p className="text-xs text-neutral-500">{userEmail || "ChatForge account"}</p>
  </div>
</div>

              <div className="space-y-4">
                {isEditingProfile ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-300">
                        Name
                      </span>
                      <input
                        value={profileDraftName}
                        onChange={(event) =>
                          setProfileDraftName(event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                        placeholder="Your name"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-300">
                        Email
                      </span>
                      <input
                        value={userEmail || ""}
                        readOnly
                        className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-neutral-400 outline-none"
                      />
                    </label>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Name
                      </p>
                      <p className="mt-1 text-sm text-white">
                        {profileName || "No name added"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm text-white">
                        {userEmail || "No email available"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
  <div className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
      Joined
    </p>
    <p className="mt-1 text-sm text-white">
      {formatProfileDate(profileCreatedAt)}
    </p>
  </div>

  <div className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
      Email status
    </p>
    <p
      className={`mt-1 text-sm ${
        isEmailVerified ? "text-emerald-300" : "text-amber-300"
      }`}
    >
      {isEmailVerified ? "Verified" : "Not verified"}
    </p>
  </div>
</div>

                {profileError ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {profileError}
                  </div>
                ) : null}

                {profileMessage ? (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    {profileMessage}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-white/10 p-5">
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileDraftName(profileName);
                      setProfileError("");
                    }}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={isSavingProfile}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingProfile ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
  <button
    type="button"
    onClick={() => {
      setIsEditingProfile(true);
      setProfileDraftName(profileName);
      setProfileMessage("");
      setProfileError("");
    }}
    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
  >
    <Edit3 className="h-4 w-4" />
    Edit profile
  </button>

  {hasPassword ? (
    <a
      href="/forgot-password"
      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/10 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
    >
      Change password
    </a>
  ) : null}
</div>
              )}
            </div>
          </section>
        </>
      ) : null}

{isLoadingProfile ? (
  <div className="mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-400">
    Loading profile...
  </div>
) : null}

      {isSettingsOpen ? (
  <>
    <button
      type="button"
      aria-label="Close settings panel"
      onClick={() => setIsSettingsOpen(false)}
      className="fixed inset-0 z-40 bg-black/60"
    />
    <section className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-neutral-950 shadow-2xl">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div>
          <p className="text-sm font-semibold">Settings</p>
          <p className="text-xs text-neutral-500">
            Customize your ChatForge workspace
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Close settings"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
          <p className="text-sm font-medium text-white">Theme</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`h-10 rounded-lg border text-sm transition ${
                theme === "dark"
                  ? "border-white bg-white text-neutral-950"
                  : "border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("graphite")}
              className={`h-10 rounded-lg border text-sm transition ${
                theme === "graphite"
                  ? "border-white bg-white text-neutral-950"
                  : "border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
            >
              Graphite
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Compact mode</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Tightens message spacing for long research sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCompactMode((current) => !current)}
              className={`h-6 w-11 rounded-full p-1 transition ${
                isCompactMode ? "bg-white" : "bg-neutral-700"
              }`}
              aria-label="Toggle compact mode"
            >
              <span
                className={`block h-4 w-4 rounded-full transition ${
                  isCompactMode
                    ? "translate-x-5 bg-neutral-950"
                    : "bg-neutral-300"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                Typewriter animation
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Animate new assistant responses as they appear.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setIsTypewriterEnabled((current) => !current)
              }
              className={`h-6 w-11 rounded-full p-1 transition ${
                isTypewriterEnabled ? "bg-white" : "bg-neutral-700"
              }`}
              aria-label="Toggle typewriter animation"
            >
              <span
                className={`block h-4 w-4 rounded-full transition ${
                  isTypewriterEnabled
                    ? "translate-x-5 bg-neutral-950"
                    : "bg-neutral-300"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
          <p className="text-sm font-medium text-white">Default model</p>
          <div className="mt-3">
            <ModelSelector
              selectedModel={selectedModel}
              onChange={setSelectedModel}
            />
          </div>
        </div>
      </div>
    </section>
  </>
) : null}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-200 lg:hidden"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {activeChat?.title || "New ChatForge conversation"}
              </p>
              <p className="mt-1 inline-flex rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                {selectedModel.label}
              </p>
            </div>
          </div>

          {activeChatId ? (
            <button
              type="button"
              onClick={clearActiveChat}
              disabled={messages.length === 0 || isSending}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Clear chat"
            >
              <Eraser className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          ) : null}
        </header>

        <section className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex-1 overflow-y-auto px-4 py-6"
            onScroll={(event) => {
              if (event.currentTarget.scrollTop < 80) {
                void loadOlderMessages();
              }
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
              {activeChatId && nextCursor ? (
                <div className="mb-4 flex justify-center">
                  <button
                    type="button"
                    onClick={loadOlderMessages}
                    disabled={isLoadingOlder}
                    className="h-9 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingOlder ? "Loading older..." : "Load older messages"}
                  </button>
                </div>
              ) : null}

              {isLoadingMessages ? (
                <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
                  Loading messages...
                </div>
              ) : null}

              {!isLoadingMessages && !activeChatId ? (
                <div className="flex flex-1 items-center justify-center text-center">
                  <div className="max-w-2xl">
                    <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
                      CF
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                      Welcome to ChatForge
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-400">
                      Choose a model, start fresh, or use a suggestion to begin
                      faster.
                    </p>

                    <div className="mx-auto mt-6 flex max-w-xs flex-col items-stretch gap-3">
                      <ModelSelector
                        selectedModel={selectedModel}
                        onChange={setSelectedModel}
                      />

                      <button
                        type="button"
                        onClick={() => createChat()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
                      >
                        <Plus className="h-4 w-4" />
                        New chat
                      </button>
                    </div>

                    <div className="mt-7 grid gap-2 sm:grid-cols-2">
                      {PROMPT_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.title}
                          type="button"
                          onClick={() => createChat(suggestion.prompt)}
                          className="rounded-lg border border-white/10 bg-neutral-900 px-4 py-3 text-left transition hover:border-white/20 hover:bg-neutral-800"
                        >
                         <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-950">
  {suggestion.title.slice(0, 1)}
</span>
<span className="block text-sm font-medium text-white">
  {suggestion.title}
</span>
                          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-neutral-500">
                            {suggestion.prompt}
                          </span>
                        </button>
                      ))}
                    </div>

                    {error ? (
                      <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!isLoadingMessages && activeChatId && messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-center">
                  <div className="max-w-md">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Start a new ChatForge thread
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-neutral-400">
                      Ask a question, draft an idea, or explore a topic with the
                      selected model.
                    </p>

                    {isSending ? (
                      <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        ChatForge is thinking...
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {messages.length > 0 ? (
                 <div className={isCompactMode ? "space-y-2" : "space-y-4"}>
                  {messages.map((message) => (
                    <MessageBubble
  key={message.id}
  message={message}
  animate={
    isTypewriterEnabled &&
    message.id === animatedMessageId &&
    !message.id.startsWith("streaming-")
  }
  isStreaming={message.id.startsWith("streaming-")}
  onEditUserMessage={startEditingMessage}
  onRegenerateAssistantMessage={regenerateAssistantResponse}
  onContinueAssistantMessage={continueAssistantResponse}
  onShortenAssistantMessage={shortenAssistantResponse}
  onExpandAssistantMessage={expandAssistantResponse}
  onCopied={() => showToast("Copied.", "success")}
/>
                  ))}

                  {isSending ? (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        ChatForge is thinking...
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              ) : null}
            </div>
          </div>

          {activeChatId ? (
            <div className="border-t border-white/10 bg-neutral-950 px-4 py-4">
              <div className="mx-auto w-full max-w-3xl">
                {error ? (
                  <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={sendMessage} className="space-y-3">
                  {editingMessage ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      <span className="min-w-0 truncate">
                        Editing a previous message. Sending will regenerate from
                        that point.
                      </span>
                      <button
                        type="button"
                        onClick={cancelEditingMessage}
                        className="shrink-0 text-xs font-medium text-amber-50 underline decoration-amber-200/40 underline-offset-4"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onChange={setSelectedModel}
                      disabled={isSending}
                    />
                  </div>

                  <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-neutral-900 p-2">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      disabled={!activeChatId || isSending}
                      rows={1}
                      placeholder={
                        editingMessage
                          ? "Edit your message and resend..."
                          : "Message ChatForge..."
                      }
                      className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />

                    {isSending ? (
                      <button
                        type="button"
                        onClick={stopResponse}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 px-3 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!activeChatId || !input.trim()}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={
                          editingMessage ? "Update and resend" : "Send message"
                        }
                        title={
                          editingMessage ? "Update and resend" : "Send message"
                        }
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="px-1 text-xs text-neutral-600">
                    Enter to send, Shift + Enter for a new line.
                  </p>
                </form>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
