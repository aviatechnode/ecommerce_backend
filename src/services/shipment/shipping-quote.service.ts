
import { prisma } from "../../lib/prismadb.js";
import {
  type CreateShippingQuoteInput,
  type UpdateShippingQuoteInput,
} from "../../schemas/shipment/shipping-quote.schema.js";

export class ShippingQuoteService {
  static async create(data: CreateShippingQuoteInput) {
    return prisma.shippingQuote.create({
      data: {
        checkoutSessionId: data.checkoutSessionId,

        courierName: data.courierName,
        shippingMethod: data.shippingMethod,
        zoneName: data.zoneName,

        weight: data.weight,
        volumetricWeight: data.volumetricWeight,
        chargeableWeight: data.chargeableWeight,

        baseFee: data.baseFee.toString(),
        surcharges: data.surcharges.toString(),
        totalFee: data.totalFee.toString(),

        estimatedMinDays: data.estimatedMinDays,
        estimatedMaxDays: data.estimatedMaxDays,

        rawCalculation: data.rawCalculation,
      },
      include: {
        checkoutSession: true,
      },
    });
  }

  static async findAll() {
    return prisma.shippingQuote.findMany({
      include: {
        checkoutSession: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async findById(id: string) {
    return prisma.shippingQuote.findUnique({
      where: { id },
      include: {
        checkoutSession: true,
      },
    });
  }

  static async findByCheckoutSession(
    checkoutSessionId: string
  ) {
    return prisma.shippingQuote.findMany({
      where: {
        checkoutSessionId,
      },
      orderBy: {
        totalFee: "asc",
      },
    });
  }

  static async update(
    id: string,
    data: UpdateShippingQuoteInput
  ) {
    return prisma.shippingQuote.update({
      where: { id },
      data: {
        ...(data.checkoutSessionId && {
          checkoutSessionId: data.checkoutSessionId,
        }),

        ...(data.courierName && {
          courierName: data.courierName,
        }),

        ...(data.shippingMethod && {
          shippingMethod: data.shippingMethod,
        }),

        ...(data.zoneName && {
          zoneName: data.zoneName,
        }),

        ...(data.weight !== undefined && {
          weight: data.weight,
        }),

        ...(data.volumetricWeight !== undefined && {
          volumetricWeight: data.volumetricWeight,
        }),

        ...(data.chargeableWeight !== undefined && {
          chargeableWeight: data.chargeableWeight,
        }),

        ...(data.baseFee !== undefined && {
          baseFee: data.baseFee.toString(),
        }),

        ...(data.surcharges !== undefined && {
          surcharges: data.surcharges.toString(),
        }),

        ...(data.totalFee !== undefined && {
          totalFee: data.totalFee.toString(),
        }),

        ...(data.estimatedMinDays !== undefined && {
          estimatedMinDays: data.estimatedMinDays,
        }),

        ...(data.estimatedMaxDays !== undefined && {
          estimatedMaxDays: data.estimatedMaxDays,
        }),

        ...(data.rawCalculation !== undefined && {
          rawCalculation: data.rawCalculation,
        }),
      },
    });
  }

  static async delete(id: string) {
    return prisma.shippingQuote.delete({
      where: { id },
    });
  }
}