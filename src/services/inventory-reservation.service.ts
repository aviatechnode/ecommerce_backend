import { prisma } from "../lib/prismadb.js";

export async function reserveStock(
  variantId: string,
  warehouseId: string,
  quantity: number,
  orderId: string
) {

  const inventory = await prisma.productInventory.findFirst({
    where: {
      variantId,
      warehouseId,
    },
  });

  if (!inventory)
    throw new Error("Inventory not found");

  const available = inventory.stock - inventory.reserved;

  if (available < quantity)
    throw new Error("Out of stock");

  await prisma.$transaction(async (tx) => {

    await tx.productInventory.update({
      where: { id: inventory.id },
      data: {
        reserved: { increment: quantity },
      },
    });

    await tx.stockReservation.create({
      data: {
        variantId,
        warehouseId,
        orderId,
        quantity,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

  });
}