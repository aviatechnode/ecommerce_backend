import { Router } from "express";

import { FulfillmentController } from "../controllers/fulfillment.controller.js";

const router = Router();

router.post("/", FulfillmentController.create);
router.get("/", FulfillmentController.findAll);
router.get("/order/:orderId", FulfillmentController.findByOrder);
router.get("/:id", FulfillmentController.findById);
router.patch("/:id", FulfillmentController.update);
router.delete("/:id", FulfillmentController.delete);

export default router;