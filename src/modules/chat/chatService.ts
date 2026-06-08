import { prisma } from "../../lib/prismadb.js";

import {
  ConversationStatus,
  ConversationPriority,
  MessageType,
  ConversationRole,
  ConversationChannel,
} from "@prisma/client";

type CreateConversationInput = {
  customerId?: string | undefined;
  assignedAdminId?: string | undefined;
  orderId?: string | undefined;
  shipmentId?: string | undefined;
  returnRequestId?: string | undefined;
  subject?: string | undefined;
  channel?: ConversationChannel | undefined;
  priority?: ConversationPriority | undefined;
  participants?: string[] | undefined;
};

type SendMessageInput = {
  conversationId: string;
  senderId: string;
  content?: string | undefined;
  type?: MessageType | undefined;
  replyToId?: string | undefined;
  isInternal?: boolean | undefined;
  attachments?: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    extension?: string | undefined;
  }[] | undefined;
};
export class ChatService {
  ///////////////////////////////////////////////////////////
  // CONVERSATIONS
  ///////////////////////////////////////////////////////////

  static async getConversationsForUser(
    userId: string,
    userRole: string,
    filters: any = {}
  ) {
    const isAdmin = userRole !== "CUSTOMER";

    const where: any = {};

    if (!isAdmin) {
      where.participants = {
        some: {
          userId,
        },
      };
    } else {
      if (filters.assignedToMe === "true") {
        where.assignedAdminId = userId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
    }

    const conversations =
      await prisma.conversation.findMany({
        where,

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          assignedAdmin: {
            select: {
              id: true,
              name: true,
            },
          },

          participants: {
            where: {
              userId,
            },

            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },

          lastMessageRef: true,

          tags: {
            include: {
              tag: true,
            },
          },
        },

        orderBy: {
          lastMessageAt: "desc",
        },
      });

    return conversations.map((conv) => {
      const me = conv.participants.find(
        (p) => p.userId === userId
      );

      return {
        ...conv,

        unreadCount:
          me?.unreadCount ?? 0,

        isMuted:
          me?.isMuted ?? false,
      };
    });
  }

  static async getConversationById(
    conversationId: string,
    userId: string,
    userRole: string
  ) {
    const conversation =
      await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          assignedAdmin: {
            select: {
              id: true,
              name: true,
            },
          },

          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },

          tags: {
            include: {
              tag: true,
            },
          },

          slas: true,
        },
      });

    if (!conversation) {
      return null;
    }

    const isAdmin =
      userRole !== "CUSTOMER";

    const isParticipant =
      conversation.participants.some(
        (p) => p.userId === userId
      );

    if (!isAdmin && !isParticipant) {
      throw new Error(
        "Access denied"
      );
    }

    return conversation;
  }

  static async createConversation(
    data: CreateConversationInput
  ) {
    const participantUserIds =
      new Set<string>();

    if (data.customerId) {
      participantUserIds.add(
        data.customerId
      );
    }

    if (data.assignedAdminId) {
      participantUserIds.add(
        data.assignedAdminId
      );
    }

    data.participants?.forEach(
      (id) =>
        participantUserIds.add(id)
    );

    const conversation =
      await prisma.conversation.create({
        data: {
          ...(data.customerId && {
            customerId:
              data.customerId,
          }),

          ...(data.assignedAdminId && {
            assignedAdminId:
              data.assignedAdminId,
          }),

          ...(data.orderId && {
            orderId:
              data.orderId,
          }),

          ...(data.shipmentId && {
            shipmentId:
              data.shipmentId,
          }),

          ...(data.returnRequestId && {
            returnRequestId:
              data.returnRequestId,
          }),

          ...(data.subject && {
            subject:
              data.subject,
          }),

          channel:
            (data.channel as any) ??
            "WEB",

          priority:
            data.priority ??
            ConversationPriority.NORMAL,

          participants: {
            create:
              Array.from(
                participantUserIds
              ).map((uid) => ({
                userId: uid,

                roleInConversation:
                  uid ===
                  data.customerId
                    ? ConversationRole.CUSTOMER
                    : ConversationRole.SUPPORT,

                unreadCount: 0,
              })),
          },
        },

        include: {
          participants: true,
        },
      });

    return conversation;
  }

  static async updateConversation(
    conversationId: string,
    updates: any
  ) {
    return prisma.conversation.update({
      where: {
        id: conversationId,
      },

      data: updates,
    });
  }

  ///////////////////////////////////////////////////////////
  // MESSAGES
  ///////////////////////////////////////////////////////////

  static async addMessage(
    input: SendMessageInput
  ) {
    const {
      conversationId,
      senderId,
      content,
      type,
      replyToId,
      isInternal,
      attachments,
    } = input;

    const participant =
      await prisma.conversationParticipant.findUnique(
        {
          where: {
            conversationId_userId: {
              conversationId,
              userId: senderId,
            },
          },
        }
      );

    if (!participant) {
      throw new Error(
        "User not in conversation"
      );
    }

    const message =
      await prisma.message.create({
        data: {
          conversationId,

          senderId,

          ...(content !== undefined && {
            content,
          }),

          type:
            type ??
            MessageType.TEXT,

          ...(replyToId && {
            replyToId,
          }),

          isInternal:
            isInternal ??
            false,

          ...(attachments?.length && {
            attachments: {
              create:
                attachments.map(
                  (att) => ({
                    url: att.url,

                    filename:
                      att.filename,

                    mimeType:
                      att.mimeType,

                    size: att.size,

                    uploadedById:
                      senderId,

                    ...(att.extension && {
                      extension:
                        att.extension,
                    }),
                  })
                ),
            },
          }),
        },

        include: {
          attachments: true,

          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },

      data: {
        lastMessageId:
          message.id,

        lastMessage:
          content?.slice(
            0,
            255
          ) ||
          (type === "IMAGE"
            ? "📷 Image"
            : "Message"),

        lastMessageAt:
          new Date(),

        lastMessageById:
          senderId,

        status:
          ConversationStatus.OPEN,
      },
    });

    await prisma.conversationParticipant.updateMany(
      {
        where: {
          conversationId,

          userId: {
            not: senderId,
          },
        },

        data: {
          unreadCount: {
            increment: 1,
          },
        },
      }
    );

    return message;
  }

  static async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 50
  ) {
    const participant =
      await prisma.conversationParticipant.findUnique(
        {
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        }
      );

    if (!participant) {
      throw new Error(
        "Access denied"
      );
    }

    const messages =
      await prisma.message.findMany({
        where: {
          conversationId,
          deletedAt: null,
        },

        take: limit + 1,

        ...(cursor && {
          cursor: {
            id: cursor,
          },

          skip: 1,
        }),

        orderBy: {
          createdAt: "desc",
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          attachments: true,

          replyTo: {
            select: {
              id: true,

              content: true,

              sender: {
                select: {
                  name: true,
                },
              },
            },
          },

          reads: {
            where: {
              userId,
            },

            select: {
              readAt: true,
            },
          },
        },
      });

    const hasMore =
      messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    return {
      messages:
        messages.reverse(),

      hasMore,

      nextCursor:
        hasMore
          ? messages[0]?.id
          : null,
    };
  }

  static async markMessageRead(
    messageId: string,
    userId: string
  ) {
    const message =
      await prisma.message.findUnique(
        {
          where: {
            id: messageId,
          },

          include: {
            conversation: true,
          },
        }
      );

    if (!message) {
      throw new Error(
        "Message not found"
      );
    }

    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },

      update: {
        readAt: new Date(),
      },

      create: {
        messageId,
        userId,
        readAt: new Date(),
      },
    });

    const latestMessage =
      await prisma.message.findFirst({
        where: {
          conversationId:
            message.conversationId,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    await prisma.conversationParticipant.update(
      {
        where: {
          conversationId_userId:
            {
              conversationId:
                message.conversationId,

              userId,
            },
        },

        data:
          latestMessage?.id ===
          messageId
            ? {
                lastReadMessageId:
                  messageId,

                unreadCount: 0,
              }
            : {
                lastReadMessageId:
                  messageId,
              },
      }
    );

    return true;
  }

  static async getUnreadCount(
    userId: string
  ) {
    const result =
      await prisma.conversationParticipant.aggregate(
        {
          where: {
            userId,

            unreadCount: {
              gt: 0,
            },
          },

          _sum: {
            unreadCount: true,
          },
        }
      );

    return (
      result._sum.unreadCount ??
      0
    );
  }

  ///////////////////////////////////////////////////////////
  // PARTICIPANTS
  ///////////////////////////////////////////////////////////

  static async addParticipant(
    conversationId: string,
    userId: string,
    role: ConversationRole
  ) {
    return prisma.conversationParticipant.upsert(
      {
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },

        update: {
          roleInConversation:
            role,

          isMuted: false,
        },

        create: {
          conversationId,
          userId,

          roleInConversation:
            role,
        },
      }
    );
  }

  static async removeParticipant(
    conversationId: string,
    userId: string
  ) {
    return prisma.conversationParticipant.delete(
      {
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      }
    );
  }

  static async muteConversation(
    conversationId: string,
    userId: string,
    muted: boolean
  ) {
    return prisma.conversationParticipant.update(
      {
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },

        data: {
          isMuted: muted,
        },
      }
    );
  }
}