import type { Request, Response } from "express";

import axios from "axios";

import {
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "../lib/prismadb.js";

//////////////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////////////

type InitializePaymentBody = {
  orderId: string;
};

type PaystackInitializeResponse = {
  status: boolean;
  message: string;

  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

//////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////

const generatePaymentReference = (
  orderId: string
) => {
  return `PAY-${orderId}-${Date.now()}`;
};

//////////////////////////////////////////////////////////
// INITIALIZE PAYMENT
//////////////////////////////////////////////////////////

export const initializePayment = async (
  req: Request<
    {},
    {},
    InitializePaymentBody
  >,
  res: Response
): Promise<Response> => {
  try {
    //////////////////////////////////////////////////////
    // BODY VALIDATION
    //////////////////////////////////////////////////////

    const orderId = String(req.body.orderId);

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
      });
    }

    //////////////////////////////////////////////////////
    // FETCH ORDER
    //////////////////////////////////////////////////////

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          user: true,
          payment: true,
          coupon: true,
        },
      });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    //////////////////////////////////////////////////////
    // USER EMAIL REQUIRED
    //////////////////////////////////////////////////////

    if (!order.user?.email) {
      return res.status(400).json({
        message: "User email missing",
      });
    }

    //////////////////////////////////////////////////////
    // ORDER EXPIRATION CHECK
    //////////////////////////////////////////////////////

    if (
      order.expiresAt &&
      order.expiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "Order has expired",
      });
    }

    //////////////////////////////////////////////////////
    // COUPON RESERVATION VALIDATION
    //////////////////////////////////////////////////////

    if (order.couponId) {
      const reservation =
        await prisma.couponReservation.findFirst({
          where: {
            orderId: order.id,
            status: "ACTIVE",

            expiresAt: {
              gt: new Date(),
            },
          },
        });

      if (!reservation) {
        return res.status(400).json({
          message:
            "Coupon reservation expired. Please reapply coupon.",
        });
      }
    }

    //////////////////////////////////////////////////////
    // PAYMENT ALREADY SUCCESSFUL
    //////////////////////////////////////////////////////

    if (
      order.payment &&
      order.payment.status ===
        PaymentStatus.SUCCESS
    ) {
      return res.status(400).json({
        message:
          "Payment already completed",
      });
    }

    //////////////////////////////////////////////////////
    // GENERATE REFERENCE
    //////////////////////////////////////////////////////

    const reference =
      generatePaymentReference(order.id);

    const amountInKobo = Math.round(
      Number(order.totalAmount) * 100
    );

    //////////////////////////////////////////////////////
    // UPSERT PAYMENT
    //////////////////////////////////////////////////////

    const payment =
      await prisma.payment.upsert({
        where: {
          orderId: order.id,
        },

        update: {
          reference,

          amount: order.totalAmount,

          status: PaymentStatus.PENDING,

          provider:
            PaymentProvider.PAYSTACK,

          paidAt: null,

          verifiedAt: null,
        },

        create: {
          orderId: order.id,

          reference,

          amount: order.totalAmount,

          currency: order.currency,

          provider:
            PaymentProvider.PAYSTACK,

          status: PaymentStatus.PENDING,
        },
      });

    //////////////////////////////////////////////////////
    // INITIALIZE PAYSTACK
    //////////////////////////////////////////////////////

    const response =
      await axios.post<PaystackInitializeResponse>(
        "https://api.paystack.co/transaction/initialize",

        {
          email: order.user.email,

          amount: amountInKobo,

          reference,

          currency: order.currency,

          metadata: {
            orderId: order.id,

            paymentId: payment.id,

            userId: order.user.id,
          },
        },

        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,

            "Content-Type":
              "application/json",
          },

          timeout: 30000,
        }
      );

    //////////////////////////////////////////////////////
    // PAYSTACK FAILURE
    //////////////////////////////////////////////////////

    if (!response.data.status) {
      return res.status(400).json({
        message:
          response.data.message ||
          "Payment initialization failed",
      });
    }

    //////////////////////////////////////////////////////
    // ORDER EVENT
    //////////////////////////////////////////////////////

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,

        type: "PAYMENT_INITIALIZED",

        message:
          "Payment initialized with Paystack",

        metadata: {
          paymentId: payment.id,

          reference,
        },
      },
    });

    //////////////////////////////////////////////////////
    // SUCCESS RESPONSE
    //////////////////////////////////////////////////////

    return res.status(200).json({
      message:
        "Payment initialized successfully",

      data: {
        paymentId: payment.id,

        orderId: order.id,

        reference,

        authorizationUrl:
          response.data.data
            .authorization_url,

        accessCode:
          response.data.data.access_code,
      },
    });
  } catch (error: unknown) {
    //////////////////////////////////////////////////////
    // AXIOS ERROR
    //////////////////////////////////////////////////////

    if (axios.isAxiosError(error)) {
      console.error(
        "Paystack error:",
        error.response?.data ||
          error.message
      );
    } else {
      console.error(
        "Initialize payment error:",
        error
      );
    }

    return res.status(500).json({
      message:
        "Payment initialization failed",
    });
  }
};