import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message cannot exceed 1000 characters"),
  replyToId: z.string().optional(),
  replyToContent: z.string().optional(),
  replyToUserName: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
