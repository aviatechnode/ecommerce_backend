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
} from "../../chat/_shared/shippingValidation.helpers.js";

type ShippingRateRecord =
  Awaited<
    ReturnType<
      typeof prisma.shippingRate.findFirst
    >
  >;

export class ShippingRateService {
  /**
   * Shared shipping fee calculator
   */
  private static computeDeliveryFee(params: {
    rate: NonNullable<ShippingRateRecord>;
    chargeableWeight: number;
    subtotal: number;
    isRemoteArea: boolean;
  }) {
    const {
      rate,
      chargeableWeight,
      subtotal,
      isRemoteArea,
    } = params;

    let fee = Number(rate.baseFee);

    fee +=
      Number(rate.perKgFee || 0) *
      chargeableWeight;

    fee += Number(rate.fixedFee || 0);

    if (isRemoteArea) {
      fee += Number(
        rate.remoteAreaSurcharge || 0
      );
    }

    if (Number(rate.insurancePercent) > 0) {
      fee +=
        (subtotal *
          Number(rate.insurancePercent)) /
        100;
    }

    return Number(fee.toFixed(2));
  }

  /**
   * Create shipping rate
   */
  static async createRate(data: unknown) {
    const parsed =
      createShippingRateSchema.parse(data);

    await assertExists(
      "courier",
      parsed.courierId
    );

    await assertExists(
      "shippingZone",
      parsed.zoneId
    );

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
        volumetricDivisor:
          parsed.volumetricDivisor,
        fixedFee:
          parsed.fixedFee ?? null,
        remoteAreaSurcharge:
          parsed.remoteAreaSurcharge ??
          null,
        insurancePercent:
          parsed.insurancePercent,
        priority: parsed.priority,
        supportsCOD:
          parsed.supportsCOD ?? false,
        isActive:
          parsed.isActive ?? true,
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
   * Get rate by id
   */
  static async getRateById(id: string) {
    const { id: rateId } =
      shippingRateIdParamSchema.parse({
        id,
      });

    const rate =
      await prisma.shippingRate.findUnique({
        where: {
          id: rateId,
        },
        include: {
          courier: true,
          zone: true,
        },
      });

    if (!rate) {
      throw new Error(
        "Shipping rate not found"
      );
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
      shippingRateIdParamSchema.parse({
        id,
      });

    const parsed =
      updateShippingRateSchema.parse(data);

    const existing =
      await prisma.shippingRate.findUnique({
        where: {
          id: rateId,
        },
      });

    if (!existing) {
      throw new Error(
        "Shipping rate not found"
      );
    }

    const minWeight =
      parsed.minWeight ??
      existing.minWeight;

    const maxWeight =
      parsed.maxWeight ??
      existing.maxWeight;

    assertValidRange(
      minWeight,
      maxWeight,
      "Weight range"
    );

    await assertUniqueShippingRate({
      courierId:
        existing.courierId,
      zoneId:
        existing.zoneId,
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
      where: {
        id: rateId,
      },
      data: updateData,
    });
  }

  /**
   * Toggle active state
   */
  static async toggleRateStatus(
    id: string
  ) {
    const rate =
      await this.getRateById(id);

    return prisma.shippingRate.update({
      where: {
        id: rate.id,
      },
      data: {
        isActive:
          !rate.isActive,
      },
    });
  }

  /**
   * Delete rate
   */
  static async deleteRate(id: string) {
    const { id: rateId } =
      shippingRateIdParamSchema.parse({
        id,
      });

    const rate =
      await prisma.shippingRate.findUnique({
        where: {
          id: rateId,
        },
        select: {
          id: true,
        },
      });

    if (!rate) {
      throw new Error(
        "Shipping rate not found"
      );
    }

    return prisma.shippingRate.delete({
      where: {
        id: rateId,
      },
    });
  }

  /**
   * Find cheapest rate
   */
  static async findBestRate(params: {
    courierId: string;
    zoneId: string;
    weight: number;
  }) {
    const rates =
      await prisma.shippingRate.findMany({
        where: {
          courierId:
            params.courierId,
          zoneId:
            params.zoneId,
          isActive: true,
          minWeight: {
            lte: params.weight,
          },
          maxWeight: {
            gte: params.weight,
          },
        },
      });

    if (!rates.length) {
      throw new Error(
        "No shipping rate found"
      );
    }

    const sortedRates = rates
      .map((rate) => ({
        rate,
        estimatedFee:
          this.computeDeliveryFee({
            rate,
            chargeableWeight:
              params.weight,
            subtotal: 0,
            isRemoteArea: false,
          }),
      }))
      .sort((a, b) => {
        if (
          a.estimatedFee !==
          b.estimatedFee
        ) {
          return (
            a.estimatedFee -
            b.estimatedFee
          );
        }

        if (
          a.rate.priority !==
          b.rate.priority
        ) {
          return (
            a.rate.priority -
            b.rate.priority
          );
        }

        return (
          Number(a.rate.baseFee) -
          Number(b.rate.baseFee)
        );
      });

    const cheapest =
      sortedRates.at(0);

    if (!cheapest) {
      throw new Error(
        "No shipping rate found"
      );
    }

    return cheapest.rate;
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

    const rates =
      await prisma.shippingRate.findMany({
        where: {
          courierId,
          zoneId,
          isActive: true,
        },
      });

    if (!rates.length) {
      throw new Error(
        "No shipping rate found"
      );
    }

    const matchedRates = rates
      .map((rate) => {
        const volumetricWeight =
          totalVolume > 0 &&
          Number(
            rate.volumetricDivisor
          ) > 0
            ? totalVolume /
              Number(
                rate.volumetricDivisor
              )
            : 0;

        const chargeableWeight =
          Math.max(
            actualWeight,
            volumetricWeight
          );

        return {
          rate,
          deliveryFee:
            this.computeDeliveryFee({
              rate,
              chargeableWeight,
              subtotal,
              isRemoteArea,
            }),
          volumetricWeight,
          chargeableWeight,
        };
      })
      .filter(
        ({
          rate,
          chargeableWeight,
        }) =>
          chargeableWeight >=
            Number(
              rate.minWeight
            ) &&
          chargeableWeight <=
            Number(
              rate.maxWeight
            )
      );

    if (!matchedRates.length) {
      throw new Error(
        "No shipping rate found for this weight"
      );
    }

    const selected =
      [...matchedRates].sort(
        (a, b) => {
          if (
            a.deliveryFee !==
            b.deliveryFee
          ) {
            return (
              a.deliveryFee -
              b.deliveryFee
            );
          }

          if (
            a.rate.priority !==
            b.rate.priority
          ) {
            return (
              a.rate.priority -
              b.rate.priority
            );
          }

          return (
            Number(
              a.rate.baseFee
            ) -
            Number(
              b.rate.baseFee
            )
          );
        }
      ).at(0);

    if (!selected) {
      throw new Error(
        "No shipping rate found"
      );
    }

    return {
      shippingRate:
        selected.rate,
      deliveryFee:
        selected.deliveryFee,
      actualWeight,
      volumetricWeight:
        selected.volumetricWeight,
      chargeableWeight:
        selected.chargeableWeight,
    };
  }
}