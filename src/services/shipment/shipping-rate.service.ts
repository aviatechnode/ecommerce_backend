import { prisma } from "../../lib/prismadb.js";

import {
  createShippingRateSchema,
  updateShippingRateSchema,
  shippingRateIdParamSchema,
} from "../../schemas/shipment/schipment.rate.schema.js";

import {
  assertExists,
  assertUniqueShippingRate,
  assertValidRange,
} from "../_shared/shippingValidation.helpers.js";

/* =========================================================
SHIPPING RATE SERVICE (CLEAN VERSION)
========================================================= */

export class ShippingRateService {
  /**
   * Create Shipping Rate
   */
  static async createRate(data: unknown) {
    const parsed = createShippingRateSchema.parse(data);

    await assertExists("courier", parsed.courierId);
    await assertExists("shippingZone", parsed.zoneId);

    await assertUniqueShippingRate({
      courierId: parsed.courierId,
      zoneId: parsed.zoneId,
      minWeight: parsed.minWeight,
      maxWeight: parsed.maxWeight,
    });

    return prisma.shippingRate.create({
      data: {
        ...parsed,
        fixedFee: parsed.fixedFee ?? null,
        remoteAreaSurcharge: parsed.remoteAreaSurcharge ?? null,
        isActive: parsed.isActive ?? true,
        supportsCOD: parsed.supportsCOD ?? false,
      },
    });
  }

  /**
   * Get all rates
   */
  static async getAllRates() {
    return prisma.shippingRate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        courier: true,
        zone: true,
      },
    });
  }

  /**
   * Get rate by ID
   */
  static async getRateById(id: string) {
    const { id: rateId } = shippingRateIdParamSchema.parse({ id });

    const rate = await prisma.shippingRate.findUnique({
      where: { id: rateId },
      include: {
        courier: true,
        zone: true,
      },
    });

    if (!rate) throw new Error("Shipping rate not found");

    return rate;
  }

  /**
   * Update rate (DRY + SAFE)
   */
  static async updateRate(id: string, data: unknown) {
    const { id: rateId } = shippingRateIdParamSchema.parse({ id });
    const parsed = updateShippingRateSchema.parse(data);

    const existing = await prisma.shippingRate.findUnique({
      where: { id: rateId },
    });

    if (!existing) throw new Error("Shipping rate not found");

    const minWeight = parsed.minWeight ?? existing.minWeight;
    const maxWeight = parsed.maxWeight ?? existing.maxWeight;

    const minDays = parsed.estimatedDaysMin ?? existing.estimatedDaysMin;
    const maxDays = parsed.estimatedDaysMax ?? existing.estimatedDaysMax;

    assertValidRange(minWeight, maxWeight, "Weight range");
    assertValidRange(minDays, maxDays, "Estimated days");

    await assertUniqueShippingRate({
      courierId: existing.courierId,
      zoneId: existing.zoneId,
      minWeight,
      maxWeight,
      excludeId: rateId,
    });

    const updateData: any = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    return prisma.shippingRate.update({
      where: { id: rateId },
      data: updateData,
    });
  }

  /**
   * Toggle active status
   */
  static async toggleRateStatus(id: string) {
    const rate = await this.getRateById(id);

    return prisma.shippingRate.update({
      where: { id: rate.id },
      data: {
        isActive: !rate.isActive,
      },
    });
  }

  /**
   * Delete rate
   */
  static async deleteRate(id: string) {
    const { id: rateId } = shippingRateIdParamSchema.parse({ id });

    const rate = await prisma.shippingRate.findUnique({
      where: { id: rateId },
      select: { id: true },
    });

    if (!rate) throw new Error("Shipping rate not found");

    return prisma.shippingRate.delete({
      where: { id: rateId },
    });
  }

  /**
   * Find best rate for shipment
   */
  static async findBestRate(params: {
    courierId: string;
    zoneId: string;
    weight: number;
  }) {
    const rates = await prisma.shippingRate.findMany({
      where: {
        courierId: params.courierId,
        zoneId: params.zoneId,
        isActive: true,
        minWeight: { lte: params.weight },
        maxWeight: { gte: params.weight },
      },
      orderBy: [{ baseFee: "asc" }, { perKgFee: "asc" }],
    });

    if (!rates.length) {
      throw new Error("No shipping rate found for this weight");
    }

    return rates[0];
  }
}