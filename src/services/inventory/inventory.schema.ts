import { z } from "zod";

export const reserveStockSchema = z.object({
  orderId: z.string().uuid().optional(),
  variantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
});