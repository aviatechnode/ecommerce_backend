import { z } from "zod";

//////////////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////////////

export const NotificationTypeSchema = z.enum([
  "ORDER_UPDATE",
  "PAYMENT_UPDATE",
  "SHIPPING_UPDATE",
  "PROMOTION",
  "SYSTEM",

  "CHAT_MESSAGE",
  "CHAT_MENTION",
  "CHAT_ASSIGNED",
  "CHAT_UNASSIGNED",
  "CHAT_STATUS_CHANGED",
]);

//////////////////////////////////////////////////////////
// COMMON
//////////////////////////////////////////////////////////

const IdSchema = z.string().uuid();

const DateSchema = z.coerce.date();

//////////////////////////////////////////////////////////
// NOTIFICATION
//////////////////////////////////////////////////////////

export const NotificationSchema = z.object({
  id: IdSchema,

  userId: IdSchema,

  type: NotificationTypeSchema,

  title: z
    .string()
    .trim()
    .min(1)
    .max(255),

  message: z
    .string()
    .trim()
    .min(1)
    .max(5000),

  isRead: z.boolean(),

  entityType: z
    .string()
    .trim()
    .max(100)
    .nullish(),

  entityId: IdSchema.nullish(),

  //////////////////////////////////////////////////////
  // CHAT SUPPORT
  //////////////////////////////////////////////////////

  conversationId: IdSchema.nullish(),

  messageId: IdSchema.nullish(),

  senderId: IdSchema.nullish(),

  //////////////////////////////////////////////////////
  // TIMESTAMPS
  //////////////////////////////////////////////////////

  createdAt: DateSchema,
});

//////////////////////////////////////////////////////////
// CREATE
//////////////////////////////////////////////////////////

export const CreateNotificationSchema =
  NotificationSchema.omit({
    id: true,
    isRead: true,
    createdAt: true,
  });

//////////////////////////////////////////////////////////
// UPDATE
//////////////////////////////////////////////////////////

export const UpdateNotificationSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional(),

    message: z
      .string()
      .trim()
      .min(1)
      .max(5000)
      .optional(),

    isRead: z
      .boolean()
      .optional(),
  });

//////////////////////////////////////////////////////////
// READ STATUS
//////////////////////////////////////////////////////////

export const MarkNotificationReadSchema =
  z.object({
    notificationId: IdSchema,
  });

export const MarkNotificationsReadSchema =
  z.object({
    notificationIds: z.array(
      IdSchema,
    ),
  });

export const MarkAllNotificationsReadSchema =
  z.object({
    userId: IdSchema,
  });

//////////////////////////////////////////////////////////
// DELETE
//////////////////////////////////////////////////////////

export const DeleteNotificationSchema =
  z.object({
    notificationId: IdSchema,
  });

//////////////////////////////////////////////////////////
// FILTERS
//////////////////////////////////////////////////////////

export const NotificationFilterSchema =
  z.object({
    userId: IdSchema.optional(),

    type:
      NotificationTypeSchema.optional(),

    isRead:
      z.boolean().optional(),

    conversationId:
      IdSchema.optional(),

    senderId:
      IdSchema.optional(),

    page:
      z.number()
        .int()
        .min(1)
        .default(1),

    limit:
      z.number()
        .int()
        .min(1)
        .max(100)
        .default(20),
  });

//////////////////////////////////////////////////////////
// CHAT NOTIFICATIONS
//////////////////////////////////////////////////////////

export const ChatMessageNotificationSchema =
  z.object({
    userId: IdSchema,

    senderId: IdSchema,

    conversationId: IdSchema,

    messageId: IdSchema,

    title: z
      .string()
      .trim()
      .min(1)
      .max(255),

    message: z
      .string()
      .trim()
      .min(1)
      .max(5000),
  });

export const ChatAssignedNotificationSchema =
  z.object({
    userId: IdSchema,

    conversationId: IdSchema,
  });

export const ChatStatusChangedNotificationSchema =
  z.object({
    userId: IdSchema,

    conversationId: IdSchema,

    status: z.string(),
  });

//////////////////////////////////////////////////////////
// COUNTS
//////////////////////////////////////////////////////////

export const NotificationCountSchema =
  z.object({
    total: z.number().int(),

    unread: z.number().int(),
  });

//////////////////////////////////////////////////////////
// EXPORTS
//////////////////////////////////////////////////////////

export const NotificationTypes =
  NotificationTypeSchema.options;

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

export type NotificationType =
  z.infer<
    typeof NotificationTypeSchema
  >;

export type Notification =
  z.infer<
    typeof NotificationSchema
  >;

export type CreateNotificationDto =
  z.infer<
    typeof CreateNotificationSchema
  >;

export type UpdateNotificationDto =
  z.infer<
    typeof UpdateNotificationSchema
  >;

export type MarkNotificationReadDto =
  z.infer<
    typeof MarkNotificationReadSchema
  >;

export type MarkNotificationsReadDto =
  z.infer<
    typeof MarkNotificationsReadSchema
  >;

export type MarkAllNotificationsReadDto =
  z.infer<
    typeof MarkAllNotificationsReadSchema
  >;

export type DeleteNotificationDto =
  z.infer<
    typeof DeleteNotificationSchema
  >;

export type NotificationFilterDto =
  z.infer<
    typeof NotificationFilterSchema
  >;

export type ChatMessageNotificationDto =
  z.infer<
    typeof ChatMessageNotificationSchema
  >;

export type ChatAssignedNotificationDto =
  z.infer<
    typeof ChatAssignedNotificationSchema
  >;

export type ChatStatusChangedNotificationDto =
  z.infer<
    typeof ChatStatusChangedNotificationSchema
  >;

export type NotificationCount =
  z.infer<
    typeof NotificationCountSchema
  >;