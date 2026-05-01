import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prismadb.js";
import { confirmStockAfterPayment, releaseStockForOrder } from "../services/stock.service.js";

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY as string;

    const signature = req.headers["x-paystack-signature"] as string;

    const rawBody = req.body;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    const reference = event?.data?.reference;

    if (!reference) return res.sendStatus(200);

    // ======================================================
    // FIND PAYMENT
    // ======================================================

    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) return res.sendStatus(200);

    // ======================================================
    // IDEMPOTENCY (PREVENT DUPLICATE EVENTS)
    // ======================================================

    const alreadyProcessed = await prisma.paymentTransaction.findFirst({
      where: {
        paymentId: payment.id,
        eventType: event.event,
        payload: {
          path: ["data", "id"],
          equals: event.data.id,
        },
      },
    });

    if (alreadyProcessed) {
      return res.sendStatus(200);
    }

    // ======================================================
    // PROCESS EVENT
    // ======================================================

    await prisma.$transaction(async (tx) => {
      // log event first (idempotency anchor)
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          eventType: event.event,
          payload: event,
        },
      });

      // ================= SUCCESS =================

      if (event.event === "charge.success") {
      await tx.payment.update({
        where: { reference },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });

      await confirmStockAfterPayment(payment.orderId);

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PROCESSING",
          paymentStatus: "SUCCESS",
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: payment.orderId,
          type: "PAYMENT_SUCCESS",
        },
      });
    }

    if (event.event === "charge.failed") {
      await tx.payment.update({
        where: { reference },
        data: { status: "FAILED" },
      });

      await releaseStockForOrder(payment.orderId);

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      });
    }
    });
    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    return res.sendStatus(500);
  }
};