import { prisma } from "../lib/prismadb.js";

export const cleanupExpiredReservations = async () => {
  const now = new Date();

  const expired = await prisma.stockReservation.findMany({
    where: {
      status: "RESERVED",
      expiresAt: { lt: now },
    },
  });

  for (const r of expired) {
    await prisma.$transaction(async (tx) => {
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
        data: { status: "EXPIRED" },
      });
    });
  }
};