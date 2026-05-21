import { Router } from "express";
import { ShippingRateController } from "../controllers/shipping-rate.controller.js";

const router = Router();

// CREATE
router.post("/",ShippingRateController.create);
// GET ALL
router.get("/",ShippingRateController.findAll);

// GET ONE
router.get("/:id",ShippingRateController.findById);

// UPDATE
router.patch("/:id",ShippingRateController.update);

// TOGGLE ACTIVE
router.patch("/:id/toggle-active",ShippingRateController.toggleActive);

// DELETE
router.delete("/:id",ShippingRateController.delete);

export default router;