import { z } from "zod";
import {
  ShipmentStatus,
  ShippingMethod,
  ShipmentType,
  Prisma,
} from "@prisma/client";

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
SHIPMENT ITEM SCHEMA
========================================================= */

export const shipmentItemSchema = z.object({
  orderItemId: z
    .string()
    .uuid("Order item ID must be a valid UUID"),

  quantity: z.coerce
    .number({
      invalid_type_error: "Quantity must be a valid number",
    })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

/* =========================================================
BASE SHIPMENT SCHEMA
========================================================= */

const shipmentBaseSchema = {
  fulfillmentId: z
    .string()
    .uuid("Fulfillment ID must be a valid UUID"),

  orderId: z
    .string()
    .uuid("Order ID must be a valid UUID"),

  type: z.nativeEnum(ShipmentType, {
    errorMap: () => ({
      message: "Invalid shipment type",
    }),
  }),

  courierId: z
    .string()
    .uuid("Courier ID must be a valid UUID"),

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

  returnRequestId: z
    .string()
    .uuid("Return request ID must be a valid UUID")
    .optional()
    .nullable(),

  trackingNumber: z
    .string()
    .min(1, "Tracking number is required")
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
    .optional()
    .default(ShipmentStatus.PENDING),

  shippingMethod: z.nativeEnum(ShippingMethod, {
    errorMap: () => ({
      message: "Invalid shipping method",
    }),
  }),

  deliveryFee: decimalField("Delivery fee"),

  weight: optionalFloatField("Weight"),

  volumetricWeight: optionalFloatField(
    "Volumetric weight"
  ),

  chargeableWeight: optionalFloatField(
    "Chargeable weight"
  ),

  estimatedDeliveryDate: optionalDateField(
    "Estimated delivery date"
  ),

  handedToCourierAt: optionalDateField(
    "Handed to courier date"
  ),

  inTransitAt: optionalDateField(
    "In transit date"
  ),

  deliveredAt: optionalDateField(
    "Delivered date"
  ),

  failedAt: optionalDateField(
    "Failed date"
  ),

  failureReason: z
    .string()
    .max(
      1000,
      "Failure reason must not exceed 1000 characters"
    )
    .optional()
    .nullable(),

  metadata: z
  .custom<Prisma.InputJsonValue>()
  .optional(),

  items: z
    .array(shipmentItemSchema)
    .min(1, "Shipment must contain at least one item"),
};

/* =========================================================
CREATE SHIPMENT
========================================================= */

export const createShipmentSchema = z
  .object({
    ...shipmentBaseSchema,
  })
  .superRefine((data, ctx) => {
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
      data.status === ShipmentStatus.FAILED &&
      !data.failureReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failureReason"],
        message:
          "Failure reason is required when shipment status is FAILED",
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
          "Delivered date is required when shipment is DELIVERED",
      });
    }

    const inTransitStatuses: ShipmentStatus[] = [
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];

    if (
      data.status &&
      inTransitStatuses.includes(data.status) &&
      !data.inTransitAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inTransitAt"],
        message:
          "In transit date is required once shipment is in transit",
      });
    }
  });

/* =========================================================
UPDATE SHIPMENT
========================================================= */

export const updateShipmentSchema = z
  .object({
    fulfillmentId: z
      .string()
      .uuid("Fulfillment ID must be a valid UUID")
      .optional(),

    type: z
      .nativeEnum(ShipmentType, {
        errorMap: () => ({
          message: "Invalid shipment type",
        }),
      })
      .optional(),

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

    returnRequestId: z
      .string()
      .uuid("Return request ID must be a valid UUID")
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

    deliveryFee: decimalField(
      "Delivery fee"
    ).optional(),

    weight: optionalFloatField("Weight"),

    volumetricWeight: optionalFloatField(
      "Volumetric weight"
    ),

    chargeableWeight: optionalFloatField(
      "Chargeable weight"
    ),

    estimatedDeliveryDate: optionalDateField(
      "Estimated delivery date"
    ),

    handedToCourierAt: optionalDateField(
      "Handed to courier date"
    ),

    inTransitAt: optionalDateField(
      "In transit date"
    ),

    deliveredAt: optionalDateField(
      "Delivered date"
    ),

    failedAt: optionalDateField(
      "Failed date"
    ),

    failureReason: z
      .string()
      .max(
        1000,
        "Failure reason must not exceed 1000 characters"
      )
      .optional()
      .nullable(),

    metadata: z.record(z.any()).optional().nullable(),

    items: z
      .array(shipmentItemSchema)
      .optional(),
  })
  .superRefine((data, ctx) => {
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
      data.status === ShipmentStatus.FAILED &&
      !data.failureReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failureReason"],
        message:
          "Failure reason is required when shipment status is FAILED",
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
          "Delivered date is required when shipment is DELIVERED",
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

    failureReason: z
      .string()
      .max(
        1000,
        "Failure reason must not exceed 1000 characters"
      )
      .optional()
      .nullable(),

    handedToCourierAt: optionalDateField(
      "Handed to courier date"
    ),

    inTransitAt: optionalDateField(
      "In transit date"
    ),

    deliveredAt: optionalDateField(
      "Delivered date"
    ),

    failedAt: optionalDateField(
      "Failed date"
    ),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === ShipmentStatus.FAILED &&
      !data.failureReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failureReason"],
        message:
          "Failure reason is required when shipment status is FAILED",
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

export const createShipmentEventSchema =
  z.object({
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
      .max(
        255,
        "Event title must not exceed 255 characters"
      ),

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

export type ShipmentItemInput = z.infer<
  typeof shipmentItemSchema
>;

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