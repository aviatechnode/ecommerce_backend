import { z } from "zod";
import { ShippingMethod } from "@prisma/client";

const decimalString = z.union([
  z.string(),
  z.number(),
]);

export const createShippingQuoteSchema = z.object({
  checkoutSessionId: z.string().uuid(),

  courierName: z.string().min(1),

  shippingMethod: z.nativeEnum(ShippingMethod),

  zoneName: z.string().min(1),

  weight: z.number().nonnegative(),

  volumetricWeight: z.number().nonnegative(),

  chargeableWeight: z.number().nonnegative(),

  baseFee: decimalString,

  surcharges: decimalString,

  totalFee: decimalString,

  estimatedMinDays: z.number().int().nonnegative(),

  estimatedMaxDays: z.number().int().nonnegative(),

  rawCalculation: z.any().optional(),
});

export const updateShippingQuoteSchema =
  createShippingQuoteSchema.partial();

export type CreateShippingQuoteInput =
  z.infer<typeof createShippingQuoteSchema>;

export type UpdateShippingQuoteInput =
  z.infer<typeof updateShippingQuoteSchema>;