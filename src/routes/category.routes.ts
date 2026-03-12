import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import { protect, requirePermission } from "../middlewares/auth.middleware.js";

const router = Router();

/* ================= CATEGORY ROUTES ================= */

// Public: get categories
router.get("/", getCategories);
router.get("/:id", getCategory);

// Protected: admin or higher
router.post("/", protect, requirePermission("category:create"), createCategory);
router.put("/:id", protect, requirePermission("category:update"), updateCategory);
router.delete("/:id", protect, requirePermission("category:delete"), deleteCategory);

export default router;