import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { EventOutboxController } from "../../controllers/chat/outbox-event.controller.js";
import { PrismaEventOutboxGateway } from "../../chat/gateways/prisma-outbox-event.gateway.js";
import { EventOutboxService } from "../../chat/services/outbox-event.service.js";
import { EventOutboxPolicy,} from "../../chat/policies/outbox-event.policy.js";
import { EventDispatcher,} from "../../chat/event-dispatcher/event-dispatcher.js";

////////////////////////////////////////////////////////////
// ROUTER
////////////////////////////////////////////////////////////

const router = Router();

////////////////////////////////////////////////////////////
// GATEWAY
////////////////////////////////////////////////////////////

const gateway =
  new PrismaEventOutboxGateway();

////////////////////////////////////////////////////////////
// POLICY
////////////////////////////////////////////////////////////

const policy = new EventOutboxPolicy();

////////////////////////////////////////////////////////////
// EVENT HANDLERS
////////////////////////////////////////////////////////////
import { NotificationEventHandler } from "../../chat/handlers/notification-event.handler.js";
import { WebsocketEventHandler,} from "../../chat/handlers/websocket-event.handlers.js";

import { SlaEventHandler } from "../../chat/handlers/sla-event.handler.js";

import { ConversationEventHandler } from "../../chat/handlers/conversation-event.handler.js";
import { NotificationService } from "../../chat/services/notification.service.js";
import { ConversationEventService } from "../../chat/services/conversation-event.service.js";

////////////////////////////////////////////////////////////
// SERVICES
////////////////////////////////////////////////////////////

const notificationService = new NotificationService(
    notificationGateway,
    conversationService,
    participantService,
    notificationPolicy,
  );

const slaService = new ConversationSLAService(
    slaGateway,
    slaPolicy,
  );

const conversationEventService = new ConversationEventService(
    conversationEventGateway,
  );

////////////////////////////////////////////////////////////
// EVENT HANDLERS
////////////////////////////////////////////////////////////

const handlers = [
  new NotificationEventHandler(
    notificationService,
  ),

  new WebsocketEventHandler(io,),

  new SlaEventHandler(
    slaService,
  ),

  new ConversationEventHandler(
    conversationEventService,
  ),
];

////////////////////////////////////////////////////////////
// DISPATCHER
////////////////////////////////////////////////////////////

const dispatcher =
  new EventDispatcher(
    handlers,
  );
////////////////////////////////////////////////////////////
// SERVICE
////////////////////////////////////////////////////////////

const service =
  new EventOutboxService(
    gateway,
    policy,
    dispatcher,
  );

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

const controller =
  new EventOutboxController(
    service,
  );

////////////////////////////////////////////////////////////
// PUBLISH
////////////////////////////////////////////////////////////

router.post(
  "/",
  protect,
  controller.publish.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// FIND
////////////////////////////////////////////////////////////

router.get(
  "/:eventId",
  protect,
  controller.findById.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// PROCESS
////////////////////////////////////////////////////////////

router.post(
  "/process",
  protect,
  controller.processPending.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// PROCESSING STATUS
////////////////////////////////////////////////////////////

router.patch(
  "/:eventId/processed",
  protect,
  controller.markProcessed.bind(
    controller,
  ),
);

router.patch(
  "/:eventId/failed",
  protect,
  controller.markFailed.bind(
    controller,
  ),
);

router.patch(
  "/:eventId/retry",
  protect,
  controller.retry.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// LOCKING
////////////////////////////////////////////////////////////

router.patch(
  "/:eventId/lock",
  protect,
  controller.lock.bind(
    controller,
  ),
);

router.patch(
  "/:eventId/unlock",
  protect,
  controller.unlock.bind(
    controller,
  ),
);

////////////////////////////////////////////////////////////
// HOUSEKEEPING
////////////////////////////////////////////////////////////

router.delete(
  "/expired",
  protect,
  controller.deleteExpired.bind(
    controller,
  ),
);

export default router;