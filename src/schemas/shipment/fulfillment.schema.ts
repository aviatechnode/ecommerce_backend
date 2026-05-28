import { z } from "zod";
import { FulfillmentStatus } from "@prisma/client";

export const fulfillmentItemSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createFulfillmentSchema = z.object({
  orderId: z.string().uuid(),

  warehouseId: z.string().uuid(),

  status: z.nativeEnum(FulfillmentStatus),

  pickingStartedAt: z.coerce.date().optional(),

  packedAt: z.coerce.date().optional(),

  dispatchedAt: z.coerce.date().optional(),

  notes: z.string().optional(),

  items: z.array(fulfillmentItemSchema).optional(),
});

export const updateFulfillmentSchema =
  createFulfillmentSchema.partial();

export type CreateFulfillmentInput =
  z.infer<typeof createFulfillmentSchema>;

export type UpdateFulfillmentInput =
  z.infer<typeof updateFulfillmentSchema>;