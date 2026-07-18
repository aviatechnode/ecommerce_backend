import type { PrismaInstance } from "../../lib/prismadb.js";

import type { IMessageReadGateway } from "../gateway-interface/message-read.gatewayinterface.js";
import {
  isGuest,
  requireAuthenticated,
} from "../interfaces/actor.interface.js";
import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  ListMessageReads,
  MarkMessageRead,
  MessageRead,
} from "../schema_types/message-read.type.js";

export class PrismaMessageReadGateway
  implements IMessageReadGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: MarkMessageRead,
  ): Promise<MessageRead> {
    requireAuthenticated(actor);

    return this.prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId: data.messageId,
          userId: actor.userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId: data.messageId,
        userId: actor.userId,
      },
    }) as Promise<MessageRead>;
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<MessageRead | null> {
    return this.prisma.messageRead.findUnique({
      where: {
        id,
      },
    }) as Promise<MessageRead | null>;
  }

  async find(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageRead | null> {
    requireAuthenticated(actor);

    return this.prisma.messageRead.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: actor.userId,
        },
      },
    }) as Promise<MessageRead | null>;
  }

  async list(
    actor: ChatActor,
    filters: ListMessageReads,
  ): Promise<MessageRead[]> {
    return this.prisma.messageRead.findMany({
      where: {
        messageId: filters.messageId,
      },
      orderBy: {
        readAt: "desc",
      },
      skip:
        (filters.page - 1) *
        filters.limit,
      take: filters.limit,
    }) as Promise<MessageRead[]>;
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    messageId: string,
  ): Promise<void> {
    requireAuthenticated(actor);

    await this.prisma.messageRead.deleteMany({
      where: {
        messageId,
        userId: actor.userId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // BULK
  ////////////////////////////////////////////////////////////

  async markConversationRead(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    requireAuthenticated(actor);

    const messages =
      await this.prisma.message.findMany({
        where: {
          conversationId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!messages.length) {
      return;
    }

    await this.prisma.messageRead.createMany({
      data: messages.map((m) => ({
        messageId: m.id,
        userId: actor.userId,
        readAt: new Date(),
      })),
      skipDuplicates: true,
    });

    await this.prisma.conversationParticipant.updateMany(
      {
        where: {
          conversationId,
          userId: actor.userId,
        },
        data: {
          unreadCount: 0,
          lastReadMessageId:
            messages[messages.length - 1]!.id,
        },
      },
    );
  }

  async markMessagesRead(
    actor: ChatActor,
    messageIds: string[],
  ): Promise<void> {
    requireAuthenticated(actor);

    if (!messageIds.length) {
      return;
    }

    await this.prisma.messageRead.createMany({
      data: messageIds.map((id) => ({
        messageId: id,
        userId: actor.userId,
        readAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  ////////////////////////////////////////////////////////////
  // COUNT
  ////////////////////////////////////////////////////////////

  async count(
    actor: ChatActor,
    messageId: string,
  ): Promise<number> {
    return this.prisma.messageRead.count({
      where: {
        messageId,
      },
    });
  }
}