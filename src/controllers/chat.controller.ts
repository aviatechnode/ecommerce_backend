import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { ConversationRole } from "@prisma/client";

//////////////////////////////////////////////////////////
// CREATE CONVERSATION
//////////////////////////////////////////////////////////
export const createConversation = async (req: Request, res: Response) => {
  const { customerId, adminId } = req.body as {
    customerId: string;
    adminId: string;
  };

  try {
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              userId: customerId,
              roleInConversation: ConversationRole.CUSTOMER,
            },
            {
              userId: adminId,
              roleInConversation: ConversationRole.ADMIN,
            },
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    return res.json(conversation);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

//////////////////////////////////////////////////////////
// GET USER CONVERSATIONS
//////////////////////////////////////////////////////////
export const getUserConversations = async (req: Request, res: Response) => {
  const { userId } = req.params as { userId: string };

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: true,
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return res.json(conversations);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

//////////////////////////////////////////////////////////
// GET MESSAGES
//////////////////////////////////////////////////////////
export const getMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params as { conversationId: string };

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return res.json(messages);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};