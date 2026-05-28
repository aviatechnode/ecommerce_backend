import { z } from "zod";

import {
  ShippingMethod,
  PaymentProvider,
} from "@prisma/client";

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const phoneRegex =
  /^(?:\+234|0)[789][01]\d{8}$/;

const uuidSchema = z.string().uuid(
  "Invalid UUID"
);

const decimalNumberSchema = z
  .union([
    z.number(),

    z
      .string()
      .trim()
      .regex(
        /^\d+(\.\d+)?$/,
        "Invalid decimal value"
      ),
  ])
  .refine(
    (val) => !isNaN(Number(val)),
    {
      message: "Invalid decimal value",
    }
  );

//////////////////////////////////////////////////////////
// ENUMS
//////////////////////////////////////////////////////////

export const shippingMethodEnum =
  z.nativeEnum(ShippingMethod, {
    errorMap: () => ({
      message:
        "Invalid shipping method",
    }),
  });

export const paymentProviderEnum =
  z.nativeEnum(PaymentProvider, {
    errorMap: () => ({
      message:
        "Invalid payment provider",
    }),
  });

//////////////////////////////////////////////////////////
// BASE ADDRESS SCHEMA
//////////////////////////////////////////////////////////

const baseAddressSchema = z
  .object({
    //////////////////////////////////////////////////////
    // CONTACT
    //////////////////////////////////////////////////////

    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(100, "Name is too long"),

    phone: z
      .string()
      .trim()
      .regex(
        phoneRegex,
        "Invalid Nigerian phone number"
      ),

    //////////////////////////////////////////////////////
    // LOCATION
    //////////////////////////////////////////////////////

    stateId: uuidSchema,

    lgaId: uuidSchema,

    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100, "City is too long"),

    area: z
      .string()
      .trim()
      .max(100, "Area is too long")
      .optional()
      .nullable(),

    //////////////////////////////////////////////////////
    // ADDRESS DETAILS
    //////////////////////////////////////////////////////

    street: z
      .string()
      .trim()
      .min(3, "Street is required")
      .max(255, "Street is too long"),

    landmark: z
      .string()
      .trim()
      .max(
        255,
        "Landmark is too long"
      )
      .optional()
      .nullable(),

    fullAddress: z
      .string()
      .trim()
      .min(
        5,
        "Full address is required"
      )
      .max(
        500,
        "Full address is too long"
      ),

    //////////////////////////////////////////////////////
    // FLAGS
    //////////////////////////////////////////////////////

    isDefault: z
      .boolean()
      .optional()
      .default(false),
  })
  .strict();

//////////////////////////////////////////////////////////
// ADDRESS SCHEMA
//////////////////////////////////////////////////////////

export const addressSchema =
  baseAddressSchema.superRefine(
    (data, ctx) => {
      const hasState =
        !!data.stateId;

      const hasLga =
        !!data.lgaId;

      if (hasState !== hasLga) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "stateId and lgaId must be provided together",
          path: ["lgaId"],
        });
      }
    }
  );

//////////////////////////////////////////////////////////
// CREATE ADDRESS
//////////////////////////////////////////////////////////

export const createAddressSchema =
  addressSchema;

export type CreateAddressInput =
  z.infer<
    typeof createAddressSchema
  >;

//////////////////////////////////////////////////////////
// UPDATE ADDRESS
//////////////////////////////////////////////////////////

export const updateAddressSchema =
  baseAddressSchema
    .partial()
    .superRefine(
      (data, ctx) => {
        const hasState =
          data.stateId !==
          undefined;

        const hasLga =
          data.lgaId !==
          undefined;

        if (hasState !== hasLga) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,
            message:
              "stateId and lgaId must be provided together",
            path: ["lgaId"],
          });
        }
      }
    );

export type UpdateAddressInput =
  z.infer<
    typeof updateAddressSchema
  >;

//////////////////////////////////////////////////////////
// CHECKOUT SCHEMA
//////////////////////////////////////////////////////////

export const checkoutSchema = z
  .object({
    //////////////////////////////////////////////////////
    // ADDRESS
    //////////////////////////////////////////////////////

    address:
      createAddressSchema.optional(),

    addressId:
      uuidSchema.optional(),

    //////////////////////////////////////////////////////
    // SHIPPING
    //////////////////////////////////////////////////////

    shippingMethod:
      shippingMethodEnum.default(
        ShippingMethod.STANDARD
      ),

    pickupStationId:
      uuidSchema.optional(),

    deliveryStateId:
      uuidSchema.optional(),

    deliveryLgaId:
      uuidSchema.optional(),

    shippingQuoteId:
      uuidSchema.optional(),

    //////////////////////////////////////////////////////
    // PAYMENT
    //////////////////////////////////////////////////////

    paymentProvider:
      paymentProviderEnum.default(
        PaymentProvider.PAYSTACK
      ),

    //////////////////////////////////////////////////////
    // COUPON
    //////////////////////////////////////////////////////

    couponCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(
        3,
        "Coupon code too short"
      )
      .max(
        50,
        "Coupon code too long"
      )
      .optional(),

    //////////////////////////////////////////////////////
    // OPTIONAL ESTIMATES
    //////////////////////////////////////////////////////

    estimatedDeliveryFee:
      decimalNumberSchema.optional(),

    //////////////////////////////////////////////////////
    // ORDER NOTES
    //////////////////////////////////////////////////////

    note: z
      .string()
      .trim()
      .max(
        500,
        "Note is too long"
      )
      .optional(),

    //////////////////////////////////////////////////////
    // IDEMPOTENCY
    //////////////////////////////////////////////////////

    idempotencyKey: z
      .string()
      .trim()
      .min(
        10,
        "Idempotency key is too short"
      )
      .max(
        255,
        "Idempotency key is too long"
      )
      .optional(),
  })
  .strict()
  .superRefine(
    (data, ctx) => {
      ////////////////////////////////////////////////////
      // ADDRESS VALIDATION
      ////////////////////////////////////////////////////

      if (
        !data.address &&
        !data.addressId
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "Either address or addressId is required",
          path: ["address"],
        });
      }

      if (
        data.address &&
        data.addressId
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "Provide either address or addressId, not both",
          path: ["addressId"],
        });
      }

      ////////////////////////////////////////////////////
      // DELIVERY LOCATION VALIDATION
      ////////////////////////////////////////////////////

      const hasState =
        data.deliveryStateId !==
        undefined;

      const hasLga =
        data.deliveryLgaId !==
        undefined;

      if (hasState !== hasLga) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "deliveryStateId and deliveryLgaId must be provided together",
          path: [
            "deliveryLgaId",
          ],
        });
      }

      ////////////////////////////////////////////////////
      // PICKUP STATION VALIDATION
      ////////////////////////////////////////////////////

      if (
        data.shippingMethod ===
          ShippingMethod.PICKUP_STATION &&
        !data.pickupStationId
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "pickupStationId is required for PICKUP_STATION shipping",
          path: [
            "pickupStationId",
          ],
        });
      }

      if (
        data.shippingMethod !==
          ShippingMethod.PICKUP_STATION &&
        data.pickupStationId
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "pickupStationId is only allowed for PICKUP_STATION shipping",
          path: [
            "pickupStationId",
          ],
        });
      }

      ////////////////////////////////////////////////////
      // SHIPPING QUOTE VALIDATION
      ////////////////////////////////////////////////////

      if (
        data.shippingMethod !==
          ShippingMethod.PICKUP_STATION &&
        !data.shippingQuoteId
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "shippingQuoteId is required for delivery shipping methods",
          path: [
            "shippingQuoteId",
          ],
        });
      }

      ////////////////////////////////////////////////////
      // PICKUP STATION DELIVERY RULE
      ////////////////////////////////////////////////////

      if (
        data.shippingMethod ===
          ShippingMethod.PICKUP_STATION &&
        (data.deliveryStateId ||
          data.deliveryLgaId)
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,
          message:
            "deliveryStateId and deliveryLgaId are not required for PICKUP_STATION shipping",
          path: [
            "deliveryStateId",
          ],
        });
      }
    }
  );

export type CheckoutInput =
  z.infer<typeof checkoutSchema>;