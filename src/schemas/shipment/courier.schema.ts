import { z } from "zod";

/* =========================================================
COURIER SCHEMAS
========================================================= */

/**
 * Create Courier Schema
 */
export const createCourierSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),

  phone: z
    .string()
    .max(30, "Phone number must not exceed 30 characters")
    .optional()
    .nullable(),

  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .optional()
    .nullable(),

  website: z
    .string()
    .url("Invalid website URL")
    .max(255, "Website must not exceed 255 characters")
    .optional()
    .nullable(),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

/**
 * Update Courier Schema
 */
export const updateCourierSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(255, "Name must not exceed 255 characters")
    .optional(),

  phone: z
    .string()
    .max(30, "Phone number must not exceed 30 characters")
    .optional()
    .nullable(),

  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .optional()
    .nullable(),

  website: z
    .string()
    .url("Invalid website URL")
    .max(255, "Website must not exceed 255 characters")
    .optional()
    .nullable(),

  isActive: z
    .boolean()
    .optional(),
});

/**
 * Params Schema (for :id validation)
 */
export const courierIdParamSchema = z.object({
  id: z
    .string()
    .uuid("Courier ID must be a valid UUID"),
});

/**
 * Name uniqueness check schema (optional use)
 */
export const courierNameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateCourierInput = z.infer<
  typeof createCourierSchema
>;

export type UpdateCourierInput = z.infer<typeof updateCourierSchema>;

export type CourierIdParamInput = z.infer<typeof courierIdParamSchema>;

export type CourierNameInput = z.infer<typeof courierNameSchema>;