import { z } from "zod";

/* =========================================================
CREATE CATEGORY
========================================================= */

const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .trim(),

  parentId: z
  .string()
  .uuid("Invalid parentId")
  .nullable()
  .optional(),
});

/* =========================================================
UPDATE CATEGORY
========================================================= */

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .trim()
    .optional(),

  parentId: z
    .string()
    .uuid("Invalid parentId")
    .nullable() // allow removing parent
    .optional(),
});

export { createCategorySchema, updateCategorySchema };