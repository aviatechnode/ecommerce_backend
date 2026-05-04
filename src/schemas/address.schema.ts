import { z } from "zod";
import { NigerianState } from "@prisma/client";

/* =========================================================
HELPERS
========================================================= */

const nigerianPhoneRegex = /^(?:\+234|0)(7|8|9)(0|1)\d{8}$/;

/* =========================================================
BASE ADDRESS SCHEMA
(matches Prisma Address model exactly)
========================================================= */

export const addressSchema = z.object({
  name: z
    .string()
    .min(2, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),

  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Invalid Nigerian phone number"),

  state: z.nativeEnum(NigerianState, {
    errorMap: () => ({
      message: "Invalid Nigerian state",
    }),
  }),

  lga: z
    .string()
    .min(2, "LGA is required")
    .max(100, "LGA cannot exceed 100 characters")
    .trim(),

  city: z
    .string()
    .min(2, "City is required")
    .max(100, "City cannot exceed 100 characters")
    .trim(),

  area: z
    .string()
    .max(100, "Area cannot exceed 100 characters")
    .trim()
    .optional()
    .nullable(),

  street: z
    .string()
    .min(2, "Street is required")
    .max(255, "Street cannot exceed 255 characters")
    .trim(),

  landmark: z
    .string()
    .max(255, "Landmark cannot exceed 255 characters")
    .trim()
    .optional()
    .nullable(),

  isDefault: z.boolean().optional().default(false),
});

/* =========================================================
CREATE ADDRESS SCHEMA
========================================================= */

/**
 * fullAddress is now backend-generated
 */
export const createAddressSchema = addressSchema;

/* =========================================================
UPDATE ADDRESS SCHEMA (PATCH SAFE)
========================================================= */

/**
 * PATCH-safe update (no fullAddress from client)
 */
export const updateAddressSchema = addressSchema.partial();

/* =========================================================
CHECKOUT ADDRESS INPUT
========================================================= */

export const checkoutAddressSchema = z
  .object({
    addressId: z
      .string()
      .uuid("Invalid address ID")
      .optional(),

    address: createAddressSchema.optional(),
  })
  .refine((data) => !!(data.addressId || data.address), {
    message: "Either addressId or address must be provided",
    path: ["addressId"],
  });