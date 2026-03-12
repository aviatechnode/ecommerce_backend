import { prisma } from "../lib/prismadb.js";

export async function handlePaymentSuccess(reference: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { reference },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!payment || payment.status === "SUCCESS") return;

    for (const item of payment.order.items) {
      const inventory = await tx.productInventory.findFirst({
        where: { productId: item.productId },
      });

      if (!inventory) throw new Error("Inventory missing");

      await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          stock: inventory.stock - item.quantity,
          reserved: inventory.reserved - item.quantity,
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", paidAt: new Date() },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "SUCCESS",
        status: "PROCESSING",
      },
    });
  });
}

export async function handlePaymentFailure(reference: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { reference },
      include: {
        order: { include: { items: true } },
      },
    });

    if (!payment || payment.status !== "PENDING") return;

    for (const item of payment.order.items) {
      const inventory = await tx.productInventory.findFirst({
        where: { productId: item.productId },
      });

      if (!inventory) continue;

      await tx.productInventory.update({
        where: { id: inventory.id },
        data: {
          reserved: inventory.reserved - item.quantity,
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
      },
    });
  });
}