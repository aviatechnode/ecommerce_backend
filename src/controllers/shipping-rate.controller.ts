import type { Request, Response } from 'express'
import { ShippingRateService } from '../services/shipping-rate.service.js'
import { DeliveryMethod } from '@prisma/client'

const shippingRateService = new ShippingRateService()

// ==============================
// SAFE TYPE HELPERS
// ==============================
const toString = (v: unknown): string | undefined => {
  if (Array.isArray(v)) return v[0]
  if (typeof v === 'string') return v
  return undefined
}

const toNumber = (v: unknown): number | undefined => {
  const s = toString(v)
  if (!s) return undefined
  const n = Number(s)
  return Number.isNaN(n) ? undefined : n
}

export class ShippingRateController {
  /**
   * GET ALL RATES FOR A ZONE
   */
  async getZoneRates(req: Request, res: Response) {
    try {
      const zoneId = toString(req.params.zoneId)

      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: 'zoneId is required'
        })
      }

      const rates = await shippingRateService.getZoneRates(zoneId)

      return res.status(200).json({
        success: true,
        data: rates
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch shipping rates'
      })
    }
  }

  /**
   * CALCULATE BEST SHIPPING RATE
   */
  async getBestRate(req: Request, res: Response) {
    try {
      const zoneId = toString(req.body.zoneId)

      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: 'zoneId is required'
        })
      }

      const deliveryMethod = toString(req.body.deliveryMethod)
      const weight = toNumber(req.body.weight)
      const distanceKm = toNumber(req.body.distanceKm)
      const orderValue = toNumber(req.body.orderValue)

      // ✅ build payload safely (no undefined props passed incorrectly)
      const payload: any = { zoneId }

      if (deliveryMethod) {
        payload.deliveryMethod = deliveryMethod as DeliveryMethod
      }

      if (weight !== undefined) {
        payload.weight = weight
      }

      if (distanceKm !== undefined) {
        payload.distanceKm = distanceKm
      }

      if (orderValue !== undefined) {
        payload.orderValue = orderValue
      }

      const result = await shippingRateService.getBestRate(payload)

      return res.status(200).json({
        success: true,
        data: result
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate shipping rate'
      })
    }
  }

  /**
   * CREATE SHIPPING RATE
   */
  async createRate(req: Request, res: Response) {
    try {
      const {
        zoneId,
        name,
        deliveryMethod,
        baseFee,
        currency,
        minWeight,
        maxWeight,
        weightFee,
        minDistanceKm,
        maxDistanceKm,
        distanceFeeKm,
        minOrderValue,
        maxOrderValue,
        estimatedDaysMin,
        estimatedDaysMax,
        priority
      } = req.body

      if (!zoneId || !name || !deliveryMethod || !baseFee) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        })
      }

      const rate = await shippingRateService.createRate({
        zoneId,
        name,
        deliveryMethod: deliveryMethod as DeliveryMethod,
        baseFee: Number(baseFee),
        currency,

        minWeight,
        maxWeight,
        weightFee,

        minDistanceKm,
        maxDistanceKm,
        distanceFeeKm,

        minOrderValue,
        maxOrderValue,

        estimatedDaysMin,
        estimatedDaysMax,

        priority
      })

      return res.status(201).json({
        success: true,
        data: rate
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create shipping rate'
      })
    }
  }

  /**
   * TOGGLE RATE ACTIVE STATUS
   */
  async toggleRate(req: Request, res: Response) {
    try {
      const id = toString(req.params.id)

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'id is required'
        })
      }

      const isActive = Boolean(req.body.isActive)

      const updated = await shippingRateService.toggleRate(id, isActive)

      return res.status(200).json({
        success: true,
        data: updated
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update rate status'
      })
    }
  }

  /**
   * DELETE RATE
   */
  async deleteRate(req: Request, res: Response) {
    try {
      const id = toString(req.params.id)

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'id is required'
        })
      }

      await shippingRateService.deleteRate(id)

      return res.status(200).json({
        success: true,
        message: 'Shipping rate deleted successfully'
      })
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete shipping rate'
      })
    }
  }
}