import { z } from "zod";
import { ShipmentStatus, ShippingMethod } from "@prisma/client";

/* =========================================================
HELPERS
========================================================= */

const decimalField = (fieldName: string) =>
  z.coerce
    .number({
      invalid_type_error: `${fieldName} must be a valid number`,
    })
    .nonnegative(`${fieldName} cannot be negative`);

const optionalDecimalField = (fieldName: string) =>
  z.coerce
    .number({
      invalid_type_error: `${fieldName} must be a valid number`,
    })
    .nonnegative(`${fieldName} cannot be negative`)
    .optional()
    .nullable();

const optionalFloatField = (fieldName: string) =>
  z.coerce
    .number({
      invalid_type_error: `${fieldName} must be a valid number`,
    })
    .min(0, `${fieldName} cannot be negative`)
    .optional()
    .nullable();

const optionalDateField = (fieldName: string) =>
  z.coerce
    .date({
      invalid_type_error: `${fieldName} must be a valid date`,
    })
    .optional()
    .nullable();

/* =========================================================
BASE SHIPMENT SCHEMA
========================================================= */

const shipmentBaseSchema = {
  courierId: z.string().uuid("Courier ID must be a valid UUID"),

  shippingRateId: z
    .string()
    .uuid("Shipping Rate ID must be a valid UUID")
    .optional()
    .nullable(),

  pickupStationId: z
    .string()
    .uuid("Pickup Station ID must be a valid UUID")
    .optional()
    .nullable(),

  trackingNumber: z
    .string()
    .min(1, "Tracking number is required")
    .max(255, "Tracking number must not exceed 255 characters"),

  status: z
    .nativeEnum(ShipmentStatus, {
      errorMap: () => ({
        message: "Invalid shipment status",
      }),
    })
    .optional()
    .default(ShipmentStatus.PENDING),

  shippingMethod: z.nativeEnum(ShippingMethod, {
    errorMap: () => ({
      message: "Invalid shipping method",
    }),
  }),

  deliveryFee: decimalField("Delivery fee"),

  heavyItemSurcharge: optionalDecimalField(
    "Heavy item surcharge"
  ),

  supportsCOD: z.boolean().optional().default(false),

  fragileFee: optionalDecimalField("Fragile fee"),

  sameDayFee: optionalDecimalField("Same day fee"),

  weight: optionalFloatField("Weight"),

  volumetricWeight: optionalFloatField(
    "Volumetric weight"
  ),

  chargeableWeight: optionalFloatField(
    "Chargeable weight"
  ),

  estimatedDays: z.coerce
    .number({
      invalid_type_error:
        "Estimated days must be a valid number",
    })
    .int("Estimated days must be an integer")
    .min(0, "Estimated days cannot be negative")
    .optional()
    .nullable(),

  shippedAt: optionalDateField("Shipped date"),

  deliveredAt: optionalDateField("Delivered date"),

  notes: z
    .string()
    .max(2000, "Notes must not exceed 2000 characters")
    .optional()
    .nullable(),

  failedReason: z
    .string()
    .max(
      1000,
      "Failed reason must not exceed 1000 characters"
    )
    .optional()
    .nullable(),
};

/* =========================================================
CREATE SHIPMENT
========================================================= */

export const createShipmentSchema = z
  .object({
    orderId: z.string().uuid("Order ID must be a valid UUID"),

    ...shipmentBaseSchema,
  })
  .superRefine((data, ctx) => {
    // deliveredAt must be after shippedAt
    if (
      data.shippedAt &&
      data.deliveredAt &&
      data.deliveredAt < data.shippedAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveredAt"],
        message:
          "Delivered date must be after shipped date",
      });
    }

    // pickup station validation
    if (
      data.shippingMethod ===
        ShippingMethod.PICKUP_STATION &&
      !data.pickupStationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupStationId"],
        message:
          "Pickup station is required for pickup station shipping",
      });
    }

    // same day fee validation
    if (
      data.shippingMethod === ShippingMethod.SAME_DAY &&
      data.sameDayFee == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sameDayFee"],
        message:
          "Same day fee is required for same day shipping",
      });
    }

    // failed reason validation
    if (
      data.status === ShipmentStatus.FAILED &&
      !data.failedReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failedReason"],
        message:
          "Failed reason is required when shipment status is FAILED",
      });
    }

    // delivered shipment validation
    if (
      data.status === ShipmentStatus.DELIVERED &&
      !data.deliveredAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveredAt"],
        message:
          "Delivered date is required when shipment is delivered",
      });
    }

    // shipped shipment validation
   const shippedStatuses: ShipmentStatus[] = [
    ShipmentStatus.SHIPPED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
  ];

  if (
    data.status &&
    shippedStatuses.includes(data.status) &&
    !data.shippedAt
  ){
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shippedAt"],
        message:
          "Shipped date is required once shipment has been shipped",
      });
    }
  });

/* =========================================================
UPDATE SHIPMENT
========================================================= */

export const updateShipmentSchema = z
  .object({
    courierId: z
      .string()
      .uuid("Courier ID must be a valid UUID")
      .optional(),

    shippingRateId: z
      .string()
      .uuid("Shipping Rate ID must be a valid UUID")
      .optional()
      .nullable(),

    pickupStationId: z
      .string()
      .uuid("Pickup Station ID must be a valid UUID")
      .optional()
      .nullable(),

    trackingNumber: z
      .string()
      .min(1, "Tracking number cannot be empty")
      .max(
        255,
        "Tracking number must not exceed 255 characters"
      )
      .optional(),

    status: z
      .nativeEnum(ShipmentStatus, {
        errorMap: () => ({
          message: "Invalid shipment status",
        }),
      })
      .optional(),

    shippingMethod: z
      .nativeEnum(ShippingMethod, {
        errorMap: () => ({
          message: "Invalid shipping method",
        }),
      })
      .optional(),

    deliveryFee: decimalField("Delivery fee").optional(),

    heavyItemSurcharge: optionalDecimalField(
      "Heavy item surcharge"
    ),

    supportsCOD: z.boolean().optional(),

    fragileFee: optionalDecimalField("Fragile fee"),

    sameDayFee: optionalDecimalField("Same day fee"),

    weight: optionalFloatField("Weight"),

    volumetricWeight: optionalFloatField(
      "Volumetric weight"
    ),

    chargeableWeight: optionalFloatField(
      "Chargeable weight"
    ),

    estimatedDays: z.coerce
      .number({
        invalid_type_error:
          "Estimated days must be a valid number",
      })
      .int("Estimated days must be an integer")
      .min(0, "Estimated days cannot be negative")
      .optional()
      .nullable(),

    shippedAt: optionalDateField("Shipped date"),

    deliveredAt: optionalDateField("Delivered date"),

    notes: z
      .string()
      .max(
        2000,
        "Notes must not exceed 2000 characters"
      )
      .optional()
      .nullable(),

    failedReason: z
      .string()
      .max(
        1000,
        "Failed reason must not exceed 1000 characters"
      )
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.shippedAt &&
      data.deliveredAt &&
      data.deliveredAt < data.shippedAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveredAt"],
        message:
          "Delivered date must be after shipped date",
      });
    }

    if (
      data.shippingMethod ===
        ShippingMethod.PICKUP_STATION &&
      !data.pickupStationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupStationId"],
        message:
          "Pickup station is required for pickup station shipping",
      });
    }

    if (
      data.shippingMethod === ShippingMethod.SAME_DAY &&
      data.sameDayFee == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sameDayFee"],
        message:
          "Same day fee is required for same day shipping",
      });
    }

    if (
      data.status === ShipmentStatus.FAILED &&
      !data.failedReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failedReason"],
        message:
          "Failed reason is required when shipment status is FAILED",
      });
    }

    if (
      data.status === ShipmentStatus.DELIVERED &&
      !data.deliveredAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveredAt"],
        message:
          "Delivered date is required when shipment is delivered",
      });
    }
  });

/* =========================================================
UPDATE SHIPMENT STATUS ONLY
========================================================= */

export const updateShipmentStatusSchema = z
  .object({
    status: z.nativeEnum(ShipmentStatus, {
      errorMap: () => ({
        message: "Invalid shipment status",
      }),
    }),

    failedReason: z
      .string()
      .max(
        1000,
        "Failed reason must not exceed 1000 characters"
      )
      .optional()
      .nullable(),

    shippedAt: optionalDateField("Shipped date"),

    deliveredAt: optionalDateField("Delivered date"),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === ShipmentStatus.FAILED &&
      !data.failedReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failedReason"],
        message:
          "Failed reason is required when shipment status is FAILED",
      });
    }

    if (
      data.status === ShipmentStatus.DELIVERED &&
      !data.deliveredAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveredAt"],
        message:
          "Delivered date is required when shipment status is DELIVERED",
      });
    }
  });

/* =========================================================
SHIPMENT EVENT SCHEMAS
========================================================= */

export const createShipmentEventSchema = z.object({
  shipmentId: z
    .string()
    .uuid("Shipment ID must be a valid UUID"),

  status: z.nativeEnum(ShipmentStatus, {
    errorMap: () => ({
      message: "Invalid shipment status",
    }),
  }),

  title: z
    .string()
    .min(1, "Event title is required")
    .max(255, "Event title must not exceed 255 characters"),

  description: z
    .string()
    .max(
      2000,
      "Description must not exceed 2000 characters"
    )
    .optional()
    .nullable(),

  location: z
    .string()
    .max(
      255,
      "Location must not exceed 255 characters"
    )
    .optional()
    .nullable(),
});

/* =========================================================
PARAMS SCHEMA
========================================================= */

export const shipmentIdParamSchema = z.object({
  id: z
    .string()
    .uuid("Shipment ID must be a valid UUID"),
});

/* =========================================================
TYPES
========================================================= */

export type CreateShipmentInput = z.infer<
  typeof createShipmentSchema
>;

export type UpdateShipmentInput = z.infer<
  typeof updateShipmentSchema
>;

export type UpdateShipmentStatusInput = z.infer<
  typeof updateShipmentStatusSchema
>;

export type CreateShipmentEventInput = z.infer<
  typeof createShipmentEventSchema
>;

export type ShipmentIdParamInput = z.infer<
  typeof shipmentIdParamSchema
>;