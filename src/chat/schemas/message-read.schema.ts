import { z } from "zod";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const MessageReadSchema = z.object({
  id: z.string().uuid(),

  messageId: z.string().uuid(),

  userId: z.string().uuid(),

  readAt: z.coerce.date(),
});

export type MessageRead = z.infer<
  typeof MessageReadSchema
>;

////////////////////////////////////////////////////////////
// MARK MESSAGE READ
////////////////////////////////////////////////////////////

export const MarkMessageReadSchema = z.object({
  messageId: z.string().uuid(),

  userId: z.string().uuid(),
});

export type MarkMessageRead = z.infer<
  typeof MarkMessageReadSchema
>;

////////////////////////////////////////////////////////////
// LIST MESSAGE READS
////////////////////////////////////////////////////////////

export const ListMessageReadsSchema = z.object({
  messageId: z.string().uuid(),

  page: z.number().int().positive().default(1),

  limit: z.number().int().positive().max(100).default(50),
});

export type ListMessageReads = z.infer<
  typeof ListMessageReadsSchema
>;