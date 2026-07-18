import { z } from "zod";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const ConversationSLASchema = z.object({
  id: z.string().uuid(),

  conversationId: z.string().uuid(),

  firstResponseDueAt: z.coerce.date().nullable(),

  resolutionDueAt: z.coerce.date().nullable(),

  firstRespondedAt: z.coerce.date().nullable(),

  resolvedAt: z.coerce.date().nullable(),

  breachedFirstResponse: z.boolean().default(false),

  breachedResolution: z.boolean().default(false),

  createdAt: z.coerce.date(),

  updatedAt: z.coerce.date(),
});

export type ConversationSLA = z.infer<
  typeof ConversationSLASchema
>;

////////////////////////////////////////////////////////////
// UPDATE SLA
////////////////////////////////////////////////////////////

export const UpdateSLASchema = z.object({
  conversationId: z.string().uuid(),

  firstResponseDueAt: z.coerce.date().optional(),

  resolutionDueAt: z.coerce.date().optional(),

  firstRespondedAt: z.coerce.date().optional(),

  resolvedAt: z.coerce.date().optional(),

  breachedFirstResponse: z.boolean().optional(),

  breachedResolution: z.boolean().optional(),
});

export type UpdateSLA = z.infer<typeof UpdateSLASchema>;