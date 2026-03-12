import { Router } from "express";
import {
  createShipment,
  updateShipmentStatus,
  getShipment,
} from "../controllers/shipment.controller.js";

const router = Router();

router.post("/shipment", createShipment);
router.patch("/shipment/:id/status", updateShipmentStatus);
router.get("/shipment/:id", getShipment);

export default router;