import { Router } from "express";
import { ShippingZoneController } from "../controllers/shipping.zone.controller.js";

const router = Router();

// ==================== SHIPPING ZONES ====================
// Static routes (no :id as first segment)
router.post("/", ShippingZoneController.createZone);
router.get("/", ShippingZoneController.getAllZones);
router.get("/active", ShippingZoneController.getActiveZones);

// SHIPPING ZONE STATES
router.post("/states", ShippingZoneController.createStateMapping);
router.get("/states", ShippingZoneController.getAllStateMappings);
router.post("/states/bulk", ShippingZoneController.bulkAssignStates);
router.get("/state/:stateId/zones", ShippingZoneController.getZonesByState);

// SHIPPING ZONE LGAS
router.post("/lgas", ShippingZoneController.createLGAMapping);
router.get("/lgas", ShippingZoneController.getAllLGAMappings);
router.post("/lgas/bulk", ShippingZoneController.bulkAssignLGAs);
router.get("/lga/:lgaId/zones", ShippingZoneController.getZonesByLGA);

// ==================== Routes with :id + extra path ====================
router.delete("/:id/states", ShippingZoneController.clearZoneStates);
router.delete("/:id/lgas", ShippingZoneController.clearZoneLGAs);
router.get("/:id/lgas", ShippingZoneController.getLGAsByZone);

// ==================== Single :id routes (must be last) ====================
router.get("/states/:id", ShippingZoneController.getStateMappingById);
router.put("/states/:id", ShippingZoneController.updateStateMapping);
router.delete("/states/:id", ShippingZoneController.deleteStateMapping);

router.get("/lgas/:id", ShippingZoneController.getLGAMappingById);
router.put("/lgas/:id", ShippingZoneController.updateLGAMapping);
router.delete("/lgas/:id", ShippingZoneController.deleteLGAMapping);

router.get("/:id", ShippingZoneController.getZoneById);
router.put("/:id", ShippingZoneController.updateZone);
router.patch("/:id/toggle", ShippingZoneController.toggleZoneStatus);
router.delete("/:id", ShippingZoneController.deleteZone);

export default router;