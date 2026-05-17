import { prisma } from "../../lib/prismadb.js";

import {
  createShippingZoneStateSchema,
  updateShippingZoneStateSchema,
  shippingZoneStateIdParamSchema,
  shippingZoneStateUniqueSchema,

  type CreateShippingZoneStateInput,
  type UpdateShippingZoneStateInput,
  type ShippingZoneStateUniqueInput,
} from "../../schemas/shipment/shipment.zone.state.js";

import {
  validateOrThrow,
} from "../../utils/validationHelpers.js";

import {
  ensureZoneStateUnique,
} from "../../../prisma/shippingZone.prismaChecks.js";

/* =========================================================
SHIPPING ZONE STATE SERVICE (REFINED)
========================================================= */

export class ShippingZoneStateService {
  /**
   * Assign State to Shipping Zone
   */
  static async createMapping(payload: CreateShippingZoneStateInput) {
    const parsed = await validateOrThrow(
      createShippingZoneStateSchema,
      payload
    );

    // ensure zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: parsed.zoneId },
    });

    if (!zone) throw new Error("Shipping zone not found");

    // ensure state exists
    const state = await prisma.state.findUnique({
      where: { id: parsed.stateId },
    });

    if (!state) throw new Error("State not found");

    // ✅ centralized uniqueness check (replaces manual query)
    await ensureZoneStateUnique(parsed.zoneId, parsed.stateId);

    return prisma.shippingZoneState.create({
      data: {
        zoneId: parsed.zoneId,
        stateId: parsed.stateId,
      },
      include: {
        zone: true,
        state: true,
      },
    });
  }

  /**
   * Get all mappings
   */
  static async getAllMappings() {
    return prisma.shippingZoneState.findMany({
      include: {
        zone: true,
        state: true,
      },
      orderBy: { id: "desc" },
    });
  }

  /**
   * Get mapping by ID
   */
  static async getMappingById(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneStateIdParamSchema,
      { id }
    );

    const mapping = await prisma.shippingZoneState.findUnique({
      where: { id: parsed.id },
      include: {
        zone: true,
        state: true,
      },
    });

    if (!mapping) throw new Error("Mapping not found");

    return mapping;
  }

  /**
   * Update mapping
   */
  static async updateMapping(
    id: string,
    payload: UpdateShippingZoneStateInput
  ) {
    const parsedId = await validateOrThrow(
      shippingZoneStateIdParamSchema,
      { id }
    );

    const parsedData = await validateOrThrow(
      updateShippingZoneStateSchema,
      payload
    );

    const existing = await prisma.shippingZoneState.findUnique({
      where: { id: parsedId.id },
    });

    if (!existing) throw new Error("Mapping not found");

    const zoneId = parsedData.zoneId ?? existing.zoneId;
    const stateId = parsedData.stateId ?? existing.stateId;

    // ensure zone exists (if changed)
    if (parsedData.zoneId) {
      const zone = await prisma.shippingZone.findUnique({
        where: { id: parsedData.zoneId },
      });
      if (!zone) throw new Error("Shipping zone not found");
    }

    // ensure state exists (if changed)
    if (parsedData.stateId) {
      const state = await prisma.state.findUnique({
        where: { id: parsedData.stateId },
      });
      if (!state) throw new Error("State not found");
    }

    // ❌ replace manual duplicate check with Prisma-safe logic
    const duplicate = await prisma.shippingZoneState.findFirst({
      where: {
        zoneId,
        stateId,
        NOT: { id: parsedId.id },
      },
    });

    if (duplicate) {
      throw new Error("This mapping already exists");
    }

    return prisma.shippingZoneState.update({
      where: { id: parsedId.id },
      data: {
        zoneId,
        stateId,
      },
      include: {
        zone: true,
        state: true,
      },
    });
  }

  /**
   * Delete mapping
   */
  static async deleteMapping(id: string) {
    const parsed = await validateOrThrow(
      shippingZoneStateIdParamSchema,
      { id }
    );

    const existing = await prisma.shippingZoneState.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) throw new Error("Mapping not found");

    return prisma.shippingZoneState.delete({
      where: { id: parsed.id },
    });
  }

  /**
   * Check if state belongs to zone
   */
  static async isStateInZone(payload: ShippingZoneStateUniqueInput) {
    const parsed = await validateOrThrow(
      shippingZoneStateUniqueSchema,
      payload
    );

    const mapping = await prisma.shippingZoneState.findUnique({
      where: {
        zoneId_stateId: {
          zoneId: parsed.zoneId,
          stateId: parsed.stateId,
        },
      },
    });

    return Boolean(mapping);
  }

  /**
   * Bulk assign states to zone
   */
  static async bulkAssignStates(payload: {
    zoneId: string;
    stateIds: string[];
  }) {
    const zoneId = payload.zoneId;
    const stateIds = payload.stateIds;

    if (!Array.isArray(stateIds) || stateIds.length === 0) {
      throw new Error("At least one state ID is required");
    }

    // ensure zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) throw new Error("Shipping zone not found");

    // validate state IDs
    stateIds.forEach((id) => {
      createShippingZoneStateSchema.shape.stateId.parse(id);
    });

    // ensure states exist
    const existingStates = await prisma.state.findMany({
      where: { id: { in: stateIds } },
      select: { id: true },
    });

    const existingIds = new Set(existingStates.map((s) => s.id));

    const missing = stateIds.filter((id) => !existingIds.has(id));

    if (missing.length > 0) {
      throw new Error(`Missing states: ${missing.join(", ")}`);
    }

    return prisma.shippingZoneState.createMany({
      data: stateIds.map((stateId) => ({
        zoneId,
        stateId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Clear zone mappings
   */
  static async clearZone(zoneId: string) {
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) throw new Error("Shipping zone not found");

    return prisma.shippingZoneState.deleteMany({
      where: { zoneId },
    });
  }

  /**
   * Get zones for a state
   */
  static async getZonesByState(stateId: string) {
    createShippingZoneStateSchema.shape.stateId.parse(stateId);

    return prisma.shippingZoneState.findMany({
      where: { stateId },
      include: {
        zone: true,
      },
    });
  }
}