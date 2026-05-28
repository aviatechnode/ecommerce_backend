import { z } from "zod";

export const initializePaymentSchema = z.object({
  orderId: z.string().uuid(),
  email: z.string().email(),
  amount: z.number().positive(),
  metadata: z.record(z.any()).optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string(),
});

export const webhookPayloadSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number(),
    reference: z.string(),
    status: z.string(),
    amount: z.number(),
    paidAt: z.string().nullable(),
    gateway_response: z.string(),
    channel: z.string().optional(),
    currency: z.string().optional(),
  }),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;