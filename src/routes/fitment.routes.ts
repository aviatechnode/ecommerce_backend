// /routes/fitment.routes.ts

import { Router } from "express";
import {
  processFitments,
  searchFitmentProducts,
} from "../controllers/fitment.controller.js";

const router = Router();

router.post("/process/:productId", processFitments);
router.get("/search", searchFitmentProducts);

export default router;