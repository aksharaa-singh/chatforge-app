import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messagePaginationSchema } from "@/lib/validations/chat";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to view messages." },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found." },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const parsed = messagePaginationSchema.safeParse({
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid pagination." },
        { status: 400 }
      );
    }

    const { cursor, limit } = parsed.data;

    const messages = await prisma.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: {
              id: cursor,
            },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        role: true,
        content: true,
        provider: true,
        model: true,
        createdAt: true,
      },
    });

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? pageMessages[pageMessages.length - 1]?.id
      : null;

    return NextResponse.json({
      messages: pageMessages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return NextResponse.json(
      { error: "Could not load messages for this ChatForge conversation." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to clear messages." },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found." },
        { status: 404 }
      );
    }

    await prisma.message.deleteMany({
      where: {
        chatId,
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Chat cleared successfully.",
    });
  } catch (error) {
    console.error("Clear messages error:", error);

    return NextResponse.json(
      { error: "Could not clear this ChatForge conversation." },
      { status: 500 }
    );
  }
}
