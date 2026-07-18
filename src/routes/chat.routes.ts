import { Router } from "express";

import { ChatController } from "../controllers/chat.controller.js";

export function createChatRoutes(
  controller: ChatController,
): Router {
  const router = Router();

  //////////////////////////////////////////////////////
  // CONVERSATIONS
  //////////////////////////////////////////////////////

  router.post(
    "/conversations",
    controller.createConversation,
  );

  router.post(
    "/conversations/fitment",
    controller.createFitmentConversation,
  );

  router.get(
    "/conversations/:conversationId",
    controller.getConversation,
  );

  router.patch(
    "/conversations/assign",
    controller.assignConversation,
  );

  router.patch(
    "/conversations/unassign",
    controller.unassignConversation,
  );

  router.patch(
    "/conversations/status",
    controller.changeStatus,
  );

  router.patch(
    "/conversations/priority",
    controller.changePriority,
  );

  router.patch(
    "/conversations/resolve",
    controller.resolveConversation,
  );

  router.patch(
    "/conversations/close",
    controller.closeConversation,
  );

  router.patch(
    "/conversations/reopen",
    controller.reopenConversation,
  );

  //////////////////////////////////////////////////////
  // MESSAGES
  //////////////////////////////////////////////////////

  router.post(
    "/messages",
    controller.sendMessage,
  );

  router.patch(
    "/messages",
    controller.editMessage,
  );

  router.delete(
    "/messages",
    controller.deleteMessage,
  );

  //////////////////////////////////////////////////////
  // PARTICIPANTS
  //////////////////////////////////////////////////////

  router.post(
    "/participants",
    controller.addParticipant,
  );

  router.delete(
    "/participants",
    controller.removeParticipant,
  );

  router.patch(
    "/participants/mute",
    controller.muteParticipant,
  );

  //////////////////////////////////////////////////////
  // TAGS
  //////////////////////////////////////////////////////

  router.post(
    "/tags",
    controller.addTag,
  );

  router.delete(
    "/tags",
    controller.removeTag,
  );

  return router;
}