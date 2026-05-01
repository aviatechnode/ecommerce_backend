import { Router } from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getProductRatingSummary,
} from "../controllers/product.review.controller.js";

import {
  protect,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

//////////////////////////////////////////////////////////
// PUBLIC ROUTES
//////////////////////////////////////////////////////////

router.get("/product/:productId", getProductReviews);
router.get("/product/:productId/summary", getProductRatingSummary);

//////////////////////////////////////////////////////////
// PROTECTED ROUTES
//////////////////////////////////////////////////////////

// CREATE REVIEW
router.post(
  "/",
  protect,
  requirePermission("review:create"),
  createReview
);

// UPDATE REVIEW
router.put(
  "/:id",
  protect,
  requirePermission("review:update"),
  updateReview
);

// DELETE REVIEW
router.delete(
  "/:id",
  protect,
  requirePermission("review:delete"),
  deleteReview
);

export default router;