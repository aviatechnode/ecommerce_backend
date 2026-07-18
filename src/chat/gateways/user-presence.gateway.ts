import type { PrismaClient } from "@prisma/client";

import { requireAuthenticated, type ChatActor, } from "../interfaces/actor.interface.js";

import type { IUserPresenceGateway } from "../gateway-interface/user-presence.gateway.interface.js";

import type {
  UpdatePresence,
  UpdateTyping,
  UserPresence,
  UserPresenceSession,
} from "../schema_types/user-presence.type.js";
export class PrismaUserPresenceGateway
  implements IUserPresenceGateway
{
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  ////////////////////////////////////////////////////////////
  // PRESENCE
  ////////////////////////////////////////////////////////////

    async upsert(
    actor: ChatActor,
    data: UpdatePresence,
    ): Promise<UserPresence> {
    requireAuthenticated(actor);

    const now = new Date()

    return this.prisma.userPresence.upsert({
        where: {
        userId: actor.userId,
        },
        create: {
        userId: actor.userId,
        status: data.status,
        lastSeenAt: now,
        lastHeartbeatAt: now,
        },
        update: {
        status: data.status,
        lastSeenAt: now,
        lastHeartbeatAt: now,
        },
    });
    }
  async findByUser(
    _actor: ChatActor,
    userId: string,
  ): Promise<UserPresence | null> {
    return this.prisma.userPresence.findUnique({
      where: {
        userId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // TYPING
  ////////////////////////////////////////////////////////////

  async updateTyping(
    _actor: ChatActor,
    socketId: string,
    data: UpdateTyping,
  ): Promise<UserPresenceSession> {
    const now = Date()
    return this.prisma.userPresenceSession.update({
      where: {
        socketId,
      },

      data: {
        isTyping: data.isTyping,
        typingConversationId: data.isTyping
          ? data.conversationId
          : null,

        lastHeartbeatAt: now,
      },
    });
  }

    async clearTyping(
    _actor: ChatActor,
    socketId: string,
    conversationId: string,
    ): Promise<UserPresenceSession> {
    const now = new Date();

    await this.prisma.userPresenceSession.updateMany({
        where: {
        socketId,
        typingConversationId: conversationId,
        },
        data: {
        isTyping: false,
        typingConversationId: null,
        lastHeartbeatAt: now,
        },
    });

    const session =
        await this.prisma.userPresenceSession.findUniqueOrThrow({
        where: {
            socketId,
        },
        });

    return session;
    }
  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
  actor: ChatActor,
): Promise<void> {
  requireAuthenticated(actor);
    const now = Date()

  await this.prisma.$transaction([
    this.prisma.userPresence.update({
      where: {
        userId: actor.userId,
      },
      data: {
        status: "OFFLINE",
        lastSeenAt: now,
        lastHeartbeatAt: now,
      },
    }),

    this.prisma.userPresenceSession.updateMany({
      where: {
        userId: actor.userId,
        disconnectedAt: null,
      },
      data: {
        disconnectedAt: now,
        isTyping: false,
        typingConversationId: null,
      },
    }),
  ]);
}
}