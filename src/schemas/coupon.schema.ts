import { z } from 'zod'
import {
  CouponType,
  CouponScope,
  CouponStatus,
  CouponAppliesTo,
} from '@prisma/client'

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const optionalMoneySchema = z.coerce
  .number()
  .positive()
  .optional()

//////////////////////////////////////////////////////////
// BASE OBJECT SCHEMA
//////////////////////////////////////////////////////////

const baseCouponSchema = z.object({
  //////////////////////////////////////////////////////////
  // Identity
  //////////////////////////////////////////////////////////

  code: z.string().trim().min(1).max(50),

  name: z.string().trim().min(1).max(100),

  description: z.string().trim().max(1000).optional(),

  //////////////////////////////////////////////////////////
  // Discount Engine
  //////////////////////////////////////////////////////////

  type: z.nativeEnum(CouponType),

  scope: z
    .nativeEnum(CouponScope)
    .default(CouponScope.ORDER_TOTAL),

  priority: z.coerce.number().int().min(0).max(1000).default(0),

  internalNotes: z.string().max(5000).optional(),

  amountOff: optionalMoneySchema,

  percentOff: z.coerce.number().min(0.01).max(100).optional(),

  maxDiscountAmount: optionalMoneySchema,

  freeShipping: z.boolean().default(false),

  //////////////////////////////////////////////////////////
  // Qualification Rules
  //////////////////////////////////////////////////////////

  minimumOrderAmount: optionalMoneySchema,

  minimumItemQuantity: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  firstOrderOnly: z.boolean().default(false),

  appliesTo: z
    .nativeEnum(CouponAppliesTo)
    .default(CouponAppliesTo.ALL_PRODUCTS),

  //////////////////////////////////////////////////////////
  // Lifecycle
  //////////////////////////////////////////////////////////

  status: z
    .nativeEnum(CouponStatus)
    .default(CouponStatus.DRAFT),

  startsAt: z.coerce.date().optional(),

  expiresAt: z.coerce.date().optional(),

  //////////////////////////////////////////////////////////
  // Abuse Prevention
  //////////////////////////////////////////////////////////

  usageLimit: z.coerce.number().int().positive().optional(),

  perUserLimit: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  isStackable: z.boolean().default(false),

  excludeSaleItems: z.boolean().default(false),

  //////////////////////////////////////////////////////////
  // Targeting Rules
  //////////////////////////////////////////////////////////

  productIds: z.array(z.string().uuid()).default([]),

  categoryIds: z.array(z.string().uuid()).default([]),

  customerIds: z.array(z.string().uuid()).default([]),

  //////////////////////////////////////////////////////////
  // Metadata
  //////////////////////////////////////////////////////////

  metadata: z.record(z.string(), z.any()).optional(),
})

//////////////////////////////////////////////////////////
// REFINEMENT
//////////////////////////////////////////////////////////

const couponRefinement = (
  data: any,
  ctx: z.RefinementCtx
) => {
  //////////////////////////////////////////////////////////
  // TYPE VALIDATION
  //////////////////////////////////////////////////////////

  if (
    data.type === CouponType.FIXED_AMOUNT &&
    data.amountOff == null
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'amountOff is required for FIXED_AMOUNT coupons',
      path: ['amountOff'],
    })
  }

  if (
    data.type === CouponType.PERCENTAGE &&
    data.percentOff == null
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'percentOff is required for PERCENTAGE coupons',
      path: ['percentOff'],
    })
  }

  if (
    data.type === CouponType.FREE_SHIPPING &&
    !data.freeShipping
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'freeShipping must be true for FREE_SHIPPING coupons',
      path: ['freeShipping'],
    })
  }

  //////////////////////////////////////////////////////////
  // DATE VALIDATION
  //////////////////////////////////////////////////////////

  if (
    data.startsAt &&
    data.expiresAt &&
    data.expiresAt <= data.startsAt
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'expiresAt must be after startsAt',
      path: ['expiresAt'],
    })
  }

  //////////////////////////////////////////////////////////
  // TARGETING VALIDATION
  //////////////////////////////////////////////////////////

  if (
    data.appliesTo ===
      CouponAppliesTo.SPECIFIC_PRODUCTS &&
    (!data.productIds || data.productIds.length === 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'productIds required for SPECIFIC_PRODUCTS',
      path: ['productIds'],
    })
  }

  if (
    data.appliesTo ===
      CouponAppliesTo.SPECIFIC_CATEGORIES &&
    (!data.categoryIds || data.categoryIds.length === 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'categoryIds required for SPECIFIC_CATEGORIES',
      path: ['categoryIds'],
    })
  }

  if (
    data.appliesTo ===
      CouponAppliesTo.SPECIFIC_CUSTOMERS &&
    (!data.customerIds || data.customerIds.length === 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'customerIds required for SPECIFIC_CUSTOMERS',
      path: ['customerIds'],
    })
  }
}

//////////////////////////////////////////////////////////
// CREATE COUPON
//////////////////////////////////////////////////////////

export const createCouponSchema =
  baseCouponSchema.superRefine(couponRefinement)

//////////////////////////////////////////////////////////
// UPDATE COUPON
//////////////////////////////////////////////////////////

export const updateCouponSchema =
  baseCouponSchema
    .partial()
    .superRefine(couponRefinement)

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

export type CreateCouponInput =
  z.infer<typeof createCouponSchema>

export type UpdateCouponInput =
  z.infer<typeof updateCouponSchema>