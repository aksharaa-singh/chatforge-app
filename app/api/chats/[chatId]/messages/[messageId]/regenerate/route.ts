import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { generateChatResponse } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/chat";

type RouteContext = {
  params: Promise<{
    chatId: string;
    messageId: string;
  }>;
};

function getFriendlyLlmError(error: unknown) {
  console.error("LLM provider error:", error);

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("api key is not configured")) {
      return error.message;
    }

    if (
      message.includes("incorrect api key") ||
      message.includes("invalid api key") ||
      message.includes("401")
    ) {
      return "The API key was rejected. Check your OpenRouter key in .env.";
    }

    if (
      message.includes("insufficient_quota") ||
      message.includes("quota") ||
      message.includes("credits") ||
      message.includes("billing")
    ) {
      return "Your OpenRouter account may need credits or billing enabled.";
    }

    if (
      message.includes("model") &&
      (message.includes("does not exist") ||
        message.includes("not found") ||
        message.includes("access") ||
        message.includes("available"))
    ) {
      return "This model is not available through your OpenRouter account. Try another OpenRouter model.";
    }

    if (message.includes("rate")) {
      return "The selected model provider is rate limited. Please try again shortly.";
    }

    if (message.includes("429")) {
      return "OpenRouter free models are busy right now. Please try again in a minute.";
    }

    return `Provider error: ${error.message}`;
  }

  return "The selected model provider could not respond. Please try again.";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to edit messages." },
        { status: 401 }
      );
    }

    const { chatId, messageId } = await context.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message." },
        { status: 400 }
      );
    }

    const existingUserMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        chatId,
        role: "user",
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!existingUserMessage) {
      return NextResponse.json(
        { error: "Editable user message not found." },
        { status: 404 }
      );
    }

    const { content, provider, model } = parsed.data;

    await prisma.message.deleteMany({
      where: {
        chatId,
        createdAt: {
          gt: existingUserMessage.createdAt,
        },
      },
    });

    const userMessage = await prisma.message.update({
      where: {
        id: existingUserMessage.id,
      },
      data: {
        content,
        provider,
        model,
      },
      select: {
        id: true,
        role: true,
        content: true,
        provider: true,
        model: true,
        createdAt: true,
      },
    });

    const recentMessages = await prisma.message.findMany({
      where: {
        chatId,
        createdAt: {
          lte: existingUserMessage.createdAt,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        role: true,
        content: true,
      },
    });

    let assistantContent: string;

    try {
      const response = await generateChatResponse({
        provider,
        model,
        messages: recentMessages.reverse(),
      });

      assistantContent = response.content;
    } catch (error) {
      assistantContent = getFriendlyLlmError(error);
    }

    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: "assistant",
        content: assistantContent,
        provider,
        model,
      },
      select: {
        id: true,
        role: true,
        content: true,
        provider: true,
        model: true,
        createdAt: true,
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        title: chat.title === "New chat" ? content.slice(0, 60) : chat.title,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Regenerate message error:", error);

    return NextResponse.json(
      { error: "Could not edit and resend your ChatForge message." },
      { status: 500 }
    );
  }
}
