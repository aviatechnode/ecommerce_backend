import { Router } from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getProductRatingSummary,
} from "../controllers/product.review.controller.js";

const router = Router();

router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

router.get("/product/:productId", getProductReviews);
router.get("/product/:productId/summary", getProductRatingSummary);

export default router;