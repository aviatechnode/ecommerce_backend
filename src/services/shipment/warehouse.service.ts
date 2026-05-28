import { prisma } from "../../lib/prismadb.js";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdParamSchema,
  createWarehouseRouteSchema,
  updateWarehouseRouteSchema,
  warehouseRouteIdParamSchema,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
  type CreateWarehouseRouteInput,
  type UpdateWarehouseRouteInput,
} from "../../schemas/shipment/warehouse.schema.js";

export class WarehouseService {
  static async createWarehouse(data: CreateWarehouseInput) {
    const parsed = createWarehouseSchema.parse(data);
    const state = await prisma.state.findUnique({ where: { id: parsed.stateId }, select: { id: true } });
    if (!state) throw new Error("State not found");
    const existing = await prisma.warehouse.findFirst({
      where: {
        name: parsed.name.trim(),
        city: parsed.city.trim(),
        stateId: parsed.stateId,
      },
    });
    if (existing) throw new Error("Warehouse already exists in this city/state");
    return prisma.warehouse.create({
      data: {
        name: parsed.name.trim(),
        city: parsed.city.trim(),
        stateId: parsed.stateId,
        isActive: parsed.isActive ?? true,
      },
      include: { state: true, routes: true },
    });
  }

  static async getAllWarehouses() {
    return prisma.warehouse.findMany({
      include: { state: true, routes: { include: { state: true, lga: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getWarehouseById(id: string) {
    const parsed = warehouseIdParamSchema.parse({ id });
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parsed.id },
      include: {
        state: true,
        routes: { include: { state: true, lga: true } },
        inventory: { include: { variant: true } },
      },
    });
    if (!warehouse) throw new Error("Warehouse not found");
    return warehouse;
  }

  static async updateWarehouse(id: string, data: UpdateWarehouseInput) {
    const parsedId = warehouseIdParamSchema.parse({ id });
    const parsedData = updateWarehouseSchema.parse(data);
    const existing = await prisma.warehouse.findUnique({ where: { id: parsedId.id } });
    if (!existing) throw new Error("Warehouse not found");
    const stateId = parsedData.stateId ?? existing.stateId;
    if (parsedData.stateId) {
      const state = await prisma.state.findUnique({ where: { id: parsedData.stateId }, select: { id: true } });
      if (!state) throw new Error("State not found");
    }
    const duplicate = await prisma.warehouse.findFirst({
      where: {
        id: { not: parsedId.id },
        name: parsedData.name?.trim() ?? existing.name,
        city: parsedData.city?.trim() ?? existing.city,
        stateId,
      },
    });
    if (duplicate) throw new Error("Another warehouse already exists with these details");
    return prisma.warehouse.update({
      where: { id: parsedId.id },
      data: {
        ...(parsedData.name !== undefined && { name: parsedData.name.trim() }),
        ...(parsedData.city !== undefined && { city: parsedData.city.trim() }),
        ...(parsedData.stateId !== undefined && { stateId: parsedData.stateId }),
        ...(parsedData.isActive !== undefined && { isActive: parsedData.isActive }),
      },
      include: { state: true },
    });
  }

  static async deleteWarehouse(id: string) {
    const parsed = warehouseIdParamSchema.parse({ id });
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parsed.id },
      include: { inventory: { select: { id: true } }, stockReservations: { select: { id: true } } },
    });
    if (!warehouse) throw new Error("Warehouse not found");
    if (warehouse.inventory.length > 0) throw new Error("Cannot delete warehouse with inventory");
    if (warehouse.stockReservations.length > 0) throw new Error("Cannot delete warehouse with stock reservations");
    return prisma.warehouse.delete({ where: { id: parsed.id } });
  }

  static async toggleWarehouseStatus(id: string) {
    const warehouse = await this.getWarehouseById(id);
    return prisma.warehouse.update({
      where: { id: warehouse.id },
      data: { isActive: !warehouse.isActive },
    });
  }

  static async findBestWarehouseForDelivery(
    stateId: string,
    lgaId?: string,
    items?: Array<{ variantId: string; quantity: number }>
  ) {
    const routeFilter: any = {
      stateId,
      warehouse: { isActive: true },
    };
    if (lgaId) {
      routeFilter.lgaId = { in: [lgaId, null] };
    } else {
      routeFilter.lgaId = null;
    }

    const routes = await prisma.warehouseRoute.findMany({
      where: routeFilter,
      include: {
        warehouse: {
          include: {
            inventory: { include: { variant: true } },
          },
        },
      },
      orderBy: [
        { priority: "asc" },
        { lgaId: lgaId ? "desc" : "asc" },
      ],
    });

    if (!routes || routes.length === 0) {
      throw new Error("No warehouse route covers this delivery location");
    }

    if (items && items.length > 0) {
      for (const route of routes) {
        const warehouse = route.warehouse;
        let allAvailable = true;
        for (const item of items) {
          const inventory = warehouse.inventory.find((inv) => inv.variantId === item.variantId);
          if (!inventory) {
            allAvailable = false;
            break;
          }
          const available = inventory.stock - inventory.reserved;
          if (available < item.quantity) {
            allAvailable = false;
            break;
          }
        }
        if (allAvailable) {
          return warehouse;
        }
      }
      throw new Error("No warehouse has sufficient stock for all items");
    }

    // Safe because routes is non‑empty
    const firstRoute = routes[0];
    if (!firstRoute) throw new Error("Unexpected empty routes");
    return firstRoute.warehouse;
  }

  static async createRoute(payload: CreateWarehouseRouteInput) {
    const parsed = createWarehouseRouteSchema.parse(payload);
    const warehouse = await prisma.warehouse.findUnique({ where: { id: parsed.warehouseId } });
    if (!warehouse) throw new Error("Warehouse not found");
    const state = await prisma.state.findUnique({ where: { id: parsed.stateId } });
    if (!state) throw new Error("State not found");
    if (parsed.lgaId) {
      const lga = await prisma.lGA.findUnique({ where: { id: parsed.lgaId } });
      if (!lga) throw new Error("LGA not found");
    }
    return prisma.warehouseRoute.create({
      data: {
        warehouseId: parsed.warehouseId,
        stateId: parsed.stateId,
        lgaId: parsed.lgaId ?? null,
        priority: parsed.priority,
      },
      include: { warehouse: true, state: true, lga: true },
    });
  }

  static async updateRoute(id: string, payload: UpdateWarehouseRouteInput) {
    const parsedId = warehouseRouteIdParamSchema.parse({ id });
    const parsedData = updateWarehouseRouteSchema.parse(payload);
    const existing = await prisma.warehouseRoute.findUnique({ where: { id: parsedId.id } });
    if (!existing) throw new Error("Warehouse route not found");
    return prisma.warehouseRoute.update({
      where: { id: parsedId.id },
      data: {
        ...(parsedData.stateId !== undefined && { stateId: parsedData.stateId }),
        ...(parsedData.lgaId !== undefined && { lgaId: parsedData.lgaId }),
        ...(parsedData.priority !== undefined && { priority: parsedData.priority }),
      },
      include: { warehouse: true, state: true, lga: true },
    });
  }

  static async deleteRoute(id: string) {
    const parsed = warehouseRouteIdParamSchema.parse({ id });
    const existing = await prisma.warehouseRoute.findUnique({ where: { id: parsed.id } });
    if (!existing) throw new Error("Warehouse route not found");
    return prisma.warehouseRoute.delete({ where: { id: parsed.id } });
  }
}