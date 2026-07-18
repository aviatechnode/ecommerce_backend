import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  ConversationEventController,
} from "../../controllers/chat/conversation-event.controller.js";

import {
  ConversationEventService,
} from "../../chat/services/conversation-event.service.js";

import {
  PrismaConversationEventGateway,
} from "../../chat/gateways/prisma-conversation-event.gateway.js";

import {
  ConversationEventPolicy,
} from "../../chat/policies/conversation-event.policy.js";

const router = Router();

////////////////////////////////////////////////////////////
// DEPENDENCIES
////////////////////////////////////////////////////////////

const gateway =
  new PrismaConversationEventGateway();

const policy =
  new ConversationEventPolicy();

const service =
  new ConversationEventService(
    gateway,
    policy,
  );

const controller =
  new ConversationEventController(
    service,
  );

////////////////////////////////////////////////////////////
// CRUD
////////////////////////////////////////////////////////////

router.post(
  "/",
  protect,
  controller.create.bind(controller),
);

router.get(
  "/:eventId",
  protect,
  controller.findById.bind(controller),
);

router.get(
  "/",
  protect,
  controller.list.bind(controller),
);

////////////////////////////////////////////////////////////
// GENERIC RECORD
////////////////////////////////////////////////////////////

router.post(
  "/record",
  protect,
  controller.record.bind(controller),
);

////////////////////////////////////////////////////////////
// SPECIALIZED EVENT RECORDING
////////////////////////////////////////////////////////////

router.post(
  "/record/assignment",
  protect,
  controller.recordAssignment.bind(controller),
);

router.post(
  "/record/status-change",
  protect,
  controller.recordStatusChange.bind(controller),
);

router.post(
  "/record/priority-change",
  protect,
  controller.recordPriorityChange.bind(controller),
);

router.post(
  "/record/tag-added",
  protect,
  controller.recordTagAdded.bind(controller),
);

router.post(
  "/record/tag-removed",
  protect,
  controller.recordTagRemoved.bind(controller),
);

router.post(
  "/record/message-sent",
  protect,
  controller.recordMessageSent.bind(controller),
);

router.post(
  "/record/closed",
  protect,
  controller.recordConversationClosed.bind(controller),
);

router.post(
  "/record/resolved",
  protect,
  controller.recordConversationResolved.bind(controller),
);

export default router;