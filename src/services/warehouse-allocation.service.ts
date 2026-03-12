import { prisma } from "../lib/prismadb.js";
import { NigerianState } from "@prisma/client";

export interface AllocationResult {
  warehouseId: string;
  inventoryId: string;
  quantity: number;
}

export async function allocateVariantStock(
  variantId: string,
  quantity: number,
  destinationState: NigerianState
): Promise<AllocationResult[]> {
  const inventories = await prisma.productInventory.findMany({
    where: {
      variantId,
      stock: { gt: 0 },
    },
    include: {
      warehouse: true,
    },
  });

  if (!inventories.length) throw new Error("Out of stock");

  const distances = await prisma.stateDistance.findMany({
    where: {
      destinationState,
    },
  });

  const distanceMap = new Map(
    distances.map((d) => [d.originState, d.distanceKm])
  );

  const sorted = inventories.sort((a, b) => {
    const da = distanceMap.get(a.warehouse.state) ?? 9999;
    const db = distanceMap.get(b.warehouse.state) ?? 9999;
    return da - db;
  });

  let remaining = quantity;
  const allocations: AllocationResult[] = [];

  for (const inv of sorted) {
    const available = inv.stock - inv.reserved;

    if (available <= 0) continue;

    const allocateQty = Math.min(available, remaining);

    allocations.push({
      warehouseId: inv.warehouseId,
      inventoryId: inv.id,
      quantity: allocateQty,
    });

    remaining -= allocateQty;

    if (remaining <= 0) break;
  }

  if (remaining > 0) {
    throw new Error("Insufficient stock across warehouses");
  }

  return allocations;
}