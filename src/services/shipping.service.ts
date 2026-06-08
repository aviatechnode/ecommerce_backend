import { prisma } from '../lib/prismadb.js'
import { ShippingCalculator } from '../utils/shipping-calculator.util.js'
import { DeliveryMethod, type ShippingRate } from '@prisma/client'

export interface ShippingFeeParams {
  stateId: string
  lgaId?: string
  weight?: number
  distanceKm?: number
  orderValue?: number
  deliveryMethod?: DeliveryMethod
}

export class ShippingService {

  async findZone(params: ShippingFeeParams) {
    const { stateId, lgaId } = params

    const zones = await prisma.shippingZone.findMany({
      where: {
        isActive: true,
        states: { some: { id: stateId } }
      },
      include: {
        states: true,
        lgas: true,
        rates: { where: { isActive: true } }
      }
    })

    if (!zones.length) return null

    if (lgaId) {
      const lgaZone = zones.find(z =>
        z.lgas.some(l => l.id === lgaId)
      )
      if (lgaZone) return lgaZone
    }

    return zones[0]
  }

  async getShippingFee(params: ShippingFeeParams): Promise<number> {
    const zone = await this.findZone(params)

    if (!zone) {
      throw new Error('No shipping zone found for location')
    }

    let rates: ShippingRate[] = zone.rates

    // filter delivery method
    if (params.deliveryMethod) {
      rates = rates.filter(
        r => r.deliveryMethod === params.deliveryMethod
      )
    }

    const eligibleRates = ShippingCalculator.getEligibleRatesSorted(
      rates,
      {
        ...(params.weight !== undefined && { weight: params.weight }),
        ...(params.distanceKm !== undefined && { distanceKm: params.distanceKm }),
        ...(params.orderValue !== undefined && { orderValue: params.orderValue }),
      }
    )

    if (eligibleRates.length === 0) {
      throw new Error('No valid shipping rates for this order')
    }

    const selectedRate = eligibleRates[0]
    if (!selectedRate) {
      throw new Error('Rate selection failed')
    }

    const fee = ShippingCalculator.calculateRate(selectedRate, {
      ...(params.weight !== undefined && { weight: params.weight }),
      ...(params.distanceKm !== undefined && { distanceKm: params.distanceKm }),
      ...(params.orderValue !== undefined && { orderValue: params.orderValue }),
    })

    return fee
  }
}