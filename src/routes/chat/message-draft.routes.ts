import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import { MessageDraftController } from "../../controllers/chat/message-draft.controller.js";

import { MessageDraftService } from "../../chat/services/message-draft.service.js";

import { PrismaMessageDraftGateway } from "../../chat/gateways/prisma-message-draft.gateway.js";

import { MessageDraftPolicy } from "../../chat/policies/message-draft.policy.js";

import { prisma } from "../../lib/prismadb.js";

const router = Router();

////////////////////////////////////////////////////////////
// GATEWAY
////////////////////////////////////////////////////////////

const draftGateway =
  new PrismaMessageDraftGateway(
    prisma,
  );

////////////////////////////////////////////////////////////
// POLICY
////////////////////////////////////////////////////////////

const policy =
  new MessageDraftPolicy();

////////////////////////////////////////////////////////////
// SERVICE
////////////////////////////////////////////////////////////

const draftService =
  new MessageDraftService(
    draftGateway,

    policy,
  );

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

const controller =
  new MessageDraftController(
    draftService,
  );

////////////////////////////////////////////////////////////
// DRAFT
////////////////////////////////////////////////////////////

router.put(
  "/conversations/:conversationId/draft",
  protect,
  controller.save.bind(controller),
);

router.get(
  "/conversations/:conversationId/draft",
  protect,
  controller.get.bind(controller),
);

router.post(
  "/conversations/:conversationId/draft/restore",
  protect,
  controller.restore.bind(controller),
);

router.delete(
  "/conversations/:conversationId/draft",
  protect,
  controller.delete.bind(controller),
);

export default router;