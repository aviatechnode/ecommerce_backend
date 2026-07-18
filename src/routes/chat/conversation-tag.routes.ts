import { Router } from "express";

import { prisma } from "../../lib/prismadb.js";

import { protect } from "../../middlewares/auth.middleware.js";

import {
  ConversationTagController,
} from "../../controllers/chat/conversation-tag.controller.js";

import {
  ConversationTagService,
} from "../../chat/services/conversation-tag.service.js";

import {
  PrismaConversationTagGateway,
} from "../../chat/gateways/prisma-conversation-tag.gateway.js";

import {
  ConversationTagPolicy,
} from "../../chat/policies/conversation-tag.policy.js";

const router = Router();

////////////////////////////////////////////////////////////
// DEPENDENCY COMPOSITION
////////////////////////////////////////////////////////////

const gateway =
  new PrismaConversationTagGateway(
    prisma,
  );

const policy =
  new ConversationTagPolicy();

const service =
  new ConversationTagService(
    gateway,
    policy,
  );

const controller =
  new ConversationTagController(
    service,
  );

////////////////////////////////////////////////////////////
// TAG CRUD
////////////////////////////////////////////////////////////

router.post(
  "/tags",
  protect,
  controller.create.bind(controller),
);

router.get(
  "/tags",
  protect,
  controller.list.bind(controller),
);

router.get(
  "/tags/:tagId",
  protect,
  controller.findById.bind(controller),
);

router.patch(
  "/tags/:tagId",
  protect,
  controller.update.bind(controller),
);

router.delete(
  "/tags/:tagId",
  protect,
  controller.delete.bind(controller),
);

////////////////////////////////////////////////////////////
// CONVERSATION TAGS
////////////////////////////////////////////////////////////

router.get(
  "/conversations/:conversationId/tags",
  protect,
  controller.listByConversation.bind(
    controller,
  ),
);

router.post(
  "/conversations/:conversationId/tags/:tagId",
  protect,
  controller.assign.bind(controller),
);

router.delete(
  "/conversations/:conversationId/tags/:tagId",
  protect,
  controller.remove.bind(controller),
);

export default router;