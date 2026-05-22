import { Router } from "express";
import { ShipmentEventController } from "../controllers/shipment.event.controller.js";

const router = Router();

/**
 * Create shipment event
 */
router.post(
  "/",
  ShipmentEventController.createEvent
);

/**
 * Get all events for a shipment
 */
router.get(
  "/shipment/:shipmentId",
  ShipmentEventController.getShipmentEvents
);

/**
 * Get single shipment event
 */
router.get(
  "/:id",
  ShipmentEventController.getEventById
);

/**
 * Update shipment event
 */
router.patch(
  "/:id",
  ShipmentEventController.updateEvent
);

/**
 * Delete shipment event
 */
router.delete(
  "/:id",
  ShipmentEventController.deleteEvent
);

export default router;