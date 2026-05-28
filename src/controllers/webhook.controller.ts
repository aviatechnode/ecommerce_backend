import type { Request, Response } from "express";
import { verifyPaystackSignature } from "../utils/paystack.signature.js";
import { PaymentService } from "../services/payment/payment.service.js";

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;
    if (!signature) {
      return res.status(401).send("Missing signature");
    }
    const rawBody = req.body as Buffer;
    const isValid = verifyPaystackSignature(rawBody.toString(), signature);
    if (!isValid) {
      return res.status(401).send("Invalid signature");
    }
    await PaymentService.processWebhookEvent(rawBody, signature);
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};