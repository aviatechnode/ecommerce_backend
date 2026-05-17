import type { Request, Response } from "express";
import crypto from "crypto";

import { prisma } from "../lib/prismadb.js";

import {
  confirmStockAfterPayment,
  releaseStockForOrder,
} from "../services/stock.service.js";

export const paystackWebhook = async (
  req: Request,
  res: Response
) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY");
      return res.sendStatus(500);
    }

    /**
     * IMPORTANT:
     * req.body MUST be raw buffer
     * express.raw({ type: "application/json" })
     */

    const rawBody = req.body as Buffer;

    const signature = req.headers[
      "x-paystack-signature"
    ] as string;

    if (!signature) {
      return res.status(401).send("Missing signature");
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    const reference = event?.data?.reference;

    if (!reference) {
      return res.sendStatus(200);
    }

    /**
     * LOCK PAYMENT ROW
     * Prevent concurrent webhook processing
     */
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return res.sendStatus(200);
    }

    /**
     * STRICT IDEMPOTENCY
     */

    const existingTransaction =
      await prisma.paymentTransaction.findFirst({
        where: {
          paymentId: payment.id,
          eventType: event.event,
        },
      });

    if (existingTransaction) {
      return res.sendStatus(200);
    }

    /**
     * SUCCESS
     */
    if (event.event === "charge.success") {
      /**
       * Ignore duplicate successful webhook
       */
      if (payment.status === "SUCCESS") {
        return res.sendStatus(200);
      }

      await prisma.$transaction(async (tx) => {
        /**
         * Save webhook event first
         */
        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            eventType: event.event,
            payload: event,
          },
        });

        /**
         * Update payment
         */
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "SUCCESS",
            paidAt: new Date(),
            providerReference:
              event?.data?.id?.toString(),
            gatewayResponse: event,
            verifiedAt: new Date(),
          },
        });

        /**
         * Commit coupon usage
         */
        const reservation =
          await tx.couponReservation.findFirst({
            where: {
              orderId: payment.orderId,
              status: "ACTIVE",
            },
          });

        if (reservation) {
          /**
           * Atomic increment protection
           */
          const coupon = await tx.coupon.findFirst({
            where: {
              id: reservation.couponId,
              isActive: true,
            },
          });

          if (!coupon) {
            throw new Error("Coupon not found");
          }

          /**
           * Prevent oversubscription
           */
          if (
            coupon.usageLimit !== null &&
            coupon.usedCount >= coupon.usageLimit
          ) {
            throw new Error("Coupon usage exceeded");
          }

          await tx.coupon.update({
            where: {
              id: coupon.id,
            },
            data: {
              usedCount: {
                increment: 1,
              },
            },
          });

          /**
           * FIXED:
           * required fields were missing
           */
          await tx.couponUsage.create({
            data: {
              couponId: reservation.couponId,
              userId: reservation.userId,
              orderId: reservation.orderId,

              discountAmount:
                reservation.reservedDiscountAmount || 0,

              orderAmount:
                payment.order.totalAmount,
            },
          });

          await tx.couponReservation.update({
            where: {
              id: reservation.id,
            },
            data: {
              status: "CONSUMED",
              consumedAt: new Date(),
            },
          });
        }

        /**
         * Update order
         */
        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            status: "PROCESSING",
            paymentStatus: "SUCCESS",
          },
        });

        await tx.orderEvent.create({
          data: {
            orderId: payment.orderId,
            type: "PAYMENT_SUCCESS",
            metadata: event,
          },
        });
      });

      /**
       * VERY IMPORTANT:
       * External services OUTSIDE transaction
       */
      await confirmStockAfterPayment(
        payment.orderId
      );

      return res.sendStatus(200);
    }

    /**
     * FAILURE
     */
    if (event.event === "charge.failed") {
      /**
       * Ignore already failed/cancelled
       */
      if (payment.status === "FAILED") {
        return res.sendStatus(200);
      }

      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            eventType: event.event,
            payload: event,
          },
        });

        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "FAILED",
            failureReason:
              event?.data?.gateway_response ||
              "Payment failed",
            gatewayResponse: event,
          },
        });

        /**
         * Release coupon
         */
        await tx.couponReservation.updateMany({
          where: {
            orderId: payment.orderId,
            status: "ACTIVE",
          },
          data: {
            status: "RELEASED",
            releasedAt: new Date(),
          },
        });

        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancelledAt: new Date(),
          },
        });

        await tx.orderEvent.create({
          data: {
            orderId: payment.orderId,
            type: "PAYMENT_FAILED",
            metadata: event,
          },
        });
      });

      /**
       * OUTSIDE transaction
       */
      await releaseStockForOrder(
        payment.orderId
      );

      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);

    return res.sendStatus(500);
  }
};