import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import { prisma } from "../../lib/prismadb.js";

import { NotificationController } from "../../controllers/chat/notification.controller.js";

import { NotificationService } from "../../chat/services/notification.service.js";

import { PrismaNotificationGateway } from "../../chat/gateways/prisma-notification.gateway.js";

import { NotificationPolicy } from "../../chat/policies/notification.policy.js";

import { PrismaConversationGateway } from "../../chat/gateways/prisma-conversation.gateway.js";
import { ConversationService } from "../../chat/services/conversation.service.js";

import { PrismaConversationParticipantGateway } from "../../chat/gateways/prisma-conservation-participant.gateway.js";
import { ConversationParticipantService } from "../../chat/services/conversation-participant.service.js";

import { ConversationParticipantPolicy } from "../../chat/policies/conversation-participant.policy.js";

const router = Router();

////////////////////////////////////////////////////////////
// GATEWAYS
////////////////////////////////////////////////////////////

const notificationGateway =
  new PrismaNotificationGateway();

const conversationGateway =
  new PrismaConversationGateway(
    prisma,
  );

const participantGateway =
  new PrismaConversationParticipantGateway(
    prisma,
  );

////////////////////////////////////////////////////////////
// POLICIES
////////////////////////////////////////////////////////////

const notificationPolicy =
  new NotificationPolicy();

const participantPolicy =
  new ConversationParticipantPolicy();

////////////////////////////////////////////////////////////
// SERVICES
////////////////////////////////////////////////////////////

const conversationService =
  new ConversationService(
    conversationGateway,
  );

const participantService =
  new ConversationParticipantService(
    participantGateway,

    participantPolicy,
  );

const notificationService =
  new NotificationService(
    notificationGateway,

    conversationService,

    participantService,

    notificationPolicy,
  );

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

const controller =
  new NotificationController(
    notificationService,
  );

////////////////////////////////////////////////////////////
// LIST
////////////////////////////////////////////////////////////

router.get(
  "/",
  protect,
  controller.list.bind(controller),
);

////////////////////////////////////////////////////////////
// FIND
////////////////////////////////////////////////////////////

router.get(
  "/:notificationId",
  protect,
  controller.findById.bind(controller),
);

////////////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////////////

router.post(
  "/",
  protect,
  controller.create.bind(controller),
);

////////////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////////////

router.patch(
  "/:notificationId",
  protect,
  controller.update.bind(controller),
);

////////////////////////////////////////////////////////////
// MARK AS READ
////////////////////////////////////////////////////////////

router.patch(
  "/:notificationId/read",
  protect,
  controller.markAsRead.bind(controller),
);

////////////////////////////////////////////////////////////
// MARK ALL AS READ
////////////////////////////////////////////////////////////

router.patch(
  "/read-all",
  protect,
  controller.markAllAsRead.bind(controller),
);

////////////////////////////////////////////////////////////
// DELETE
////////////////////////////////////////////////////////////

router.delete(
  "/:notificationId",
  protect,
  controller.delete.bind(controller),
);

////////////////////////////////////////////////////////////
// DELETE ALL
////////////////////////////////////////////////////////////

router.delete(
  "/",
  protect,
  controller.deleteAll.bind(controller),
);

export default router;