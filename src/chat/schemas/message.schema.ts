import { z } from "zod";

import {
  MessageDeliveryStatusSchema,
  MessageTypeSchema,
} from "../enums/enums.js";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const MessageSchema = z.object({
  id: z.string().uuid(),

  conversationId: z.string().uuid(),

  senderId: z.string().uuid().nullable(),

  guestSessionId: z.string().nullable(),

  senderType: z.enum([
    "CUSTOMER",
    "GUEST",
    "AGENT",
    "SYSTEM",
    "AI",
  ]),

  type: MessageTypeSchema,

  content: z.string().nullable(),

  replyToId: z.string().uuid().nullable(),

  orderId: z.string().uuid().nullable(),

  shipmentId: z.string().uuid().nullable(),

  returnRequestId: z.string().uuid().nullable(),

  deliveryStatus: MessageDeliveryStatusSchema,

  deliveredAt: z.coerce.date().nullable(),

  readAt: z.coerce.date().nullable(),

  isInternal: z.boolean(),

  isEdited: z.boolean(),

  editedAt: z.coerce.date().nullable(),

  deletedAt: z.coerce.date().nullable(),

  createdAt: z.coerce.date(),

  updatedAt: z.coerce.date(),
});

export type Message = z.infer<typeof MessageSchema>;

////////////////////////////////////////////////////////////
// SHARED INPUT
////////////////////////////////////////////////////////////

const MessageInputSchema = z
  .object({
    conversationId: z.string().uuid(),

    type: MessageTypeSchema.default("TEXT"),

    content: z
      .string()
      .trim()
      .max(5000)
      .optional(),

    replyToId: z.string().uuid().optional(),

    orderId: z.string().uuid().optional(),

    shipmentId: z.string().uuid().optional(),

    returnRequestId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === "TEXT" ||
        data.type === "SYSTEM") &&
      !data.content?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message:
          "Content is required for TEXT and SYSTEM messages.",
      });
    }
  });

////////////////////////////////////////////////////////////
// SEND MESSAGE
////////////////////////////////////////////////////////////

export const SendMessageSchema =
  MessageInputSchema;

export type SendMessage = z.infer<
  typeof SendMessageSchema
>;

////////////////////////////////////////////////////////////
// REPLY MESSAGE
////////////////////////////////////////////////////////////

export const ReplyMessageSchema = z
  .object({
    conversationId: z.string().uuid(),

    type: MessageTypeSchema.default("TEXT"),

    content: z
      .string()
      .trim()
      .max(5000)
      .optional(),

    replyToId: z.string().uuid(),

    orderId: z.string().uuid().optional(),

    shipmentId: z.string().uuid().optional(),

    returnRequestId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === "TEXT" ||
        data.type === "SYSTEM") &&
      !data.content?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message:
          "Content is required for TEXT and SYSTEM messages.",
      });
    }
  });

export type ReplyMessage = z.infer<
  typeof ReplyMessageSchema
>;

////////////////////////////////////////////////////////////
// EDIT MESSAGE
////////////////////////////////////////////////////////////

export const EditMessageSchema = z.object({
  messageId: z.string().uuid(),

  content: z
    .string()
    .trim()
    .min(1)
    .max(5000),
});

export type EditMessage = z.infer<
  typeof EditMessageSchema
>;

////////////////////////////////////////////////////////////
// DELETE MESSAGE
////////////////////////////////////////////////////////////

export const DeleteMessageSchema = z.object({
  messageId: z.string().uuid(),

  hardDelete: z.boolean().default(false),
});

export type DeleteMessage = z.infer<
  typeof DeleteMessageSchema
>;

////////////////////////////////////////////////////////////
// TYPING EVENT
////////////////////////////////////////////////////////////

export const TypingEventSchema = z.object({
  conversationId: z.string().uuid(),

  userId: z.string().uuid(),

  isTyping: z.boolean(),
});

export type TypingEvent = z.infer<
  typeof TypingEventSchema
>;

export const TypingIndicatorSchema =
  TypingEventSchema;

export type TypingIndicator =
  TypingEvent;

////////////////////////////////////////////////////////////
// LIST MESSAGES
////////////////////////////////////////////////////////////

export const ListMessagesSchema = z
  .object({
    conversationId: z.string().uuid(),

    beforeMessageId: z.string().uuid().optional(),

    afterMessageId: z.string().uuid().optional(),

    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(50),

    includeDeleted: z
      .boolean()
      .default(false),
  })
  .superRefine((data, ctx) => {
    if (
      data.beforeMessageId &&
      data.afterMessageId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["beforeMessageId"],
        message:
          "Specify either beforeMessageId or afterMessageId, not both.",
      });
    }
  });

export type ListMessages = z.infer<
  typeof ListMessagesSchema
>;