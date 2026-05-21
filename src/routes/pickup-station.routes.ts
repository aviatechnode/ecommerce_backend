import { Router } from "express";

import { PickupStationController } from "../controllers/pickup-station.controller.js";

const router = Router();


  // PICKUP STATIONS
router.post(
  "/",
  PickupStationController.create
);

router.get(
  "/",
  PickupStationController.getAll
);

router.get(
  "/active",
  PickupStationController.getActive
);

router.post(
  "/validate-delivery",
  PickupStationController.validateDelivery
);

router.get(
  "/:id",
  PickupStationController.getById
);

router.put(
  "/:id",
  PickupStationController.update
);

router.patch(
  "/:id/toggle",
  PickupStationController.toggleActive
);

router.delete(
  "/:id",
  PickupStationController.delete
);

export default router;