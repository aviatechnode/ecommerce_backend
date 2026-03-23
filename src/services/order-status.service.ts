import { prisma } from "../lib/prismadb.js";
import { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  message?: string
): Promise<void> {

  await prisma.$transaction(async (tx) => {

    await tx.order.update({
      where: { id: orderId },
      data: { status },
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        type: status,
        message: message ?? null, // ✅ fix
      },
    });

  });

}