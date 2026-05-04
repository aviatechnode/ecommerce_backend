import { z } from "zod";

const addToCartSchema = z.object({
  variantId: z
    .string()
    .uuid("Valid product variant ID is required"),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

const updateQuantitySchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export { addToCartSchema, updateQuantitySchema };