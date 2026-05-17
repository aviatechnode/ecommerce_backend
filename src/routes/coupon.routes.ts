import { Router } from "express";

import couponController from "../controllers/coupon.controller.js";

import {
  protect,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

//////////////////////////////////////////////////////////
// CREATE
//////////////////////////////////////////////////////////

router.post(
  "/",
  protect,
  requirePermission("coupon:create"),
  couponController.createCoupon.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// VALIDATE
//////////////////////////////////////////////////////////

router.post(
  "/validate",
  protect,
  couponController.validateCoupon.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// MAINTENANCE ROUTES
//////////////////////////////////////////////////////////

router.post(
  "/maintenance/expire",
  protect,
  requirePermission("coupon:update"),
  couponController.expireCoupons.bind(
    couponController
  )
);

router.post(
  "/maintenance/release",
  protect,
  requirePermission("coupon:update"),
  couponController.releaseReservations.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// LIST
//////////////////////////////////////////////////////////

router.get(
  "/",
  protect,
  requirePermission("coupon:read"),
  couponController.listCoupons.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// GET BY CODE
//////////////////////////////////////////////////////////

router.get(
  "/code/:code",
  protect,
  requirePermission("coupon:read"),
  couponController.getCouponByCode.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// STATS
//////////////////////////////////////////////////////////

router.get(
  "/:id/stats",
  protect,
  requirePermission("coupon:read"),
  couponController.getCouponStats.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// GET BY ID
//////////////////////////////////////////////////////////

router.get(
  "/:id",
  protect,
  requirePermission("coupon:read"),
  couponController.getCouponById.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// UPDATE
//////////////////////////////////////////////////////////

router.put(
  "/:id",
  protect,
  requirePermission("coupon:update"),
  couponController.updateCoupon.bind(
    couponController
  )
);

//////////////////////////////////////////////////////////
// DELETE
//////////////////////////////////////////////////////////

router.delete(
  "/:id",
  protect,
  requirePermission("coupon:delete"),
  couponController.deleteCoupon.bind(
    couponController
  )
);

export default router;