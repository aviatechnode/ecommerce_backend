import { z } from "zod";

/* =========================================================
SHIPPING ZONE LGA SCHEMAS
========================================================= */

/**
 * Create Shipping Zone LGA Schema
 */
export const createShippingZoneLGASchema = z.object({
  zoneId: z.string().uuid("Zone ID must be a valid UUID"),

  lgaId: z.string().uuid("LGA ID must be a valid UUID"),
});

/**
 * Update Shipping Zone LGA Schema
 * At least one field must be provided
 */
export const updateShippingZoneLGASchema = z
  .object({
    zoneId: z.string().uuid("Zone ID must be a valid UUID").optional(),

    lgaId: z.string().uuid("LGA ID must be a valid UUID").optional(),
  })
  .refine((data) => data.zoneId || data.lgaId, {
    message: "At least one field (zoneId or lgaId) must be provided",
  });

/**
 * Params Schema
 */
export const shippingZoneLGAIdParamSchema = z.object({
  id: z.string().uuid("Shipping Zone LGA ID must be a valid UUID"),
});

/**
 * Composite Unique Check Schema
 */
export const shippingZoneLGAUniqueSchema = z.object({
  zoneId: z.string().uuid("Zone ID must be a valid UUID"),

  lgaId: z.string().uuid("LGA ID must be a valid UUID"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateShippingZoneLGAInput = z.infer<
  typeof createShippingZoneLGASchema
>;

export type UpdateShippingZoneLGAInput = z.infer<
  typeof updateShippingZoneLGASchema
>;

export type ShippingZoneLGAIdParamInput = z.infer<
  typeof shippingZoneLGAIdParamSchema
>;

export type ShippingZoneLGAUniqueInput = z.infer<
  typeof shippingZoneLGAUniqueSchema
>;