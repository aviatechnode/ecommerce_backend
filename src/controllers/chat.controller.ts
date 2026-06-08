import type { Request, Response } from "express";
import { z } from "zod";
import WebSocket from "ws";

import { prisma } from "../lib/prismadb.js";
import { ChatService } from "../modules/chat/chatService.js";
import {
  ConversationStatus,
  ConversationPriority,
  MessageType,
  ConversationChannel,
  ConversationRole,
} from "@prisma/client";
import { getParam } from "../utils/getParam.js";

///////////////////////////////////////////////////////////
// VALIDATION
///////////////////////////////////////////////////////////

const createConversationSchema = z.object({
  customerId: z.string().optional(),
  assignedAdminId: z.string().optional(),
  orderId: z.string().optional(),
  shipmentId: z.string().optional(),
  returnRequestId: z.string().optional(),
  subject: z.string().optional(),
  channel: z.nativeEnum(ConversationChannel).optional(),
  priority: z.nativeEnum(ConversationPriority).optional(),
  participants: z.array(z.string()).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.nativeEnum(MessageType).optional(),
  replyToId: z.string().optional(),
  isInternal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        size: z.number(),
        extension: z.string().optional(),
      })
    )
    .optional(),
});

const updateConversationSchema = z.object({
  status: z.nativeEnum(ConversationStatus).optional(),
  priority: z.nativeEnum(ConversationPriority).optional(),
  assignedAdminId: z.string().nullable().optional(),
  subject: z.string().optional(),
  isLocked: z.boolean().optional(),
});

const participantSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(ConversationRole),
});

const muteSchema = z.object({
  muted: z.boolean(),
});

///////////////////////////////////////////////////////////
// CONTROLLER
///////////////////////////////////////////////////////////

export class ChatController {
  ///////////////////////////////////////////////////////////
  // CONVERSATIONS
  ///////////////////////////////////////////////////////////

  static async getConversations(req: Request, res: Response) {
    try {
      const user = req.user!;
      const conversations = await ChatService.getConversationsForUser(
        user.id,
        user.role,
        req.query
      );

      res.json({ conversations });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getConversationById(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const conversation = await ChatService.getConversationById(
        conversationId,
        req.user!.id,
        req.user!.role
      );

      if (!conversation) {
        res.status(404).json({ message: "Conversation not found" });
        return;
      }

      res.json({ conversation });
    } catch (err: any) {
      res.status(err.message === "Access denied" ? 403 : 500).json({
        message: err.message,
      });
    }
  }

  static async createConversation(req: Request, res: Response) {
    try {
      const parsed = createConversationSchema.parse(req.body);
      const conversation = await ChatService.createConversation(parsed);

      res.status(201).json({ conversation });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ errors: err.flatten() });
        return;
      }
      res.status(500).json({ message: err.message });
    }
  }

  static async updateConversation(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const updates = updateConversationSchema.parse(req.body);
      const conversation = await ChatService.updateConversation(
        conversationId,
        updates
      );

      res.json({ conversation });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ errors: err.flatten() });
        return;
      }
      res.status(500).json({ message: err.message });
    }
  }

  ///////////////////////////////////////////////////////////
  // MESSAGES
  ///////////////////////////////////////////////////////////

  static async sendMessage(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const senderId = req.user!.id;
      const parsed = sendMessageSchema.parse(req.body);

      const message = await ChatService.addMessage({
        conversationId,
        senderId,
        ...parsed,
      });

      const wss = req.app.get("wss");
      if (wss) {
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });

        for (const p of participants) {
          if (p.userId === senderId) continue;

          wss.clients.forEach((client: any) => {
            if (
              client.userId === p.userId &&
              client.readyState === WebSocket.OPEN
            ) {
              client.send(
                JSON.stringify({
                  type: "NEW_MESSAGE",
                  payload: message,
                })
              );
            }
          });
        }
      }

      res.status(201).json({ message });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ errors: err.flatten() });
        return;
      }
      res.status(500).json({ message: err.message });
    }
  }

  static async getMessages(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const limit = Number.parseInt(String(req.query.limit ?? "50"), 10);

      const result = await ChatService.getMessages(
        conversationId,
        req.user!.id,
        cursor,
        limit
      );

      res.json(result);
    } catch (err: any) {
      res.status(err.message === "Access denied" ? 403 : 500).json({
        message: err.message,
      });
    }
  }

  static async markMessageRead(req: Request, res: Response) {
    try {
      const messageId = getParam(req, "id");
      await ChatService.markMessageRead(messageId, req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const count = await ChatService.getUnreadCount(req.user!.id);
      res.json({ unreadCount: count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  ///////////////////////////////////////////////////////////
  // PARTICIPANTS
  ///////////////////////////////////////////////////////////

  static async addParticipant(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const parsed = participantSchema.parse(req.body);
      const participant = await ChatService.addParticipant(
        conversationId,
        parsed.userId,
        parsed.role
      );
      res.json({ participant });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ errors: err.flatten() });
        return;
      }
      res.status(500).json({ message: err.message });
    }
  }

  static async removeParticipant(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const userId = getParam(req, "userId");
      await ChatService.removeParticipant(conversationId, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async muteConversation(req: Request, res: Response) {
    try {
      const conversationId = getParam(req, "id");
      const parsed = muteSchema.parse(req.body);
      await ChatService.muteConversation(
        conversationId,
        req.user!.id,
        parsed.muted
      );
      res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ errors: err.flatten() });
        return;
      }
      res.status(500).json({ message: err.message });
    }
  }
}