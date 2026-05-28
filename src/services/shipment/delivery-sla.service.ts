import { prisma } from "../../lib/prismadb.js";
import {
  type CreateDeliverySLAInput,
  type UpdateDeliverySLAInput,
} from "../../schemas/shipment/delivery-sla.schema.js";

/* =========================================================
UTIL: SAFE NULL NORMALIZER
========================================================= */
function toNull<T>(value: T | undefined | null): T | null {
  return value === undefined ? null : value;
}

/* =========================================================
SERVICE
========================================================= */
export class DeliverySLAService {
  static async create(data: CreateDeliverySLAInput) {
    return prisma.deliverySLA.create({
      data: {
        courierId: data.courierId,
        zoneId: data.zoneId,
        shippingMethod: data.shippingMethod,
        minDays: data.minDays,
        maxDays: data.maxDays,

        // FIX: Prisma expects number | null, NOT undefined
        cutoffHour: toNull(data.cutoffHour),

        sameDaySupported: data.sameDaySupported ?? false,
      },
      include: {
        courier: true,
        zone: true,
      },
    });
  }

  static async findAll() {
    return prisma.deliverySLA.findMany({
      include: {
        courier: true,
        zone: true,
      },
      orderBy: {
        minDays: "asc",
      },
    });
  }

  static async findById(id: string) {
    return prisma.deliverySLA.findUnique({
      where: { id },
      include: {
        courier: true,
        zone: true,
      },
    });
  }

  static async findByCourier(courierId: string) {
    return prisma.deliverySLA.findMany({
      where: { courierId },
      include: {
        zone: true,
      },
      orderBy: {
        minDays: "asc",
      },
    });
  }

  static async findByZone(zoneId: string) {
    return prisma.deliverySLA.findMany({
      where: { zoneId },
      include: {
        courier: true,
      },
      orderBy: {
        minDays: "asc",
      },
    });
  }

  static async update(id: string, data: UpdateDeliverySLAInput) {
    return prisma.deliverySLA.update({
      where: { id },

      data: {
        ...(data.courierId && { courierId: data.courierId }),
        ...(data.zoneId && { zoneId: data.zoneId }),
        ...(data.shippingMethod && { shippingMethod: data.shippingMethod }),
        ...(data.minDays !== undefined && { minDays: data.minDays }),
        ...(data.maxDays !== undefined && { maxDays: data.maxDays }),

        // FIX: convert undefined → null OR omit entirely
        ...(data.cutoffHour !== undefined && {
          cutoffHour: data.cutoffHour ?? null,
        }),

        ...(data.sameDaySupported !== undefined && {
          sameDaySupported: data.sameDaySupported,
        }),
      },

      include: {
        courier: true,
        zone: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.deliverySLA.delete({
      where: { id },
    });
  }
}