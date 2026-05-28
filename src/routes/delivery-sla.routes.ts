import { Router } from "express";

import { DeliverySLAController } from "../controllers/delivery-sla.controller.js";

const router = Router();

router.post("/", DeliverySLAController.create);
router.get("/", DeliverySLAController.findAll);
router.get("/courier/:courierId", DeliverySLAController.findByCourier);
router.get("/zone/:zoneId", DeliverySLAController.findByZone);
router.get("/:id", DeliverySLAController.findById);
router.patch("/:id", DeliverySLAController.update);
router.delete("/:id", DeliverySLAController.delete);

export default router;