import { z } from "zod";

/* =========================================================
SHIPPING RATE SCHEMAS
========================================================= */

/**
 * Helper for decimal fields coming from frontend
 * Accepts string | number and converts to number
 */
const decimalField = (fieldName: string) =>
  z.coerce
    .number({
      invalid_type_error: `${fieldName} must be a valid number`,
    })
    .nonnegative(`${fieldName} cannot be negative`);

/**
 * Create Shipping Rate Schema
 */
export const createShippingRateSchema = z
  .object({
    courierId: z
      .string()
      .uuid("Courier ID must be a valid UUID"),

    zoneId: z
      .string()
      .uuid("Zone ID must be a valid UUID"),

    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must not exceed 255 characters"),

    minWeight: z.coerce
      .number({
        invalid_type_error: "Minimum weight must be a valid number",
      })
      .min(0, "Minimum weight cannot be negative")
      .default(0),

    maxWeight: z.coerce
      .number({
        invalid_type_error: "Maximum weight must be a valid number",
      })
      .positive("Maximum weight must be greater than 0"),

    baseFee: decimalField("Base fee"),

    perKgFee: decimalField("Per KG fee"),

    volumetricDivisor: z.coerce
      .number({
        invalid_type_error: "Volumetric divisor must be a valid number",
      })
      .positive("Volumetric divisor must be greater than 0")
      .default(5000),

    fixedFee: decimalField("Fixed fee")
      .optional()
      .nullable(),

    remoteAreaSurcharge: decimalField("Remote area surcharge")
      .optional()
      .nullable(),

    insurancePercent: z.coerce
      .number({
        invalid_type_error: "Insurance percent must be a valid number",
      })
      .min(0, "Insurance percent cannot be negative")
      .default(0),

    estimatedDaysMin: z.coerce
      .number({
        invalid_type_error: "Minimum estimated days must be a valid number",
      })
      .int("Minimum estimated days must be an integer")
      .min(0, "Minimum estimated days cannot be negative"),

    estimatedDaysMax: z.coerce
      .number({
        invalid_type_error: "Maximum estimated days must be a valid number",
      })
      .int("Maximum estimated days must be an integer")
      .min(0, "Maximum estimated days cannot be negative"),

    supportsCOD: z
      .boolean()
      .optional()
      .default(false),

    isActive: z
      .boolean()
      .optional()
      .default(true),
  })
  .refine((data) => data.maxWeight >= data.minWeight, {
    message: "Maximum weight must be greater than or equal to minimum weight",
    path: ["maxWeight"],
  })
  .refine(
    (data) => data.estimatedDaysMax >= data.estimatedDaysMin,
    {
      message:
        "Maximum estimated days must be greater than or equal to minimum estimated days",
      path: ["estimatedDaysMax"],
    }
  );

/**
 * Update Shipping Rate Schema
 */
export const updateShippingRateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .max(255, "Name must not exceed 255 characters")
      .optional(),

    minWeight: z.coerce
      .number()
      .min(0, "Minimum weight cannot be negative")
      .optional(),

    maxWeight: z.coerce
      .number()
      .positive("Maximum weight must be greater than 0")
      .optional(),

    baseFee: decimalField("Base fee").optional(),

    perKgFee: decimalField("Per KG fee").optional(),

    volumetricDivisor: z.coerce
      .number()
      .positive("Volumetric divisor must be greater than 0")
      .optional(),

    fixedFee: decimalField("Fixed fee")
      .optional()
      .nullable(),

    remoteAreaSurcharge: decimalField("Remote area surcharge")
      .optional()
      .nullable(),

    insurancePercent: z.coerce
      .number()
      .min(0, "Insurance percent cannot be negative")
      .optional(),

    estimatedDaysMin: z.coerce
      .number()
      .int("Minimum estimated days must be an integer")
      .min(0)
      .optional(),

    estimatedDaysMax: z.coerce
      .number()
      .int("Maximum estimated days must be an integer")
      .min(0)
      .optional(),

    supportsCOD: z.boolean().optional(),

    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.minWeight === undefined ||
      data.maxWeight === undefined ||
      data.maxWeight >= data.minWeight,
    {
      message:
        "Maximum weight must be greater than or equal to minimum weight",
      path: ["maxWeight"],
    }
  )
  .refine(
    (data) =>
      data.estimatedDaysMin === undefined ||
      data.estimatedDaysMax === undefined ||
      data.estimatedDaysMax >= data.estimatedDaysMin,
    {
      message:
        "Maximum estimated days must be greater than or equal to minimum estimated days",
      path: ["estimatedDaysMax"],
    }
  );

/**
 * Params Schema (for :id validation)
 */
export const shippingRateIdParamSchema = z.object({
  id: z
    .string()
    .uuid("Shipping Rate ID must be a valid UUID"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateShippingRateInput = z.infer<typeof createShippingRateSchema>;

export type UpdateShippingRateInput = z.infer<typeof updateShippingRateSchema>;

export type ShippingRateIdParamInput = z.infer<typeof shippingRateIdParamSchema>;