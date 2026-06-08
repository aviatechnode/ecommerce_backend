import { Router } from "express";
import { ShippingZoneController } from "../controllers/shipping.zone.controller.js";

const router = Router();

router.get("/", ShippingZoneController.getAll);

router.get("/:id", ShippingZoneController.getById);

router.post("/", ShippingZoneController.create);

router.patch("/:id", ShippingZoneController.update);

router.patch(
  "/:id/status",
  ShippingZoneController.toggleStatus
);

router.delete("/:id", ShippingZoneController.delete);

export default router;