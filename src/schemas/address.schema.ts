import { z } from "zod";
import { AddressType, NigerianState } from "@prisma/client";

/* =========================================================
HELPERS
========================================================= */

// Nigerian phone validation (strict but practical)
const nigerianPhoneRegex =
  /^(?:\+234|0)(7|8|9)(0|1)\d{8}$/;

// Optional stricter normalization can be done at service layer

/* =========================================================
BASE ADDRESS SCHEMA
========================================================= */

export const addressSchema = z.object({
  type: z.nativeEnum(AddressType).default(AddressType.DELIVERY),

  street: z
    .string()
    .min(5, "Street must be at least 5 characters")
    .max(255)
    .trim(),

  city: z
    .string()
    .min(2, "City is required")
    .max(100)
    .trim(),

  state: z.nativeEnum(NigerianState, {
    errorMap: () => ({ message: "Invalid Nigerian state" }),
  }),

  lga: z
    .string()
    .min(2, "LGA is required")
    .max(100)
    .trim(),

  landmark: z
    .string()
    .max(255)
    .trim()
    .optional()
    .nullable(),

  postalCode: z
    .string()
    .max(20)
    .trim()
    .optional()
    .nullable(),

  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Invalid Nigerian phone number"),

  country: z
    .string()
    .default("Nigeria")
    .transform((val) => val.trim()),

  isDefault: z.boolean().optional().default(false),
});

/* =========================================================
CREATE ADDRESS SCHEMA
========================================================= */

export const createAddressSchema = addressSchema;

/* =========================================================
UPDATE ADDRESS SCHEMA (PATCH SAFE)
========================================================= */

export const updateAddressSchema = addressSchema.partial();

/* =========================================================
CHECKOUT ADDRESS INPUT (IMPORTANT)
========================================================= */

export const checkoutAddressSchema = z.object({
  addressId: z.string().uuid().optional(),

  address: addressSchema.optional(),
}).refine(
  (data) => data.addressId || data.address,
  {
    message: "Either addressId or address must be provided",
    path: ["addressId"],
  }
);