import type { PrismaInstance } from "../../lib/prismadb.js";

import type { IMessageGateway } from "../gateway-interface/message.gateway.interface.js";
import {
  isAuthenticated,
  isGuest,
  type ChatActor,
} from "../interfaces/actor.interface.js";

import type {
  DeleteMessage,
  EditMessage,
  ListMessages,
  Message,
  ReplyMessage,
  SendMessage,
} from "../schema_types/message.type.js";

export class PrismaMessageGateway
  implements IMessageGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

async create(
  actor: ChatActor,
  data: SendMessage,
): Promise<Message> {
  return this.prisma.message.create({
    data: {
      conversationId:
        data.conversationId,

      senderId:
        isAuthenticated(actor)
          ? actor.userId
          : null,

      guestSessionId:
        isGuest(actor)
          ? actor.guestSessionId
          : null,

      senderType:
        isAuthenticated(actor)
          ? "AGENT"
          : "GUEST",

      type: data.type,

      content:
        data.content ?? null,

      replyToId:
        data.replyToId ?? null,

      orderId:
        data.orderId ?? null,

      shipmentId:
        data.shipmentId ?? null,

      returnRequestId:
        data.returnRequestId ??
        null,
    },
  }) as Promise<Message>;
}

async reply(
  actor: ChatActor,
  data: ReplyMessage,
): Promise<Message> {
  return this.prisma.message.create({
    data: {
      conversationId:
        data.conversationId,

      senderId:
        isAuthenticated(actor)
          ? actor.userId
          : null,

      guestSessionId:
        isGuest(actor)
          ? actor.guestSessionId
          : null,

      senderType:
        isAuthenticated(actor)
          ? "AGENT"
          : "GUEST",

      type: data.type,

      content:
        data.content ?? null,

      replyToId:
        data.replyToId,

      orderId:
        data.orderId ?? null,

      shipmentId:
        data.shipmentId ?? null,

      returnRequestId:
        data.returnRequestId ??
        null,
    },
  }) as Promise<Message>;
}

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    actor: ChatActor,
    data: EditMessage,
  ): Promise<Message> {
    return this.prisma.message.update({
      where: {
        id: data.messageId,
      },
      data: {
        content: data.content,
        isEdited: true,
        editedAt: new Date(),
      },
    }) as Promise<Message>;
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    data: DeleteMessage,
  ): Promise<void> {
    if (data.hardDelete) {
      await this.prisma.message.delete({
        where: {
          id: data.messageId,
        },
      });

      return;
    }

    await this.prisma.message.update({
      where: {
        id: data.messageId,
      },
      data: {
        deletedAt: new Date(),
        content: null,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: {
        id,
      },
    }) as Promise<Message | null>;
  }

  async findMany(
    actor: ChatActor,
    filters: ListMessages,
  ): Promise<Message[]> {
    let cursor:
      | { id: string }
      | undefined;

    if (filters.beforeMessageId) {
      cursor = {
        id: filters.beforeMessageId,
      };
    }

    if (filters.afterMessageId) {
      cursor = {
        id: filters.afterMessageId,
      };
    }

    return this.prisma.message.findMany({
      where: {
        conversationId:
          filters.conversationId,

        ...(filters.includeDeleted
          ? {}
          : {
              deletedAt: null,
            }),
      },

      orderBy: {
        createdAt: "desc",
      },

      take: filters.limit,

      ...(cursor && {
        cursor,
        skip: 1,
      }),
    }) as Promise<Message[]>;
  }

  async count(
    actor: ChatActor,
    conversationId: string,
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
      },
    });
  }

  async findReplies(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        replyToId: messageId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    }) as Promise<Message[]>;
  }

  ////////////////////////////////////////////////////////////
  // INTERNAL
  ////////////////////////////////////////////////////////////

  async updateDeliveryStatus(
    actor: ChatActor,
    messageId: string,
    status: Message["deliveryStatus"],
  ): Promise<Message> {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        deliveryStatus: status,
        deliveredAt:
          status === "DELIVERED"
            ? new Date()
            : null,
      },
    }) as Promise<Message>;
  }

  async updateReadAt(
    actor: ChatActor,
    messageId: string,
    readAt: Date,
  ): Promise<Message> {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        readAt,
        deliveryStatus: "READ",
      },
    }) as Promise<Message>;
  }
}