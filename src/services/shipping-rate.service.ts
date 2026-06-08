import { prisma } from '../lib/prismadb.js'
import { ShippingCalculator } from '../utils/shipping-calculator.util.js'
import { DeliveryMethod, type ShippingRate } from '@prisma/client'

/* =========================================================
   TYPES
========================================================= */

export interface ShippingRateQuery {
  zoneId: string
  deliveryMethod?: DeliveryMethod
  weight?: number
  distanceKm?: number
  orderValue?: number
}

export interface ShippingFeeResult {
  fee: number
  currency: string
  rate: ShippingRate
}

/* =========================================================
   SERVICE
========================================================= */

export class ShippingRateService {

  /**
   * GET ALL VALID RATES FOR A ZONE
   */
  async getZoneRates(zoneId: string) {
    return prisma.shippingRate.findMany({
      where: {
        zoneId,
        isActive: true
      }
    })
  }

  /**
   * FILTER ELIGIBLE RATES
   */
  private filterRates(
    rates: ShippingRate[],
    params: ShippingRateQuery
  ): ShippingRate[] {

    let filtered = params.deliveryMethod
      ? rates.filter(r => r.deliveryMethod === params.deliveryMethod)
      : rates

    filtered = ShippingCalculator.getEligibleRatesSorted(
      filtered,
      {
        ...(params.weight !== undefined && { weight: params.weight }),
        ...(params.distanceKm !== undefined && { distanceKm: params.distanceKm }),
        ...(params.orderValue !== undefined && { orderValue: params.orderValue })
      }
    )

    return filtered
  }

  /**
   * GET BEST RATE FOR A ZONE
   */
  async getBestRate(params: ShippingRateQuery): Promise<ShippingFeeResult> {

    const rates = await this.getZoneRates(params.zoneId)

    if (!rates.length) {
      throw new Error('No shipping rates found for zone')
    }

    const eligibleRates = this.filterRates(rates, params)

    if (!eligibleRates.length) {
      throw new Error('No eligible shipping rates for this request')
    }

    const selectedRate = eligibleRates[0]

    if (!selectedRate) {
      throw new Error('Rate selection failed')
    }

    const fee = ShippingCalculator.calculateRate(selectedRate, {
      ...(params.weight !== undefined && { weight: params.weight }),
      ...(params.distanceKm !== undefined && { distanceKm: params.distanceKm }),
      ...(params.orderValue !== undefined && { orderValue: params.orderValue })
    })

    return {
      fee,
      currency: selectedRate.currency,
      rate: selectedRate
    }
  }

  /**
   * CREATE SHIPPING RATE (FIXED FOR exactOptionalPropertyTypes)
   */
  async createRate(data: {
    zoneId: string
    name: string
    deliveryMethod: DeliveryMethod
    baseFee: number
    currency?: string

    minWeight?: number
    maxWeight?: number
    weightFee?: number

    minDistanceKm?: number
    maxDistanceKm?: number
    distanceFeeKm?: number

    minOrderValue?: number
    maxOrderValue?: number

    estimatedDaysMin?: number
    estimatedDaysMax?: number

    priority?: number
  }) {

    return prisma.shippingRate.create({
      data: {
        zoneId: data.zoneId,
        name: data.name,
        deliveryMethod: data.deliveryMethod,
        baseFee: data.baseFee,
        currency: data.currency ?? 'NGN',

        // IMPORTANT: convert undefined → null-safe OR omit
        ...(data.minWeight !== undefined && { minWeight: data.minWeight }),
        ...(data.maxWeight !== undefined && { maxWeight: data.maxWeight }),
        ...(data.weightFee !== undefined && { weightFee: data.weightFee }),

        ...(data.minDistanceKm !== undefined && { minDistanceKm: data.minDistanceKm }),
        ...(data.maxDistanceKm !== undefined && { maxDistanceKm: data.maxDistanceKm }),
        ...(data.distanceFeeKm !== undefined && { distanceFeeKm: data.distanceFeeKm }),

        ...(data.minOrderValue !== undefined && { minOrderValue: data.minOrderValue }),
        ...(data.maxOrderValue !== undefined && { maxOrderValue: data.maxOrderValue }),

        ...(data.estimatedDaysMin !== undefined && { estimatedDaysMin: data.estimatedDaysMin }),
        ...(data.estimatedDaysMax !== undefined && { estimatedDaysMax: data.estimatedDaysMax }),

        priority: data.priority ?? 1,
        isActive: true
      }
    })
  }

  /**
   * TOGGLE RATE STATUS
   */
  async toggleRate(id: string, isActive: boolean) {
    return prisma.shippingRate.update({
      where: { id },
      data: { isActive }
    })
  }

  /**
   * DELETE RATE
   */
  async deleteRate(id: string) {
    return prisma.shippingRate.delete({
      where: { id }
    })
  }
}