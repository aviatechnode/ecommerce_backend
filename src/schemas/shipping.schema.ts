import { ShipmentStatus } from "@prisma/client";
import { z } from "zod";

//////////////////////////////////////////////////////////
// COURIER
//////////////////////////////////////////////////////////

const createCourierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

//////////////////////////////////////////////////////////
// SHIPPING RATE
//////////////////////////////////////////////////////////

const createShippingRateSchema = z.object({
  courierId: z.string().uuid(),

  originState: z.string(),
  destinationState: z.string(),

  baseFee: z.number().positive(),
  perKgFee: z.number().positive(),
});

//////////////////////////////////////////////////////////
// SHIPPING ZONE
//////////////////////////////////////////////////////////

const createShippingZoneSchema = z.object({
  courierId: z.string().uuid(),
  state: z.string(),
  lga: z.string().optional(),
});

//////////////////////////////////////////////////////////
// SHIPMENT CREATION
//////////////////////////////////////////////////////////

const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  courierId: z.string().uuid().optional(),
  trackingNo: z.string().optional(),
});

//////////////////////////////////////////////////////////
// SHIPMENT STATUS UPDATE
//////////////////////////////////////////////////////////

const updateShipmentStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
});

export {
  createCourierSchema, 
  createShippingRateSchema, 
  createShippingZoneSchema, 
  createShipmentSchema,
updateShipmentStatusSchema}