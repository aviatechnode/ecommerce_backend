import { prisma } from "../../lib/prismadb.js";

import {
  createShippingZoneSchema,
  updateShippingZoneSchema,
  shippingZoneIdParamSchema,
} from "../../schemas/shipment/shipment.zone.schema.js";

import { validateOrThrow } from "../../utils/validationHelpers.js";

import {
  ensureShippingZoneUnique,
} from "../../../prisma/shippingZone.prismaChecks.js";

/* =========================================================
SHIPPING ZONE SERVICE (REFINED)
========================================================= */

export class ShippingZoneService {
  /* =========================================================
  CREATE
  ========================================================= */

  static async create(data: unknown) {
    const parsed = await validateOrThrow(
      createShippingZoneSchema,
      data
    );

    // ✅ centralized uniqueness check (name + code)
    await ensureShippingZoneUnique({
      name: parsed.name,
      code: parsed.code,
    });

    return prisma.shippingZone.create({
      data: {
        name: parsed.name,
        code: parsed.code,
        description: parsed.description ?? null,
        isActive: parsed.isActive ?? true,
      },
    });
  }

  /* =========================================================
  GET ALL
  ========================================================= */

  static async getAll() {
    return prisma.shippingZone.findMany({
      include: {
        states: true,
        lgas: true,
        rates: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* =========================================================
  GET BY ID
  ========================================================= */

  static async getById(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneIdParamSchema,
      { id }
    );

    const zone = await prisma.shippingZone.findUnique({
      where: { id: parsed.id },
      include: {
        states: true,
        lgas: true,
        rates: true,
      },
    });

    if (!zone) throw new Error("Shipping zone not found");

    return zone;
  }

  /* =========================================================
  UPDATE
  ========================================================= */

  static async update(id: string, data: unknown) {
    const parsedId = await validateOrThrow(
      shippingZoneIdParamSchema,
      { id }
    );

    const parsedData = await validateOrThrow(
      updateShippingZoneSchema,
      data
    );

    const existing = await prisma.shippingZone.findUnique({
      where: { id: parsedId.id },
    });

    if (!existing) throw new Error("Shipping zone not found");

    // 🔥 PREVENT DUPLICATES (clean + scalable)
    const name = parsedData.name ?? undefined;
    const code = parsedData.code ?? undefined;

    if (name || code) {
      const duplicate = await prisma.shippingZone.findFirst({
        where: {
          OR: [
            name ? { name } : undefined,
            code ? { code } : undefined,
          ].filter(Boolean) as any,
          NOT: { id: parsedId.id },
        },
      });

      if (duplicate) {
        throw new Error("Zone name or code already in use");
      }
    }

    return prisma.shippingZone.update({
      where: { id: parsedId.id },
      data: {
        ...(parsedData.name !== undefined && {
          name: parsedData.name,
        }),
        ...(parsedData.code !== undefined && {
          code: parsedData.code,
        }),
        ...(parsedData.description !== undefined && {
          description: parsedData.description,
        }),
        ...(parsedData.isActive !== undefined && {
          isActive: parsedData.isActive,
        }),
      },
    });
  }

  /* =========================================================
  DELETE
  ========================================================= */

  static async delete(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneIdParamSchema,
      { id }
    );

    const zone = await prisma.shippingZone.findUnique({
      where: { id: parsed.id },
      select: { id: true },
    });

    if (!zone) throw new Error("Shipping zone not found");

    return prisma.shippingZone.delete({
      where: { id: parsed.id },
    });
  }

  /* =========================================================
  TOGGLE STATUS
  ========================================================= */

  static async toggleStatus(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneIdParamSchema,
      { id }
    );

    const zone = await prisma.shippingZone.findUnique({
      where: { id: parsed.id },
      select: { isActive: true },
    });

    if (!zone) throw new Error("Shipping zone not found");

    return prisma.shippingZone.update({
      where: { id: parsed.id },
      data: {
        isActive: !zone.isActive,
      },
    });
  }

  /* =========================================================
  ACTIVE ZONES
  ========================================================= */

  static async getActiveZones() {
    return prisma.shippingZone.findMany({
      where: { isActive: true },
      include: {
        states: true,
        lgas: true,
      },
    });
  }
}