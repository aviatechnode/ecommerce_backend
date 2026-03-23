import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prismadb.js";

export const paystackWebhook = async (req: Request, res: Response) => {
  try {

    const secret = process.env.PAYSTACK_SECRET as string;

    const signature = req.headers["x-paystack-signature"] as string;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    const reference = event?.data?.reference;

    if (!reference) return res.sendStatus(200);

    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) return res.sendStatus(200);

    await prisma.$transaction(async (tx) => {

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          eventType: event.event,
          payload: event,
        },
      });

      if (event.event === "charge.success") {

        await tx.payment.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            paidAt: new Date(),
          },
        });

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
            message: "Payment confirmed",
          },
        });

      }

      if (event.event === "charge.failed") {

        await tx.payment.update({
          where: { reference },
          data: {
            status: "FAILED",
          },
        });

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