import { Router } from "express";
import { ShipmentController } from "../controllers/shipment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

/* =========================================================
SHIPMENT ROUTES
========================================================= */

// CREATE
router.post("/", ShipmentController.create);

// GET ALL
router.get("/", ShipmentController.getAll);

// GET ONE
router.get("/:id", ShipmentController.getById);

// UPDATE FULL SHIPMENT
router.patch("/:id", ShipmentController.update);

// UPDATE STATUS ONLY
router.patch("/:id/status", ShipmentController.updateStatus);

// DELETE
router.delete("/:id", ShipmentController.remove);

export default router;