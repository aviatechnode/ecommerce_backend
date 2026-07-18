import { z } from "zod";

import { PresenceStatusSchema } from "../enums/enums.js";

////////////////////////////////////////////////////////////
// USER PRESENCE
////////////////////////////////////////////////////////////

export const UserPresenceSchema = z.object({
  userId: z.string().uuid(),

  status: PresenceStatusSchema,

  lastSeenAt: z.coerce.date(),

  lastHeartbeatAt: z.coerce.date(),

  createdAt: z.coerce.date(),

  updatedAt: z.coerce.date(),
});

export type UserPresence = z.infer<
  typeof UserPresenceSchema
>;

////////////////////////////////////////////////////////////
// USER PRESENCE SESSION
////////////////////////////////////////////////////////////

export const UserPresenceSessionSchema =
  z.object({
    id: z.string().uuid(),

    userId: z.string().uuid(),

    socketId: z.string(),

    deviceId: z.string().optional().nullable(),

    isTyping: z.boolean(),

    typingConversationId: z
      .string()
      .uuid()
      .optional()
      .nullable(),

    connectedAt: z.coerce.date(),

    lastHeartbeatAt: z.coerce.date(),

    disconnectedAt: z
      .coerce
      .date()
      .optional()
      .nullable(),
  });

export type UserPresenceSession = z.infer<
  typeof UserPresenceSessionSchema
>;

////////////////////////////////////////////////////////////
// UPDATE PRESENCE
////////////////////////////////////////////////////////////

export const UpdatePresenceSchema = z.object({
  status: PresenceStatusSchema,
});

export type UpdatePresence = z.infer<
  typeof UpdatePresenceSchema
>;

////////////////////////////////////////////////////////////
// UPDATE TYPING
////////////////////////////////////////////////////////////

export const UpdateTypingSchema = z.object({
  conversationId: z.string().uuid(),

  isTyping: z.boolean(),
});

export type UpdateTyping = z.infer<
  typeof UpdateTypingSchema
>;

////////////////////////////////////////////////////////////
// GET USER PRESENCE
////////////////////////////////////////////////////////////

export const GetUserPresenceSchema = z.object({
  userId: z.string().uuid(),
});

export type GetUserPresence = z.infer<
  typeof GetUserPresenceSchema
>;