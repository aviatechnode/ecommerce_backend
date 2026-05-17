import type { Coupon } from '@prisma/client'

export interface CartItem {
  productId: string
  variantId: string
  quantity: number
  unitPrice: number
  isOnSale?: boolean
  categoryId: string
}

export interface CartContext {
  userId: string
  items: CartItem[]
  orderSubtotal: number
  orderTotal: number
  isFirstOrder: boolean
  appliedCouponIds?: string[] // for stackable validation
}

export interface DiscountCalculation {
  isValid: boolean
  discountAmount: number
  appliedDiscount?: number
  message?: string
  breakdown?: {
    type: string
    value: number
    cappedAt?: number
  }
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discountAmount?: number
  reasons?: string[]
}