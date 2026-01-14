import { z } from "zod";

export const sendInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  expiresInDays: z.number().min(1).max(30).default(7),
});

export const approveApplicationSchema = z.object({
  pendingUserId: z.string(),
});

export const rejectApplicationSchema = z.object({
  pendingUserId: z.string(),
});
