import { Router } from "express";

import {
  assignProductFitment,
  bulkAssignProductFitment,
  createEngine,
  createGeneration,
  createMake,
  createModel,
  createTrim,
  deleteEngine,
  deleteGeneration,
  deleteMake,
  deleteModel,
  deleteTrim,
  getProductsByFitment,
  getVehicleTree,
  updateEngine,
  updateGeneration,
  updateMake,
  updateModel,
  updateTrim,
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


/* =========================================================
DELETE
========================================================= */

router.delete("/makes/:id", deleteMake);
router.delete("/models/:id", deleteModel);
router.delete("/generations/:id", deleteGeneration);
router.delete("/engines/:id", deleteEngine);
router.delete("/trims/:id", deleteTrim);

/* =========================================================
UPDATE
========================================================= */

router.put("/makes/:id", updateMake);
router.put("/models/:id", updateModel);
router.put("/generations/:id", updateGeneration);
router.put("/engines/:id", updateEngine);
router.put("/trims/:id", updateTrim);