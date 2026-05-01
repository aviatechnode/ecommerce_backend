import { z } from "zod";

/* =========================================================
CREATE CATEGORY
========================================================= */

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),

  slug: z.string().min(1, "Slug is required").trim(),

  code: z.string().min(1, "Code is required").trim(),

  type: z.string().min(1, "Type is required").trim(),

  level: z.number().int().min(0).optional(),

  description: z.string().optional(),

  imageUrl: z.string().url().optional(),

  sortOrder: z.number().int().optional(),

  isActive: z.boolean().optional(),

  parentId: z
    .string()
    .uuid("Invalid parentId")
    .nullable()
    .optional(),
});

/* =========================================================
UPDATE CATEGORY
========================================================= */

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name cannot be empty").trim().optional(),

  slug: z.string().min(1).trim().optional(),

  code: z.string().min(1).trim().optional(),

  type: z.string().min(1).trim().optional(),

  level: z.number().int().min(0).optional(),

  description: z.string().optional(),

  imageUrl: z.string().url().optional(),

  sortOrder: z.number().int().optional(),

  isActive: z.boolean().optional(),

  parentId: z
    .string()
    .uuid("Invalid parentId")
    .nullable() // allows unsetting parent
    .optional(),
});