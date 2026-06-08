import { type ShippingRate } from '@prisma/client'

export interface ShippingCalculationParams {
  weight?: number
  distanceKm?: number
  orderValue?: number
}

export class ShippingCalculator {

  static calculateRate(
    rate: ShippingRate,
    params: ShippingCalculationParams
  ): number {

    let fee = Number(rate.baseFee)

    if (params.weight != null && rate.weightFee) {
      const minWeight = rate.minWeight ?? 0
      const extraWeight = Math.max(0, params.weight - minWeight)
      fee += extraWeight * Number(rate.weightFee)
    }

    if (params.distanceKm != null && rate.distanceFeeKm) {
      fee += params.distanceKm * Number(rate.distanceFeeKm)
    }

    return Number(fee.toFixed(2))
  }

  static isEligible(
    rate: ShippingRate,
    params: ShippingCalculationParams
  ): boolean {

    if (params.weight != null) {
      if (rate.minWeight != null && params.weight < rate.minWeight) return false
      if (rate.maxWeight != null && params.weight > rate.maxWeight) return false
    }

    if (params.distanceKm != null) {
      if (rate.minDistanceKm != null && params.distanceKm < rate.minDistanceKm) return false
      if (rate.maxDistanceKm != null && params.distanceKm > rate.maxDistanceKm) return false
    }

    if (params.orderValue != null) {
      const value = params.orderValue
      if (rate.minOrderValue != null && value < Number(rate.minOrderValue)) return false
      if (rate.maxOrderValue != null && value > Number(rate.maxOrderValue)) return false
    }

    return true
  }

  static getEligibleRatesSorted(
    rates: ShippingRate[],
    params: ShippingCalculationParams
  ): ShippingRate[] {

    return rates
      .filter(rate => this.isEligible(rate, params))
      .sort((a, b) =>
        a.priority - b.priority ||
        Number(a.baseFee) - Number(b.baseFee)
      )
  }
}