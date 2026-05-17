import { prisma } from "../../lib/prismadb.js";

import {
  createShippingZoneLGASchema,
  updateShippingZoneLGASchema,
  shippingZoneLGAIdParamSchema,
  shippingZoneLGAUniqueSchema,

  type CreateShippingZoneLGAInput,
  type UpdateShippingZoneLGAInput,
  type ShippingZoneLGAUniqueInput,
} from "../../schemas/shipment/shipment.zone.lga.schema.js";

import { validateOrThrow } from "../../utils/validationHelpers.js";

import { ensureZoneLgaUnique } from "../../../prisma/shippingZone.prismaChecks.js";

/* =========================================================
SHIPPING ZONE LGA SERVICE (REFINED)
========================================================= */

export class ShippingZoneLGAService {
  /* =========================================================
  CREATE MAPPING
  ========================================================= */

  static async createMapping(payload: CreateShippingZoneLGAInput) {
    const parsed = await validateOrThrow(
      createShippingZoneLGASchema,
      payload
    );

    const zone = await prisma.shippingZone.findUnique({
      where: { id: parsed.zoneId },
      select: { id: true },
    });

    if (!zone) throw new Error("Shipping zone not found");

    const lga = await prisma.lGA.findUnique({
      where: { id: parsed.lgaId },
      select: { id: true },
    });

    if (!lga) throw new Error("LGA not found");

    // ✅ centralized uniqueness check
    await ensureZoneLgaUnique(parsed.zoneId, parsed.lgaId);

    return prisma.shippingZoneLGA.create({
      data: {
        zoneId: parsed.zoneId,
        lgaId: parsed.lgaId,
      },
      include: {
        zone: true,
        lga: {
          include: { state: true },
        },
      },
    });
  }

  /* =========================================================
  GET ALL
  ========================================================= */

  static async getAllMappings() {
    return prisma.shippingZoneLGA.findMany({
      include: {
        zone: true,
        lga: {
          include: { state: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* =========================================================
  GET BY ID
  ========================================================= */

  static async getMappingById(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneLGAIdParamSchema,
      { id }
    );

    const mapping = await prisma.shippingZoneLGA.findUnique({
      where: { id: parsed.id },
      include: {
        zone: true,
        lga: {
          include: { state: true },
        },
      },
    });

    if (!mapping) throw new Error("Mapping not found");

    return mapping;
  }

  /* =========================================================
  UPDATE
  ========================================================= */

  static async updateMapping(
    id: string,
    payload: UpdateShippingZoneLGAInput
  ) {
    const parsedId = await validateOrThrow(
      shippingZoneLGAIdParamSchema,
      { id }
    );

    const parsedData = await validateOrThrow(
      updateShippingZoneLGASchema,
      payload
    );

    const existing = await prisma.shippingZoneLGA.findUnique({
      where: { id: parsedId.id },
    });

    if (!existing) throw new Error("Mapping not found");

    const zoneId = parsedData.zoneId ?? existing.zoneId;
    const lgaId = parsedData.lgaId ?? existing.lgaId;

    if (parsedData.zoneId) {
      const zone = await prisma.shippingZone.findUnique({
        where: { id: parsedData.zoneId },
        select: { id: true },
      });
      if (!zone) throw new Error("Shipping zone not found");
    }

    if (parsedData.lgaId) {
      const lga = await prisma.lGA.findUnique({
        where: { id: parsedData.lgaId },
        select: { id: true },
      });
      if (!lga) throw new Error("LGA not found");
    }

    // duplicate prevention (safe update check)
    const duplicate = await prisma.shippingZoneLGA.findFirst({
      where: {
        zoneId,
        lgaId,
        NOT: { id: parsedId.id },
      },
    });

    if (duplicate) {
      throw new Error("This mapping already exists");
    }

    return prisma.shippingZoneLGA.update({
      where: { id: parsedId.id },
      data: {
        zoneId,
        lgaId,
      },
      include: {
        zone: true,
        lga: {
          include: { state: true },
        },
      },
    });
  }

  /* =========================================================
  DELETE
  ========================================================= */

  static async deleteMapping(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneLGAIdParamSchema,
      { id }
    );

    const existing = await prisma.shippingZoneLGA.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) throw new Error("Mapping not found");

    return prisma.shippingZoneLGA.delete({
      where: { id: parsed.id },
    });
  }

  /* =========================================================
  CHECK RELATION
  ========================================================= */

  static async isLgaInZone(payload: ShippingZoneLGAUniqueInput) {
    const parsed = await validateOrThrow(
      shippingZoneLGAUniqueSchema,
      payload
    );

    const mapping = await prisma.shippingZoneLGA.findUnique({
      where: {
        zoneId_lgaId: {
          zoneId: parsed.zoneId,
          lgaId: parsed.lgaId,
        },
      },
    });

    return Boolean(mapping);
  }

  /* =========================================================
  BULK ASSIGN
  ========================================================= */

  static async bulkAssignLGAs(payload: {
    zoneId: string;
    lgaIds: string[];
  }) {
    const zoneId = payload.zoneId;
    const lgaIds = [...new Set(payload.lgaIds)];

    if (!lgaIds.length) {
      throw new Error("At least one LGA ID is required");
    }

    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });

    if (!zone) throw new Error("Shipping zone not found");

    // validate format
    lgaIds.forEach((id) => {
      createShippingZoneLGASchema.shape.lgaId.parse(id);
    });

    const existingLGAs = await prisma.lGA.findMany({
      where: { id: { in: lgaIds } },
      select: { id: true },
    });

    const existingSet = new Set(existingLGAs.map((l) => l.id));

    const missing = lgaIds.filter((id) => !existingSet.has(id));

    if (missing.length) {
      throw new Error(`Missing LGAs: ${missing.join(", ")}`);
    }

    return prisma.shippingZoneLGA.createMany({
      data: lgaIds.map((lgaId) => ({
        zoneId,
        lgaId,
      })),
      skipDuplicates: true,
    });
  }

  /* =========================================================
  CLEAR ZONE
  ========================================================= */

  static async clearZone(zoneId: string) {
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });

    if (!zone) throw new Error("Shipping zone not found");

    return prisma.shippingZoneLGA.deleteMany({
      where: { zoneId },
    });
  }

  /* =========================================================
  GET BY ZONE
  ========================================================= */

  static async getLGAsByZone(zoneId: string) {
    createShippingZoneLGASchema.shape.zoneId.parse(zoneId);

    return prisma.shippingZoneLGA.findMany({
      where: { zoneId },
      include: {
        lga: { include: { state: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* =========================================================
  GET BY LGA
  ========================================================= */

  static async getZonesByLGA(lgaId: string) {
    createShippingZoneLGASchema.shape.lgaId.parse(lgaId);

    return prisma.shippingZoneLGA.findMany({
      where: { lgaId },
      include: {
        zone: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}