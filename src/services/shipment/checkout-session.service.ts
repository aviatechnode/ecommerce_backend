import { prisma } from "../../lib/prismadb.js";

import {
  type CreateCheckoutSessionInput,
  type UpdateCheckoutSessionInput,
} from "../../schemas/shipment/checkout-session.schema.js";

export class CheckoutSessionService {
  static async create(
    data: CreateCheckoutSessionInput
  ) {
    return prisma.checkoutSession.create({
      data: {
        cartId: data.cartId,

        userId: data.userId,

        ...(data.deliveryLgaId !== undefined && {
          deliveryLgaId: data.deliveryLgaId,
        }),

        subtotal: data.subtotal.toString(),

        deliveryFee: data.deliveryFee.toString(),

        totalAmount: data.totalAmount.toString(),

        expiresAt: data.expiresAt,

        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),

        ...(data.shippingQuoteId !== undefined && {
          shippingQuoteId: data.shippingQuoteId,
        }),
      },

      include: {
        cart: true,

        user: true,

        shippingQuotes: true,

        shippingQuote: true,
      },
    });
  }

  static async findAll() {
    return prisma.checkoutSession.findMany({
      include: {
        cart: true,

        user: true,

        shippingQuotes: true,

        shippingQuote: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async findById(id: string) {
    return prisma.checkoutSession.findUnique({
      where: { id },

      include: {
        cart: true,

        user: true,

        shippingQuotes: true,

        shippingQuote: true,
      },
    });
  }

  static async findByUser(userId: string) {
    return prisma.checkoutSession.findMany({
      where: {
        userId,
      },

      include: {
        cart: true,

        shippingQuotes: true,

        shippingQuote: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async update(
    id: string,
    data: UpdateCheckoutSessionInput
  ) {
    return prisma.checkoutSession.update({
      where: { id },

      data: {
        ...(data.cartId !== undefined && {
          cartId: data.cartId,
        }),

        ...(data.userId !== undefined && {
          userId: data.userId,
        }),

        ...(data.deliveryLgaId !== undefined && {
          deliveryLgaId: data.deliveryLgaId,
        }),

        ...(data.subtotal !== undefined && {
          subtotal: data.subtotal.toString(),
        }),

        ...(data.deliveryFee !== undefined && {
          deliveryFee: data.deliveryFee.toString(),
        }),

        ...(data.totalAmount !== undefined && {
          totalAmount: data.totalAmount.toString(),
        }),

        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt,
        }),

        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),

        ...(data.shippingQuoteId !== undefined && {
          shippingQuoteId: data.shippingQuoteId,
        }),
      },

      include: {
        cart: true,

        user: true,

        shippingQuotes: true,

        shippingQuote: true,
      },
    });
  }

  static async complete(id: string) {
    return prisma.checkoutSession.update({
      where: { id },

      data: {
        completedAt: new Date(),
      },

      include: {
        cart: true,

        user: true,

        shippingQuotes: true,

        shippingQuote: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.checkoutSession.delete({
      where: { id },
    });
  }
}