import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import * as addressController from "../controllers/address.controller.js";
import { validateIdParam } from "../middlewares/validate-id-param.middleware.js";

const router = Router();

router.use(protect);

/* =========================================================
ROUTES
========================================================= */

router.post("/", addressController.createAddress);

router.get("/:id", validateIdParam, addressController.getAddress);

router.patch("/:id", validateIdParam, addressController.updateAddress);

router.delete("/:id", validateIdParam, addressController.deleteAddress);

router.patch(
  "/:id/default",
  validateIdParam,
  addressController.setDefaultAddress
);

export default router;