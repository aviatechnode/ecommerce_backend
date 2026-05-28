import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import {
  protect,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

/* =========================
PUBLIC
========================= */

router.get("/", getProducts);
router.get("/:id", getProduct);

/* =========================
PROTECTED - CORE PRODUCT
========================= */

router.post(
  "/",
  protect,
  requirePermission("product:create"),
  createProduct
);

router.patch(
  "/:id",
  protect,
  requirePermission("product:update"),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  requirePermission("product:delete"),
  deleteProduct
);

export default router;