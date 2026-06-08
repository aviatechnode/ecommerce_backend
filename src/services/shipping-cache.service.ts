import { DeliveryMethod } from '@prisma/client'
import { prisma } from '../lib/prismadb.js'
import crypto from 'crypto'

export interface QuoteParams {
  zoneId: string
  deliveryMethod?: DeliveryMethod
  weight?: number
  distanceKm?: number
  orderValue?: number
}

export class ShippingCacheService {
  private static generateHash(params: QuoteParams): string {
    const data = {
      zoneId: params.zoneId,
      deliveryMethod: params.deliveryMethod || DeliveryMethod.STANDARD,
      weight: params.weight ? Math.round(params.weight * 100) : 0,
      distanceKm: params.distanceKm ? Math.round(params.distanceKm) : 0,
      orderValue: params.orderValue ? Math.round(params.orderValue * 100) : 0
    }

    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
  }

  static async getCachedQuote(params: QuoteParams) {
    const hash = this.generateHash(params)

    return prisma.shippingQuoteCache.findFirst({
      where: {
        hash,
        expiresAt: {
          gt: new Date()
        }
      }
    })
  }

  static async cacheQuote(
    params: QuoteParams,
    fee: number,
    currency: string = 'NGN',
    ttlSeconds: number = 3600
  ) {
    const hash = this.generateHash(params)
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

    return prisma.shippingQuoteCache.upsert({
      where: { hash },
      update: {
        fee,
        currency,
        expiresAt,
        zoneId: params.zoneId,
        deliveryMethod: params.deliveryMethod || DeliveryMethod.STANDARD
      },
      create: {
        hash,
        fee,
        currency,
        expiresAt,
        zoneId: params.zoneId,
        deliveryMethod: params.deliveryMethod || DeliveryMethod.STANDARD
      }
    })
  }

  static async cleanupExpiredCache() {
    return prisma.shippingQuoteCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }
}