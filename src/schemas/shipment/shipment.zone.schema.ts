import { z } from "zod";

/* =========================================================
SHIPPING ZONE SCHEMAS
========================================================= */

/**
 * Create Shipping Zone Schema
 */
export const createShippingZoneSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),

  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must not exceed 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric (A-Z, 0-9, _, -)"),

  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable(),

  isActive: z.boolean().optional().default(true),
});

/**
 * Update Shipping Zone Schema
 * At least one field must be provided
 */
export const updateShippingZoneSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").max(255).optional(),

    code: z
      .string()
      .max(50)
      .regex(/^[A-Z0-9_-]+$/i, "Invalid zone code format")
      .optional(),

    description: z.string().max(1000).optional().nullable(),

    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.code !== undefined ||
      data.description !== undefined ||
      data.isActive !== undefined,
    {
      message: "At least one field must be provided for update",
    }
  );

/**
 * Params Schema
 */
export const shippingZoneIdParamSchema = z.object({
  id: z.string().uuid("Shipping Zone ID must be a valid UUID"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateShippingZoneInput = z.infer<
  typeof createShippingZoneSchema
>;
export type UpdateShippingZoneInput = z.infer<
  typeof updateShippingZoneSchema
>;
export type ShippingZoneIdParamInput = z.infer<
  typeof shippingZoneIdParamSchema
>;