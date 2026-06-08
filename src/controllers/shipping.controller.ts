import type { Request, Response } from 'express'
import { prisma } from '../lib/prismadb.js'
import { ShippingCacheService, type QuoteParams } from '../services/shipping-cache.service.js'
import { DeliveryMethod, ShipmentStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

export class ShippingController {

  // -------------------------
  // CALCULATE SHIPPING FEE
  // -------------------------
  async calculateShippingFee(req: Request, res: Response) {
    try {
      const {
        zoneId,
        deliveryMethod,
        weight,
        distanceKm,
        orderValue
      } = req.body

      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: 'zoneId is required'
        })
      }

      const params: QuoteParams = {
    zoneId,

    ...(deliveryMethod !== undefined && {
        deliveryMethod: deliveryMethod as DeliveryMethod
    }),

    ...(weight !== undefined && {
        weight: Number(weight)
    }),

    ...(distanceKm !== undefined && {
        distanceKm: Number(distanceKm)
    }),

    ...(orderValue !== undefined && {
        orderValue: Number(orderValue)
    })
    }

      // 1. Check cache first
      const cached = await ShippingCacheService.getCachedQuote(params)

      if (cached) {
        return res.json({
          success: true,
          cached: true,
          data: {
            fee: Number(cached.fee),
            currency: cached.currency
          }
        })
      }

      // 2. Load zone
      const zone = await prisma.shippingZone.findUnique({
        where: { id: zoneId },
        include: { rates: true }
      })

      if (!zone || !zone.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Shipping zone not found or inactive'
        })
      }

      // 3. Select rate
      const rate = zone.rates
        .filter(r => r.isActive)
        .filter(r =>
          !deliveryMethod || r.deliveryMethod === deliveryMethod
        )
        .sort((a, b) => a.priority - b.priority)[0]

      if (!rate) {
        return res.status(404).json({
          success: false,
          message: 'No shipping rate found'
        })
      }

      // 4. Calculate fee
      let fee = Number(rate.baseFee)

      if (weight !== undefined && rate.weightFee) {
        fee += Number(weight) * Number(rate.weightFee)
      }

      if (distanceKm !== undefined && rate.distanceFeeKm) {
        fee += Number(distanceKm) * Number(rate.distanceFeeKm)
      }

      if (
        orderValue !== undefined &&
        rate.minOrderValue &&
        Number(orderValue) >= Number(rate.minOrderValue)
      ) {
        fee = Math.max(0, fee - 200)
      }

      fee = Number(fee.toFixed(2))

      // 5. Cache result
      await ShippingCacheService.cacheQuote(params, fee, rate.currency)

      return res.json({
        success: true,
        cached: false,
        data: {
          fee,
          currency: rate.currency,
          deliveryMethod: rate.deliveryMethod,
          estimatedDays: {
            min: rate.estimatedDaysMin,
            max: rate.estimatedDaysMax
          }
        }
      })

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  // -------------------------
  // GET AVAILABLE METHODS
  // -------------------------
  async getAvailableMethods(req: Request, res: Response) {
    try {
      const { zoneId } = req.query

      if (!zoneId || typeof zoneId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'zoneId is required'
        })
      }

      const methods = await prisma.shippingRate.findMany({
        where: {
          zoneId,
          isActive: true
        },
        select: {
          deliveryMethod: true
        },
        distinct: ['deliveryMethod']
      })

      return res.json({
        success: true,
        data: methods.map(m => m.deliveryMethod)
      })

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
}