import { z } from "zod";

import {
  AssignmentMethodSchema,
  ConversationChannelSchema,
  ConversationPrioritySchema,
  ConversationSourceSchema,
  ConversationStatusSchema,
  MessageTypeSchema,
} from "../enums/enums.js";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const ConversationSchema = z.object({
  id: z.string().uuid(),

  customerId: z.string().uuid().nullable(),

  guestSessionId: z.string().nullable(),
  guestName: z.string().nullable(),
  guestEmail: z.string().email().nullable(),
  guestPhone: z.string().nullable(),

  assignedUserId: z.string().uuid().nullable(),
  teamId: z.string().uuid().nullable(),

  assignedAt: z.coerce.date().nullable(),

  assignmentMethod: AssignmentMethodSchema,

  source: ConversationSourceSchema,

  language: z.string().default("en"),

  orderId: z.string().uuid().nullable(),

  productId: z.string().uuid().nullable(),

  vehicleId: z.string().uuid().nullable(),

  subject: z.string().nullable(),

  status: ConversationStatusSchema,

  priority: ConversationPrioritySchema,

  channel: ConversationChannelSchema,

  firstResponseAt: z.coerce.date().nullable(),

  resolvedAt: z.coerce.date().nullable(),

  closedAt: z.coerce.date().nullable(),

  customerRating: z.number().int().min(1).max(5).nullable(),

  customerFeedback: z.string().nullable(),

  lastMessageId: z.string().uuid().nullable(),

  lastMessage: z.string().nullable(),

  lastMessageAt: z.coerce.date().nullable(),

  lastMessageById: z.string().uuid().nullable(),

  lastMessageType: MessageTypeSchema.nullable(),

  createdById: z.string().uuid().nullable(),

  archivedAt: z.coerce.date().nullable(),

  deletedAt: z.coerce.date().nullable(),

  firstAssignedAt: z.coerce.date().nullable(),

  deletedById: z.string().uuid().nullable(),

  archivedById: z.string().uuid().nullable(),

  isLocked: z.boolean(),

  createdAt: z.coerce.date(),

  updatedAt: z.coerce.date(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

////////////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////////////

export const CreateConversationSchema = z.object({
  customerId: z.string().uuid().optional(),

  guestSessionId: z.string().optional(),
  guestName: z.string().trim().max(255).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().trim().max(50).optional(),

  orderId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),

  subject: z.string().trim().max(500).optional(),

  language: z.string().default("en"),

  source: ConversationSourceSchema.default("WEBSITE"),

  channel: ConversationChannelSchema.default("WEB"),
});

export type CreateConversation = z.infer<
  typeof CreateConversationSchema
>;

////////////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////////////

export const UpdateConversationDetailsSchema = z.object({
  subject: z.string().trim().max(500).optional(),

  language: z.string().trim().optional(),

  guestName: z.string().trim().max(255).optional(),

  guestPhone: z.string().trim().max(50).optional(),

  orderId: z.string().uuid().nullable().optional(),

  productId: z.string().uuid().nullable().optional(),

  vehicleId: z.string().uuid().nullable().optional(),
});

export type UpdateConversationDetails = z.infer<
  typeof UpdateConversationDetailsSchema
>;

////////////////////////////////////////////////////////////
// ASSIGN
////////////////////////////////////////////////////////////

export const AssignConversationSchema = z.object({
  conversationId: z.string().uuid(),

  assignedUserId: z.string().uuid().optional(),

  teamId: z.string().uuid().optional(),

  assignmentMethod:
    AssignmentMethodSchema.default("MANUAL"),
}).superRefine((data, ctx) => {
  if (!data.assignedUserId && !data.teamId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["assignedUserId"],
      message:
        "Either assignedUserId or teamId must be provided.",
    });
  }
});

export type AssignConversation = z.infer<
  typeof AssignConversationSchema
>;

////////////////////////////////////////////////////////////
// STATUS
////////////////////////////////////////////////////////////

export const UpdateConversationStatusSchema = z.object({
  conversationId: z.string().uuid(),

  status: ConversationStatusSchema,
});

export type UpdateConversationStatus = z.infer<
  typeof UpdateConversationStatusSchema
>;

////////////////////////////////////////////////////////////
// PRIORITY
////////////////////////////////////////////////////////////

export const UpdateConversationPrioritySchema =
  z.object({
    conversationId: z.string().uuid(),

    priority: ConversationPrioritySchema,
  });

export type UpdateConversationPriority = z.infer<
  typeof UpdateConversationPrioritySchema
>;

////////////////////////////////////////////////////////////
// RATE
////////////////////////////////////////////////////////////

export const RateConversationSchema = z.object({
  conversationId: z.string().uuid(),

  customerRating: z.number().int().min(1).max(5),

  customerFeedback: z
    .string()
    .trim()
    .max(1000)
    .optional(),
  });

export type RateConversation = z.infer<
  typeof RateConversationSchema
>;

////////////////////////////////////////////////////////////
// ARCHIVE
////////////////////////////////////////////////////////////

export const ArchiveConversationSchema = z.object({
  conversationId: z.string().uuid(),

  archived: z.boolean(),
});

export type ArchiveConversation = z.infer<
  typeof ArchiveConversationSchema
>;

////////////////////////////////////////////////////////////
// DELETE
////////////////////////////////////////////////////////////

export const DeleteConversationSchema = z.object({
  conversationId: z.string().uuid(),
  hardDelete: z.boolean().default(false),
});

export type DeleteConversation = z.infer<
  typeof DeleteConversationSchema
>;

////////////////////////////////////////////////////////////
// FILTERS
////////////////////////////////////////////////////////////

export const ConversationFiltersSchema = z.object({
  customerId: z.string().uuid().optional(),

  assignedUserId: z.string().uuid().optional(),

  teamId: z.string().uuid().optional(),

  createdById: z.string().uuid().optional(),

  status: ConversationStatusSchema.optional(),

  priority: ConversationPrioritySchema.optional(),

  channel: ConversationChannelSchema.optional(),

  source: ConversationSourceSchema.optional(),

  language: z.string().optional(),

  customerRating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),

  isLocked: z.coerce
    .boolean()
    .optional(),

  archived: z.coerce
    .boolean()
    .optional(),

  search: z.string().trim().optional(),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});
export type ConversationFilters = z.infer<
  typeof ConversationFiltersSchema
>;

////////////////////////////////////////////////////////////
// CLOSE
////////////////////////////////////////////////////////////

export const CloseConversationSchema = z.object({
  conversationId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional(),
});

export type CloseConversation = z.infer<
  typeof CloseConversationSchema
>;

////////////////////////////////////////////////////////////
// RESOLVE
////////////////////////////////////////////////////////////

export const ResolveConversationSchema = z.object({
  conversationId: z.string().uuid(),
  resolution: z.string().trim().max(2000).optional(),
});

export type ResolveConversation = z.infer<
  typeof ResolveConversationSchema
>;

////////////////////////////////////////////////////////////
// SEARCH
////////////////////////////////////////////////////////////

export const SearchConversationSchema = z.object({
  search: z.string().trim().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SearchConversation = z.infer<
  typeof SearchConversationSchema
>;

////////////////////////////////////////////////////////////
// LIST
////////////////////////////////////////////////////////////

export const ListConversationSchema =
  ConversationFiltersSchema.extend({
    sortBy: z
      .enum([
        "createdAt",
        "updatedAt",
        "lastMessageAt",
        "priority",
        "status",
        "assignedAt",
      ])
      .default("lastMessageAt"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  });

export type ListConversation = z.infer<
  typeof ListConversationSchema
>;

////////////////////////////////////////////////////////////
// LOCK
////////////////////////////////////////////////////////////

export const LockConversationSchema = z.object({
  conversationId: z.string().uuid(),

  locked: z.boolean(),
});

export type LockConversation = z.infer<
  typeof LockConversationSchema
>;

////////////////////////////////////////////////////////////
// REOPEN
////////////////////////////////////////////////////////////

export const ReopenConversationSchema = z.object({
  conversationId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional(),
});

export type ReopenConversation = z.infer<
  typeof ReopenConversationSchema
>;

////////////////////////////////////////////////////////////
// TRANSFER
////////////////////////////////////////////////////////////

export const TransferConversationSchema = z.object({
  conversationId: z.string().uuid(),

  assignedUserId: z.string().uuid().optional(),

  teamId: z.string().uuid().optional(),

  assignmentMethod:
    AssignmentMethodSchema.default("MANUAL"),
});

export type TransferConversation = z.infer<
  typeof TransferConversationSchema
>;

////////////////////////////////////////////////////////////
// MERGE
////////////////////////////////////////////////////////////

export const MergeConversationSchema = z.object({
  sourceConversationId: z.string().uuid(),

  targetConversationId: z.string().uuid(),
}).superRefine((data, ctx) => {
  if (
    data.sourceConversationId ===
    data.targetConversationId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetConversationId"],
      message:
        "Source and target conversations must be different.",
    });
  }
});

export type MergeConversation = z.infer<
  typeof MergeConversationSchema
>;

////////////////////////////////////////////////////////////
// RESTORE
////////////////////////////////////////////////////////////

export const RestoreConversationSchema = z.object({
  conversationId: z.string().uuid(),
  reason: z.string().trim().max(1000).optional(),
});

export type RestoreConversation = z.infer<
  typeof RestoreConversationSchema
>;