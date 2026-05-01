import { prisma } from "../lib/prismadb.js";

export const confirmStockAfterPayment = async (orderId: string) => {
  return prisma.$transaction(async (tx) => {
    const reservations = await tx.stockReservation.findMany({
      where: {
        orderId,
        status: "RESERVED",
      },
    });

    for (const r of reservations) {
      // 🔻 remove reserved
      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: r.variantId,
            warehouseId: r.warehouseId,
          },
        },
        data: {
          reserved: { decrement: r.quantity },
          stock: { decrement: r.quantity },
        },
      });

      // mark confirmed
      await tx.stockReservation.update({
        where: { id: r.id },
        data: { status: "CONFIRMED" },
      });

      // movement log
      await tx.inventoryMovement.create({
        data: {
          variantId: r.variantId,
          warehouseId: r.warehouseId,
          type: "SALE",
          quantity: r.quantity,
          note: `Order ${orderId} confirmed`,
        },
      });
    }
  });
};

export const releaseStockForOrder = async (orderId: string) => {
  return prisma.$transaction(async (tx) => {
    const reservations = await tx.stockReservation.findMany({
      where: {
        orderId,
        status: { in: ["RESERVED"] },
      },
    });

    for (const r of reservations) {
      await tx.productInventory.update({
        where: {
          variantId_warehouseId: {
            variantId: r.variantId,
            warehouseId: r.warehouseId,
          },
        },
        data: {
          reserved: { decrement: r.quantity },
        },
      });

      await tx.stockReservation.update({
        where: { id: r.id },
        data: { status: "RELEASED" },
      });
    }
  });
};