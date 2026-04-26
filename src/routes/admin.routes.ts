import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getAdminSidebar } from "../controllers/admin.controller.js";
import {
  dashboardStats,
  dashboardChart
} from "../admin/dashboard.controller.js";

const router = Router();

/* ================= DASHBOARD ================= */
router.get("/dashboard", protect, dashboardStats);
router.get("/dashboard/chart", protect, dashboardChart);

/* ================= SIDEBAR ================= */
router.get("/sidebar", protect, getAdminSidebar);

export default router;