import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

/* ================= PUBLIC ================= */
router.get("/", getProducts);
router.get("/:id", getProduct);

/* ================= PROTECTED ================= */
router.post(
  "/",
  protect,
  requirePermission("product:create"),
  upload.array("images", 5),
  createProduct
);

router.put(
  "/:id",
  protect,
  requirePermission("product:update"),
  upload.array("images", 5),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  requirePermission("product:delete"),
  deleteProduct
);

export default router;