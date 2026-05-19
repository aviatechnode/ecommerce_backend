import { z } from "zod";
import {
  FitmentLevel,
  MediaType,
} from "@prisma/client";

//////////////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////////////

const MediaTypeEnum = z.nativeEnum(MediaType);

const FitmentLevelEnum =
  z.nativeEnum(FitmentLevel);

//////////////////////////////////////////////////////////
// ATTRIBUTE VALUE SCHEMA
//////////////////////////////////////////////////////////

const AttributeValueSchema = z.object({
  id: z.string().uuid().optional(),

  attributeId: z.string().uuid(),

  value: z.string().min(1),
});

//////////////////////////////////////////////////////////
// VARIANT ATTRIBUTE SCHEMA
//////////////////////////////////////////////////////////

const VariantAttributeSchema = z.object({
  id: z.string().uuid().optional(),

  variantId: z.string().uuid().optional(),

  valueId: z.string().uuid(),

  value: AttributeValueSchema.optional(),
});

//////////////////////////////////////////////////////////
// PRODUCT INVENTORY SCHEMA
//////////////////////////////////////////////////////////

const ProductInventorySchema = z.object({
  id: z.string().uuid().optional(),

  variantId: z.string().uuid().optional(),

  warehouseId: z.string().uuid(),

  stock: z.number().int().min(0),

  reserved: z.number().int().min(0).optional(),

  threshold: z.number().int().min(0).optional(),
});

//////////////////////////////////////////////////////////
// PRODUCT VARIANT SCHEMA
//////////////////////////////////////////////////////////

const ProductVariantSchema = z.object({
  id: z.string().uuid().optional(),

  name: z.string().min(1),

  sku: z.string().min(1),

  price: z.number().nonnegative(),

  costPrice: z.number().nonnegative().optional(),

  compareAtPrice:
    z.number().nonnegative().optional(),

  weight: z.number().nonnegative().optional(),

  length: z.number().nonnegative().optional(),

  width: z.number().nonnegative().optional(),

  height: z.number().nonnegative().optional(),

  barcode: z.string().optional(),

  isActive: z.boolean().optional(),

  productId: z.string().uuid().optional(),

  inventories:
    z.array(ProductInventorySchema).optional(),

  attributes:
    z.array(VariantAttributeSchema).optional(),
});

//////////////////////////////////////////////////////////
// PRODUCT MEDIA SCHEMA
//////////////////////////////////////////////////////////

const ProductMediaSchema = z.object({
  id: z.string().uuid().optional(),

  productId: z.string().uuid().optional(),

  url: z.string().url(),

  type: MediaTypeEnum,

  position: z.number().int().min(0),
});

//////////////////////////////////////////////////////////
// PRODUCT SPECIFICATION SCHEMA
//////////////////////////////////////////////////////////

const ProductSpecificationSchema = z.object({
  id: z.string().uuid().optional(),

  productId: z.string().uuid().optional(),

  name: z.string().min(1),

  value: z.string().min(1),
});

//////////////////////////////////////////////////////////
// PRODUCT OEM SCHEMA
//////////////////////////////////////////////////////////

const ProductOEMSchema = z.object({
  id: z.string().uuid().optional(),

  productId: z.string().uuid().optional(),

  oemNumber: z.string().min(1),
});

//////////////////////////////////////////////////////////
// PRODUCT FITMENT SCHEMA
//////////////////////////////////////////////////////////

const ProductFitmentSchema = z.object({
  id: z.string().uuid().optional(),

  productId: z.string().uuid().optional(),

  level: FitmentLevelEnum.optional(),

  makeId: z.string().uuid().optional(),

  modelId: z.string().uuid().optional(),

  generationId: z.string().uuid().optional(),

  engineId: z.string().uuid().optional(),

  trimId: z.string().uuid().optional(),

  yearStart: z.number().int().optional(),

  yearEnd: z.number().int().optional(),

  notes: z.string().optional(),

  position: z.string().optional(),

  quantityRequired:
    z.number().int().positive().optional(),

  isUniversal: z.boolean().optional(),
});

//////////////////////////////////////////////////////////
// CREATE PRODUCT SCHEMA
//////////////////////////////////////////////////////////

export const createProductSchema = z.object({
  name: z.string().min(1),

  slug: z.string().optional(),

  description: z.string().optional(),

  brandId: z.string().uuid(),

  categoryId: z.string().uuid(),

  isActive: z.boolean().optional(),

  isFeatured: z.boolean().optional(),

  searchKeywords: z.string().optional(),

  variants:
    z.array(ProductVariantSchema).optional(),

  medias:
    z.array(ProductMediaSchema).optional(),

  specifications:
    z.array(ProductSpecificationSchema).optional(),

  oemNumbers:
    z.array(ProductOEMSchema).optional(),

  productFitments:
    z.array(ProductFitmentSchema).optional(),
});

//////////////////////////////////////////////////////////
// UPDATE PRODUCT SCHEMA
//////////////////////////////////////////////////////////

export const updateProductSchema =
  createProductSchema.partial();