import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateChatSchema } from "@/lib/validations/chat";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update chats." },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    const body = await request.json();
    const parsed = updateChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid chat update." },
        { status: 400 }
      );
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingChat) {
      return NextResponse.json(
        { error: "Chat not found." },
        { status: 404 }
      );
    }

    const chat = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.pinned !== undefined
          ? { pinned: parsed.data.pinned }
          : {}),
      },
      select: {
        id: true,
        title: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Rename chat error:", error);

    return NextResponse.json(
      { error: "Could not rename this ChatForge conversation." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to delete chats." },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;

    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingChat) {
      return NextResponse.json(
        { error: "Chat not found." },
        { status: 404 }
      );
    }

    await prisma.chat.delete({
      where: {
        id: chatId,
      },
    });

    return NextResponse.json({
      message: "Chat deleted successfully.",
    });
  } catch (error) {
    console.error("Delete chat error:", error);

    return NextResponse.json(
      { error: "Could not delete this ChatForge conversation." },
      { status: 500 }
    );
  }
}
