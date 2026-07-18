import { Router } from "express";
import { ConversationController } from "../../controllers/chat/conversation.controller.js";
import { ConversationService } from "../../chat/services/conversation.service.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { PrismaConversationGateway } from "../../chat/gateways/prisma-conversation.gateway.js";

const router = Router();

const gateway = new PrismaConversationGateway();
const service = new ConversationService(gateway,);

const controller = new ConversationController(service,);

////////////////////////////////////////////////////////////
// CRUD
////////////////////////////////////////////////////////////

router.post(
  "/",
  protect,
  controller.create.bind(controller),
);

router.get(
  "/",
  protect,
  controller.list.bind(controller),
);

router.get(
  "/:conversationId",
  protect,
  controller.findById.bind(controller),
);

router.patch(
  "/:conversationId",
  protect,
  controller.updateDetails.bind(controller),
);

router.delete(
  "/:conversationId",
  protect,
  controller.delete.bind(controller),
);

////////////////////////////////////////////////////////////
// ASSIGNMENT
////////////////////////////////////////////////////////////

router.patch(
  "/:conversationId/assign",
  protect,
  controller.assign.bind(controller),
);

router.patch(
  "/:conversationId/transfer",
  protect,
  controller.transfer.bind(controller),
);

////////////////////////////////////////////////////////////
// STATUS
////////////////////////////////////////////////////////////

router.patch(
  "/:conversationId/status",
  protect,
  controller.updateStatus.bind(controller),
);

router.patch(
  "/:conversationId/priority",
  protect,
  controller.updatePriority.bind(controller),
);

router.patch(
  "/:conversationId/resolve",
  protect,
  controller.resolve.bind(controller),
);

router.patch(
  "/:conversationId/close",
  protect,
  controller.close.bind(controller),
);

router.patch(
  "/:conversationId/reopen",
  protect,
  controller.reopen.bind(controller),
);

////////////////////////////////////////////////////////////
// LIFECYCLE
////////////////////////////////////////////////////////////

router.patch(
  "/:conversationId/archive",
  protect,
  controller.archive.bind(controller),
);

router.patch(
  "/:conversationId/restore",
  protect,
  controller.restore.bind(controller),
);

router.patch(
  "/:conversationId/lock",
  protect,
  controller.lock.bind(controller),
);

router.patch(
  "/:conversationId/unlock",
  protect,
  controller.unlock.bind(controller),
);

////////////////////////////////////////////////////////////
// RATING
////////////////////////////////////////////////////////////

router.post(
  "/:conversationId/rating",
  protect,
  controller.rate.bind(controller),
);

////////////////////////////////////////////////////////////
// ADVANCED
////////////////////////////////////////////////////////////

router.post(
  "/merge",
  protect,
  controller.merge.bind(controller),
);

export default router;