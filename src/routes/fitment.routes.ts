import { Router } from "express";
import { FitmentController } from "../controllers/fitment.controller.js";

const router = Router();

//
// CONFIG
//
router.get("/config", FitmentController.getConfig);
router.patch("/config", FitmentController.updateConfig);

//
// RULES
//
router.get("/rules", FitmentController.getRules);
router.post("/rules", FitmentController.createRule);
router.patch("/rules/:id", FitmentController.updateRule);
router.delete("/rules/:id", FitmentController.deleteRule);

//
// OEM REFERENCES
//
router.get("/oem-references", FitmentController.getOEMReferences);
router.post("/oem-references", FitmentController.createOEMReference);
router.patch("/oem-references/:id", FitmentController.updateOEMReference);
router.delete("/oem-references/:id", FitmentController.deleteOEMReference);

//
// CROSS REFERENCES
//
router.get("/cross-references", FitmentController.getCrossReferences);
router.post("/cross-references", FitmentController.createCrossReference);
router.patch("/cross-references/:id", FitmentController.updateCrossReference);
router.delete(
  "/cross-references/:id",
  FitmentController.deleteCrossReference
);

//
// PRODUCT FITMENTS
//
router.get("/fitments", FitmentController.getFitments);
router.post("/fitments", FitmentController.createFitment);
router.patch("/fitments/:id", FitmentController.updateFitment);
router.delete("/fitments/:id", FitmentController.deleteFitment);

//
// RESOLUTION
//
router.post("/resolve", FitmentController.resolveFitment);

//
// INDEX
//
router.post("/rebuild-index", FitmentController.rebuildIndex);

//
// LOGS
//
router.get("/logs", FitmentController.logs);

export default router;