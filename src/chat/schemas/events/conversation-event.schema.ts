import { z } from "zod";

import {
  ConversationEventTypeSchema,
} from "../../enums/enums.js";

////////////////////////////////////////////////////////////
// JSON
////////////////////////////////////////////////////////////

const JsonValueSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const ConversationEventSchema = z.object({
  id: z.string().uuid(),

  conversationId: z.string().uuid(),

  actorId: z.string().uuid().nullable(),

  type: ConversationEventTypeSchema,

  description: z.string().nullable(),

  oldValue: JsonValueSchema.nullable(),

  newValue: JsonValueSchema.nullable(),

  metadata: JsonValueSchema.nullable(),

  createdAt: z.coerce.date(),
});

export type ConversationEvent = z.infer<
  typeof ConversationEventSchema
>;

////////////////////////////////////////////////////////////
// CREATE EVENT
////////////////////////////////////////////////////////////

export const CreateConversationEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    type: ConversationEventTypeSchema,

    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    oldValue: JsonValueSchema.optional(),

    newValue: JsonValueSchema.optional(),

    metadata: JsonValueSchema.optional(),
  });

export type CreateConversationEvent =
  z.infer<
    typeof CreateConversationEventSchema
  >;

////////////////////////////////////////////////////////////
// LIST EVENTS
////////////////////////////////////////////////////////////

export const ListConversationEventsSchema =
  z.object({
    conversationId: z.string().uuid(),

    type:
      ConversationEventTypeSchema.optional(),

    page: z
      .number()
      .int()
      .positive()
      .default(1),

    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(50),
  });

export type ListConversationEvents =
  z.infer<
    typeof ListConversationEventsSchema
  >;

////////////////////////////////////////////////////////////
// RECORD ASSIGNMENT
////////////////////////////////////////////////////////////

export const RecordAssignmentEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    oldAssigneeId: z
      .string()
      .uuid()
      .nullable(),

    newAssigneeId: z
      .string()
      .uuid()
      .nullable(),
  });

export type RecordAssignmentEvent =
  z.infer<
    typeof RecordAssignmentEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD STATUS CHANGE
////////////////////////////////////////////////////////////

export const RecordStatusChangeEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    oldStatus:
      ConversationEventTypeSchema.or(
        z.string(),
      ),

    newStatus:
      ConversationEventTypeSchema.or(
        z.string(),
      ),
  });

export type RecordStatusChangeEvent =
  z.infer<
    typeof RecordStatusChangeEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD PRIORITY CHANGE
////////////////////////////////////////////////////////////

export const RecordPriorityChangeEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    oldPriority: z.string(),

    newPriority: z.string(),
  });

export type RecordPriorityChangeEvent =
  z.infer<
    typeof RecordPriorityChangeEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD TAG ADDED
////////////////////////////////////////////////////////////

export const RecordTagAddedEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    tagId: z.string().uuid(),
  });

export type RecordTagAddedEvent =
  z.infer<
    typeof RecordTagAddedEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD TAG REMOVED
////////////////////////////////////////////////////////////

export const RecordTagRemovedEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    tagId: z.string().uuid(),
  });

export type RecordTagRemovedEvent =
  z.infer<
    typeof RecordTagRemovedEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD MESSAGE SENT
////////////////////////////////////////////////////////////

export const RecordMessageSentEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    messageId: z.string().uuid(),
  });

export type RecordMessageSentEvent =
  z.infer<
    typeof RecordMessageSentEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD CONVERSATION CLOSED
////////////////////////////////////////////////////////////

export const RecordConversationClosedEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    reason: z
      .string()
      .trim()
      .max(1000)
      .optional(),
  });

export type RecordConversationClosedEvent =
  z.infer<
    typeof RecordConversationClosedEventSchema
  >;

////////////////////////////////////////////////////////////
// RECORD CONVERSATION RESOLVED
////////////////////////////////////////////////////////////

export const RecordConversationResolvedEventSchema =
  z.object({
    conversationId: z.string().uuid(),

    resolution: z
      .string()
      .trim()
      .max(2000)
      .optional(),
  });

export type RecordConversationResolvedEvent =
  z.infer<
    typeof RecordConversationResolvedEventSchema
  >;