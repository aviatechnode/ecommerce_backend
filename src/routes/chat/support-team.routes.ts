import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import { prisma } from "../../lib/prismadb.js";

import { SupportTeamController } from "../../controllers/chat/support-team.controller.js";

import { PrismaSupportTeamGateway } from "../../chat/gateways/prisma-support-team.gateway.js";

import { SupportTeamService } from "../../chat/services/support-team.service.js";

import { SupportTeamPolicy } from "../../chat/policies/support-team.policy.js";

const router = Router();

////////////////////////////////////////////////////////////
// DEPENDENCIES
////////////////////////////////////////////////////////////

const teamGateway =
  new PrismaSupportTeamGateway(
    prisma,
  );

const teamPolicy =
  new SupportTeamPolicy();

const teamService =
  new SupportTeamService(
    teamGateway,
    teamPolicy,
  );

const controller =
  new SupportTeamController(
    teamService,
  );

////////////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////////////

router.post(
  "/teams",
  protect,
  controller.create.bind(controller),
);

////////////////////////////////////////////////////////////
// LIST
////////////////////////////////////////////////////////////

router.get(
  "/teams",
  protect,
  controller.list.bind(controller),
);

////////////////////////////////////////////////////////////
// FIND BY ID
////////////////////////////////////////////////////////////

router.get(
  "/teams/:teamId",
  protect,
  controller.findById.bind(controller),
);

////////////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////////////

router.patch(
  "/teams/:teamId",
  protect,
  controller.update.bind(controller),
);

////////////////////////////////////////////////////////////
// ACTIVATE
////////////////////////////////////////////////////////////

router.patch(
  "/teams/:teamId/activate",
  protect,
  controller.activate.bind(controller),
);

////////////////////////////////////////////////////////////
// DEACTIVATE
////////////////////////////////////////////////////////////

router.patch(
  "/teams/:teamId/deactivate",
  protect,
  controller.deactivate.bind(controller),
);

////////////////////////////////////////////////////////////
// DELETE
////////////////////////////////////////////////////////////

router.delete(
  "/teams/:teamId",
  protect,
  controller.delete.bind(controller),
);

export default router;