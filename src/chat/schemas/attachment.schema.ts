import { z } from "zod";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const MessageAttachmentSchema = z.object({
  id: z.string().uuid(),

  messageId: z.string().uuid(),

  url: z.string().url(),

  storageKey: z.string().min(1),

  filename: z.string().min(1).max(255),

  mimeType: z.string().min(1).max(255),

  extension: z.string().max(20).nullable(),

  size: z.number().int().nonnegative(),

  uploadedById: z.string().uuid().nullable(),

  createdAt: z.coerce.date(),
});

export type MessageAttachment = z.infer<
  typeof MessageAttachmentSchema
>;

////////////////////////////////////////////////////////////
// UPLOAD ATTACHMENT
////////////////////////////////////////////////////////////

export const UploadAttachmentSchema = z.object({
  messageId: z.string().uuid(),

  url: z.string().url(),

  storageKey: z.string().min(1),

  filename: z.string().min(1).max(255),

  mimeType: z.string().min(1).max(255),

  extension: z.string().max(20).optional(),

  size: z.number().int().positive(),

  uploadedById: z.string().uuid().optional(),
});

export type UploadAttachment = z.infer<
  typeof UploadAttachmentSchema
>;

////////////////////////////////////////////////////////////
// DELETE ATTACHMENT
////////////////////////////////////////////////////////////

export const DeleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid(),
});

export type DeleteAttachment = z.infer<
  typeof DeleteAttachmentSchema
>;

////////////////////////////////////////////////////////////
// LIST ATTACHMENTS
////////////////////////////////////////////////////////////

export const ListAttachmentsSchema = z.object({
  messageId: z.string().uuid(),

  page: z.number().int().positive().default(1),

  limit: z.number().int().positive().max(100).default(20),
});

export type ListAttachments = z.infer<
  typeof ListAttachmentsSchema
>;