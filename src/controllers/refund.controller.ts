import type { Request, Response } from "express";
import { refundOrder } from "../services/refund.service.js";

type RefundItem = {
  orderItemId: string;
  quantity: number;
};

type RefundBody = {
  orderId: string;
  items: RefundItem[];
  reason?: string;
};

export const refundController = async (
  req: Request<{}, {}, RefundBody>,
  res: Response
) => {
  try {
    const { orderId, items, reason } = req.body;

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "orderId and items are required",
      });
    }

    const result = await refundOrder(orderId, items, reason);

    return res.json({
      message: "Refund processed",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      message: err.message || "Refund failed",
    });
  }
};