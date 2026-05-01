import { z } from "zod";
import { NigerianState, AddressType } from "@prisma/client";

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/; // Nigerian numbers

//////////////////////////////////////////////////////////
// ADDRESS SCHEMA (ALIGNED WITH PRISMA)
//////////////////////////////////////////////////////////

export const addressSchema = z.object({
  type: z.nativeEnum(AddressType).default("DELIVERY"),

  street: z.string().trim().min(3).max(255),
  city: z.string().trim().min(2).max(100),

  state: z.nativeEnum(NigerianState),

  lga: z.string().trim().min(2).max(100),

  landmark: z.string().trim().max(255).optional(),
  postalCode: z.string().trim().max(20).optional(),

  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid Nigerian phone number"),

  country: z.string().default("Nigeria"),

  isDefault: z.boolean().optional(),
}).strict();

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
   * Optional override address
   */
  address: addressSchema.optional(),

  /**
   * Optional order note
   */
  note: z
    .string()
    .trim()
    .max(500)
    .optional(),
}).strict();