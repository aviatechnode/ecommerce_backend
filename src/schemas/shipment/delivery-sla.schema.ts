import { z } from "zod";
import { ShippingMethod } from "@prisma/client";

export const createDeliverySLASchema = z.object({
  courierId: z.string().uuid(),

  zoneId: z.string().uuid(),

  shippingMethod: z.nativeEnum(ShippingMethod),

  minDays: z.number().int().nonnegative(),

  maxDays: z.number().int().nonnegative(),

  cutoffHour: z.number().int().min(0).max(23).optional(),

  sameDaySupported: z.boolean().optional(),
});

export const updateDeliverySLASchema =
  createDeliverySLASchema.partial();

export type CreateDeliverySLAInput =
  z.infer<typeof createDeliverySLASchema>;

export type UpdateDeliverySLAInput =
  z.infer<typeof updateDeliverySLASchema>;