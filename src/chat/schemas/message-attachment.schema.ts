import { z } from "zod";

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const MessageAttachmentSchema = z.object({
  id: z.string().uuid(),

  messageId: z.string().uuid(),

  url: z.string().url(),

  filename: z.string().min(1).max(255),

  mimeType: z.string().min(1).max(255),

  extension: z.string().max(20).nullable(),

  size: z.number().int().nonnegative(),

  storageKey: z.string().min(1),

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

  filename: z.string().trim().min(1).max(255),

  mimeType: z.string().trim().min(1).max(255),

  extension: z.string().trim().max(20).optional(),

  size: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024), // 50 MB

  storageKey: z.string().trim().min(1),
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

////////////////////////////////////////////////////////////
// SEARCH ATTACHMENTS
////////////////////////////////////////////////////////////

export const SearchAttachmentsSchema = z.object({
  messageId: z.string().uuid().optional(),

  uploadedById: z.string().uuid().optional(),

  mimeType: z.string().trim().optional(),

  extension: z.string().trim().optional(),

  filename: z.string().trim().optional(),

  page: z.number().int().positive().default(1),

  limit: z.number().int().positive().max(100).default(20),
});

export type SearchAttachments = z.infer<
  typeof SearchAttachmentsSchema
>;