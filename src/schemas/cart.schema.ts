import { z } from "zod";

const quantitySchema = z.coerce
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(100, "Quantity cannot exceed 100");

const addToCartSchema = z
  .object({
    variantId: z
      .string()
      .uuid("Valid product variant ID is required"),

    quantity: quantitySchema,
  })
  .strict();

const updateQuantitySchema = z
  .object({
    quantity: quantitySchema,
  })
  .strict();

export { addToCartSchema, updateQuantitySchema };