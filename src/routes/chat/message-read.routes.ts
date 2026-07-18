import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import { MessageReadController } from "../../controllers/chat/message-read.controller.js";

import { MessageReadService } from "../../chat/services/message-read.service.js";

import { PrismaMessageReadGateway } from "../../chat/gateways/prisma-message-read.gateway.js";

import { MessageReadPolicy } from "../../chat/policies/message-read.policy.js";

import { prisma } from "../../lib/prismadb.js";

const router = Router();

////////////////////////////////////////////////////////////
// GATEWAY
////////////////////////////////////////////////////////////

const readGateway =
  new PrismaMessageReadGateway(
    prisma,
  );

////////////////////////////////////////////////////////////
// POLICY
////////////////////////////////////////////////////////////

const readPolicy =
  new MessageReadPolicy();

////////////////////////////////////////////////////////////
// SERVICE
////////////////////////////////////////////////////////////

const readService =
  new MessageReadService(
    readGateway,
    readPolicy,
  );

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

const controller =
  new MessageReadController(
    readService,
  );

////////////////////////////////////////////////////////////
// MESSAGE READ RECEIPTS
////////////////////////////////////////////////////////////

// Mark one message as read
router.post(
  "/messages/:messageId/read",
  protect,
  controller.markRead.bind(
    controller,
  ),
);

// Get current user's read receipt
router.get(
  "/messages/:messageId/read",
  protect,
  controller.find.bind(
    controller,
  ),
);

// Check whether current user has read message
router.get(
  "/messages/:messageId/is-read",
  protect,
  controller.isRead.bind(
    controller,
  ),
);

// List users who read message
router.get(
  "/messages/:messageId/reads",
  protect,
  controller.list.bind(
    controller,
  ),
);

// Count users who read message
router.get(
  "/messages/:messageId/read-count",
  protect,
  controller.count.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// CONVERSATION BULK READ
////////////////////////////////////////////////////////////

router.post(
  "/conversations/:conversationId/read",
  protect,
  controller.markConversationRead.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// MULTIPLE MESSAGE READ
////////////////////////////////////////////////////////////

router.post(
  "/messages/read",
  protect,
  controller.markMessagesRead.bind(
    controller,
  ),
);

export default router;