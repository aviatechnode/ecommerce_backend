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

export const initializePayment = async (
  req: Request<{}, {}, InitializePaymentBody>,
  res: Response
): Promise<Response> => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: true,
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

    const response = await axios.post<PaystackInitializeResponse>(
      "https://api.paystack.co/transaction/initialize",
      {
        email: order.user.email,
        amount: Number(order.totalAmount) * 100,
        reference: order.payment?.reference,
        currency: "NGN",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data.data);
  } catch (error) {
    console.error("Initialize payment error:", error);

    return res.status(500).json({
      message: "Payment initialization failed",
    });
  }
};