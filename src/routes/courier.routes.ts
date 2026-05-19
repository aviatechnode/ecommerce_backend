import { Router } from "express";
import { CourierController } from "../controllers/courier.controller.js";

const router = Router();

router.post("/", CourierController.create);
router.get("/", CourierController.getAll);
router.get("/:id", CourierController.getById);
router.put("/:id", CourierController.update);
router.patch("/:id/toggle", CourierController.toggleStatus);
router.delete("/:id", CourierController.delete);

export default router;