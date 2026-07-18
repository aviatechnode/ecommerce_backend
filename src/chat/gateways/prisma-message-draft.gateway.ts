import type { PrismaInstance } from "../../lib/prismadb.js";

import {
  isAuthenticated,
  requireAuthenticated,
} from "../interfaces/actor.interface.js";

import type { IMessageDraftGateway } from "../gateway-interface/message-draft.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  MessageDraft,
  SaveMessageDraft,
} from "../schema_types/message-draft.type.js";

export class PrismaMessageDraftGateway
  implements IMessageDraftGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async save(
    actor: ChatActor,
    data: SaveMessageDraft,
  ): Promise<MessageDraft> {
    requireAuthenticated(actor);

    return this.prisma.messageDraft.upsert({
      where: {
        conversationId_userId: {
          conversationId:
            data.conversationId,

          userId: actor.userId,
        },
      },

      create: {
        conversationId:
          data.conversationId,

        userId: actor.userId,

        content:
          data.content ?? null,
      },

      update: {
        content:
          data.content ?? null,
      },
    }) as Promise<MessageDraft>;
  }

  async find(
  actor: ChatActor,
  conversationId: string,
): Promise<MessageDraft | null> {
  if (!isAuthenticated(actor)) {
    return null;
  }

  return this.prisma.messageDraft.findUnique({
    where: {
      conversationId_userId: {
        conversationId,

        userId:
          actor.userId,
      },
    },
  }) as Promise<MessageDraft | null>;
}

  async delete(
  actor: ChatActor,
  conversationId: string,
): Promise<void> {
  if (!isAuthenticated(actor)) {
    return;
  }

  await this.prisma.messageDraft.deleteMany({
    where: {
      conversationId,

      userId:
        actor.userId,
    },
    });
  }
}