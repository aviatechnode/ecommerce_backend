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

/* =========================================================
COURIER WEBHOOK LOG SCHEMAS
========================================================= */

/**
 * Create Courier Webhook Log Schema
 */
export const createCourierWebhookLogSchema = z.object({
  courierId: z
    .string()
    .uuid("Courier ID must be a valid UUID"),

  eventType: z
    .string()
    .min(1, "Event type is required")
    .max(255, "Event type must not exceed 255 characters"),

  payload: z.record(z.any()),

  processed: z
    .boolean()
    .optional()
    .default(false),

  error: z
    .string()
    .max(1000, "Error message must not exceed 1000 characters")
    .optional()
    .nullable(),
});

/**
 * Update Courier Webhook Log Schema
 */
export const updateCourierWebhookLogSchema = z.object({
  processed: z
    .boolean()
    .optional(),

  error: z
    .string()
    .max(1000, "Error message must not exceed 1000 characters")
    .optional()
    .nullable(),
});

/**
 * Courier Webhook Log Params Schema
 */
export const courierWebhookLogIdParamSchema = z.object({
  id: z
    .string()
    .uuid("Webhook log ID must be a valid UUID"),
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

export type UpdateCourierInput = z.infer<
  typeof updateCourierSchema
>;

export type CreateCourierWebhookLogInput = z.infer<
  typeof createCourierWebhookLogSchema
>;

export type UpdateCourierWebhookLogInput = z.infer<
  typeof updateCourierWebhookLogSchema
>;

export type CourierWebhookLogIdParamInput = z.infer<
  typeof courierWebhookLogIdParamSchema
>;

export type CourierIdParamInput = z.infer<
  typeof courierIdParamSchema
>;

export type CourierNameInput = z.infer<
  typeof courierNameSchema
>;