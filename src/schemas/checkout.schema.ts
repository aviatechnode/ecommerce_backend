import { z } from "zod";

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/;

const uuidSchema = z.string().uuid("Invalid UUID");

const decimalNumberSchema = z
  .union([
    z.number(),
    z.string().regex(/^\d+(\.\d+)?$/, "Invalid decimal value"),
  ])
  .optional();

//////////////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////////////

export const shippingMethodEnum = z.enum([
  "STANDARD",
  "EXPRESS",
  "SAME_DAY",
  "PICKUP_STATION",
]);

export const paymentProviderEnum = z.enum([
  "PAYSTACK",
  "FLUTTERWAVE",
  "STRIPE",
  "BANK_TRANSFER",
  "CASH_ON_DELIVERY",
]);

//////////////////////////////////////////////////////////
// BASE ADDRESS OBJECT
//////////////////////////////////////////////////////////

const baseAddressSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(100, "Name is too long"),

    phone: z
      .string()
      .trim()
      .regex(phoneRegex, "Invalid Nigerian phone number"),

    stateId: uuidSchema,

    lgaId: uuidSchema,

    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100),

    area: z
      .string()
      .trim()
      .max(100)
      .optional()
      .nullable(),

    street: z
      .string()
      .trim()
      .min(3, "Street is required")
      .max(255),

    landmark: z
      .string()
      .trim()
      .max(255)
      .optional()
      .nullable(),

    fullAddress: z
      .string()
      .trim()
      .min(5, "Full address is required")
      .max(500),

    isDefault: z.boolean().optional().default(false),
  })
  .strict();

//////////////////////////////////////////////////////////
// ADDRESS SCHEMA
//////////////////////////////////////////////////////////

export const addressSchema = baseAddressSchema.superRefine(
  (data, ctx) => {
    if (
      (data.stateId && !data.lgaId) ||
      (!data.stateId && data.lgaId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "stateId and lgaId must be provided together",
        path: ["lgaId"],
      });
    }
  }
);

//////////////////////////////////////////////////////////
// CREATE ADDRESS
//////////////////////////////////////////////////////////

export const createAddressSchema = addressSchema;

export type CreateAddressInput =
  z.infer<typeof createAddressSchema>;

//////////////////////////////////////////////////////////
// UPDATE ADDRESS
//////////////////////////////////////////////////////////

export const updateAddressSchema = baseAddressSchema
  .partial()
  .superRefine((data, ctx) => {
    const hasState = data.stateId !== undefined;
    const hasLga = data.lgaId !== undefined;

    if (hasState !== hasLga) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "stateId and lgaId must be provided together",
        path: ["lgaId"],
      });
    }
  });

export type UpdateAddressInput =
  z.infer<typeof updateAddressSchema>;

//////////////////////////////////////////////////////////
// CHECKOUT SCHEMA (UPDATED FOR SHIPPING SYSTEM)
//////////////////////////////////////////////////////////

export const checkoutSchema = z
  .object({
    //////////////////////////////////////////////////////
    // COUPON
    //////////////////////////////////////////////////////

    couponCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Coupon code too short")
      .max(50, "Coupon code too long")
      .optional(),

    //////////////////////////////////////////////////////
    // ADDRESS
    //////////////////////////////////////////////////////

    address: createAddressSchema.optional(),

    addressId: uuidSchema.optional(),

    //////////////////////////////////////////////////////
    // SHIPPING
    //////////////////////////////////////////////////////

    shippingMethod: shippingMethodEnum.default("STANDARD"),

    pickupStationId: uuidSchema.optional(),

    deliveryStateId: uuidSchema.optional(),

    deliveryLgaId: uuidSchema.optional(),

    shippingZoneId: uuidSchema.optional(),

    //////////////////////////////////////////////////////
    // PAYMENT
    //////////////////////////////////////////////////////

    paymentProvider: paymentProviderEnum.default(
      "PAYSTACK"
    ),

    //////////////////////////////////////////////////////
    // OPTIONAL FEES / ESTIMATION SUPPORT
    //////////////////////////////////////////////////////

    estimatedDeliveryFee: decimalNumberSchema,

    //////////////////////////////////////////////////////
    // ORDER META
    //////////////////////////////////////////////////////

    note: z
      .string()
      .trim()
      .max(500, "Note is too long")
      .optional(),

    idempotencyKey: z
      .string()
      .trim()
      .min(10, "Idempotency key is too short")
      .max(255, "Idempotency key is too long")
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    //////////////////////////////////////////////////////
    // ADDRESS VALIDATION
    //////////////////////////////////////////////////////

    if (!data.address && !data.addressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either address or addressId is required",
        path: ["address"],
      });
    }

    if (data.address && data.addressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide either address or addressId, not both",
        path: ["addressId"],
      });
    }

    //////////////////////////////////////////////////////
    // DELIVERY STATE + LGA VALIDATION
    //////////////////////////////////////////////////////

    const hasState =
      data.deliveryStateId !== undefined;

    const hasLga =
      data.deliveryLgaId !== undefined;

    if (hasState !== hasLga) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "deliveryStateId and deliveryLgaId must be provided together",
        path: ["deliveryLgaId"],
      });
    }

    //////////////////////////////////////////////////////
    // PICKUP STATION RULE
    //////////////////////////////////////////////////////

    if (
      data.shippingMethod === "PICKUP_STATION" &&
      !data.pickupStationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "pickupStationId is required for PICKUP_STATION shipping",
        path: ["pickupStationId"],
      });
    }

    if (
      data.shippingMethod !== "PICKUP_STATION" &&
      data.pickupStationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "pickupStationId is only allowed for PICKUP_STATION shipping",
        path: ["pickupStationId"],
      });
    }
  });

export type CheckoutInput =
  z.infer<typeof checkoutSchema>;