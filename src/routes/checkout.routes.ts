import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../middlewares/idempotency.middleware.js";
import { checkout } from "../controllers/checkout.controller.js";

const router = Router();

/**
 * POST /api/checkout
 * - Auth required
 * - Idempotent
 * - Creates checkout session
 * - Generates shipping quote
 * - Reserves stock
 * - Creates order + shipment
 * - Initializes payment
 */
router.post(
  "/",
  protect,
  idempotencyMiddleware,
  checkout
);

export default router;