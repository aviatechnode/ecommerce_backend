import { z } from "zod";
import { CouponType } from "@prisma/client";

/* =========================================================
CREATE COUPON SCHEMA
========================================================= */

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20)
    .transform((val) => val.toUpperCase().trim()),

  type: z.nativeEnum(CouponType),

  value: z
    .number()
    .positive("Value must be greater than 0"),

  minOrder: z
    .number()
    .positive()
    .optional(),

  usageLimit: z
    .number()
    .int()
    .positive()
    .optional(),

    // ✅ ADD THIS
  perUserLimit: z
    .number()
    .int()
    .positive()
    .optional(),

  expiresAt: z
    .string()
    .datetime()
    .optional(),
});

/* =========================================================
APPLY COUPON SCHEMA
========================================================= */

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Coupon code is required"),
});