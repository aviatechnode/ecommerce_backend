import { z } from "zod";
import { NigerianState } from "@prisma/client";

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/;

//////////////////////////////////////////////////////////
// ADDRESS SCHEMA (MATCHES PRISMA EXACTLY)
//////////////////////////////////////////////////////////

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),

  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid Nigerian phone number"),

  state: z.nativeEnum(NigerianState),

  lga: z.string().trim().min(2).max(100),

  city: z.string().trim().min(2).max(100),

  area: z.string().trim().max(100).optional().nullable(),

  street: z.string().trim().min(3).max(255),

  landmark: z.string().trim().max(255).optional().nullable(),

  isDefault: z.boolean().optional().default(false),
}).strict();

//////////////////////////////////////////////////////////
// CREATE ADDRESS SCHEMA
//////////////////////////////////////////////////////////

export const createAddressSchema = addressSchema;

//////////////////////////////////////////////////////////
// UPDATE ADDRESS SCHEMA (PATCH SAFE)
//////////////////////////////////////////////////////////

export const updateAddressSchema = addressSchema.partial();

//////////////////////////////////////////////////////////
// CHECKOUT SCHEMA
//////////////////////////////////////////////////////////

export const checkoutSchema = z.object({
  /**
   * Coupon (normalized)
   */
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(50)
    .optional(),

  /**
   * Optional override address (used if user doesn't select saved address)
   */
  address: createAddressSchema.optional(),

  /**
   * Optional order note
   */
  note: z.string().trim().max(500).optional(),
}).strict();