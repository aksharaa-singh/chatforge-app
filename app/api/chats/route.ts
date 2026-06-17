import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChatSchema } from "@/lib/validations/chat";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to view chats." },
        { status: 401 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Get chats error:", error);

    return NextResponse.json(
      { error: "Could not load your ChatForge conversations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to create a chat." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid chat data." },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        title: parsed.data.title || "New chat",
      },
      select: {
        id: true,
        title: true,
        pinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.error("Create chat error:", error);

    return NextResponse.json(
      { error: "Could not create a new ChatForge conversation." },
      { status: 500 }
    );
  }
}
