import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import * as addressController from "../controllers/address.controller.js";
import { validateIdParam } from "../middlewares/validate-id-param.middleware.js";

const router = Router();

router.use(protect);

/* =========================================================
ROUTES
========================================================= */

// CREATE
router.post("/", addressController.createAddress);

// GET ALL (FIX ADDED)
router.get("/", addressController.getMyAddresses);

// GET ONE
router.get("/:id", validateIdParam, addressController.getAddress);

// UPDATE
router.patch("/:id", validateIdParam, addressController.updateAddress);

// DELETE
router.delete("/:id", validateIdParam, addressController.deleteAddress);

// SET DEFAULT
router.patch(
  "/:id/default",
  validateIdParam,
  addressController.setDefaultAddress
);

export default router;