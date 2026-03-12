import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { checkout } from "../controllers/checkout.controller.js";

const router = Router();

router.post("/", protect, checkout);

export default router;