import { Router } from "express";

import { CourierController } from "../controllers/courier.controller.js";

const router = Router();

// COURIERS
router.post("/", CourierController.create);
router.get("/", CourierController.getAll);
router.get("/:id",CourierController.getById);
router.put("/:id",CourierController.update);
router.patch("/:id/toggle", CourierController.toggleStatus);
router.delete("/:id",CourierController.delete);

// COURIER WEBHOOK LOGS
router.post("/webhook-logs",CourierController.createWebhookLog);
router.get("/:id/webhook-logs", CourierController.getWebhookLogsByCourier);
router.patch("/webhook-logs/:id",CourierController.updateWebhookLog);
router.delete("/webhook-logs/:id", CourierController.deleteWebhookLog);
export default router;