// src/jobs/orderExpiry.job.ts

import cron from "node-cron";
import { prisma } from "../lib/prismadb.js";
import { releaseStockForOrder } from "../services/stock.service.js";

/**
 * CONFIG
 */
const CRON_SCHEDULE = "* * * * *"; // every 1 minute
const BATCH_SIZE = 50; // process in batches (prevents overload)

/**
 * START ORDER EXPIRY CRON
 */
export const startOrderExpiryJob = () => {
  cron.schedule(CRON_SCHEDULE, async () => {
    const now = new Date();

    console.log("[CRON] Running order expiry job at:", now.toISOString());

    try {
      while (true) {
        /**
         * 1. FETCH EXPIRED ORDERS (BATCHED)
         */
        const expiredOrders = await prisma.order.findMany({
          where: {
            status: "PENDING",
            paymentStatus: "PENDING",
            expiresAt: {
              lt: now,
            },
          },
          select: {
            id: true,
          },
          take: BATCH_SIZE,
        });

        if (expiredOrders.length === 0) {
          break; // nothing left
        }

        /**
         * 2. PROCESS EACH ORDER SAFELY
         */
        for (const { id: orderId } of expiredOrders) {
          try {
            await prisma.$transaction(async (tx) => {
              /**
               * 🔒 RECHECK (IMPORTANT FOR CONCURRENCY)
               */
              const order = await tx.order.findUnique({
                where: { id: orderId },
                select: {
                  status: true,
                  paymentStatus: true,
                },
              });

              if (
                !order ||
                order.status !== "PENDING" ||
                order.paymentStatus !== "PENDING"
              ) {
                return; // already handled (webhook or retry)
              }

              /**
               * 1. CANCEL ORDER
               */
              await tx.order.update({
                where: { id: orderId },
                data: {
                  status: "CANCELLED",
                  paymentStatus: "FAILED",
                  cancelledAt: new Date(),
                },
              });

              /**
               * 2. RELEASE STOCK
               */
              await releaseStockForOrder(orderId);

              /**
               * 3. RELEASE COUPON
               */
              await tx.couponReservation.deleteMany({
                where: {
                  orderId,
                },
              });

              /**
               * 4. LOG EVENT
               */
              await tx.orderEvent.create({
                data: {
                  orderId,
                  type: "ORDER_EXPIRED",
                  message: "Order auto-cancelled after expiry timeout",
                },
              });
            });

            console.log(`[CRON] Expired order: ${orderId}`);
          } catch (err) {
            console.error(`[CRON] Failed to expire order ${orderId}:`, err);
          }
        }
      }
    } catch (error) {
      console.error("[CRON] Order expiry job failed:", error);
    }
  });
};