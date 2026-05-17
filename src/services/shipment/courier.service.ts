import { prisma } from "../../lib/prismadb.js";

import {
  createCourierSchema,
  updateCourierSchema,
  courierIdParamSchema,
} from "../../schemas/shipment/courier.schema.js";

import type {
  CreateCourierInput,
  UpdateCourierInput,
} from "../../schemas/shipment/courier.schema.js";

import {
  normalizeString,
  normalizeEmail,
  buildUpdateData,
  assertUniqueCourier,
} from "../_shared/shippingValidation.helpers.js";

/* =========================================================
COURIER SERVICE
========================================================= */

export class CourierService {
  /* =========================================================
  CREATE COURIER
  ========================================================= */

  static async createCourier(data: unknown) {
    const parsed: CreateCourierInput =
      createCourierSchema.parse(data);

    const normalizedName = normalizeString(parsed.name);

    if (!normalizedName) {
      throw new Error("Courier name is required");
    }

    await assertUniqueCourier({
      name: normalizedName,
    });

    // 🔥 Normalize nullable/optional values safely
    const phone = parsed.phone ?? null;
    const email = parsed.email ?? null;
    const website = parsed.website ?? null;

    const courierData: any = {
      name: normalizedName,
      isActive: parsed.isActive,
    };

    // Only assign if not null/empty after normalization
    const normalizedPhone = phone ? normalizeString(phone) : null;
    const normalizedEmail = email ? normalizeEmail(email) : null;
    const normalizedWebsite = website ? normalizeString(website) : null;

    if (normalizedPhone) courierData.phone = normalizedPhone;
    if (normalizedEmail) courierData.email = normalizedEmail;
    if (normalizedWebsite) courierData.website = normalizedWebsite;

    return prisma.courier.create({
      data: courierData,
      include: {
        rates: true,
        shipments: true,
      },
    });
  }

  /* =========================================================
  GET ALL COURIERS
  ========================================================= */

  static async getAllCouriers() {
    return prisma.courier.findMany({
      include: {
        rates: true,
        shipments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /* =========================================================
  GET COURIER BY ID
  ========================================================= */

  static async getCourierById(id: string) {
    const parsed = courierIdParamSchema.parse({ id });

    const courier = await prisma.courier.findUnique({
      where: {
        id: parsed.id,
      },
      include: {
        rates: true,
        shipments: true,
      },
    });

    if (!courier) {
      throw new Error("Courier not found");
    }

    return courier;
  }

  /* =========================================================
  UPDATE COURIER
  ========================================================= */

  static async updateCourier(id: string, data: unknown) {
    const parsedId = courierIdParamSchema.parse({ id });

    const parsedData: UpdateCourierInput =
      updateCourierSchema.parse(data);

    const existing = await prisma.courier.findUnique({
      where: { id: parsedId.id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Courier not found");
    }

    const normalizedName =
      parsedData.name !== undefined
        ? normalizeString(parsedData.name)
        : undefined;

    if (normalizedName) {
      await assertUniqueCourier({
        name: normalizedName,
        excludeId: parsedId.id,
      });
    }

    const updateData = buildUpdateData({
      name: normalizedName,

      phone:
        parsedData.phone !== undefined
          ? normalizeString(parsedData.phone)
          : undefined,

      email:
        parsedData.email !== undefined
          ? normalizeEmail(parsedData.email)
          : undefined,

      website:
        parsedData.website !== undefined
          ? normalizeString(parsedData.website)
          : undefined,

      isActive: parsedData.isActive,
    });

    return prisma.courier.update({
      where: {
        id: parsedId.id,
      },
      data: updateData,
      include: {
        rates: true,
        shipments: true,
      },
    });
  }

  /* =========================================================
  TOGGLE COURIER STATUS
  ========================================================= */

  static async toggleCourierStatus(id: string) {
    const courier = await this.getCourierById(id);

    return prisma.courier.update({
      where: {
        id: courier.id,
      },
      data: {
        isActive: !courier.isActive,
      },
      include: {
        rates: true,
        shipments: true,
      },
    });
  }

  /* =========================================================
  DELETE COURIER
  ========================================================= */

  static async deleteCourier(id: string) {
    const parsed = courierIdParamSchema.parse({ id });

    const courier = await prisma.courier.findUnique({
      where: {
        id: parsed.id,
      },
      include: {
        rates: {
          select: { id: true },
        },
        shipments: {
          select: { id: true },
        },
      },
    });

    if (!courier) {
      throw new Error("Courier not found");
    }

    if (courier.rates.length > 0) {
      throw new Error("Cannot delete courier with shipping rates");
    }

    if (courier.shipments.length > 0) {
      throw new Error("Cannot delete courier with shipments");
    }

    return prisma.courier.delete({
      where: {
        id: parsed.id,
      },
    });
  }
}