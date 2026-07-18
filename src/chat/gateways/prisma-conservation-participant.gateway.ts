import { prisma } from "../../lib/prismadb.js";
import type {
  PrismaInstance,
} from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { IConversationParticipantGateway } from "../gateway-interface/conservation-participant.gateway.interface.js";

import type {
  AddParticipant,
  ConversationParticipant,
  ListParticipants,
  MarkConversationRead,
  MuteParticipant,
  RemoveParticipant,
  UnreadCount,
} from "../schema_types/convsersation-participant.type.js";

export class PrismaConversationParticipantGateway
  implements IConversationParticipantGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  async create(
    _actor: ChatActor,
    data: AddParticipant,
  ): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.create({
      data: {
        conversationId: data.conversationId,
        userId: data.userId,
      },
    });
  }

  async delete(
    _actor: ChatActor,
    data: RemoveParticipant,
  ): Promise<void> {
    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: data.userId,
        },
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    _actor: ChatActor,
    id: string,
  ): Promise<ConversationParticipant | null> {
    return this.prisma.conversationParticipant.findUnique({
      where: {
        id,
      },
    });
  }

  async findByConversation(
  _actor: ChatActor,
  conversationId: string,
): Promise<ConversationParticipant[]> {
  return this.prisma.conversationParticipant.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
}

async list(
  _actor: ChatActor,
  data: ListParticipants,
): Promise<ConversationParticipant[]> {
  return this.prisma.conversationParticipant.findMany({
    where: {
      conversationId: data.conversationId,
    },
    orderBy: {
      joinedAt: "asc",
    },
    skip: (data.page - 1) * data.limit,
    take: data.limit,
  });
}

  async findByUser(
  actor: ChatActor,
): Promise<ConversationParticipant[]> {
  if (!("userId" in actor)) {
    return [];
  }

  return this.prisma.conversationParticipant.findMany({
    where: {
      userId: actor.userId,
    },
    orderBy: {
      joinedAt: "desc",
    },
  });
}

  async findParticipant(
  actor: ChatActor,
  conversationId: string,
): Promise<ConversationParticipant | null> {
  if (!("userId" in actor)) {
    return null;
  }

  return this.prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: actor.userId,
      },
    },
  });
}

  ////////////////////////////////////////////////////////////
  // MUTE
  ////////////////////////////////////////////////////////////

  async mute(
    _actor: ChatActor,
    data: MuteParticipant,
  ): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: data.userId,
        },
      },
      data: {
        isMuted: data.isMuted,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // UNREAD
  ////////////////////////////////////////////////////////////

  async updateUnreadCount(
    _actor: ChatActor,
    data: UnreadCount,
  ): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: data.userId,
        },
      },
      data: {
        unreadCount: data.unreadCount,
      },
    });
  }

  async incrementUnreadCount(
  _actor: ChatActor,
  conversationId: string,
  userId: string,
): Promise<ConversationParticipant> {
  return this.prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    data: {
      unreadCount: {
        increment: 1,
      },
    },
  });
}

  async incrementUnreadForOthers(
    _actor: ChatActor,
    conversationId: string,
    excludedUserId: string,
  ): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,

        userId: {
          not:
            excludedUserId,
        },
      },

      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });
  }

  async resetUnreadCount(
    _actor: ChatActor,
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        unreadCount: 0,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  async markConversationRead(
    _actor: ChatActor,
    data: MarkConversationRead,
  ): Promise<ConversationParticipant> {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: data.userId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadMessageId: data.lastReadMessageId,
      },
    });
  }
  
}