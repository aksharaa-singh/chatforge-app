import { z } from "zod";

export const createChatSchema = z.object({
  title: z.string().trim().max(80, "Title is too long.").optional(),
});

export const updateChatSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Chat title is required.")
      .max(80, "Chat title is too long.")
      .optional(),
    pinned: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.pinned !== undefined, {
    message: "No chat changes were provided.",
  });

export const messagePaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(12000, "Message is too long."),
  provider: z.enum(["openai", "anthropic", "deepseek"]),
  model: z.string().trim().min(1, "Model is required.").max(100),
});
