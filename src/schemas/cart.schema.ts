import z from "zod";

const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(1),
});


export {addToCartSchema, updateQuantitySchema}