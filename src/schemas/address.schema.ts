import { z } from "zod";

/* =========================================================
HELPERS
========================================================= */

const nigerianPhoneRegex =
  /^(?:\+234|0)(7|8|9)\d{9}$/;

const normalizeString = (
  val: unknown
): string | null => {
  if (typeof val !== "string") return null;

  const trimmed = val.trim().replace(/\s+/g, " ");
  return trimmed || null;
};

const titleCase = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

const buildFullAddress = (data: {
  street: string;
  area?: string | null;
  landmark?: string | null;
  city: string;
}) =>
  [
    data.street,
    data.area,
    data.landmark,
    data.city,
  ]
    .filter(Boolean)
    .join(", ");

/* =========================================================
REUSABLE OPTIONAL STRING FIELD
========================================================= */

const optionalNullableString = (
  max: number,
  message: string
) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeString)
    .refine(
      (val) => !val || val.length <= max,
      message
    );

/* =========================================================
BASE PRISMA-READY ADDRESS SCHEMA
Matches Prisma Address model exactly
========================================================= */

const addressBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(100, "Name is too long")
      .transform(titleCase),

    phone: z
      .string()
      .trim()
      .regex(
        nigerianPhoneRegex,
        "Invalid Nigerian phone number"
      ),

    stateId: z
      .string()
      .uuid("Invalid stateId"),

    lgaId: z
      .string()
      .uuid("Invalid lgaId"),

    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100, "City is too long")
      .transform(titleCase),

    area: optionalNullableString(
      100,
      "Area is too long"
    ),

    street: z
      .string()
      .trim()
      .min(2, "Street is required")
      .max(255, "Street is too long")
      .transform(titleCase),

    landmark: optionalNullableString(
      255,
      "Landmark is too long"
    ),

    isDefault: z
      .boolean()
      .optional()
      .default(false),
  })
  .transform((data) => ({
    ...data,
    fullAddress: buildFullAddress({
      street: data.street,
      area: data.area,
      landmark: data.landmark,
      city: data.city,
    }),
  }));

/* =========================================================
CREATE ADDRESS
Matches Prisma Address create payload
========================================================= */

export const createAddressSchema =
  addressBaseSchema;

/* =========================================================
UPDATE ADDRESS
Safe partial update for Prisma update payload
========================================================= */

export const updateAddressSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(100, "Name is too long")
      .transform(titleCase)
      .optional(),

    phone: z
      .string()
      .trim()
      .regex(
        nigerianPhoneRegex,
        "Invalid Nigerian phone number"
      )
      .optional(),

    stateId: z
      .string()
      .uuid("Invalid stateId")
      .optional(),

    lgaId: z
      .string()
      .uuid("Invalid lgaId")
      .optional(),

    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100, "City is too long")
      .transform(titleCase)
      .optional(),

    area: optionalNullableString(
      100,
      "Area is too long"
    ).optional(),

    street: z
      .string()
      .trim()
      .min(2, "Street is required")
      .max(255, "Street is too long")
      .transform(titleCase)
      .optional(),

    landmark: optionalNullableString(
      255,
      "Landmark is too long"
    ).optional(),

    isDefault: z
      .boolean()
      .optional(),
  })
  .superRefine((data, ctx) => {
    /**
     * stateId + lgaId must be updated together
     * because Address model depends on valid pair
     */

    if (data.stateId && !data.lgaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lgaId"],
        message:
          "lgaId must also be provided when stateId changes",
      });
    }

    if (data.lgaId && !data.stateId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stateId"],
        message:
          "stateId must also be provided when lgaId changes",
      });
    }
  })
  .transform((data) => {
    /**
     * Only rebuild fullAddress if address fields changed
     */

    const shouldRebuild =
      data.street !== undefined ||
      data.city !== undefined ||
      data.area !== undefined ||
      data.landmark !== undefined;

    if (!shouldRebuild) return data;

    return {
      ...data,
      fullAddress: buildFullAddress({
        street: data.street ?? "",
        area: data.area ?? null,
        landmark: data.landmark ?? null,
        city: data.city ?? "",
      }),
    };
  });

/* =========================================================
CHECKOUT ADDRESS
Either:
1. Existing saved address via addressId
OR
2. Fresh address payload
========================================================= */

export const checkoutAddressSchema = z
  .object({
    addressId: z
      .string()
      .uuid("Invalid addressId")
      .optional(),

    address:
      createAddressSchema.optional(),
  })
  .refine(
    (data) =>
      Boolean(data.addressId || data.address),
    {
      message:
        "Either addressId or address must be provided",
      path: ["addressId"],
    }
  );

/* =========================================================
TYPES
========================================================= */

export type CreateAddressInput =
  z.infer<typeof createAddressSchema>;

export type UpdateAddressInput =
  z.infer<typeof updateAddressSchema>;

export type CheckoutAddressInput =
  z.infer<typeof checkoutAddressSchema>;