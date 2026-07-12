import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/chat";

type RouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

const FALLBACK_MODELS = [
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-chat-v3:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
];

function getModelsToTry(model: string) {
  return Array.from(
    new Set([model, ...FALLBACK_MODELS].filter(Boolean))
  );
}

function encodeEvent(data: unknown) {
  return new TextEncoder().encode(`${JSON.stringify(data)}\n`);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to send messages." },
        { status: 401 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured." },
        { status: 500 }
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
        title: true,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message." },
        { status: 400 }
      );
    }

    const { content, provider, model } = parsed.data;

    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: "user",
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

    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "ChatForge",
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        let assistantContent = "";
        let selectedModel = model;
        let lastError: unknown;

        controller.enqueue(
          encodeEvent({
            type: "userMessage",
            userMessage,
          })
        );

        for (const modelToTry of getModelsToTry(model)) {
          try {
            selectedModel = modelToTry;

            const completion = await client.chat.completions.create({
              model: modelToTry,
              max_tokens: 3000,
              stream: true,
              messages: recentMessages.reverse().map((message) => ({
                role: message.role,
                content: message.content,
              })),
            });

let hitResponseLimit = false;

for await (const chunk of completion) {
  const choice = chunk.choices[0];
  const delta = choice?.delta?.content || "";

  if (choice?.finish_reason === "length") {
    hitResponseLimit = true;
  }

  if (!delta) {
    continue;
  }

  assistantContent += delta;

  controller.enqueue(
    encodeEvent({
      type: "chunk",
      content: delta,
    })
  );
}

if (hitResponseLimit) {
  controller.enqueue(
    encodeEvent({
      type: "limit",
      message:
        "This response reached the model response limit. You can ask ChatForge to continue from here.",
    })
  );
}

            break;
          } catch (error) {
            lastError = error;
            console.warn(`Streaming model failed: ${modelToTry}`, error);

            if (assistantContent.length > 0) {
              break;
            }
          }
        }

        if (!assistantContent) {
          controller.enqueue(
            encodeEvent({
              type: "error",
              error:
                lastError instanceof Error
                  ? lastError.message
                  : "The selected model provider could not respond.",
            })
          );
          controller.close();
          return;
        }

        const assistantMessage = await prisma.message.create({
          data: {
            chatId,
            role: "assistant",
            content: assistantContent,
            provider,
            model: selectedModel,
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

        controller.enqueue(
          encodeEvent({
            type: "assistantMessage",
            assistantMessage,
          })
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Stream message error:", error);

    return NextResponse.json(
      { error: "Could not stream your ChatForge message." },
      { status: 500 }
    );
  }
}