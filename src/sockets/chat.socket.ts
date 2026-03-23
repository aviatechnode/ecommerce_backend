import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prismadb.js";
import type { JoinConversationPayload, JoinPayload, MarkReadPayload, SendMessagePayload } from "../types/socket.js";
export const registerChatHandlers = (io: Server, socket: Socket) => {
  
  //////////////////////////////////////////////////////////
  // JOIN USER ROOM
  //////////////////////////////////////////////////////////
  socket.on("join", ({ userId }: JoinPayload) => {
    socket.join(userId);
  });

  //////////////////////////////////////////////////////////
  // JOIN CONVERSATION
  //////////////////////////////////////////////////////////
  socket.on(
    "join_conversation",
    ({ conversationId }: JoinConversationPayload) => {
      socket.join(conversationId);
    }
  );

  //////////////////////////////////////////////////////////
  // SEND MESSAGE
  //////////////////////////////////////////////////////////
  socket.on("send_message", async (data: SendMessagePayload) => {
    const { conversationId, senderId, content, attachments } = data;

    try {
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          attachments,
        },
      });

      // Update conversation metadata
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: content,
          lastMessageAt: new Date(),
        },
      });

      // Increment unread count for other participants
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          NOT: { userId: senderId },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      // Emit message to room
      io.to(conversationId).emit("new_message", message);

    } catch (error) {
      console.error("SEND_MESSAGE_ERROR:", error);
    }
  });

  //////////////////////////////////////////////////////////
  // MARK AS READ
  //////////////////////////////////////////////////////////
  socket.on("mark_read", async ({ conversationId, userId }: MarkReadPayload) => {
    try {
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          unreadCount: 0,
        },
      });

      socket.to(conversationId).emit("messages_read", { userId });

    } catch (error) {
      console.error("MARK_READ_ERROR:", error);
    }
  });
};