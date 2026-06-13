import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller.js";

const router = Router();

// MAKES
router.post(
  "/makes",
  VehicleController.createMake
);

router.get(
  "/makes",
  VehicleController.findMakes
);

router.get(
  "/makes/:id",
  VehicleController.findMakeById
);

router.patch(
  "/makes/:id",
  VehicleController.updateMake
);

router.delete(
  "/makes/:id",
  VehicleController.deleteMake
);

// MODELS
router.post(
  "/models",
  VehicleController.createModel
);

router.get(
  "/models",
  VehicleController.findModels
);

router.get(
  "/models/:id",
  VehicleController.findModelById
);

router.patch(
  "/models/:id",
  VehicleController.updateModel
);

router.delete(
  "/models/:id",
  VehicleController.deleteModel
);

// GENERATIONS
router.post(
  "/generations",
  VehicleController.createGeneration
);

router.get(
  "/generations",
  VehicleController.findGenerations
);

router.get(
  "/generations/:id",
  VehicleController.findGenerationById
);

router.patch(
  "/generations/:id",
  VehicleController.updateGeneration
);

router.delete(
  "/generations/:id",
  VehicleController.deleteGeneration
);

// ENGINES
router.post(
  "/engines",
  VehicleController.createEngine
);

router.get(
  "/engines",
  VehicleController.findEngines
);

router.get(
  "/engines/:id",
  VehicleController.findEngineById
);

router.patch(
  "/engines/:id",
  VehicleController.updateEngine
);

router.delete(
  "/engines/:id",
  VehicleController.deleteEngine
);

// TRIMS
router.post(
  "/trims",
  VehicleController.createTrim
);

router.get(
  "/trims",
  VehicleController.findTrims
);

router.get(
  "/trims/:id",
  VehicleController.findTrimById
);

router.patch(
  "/trims/:id",
  VehicleController.updateTrim
);

router.delete(
  "/trims/:id",
  VehicleController.deleteTrim
);

export default router;