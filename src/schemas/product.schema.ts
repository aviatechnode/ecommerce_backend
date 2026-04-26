import { z } from "zod";

/* =========================================================
VARIANT ATTRIBUTES (Prisma uses valueId only)
========================================================= */
const variantAttributeSchema = z.object({
  valueId: z.string().uuid(),
});

/* =========================================================
INVENTORY (matches ProductInventory)
========================================================= */
const inventorySchema = z.object({
  warehouseId: z.string().uuid(),
  stock: z.number().int().nonnegative(),
  threshold: z.number().int().optional(),
});

/* =========================================================
VARIANT (matches ProductVariant)
========================================================= */
const variantSchema = z.object({
  name: z.string().min(1),
  sku: z.string(),

  price: z.number(), // convert to Decimal in service
  costPrice: z.number().optional(),

  weight: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),

  inventories: z.array(inventorySchema).min(1),

  attributes: z.array(variantAttributeSchema).optional(),
});

/* =========================================================
MEDIA (ProductMedia)
========================================================= */
const mediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(["IMAGE", "VIDEO"]),
  position: z.number().int(),
});

/* =========================================================
SPECIFICATIONS (ProductSpecification)
========================================================= */
const specificationSchema = z.object({
  name: z.string(),
  value: z.string(),
});

/* =========================================================
FITMENTS (ProductFitment)
========================================================= */
const fitmentSchema = z.object({
  trimId: z.string().uuid(),
  notes: z.string().optional(),
});

/* =========================================================
CREATE PRODUCT (FULL MATCH)
========================================================= */
export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),

  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),

  oemNumber: z.string().optional(),

  isActive: z.boolean().default(true),

  /* ✅ REQUIRED RELATIONS */
  variants: z.array(variantSchema).min(1),

  /* ✅ OPTIONAL RELATIONS */
  medias: z.array(mediaSchema).optional(),
  specifications: z.array(specificationSchema).optional(),
  fitments: z.array(fitmentSchema).optional(),
});

/* =========================================================
UPDATE PRODUCT
========================================================= */
export const updateProductSchema = createProductSchema.deepPartial();