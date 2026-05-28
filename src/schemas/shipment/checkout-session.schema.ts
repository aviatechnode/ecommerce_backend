import { z } from "zod";

const decimalString = z.union([
  z.string(),
  z.number(),
]);

export const createCheckoutSessionSchema = z.object({
  cartId: z.string().uuid(),

  userId: z.string().uuid(),

  deliveryLgaId: z.string().uuid().optional(),

  subtotal: decimalString,

  deliveryFee: decimalString,

  totalAmount: decimalString,

  expiresAt: z.coerce.date(),

  completedAt: z.coerce.date().optional(),

  shippingQuoteId: z.string().uuid().optional(),
});

export const updateCheckoutSessionSchema =
  createCheckoutSessionSchema.partial();

export type CreateCheckoutSessionInput =
  z.infer<typeof createCheckoutSessionSchema>;

export type UpdateCheckoutSessionInput =
  z.infer<typeof updateCheckoutSessionSchema>;