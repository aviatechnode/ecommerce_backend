import { z } from "zod";
import { ShippingMethod } from "@prisma/client";

//////////////////////////////////////////////////////////
// COMMON HELPERS
//////////////////////////////////////////////////////////

const cuidOrUuidSchema = z.string().min(1, "ID is required");

const optionalStringSchema = z
  .string()
  .trim()
  .min(1)
  .optional();

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .optional();

const coordinateSchema = z
  .number({
    invalid_type_error: "Coordinate must be a number",
  })
  .finite()
  .optional();

//////////////////////////////////////////////////////////
// BASE PICKUP STATION SCHEMA
//////////////////////////////////////////////////////////

const pickupStationBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Pickup station name must be at least 2 characters")
    .max(150, "Pickup station name is too long"),

  courierId: cuidOrUuidSchema,

  stateId: cuidOrUuidSchema,

  lgaId: cuidOrUuidSchema,

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(1000, "Address is too long"),

  landmark: optionalStringSchema,

  phone: phoneSchema,

  latitude: coordinateSchema,

  longitude: coordinateSchema,

  openingHours: optionalStringSchema,

  isActive: z.boolean().optional().default(true),
});

//////////////////////////////////////////////////////////
// PICKUP STATION SCHEMA
//////////////////////////////////////////////////////////

export const pickupStationSchema = pickupStationBaseSchema.superRefine(
  (data, ctx) => {
    //////////////////////////////////////////////////////////
    // LAT/LONG VALIDATION
    //////////////////////////////////////////////////////////

    const hasLatitude = typeof data.latitude === "number";
    const hasLongitude = typeof data.longitude === "number";

    if (hasLatitude && !hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["longitude"],
        message: "Longitude is required when latitude is provided",
      });
    }

    if (hasLongitude && !hasLatitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latitude"],
        message: "Latitude is required when longitude is provided",
      });
    }

    //////////////////////////////////////////////////////////
    // COORDINATE RANGE VALIDATION
    //////////////////////////////////////////////////////////

    if (
      typeof data.latitude === "number" &&
      (data.latitude < -90 || data.latitude > 90)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latitude"],
        message: "Latitude must be between -90 and 90",
      });
    }

    if (
      typeof data.longitude === "number" &&
      (data.longitude < -180 || data.longitude > 180)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["longitude"],
        message: "Longitude must be between -180 and 180",
      });
    }
  }
);

//////////////////////////////////////////////////////////
// UPDATE PICKUP STATION
//////////////////////////////////////////////////////////

export const updatePickupStationSchema =
  pickupStationBaseSchema
    .partial()
    .refine(
      (data: Record<string, unknown>) =>
        Object.keys(data).length > 0,
      {
        message: "At least one field is required for update",
      }
    )
    .superRefine((data, ctx) => {
      const hasLatitude = typeof data.latitude === "number";
      const hasLongitude = typeof data.longitude === "number";

      if (hasLatitude && !hasLongitude) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["longitude"],
          message: "Longitude is required when latitude is provided",
        });
      }

      if (hasLongitude && !hasLatitude) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["latitude"],
          message: "Latitude is required when longitude is provided",
        });
      }

      if (
        typeof data.latitude === "number" &&
        (data.latitude < -90 || data.latitude > 90)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["latitude"],
          message: "Latitude must be between -90 and 90",
        });
      }

      if (
        typeof data.longitude === "number" &&
        (data.longitude < -180 || data.longitude > 180)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["longitude"],
          message: "Longitude must be between -180 and 180",
        });
      }
    });

//////////////////////////////////////////////////////////
// PICKUP STATION PARAMS
//////////////////////////////////////////////////////////

export const pickupStationIdParamSchema = z.object({
  id: cuidOrUuidSchema,
});

//////////////////////////////////////////////////////////
// SHIPMENT DELIVERY
//////////////////////////////////////////////////////////

export const shipmentDeliverySchema = z
  .object({
    shippingMethod: z.nativeEnum(ShippingMethod),

    pickupStationId: cuidOrUuidSchema.optional(),
  })
  .superRefine((data, ctx) => {
    //////////////////////////////////////////////////////////
    // PICKUP STATION REQUIRED
    //////////////////////////////////////////////////////////

    if (
      data.shippingMethod ===
        ShippingMethod.PICKUP_STATION &&
      !data.pickupStationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupStationId"],
        message:
          "Pickup station is required for pickup station delivery",
      });
    }

    //////////////////////////////////////////////////////////
    // PREVENT INVALID PICKUP STATION USAGE
    //////////////////////////////////////////////////////////

    if (
      data.shippingMethod !==
        ShippingMethod.PICKUP_STATION &&
      data.pickupStationId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupStationId"],
        message:
          "Pickup station can only be used with PICKUP_STATION shipping method",
      });
    }
  });

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

export type CreatePickupStationDTO = z.infer<
  typeof pickupStationSchema
>;

export type UpdatePickupStationDTO = z.infer<
  typeof updatePickupStationSchema
>;

export type ShipmentDeliveryDTO = z.infer<
  typeof shipmentDeliverySchema
>;

export type PickupStationIdParamDTO = z.infer<
  typeof pickupStationIdParamSchema
>;