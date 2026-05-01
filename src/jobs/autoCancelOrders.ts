import { prisma } from "../lib/prismadb.js";
import { releaseStockForOrder } from "../services/stock.service.js";

export const autoCancelUnpaidOrders = async () => {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "PENDING",
      createdAt: { lt: cutoff },
    },
  });

  for (const order of orders) {
    await releaseStockForOrder(order.id);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "AUTO_CANCELLED",
        message: "Order auto-cancelled after 15 minutes",
      },
    });
  }
};