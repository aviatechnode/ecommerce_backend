import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),

  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),

  oemNumber: z.string().optional(),

  variantName: z.string().default("Default"),
  sku: z.string(),

  price: z.number(),
  costPrice: z.number().optional(),
  weight: z.number().optional(),

  warehouseId: z.string().uuid(),

  stock: z.number().int().nonnegative(),
  threshold: z.number().int().optional(),

  specifications: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),

    fitments: z
  .array(
    z.object({
      trimId: z.string().uuid(),
      notes: z.string().optional(),
    })
  )
  .optional(),
});

const updateProductSchema = createProductSchema.partial();


export {createProductSchema,
updateProductSchema}