import { Router } from "express";

import {
  SupportTeamEventController,
} from "../../controllers/chat/support-team-event.controller.js";

export function createSupportTeamEventRoutes(
  controller: SupportTeamEventController,
): Router {
  const router =
    Router();

  ////////////////////////////////////////////////////////////
  // RECORD EVENT
  ////////////////////////////////////////////////////////////

  router.post(
    "/",
    controller.record.bind(
      controller,
    ),
  );

  ////////////////////////////////////////////////////////////
  // FIND EVENT
  ////////////////////////////////////////////////////////////

  router.get(
    "/:eventId",
    controller.findById.bind(
      controller,
    ),
  );

  ////////////////////////////////////////////////////////////
  // LIST TEAM EVENTS
  ////////////////////////////////////////////////////////////

  router.get(
    "/",
    controller.list.bind(
      controller,
    ),
  );

  return router;
}