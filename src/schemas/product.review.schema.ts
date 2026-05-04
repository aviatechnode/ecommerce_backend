import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().uuid(),

  title: z
    .string()
    .max(255, "Title must not exceed 255 characters")
    .optional(),

  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5"),

  comment: z
    .string()
    .max(1000, "Comment must not exceed 1000 characters")
    .optional(),
});

const updateReviewSchema = z.object({
  title: z
    .string()
    .max(255, "Title must not exceed 255 characters")
    .optional(),

  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5")
    .optional(),

  comment: z
    .string()
    .max(1000, "Comment must not exceed 1000 characters")
    .optional(),

  isApproved: z.boolean().optional(),
});

export { createReviewSchema, updateReviewSchema };