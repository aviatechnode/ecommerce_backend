import { z } from "zod";

////////////////////////////////////////////////////////////
// SHARED
////////////////////////////////////////////////////////////

const ColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i)
  .nullable();

////////////////////////////////////////////////////////////
// TAG
////////////////////////////////////////////////////////////

export const ConversationTagSchema = z.object({
  id: z.string().uuid(),

  name: z
    .string()
    .trim()
    .min(1)
    .max(50),

  color: ColorSchema,
  isSystem: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export type ConversationTag = z.infer<
  typeof ConversationTagSchema
>;

////////////////////////////////////////////////////////////
// CREATE TAG
////////////////////////////////////////////////////////////

export const CreateTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(50),

  color: ColorSchema.optional(),
});

export type CreateTag = z.infer<
  typeof CreateTagSchema
>;

////////////////////////////////////////////////////////////
// UPDATE TAG
////////////////////////////////////////////////////////////

export const UpdateTagSchema = z.object({
  tagId: z.string().uuid(),

  name: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  color: ColorSchema.optional(),
});

export type UpdateTag = z.infer<
  typeof UpdateTagSchema
>;

////////////////////////////////////////////////////////////
// CONVERSATION TAG PIVOT
////////////////////////////////////////////////////////////

export const ConversationTagPivotSchema =
  z.object({
    id: z.string().uuid(),

    conversationId: z.string().uuid(),

    tagId: z.string().uuid(),
  });

export type ConversationTagPivot = z.infer<
  typeof ConversationTagPivotSchema
>;

////////////////////////////////////////////////////////////
// ASSIGN TAG
////////////////////////////////////////////////////////////

export const AssignTagSchema = z.object({
  conversationId: z.string().uuid(),

  tagId: z.string().uuid(),
});

export type AssignTag = z.infer<
  typeof AssignTagSchema
>;

////////////////////////////////////////////////////////////
// REMOVE TAG
////////////////////////////////////////////////////////////

export const RemoveTagSchema = z.object({
  conversationId: z.string().uuid(),

  tagId: z.string().uuid(),
});

export type RemoveTag = z.infer<
  typeof RemoveTagSchema
>;