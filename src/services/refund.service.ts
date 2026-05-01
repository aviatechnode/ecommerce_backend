import { prisma } from "../lib/prismadb.js";
import axios from "axios";

/**
 * REFUND FLOW (RMA + PARTIAL SUPPORT + PAYSTACK + STOCK RESTORE)
 */
export const refundOrder = async (
  orderId: string,
  items: { orderItemId: string; quantity: number }[],
  reason?: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: true,
      },
    });

    if (!order || !order.payment) {
      throw new Error("Invalid order");
    }

    if (order.payment.status !== "SUCCESS") {
      throw new Error("Cannot refund unpaid order");
    }

    // ======================================================
    // CREATE RETURN REQUEST (RMA)
    // ======================================================
    const returnRequest = await tx.returnRequest.create({
      data: {
        orderId,
        userId: order.userId,
        status: "PENDING",
        reason: reason ?? null,
      },
    });

    let totalRefundAmount = 0;

    // ======================================================
    // PROCESS EACH ITEM (PARTIAL REFUND)
    // ======================================================
    for (const item of items) {
      const orderItem = await tx.orderItem.findUnique({
        where: { id: item.orderItemId },
      });

      if (!orderItem) continue;

      const refundableQty = Math.min(item.quantity, orderItem.quantity);

      const itemRefund =
        Number(orderItem.unitPrice) * refundableQty;

      totalRefundAmount += itemRefund;

      // ======================================================
      // CREATE REFUND RECORD
      // ======================================================
      await tx.refund.create({
        data: {
          paymentId: order.payment.id,
          amount: itemRefund,
          quantity: refundableQty,
          orderItemId: orderItem.id,
          reason: reason ?? null,
          status: "PENDING",
        },
      });

      // ======================================================
      // RESTORE STOCK
      // ======================================================
      const reservation = await tx.stockReservation.findFirst({
        where: {
          orderId,
          variantId: orderItem.variantId,
        },
      });

      if (reservation) {
        await tx.productInventory.update({
          where: {
            variantId_warehouseId: {
              variantId: reservation.variantId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            stock: { increment: refundableQty },
            reserved: { decrement: refundableQty },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
            type: "RETURN",
            quantity: refundableQty,
            note: `Refund for order ${orderId}`,
          },
        });

        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: "RELEASED" },
        });
      }
    }

    // ======================================================
    // CALL PAYSTACK REFUND API
    // ======================================================
    const paystackRes = await axios.post(
      `https://api.paystack.co/refund`,
      {
        transaction: order.payment.reference,
        amount: Math.round(totalRefundAmount * 100), // kobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
        },
      }
    );

    // ======================================================
    // UPDATE ORDER STATUS
    // ======================================================
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    });

    // ======================================================
    // MARK RETURN COMPLETE
    // ======================================================
    await tx.returnRequest.update({
      where: { id: returnRequest.id },
      data: {
        status: "SUCCESS",
      },
    });

    return {
      refund: paystackRes.data,
      amount: totalRefundAmount,
    };
  });
};