import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import * as addressController from "../controllers/address.controller.js";

const router = Router();

router.use(protect);

router.post("/", addressController.createAddress);
router.get("/", addressController.getMyAddresses);
router.get("/:id", addressController.getAddress);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);
router.patch("/:id/default", addressController.setDefaultAddress);

export default router;