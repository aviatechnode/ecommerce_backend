import { Router } from "express";

import { prisma } from "../../lib/prismadb.js";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  ConversationSLAController,
} from "../../controllers/chat/conversation-sla.controller.js";

import {
  ConversationSLAService,
} from "../../chat/services/conversation-sla.service.js";

import {
  PrismaConversationSLAGateway,
} from "../../chat/gateways/prisma-conversation-sla.gateway.js";

import {
  ConversationSLAPolicy,
} from "../../chat/policies/conversation_sla.policy.js";

const router = Router();

const gateway =
  new PrismaConversationSLAGateway(
    prisma,
  );

const policy =
  new ConversationSLAPolicy();

const service =
  new ConversationSLAService(
    gateway,
    policy,
  );

const controller =
  new ConversationSLAController(
    service,
  );

////////////////////////////////////////////////////////////
// CRUD
////////////////////////////////////////////////////////////

router.post(
  "/conversations/:conversationId/sla",
  protect,
  controller.create.bind(controller),
);

router.get(
  "/sla/:slaId",
  protect,
  controller.findById.bind(controller),
);

router.get(
  "/conversations/:conversationId/sla",
  protect,
  controller.findByConversation.bind(controller),
);

router.patch(
  "/conversations/:conversationId/sla",
  protect,
  controller.update.bind(controller),
);

router.delete(
  "/conversations/:conversationId/sla",
  protect,
  controller.delete.bind(controller),
);

////////////////////////////////////////////////////////////
// SLA EVENTS
////////////////////////////////////////////////////////////

router.post(
  "/conversations/:conversationId/sla/first-response/breach",
  protect,
  controller.markFirstResponseBreached.bind(
    controller,
  ),
);

router.post(
  "/conversations/:conversationId/sla/resolution/breach",
  protect,
  controller.markResolutionBreached.bind(
    controller,
  ),
);

router.post(
  "/conversations/:conversationId/sla/first-response",
  protect,
  controller.markFirstResponded.bind(
    controller,
  ),
);

router.post(
  "/conversations/:conversationId/sla/resolved",
  protect,
  controller.markResolved.bind(
    controller,
  ),
);

export default router;