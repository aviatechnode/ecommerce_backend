import { z } from "zod";

import {
  ShipmentEventSource,
  ShipmentStatus,
} from "@prisma/client";

/* =========================================================
SHIPMENT EVENT SCHEMAS
========================================================= */

/**
 * Create Shipment Event Schema
 */
export const createShipmentEventSchema = z.object({
  shipmentId: z
    .string()
    .uuid("Shipment ID must be a valid UUID"),

  status: z.nativeEnum(ShipmentStatus, {
    errorMap: () => ({
      message: "Invalid shipment status",
    }),
  }),

  source: z
    .nativeEnum(ShipmentEventSource, {
      errorMap: () => ({
        message: "Invalid shipment event source",
      }),
    })
    .optional(),

  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),

  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable(),

  location: z
    .string()
    .max(255, "Location must not exceed 255 characters")
    .optional()
    .nullable(),

  metadata: z
    .record(z.any())
    .optional(),
});

/**
 * Update Shipment Event Schema
 */
export const updateShipmentEventSchema = z.object({
  status: z
    .nativeEnum(ShipmentStatus, {
      errorMap: () => ({
        message: "Invalid shipment status",
      }),
    })
    .optional(),

  source: z
    .nativeEnum(ShipmentEventSource, {
      errorMap: () => ({
        message: "Invalid shipment event source",
      }),
    })
    .optional(),

  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(255, "Title must not exceed 255 characters")
    .optional(),

  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional()
    .nullable(),

  location: z
    .string()
    .max(255, "Location must not exceed 255 characters")
    .optional()
    .nullable(),

  metadata: z
    .record(z.any())
    .optional(),
});

/**
 * Params Schema (for :id validation)
 */
export const shipmentEventIdParamSchema = z.object({
  id: z
    .string()
    .uuid("Shipment Event ID must be a valid UUID"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateShipmentEventInput =
  z.infer<typeof createShipmentEventSchema>;

export type UpdateShipmentEventInput =
  z.infer<typeof updateShipmentEventSchema>;

export type ShipmentEventIdParamInput =
  z.infer<typeof shipmentEventIdParamSchema>;