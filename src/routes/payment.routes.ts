import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { initializePayment } from "../controllers/payment.controller.js";

const router = Router();

/**
 * Initialize Paystack payment
 * POST /api/payments/initialize
 */
router.post("/initialize", protect, initializePayment);

export default router;