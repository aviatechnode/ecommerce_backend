import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prismadb.js";

export const paystackWebhook = async (
  req: Request,
  res: Response
) => {
  try {
    const secret = process.env.PAYSTACK_SECRET as string;

    if (!secret) {
      console.error("Missing PAYSTACK_SECRET");
      return res.sendStatus(500);
    }

    // 1️⃣ Verify signature (using RAW body)
    const signature = req.headers["x-paystack-signature"] as string;

    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (computedHash !== signature) {
      return res.status(401).send("Invalid signature");
    }

    // 2️⃣ Parse event safely
    const event = JSON.parse(req.body.toString());

    if (!event?.data?.reference) {
      return res.sendStatus(200);
    }

    const reference: string = event.data.reference;

    // 3️⃣ Fetch payment
    const existingPayment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!existingPayment) {
      // Unknown reference — ignore safely
      return res.sendStatus(200);
    }

    // 4️⃣ Retry-safe guard
    if (
      event.event === "charge.success" &&
      existingPayment.status === "SUCCESS"
    ) {
      return res.sendStatus(200);
    }

    if (
      event.event === "charge.failed" &&
      existingPayment.status === "FAILED"
    ) {
      return res.sendStatus(200);
    }

    // 5️⃣ Transactional update
    await prisma.$transaction(async (tx) => {
      if (event.event === "charge.success") {
        await tx.payment.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: existingPayment.orderId },
          data: {
            status: "CANCELLED",
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
          where: { id: existingPayment.orderId },
          data: {
            status: "CANCELLED",
          },
        });
      }
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);

    // NEVER return 4xx for processing errors
    // Let Paystack retry
    return res.sendStatus(500);
  }
};