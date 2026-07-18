import { Router } from "express";
import { prisma } from "../../lib/prismadb.js";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  ConversationParticipantController,
} from "../../controllers/chat/conversation-participant.controller.js";

import {
  ConversationParticipantService,
} from "../../chat/services/conversation-participant.service.js";

import { PrismaConversationParticipantGateway } from "../../chat/gateways/prisma-conservation-participant.gateway.js";

import {
  ConversationParticipantPolicy,
} from "../../chat/policies/conversation-participant.policy.js";

const router = Router();

const gateway = new PrismaConversationParticipantGateway(prisma);

const policy = new ConversationParticipantPolicy();

const service =
  new ConversationParticipantService(
    gateway,
    policy,
  );

const controller =
  new ConversationParticipantController(
    service,
  );

////////////////////////////////////////////////////////////
// MEMBERSHIP
////////////////////////////////////////////////////////////

router.post(
  "/conversations/:conversationId/participants",
  protect,
  controller.add.bind(controller),
);

router.delete(
  "/conversations/:conversationId/participants/:userId",
  protect,
  controller.remove.bind(controller),
);

////////////////////////////////////////////////////////////
// FIND
////////////////////////////////////////////////////////////

router.get(
  "/participants/:participantId",
  protect,
  controller.findById.bind(controller),
);

router.get(
  "/conversations/:conversationId/participants",
  protect,
  controller.findByConversation.bind(controller),
);

router.get(
  "/participants",
  protect,
  controller.list.bind(controller),
);

router.get(
  "/participants/me",
  protect,
  controller.findByUser.bind(controller),
);

router.get(
  "/conversations/:conversationId/participants/me",
  protect,
  controller.findParticipant.bind(controller),
);

////////////////////////////////////////////////////////////
// MUTE
////////////////////////////////////////////////////////////

router.patch(
  "/conversations/:conversationId/participants/me/mute",
  protect,
  controller.mute.bind(controller),
);

////////////////////////////////////////////////////////////
// UNREAD
////////////////////////////////////////////////////////////

router.patch(
  "/conversations/:conversationId/participants/me/unread",
  protect,
  controller.updateUnreadCount.bind(controller),
);

router.post(
  "/conversations/:conversationId/participants/me/unread/increment",
  protect,
  controller.incrementUnreadCount.bind(controller),
);

router.post(
  "/conversations/:conversationId/participants/me/unread/reset",
  protect,
  controller.resetUnreadCount.bind(controller),
);

////////////////////////////////////////////////////////////
// READ
////////////////////////////////////////////////////////////

router.post(
  "/conversations/:conversationId/participants/me/read",
  protect,
  controller.markConversationRead.bind(controller),
);

export default router;