import { Router } from "express";
import {
  createConversation,
  getUserConversations,
  getMessages,
} from "../controllers/chat.controller.js";

const router = Router();

router.post("/conversation", createConversation);
router.get("/conversations/:userId", getUserConversations);
router.get("/messages/:conversationId", getMessages);

export default router;