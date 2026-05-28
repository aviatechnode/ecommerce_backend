import { Router } from "express";
import { ShippingQuoteController } from "../controllers/shipping-quote.controller.js";

const router = Router();

router.post("/", ShippingQuoteController.create);

router.get("/", ShippingQuoteController.findAll);

router.get(
  "/checkout-session/:checkoutSessionId",
  ShippingQuoteController.findByCheckoutSession
);

router.get("/:id", ShippingQuoteController.findById);

router.patch("/:id", ShippingQuoteController.update);

router.delete("/:id", ShippingQuoteController.delete);

export default router;