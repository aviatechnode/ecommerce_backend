import { Router } from "express";

import { CheckoutSessionController } from "../controllers/checkout-session.controller.js";

const router = Router();

router.post("/", CheckoutSessionController.create);
router.get("/", CheckoutSessionController.findAll);
router.get("/user/:userId", CheckoutSessionController.findByUser);
router.get("/:id", CheckoutSessionController.findById);
router.patch("/:id", CheckoutSessionController.update);
router.patch("/:id/complete", CheckoutSessionController.complete);
router.delete("/:id", CheckoutSessionController.delete);

export default router;