import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

const calculateShippingSchema = z.object({
  country: z.string().min(1),
  state: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  weight: z.number().positive().optional(),
  distanceKm: z.number().positive().optional(),
  orderValue: z.number().positive().optional(),
  deliveryMethod: z.enum(['DOOR_DELIVERY', 'PICKUP_STATION', 'EXPRESS']).optional(),
  courierId: z.string().optional()
})

const createShipmentSchema = z.object({
  orderId: z.string().min(1),
  courierId: z.string().optional(),
  deliveryMethod: z.enum(['DOOR_DELIVERY', 'PICKUP_STATION', 'EXPRESS']),
  shippingFee: z.number().positive(),
  weight: z.number().positive().optional(),
  distanceKm: z.number().positive().optional(),
  addressSnapshot: z.object({}).passthrough(),
  estimatedDelivery: z.string().datetime().optional()
})

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
})

const createZoneSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['LOCAL', 'STATE', 'NATIONAL', 'INTERNATIONAL']),
  countries: z.array(z.string()),
  states: z.array(z.string()),
  cities: z.array(z.string()),
  postalCodes: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
})

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      })
    }
  }
}

export const validationSchemas = {
  calculateShipping: calculateShippingSchema,
  createShipment: createShipmentSchema,
  updateStatus: updateStatusSchema,
  createZone: createZoneSchema
}