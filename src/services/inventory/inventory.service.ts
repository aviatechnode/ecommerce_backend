import { prisma } from "../../lib/prismadb.js";

export class InventoryService {
  async getInventory(
    variantId: string,
    warehouseId: string
  ) {
    return prisma.productInventory.findUnique({
      where: {
        variantId_warehouseId: {
          variantId,
          warehouseId,
        },
      },
    });
  }

  async createOrUpdate(input: {
    variantId: string;
    warehouseId: string;
    stock: number;
  }) {
    return prisma.productInventory.upsert({
      where: {
        variantId_warehouseId: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
        },
      },
      update: {
        stock: input.stock,
      },
      create: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        stock: input.stock,
        reserved: 0,
      },
    });
  }

  async incrementStock(input: {
    variantId: string;
    warehouseId: string;
    quantity: number;
  }) {
    return prisma.productInventory.update({
      where: {
        variantId_warehouseId: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
        },
      },
      data: {
        stock: {
          increment: input.quantity,
        },
      },
    });
  }

  async decrementStock(input: {
    variantId: string;
    warehouseId: string;
    quantity: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const inventory =
        await tx.productInventory.findUniqueOrThrow({
          where: {
            variantId_warehouseId: {
              variantId: input.variantId,
              warehouseId: input.warehouseId,
            },
          },
        });

      const available =
        inventory.stock - inventory.reserved;

      if (available < input.quantity) {
        throw new Error("Insufficient stock");
      }

      return tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: input.variantId,
            warehouseId: input.warehouseId,
          },
        },
        data: {
          stock: {
            decrement: input.quantity,
          },
        },
      });
    });
  }
}