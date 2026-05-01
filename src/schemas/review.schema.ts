import { z } from "zod";

export const baseReviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),

  title: z
    .string()
    .max(255, "Title too long")
    .trim()
    .optional(),

  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),

  comment: z
    .string()
    .max(1000, "Comment too long")
    .trim()
    .optional(),
}); 