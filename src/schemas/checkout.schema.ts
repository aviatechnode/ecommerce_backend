import { z } from "zod";

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/;

const uuidSchema = z.string().uuid("Invalid UUID");

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
// CHECKOUT SCHEMA
//////////////////////////////////////////////////////////

export const checkoutSchema = z
  .object({
    couponCode: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Coupon code too short")
      .max(50, "Coupon code too long")
      .optional(),

    address: createAddressSchema.optional(),

    addressId: uuidSchema.optional(),

    note: z
      .string()
      .trim()
      .max(500, "Note is too long")
      .optional(),

    idempotencyKey: z
      .string()
      .trim()
      .min(10)
      .max(255)
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
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
        message: "Provide either address or addressId, not both",
        path: ["addressId"],
      });
    }
  });

export type CheckoutInput =
  z.infer<typeof checkoutSchema>;