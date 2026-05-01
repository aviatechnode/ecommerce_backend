import type { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../lib/prismadb.js";

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

const generatePaymentReference = (orderId: string) => {
  return `PAY-${orderId}-${Date.now()}`;
};

export const initializePayment = async (
  req: Request<{}, {}, InitializePaymentBody>,
  res: Response
): Promise<Response> => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "orderId is required",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (!order.user?.email) {
      return res.status(400).json({
        message: "User email missing",
      });
    }

    /**
     * Prevent re-initializing already successful payments
     */
    if (
      order.payment &&
      order.payment.status === "SUCCESS"
    ) {
      return res.status(400).json({
        message: "Payment already completed",
      });
    }

    /**
     * Always generate a fresh unique reference
     * Never reuse old Paystack references
     */
    const reference = generatePaymentReference(order.id);

    /**
     * Safe amount conversion for Paystack (kobo)
     */
    const amountInKobo = Math.round(
      Number(order.totalAmount) * 100
    );

    /**
     * Upsert payment BEFORE calling Paystack
     * This keeps DB + webhook + refund flow safe
     */
    const payment = await prisma.payment.upsert({
      where: {
        orderId: order.id,
      },
      update: {
        reference,
        amount: order.totalAmount,
        status: "PENDING",
        paidAt: null,
      },
      create: {
        orderId: order.id,
        reference,
        amount: order.totalAmount,
        status: "PENDING",
      },
    });

    /**
     * Initialize transaction with Paystack
     */
    const response = await axios.post<PaystackInitializeResponse>(
      "https://api.paystack.co/transaction/initialize",
      {
        email: order.user.email,
        amount: amountInKobo,
        reference,
        currency: "NGN",
        metadata: {
          orderId: order.id,
          paymentId: payment.id,
          userId: order.user.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (!response.data.status) {
      return res.status(400).json({
        message: response.data.message || "Payment initialization failed",
      });
    }

    /**
     * Order event log
     */
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_INITIALIZED",
        message: "Payment initialized with Paystack",
        metadata: {
          paymentId: payment.id,
          reference,
        },
      },
    });

    return res.status(200).json({
      message: "Payment initialized successfully",
      data: {
        paymentId: payment.id,
        orderId: order.id,
        reference,
        authorizationUrl:
          response.data.data.authorization_url,
        accessCode:
          response.data.data.access_code,
      },
    });
  } catch (error: any) {
    console.error(
      "Initialize payment error:",
      error?.response?.data || error
    );

    return res.status(500).json({
      message: "Payment initialization failed",
    });
  }
};