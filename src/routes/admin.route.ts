import { dashboardStats } from "../admin/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/auth.middleware.js"; 
import { Router } from "express";

const router = Router();

router.get(
  "/admin/stats",
  protect,
  requirePermission("dashboard:read"),
  dashboardStats
);

export default router;