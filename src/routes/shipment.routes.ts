import { Router } from "express";

import { ShipmentController } from "../controllers/shipment.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/* =========================================================
PROTECTED ROUTES
========================================================= */

router.use(protect);

/* =========================================================
SHIPMENT ROUTES
========================================================= */

// CREATE SHIPMENT
router.post(
  "/",
  ShipmentController.create
);

// GET ALL SHIPMENTS
router.get(
  "/",
  ShipmentController.getAll
);

// TRACK SHIPMENT
router.get(
  "/track/:trackingNumber",
  ShipmentController.trackShipment
);

// GET SHIPMENT BY ID
router.get(
  "/:id",
  ShipmentController.getById
);

// UPDATE FULL SHIPMENT
router.patch(
  "/:id",
  ShipmentController.update
);

// UPDATE SHIPMENT STATUS
router.patch(
  "/:id/status",
  ShipmentController.updateStatus
);

// DELETE SHIPMENT
router.delete(
  "/:id",
  ShipmentController.remove
);

export default router;