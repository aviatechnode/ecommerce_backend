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

export class ShippingRateService {
  /**
   * Create shipping rate
   */
  static async createRate(data: unknown) {
    const parsed = createShippingRateSchema.parse(data);

    await assertExists("courier", parsed.courierId);
    await assertExists("shippingZone", parsed.zoneId);

    assertValidRange(
      parsed.minWeight,
      parsed.maxWeight,
      "Weight range"
    );

    await assertUniqueShippingRate({
      courierId: parsed.courierId,
      zoneId: parsed.zoneId,
      minWeight: parsed.minWeight,
      maxWeight: parsed.maxWeight,
    });

    return prisma.shippingRate.create({
      data: {
        courierId: parsed.courierId,
        zoneId: parsed.zoneId,
        name: parsed.name,
        minWeight: parsed.minWeight,
        maxWeight: parsed.maxWeight,
        baseFee: parsed.baseFee,
        perKgFee: parsed.perKgFee,
        volumetricDivisor: parsed.volumetricDivisor,
        fixedFee: parsed.fixedFee ?? null,
        remoteAreaSurcharge:
          parsed.remoteAreaSurcharge ?? null,
        insurancePercent: parsed.insurancePercent,
        priority: parsed.priority,
        supportsCOD:
          parsed.supportsCOD ?? false,
        isActive: parsed.isActive ?? true,
      },
    });
  }

  /**
   * Get all rates
   */
  static async getAllRates() {
    return prisma.shippingRate.findMany({
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
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
    const { id: rateId } =
      shippingRateIdParamSchema.parse({ id });

    const rate =
      await prisma.shippingRate.findUnique({
        where: { id: rateId },
        include: {
          courier: true,
          zone: true,
        },
      });

    if (!rate) {
      throw new Error("Shipping rate not found");
    }

    return rate;
  }

  /**
   * Update rate
   */
  static async updateRate(
    id: string,
    data: unknown
  ) {
    const { id: rateId } =
      shippingRateIdParamSchema.parse({ id });

    const parsed =
      updateShippingRateSchema.parse(data);

    const existing =
      await prisma.shippingRate.findUnique({
        where: { id: rateId },
      });

    if (!existing) {
      throw new Error("Shipping rate not found");
    }

    const minWeight =
      parsed.minWeight ?? existing.minWeight;

    const maxWeight =
      parsed.maxWeight ?? existing.maxWeight;

    assertValidRange(
      minWeight,
      maxWeight,
      "Weight range"
    );

    await assertUniqueShippingRate({
      courierId: existing.courierId,
      zoneId: existing.zoneId,
      minWeight,
      maxWeight,
      excludeId: rateId,
    });

    const updateData: Record<
      string,
      unknown
    > = {};

    Object.entries(parsed).forEach(
      ([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }
    );

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
    const { id: rateId } =
      shippingRateIdParamSchema.parse({ id });

    const rate =
      await prisma.shippingRate.findUnique({
        where: { id: rateId },
        select: { id: true },
      });

    if (!rate) {
      throw new Error("Shipping rate not found");
    }

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
        minWeight: {
          lte: params.weight,
        },
        maxWeight: {
          gte: params.weight,
        },
      },
      orderBy: [
        { priority: "asc" },
        { baseFee: "asc" },
        { perKgFee: "asc" },
      ],
    });

    if (!rates.length) {
      throw new Error(
        "No shipping rate found for this weight"
      );
    }

    return rates[0];
  }

  /**
   * Calculate shipping fee
   */
  static async calculateRate(params: {
    courierId: string;
    zoneId: string;
    actualWeight: number;
    subtotal: number;
    totalVolume?: number;
    isRemoteArea?: boolean;
  }) {
    const {
      courierId,
      zoneId,
      actualWeight,
      subtotal,
      totalVolume = 0,
      isRemoteArea = false,
    } = params;

    /**
     * Find candidate rates
     */
    const rates = await prisma.shippingRate.findMany({
      where: {
        courierId,
        zoneId,
        isActive: true,
      },
      orderBy: [
        { priority: "asc" },
        { baseFee: "asc" },
      ],
    });

    if (!rates.length) {
      throw new Error("No shipping rate found");
    }

    /**
     * Calculate volumetric weight
     */
    const matchedRates = rates
      .map((rate) => {
        const volumetricWeight =
          totalVolume > 0 &&
          Number(rate.volumetricDivisor) > 0
            ? totalVolume /
              Number(rate.volumetricDivisor)
            : 0;

        const chargeableWeight = Math.max(
          actualWeight,
          volumetricWeight
        );

        return {
          rate,
          volumetricWeight,
          chargeableWeight,
        };
      })
      .filter(
        ({ chargeableWeight, rate }) =>
          chargeableWeight >=
            Number(rate.minWeight) &&
          chargeableWeight <=
            Number(rate.maxWeight)
      );

    if (!matchedRates.length) {
      throw new Error(
        "No shipping rate found for this weight"
      );
    }

    /**
     * Best rate by priority
     */
    const selected = matchedRates[0];

    if (!selected) {
      throw new Error(
        "No shipping rate found for this weight"
      );
    }

    const rate = selected.rate;

    let deliveryFee = Number(rate.baseFee);

    /**
     * Per KG fee
     */
    deliveryFee +=
      Number(rate.perKgFee || 0) *
      selected.chargeableWeight;

    /**
     * Fixed fee
     */
    deliveryFee += Number(rate.fixedFee || 0);

    /**
     * Remote area surcharge
     */
    if (isRemoteArea) {
      deliveryFee += Number(
        rate.remoteAreaSurcharge || 0
      );
    }

    /**
     * Insurance fee
     */
    if (Number(rate.insurancePercent) > 0) {
      deliveryFee +=
        (subtotal *
          Number(rate.insurancePercent)) /
        100;
    }

    return {
      shippingRate: rate,
      deliveryFee,
      actualWeight,
      volumetricWeight:
        selected.volumetricWeight,
      chargeableWeight:
        selected.chargeableWeight,
    };
  }
}