import { Router } from "express";

import {
  assignProductFitment,
  bulkAssignProductFitment,
  createEngine,
  createGeneration,
  createMake,
  createModel,
  createTrim,
  getProductsByFitment,
  getVehicleTree,
} from "../controllers/fitment.controller.js";

const router = Router();

// VEHICLE TREE
router.post("/makes", createMake);

router.post("/models", createModel);

router.post("/generations", createGeneration);

router.post("/engines", createEngine);

router.post("/trims", createTrim);

// Assign single fitment
router.post(
  "/products/assign",
  assignProductFitment
);

// Bulk assign fitments using trimIds
router.post(
  "/products/bulk-assign",
  bulkAssignProductFitment
);

// Get products by fitment filters
router.get(
  "/products",
  getProductsByFitment
);

// Full nested make → model → generation → engine → trim tree
router.get(
  "/tree",
  getVehicleTree
);

export default router;