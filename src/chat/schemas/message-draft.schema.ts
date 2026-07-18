import { z } from "zod";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const MessageDraftSchema = z.object({
  id: z.string().uuid(),

  conversationId: z.string().uuid(),

  userId: z.string().uuid(),

  content: z.string().nullable(),

  updatedAt: z.coerce.date(),
});

export type MessageDraft = z.infer<
  typeof MessageDraftSchema
>;

////////////////////////////////////////////////////////////
// SAVE DRAFT
////////////////////////////////////////////////////////////

export const SaveMessageDraftSchema =
  z.object({
    conversationId: z.string().uuid(),

    content: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),
  });

export type SaveMessageDraft = z.infer<
  typeof SaveMessageDraftSchema
>;

////////////////////////////////////////////////////////////
// DELETE DRAFT
////////////////////////////////////////////////////////////

export const DeleteMessageDraftSchema =
  z.object({
    conversationId: z.string().uuid(),
  });

export type DeleteMessageDraft = z.infer<
  typeof DeleteMessageDraftSchema
>;

////////////////////////////////////////////////////////////
// GET DRAFT
////////////////////////////////////////////////////////////

export const GetMessageDraftSchema =
  z.object({
    conversationId: z.string().uuid(),
  });

export type GetMessageDraft = z.infer<
  typeof GetMessageDraftSchema
>;