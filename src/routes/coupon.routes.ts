import { Router } from "express";
import {
  createCoupon,
  applyCoupon,
  deactivateCoupon,
} from "../controllers/coupon.controller.js";
import {
  protect,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

/* PUBLIC */
router.post("/apply", applyCoupon);

/* ADMIN */
router.post(
  "/",
  protect,
  requirePermission("coupon:create"),
  createCoupon
);

router.patch(
  "/:id/deactivate",
  protect,
  requirePermission("coupon:update"),
  deactivateCoupon
);

export default router;