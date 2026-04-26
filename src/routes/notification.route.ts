import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.patch("/:id/read", requireAuth, markAsRead);
router.patch("/read-all", requireAuth, markAllAsRead);

export default router;