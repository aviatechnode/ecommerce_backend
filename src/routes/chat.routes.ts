import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";

const router = Router();

///////////////////////////////////////////////////////////
// CONVERSATIONS
///////////////////////////////////////////////////////////

router.get("/conversations", ChatController.getConversations);

router.get("/conversations/:id", ChatController.getConversationById);

router.post("/conversations", ChatController.createConversation);

router.patch("/conversations/:id", ChatController.updateConversation);

///////////////////////////////////////////////////////////
// MESSAGES
///////////////////////////////////////////////////////////

router.post("/conversations/:id/messages", ChatController.sendMessage);

router.get("/conversations/:id/messages", ChatController.getMessages);

router.patch("/messages/:id/read", ChatController.markMessageRead);

router.get("/messages/unread/count", ChatController.getUnreadCount);

///////////////////////////////////////////////////////////
// PARTICIPANTS
///////////////////////////////////////////////////////////

router.post(
  "/conversations/:id/participants",
  ChatController.addParticipant
);

router.delete(
  "/conversations/:id/participants/:userId",
  ChatController.removeParticipant
);

router.patch(
  "/conversations/:id/mute",
  ChatController.muteConversation
);

export default router;