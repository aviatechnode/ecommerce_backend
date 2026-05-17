import { Router } from "express";
import {
  getStates,
  getLgasByState,
} from "../controllers/location.controller.js";

const router = Router();

router.get("/states", getStates);
router.get("/states/:stateId/lgas", getLgasByState);

export default router;