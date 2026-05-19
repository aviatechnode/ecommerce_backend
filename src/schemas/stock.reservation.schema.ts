// src/schemas/inventory/stock-reservation.schema.ts

import { z } from "zod";
import { StockReservationStatus } from "@prisma/client";

////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////

const uuidSchema = z
  .string({
    required_error: "ID is required",
    invalid_type_error: "ID must be a string",
  })
  .uuid("Invalid UUID format");

const positiveIntSchema = z
  .number({
    invalid_type_error: "Quantity must be a number",
  })
  .int("Quantity must be an integer")
  .positive("Quantity must be greater than 0");

////////////////////////////////////////////////////////////
// CREATE STOCK RESERVATION
////////////////////////////////////////////////////////////

export const createStockReservationSchema = z.object({
  variantId: uuidSchema,

  warehouseId: uuidSchema,

  orderId: uuidSchema.optional(),

  quantity: positiveIntSchema,

  expiresAt: z.coerce.date({
    invalid_type_error: "Invalid expiration date",
  }),
});

export type CreateStockReservationDTO =
  z.infer<typeof createStockReservationSchema>;

////////////////////////////////////////////////////////////
// UPDATE STOCK RESERVATION STATUS
////////////////////////////////////////////////////////////

export const updateStockReservationStatusSchema =
  z.object({
    status: z.nativeEnum(StockReservationStatus),
  });

export type UpdateStockReservationStatusDTO =
  z.infer<typeof updateStockReservationStatusSchema>;

////////////////////////////////////////////////////////////
// STOCK RESERVATION PARAM
////////////////////////////////////////////////////////////

export const stockReservationIdParamSchema =
  z.object({
    id: uuidSchema,
  });

export type StockReservationIdParamDTO =
  z.infer<typeof stockReservationIdParamSchema>;

////////////////////////////////////////////////////////////
// RELEASE STOCK RESERVATION
////////////////////////////////////////////////////////////

export const releaseStockReservationSchema =
  z.object({
    note: z
      .string()
      .trim()
      .max(500, "Note cannot exceed 500 characters")
      .optional(),
  });

export type ReleaseStockReservationDTO =
  z.infer<typeof releaseStockReservationSchema>;