import { z } from "zod";

/* =========================================================
SHIPPING ZONE STATE SCHEMAS
========================================================= */

/**
 * Create Shipping Zone State Schema
 */
export const createShippingZoneStateSchema = z.object({
  zoneId: z.string().uuid("Zone ID must be a valid UUID"),

  stateId: z.string().uuid("State ID must be a valid UUID"),
});

/**
 * Update Shipping Zone State Schema
 * At least one field must be provided
 */
export const updateShippingZoneStateSchema = z
  .object({
    zoneId: z.string().uuid("Zone ID must be a valid UUID").optional(),

    stateId: z.string().uuid("State ID must be a valid UUID").optional(),
  })
  .refine((data) => data.zoneId || data.stateId, {
    message: "At least one field (zoneId or stateId) must be provided",
  });

/**
 * Params Schema (for :id validation)
 */
export const shippingZoneStateIdParamSchema = z.object({
  id: z.string().uuid("Shipping Zone State ID must be a valid UUID"),
});

/**
 * Composite Unique Validation Schema
 */
export const shippingZoneStateUniqueSchema = z.object({
  zoneId: z.string().uuid("Zone ID must be a valid UUID"),

  stateId: z.string().uuid("State ID must be a valid UUID"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateShippingZoneStateInput = z.infer<
  typeof createShippingZoneStateSchema
>;
export type UpdateShippingZoneStateInput = z.infer<
  typeof updateShippingZoneStateSchema
>;
export type ShippingZoneStateIdParamInput = z.infer<
  typeof shippingZoneStateIdParamSchema
>;
export type ShippingZoneStateUniqueInput = z.infer<
  typeof shippingZoneStateUniqueSchema
>;