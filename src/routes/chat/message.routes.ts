import { Router } from "express";

import { prisma } from "../../lib/prismadb.js";

import { protect } from "../../middlewares/auth.middleware.js";

import { MessageController } from "../../controllers/chat/message.controller.js";

import { MessageService } from "../../chat/services/message.service.js";

import { PrismaMessageGateway } from "../../chat/gateways/prisma-message.gateway.js";
import { MessagePolicy } from "../../chat/policies/mesaage.policy.js";

import { PrismaConversationParticipantGateway } from "../../chat/gateways/prisma-conservation-participant.gateway.js";
import { ConversationParticipantService } from "../../chat/services/conversation-participant.service.js";
import { ConversationParticipantPolicy } from "../../chat/policies/conversation-participant.policy.js";

import { PrismaMessageReadGateway } from "../../chat/gateways/prisma-message-read.gateway.js";
import { MessageReadService } from "../../chat/services/message-read.service.js";
import { MessageReadPolicy } from "../../chat/policies/message-read.policy.js";

import { PrismaConversationEventGateway } from "../../chat/gateways/prisma-conversation-event.gateway.js";
import { ConversationEventService } from "../../chat/services/conversation-event.service.js";

import { PrismaMessageDraftGateway } from "../../chat/gateways/prisma-message-draft.gateway.js";
import { MessageDraftService } from "../../chat/services/message-draft.service.js";
import { MessageDraftPolicy } from "../../chat/policies/message-draft.policy.js";

import { PrismaNotificationGateway } from "../../chat/gateways/prisma-notification.gateway.js";
import { NotificationService } from "../../chat/services/notification.service.js";
import { NotificationPolicy } from "../../chat/policies/notification.policy.js";

import { PrismaConversationGateway } from "../../chat/gateways/prisma-conversation.gateway.js";
import { ConversationService } from "../../chat/services/conversation.service.js";

const router = Router();

////////////////////////////////////////////////////////////
// GATEWAYS
////////////////////////////////////////////////////////////

const messageGateway =
  new PrismaMessageGateway(
    prisma,
  );

const participantGateway =
  new PrismaConversationParticipantGateway(
    prisma,
  );

const readGateway =
  new PrismaMessageReadGateway(
    prisma,
  );

const eventGateway =
  new PrismaConversationEventGateway(
    prisma,
  );

const draftGateway =
  new PrismaMessageDraftGateway(
    prisma,
  );

const notificationGateway =
  new PrismaNotificationGateway();

const conversationGateway =
  new PrismaConversationGateway(
    prisma,
  );

////////////////////////////////////////////////////////////
// POLICIES
////////////////////////////////////////////////////////////

const participantPolicy =
  new ConversationParticipantPolicy();

const readPolicy =
  new MessageReadPolicy();

const draftPolicy =
  new MessageDraftPolicy();

const notificationPolicy =
  new NotificationPolicy();

const messagePolicy =
  new MessagePolicy();

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

const readService =
  new MessageReadService(
    readGateway,
    readPolicy,
  );

const eventService =
  new ConversationEventService(
    eventGateway,
  );

const draftService =
  new MessageDraftService(
    draftGateway,
    draftPolicy,
  );

const notificationService =
  new NotificationService(
    notificationGateway,
    conversationService,
    participantService,
    notificationPolicy,
);

////////////////////////////////////////////////////////////
// MESSAGE SERVICE
////////////////////////////////////////////////////////////

const messageService =
  new MessageService(
    messageGateway,

    messagePolicy,

    participantService,

    readService,

    eventService,

    draftService,

    notificationService,
);

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

const controller =
  new MessageController(
    messageService,
  );

////////////////////////////////////////////////////////////
// SEND
////////////////////////////////////////////////////////////

router.post(
  "/",
  protect,
  controller.send.bind(controller),
);

router.post(
  "/reply",
  protect,
  controller.reply.bind(controller),
);

////////////////////////////////////////////////////////////
// LIST
////////////////////////////////////////////////////////////

router.post(
  "/list",
  protect,
  controller.list.bind(controller),
);

////////////////////////////////////////////////////////////
// FIND
////////////////////////////////////////////////////////////

router.get(
  "/:messageId",
  protect,
  controller.findById.bind(controller),
);

////////////////////////////////////////////////////////////
// REPLIES
////////////////////////////////////////////////////////////

router.get(
  "/:messageId/replies",
  protect,
  controller.findReplies.bind(controller),
);

////////////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////////////

router.patch(
  "/:messageId",
  protect,
  controller.edit.bind(controller),
);

////////////////////////////////////////////////////////////
// DELETE
////////////////////////////////////////////////////////////

router.delete(
  "/:messageId",
  protect,
  controller.delete.bind(controller),
);

////////////////////////////////////////////////////////////
// READ
////////////////////////////////////////////////////////////

router.patch(
  "/:messageId/read",
  protect,
  controller.markRead.bind(controller),
);

////////////////////////////////////////////////////////////
// DELIVERY
////////////////////////////////////////////////////////////

router.patch(
  "/:messageId/delivered",
  protect,
  controller.markDelivered.bind(controller),
);

export default router;