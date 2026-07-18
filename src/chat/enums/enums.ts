import { z } from "zod";

import { ChatEvents } from "../chat-event/conversation-chat-event.js";
import { SupportTeamEvents } from "../chat-event/support-chat-event.js";

////////////////////////////////////////////////////////////
// Conversation
////////////////////////////////////////////////////////////

export const ConversationStatusSchema = z.enum([
  "NEW",
  "OPEN",
  "PENDING",
  "WAITING_FOR_CUSTOMER",
  "WAITING_FOR_SUPPORT",
  "RESOLVED",
  "CLOSED",
]);

export type ConversationStatus = z.infer<
  typeof ConversationStatusSchema
>;

export const ConversationPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

export type ConversationPriority = z.infer<
  typeof ConversationPrioritySchema
>;

export const ConversationChannelSchema = z.enum([
  "WEB",
  "MOBILE",
  "EMAIL",
  "WHATSAPP",
  "PHONE",
]);

export type ConversationChannel = z.infer<
  typeof ConversationChannelSchema
>;

export const ConversationSourceSchema = z.enum([
  "WEBSITE",
  "MOBILE_APP",
  "PRODUCT_PAGE",
  "CATEGORY_PAGE",
  "CHECKOUT",
  "ORDER",
  "FITMENT",
  "ADMIN",
  "API",
  "WHATSAPP",
  "EMAIL",
]);

export type ConversationSource = z.infer<
  typeof ConversationSourceSchema
>;

////////////////////////////////////////////////////////////
// Assignment
////////////////////////////////////////////////////////////

export const AssignmentMethodSchema = z.enum([
  "AUTOMATIC",
  "MANUAL",
  "AI",
]);

export type AssignmentMethod = z.infer<
  typeof AssignmentMethodSchema
>;

////////////////////////////////////////////////////////////
// Messages
////////////////////////////////////////////////////////////

export const MessageTypeSchema = z.enum([
  "TEXT",
  "IMAGE",
  "FILE",
  "AUDIO",
  "VIDEO",
  "SYSTEM",
]);

export type MessageType = z.infer<
  typeof MessageTypeSchema
>;

export const MessageSenderTypeSchema = z.enum([
  "CUSTOMER",
  "GUEST",
  "AGENT",
  "SYSTEM",
  "AI",
]);

export type MessageSenderType = z.infer<
  typeof MessageSenderTypeSchema
>;

export const MessageDeliveryStatusSchema = z.enum([
  "SENT",
  "DELIVERED",
  "READ",
  "FAILED",
]);

export type MessageDeliveryStatus = z.infer<
  typeof MessageDeliveryStatusSchema
>;

////////////////////////////////////////////////////////////
// Conversation Events
////////////////////////////////////////////////////////////

export const ConversationEventTypeSchema =
  z.nativeEnum(ChatEvents);

export type ConversationEventType = z.infer<
  typeof ConversationEventTypeSchema
>;

////////////////////////////////////////////////////////////
// Support Team Events
////////////////////////////////////////////////////////////

export const SupportTeamEventTypeSchema =
  z.nativeEnum(SupportTeamEvents);

export type SupportTeamEventType = z.infer<
  typeof SupportTeamEventTypeSchema
>;

////////////////////////////////////////////////////////////
// Notifications
////////////////////////////////////////////////////////////

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

export type NotificationType = z.infer<
  typeof NotificationTypeSchema
>;

////////////////////////////////////////////////////////////
// Outbox
////////////////////////////////////////////////////////////

export const EventOutboxStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
]);

export type EventOutboxStatus = z.infer<
  typeof EventOutboxStatusSchema
>;

////////////////////////////////////////////////////////////
// Presence
////////////////////////////////////////////////////////////

export const PresenceStatusSchema = z.enum([
  "ONLINE",
  "AWAY",
  "OFFLINE",
]);

export type PresenceStatus = z.infer<
  typeof PresenceStatusSchema
>;