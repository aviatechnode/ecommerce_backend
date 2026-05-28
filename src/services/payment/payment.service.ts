import { prisma } from "../../lib/prismadb.js";
import {
  PaymentProvider,
  PaymentStatus,
  OrderStatus,
  CouponReservationStatus,
  CouponUsageStatus,
} from "@prisma/client";
import {
  initializePaymentSchema,
  verifyPaymentSchema,
  webhookPayloadSchema,
} from "./payment.schema.js";
import { PaystackService } from "./paystack.service.js";
import { StockReservationService } from "../inventory/stock.reservation.service.js";

export class PaymentService {
  private static paystack = new PaystackService();

  static async initializePayment(input: unknown) {
    const parsed = initializePaymentSchema.parse(input);
    const { orderId, email, amount, metadata } = parsed;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) throw new Error("Order not found");

    const reference = `ORD-${order.orderNumber}-${Date.now()}`;

    const paystackData = await this.paystack.initializePayment({
      email,
      amount: Math.round(amount * 100),
      reference,
      metadata: { orderId, ...metadata },
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        reference,
        provider: PaymentProvider.PAYSTACK,
        providerReference: paystackData.reference,
        amount,
        currency: "NGN",
        status: PaymentStatus.PENDING,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        eventType: "initialize",
        payload: paystackData,
      },
    });

    return {
      authorizationUrl: paystackData.authorization_url,
      reference: paystackData.reference,
      payment,
    };
  }

  static async verifyPayment(input: unknown) {
    const parsed = verifyPaymentSchema.parse(input);
    const { reference } = parsed;

    const paystackData = await this.paystack.verifyTransaction(reference);
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: true },
    });
    if (!payment) throw new Error("Payment not found");

    if (payment.status !== PaymentStatus.PENDING) {
      return { payment, verified: payment.status === PaymentStatus.PAID };
    }

    const isSuccess = paystackData.status === "success";
    const newStatus = isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          gatewayResponse: paystackData,
          providerReference: paystackData.reference,
          paidAt: paystackData.paid_at ? new Date(paystackData.paid_at) : null,
          verifiedAt: new Date(),
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          eventType: "verify",
          payload: paystackData,
        },
      });

      if (isSuccess) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.PAID,
          },
        });

        const reservation = await tx.couponReservation.findFirst({
          where: {
            orderId: payment.orderId,
            status: CouponReservationStatus.ACTIVE,
          },
        });
        if (reservation) {
          const coupon = await tx.coupon.findUnique({
            where: { id: reservation.couponId },
          });
          if (coupon && coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            throw new Error("Coupon usage limit exceeded");
          }
          await tx.coupon.update({
            where: { id: reservation.couponId },
            data: { usedCount: { increment: 1 } },
          });
          await tx.couponUsage.create({
            data: {
              couponId: reservation.couponId,
              userId: reservation.userId,
              orderId: reservation.orderId,
              discountAmount: reservation.reservedDiscountAmount || 0,
              orderAmount: payment.order.totalAmount,
              status: CouponUsageStatus.SUCCESS,
            },
          });
          await tx.couponReservation.update({
            where: { id: reservation.id },
            data: { status: CouponReservationStatus.CONSUMED, consumedAt: new Date() },
          });
        }

        await StockReservationService.confirmReservations({ orderId: payment.orderId });
      } else {
        await StockReservationService.releaseReservations({ orderId: payment.orderId });
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
        await tx.couponReservation.updateMany({
          where: { orderId: payment.orderId, status: CouponReservationStatus.ACTIVE },
          data: { status: CouponReservationStatus.RELEASED, releasedAt: new Date() },
        });
      }
    });

    return { payment, verified: isSuccess };
  }

  static async processWebhookEvent(rawBody: Buffer, signature: string) {
    const payload = JSON.parse(rawBody.toString());
    const parsed = webhookPayloadSchema.parse(payload);
    const { event, data } = parsed;

    // ✅ Fixed: path must be an array of strings
    const existingTx = await prisma.paymentTransaction.findFirst({
      where: {
        eventType: event,
        payload: {
          path: ["data", "reference"],
          equals: data.reference,
        },
      },
    });
    if (existingTx) return { received: true, alreadyProcessed: true };

    if (event === "charge.success") {
      await this.verifyPayment({ reference: data.reference });
    } else if (event === "charge.failed") {
      const payment = await prisma.payment.findUnique({
        where: { reference: data.reference },
      });
      if (payment && payment.status === PaymentStatus.PENDING) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              failureReason: data.gateway_response,
              gatewayResponse: payload,
            },
          });
          await tx.paymentTransaction.create({
            data: {
              paymentId: payment.id,
              eventType: event,
              payload,
            },
          });
          await StockReservationService.releaseReservations({ orderId: payment.orderId });
          await tx.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: PaymentStatus.FAILED, status: OrderStatus.CANCELLED },
          });
        });
      }
    }
    return { received: true };
  }
}