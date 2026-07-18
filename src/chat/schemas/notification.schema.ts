import { z } from "zod";

import { NotificationTypeSchema } from "../enums/enums.js";

////////////////////////////////////////////////////////////
// NOTIFICATION
////////////////////////////////////////////////////////////

export const NotificationSchema =
  z.object({
    id: z.string().uuid(),

    userId: z.string().uuid(),

    type: NotificationTypeSchema,

    title: z.string(),

    message: z.string(),

    isRead: z.boolean(),

    entityType: z.string().nullable(),

    entityId: z.string().nullable(),

    conversationId: z.string().uuid().nullable(),

    messageId: z.string().uuid().nullable(),

    senderId: z.string().uuid().nullable(),

    readAt: z.coerce.date().nullable(),

    createdAt: z.coerce.date(),
  });

export type Notification = z.infer<
  typeof NotificationSchema
>;

////////////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////////////

export const CreateNotificationSchema =
  z.object({
    userId: z.string().uuid(),

    type: NotificationTypeSchema,

    title: z.string().min(1).max(255),

    message: z.string().min(1).max(5000),

    entityType: z.string().optional(),

    entityId: z.string().optional(),

    conversationId: z
      .string()
      .uuid()
      .optional(),

    messageId: z
      .string()
      .uuid()
      .optional(),

    senderId: z
      .string()
      .uuid()
      .optional(),
  });

export type CreateNotification =
  z.infer<
    typeof CreateNotificationSchema
  >;

////////////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////////////

export const UpdateNotificationSchema =
  z.object({
    title: z
      .string()
      .min(1)
      .max(255)
      .optional(),

    message: z
      .string()
      .min(1)
      .max(5000)
      .optional(),

    entityType: z
      .string()
      .optional(),

    entityId: z
      .string()
      .optional(),

    conversationId: z
      .string()
      .uuid()
      .nullable()
      .optional(),

    messageId: z
      .string()
      .uuid()
      .nullable()
      .optional(),

    senderId: z
      .string()
      .uuid()
      .nullable()
      .optional(),

    isRead: z
      .boolean()
      .optional(),

    readAt: z
      .coerce
      .date()
      .nullable()
      .optional(),
  });

export type UpdateNotification =
  z.infer<
    typeof UpdateNotificationSchema
  >;