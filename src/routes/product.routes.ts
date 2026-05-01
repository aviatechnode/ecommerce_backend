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

//////////////////////////////////////////////////////////
// PUBLIC ROUTES
//////////////////////////////////////////////////////////

// Get all active products (with filters/search handled in controller)
router.get("/", getProducts);

// Get single product by ID
router.get("/:id", getProduct);

//////////////////////////////////////////////////////////
// PROTECTED ROUTES
//////////////////////////////////////////////////////////

// Create product
router.post(
  "/",
  protect,
  requirePermission("product:create"),
  createProduct
);

// Update product
router.patch(
  "/:id",
  protect,
  requirePermission("product:update"),
  updateProduct
);

// Soft delete product (recommended for production)
router.delete(
  "/:id",
  protect,
  requirePermission("product:delete"),
  deleteProduct
);

export default router;