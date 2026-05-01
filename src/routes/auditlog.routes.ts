import { Router } from "express";
import { createAuditLog, getAuditLogs } from "../controllers/auditlog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/* =========================
ADMIN / SYSTEM ROUTES
========================= */

router.post("/", protect, createAuditLog);
router.get("/", protect, getAuditLogs);

export default router;