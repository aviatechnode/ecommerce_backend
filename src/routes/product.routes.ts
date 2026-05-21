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

/**
 * GET ALL PRODUCTS
 * Supports filters/search/query params inside controller
 */
router.get("/", getProducts);

/**
 * GET SINGLE PRODUCT
 */
router.get("/:id", getProduct);

//////////////////////////////////////////////////////////
// PROTECTED ROUTES
//////////////////////////////////////////////////////////

/**
 * CREATE PRODUCT
 */
router.post(
  "/",
  protect,
  requirePermission("product:create"),
  createProduct
);

/**
 * UPDATE PRODUCT
 */
router.patch(
  "/:id",
  protect,
  requirePermission("product:update"),
  updateProduct
);

/**
 * SOFT DELETE PRODUCT
 */
router.delete(
  "/:id",
  protect,
  requirePermission("product:delete"),
  deleteProduct
);

export default router;