import { z } from "zod";

/* =========================================================
   COMMON HELPERS
========================================================= */

/**
 * Shared quantity validation
 */
const quantitySchema = z.coerce
  .number({
    invalid_type_error: "Quantity must be a number",
  })
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(100, "Quantity cannot exceed 100");

/**
 * Shared UUID validation helper
 */
const uuidSchema = (fieldName: string) =>
  z
    .string({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a string`,
    })
    .uuid(`${fieldName} must be a valid UUID`);

/* =========================================================
   ADD TO CART
========================================================= */

export const addToCartSchema = z
  .object({
    variantId: uuidSchema("Product variant ID"),
    quantity: quantitySchema.default(1),
  })
  .strict();

/* =========================================================
   UPDATE CART ITEM QUANTITY
========================================================= */

export const updateQuantitySchema = z
  .object({
    quantity: quantitySchema,
  })
  .strict();

/* =========================================================
   REMOVE CART ITEM
========================================================= */

export const removeCartItemSchema = z
  .object({
    variantId: uuidSchema("Product variant ID"),
  })
  .strict();

/* =========================================================
   CLEAR CART
========================================================= */

export const clearCartSchema = z.object({}).strict();

/* =========================================================
   UPDATE CART DELIVERY / SHIPPING ESTIMATION
========================================================= */

export const updateCartDeliverySchema = z
  .object({
    deliveryStateId: uuidSchema("Delivery state ID").optional(),
    deliveryLgaId: uuidSchema("Delivery LGA ID").optional(),
    shippingZoneId: uuidSchema("Shipping zone ID").optional(),
  })
  .strict()
  .refine(
    (data) =>
      !!(
        data.deliveryStateId ||
        data.deliveryLgaId ||
        data.shippingZoneId
      ),
    {
      message:
        "At least one delivery field must be provided",
      path: ["deliveryStateId"],
    }
  );

/* =========================================================
   CALCULATE CART SHIPPING
========================================================= */

export const calculateCartShippingSchema = z
  .object({
    deliveryStateId: uuidSchema("Delivery state ID"),
    deliveryLgaId: uuidSchema("Delivery LGA ID"),
  })
  .strict();

/* =========================================================
   MERGE GUEST CART → USER CART
========================================================= */

export const mergeCartSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            variantId: uuidSchema("Product variant ID"),
            quantity: quantitySchema,
          })
          .strict()
      )
      .min(1, "At least one cart item is required")
      .max(100, "Too many cart items"),
  })
  .strict();

/* =========================================================
   OPTIONAL: APPLY COUPON
========================================================= */

export const applyCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Coupon code is required")
      .max(50, "Coupon code is too long"),
  })
  .strict();

/* =========================================================
   OPTIONAL: REMOVE COUPON
========================================================= */

export const removeCouponSchema = z.object({}).strict();

/* =========================================================
   EXPORT TYPES
========================================================= */

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export type UpdateQuantityInput = z.infer<
  typeof updateQuantitySchema
>;

export type RemoveCartItemInput = z.infer<
  typeof removeCartItemSchema
>;

export type ClearCartInput = z.infer<
  typeof clearCartSchema
>;

export type UpdateCartDeliveryInput = z.infer<
  typeof updateCartDeliverySchema
>;

export type CalculateCartShippingInput = z.infer<
  typeof calculateCartShippingSchema
>;

export type MergeCartInput = z.infer<
  typeof mergeCartSchema
>;

export type ApplyCouponInput = z.infer<
  typeof applyCouponSchema
>;

export type RemoveCouponInput = z.infer<
  typeof removeCouponSchema
>;