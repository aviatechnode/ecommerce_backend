import { z } from "zod";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const ConversationParticipantSchema = z.object({
  id: z.string().uuid(),

  conversationId: z.string().uuid(),

  userId: z.string().uuid(),

  unreadCount: z.number().int().min(0).default(0),

  isMuted: z.boolean().default(false),

  lastReadMessageId: z.string().uuid().nullable(),

  joinedAt: z.coerce.date(),
});

export type ConversationParticipant = z.infer<
  typeof ConversationParticipantSchema
>;

////////////////////////////////////////////////////////////
// ADD PARTICIPANT
////////////////////////////////////////////////////////////

export const AddParticipantSchema = z.object({
  conversationId: z.string().uuid(),

  userId: z.string().uuid(),
});

export type AddParticipant = z.infer<
  typeof AddParticipantSchema
>;

////////////////////////////////////////////////////////////
// REMOVE PARTICIPANT
////////////////////////////////////////////////////////////

export const RemoveParticipantSchema = z.object({
  conversationId: z.string().uuid(),

  userId: z.string().uuid(),
});

export type RemoveParticipant = z.infer<
  typeof RemoveParticipantSchema
>;

////////////////////////////////////////////////////////////
// MUTE PARTICIPANT
////////////////////////////////////////////////////////////

export const MuteParticipantSchema = z.object({
  conversationId: z.string().uuid(),

  userId: z.string().uuid(),

  isMuted: z.boolean(),
});

export type MuteParticipant = z.infer<
  typeof MuteParticipantSchema
>;

////////////////////////////////////////////////////////////
// UPDATE UNREAD COUNT
////////////////////////////////////////////////////////////

export const UnreadCountSchema = z.object({
  conversationId: z.string().uuid(),

  userId: z.string().uuid(),

  unreadCount: z.number().int().min(0),
});

export type UnreadCount = z.infer<
  typeof UnreadCountSchema
>;

////////////////////////////////////////////////////////////
// MARK CONVERSATION READ
////////////////////////////////////////////////////////////

export const MarkConversationReadSchema = z.object({
  conversationId: z.string().uuid(),

  userId: z.string().uuid(),

  lastReadMessageId: z.string().uuid(),
});

export type MarkConversationRead = z.infer<
  typeof MarkConversationReadSchema
>;

////////////////////////////////////////////////////////////
// LIST PARTICIPANTS
////////////////////////////////////////////////////////////

export const ListParticipantsSchema = z.object({
  conversationId: z.string().uuid(),

  page: z.number().int().positive().default(1),

  limit: z.number().int().positive().max(100).default(50),
});

export type ListParticipants = z.infer<
  typeof ListParticipantsSchema
>;